// POST /api/admin/devices/[id]/force-reassign — admin support tool: directly assign a device to
// a chosen account/location(/employee), bypassing the normal owner-claims-their-own-device flow.
// taptapstar_admin only. Logs to audit_logs, same pattern established in
// app/api/admin/agency-requests/[id]/reject/route.ts.
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { devices, locations, employees, auditLogs } from "@/lib/db/schema";
import { requireRole, authErrorResponse } from "@/lib/auth/rbac";
import { supportForceReassignSchema } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole("taptapstar_admin");
    const { id } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }
    const parsed = supportForceReassignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { locationId, employeeId } = parsed.data;

    const device = await db.query.devices.findFirst({ where: eq(devices.id, id) });
    if (!device) {
      return NextResponse.json({ message: "Device not found" }, { status: 404 });
    }

    const location = await db.query.locations.findFirst({ where: eq(locations.id, locationId) });
    if (!location) {
      return NextResponse.json({ message: "Location not found" }, { status: 404 });
    }

    if (employeeId) {
      // Cross-check enforced the same way as every other location/employee pairing in this
      // project (see 04_PROJECT_STATE.md's regression watchlist entry on employee scoping) — an
      // employee must belong to the SAME location being assigned, not just the same account.
      const employee = await db.query.employees.findFirst({ where: eq(employees.id, employeeId) });
      if (!employee || employee.locationId !== locationId) {
        return NextResponse.json(
          { message: "That employee does not belong to the selected location" },
          { status: 400 }
        );
      }
    }

    const before = {
      accountId: device.accountId,
      locationId: device.locationId,
      employeeId: device.employeeId,
      status: device.status,
    };

    const [updated] = await db
      .update(devices)
      .set({
        accountId: location.accountId,
        locationId,
        employeeId: employeeId ?? null,
        status: "active",
        activatedAt: device.activatedAt ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(devices.id, id))
      .returning();

    await db.insert(auditLogs).values({
      actorUserId: session.user.id,
      action: "admin_force_reassign_device",
      targetType: "device",
      targetId: id,
      metadataJson: { before, after: { accountId: location.accountId, locationId, employeeId: employeeId ?? null, status: "active" } },
    });

    return NextResponse.json({ device: updated });
  } catch (error) {
    const { message, status } = authErrorResponse(error);
    return NextResponse.json({ message }, { status });
  }
}
