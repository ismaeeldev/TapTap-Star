// Shared /dashboard/billing data source — mirrors lib/queries/agency.ts's pattern.
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts, invoices, locations, subscriptions } from "@/lib/db/schema";
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

  // Modifications 9 (client PDF, item 7): "I want prices to be updated when changed. there it
  // still says 29.90$ instead of the actual one." Previously read the CACHED
  // subscriptions.amountCents column, which is only ever written at subscription-create time or
  // by a quantity-sync trigger (a new location added/removed, an agency's managed-business count
  // changing) — never when an admin simply edits a plan's price via /admin/billing-settings. That
  // left this page showing whatever price was active when the account's subscription was first
  // created, indefinitely, even after the plan's real price changed. Now computed live from
  // plan.priceCents (Network's per-location increment likewise read live from
  // plan.perExtraLocationCents × the account's actual current location count, not a cached
  // quantity) so a price edit shows up here immediately, with no dependency on any sync job or
  // webhook having run since.
  let amountCents: number;
  if (account.type === "agency") {
    amountCents = (managedBusinessCount ?? 0) * plan.priceCents;
  } else if (account.planKey === "network" && plan.perExtraLocationCents) {
    const [{ count: locationCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(locations)
      .where(eq(locations.accountId, accountId));
    const extraLocations = Math.max(0, locationCount - 1);
    amountCents = plan.priceCents + extraLocations * plan.perExtraLocationCents;
  } else {
    amountCents = plan.priceCents;
  }
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
