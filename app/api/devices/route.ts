import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { devices, scans } from "@/lib/db/schema";
import { requireSession, authErrorResponse } from "@/lib/auth/rbac";

// GET /api/devices — list every device belonging to the session's account, with its location/
// employee name and lifetime scan count, for the /dashboard/devices table.
export async function GET() {
  try {
    const session = await requireSession();

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

    const result = rows.map((d) => ({
      id: d.id,
      code: d.code,
      type: d.type,
      status: d.status,
      location: d.location ? { id: d.location.id, name: d.location.name } : null,
      employee: d.employee ? { id: d.employee.id, name: d.employee.name } : null,
      scanCount: countMap.get(d.id) ?? 0,
      activatedAt: d.activatedAt,
    }));

    return NextResponse.json({ devices: result });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
