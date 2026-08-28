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
import { requireSession, authErrorResponse, AuthError } from "@/lib/auth/rbac";

// No requireActiveAccount gate here — matches deactivate/route.ts, which is deliberately
// reachable regardless of billing status ("stop this device from working" is a safety/cleanup
// action, not new product usage that a lapsed-billing account shouldn't get). An earlier version
// of this route required an active account, which meant a past-due account could deactivate a
// lost/stolen device but couldn't reset it to free the code — an inconsistent gate on two
// sibling device-lifecycle actions living in the same dialog set.
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

    // The Neon serverless HTTP driver used here has no db.transaction() support (REST-based, one
    // round-trip per query — see app/api/admin/devices/batch/route.ts's comment for the same
    // documented limitation), so the reset and the scan-history delete below cannot be made truly
    // atomic. Ordered so that if the process is interrupted between the two statements, the
    // device is left in its correct final "unassigned" state with merely some now-orphaned scan
    // rows still attached to its old id — a leftover-cleanup problem, not a customer-facing broken
    // device (the previous order — delete first, reset second — could instead leave a device
    // permanently stuck claimed to the old owner with its history already gone, the worse of the
    // two half-failure outcomes).
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

    // "acts as a new device" means zero scan history, same as a device that was never claimed.
    // scans.deviceId has onDelete: "cascade" at the DB level, but that only fires on an actual row
    // delete — this is intentionally a reset, not a delete (see file-level comment above), so the
    // scan rows need an explicit delete.
    await db.delete(scans).where(eq(scans.deviceId, id));

    return NextResponse.json({ device: updated });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
