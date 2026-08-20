// Stripe customer/subscription lifecycle helpers — Step 8. Kept separate from pricing.ts
// (pure calculation) so the actual Stripe API calls + local `subscriptions` row writes live in
// one place, reused by signup and the agency quantity-sync trigger.
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/lib/db/client";
import { accounts, subscriptions } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe/client";
import { ensureDefaultPlanPriceId, getAgencyManagedBusinessCount, getDefaultPricingPlan } from "@/lib/stripe/pricing";

/** Maps Stripe's richer subscription.status set onto our narrower local enum
 * (active/past_due/canceled). `trialing`/`incomplete` count as active (no trial exists in v1,
 * kept only for forward-compat); everything else Stripe can return that isn't a hard cancel is
 * treated as past_due so the local row never lands in an unrecognized state. */
function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status): "active" | "past_due" | "canceled" {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "canceled":
    case "unpaid":
      return "canceled";
    default:
      return "past_due";
  }
}

/** Stripe's API moved `current_period_end` around across versions (subscription-level vs.
 * per-item) — read defensively from whichever shape this SDK version actually returns rather
 * than assuming one. */
function readCurrentPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const subLevel = (subscription as unknown as { current_period_end?: number }).current_period_end;
  if (typeof subLevel === "number") return new Date(subLevel * 1000);

  const item = subscription.items.data[0] as
    | (Stripe.SubscriptionItem & { current_period_end?: number })
    | undefined;
  if (item && typeof item.current_period_end === "number") {
    return new Date(item.current_period_end * 1000);
  }
  return null;
}

/**
 * Creates a real Stripe Customer + Subscription (quantity 1, against the `default` plan's
 * current Stripe Price) for a brand-new business account, and writes the resulting
 * `stripe_customer_id` onto `accounts` plus a local `subscriptions` row reflecting it.
 *
 * Called from the signup route only (locked decision — Stripe customer creation happens at
 * signup, not first device activation). Business accounts created by an agency via
 * POST /api/clients deliberately do NOT get their own Stripe customer/subscription — they're
 * billed as part of the agency's own subscription quantity instead (see syncAgencySubscriptionQuantity).
 */
export async function createStripeCustomerAndSubscription({
  accountId,
  billingEmail,
  name,
}: {
  accountId: string;
  billingEmail: string;
  name: string;
}): Promise<void> {
  const { priceId } = await ensureDefaultPlanPriceId();

  const customer = await stripe.customers.create({
    email: billingEmail,
    name,
    metadata: { accountId },
  });

  // payment_behavior: "default_incomplete" — a brand-new customer has no payment method on file
  // yet (v1's payment-method collection is the Stripe Customer Portal, reached from
  // /dashboard/billing, not an Elements form at signup time), so Stripe would otherwise reject
  // subscription creation outright ("no attached payment source") instead of creating it in an
  // `incomplete` status awaiting a payment method. This lets signup succeed and the subscription
  // exist from day one, exactly as the locked decision requires, without forcing card collection
  // into the signup flow itself.
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId, quantity: 1 }],
    payment_behavior: "default_incomplete",
    metadata: { accountId },
  });

  await db
    .update(accounts)
    .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
    .where(eq(accounts.id, accountId));

  const item = subscription.items.data[0];
  await db.insert(subscriptions).values({
    accountId,
    stripeSubscriptionId: subscription.id,
    billableQuantity: 1,
    amountCents: item?.price?.unit_amount ?? 0,
    status: mapStripeSubscriptionStatus(subscription.status),
    currentPeriodEnd: readCurrentPeriodEnd(subscription),
  });
}

/**
 * The only remaining quantity-based Stripe sync in the system (§6/§8): recompute an agency's
 * managed-business count and push it to the agency's own Stripe subscription item quantity,
 * updating the local `subscriptions` row's `billableQuantity`/`amountCents` too. Called from
 * POST /api/clients (create client) and defensively again from the invoice.upcoming webhook.
 * A no-op if the target account isn't an agency, or has no Stripe subscription yet.
 */
export async function syncAgencySubscriptionQuantity(agencyAccountId: string): Promise<void> {
  const agency = await db.query.accounts.findFirst({ where: eq(accounts.id, agencyAccountId) });
  if (!agency || agency.type !== "agency") return;

  const quantity = await getAgencyManagedBusinessCount(agencyAccountId);
  const plan = await getDefaultPricingPlan();
  const amountCents = quantity * plan.priceCents;

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.accountId, agencyAccountId),
  });
  if (!sub) return; // No local subscription row to sync (shouldn't happen once Stripe is set up).

  if (sub.stripeSubscriptionId) {
    const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
    const item = stripeSub.items.data[0];
    if (item) {
      await stripe.subscriptionItems.update(item.id, { quantity });
    }
  }

  await db
    .update(subscriptions)
    .set({ billableQuantity: quantity, amountCents, updatedAt: new Date() })
    .where(eq(subscriptions.id, sub.id));
}

export { mapStripeSubscriptionStatus, readCurrentPeriodEnd };
