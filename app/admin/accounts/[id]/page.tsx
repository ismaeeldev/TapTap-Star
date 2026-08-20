import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts, devices, subscriptions } from "@/lib/db/schema";
import { StatusBadge, type DomainStatus } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Radio, Building2 } from "lucide-react";

export default async function AdminAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const account = await db.query.accounts.findFirst({ where: eq(accounts.id, id) });
  if (!account) notFound();

  const [accountDevices, subscription, childBusinesses] = await Promise.all([
    db.query.devices.findMany({
      where: eq(devices.accountId, id),
      orderBy: (d, { desc }) => [desc(d.createdAt)],
    }),
    db.query.subscriptions.findFirst({
      where: eq(subscriptions.accountId, id),
      orderBy: (s, { desc }) => [desc(s.createdAt)],
    }),
    account.type === "agency"
      ? db.query.accounts.findMany({ where: eq(accounts.parentAgencyId, id) })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-caption text-text-muted">
          <Link href="/admin/accounts" className="hover:underline">
            Accounts
          </Link>{" "}
          / {account.name}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-h2 font-display font-semibold text-text-primary">{account.name}</h1>
          <Badge variant="neutral">{account.type}</Badge>
          <StatusBadge status={account.status as DomainStatus} />
        </div>
        <p className="text-body-sm text-text-muted">{account.billingEmail}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border-default bg-bg-card p-4">
          <p className="text-caption text-text-muted">Devices</p>
          <p className="text-h3 font-semibold text-text-primary">{accountDevices.length}</p>
        </div>
        <div className="rounded-lg border border-border-default bg-bg-card p-4">
          <p className="text-caption text-text-muted">Subscription status</p>
          <p className="text-h3 font-semibold text-text-primary">
            {subscription ? subscription.status : "none"}
          </p>
        </div>
        <div className="rounded-lg border border-border-default bg-bg-card p-4">
          <p className="text-caption text-text-muted">Monthly amount</p>
          <p className="text-h3 font-semibold text-text-primary">
            {subscription ? `$${(subscription.amountCents / 100).toFixed(2)}` : "—"}
          </p>
        </div>
      </div>

      {account.type === "agency" && (
        <section className="space-y-3">
          <h2 className="text-h4 font-semibold text-text-primary">Managed businesses</h2>
          {childBusinesses.length === 0 ? (
            <EmptyState icon={Building2} title="No managed businesses yet" />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border-default">
              <table className="w-full min-w-[420px] text-body-sm">
                <thead className="bg-bg-muted text-left text-caption font-medium text-text-muted">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {childBusinesses.map((c) => (
                    <tr key={c.id} className="border-t border-border-default">
                      <td className="p-3">
                        <Link href={`/admin/accounts/${c.id}`} className="font-medium text-brand hover:underline">
                          {c.name}
                        </Link>
                      </td>
                      <td className="p-3 text-text-muted">{c.billingEmail}</td>
                      <td className="p-3">
                        <StatusBadge status={c.status as DomainStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-h4 font-semibold text-text-primary">Devices</h2>
        {accountDevices.length === 0 ? (
          <EmptyState icon={Radio} title="No devices on this account" />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border-default">
            <table className="w-full min-w-[420px] text-body-sm">
              <thead className="bg-bg-muted text-left text-caption font-medium text-text-muted">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Source</th>
                </tr>
              </thead>
              <tbody>
                {accountDevices.map((d) => (
                  <tr key={d.id} className="border-t border-border-default">
                    <td className="p-3 font-mono text-caption">{d.code}</td>
                    <td className="p-3">{d.type}</td>
                    <td className="p-3">
                      <StatusBadge status={d.status as DomainStatus} />
                    </td>
                    <td className="p-3 text-text-muted">{d.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
