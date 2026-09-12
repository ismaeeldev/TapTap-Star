import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { scans, devices } from "@/lib/db/schema";
import { requireSession, authErrorResponse } from "@/lib/auth/rbac";

const PAGE_SIZE = 10;

// GET /api/scans/recent?deviceId=&page= — the session account's scans, for the live scan feed
// (client-side polling every 5s on page 1 only, per the locked decision — NOT websockets/SSE).
// Always scoped to the session's own account via an inner join on devices.account_id — never
// returns another account's scans. Optional `deviceId` narrows to a single device's feed (device
// detail page).
//
// Modifications 8 (client PDF, item 4): "I don't want this list to be infinite, I want it to
// have a maximum of 10 scans registered on each page... option to continue seeing on the next
// page." Previously hardcoded .limit(20) with no pagination at all — real page-based pagination
// now, PAGE_SIZE=10 exactly matching the client's number, plus a total count so the UI knows
// whether a "next page" genuinely exists rather than always showing the button.
export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("deviceId");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);

    const whereClause = deviceId
      ? and(eq(devices.accountId, session.user.accountId), eq(scans.deviceId, deviceId))
      : eq(devices.accountId, session.user.accountId);

    const [{ count: totalCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(scans)
      .innerJoin(devices, eq(scans.deviceId, devices.id))
      .where(whereClause);

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
      .where(whereClause)
      .orderBy(desc(scans.scannedAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE);

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

    return NextResponse.json({
      scans: result,
      page,
      pageSize: PAGE_SIZE,
      totalCount,
      hasNextPage: page * PAGE_SIZE < totalCount,
    });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
