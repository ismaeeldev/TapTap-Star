import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { devices } from "@/lib/db/schema";
import { requireSession, authErrorResponse, AuthError } from "@/lib/auth/rbac";

// POST /api/devices/:id/deactivate — flips an active device to deactivated. Scoped to the
// session's account; confirm dialog + destructive button live client-side on the device detail
// page, this route just enforces the state change server-side.
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
    if (device.status === "deactivated") {
      return NextResponse.json({ message: "Device is already deactivated" }, { status: 400 });
    }

    const [updated] = await db
      .update(devices)
      .set({ status: "deactivated", updatedAt: new Date() })
      .where(eq(devices.id, id))
      .returning();

    return NextResponse.json({ device: updated });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
