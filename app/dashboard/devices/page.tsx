import { Radio } from "lucide-react";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { devices, scans } from "@/lib/db/schema";
import { EmptyState } from "@/components/shared/empty-state";
import { DevicesTable } from "./devices-table";

export default async function DevicesPage() {
  const session = await auth();
  if (!session?.user) return null;

  const rows = await db.query.devices.findMany({
    where: eq(devices.accountId, session.user.accountId),
    orderBy: (d, { desc }) => [desc(d.createdAt)],
    with: { location: true, employee: true },
  });

  const counts = await db
    .select({ deviceId: scans.deviceId, count: sql<number>`count(*)::int` })
    .from(scans)
    .innerJoin(devices, eq(scans.deviceId, devices.id))
    .where(eq(devices.accountId, session.user.accountId))
    .groupBy(scans.deviceId);
  const countMap = new Map(counts.map((c) => [c.deviceId, c.count]));

  const deviceRows = rows.map((d) => ({
    id: d.id,
    code: d.code,
    type: d.type,
    status: d.status,
    location: d.location ? { id: d.location.id, name: d.location.name } : null,
    employee: d.employee ? { id: d.employee.id, name: d.employee.name } : null,
    scanCount: countMap.get(d.id) ?? 0,
  }));

  if (deviceRows.length === 0) {
    return (
      <EmptyState
        icon={Radio}
        title="No devices yet"
        description="Activate a device by scanning its QR/NFC code, or ask your Taptapstar rep for a device."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 font-display font-semibold text-text-primary">Devices</h1>
        <p className="text-body-sm text-text-muted">
          Every NFC/QR device on your account, its status, location, and lifetime scan count.
        </p>
      </div>
      <DevicesTable devices={deviceRows} />
    </div>
  );
}
