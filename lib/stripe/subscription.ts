// Stripe customer/subscription lifecycle helpers — Step 8. Kept separate from pricing.ts
// (pure calculation) so the actual Stripe API calls + local `subscriptions` row writes live in
// one place, reused by signup and the agency quantity-sync trigger.
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/lib/db/client";
import { accounts, subscriptions } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe/client";
import {
  ensureDefaultPlanPriceId,
  ensurePlanPriceId,
  getAgencyManagedBusinessCount,
  getDefaultPricingPlan,
  getPricingPlanByKey,
} from "@/lib/stripe/pricing";

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
      try {
        await stripe.subscriptionItems.update(item.id, { quantity });
      } catch (err) {
        // Same expected constraint as the invoice.upcoming webhook's price safety-net (see that
        // handler's comment): Stripe rejects a quantity update on a subscription still in
        // `incomplete` status (no payment method attached yet). Previously this threw straight
        // out of the function, which meant the local `billableQuantity`/`amountCents` update
        // below never ran either — an agency creating clients before ever visiting the Customer
        // Portal would have its local managed-business count silently frozen at a stale value
        // indefinitely (only `console.error`'d by the caller, no retry path, since a subscription
        // with no payment method never generates real `invoice.upcoming` events to self-correct
        // from). Now: log and continue to the local DB update regardless — the real Stripe
        // quantity syncs on the next successful attempt once a payment method exists, but the
        // app's own UI/DB reflects the true count in the meantime rather than a stale one.
        const stripeErr = err as { type?: string; message?: string };
        if (stripeErr?.type === "StripeInvalidRequestError") {
          console.log(
            `[syncAgencySubscriptionQuantity] account ${agencyAccountId}: skipped Stripe quantity push — subscription not in an updatable state yet (${stripeErr.message})`
          );
        } else {
          throw err;
        }
      }
    }
  }

  await db
    .update(subscriptions)
    .set({ billableQuantity: quantity, amountCents, updatedAt: new Date() })
    .where(eq(subscriptions.id, sub.id));
}

/**
 * Modifications 5 pricing restructure (revision.md §3.2) — creates a real Stripe Customer +
 * Subscription for one of the new tiers (premium/network), WITH a card required upfront and a
 * real trial period, per the client's explicit confirmation ("Yes, card since the beginning" —
 * Billing.pdf). This is deliberately a NEW function, not a rewrite of
 * createStripeCustomerAndSubscription() above: that function is still the live signup route's
 * only caller today (payment_behavior: "default_incomplete", no card, no trial, "default" plan
 * only) and must keep working completely unchanged until a later, dedicated step rewires signup
 * itself to actually offer tier selection (revision.md §3.4) — merging that change into this
 * one would make this step impossible to verify in isolation from the live signup flow.
 *
 * `paymentMethodId` must be a Stripe PaymentMethod id already attached to (or attachable to) the
 * customer — collected via Stripe Elements/Checkout in whatever calls this (not built by this
 * function; card collection UI is part of the later signup-rewrite step). The Free tier never
 * calls this at all — it has no Stripe subscription, see revision.md §3.2.
 */
export async function createStripeSubscriptionForPlan({
  accountId,
  billingEmail,
  name,
  planKey,
  cadence,
  paymentMethodId,
}: {
  accountId: string;
  billingEmail: string;
  name: string;
  planKey: "premium" | "network";
  cadence: "monthly" | "annual";
  paymentMethodId: string;
}): Promise<void> {
  const plan = await getPricingPlanByKey(planKey);
  const { priceId } = await ensurePlanPriceId(plan, cadence);

  const customer = await stripe.customers.create({
    email: billingEmail,
    name,
    payment_method: paymentMethodId,
    invoice_settings: { default_payment_method: paymentMethodId },
    metadata: { accountId },
  });

  // Card required upfront (client-confirmed) — no payment_behavior: "default_incomplete" here,
  // unlike createStripeCustomerAndSubscription() above. A real payment method is already
  // attached as the customer's default, so Stripe activates the subscription immediately in
  // `trialing` status (not `incomplete`) for the trial length below, then auto-charges that
  // card when the trial ends — exactly the "card since the beginning" flow the client asked for.
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId, quantity: 1 }],
    trial_period_days: plan.trialDays ?? undefined,
    metadata: { accountId, planKey, cadence },
  });

  // accounts.status: "active" immediately, NOT the old signup flow's "grace_period" — that
  // status models "no card on file yet, read-only until a first charge succeeds"
  // (app/api/billing/webhook/route.ts's invoice.payment_succeeded handler is what flips it to
  // active there). This flow has a real card attached from the start and a genuine trial — the
  // customer should get full access for the whole trial, not be locked out until day 15's first
  // real charge. Stripe's own subscription.status will correctly read "trialing" (see
  // mapStripeSubscriptionStatus's doc comment on why the local `subscriptions.status` enum has
  // no separate trialing value), and the existing invoice.payment_succeeded webhook still fires
  // normally when the trial ends and the first real charge happens — this just avoids
  // needlessly gating dashboard access during the trial itself.
  await db
    .update(accounts)
    .set({ stripeCustomerId: customer.id, planKey, status: "active", updatedAt: new Date() })
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

export { mapStripeSubscriptionStatus, readCurrentPeriodEnd };
