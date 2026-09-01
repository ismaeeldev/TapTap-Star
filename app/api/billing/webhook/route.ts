// Real Stripe webhook handler — Step 8. Verifies the signature via stripe.webhooks.constructEvent
// (never trust an unverified payload). Handles the events listed in
// ../../AgentGuide/05_MASTER_BUILD_GUIDE.md Step 8.2:
//   invoice.payment_failed        -> account status: grace_period
//   invoice.payment_succeeded     -> account status: active, sync a local `invoices` row
//   customer.subscription.deleted -> account status: suspended
//   invoice.upcoming              -> safety-net price re-sync (§8) + agency quantity re-verify (§6)
//
// IMPORTANT (see 04_PROJECT_STATE.md): a REAL webhook endpoint still needs to be registered in
// the Stripe Dashboard (Step 8.3, manual task) before production — this route works correctly
// against real Stripe events once that's done. STRIPE_WEBHOOK_SECRET in .env.local is currently
// a THROWAWAY local-testing value (see the generateTestHeaderString testing note), not a real one.
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/lib/db/client";
import { accounts, invoices, subscriptions } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe/client";
import { getDefaultPricingPlan } from "@/lib/stripe/pricing";
import { syncAgencySubscriptionQuantity, mapStripeSubscriptionStatus } from "@/lib/stripe/subscription";
import { notify } from "@/lib/email/notify";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function findAccountByStripeCustomerId(customerId: string) {
  return db.query.accounts.findFirst({ where: eq(accounts.stripeCustomerId, customerId) });
}

