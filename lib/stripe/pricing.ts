// Pricing calculation + admin-configurable pricing mechanism per
// ../../AgentGuide/03_DATA_MODEL_AND_ARCHITECTURE.md sections 6 and 8. FINAL flat-fee model —
// device count plays no role in billing anymore.
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts, pricingPlans, type PricingPlan } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe/client";

/** The single `default` pricing_plans row — v1 only ever has this one row (§8). */
export async function getDefaultPricingPlan(): Promise<PricingPlan> {
  const plan = await db.query.pricingPlans.findFirst({
    where: eq(pricingPlans.planKey, "default"),
  });
  if (!plan) {
    throw new Error("Default pricing plan not found — the Step 2 seed should have created it");
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
  const plan = await getDefaultPricingPlan();
  if (plan.stripePriceId) {
    try {
      await stripe.prices.retrieve(plan.stripePriceId);
      return { plan, priceId: plan.stripePriceId };
    } catch (err) {
      console.error(
        `[pricing] cached stripePriceId ${plan.stripePriceId} no longer exists in Stripe — recreating it instead of failing every signup`,
        err
      );
    }
  }

  const productId = process.env.STRIPE_PRODUCT_ID;
  if (!productId) {
    throw new Error("STRIPE_PRODUCT_ID is not set — required to create the initial Stripe Price");
  }

  const price = await stripe.prices.create({
    product: productId,
    unit_amount: plan.priceCents,
    currency: plan.currency,
    recurring: { interval: "month" },
  });

  const [updated] = await db
    .update(pricingPlans)
    .set({ stripePriceId: price.id, updatedAt: new Date() })
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
