// Pricing calculation + admin-configurable pricing mechanism per
// ../../AgentGuide/03_DATA_MODEL_AND_ARCHITECTURE.md sections 6 and 8. FINAL flat-fee model —
// device count plays no role in billing anymore.
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts, pricingPlans, type PricingPlan } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe/client";

/** The single `default` pricing_plans row — the original v1 single-tier plan. Still read by
 * every account created before the Modifications 5 pricing restructure (see revision.md) —
 * kept working unchanged, not migrated automatically (that's a deliberate later decision). */
export async function getDefaultPricingPlan(): Promise<PricingPlan> {
  return getPricingPlanByKey("default");
}

/** Any pricing_plans row by its plan_key — generalizes getDefaultPricingPlan() for the
 * Modifications 5 multi-tier rollout (free/premium/network), see revision.md §3.1/§3.2. */
export async function getPricingPlanByKey(planKey: string): Promise<PricingPlan> {
  const plan = await db.query.pricingPlans.findFirst({
    where: eq(pricingPlans.planKey, planKey),
  });
  if (!plan) {
    throw new Error(`Pricing plan '${planKey}' not found`);
  }
  return plan;
}

/**
 * Lazily bootstraps the `default` plan's Stripe Price if one doesn't exist yet (no admin edit
 * has happened at /admin/billing-settings since Step 2's seed inserted the plan row with a null
 * `stripe_price_id`). Creates exactly one Stripe Price under the fixed STRIPE_PRODUCT_ID and
 * saves it back onto the plan row — every later change goes through the same
 * "create a new Price, never edit one in place" mechanism from /admin/billing-settings.
 *
 * Design choice (documented per the master prompt's "use your judgment, document the choice"
 * instruction): bootstrap lazily on first use (first signup, or the first time a billing route
 * needs a Price) rather than a separate one-time seed/migration script — this way the very first
 * signup after Step 2 works with zero extra manual setup, and the mechanism is identical to
 * every subsequent price change.
 *
 * Verifies a cached `stripePriceId` still exists in Stripe before trusting it (real incident:
 * Stripe test-mode data got cleared at some point after a Price was cached here, and every
 * signup afterward failed with "No such price" — permanently, since nothing ever re-checked).
 * One extra Stripe call, only paid at signup time (this function's only caller), not on every
 * page load.
 */
export async function ensureDefaultPlanPriceId(): Promise<{ plan: PricingPlan; priceId: string }> {
  return ensurePlanPriceId(await getDefaultPricingPlan(), "monthly");
}

/**
 * Generalizes ensureDefaultPlanPriceId() for the Modifications 5 multi-tier rollout — any
 * plan row, either billing cadence (monthly reads/writes stripePriceId + priceCents, annual
 * reads/writes stripeAnnualPriceId + annualPriceCents). Same lazy-bootstrap-and-verify
 * mechanism: create the Stripe Price on first use if missing, and re-create it if a cached id
 * no longer resolves in Stripe (see this function's sibling's doc comment above for why that
 * check exists — a real incident, not speculative).
 *
 * A $0 plan (Free tier) never needs a Stripe Price at all — Free never creates a Stripe
 * subscription in the first place (see revision.md §3.2), so this throws rather than silently
 * creating a pointless $0 Stripe Price object if ever called for one by mistake.
 */
export async function ensurePlanPriceId(
  plan: PricingPlan,
  cadence: "monthly" | "annual"
): Promise<{ plan: PricingPlan; priceId: string }> {
  const amountCents = cadence === "annual" ? plan.annualPriceCents : plan.priceCents;
  if (amountCents === null || amountCents === undefined) {
    throw new Error(
      `Plan '${plan.planKey}' has no ${cadence} price set — cannot create a Stripe Price for it`
    );
  }
  if (amountCents === 0) {
    throw new Error(
      `Plan '${plan.planKey}' is $0 (${cadence}) — Free-tier plans never need a Stripe Price, they don't create a subscription at all`
    );
  }

  const cachedId = cadence === "annual" ? plan.stripeAnnualPriceId : plan.stripePriceId;
  if (cachedId) {
    try {
      await stripe.prices.retrieve(cachedId);
      return { plan, priceId: cachedId };
    } catch (err) {
      console.error(
        `[pricing] cached ${cadence} stripePriceId ${cachedId} for plan '${plan.planKey}' no longer exists in Stripe — recreating it instead of failing every use`,
        err
      );
    }
  }

  const productId = process.env.STRIPE_PRODUCT_ID;
  if (!productId) {
    throw new Error("STRIPE_PRODUCT_ID is not set — required to create a Stripe Price");
  }

  const price = await stripe.prices.create({
    product: productId,
    unit_amount: amountCents,
    currency: plan.currency,
    recurring: { interval: cadence === "annual" ? "year" : "month" },
    // Distinguishes tier + cadence in the Stripe dashboard — every existing Price for the
    // "default" plan was created with no nickname at all, so this is additive, not a
    // behavior change for that plan (ensureDefaultPlanPriceId still goes through this same
    // function now, but "default" never passes through here with a nickname before — actually
    // it will now too, harmless, just a dashboard label).
    nickname: `${plan.planKey} (${cadence})`,
  });

  const columnToUpdate = cadence === "annual" ? { stripeAnnualPriceId: price.id } : { stripePriceId: price.id };
  const [updated] = await db
    .update(pricingPlans)
    .set({ ...columnToUpdate, updatedAt: new Date() })
    .where(eq(pricingPlans.id, plan.id))
    .returning();

  return { plan: updated, priceId: price.id };
}

/** Count of businesses currently managed by an agency account (`parent_agency_id` match). */
export async function getAgencyManagedBusinessCount(agencyAccountId: string): Promise<number> {
  const managed = await db.query.accounts.findMany({
    where: eq(accounts.parentAgencyId, agencyAccountId),
  });
  return managed.length;
}

/**
 * The ONE pricing calculation function (`03_DATA_MODEL_AND_ARCHITECTURE.md` §6 pseudocode,
 * implemented exactly) — replaces the old, now-obsolete `getBillableQuantity()`/devices-count
 * design entirely. Branches on `account.type`:
 *   - business: billable_quantity = 1 always (flat fee, no usage counting at all)
 *   - agency:   billable_quantity = count(accounts where parent_agency_id = agencyAccount.id)
 * amount_cents = billable_quantity * pricing_plans['default'].price_cents in both cases.
 */
export async function getSubscriptionAmountCents(accountId: string): Promise<number> {
  const account = await db.query.accounts.findFirst({ where: eq(accounts.id, accountId) });
  if (!account) {
    throw new Error(`Account ${accountId} not found`);
  }
  const plan = await getDefaultPricingPlan();

  if (account.type === "agency") {
    const quantity = await getAgencyManagedBusinessCount(accountId);
    return quantity * plan.priceCents;
  }

  // Business accounts: billable_quantity = 1 always, flat fee, no usage counting at all.
  return plan.priceCents;
}
