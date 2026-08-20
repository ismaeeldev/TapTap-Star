// POST /api/admin/devices/[id]/force-unlock — admin support tool: resets a device back to
// unassigned (clears account/location/employee/activatedAt) so it can be re-claimed from
// scratch. taptapstar_admin only. Logs to audit_logs, same pattern as force-reassign.
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { devices, auditLogs } from "@/lib/db/schema";
import { requireRole, authErrorResponse } from "@/lib/auth/rbac";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole("taptapstar_admin");
    const { id } = await params;

    const device = await db.query.devices.findFirst({ where: eq(devices.id, id) });
    if (!device) {
      return NextResponse.json({ message: "Device not found" }, { status: 404 });
    }
    if (device.status === "unassigned" && !device.accountId) {
      return NextResponse.json({ message: "Device is already unassigned" }, { status: 400 });
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
        accountId: null,
        locationId: null,
        employeeId: null,
        status: "unassigned",
        activatedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(devices.id, id))
      .returning();

    await db.insert(auditLogs).values({
      actorUserId: session.user.id,
      action: "admin_force_unlock_device",
      targetType: "device",
      targetId: id,
      metadataJson: { before },
    });

    return NextResponse.json({ device: updated });
  } catch (error) {
    const { message, status } = authErrorResponse(error);
    return NextResponse.json({ message }, { status });
  }
}
