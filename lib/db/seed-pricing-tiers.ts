// Modifications 5 pricing restructure (see revision.md) — adds the 3 new tiers (Free /
// Premium / Network) as NEW pricing_plans rows, alongside the existing "default" row.
// Deliberately does NOT touch or replace "default" — this database already holds real
// accounts pointing at planKey: "default" (seeded by lib/db/seed.ts, which is NOT re-run
// here), and this script must not disturb them. Migrating those existing accounts onto a
// new tier is a separate, deliberate decision for a later step (revision.md §3.4), not
// something this script does automatically.
//
// Modifications 9 (client PDF, items 3/5/6): "I want only 2 plans instead of 3." /
// "in the Premium option I want it to be from 25$/month, multiple location, ai answering,
// review filtering... option to know prices for 2 loc, 3 loc, 4 loc." Network is merged into
// Premium — the "network" plan_key row is retired (deactivated, not deleted, so any historical
// FK reference in subscriptions/accounts still resolves), and "premium" now carries Network's
// old mechanics (unlimited locations, +$10/mo per extra location) at the client's stated $25/mo
// base instead of Network's old $60/mo. No live accounts were ever on "premium" or "network"
// (confirmed against production before this change), so this is a clean data change with zero
// customer migration to do.
//
// Idempotent: uses onConflictDoUpdate keyed on the unique plan_key index, so running this
// more than once (e.g. after tweaking a price before the client confirms it) safely
// updates the existing rows instead of erroring or duplicating them.
//
// Run with: SEED_CONFIRM=yes npx tsx lib/db/seed-pricing-tiers.ts
import { config } from "dotenv";

config({ path: ".env.local" });

if (process.env.SEED_CONFIRM !== "yes") {
  console.error(
    "Refusing to run: this writes real pricing_plans rows against whatever DATABASE_URL is " +
      "currently loaded. Set SEED_CONFIRM=yes to proceed."
  );
  process.exit(1);
}

async function seedPricingTiers() {
  const { db } = await import("./client");
  const { pricingPlans } = await import("./schema");
  const { sql } = await import("drizzle-orm");

  console.log("Seeding pricing tiers (Free / Premium / Network)...");

  // Client-confirmed prices (revision.md §2.1, from Billing.pdf):
  //   Free    — $0/mo forever, 1 location, no trial (nothing to trial).
  //   Premium — $25/mo (~$20/mo effective on annual), 1 location, 14-day trial.
  //   Network — $60/mo base + $10/mo per location beyond the first, unlimited locations,
  //             14-day trial. The per-location increment (perExtraLocationCents) was
  //             deliberately deferred past the initial 6-step rollout — see revision.md's
  //             change log for why it's now wired in as a real, separate Stripe subscription
  //             item (mirrors the existing agency managedBusinessCount pattern) rather than
  //             Stripe's native tiered pricing.
  // Annual = 20% off monthly, client-confirmed on all paid tiers (base price only — the
  // per-location increment doesn't currently have its own annual variant; Network annual
  // customers still pay the $10/mo increment monthly-equivalent via proration, same as any
  // quantity change mid-cycle).
  const tiers = [
    {
      planKey: "free",
      name: "Free",
      priceCents: 0,
      annualPriceCents: null,
      locationLimit: 1,
      // Client-confirmed: "1 device (matches Free's 1-location cap)" — Free stays a single-
      // device/single-location tier. Premium/Network intentionally left uncapped (null) — no
      // device limit was ever requested for the paid tiers.
      deviceLimit: 1,
      trialDays: null,
      perExtraLocationCents: null,
    },
    // Modifications 9: Premium now carries what Network used to (unlimited locations,
    // +$10/mo per extra location) at the client's stated $25/mo base — see header comment.
    {
      planKey: "premium",
      name: "Premium",
      priceCents: 2500,
      annualPriceCents: Math.round(2500 * 12 * 0.8), // 20% off monthly-equivalent annual total
      locationLimit: null, // unlimited (was 1 before the Network merge)
      deviceLimit: null,
      trialDays: 14,
      perExtraLocationCents: 1000, // +$10/mo per location beyond the first
    },
  ] as const;

  for (const tier of tiers) {
    const [row] = await db
      .insert(pricingPlans)
      .values({
        planKey: tier.planKey,
        name: tier.name,
        priceCents: tier.priceCents,
        annualPriceCents: tier.annualPriceCents,
        currency: "usd",
        billingUnit: "flat",
        appliesTo: "business",
        locationLimit: tier.locationLimit,
        deviceLimit: tier.deviceLimit,
        trialDays: tier.trialDays,
        perExtraLocationCents: tier.perExtraLocationCents,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: pricingPlans.planKey,
        set: {
          name: tier.name,
          priceCents: tier.priceCents,
          annualPriceCents: tier.annualPriceCents,
          locationLimit: tier.locationLimit,
          deviceLimit: tier.deviceLimit,
          trialDays: tier.trialDays,
          perExtraLocationCents: tier.perExtraLocationCents,
          updatedAt: sql`now()`,
        },
      })
      .returning();
    console.log(
      `  pricing_plans: '${row.planKey}' — $${row.priceCents / 100}/mo` +
        (row.annualPriceCents ? ` ($${(row.annualPriceCents / 100).toFixed(2)}/yr)` : "") +
        (row.perExtraLocationCents ? ` +$${row.perExtraLocationCents / 100}/mo per extra location` : "") +
        `, location_limit=${row.locationLimit ?? "unlimited"}, device_limit=${row.deviceLimit ?? "unlimited"}, trial_days=${row.trialDays ?? "none"}`
    );
  }

  // Modifications 9: "network" is retired as a selectable plan — deactivate rather than delete,
  // so subscriptions/accounts rows that historically referenced it (none in production today,
  // but this keeps the row's FK-like string reference resolvable if that ever changes) still
  // find a real row via getPricingPlanByKey.
  await db
    .update(pricingPlans)
    .set({ isActive: false, updatedAt: sql`now()` })
    .where(sql`${pricingPlans.planKey} = 'network'`);
  console.log("  pricing_plans: 'network' marked inactive (merged into 'premium')");

  console.log("Done. Existing 'default' plan row untouched — see this file's header comment.");
}

seedPricingTiers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
