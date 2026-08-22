import { notFound } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { withDbRetry } from "@/lib/db/retry";
import { locations, devices, scans } from "@/lib/db/schema";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatTile } from "@/components/shared/stat-tile";

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const { id } = await params;
  const accountId = session.user.accountId;

  const { location, deviceRows, scanCountRow } = await withDbRetry(
    "LocationDetailPage",
    async () => {
      const location = await db.query.locations.findFirst({
        where: and(eq(locations.id, id), eq(locations.accountId, accountId)),
      });
      if (!location) return { location: null, deviceRows: [], scanCountRow: null };

      const deviceRows = await db.query.devices.findMany({
        where: eq(devices.locationId, id),
        with: { employee: true },
        orderBy: (d, { desc }) => [desc(d.createdAt)],
      });

      const [scanCountRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(scans)
        .where(eq(scans.locationId, id));

      return { location, deviceRows, scanCountRow };
    }
  );
  if (!location) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-h2 font-display font-semibold text-text-primary">{location.name}</h1>
        <p className="text-body-sm text-text-muted">{location.address}</p>
      </div>

      <StatTile label="Total scans at this location" value={scanCountRow?.count ?? 0} />

      <div>
        <h2 className="mb-3 text-h4 font-semibold text-text-primary">Devices here</h2>
        {deviceRows.length === 0 ? (
          <p className="text-body-sm text-text-muted">No devices assigned to this location.</p>
        ) : (
          <div className="space-y-2">
            {deviceRows.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-lg border border-border-default bg-bg-card p-3"
              >
                <span className="font-mono text-body-sm text-text-primary">{d.code}</span>
                <span className="text-body-sm text-text-muted">
                  {d.employee?.name ?? "Unassigned"}
                </span>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
