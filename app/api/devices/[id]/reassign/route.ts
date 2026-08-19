import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { devices, locations, employees } from "@/lib/db/schema";
import { requireSession, authErrorResponse, AuthError } from "@/lib/auth/rbac";
import { reassignDeviceSchema } from "@/lib/validation";

// POST /api/devices/:id/reassign — change a device's location and/or employee.
//
// Integrity rule (02_APPLICATION_FLOW.md section 5): reassigning to a DIFFERENT location must
// clear employeeId — never silently leave a stale cross-location employee assignment. If the
// caller submits an employeeId anyway, it must belong to the NEW locationId or the request is
// rejected (mirrors the same cross-check activate/route.ts already enforces).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const device = await db.query.devices.findFirst({
      where: and(eq(devices.id, id), eq(devices.accountId, session.user.accountId)),
    });
    if (!device) {
      throw new AuthError("Device not found", 404);
    }

    const body = await request.json().catch(() => null);
    const parsed = reassignDeviceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const location = await db.query.locations.findFirst({
      where: eq(locations.id, parsed.data.locationId),
    });
    if (!location || location.accountId !== session.user.accountId) {
      throw new AuthError("Forbidden — location does not belong to your account", 403);
    }

    const locationChanged = device.locationId !== parsed.data.locationId;

    let employeeId: string | null = null;
    if (!locationChanged && parsed.data.employeeId) {
      // Same location — a submitted employeeId is allowed as long as it belongs to it.
      const employee = await db.query.employees.findFirst({
        where: eq(employees.id, parsed.data.employeeId),
      });
      if (!employee || employee.locationId !== parsed.data.locationId) {
        throw new AuthError("Forbidden — employee does not belong to this location", 403);
      }
      employeeId = employee.id;
    } else if (locationChanged && parsed.data.employeeId) {
      // Different location — the new employeeId must already belong to the NEW location, i.e.
      // the client is expected to have prompted for a fresh employee pick, not carried the old
      // one forward.
      const employee = await db.query.employees.findFirst({
        where: eq(employees.id, parsed.data.employeeId),
      });
      if (!employee || employee.locationId !== parsed.data.locationId) {
        throw new AuthError("Forbidden — employee does not belong to the new location", 403);
      }
      employeeId = employee.id;
    }
    // locationChanged && no employeeId submitted => employeeId stays null (cleared), per the
    // integrity rule above.

    const [updated] = await db
      .update(devices)
      .set({ locationId: parsed.data.locationId, employeeId, updatedAt: new Date() })
      .where(eq(devices.id, id))
      .returning();

    return NextResponse.json({ device: updated, locationChanged });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
