import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { devices, scans } from "@/lib/db/schema";
import { requireSession, authErrorResponse, AuthError } from "@/lib/auth/rbac";

// GET /api/devices/:id — single device detail (reassign/deactivate screen), scoped to the
// session's account. Never leak a device belonging to another account by id.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const device = await db.query.devices.findFirst({
      where: and(eq(devices.id, id), eq(devices.accountId, session.user.accountId)),
      with: { location: true, employee: true },
    });
    if (!device) {
      throw new AuthError("Device not found", 404);
    }

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(scans)
      .where(eq(scans.deviceId, device.id));

    return NextResponse.json({
      device: {
        id: device.id,
        code: device.code,
        type: device.type,
        status: device.status,
        location: device.location ? { id: device.location.id, name: device.location.name } : null,
        employee: device.employee ? { id: device.employee.id, name: device.employee.name } : null,
        scanCount: countRow?.count ?? 0,
        activatedAt: device.activatedAt,
        createdAt: device.createdAt,
      },
    });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
