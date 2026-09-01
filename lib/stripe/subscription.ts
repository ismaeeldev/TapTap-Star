// Stripe customer/subscription lifecycle helpers — Step 8. Kept separate from pricing.ts
// (pure calculation) so the actual Stripe API calls + local `subscriptions` row writes live in
// one place, reused by signup and the agency quantity-sync trigger.
import { desc, eq, sql } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/lib/db/client";
import { accounts, locations, subscriptions } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe/client";
import { AuthError } from "@/lib/auth/rbac";
import {
  ensureDefaultPlanPriceId,
  ensureExtraLocationPriceId,
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
    orderBy: [desc(subscriptions.createdAt)],
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
 * Network tier's "+$10/mo per location beyond the first" (revision.md §2.1/§2.3), completed as
 * a real follow-up after the initial 6-step pricing rollout. Called whenever a Network account's
 * location count changes (location create/reset — see app/api/locations/route.ts and
 * app/api/devices/[id]/reset/route.ts's own callers) to keep the real Stripe subscription's
 * quantity in sync, same shape as syncAgencySubscriptionQuantity above but for a SECOND
 * subscription item (the base $60 item stays quantity 1 always; this manages a distinct
 * per-location item alongside it) rather than the account's only item.
 *
 * A no-op for any account that isn't currently on the network plan, or has no Stripe
 * subscription yet (e.g. mid-signup) — safe to call unconditionally from any location
 * create/delete path without the caller needing to check the account's plan first.
 */
export async function syncNetworkLocationQuantity(accountId: string): Promise<void> {
  const account = await db.query.accounts.findFirst({ where: eq(accounts.id, accountId) });
  if (!account || account.planKey !== "network") return;

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.accountId, accountId),
    orderBy: [desc(subscriptions.createdAt)],
  });
  if (!sub?.stripeSubscriptionId) return;

  const [{ count: locationCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(locations)
    .where(eq(locations.accountId, accountId));
  // Billed quantity is locations beyond the first — the base $60 item already covers location 1.
  const extraLocationQuantity = Math.max(0, locationCount - 1);

  const plan = await getPricingPlanByKey("network");
  const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
  const baseItem = stripeSub.items.data.find((i) => i.price.id !== plan.stripeExtraLocationPriceId);
  const extraLocationItem = stripeSub.items.data.find(
    (i) => i.price.id === plan.stripeExtraLocationPriceId
  );

  try {
    const extraLocationPriceId = await ensureExtraLocationPriceId(plan);

    if (extraLocationQuantity === 0) {
      // Nothing extra to bill — remove the per-location item entirely if one exists, rather
      // than leaving a quantity-0 item sitting on the subscription (Stripe allows quantity 0,
      // but a clean "no item at all" state is simpler to reason about and matches the base
      // case of "1 location, no increment" exactly).
      if (extraLocationItem) {
        await stripe.subscriptionItems.del(extraLocationItem.id);
      }
    } else if (extraLocationItem) {
      await stripe.subscriptionItems.update(extraLocationItem.id, { quantity: extraLocationQuantity });
    } else {
      await stripe.subscriptionItems.create({
        subscription: sub.stripeSubscriptionId,
        price: extraLocationPriceId,
        quantity: extraLocationQuantity,
      });
    }
  } catch (err) {
    // Same expected constraint as syncAgencySubscriptionQuantity above — a subscription still
    // in `incomplete` status (no payment method) rejects item updates. Log and skip the Stripe
    // push; the local amountCents below still gets updated so the app's own UI reflects the
    // real intended charge even if the actual Stripe sync catches up later.
    const stripeErr = err as { type?: string; message?: string };
    if (stripeErr?.type === "StripeInvalidRequestError") {
      console.log(
        `[syncNetworkLocationQuantity] account ${accountId}: skipped Stripe item sync — subscription not in an updatable state yet (${stripeErr.message})`
      );
    } else {
      throw err;
    }
  }

  const amountCents = (baseItem?.price?.unit_amount ?? plan.priceCents) +
    extraLocationQuantity * (plan.perExtraLocationCents ?? 0);
  await db
    .update(subscriptions)
    .set({ amountCents, updatedAt: new Date() })
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

/**
 * Modifications 5 pricing restructure (revision.md §3.4/step 5) — plan switching from the
 * dashboard billing page, client-confirmed "anytime", either direction. Three real transition
 * shapes, each genuinely different at the Stripe level (not one generic "change plan" call):
 *
 *   1. Paid -> Paid (premium <-> network): a real Stripe subscription ITEM update — same
 *      customer, same subscription, just a different Price. No new card needed.
 *   2. Paid -> Free: cancels the real Stripe subscription immediately (client-confirmed:
 *      "Cancel Stripe subscription immediately, take effect now" — not cancel_at_period_end).
 *   3. Free -> Paid: requires a NEW payment method (Free never collected a card), so this is NOT
 *      a one-click switch — the caller must first collect a card (reusing
 *      components/billing/stripe-card-form.tsx) and pass paymentMethodId; this function then
 *      creates a brand-new Stripe customer + subscription, same as signup's
 *      createStripeSubscriptionForPlan (a genuinely new customer, since the account never had
 *      one).
 *
 * Returns the new accounts.planKey on success, primarily so the caller can render an accurate
 * confirmation without a second DB read.
 */
export async function changeSubscriptionPlan({
  accountId,
  newPlanKey,
  cadence,
  paymentMethodId,
}: {
  accountId: string;
  newPlanKey: "free" | "premium" | "network";
  cadence: "monthly" | "annual";
  paymentMethodId?: string;
}): Promise<{ planKey: string }> {
  const account = await db.query.accounts.findFirst({ where: eq(accounts.id, accountId) });
  if (!account) throw new Error(`Account ${accountId} not found`);

  // Guard against downgrading into a location cap the account already exceeds — e.g. a Network
  // account with 3 locations switching to Premium/Free (locationLimit: 1) would otherwise keep
  // all 3 locations on a plan meant to cap at 1, silently bypassing the exact enforcement
  // app/api/locations/route.ts's POST handler applies to NEW locations. Checked once here,
  // before any transition branch, rather than per-branch, since every transition that changes
  // planKey needs this same check regardless of which Stripe-level shape it takes.
  const newPlan = await getPricingPlanByKey(newPlanKey);
  if (newPlan.locationLimit !== null) {
    const [{ count: currentLocationCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(locations)
      .where(eq(locations.accountId, accountId));
    if (currentLocationCount > newPlan.locationLimit) {
      // AuthError, not a plain Error — app/api/billing/change-plan/route.ts's catch block
      // (authErrorResponse) only surfaces a plain Error's real message for AuthError instances;
      // any other thrown Error is deliberately flattened to a generic "Something went wrong"
      // 500, which would have silently hidden this specific, actionable message from the user.
      throw new AuthError(
        `You have ${currentLocationCount} locations, but ${newPlan.name} only allows ${newPlan.locationLimit}. Delete locations down to the limit before switching.`,
        400
      );
    }
  }

  // Ordered by createdAt desc — an account can now have more than one subscriptions row over
  // its lifetime (a Free->paid switch below creates a brand-new one rather than reusing an
  // earlier, now-canceled row), so this must always resolve to the CURRENT one, not whichever
  // row the DB happens to return first (a real bug caught while verifying this function).
  const currentSub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.accountId, accountId),
    orderBy: [desc(subscriptions.createdAt)],
  });

  // --- Transition 1: Paid -> Paid (subscription item price swap) ---
  if (
    (newPlanKey === "premium" || newPlanKey === "network") &&
    currentSub?.stripeSubscriptionId &&
    (account.planKey === "premium" || account.planKey === "network")
  ) {
    const plan = await getPricingPlanByKey(newPlanKey);
    const { priceId } = await ensurePlanPriceId(plan, cadence);

    const stripeSub = await stripe.subscriptions.retrieve(currentSub.stripeSubscriptionId);
    // Must target the BASE item specifically, not items.data[0] — if the account is currently
    // on network, its subscription may already carry a second item (the per-location increment,
    // see syncNetworkLocationQuantity), and array order isn't guaranteed. Identify the base item
    // as "whichever item isn't the current plan's own extra-location price" (works whether
    // switching away from network, where that item still exists momentarily, or between
    // premium/free-of-that-concept plans, where it never existed at all).
    const oldPlan = await getPricingPlanByKey(account.planKey);
    const item = stripeSub.items.data.find((i) => i.price.id !== oldPlan.stripeExtraLocationPriceId);
    if (!item) throw new Error(`Subscription ${currentSub.stripeSubscriptionId} has no base line item to swap`);

    const updated = await stripe.subscriptions.update(currentSub.stripeSubscriptionId, {
      items: [{ id: item.id, price: priceId }],
      // Prorate the difference on the next invoice rather than charging/crediting immediately —
      // Stripe's default and the standard "switch plans anytime" UX (no surprise immediate
      // charge just for switching).
      proration_behavior: "create_prorations",
    });

    await db
      .update(accounts)
      .set({ planKey: newPlanKey, updatedAt: new Date() })
      .where(eq(accounts.id, accountId));
    await db
      .update(subscriptions)
      .set({
        amountCents: updated.items.data.find((i) => i.id === item.id)?.price?.unit_amount ?? 0,
        status: mapStripeSubscriptionStatus(updated.status),
        currentPeriodEnd: readCurrentPeriodEnd(updated),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, currentSub.id));

    // Whichever direction this switch goes (into or out of network), the per-location item
    // needs to reflect the new plan's reality — into network: add/update it for the account's
    // real current location count; out of network: syncNetworkLocationQuantity itself no-ops
    // for a non-network account, so any leftover item from before this switch needs its own
    // cleanup here specifically (the function guards on account.planKey === "network", which is
    // already updated above by the time this runs, so a premium/free account's stale
    // extra-location item — if any — must be removed directly, not left to a function that will
    // correctly refuse to touch it).
    if (newPlanKey === "network") {
      try {
        await syncNetworkLocationQuantity(accountId);
      } catch (err) {
        console.error(
          `[changeSubscriptionPlan] failed to sync network location quantity for account ${accountId} after switching to network`,
          err
        );
      }
    } else {
      const staleExtraItem = updated.items.data.find(
        (i) => i.price.id === oldPlan.stripeExtraLocationPriceId
      );
      if (staleExtraItem) {
        try {
          await stripe.subscriptionItems.del(staleExtraItem.id);
        } catch (err) {
          console.error(
            `[changeSubscriptionPlan] failed to remove stale per-location item for account ${accountId} after switching off network`,
            err
          );
        }
      }
    }

    return { planKey: newPlanKey };
  }

  // --- Transition 2: Paid -> Free (immediate cancellation) ---
  if (newPlanKey === "free") {
    if (currentSub?.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(currentSub.stripeSubscriptionId);
      await db
        .update(subscriptions)
        .set({ status: "canceled", updatedAt: new Date() })
        .where(eq(subscriptions.id, currentSub.id));
    }
    await db
      .update(accounts)
      .set({ planKey: "free", status: "active", updatedAt: new Date() })
      .where(eq(accounts.id, accountId));
    return { planKey: "free" };
  }

  // --- Transition 3: Free -> Paid (new customer + subscription, needs a fresh card) ---
  if (newPlanKey === "premium" || newPlanKey === "network") {
    if (!paymentMethodId) {
      throw new Error("A payment method is required to switch from Free to a paid plan");
    }
    await createStripeSubscriptionForPlan({
      accountId,
      billingEmail: account.billingEmail,
      name: account.name,
      planKey: newPlanKey,
      cadence,
      paymentMethodId,
    });
    if (newPlanKey === "network") {
      try {
        await syncNetworkLocationQuantity(accountId);
      } catch (err) {
        console.error(
          `[changeSubscriptionPlan] failed to sync network location quantity for account ${accountId} after Free -> Network`,
          err
        );
      }
    }
    return { planKey: newPlanKey };
  }

  throw new Error(`Unhandled plan transition: ${account.planKey} -> ${newPlanKey}`);
}

export { mapStripeSubscriptionStatus, readCurrentPeriodEnd };
