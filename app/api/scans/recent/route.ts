import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { scans, devices } from "@/lib/db/schema";
import { requireSession, authErrorResponse } from "@/lib/auth/rbac";

// GET /api/scans/recent?deviceId= — the session account's most recent scans, for the live scan
// feed (client-side polling every 5s, per the locked decision — NOT websockets/SSE). Always
// scoped to the session's own account via an inner join on devices.account_id — never returns
// another account's scans. Optional `deviceId` narrows to a single device's feed (device detail
// page).
export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("deviceId");

    const rows = await db
      .select({
        id: scans.id,
        scannedAt: scans.scannedAt,
        deviceCode: devices.code,
        locationId: scans.locationId,
        employeeId: scans.employeeId,
      })
      .from(scans)
      .innerJoin(devices, eq(scans.deviceId, devices.id))
      .where(
        deviceId
          ? and(eq(devices.accountId, session.user.accountId), eq(scans.deviceId, deviceId))
          : eq(devices.accountId, session.user.accountId)
      )
      .orderBy(desc(scans.scannedAt))
      .limit(20);

    // Resolve location/employee names in a couple of lightweight follow-up lookups rather than
    // a wider join, since scan volume here is small (dashboard live feed, not analytics).
    const locationIds = [...new Set(rows.map((r) => r.locationId))];
    const employeeIds = [...new Set(rows.map((r) => r.employeeId).filter((id): id is string => !!id))];

    const [locs, emps] = await Promise.all([
      locationIds.length
        ? db.query.locations.findMany({
            where: (l, { inArray }) => inArray(l.id, locationIds),
          })
        : Promise.resolve([]),
      employeeIds.length
        ? db.query.employees.findMany({
            where: (e, { inArray }) => inArray(e.id, employeeIds),
          })
        : Promise.resolve([]),
    ]);
    const locMap = new Map(locs.map((l) => [l.id, l.name]));
    const empMap = new Map(emps.map((e) => [e.id, e.name]));

    const result = rows.map((r) => ({
      id: r.id,
      scannedAt: r.scannedAt,
      deviceCode: r.deviceCode,
      locationName: locMap.get(r.locationId) ?? "Unknown location",
      employeeName: r.employeeId ? (empMap.get(r.employeeId) ?? null) : null,
    }));

    return NextResponse.json({ scans: result });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
