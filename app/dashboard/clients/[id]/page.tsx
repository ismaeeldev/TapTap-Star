import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { AuthError, requireAccountAccess } from "@/lib/auth/rbac";
import { db } from "@/lib/db/client";
import { accounts, devices, locations } from "@/lib/db/schema";
import { StatTile } from "@/components/shared/stat-tile";
import { StatusBadge } from "@/components/shared/status-badge";
import { getAnalyticsSummary } from "@/lib/queries/analytics";
import { getAccountLeaderboard, getCurrentMonthRange } from "@/lib/queries/leaderboard";

// Drill into one client's dashboard, scoped to the CLIENT's account id, never the session's own
// accountId — access verified via requireAccountAccess() (lib/auth/rbac.ts), the same shared
// helper every other Step 7 route uses, before any data is fetched. Reuses the Step 5/6 query
// modules (lib/queries/leaderboard.ts, lib/queries/analytics.ts) scoped to the client id, per
// the master prompt's explicit "no need to rebuild them" instruction.
export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const { id } = await params;

  try {
    await requireAccountAccess(session, id);
  } catch (error) {
    if (error instanceof AuthError) notFound();
    throw error;
  }

  const account = await db.query.accounts.findFirst({ where: eq(accounts.id, id) });
  if (!account) notFound();

  const range = getCurrentMonthRange();
  const [deviceRows, locationRows, analytics, leaderboard] = await Promise.all([
    db.query.devices.findMany({
      where: eq(devices.accountId, id),
      orderBy: (d, { desc }) => [desc(d.createdAt)],
    }),
    db.query.locations.findMany({ where: eq(locations.accountId, id) }),
    getAnalyticsSummary({ accountId: id, range }),
    getAccountLeaderboard(id, range),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand/30 bg-brand-subtle px-4 py-3">
        <div>
          <p className="text-caption font-semibold uppercase tracking-wide text-brand">
            Viewing client
          </p>
          <p className="text-h4 font-semibold text-text-primary">{account.name}</p>
        </div>
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-body-sm font-medium text-brand hover:bg-brand/10"
        >
          <ArrowLeft className="size-4" /> Back to all clients
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-lg border border-border-default bg-bg-card p-6 sm:grid-cols-4">
        <StatTile label="Scans this month" value={analytics.totalScans} />
        <StatTile label="Active devices" value={analytics.activeDevices} />
        <StatTile label="Locations" value={locationRows.length} />
        <StatTile label="Devices" value={deviceRows.length} />
      </div>

      <div className="space-y-3">
        <h2 className="text-h4 font-semibold text-text-primary">Devices</h2>
        {deviceRows.length === 0 ? (
          <p className="text-body-sm text-text-muted">No devices yet.</p>
        ) : (
          <div className="space-y-2">
            {deviceRows.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-md border border-border-default bg-bg-card px-4 py-3"
              >
                <span className="font-mono text-body-sm text-text-primary">{d.code}</span>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-h4 font-semibold text-text-primary">Employee rankings</h2>
        {leaderboard.every((group) => group.employees.length === 0) ? (
          <p className="text-body-sm text-text-muted">No employees yet.</p>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((group) => (
              <div key={group.location.id} className="space-y-2">
                <p className="text-body-sm font-semibold text-text-secondary">
                  {group.location.name}
                </p>
                {group.employees.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between rounded-md border border-border-default bg-bg-card px-4 py-2.5"
                  >
                    <span className="text-body-sm text-text-primary">
                      #{e.rank} {e.name}
                    </span>
                    <span className="text-body-sm text-text-muted">
                      {e.scanCount.toLocaleString()} scans
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
