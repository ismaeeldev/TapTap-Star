// Shared /dashboard/billing data source — mirrors lib/queries/agency.ts's pattern.
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts, invoices, subscriptions } from "@/lib/db/schema";
import { getAgencyManagedBusinessCount, getPricingPlanByKey } from "@/lib/stripe/pricing";

export type BillingOverview = {
  accountType: "business" | "agency";
  accountStatus: "active" | "grace_period" | "suspended";
  planKey: string;
  planName: string;
  planPriceCents: number;
  managedBusinessCount: number | null; // agency accounts only
  amountCents: number; // what this account is actually billed
  subscription: {
    status: string;
    currentPeriodEnd: string | null;
    stripeSubscriptionId: string | null;
  } | null;
  hasStripeCustomer: boolean;
  invoices: {
    id: string;
    stripeInvoiceId: string | null;
    amountCents: number;
    status: string;
    pdfUrl: string | null;
    createdAt: string;
  }[];
};

export async function getBillingOverview(accountId: string): Promise<BillingOverview | null> {
  const account = await db.query.accounts.findFirst({ where: eq(accounts.id, accountId) });
  if (!account) return null;

  // Modifications 5 pricing restructure (revision.md §3.4/step 5) — reads the account's OWN
  // plan (accounts.planKey), not the hardcoded "default" plan this function used to always read
  // regardless of which tier an account was actually on. That was a real, silently-wrong bug
  // discovered while building step 5: every free/premium/network account created since step 4
  // would have shown the OLD $29.90 "default" plan's price here instead of its real one.
  const plan = await getPricingPlanByKey(account.planKey);
  const managedBusinessCount =
    account.type === "agency" ? await getAgencyManagedBusinessCount(accountId) : null;

  // Modifications 5 pricing restructure: an account can accumulate more than one
  // subscriptions row over its lifetime now (a Free->paid switch creates a brand-new Stripe
  // customer+subscription — see changeSubscriptionPlan()'s doc comment — rather than reusing
  // the account's earlier, now-canceled one). Explicitly ordered by createdAt desc so this
  // always reads the CURRENT subscription, not whichever row the DB happens to return first —
  // a real bug caught while verifying step 5: without this ordering, the billing page could
  // show a stale canceled subscription's data instead of the real active one.
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.accountId, accountId),
    orderBy: [desc(subscriptions.createdAt)],
  });

  // Network's per-location increment (revision.md §2.1/§2.3) means the true billed amount for
  // a business account isn't always just plan.priceCents flat — syncNetworkLocationQuantity
  // keeps subscriptions.amountCents accurate (base + N × perExtraLocationCents) for exactly
  // this reason, so prefer that real synced total when a subscription row exists, falling back
  // to the flat plan price only for Free (no subscription at all) or a not-yet-synced state.
  const amountCents =
    account.type === "agency"
      ? (managedBusinessCount ?? 0) * plan.priceCents
      : (sub?.amountCents ?? plan.priceCents);
  const invoiceRows = await db.query.invoices.findMany({
    where: eq(invoices.accountId, accountId),
    orderBy: [desc(invoices.createdAt)],
    limit: 24,
  });

  return {
    accountType: account.type === "agency" ? "agency" : "business",
    accountStatus: account.status,
    planKey: account.planKey,
    planName: plan.name,
    planPriceCents: plan.priceCents,
    managedBusinessCount,
    amountCents,
    subscription: sub
      ? {
          status: sub.status,
          currentPeriodEnd: sub.currentPeriodEnd ? sub.currentPeriodEnd.toISOString() : null,
          stripeSubscriptionId: sub.stripeSubscriptionId,
        }
      : null,
    hasStripeCustomer: Boolean(account.stripeCustomerId),
    invoices: invoiceRows.map((inv) => ({
      id: inv.id,
      stripeInvoiceId: inv.stripeInvoiceId,
      amountCents: inv.amountCents,
      status: inv.status,
      pdfUrl: inv.pdfUrl,
      createdAt: inv.createdAt.toISOString(),
    })),
  };
}
