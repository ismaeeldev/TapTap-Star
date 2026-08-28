import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { devices, locations } from "@/lib/db/schema";
import { StatusBadge } from "@/components/shared/status-badge";
import { LiveScanFeed } from "@/components/dashboard/live-scan-feed";
import { DeviceActions } from "./device-actions";

export default async function DeviceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const { id } = await params;

  const device = await db.query.devices.findFirst({
    where: and(eq(devices.id, id), eq(devices.accountId, session.user.accountId)),
    with: { location: true, employee: true },
  });
  if (!device) notFound();

  const accountLocations = await db.query.locations.findMany({
    where: eq(locations.accountId, session.user.accountId),
    orderBy: (l, { asc }) => [asc(l.name)],
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-mono text-h2 font-semibold text-text-primary">{device.code}</h1>
        <div className="mt-2 flex items-center gap-2">
          <StatusBadge status={device.status} />
          <span className="text-body-sm text-text-muted capitalize">{device.type}</span>
        </div>
      </div>

      <div className="rounded-lg border border-border-default bg-bg-card p-6">
        <dl className="grid grid-cols-2 gap-4 text-body-sm">
          <div>
            <dt className="text-caption uppercase text-text-muted">Location</dt>
            <dd className="text-text-primary">{device.location?.name ?? "Unassigned"}</dd>
          </div>
          <div>
            <dt className="text-caption uppercase text-text-muted">Employee</dt>
            <dd className="text-text-primary">{device.employee?.name ?? "None"}</dd>
          </div>
        </dl>
      </div>

      {/* Client-requested (Modifications 3 PDF, items 4/6): "the option to reassign the device
          to a new url and not permanent deactivation" / "how can I manage devices active and if
          I want to reassign them to another url or change something?" — DeviceActions (which
          already has a full Reassign flow) was previously hidden entirely for any non-active
          device, leaving deactivated devices with zero available actions and no way back. Now
          shown for every status; the Deactivate button inside is conditionally hidden by
          DeviceActions itself when there's nothing left to deactivate. */}
      <DeviceActions
        deviceId={device.id}
        deviceCode={device.code}
        currentStatus={device.status}
        currentLocationId={device.locationId}
        currentEmployeeId={device.employeeId}
        locations={accountLocations.map((l) => ({ id: l.id, name: l.name }))}
      />

      <div className="rounded-lg border border-border-default bg-bg-card p-6">
        <p className="mb-3 text-body-sm font-semibold text-text-primary">Live scan feed</p>
        <LiveScanFeed deviceId={device.id} className="space-y-2" />
      </div>
    </div>
  );
}