function invoiceCustomerId(invoice: Stripe.Invoice): string | null {
  const customer = invoice.customer;
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

async function upsertInvoiceRow(accountId: string, invoice: Stripe.Invoice, status: "paid" | "open" | "failed") {
  const existing = await db.query.invoices.findFirst({
    where: eq(invoices.stripeInvoiceId, invoice.id ?? ""),
  });

  const raw = invoice as unknown as { period_start?: number; period_end?: number };
  const periodStart = raw.period_start ? new Date(raw.period_start * 1000) : null;
  const periodEnd = raw.period_end ? new Date(raw.period_end * 1000) : null;

  if (existing) {
    await db
      .update(invoices)
      .set({
        status,
        amountCents: invoice.amount_paid || invoice.total || existing.amountCents,
        pdfUrl: invoice.invoice_pdf ?? existing.pdfUrl,
        periodStart: periodStart ?? existing.periodStart,
        periodEnd: periodEnd ?? existing.periodEnd,
      })
      .where(eq(invoices.id, existing.id));
    return;
  }

  await db.insert(invoices).values({
    accountId,
    stripeInvoiceId: invoice.id ?? null,
    periodStart,
    periodEnd,
    amountCents: invoice.amount_paid || invoice.total || 0,
    status,
    pdfUrl: invoice.invoice_pdf ?? null,
  });
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ message: "Webhook secret not configured" }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ message: "Missing stripe-signature header" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.error("[webhook] signature verification failed", err);
    return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoiceCustomerId(invoice);
        if (!customerId) break;
        const account = await findAccountByStripeCustomerId(customerId);
        if (!account) break;

        await db
          .update(accounts)
          .set({ status: "grace_period", updatedAt: new Date() })
          .where(eq(accounts.id, account.id));
        await upsertInvoiceRow(account.id, invoice, "failed");

        // Trigger #5 (02_APPLICATION_FLOW.md §8): billing alert / grace period started.
        await notify(account.id, "billing_alert", {
          billingUrl: `${APP_URL}/dashboard/billing`,
        });
        console.log(`[webhook] account ${account.id} moved to grace_period (payment failed)`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoiceCustomerId(invoice);
        if (!customerId) break;
        const account = await findAccountByStripeCustomerId(customerId);
        if (!account) break;

        // Capture the status BEFORE updating it — trigger #8 (payment-recovered) must fire only
        // on a genuine recovery from grace_period/suspended, never on a routine successful
        // payment for an account that was already active.
        const wasRecovering = account.status === "grace_period" || account.status === "suspended";

        await db
          .update(accounts)
          .set({ status: "active", updatedAt: new Date() })
          .where(eq(accounts.id, account.id));
        await upsertInvoiceRow(account.id, invoice, "paid");

        if (wasRecovering) {
          // Trigger #8: reactivation confirmation — only for a genuine recovery.
          await notify(account.id, "payment_recovered", {
            dashboardUrl: `${APP_URL}/dashboard`,
          });
        }
        console.log(
          `[webhook] account ${account.id} moved to active (payment succeeded)${wasRecovering ? " — recovery" : ""}`
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
        const account = await findAccountByStripeCustomerId(customerId);
        if (!account) break;

        await db
          .update(accounts)
          .set({ status: "suspended", updatedAt: new Date() })
          .where(eq(accounts.id, account.id));

        // Ordered by createdAt desc — Modifications 5's Free<->paid plan switching means an
        // account can have more than one subscriptions row (an older, already-canceled one
        // plus a newer current one); must always resolve to the current row, not whichever the
        // DB returns first. Also match by stripeSubscriptionId specifically, not just the
        // newest row for this account — this event names the exact subscription that was
        // deleted, so a stale event for an old (already-superseded) subscription must not mark
        // the account's real current subscription as canceled by mistake.
        const localSub = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.stripeSubscriptionId, subscription.id),
        });
        if (localSub) {
          await db
            .update(subscriptions)
            .set({ status: "canceled", updatedAt: new Date() })
            .where(eq(subscriptions.id, localSub.id));
        }

        // Trigger #7: suspension notice.
        await notify(account.id, "suspension_notice", {
          billingUrl: `${APP_URL}/dashboard/billing`,
        });
        console.log(`[webhook] account ${account.id} moved to suspended (subscription deleted)`);
        break;
      }

      case "invoice.upcoming": {
        // Safety-net sync (§8): move any subscription still on an old Stripe Price to the
        // current one, and (for agencies) defensively re-verify billable_quantity.
        //
        // Modifications 5 pricing restructure: this safety-net is specifically about the
        // legacy single "default" plan's price ever drifting (an admin edits its price via
        // /admin/billing-settings, and this re-syncs any subscription still on the old Price
        // id). It must NOT run for accounts now on free/premium/network — forcing their
        // subscription's price back to the "default" plan's price would actively corrupt a
        // correctly-priced Premium/Network subscription. Scoped accordingly below.
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoiceCustomerId(invoice);
        if (!customerId) break;
        const account = await findAccountByStripeCustomerId(customerId);
        if (!account) break;
        if (account.planKey !== "default") break;

        // Ordered by createdAt desc for the same reason as the customer.subscription.deleted
        // handler above — an account can have more than one subscriptions row now.
        const localSub = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.accountId, account.id),
          orderBy: [desc(subscriptions.createdAt)],
        });
        if (!localSub?.stripeSubscriptionId) break;

        const plan = await getDefaultPricingPlan();
        if (plan.stripePriceId) {
          const stripeSub = await stripe.subscriptions.retrieve(localSub.stripeSubscriptionId);
          const item = stripeSub.items.data[0];
          let priceChanged = false;
          if (item && item.price.id !== plan.stripePriceId) {
            try {
              await stripe.subscriptionItems.update(item.id, { price: plan.stripePriceId });
              priceChanged = true;
              console.log(
                `[webhook] account ${account.id}'s subscription item moved to current Price ${plan.stripePriceId} (safety-net sync)`
              );
            } catch (err) {
              // Stripe rejects a price/quantity update on a subscription still in `incomplete`
              // status (no payment method attached yet — the normal state for any account that
              // signed up but hasn't visited the Customer Portal, per this app's
              // payment_behavior: "default_incomplete" design) with a real, expected
              // StripeInvalidRequestError, not a bug on our side. Log and skip the price move —
              // it'll naturally succeed on a future invoice.upcoming once the subscription has a
              // payment method — rather than letting this bubble up and 500 the whole webhook
              // (which would also skip the agency-quantity re-verify below and cause Stripe to
              // keep retrying an update that will keep failing for the same reason every time).
              const stripeErr = err as { type?: string; message?: string };
              if (stripeErr?.type === "StripeInvalidRequestError") {
                console.log(
                  `[webhook] account ${account.id}: skipped price safety-net sync — subscription not in an updatable state yet (${stripeErr.message})`
                );
              } else {
                throw err;
              }
            }
          }
          // Re-read after a possible price change so the local row's status/amount reflect reality.
          const refreshed = priceChanged
            ? await stripe.subscriptions.retrieve(localSub.stripeSubscriptionId)
            : stripeSub;
          await db
            .update(subscriptions)
            .set({ status: mapStripeSubscriptionStatus(refreshed.status), updatedAt: new Date() })
            .where(eq(subscriptions.id, localSub.id));
        }

        if (account.type === "agency") {
          await syncAgencySubscriptionQuantity(account.id);
        }
        break;
      }

      default:
        // Unhandled event types are expected/fine — we only act on the ones listed above.
        break;
    }
  } catch (err) {
    console.error(`[webhook] handler error for event ${event.type}`, err);
    return NextResponse.json({ message: "Webhook handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
