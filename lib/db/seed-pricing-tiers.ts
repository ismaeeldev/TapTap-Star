// Modifications 5 pricing restructure (see revision.md) — adds the 3 new tiers (Free /
// Premium / Network) as NEW pricing_plans rows, alongside the existing "default" row.
// Deliberately does NOT touch or replace "default" — this database already holds real
// accounts pointing at planKey: "default" (seeded by lib/db/seed.ts, which is NOT re-run
// here), and this script must not disturb them. Migrating those existing accounts onto a
// new tier is a separate, deliberate decision for a later step (revision.md §3.4), not
// something this script does automatically.
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
  //   Network — $60/mo flat for now (revision.md's per-location +$10/location increment is
  //             deliberately deferred to a later step — see revision.md §2.3/§3.1 for why:
  //             no metered/per-unit Stripe billing precedent exists in this codebase outside
  //             the agency multiplier, and shipping the 3-tier base correctly first is safer
  //             than risking a billing bug on day one), unlimited locations, 14-day trial.
  // Annual = 20% off monthly, client-confirmed on all paid tiers.
  const tiers = [
    {
      planKey: "free",
      name: "Free",
      priceCents: 0,
      annualPriceCents: null,
      locationLimit: 1,
      trialDays: null,
    },
    {
      planKey: "premium",
      name: "Premium",
      priceCents: 2500,
      annualPriceCents: Math.round(2500 * 12 * 0.8), // 20% off monthly-equivalent annual total
      locationLimit: 1,
      trialDays: 14,
    },
    {
      planKey: "network",
      name: "Network",
      priceCents: 6000,
      annualPriceCents: Math.round(6000 * 12 * 0.8),
      locationLimit: null, // unlimited
      trialDays: 14,
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
        trialDays: tier.trialDays,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: pricingPlans.planKey,
        set: {
          name: tier.name,
          priceCents: tier.priceCents,
          annualPriceCents: tier.annualPriceCents,
          locationLimit: tier.locationLimit,
          trialDays: tier.trialDays,
          updatedAt: sql`now()`,
        },
      })
      .returning();
    console.log(
      `  pricing_plans: '${row.planKey}' — $${row.priceCents / 100}/mo` +
        (row.annualPriceCents ? ` ($${(row.annualPriceCents / 100).toFixed(2)}/yr)` : "") +
        `, location_limit=${row.locationLimit ?? "unlimited"}, trial_days=${row.trialDays ?? "none"}`
    );
  }

  console.log("Done. Existing 'default' plan row untouched — see this file's header comment.");
}

seedPricingTiers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
