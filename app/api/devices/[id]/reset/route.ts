// Client-requested (Modifications 5 PDF): "Maybe it could be good to have the option to
// eliminate device so later people could scan again from the beginning and it acts as a new
// device." — NOT implemented as a hard row delete: app/claim/[code]/page.tsx requires a devices
// row to exist (with status "unassigned") to show the claim wizard at all; a missing row instead
// renders the "code isn't recognized" error, which would make the physical NFC tag/QR code
// permanently dead rather than "acts as a new device." The correct read of the client's own
// words ("scan again from the beginning", "acts as a new device") is: reset the existing row back
// to its never-claimed state (same fields activate/route.ts sets on a real fresh claim, just
// cleared) and delete its scan history, so it becomes claimable by anyone again, exactly like a
// brand-new device with that code.
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { devices, scans } from "@/lib/db/schema";
import { requireSession, requireActiveAccount, authErrorResponse, AuthError } from "@/lib/auth/rbac";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    await requireActiveAccount(session);
    const { id } = await params;

    const device = await db.query.devices.findFirst({
      where: and(eq(devices.id, id), eq(devices.accountId, session.user.accountId)),
    });
    if (!device) {
      throw new AuthError("Device not found", 404);
    }

    // Delete this device's scan history first — scans.deviceId has onDelete: "cascade" at the DB
    // level, but that only fires on an actual row delete, and this is intentionally a reset, not
    // a delete (see comment above). "acts as a new device" means zero scan history, same as a
    // device that was never claimed.
    await db.delete(scans).where(eq(scans.deviceId, id));

    const [updated] = await db
      .update(devices)
      .set({
        status: "unassigned",
        accountId: null,
        locationId: null,
        employeeId: null,
        activatedAt: null,
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
