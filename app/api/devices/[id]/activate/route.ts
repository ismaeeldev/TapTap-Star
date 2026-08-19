import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { devices, locations, employees } from "@/lib/db/schema";
import { requireSession, authErrorResponse, AuthError } from "@/lib/auth/rbac";
import { activateDeviceSchema } from "@/lib/validation";

// POST /api/devices/:id/activate — flips a device from `unassigned` to `active`, backing the
// claim wizard's final "Activate Device" step. Verifies the device is currently `unassigned`
// and the target location (and optional employee) belong to the session's account before
// mutating anything — never trust the client's locationId/employeeId.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const body = await request.json().catch(() => null);
    const parsed = activateDeviceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const device = await db.query.devices.findFirst({ where: eq(devices.id, id) });
    if (!device) {
      return NextResponse.json({ message: "Device not found" }, { status: 404 });
    }
    if (device.status !== "unassigned") {
      return NextResponse.json(
        { message: "This device has already been activated." },
        { status: 409 }
      );
    }

    const location = await db.query.locations.findFirst({
      where: eq(locations.id, parsed.data.locationId),
    });
    if (!location || location.accountId !== session.user.accountId) {
      throw new AuthError("Forbidden — location does not belong to your account", 403);
    }

    if (parsed.data.employeeId) {
      const employee = await db.query.employees.findFirst({
        where: eq(employees.id, parsed.data.employeeId),
      });
      // Employees are scoped to the location chosen in this same step — never account-wide
      // (architecture doc section 2's data-integrity rule).
      if (!employee || employee.locationId !== parsed.data.locationId) {
        throw new AuthError("Forbidden — employee does not belong to the chosen location", 403);
      }
    }

    const [updated] = await db
      .update(devices)
      .set({
        status: "active",
        accountId: session.user.accountId,
        locationId: parsed.data.locationId,
        employeeId: parsed.data.employeeId ?? null,
        activatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(devices.id, id))
      .returning();

    return NextResponse.json({ device: updated });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
