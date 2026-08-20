import { auth } from "@/lib/auth/auth";
import { getBillingOverview } from "@/lib/queries/billing";
import { StatusBadge } from "@/components/shared/status-badge";
import { BillingPortalButton } from "@/components/dashboard/billing-portal-button";
import { CreditCard } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

function dollars(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user) return null;

  const overview = await getBillingOverview(session.user.accountId);
  if (!overview) return null;

  const isAgency = overview.accountType === "agency";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 font-display font-semibold text-text-primary">Billing</h1>
        <p className="text-body-sm text-text-muted">
          {isAgency
            ? "Your flat monthly rate applied across every business you manage."
            : "Your flat monthly subscription — unlimited devices, locations, and employees."}
        </p>
      </div>

      {overview.accountStatus !== "active" && (
        <div
          className={
            overview.accountStatus === "grace_period"
              ? "rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-body-sm text-warning"
              : "rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-body-sm text-danger"
          }
        >
          {overview.accountStatus === "grace_period"
            ? "Your last payment failed. Update your payment method below to avoid your dashboard going read-only."
            : "Your subscription is suspended due to a payment issue. Update your payment method below to restore full access. Devices already in the field keep working for your customers."}
        </div>
      )}

      <div className="rounded-lg border border-border-default bg-bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-caption font-medium uppercase tracking-wide text-text-muted">
              Current plan
            </p>
            <p className="text-h3 font-display font-semibold text-text-primary">
              {dollars(overview.amountCents)}
              <span className="text-body-sm font-normal text-text-muted">/month</span>
            </p>
            {isAgency ? (
              <p className="text-body-sm text-text-muted">
                {dollars(overview.planPriceCents)}/month × {overview.managedBusinessCount ?? 0}{" "}
                managed business{overview.managedBusinessCount === 1 ? "" : "es"}
              </p>
            ) : (
              <p className="text-body-sm text-text-muted">
                Unlimited devices, locations, and employees
              </p>
            )}
          </div>
          <StatusBadge status={overview.accountStatus} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <BillingPortalButton disabled={!overview.hasStripeCustomer} />
          {overview.subscription?.currentPeriodEnd && (
            <span className="text-caption text-text-muted">
              Next billing date{" "}
              {new Date(overview.subscription.currentPeriodEnd).toLocaleDateString()}
            </span>
          )}
        </div>
        {!overview.hasStripeCustomer && (
          <p className="mt-2 text-caption text-text-muted">
            Billing isn&apos;t fully set up on this account yet — no Stripe customer on file.
            Contact support if this persists.
          </p>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-h4 font-semibold text-text-primary">Invoice history</h2>
        {overview.invoices.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No invoices yet"
            description="Your first invoice will appear here after your next billing cycle."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border-default">
            <table className="w-full min-w-[420px] text-body-sm">
              <thead className="bg-bg-surface text-text-muted">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Date</th>
                  <th className="px-4 py-2 text-left font-medium">Amount</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-right font-medium">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {overview.invoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-border-default">
                    <td className="px-4 py-2 text-text-primary">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-text-primary">{dollars(inv.amountCents)}</td>
                    <td className="px-4 py-2 capitalize text-text-primary">{inv.status}</td>
                    <td className="px-4 py-2 text-right">
                      {inv.pdfUrl ? (
                        <a
                          href={inv.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand hover:underline"
                        >
                          Download
                        </a>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
