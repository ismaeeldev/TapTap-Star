// Shared /dashboard/billing data source — mirrors lib/queries/agency.ts's pattern.
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts, invoices, subscriptions } from "@/lib/db/schema";
import { getDefaultPricingPlan, getAgencyManagedBusinessCount } from "@/lib/stripe/pricing";

export type BillingOverview = {
  accountType: "business" | "agency";
  accountStatus: "active" | "grace_period" | "suspended";
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

  const plan = await getDefaultPricingPlan();
  const managedBusinessCount =
    account.type === "agency" ? await getAgencyManagedBusinessCount(accountId) : null;
  const amountCents =
    account.type === "agency" ? (managedBusinessCount ?? 0) * plan.priceCents : plan.priceCents;

  const sub = await db.query.subscriptions.findFirst({ where: eq(subscriptions.accountId, accountId) });
  const invoiceRows = await db.query.invoices.findMany({
    where: eq(invoices.accountId, accountId),
    orderBy: [desc(invoices.createdAt)],
    limit: 24,
  });

  return {
    accountType: account.type === "agency" ? "agency" : "business",
    accountStatus: account.status,
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
