import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { locations, devices, scans } from "@/lib/db/schema";
import { requireSession, requireActiveAccount, authErrorResponse, AuthError } from "@/lib/auth/rbac";
import { locationUpdateSchema } from "@/lib/validation";
import { syncNetworkLocationQuantity } from "@/lib/stripe/subscription";

// GET /api/locations/:id — location detail (devices at this location + total scan count) for
// /dashboard/locations/[id].
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const location = await db.query.locations.findFirst({
      where: and(eq(locations.id, id), eq(locations.accountId, session.user.accountId)),
    });
    if (!location) {
      throw new AuthError("Location not found", 404);
    }

    const deviceRows = await db.query.devices.findMany({
      where: eq(devices.locationId, id),
      with: { employee: true },
      orderBy: (d, { desc }) => [desc(d.createdAt)],
    });

    const [scanCountRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(scans)
      .where(eq(scans.locationId, id));

    return NextResponse.json({
      location,
      devices: deviceRows.map((d) => ({
        id: d.id,
        code: d.code,
        type: d.type,
        status: d.status,
        employee: d.employee ? { id: d.employee.id, name: d.employee.name } : null,
      })),
      scanCount: scanCountRow?.count ?? 0,
    });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

// PATCH /api/locations/:id — edit a location's fields.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    await requireActiveAccount(session);
    const { id } = await params;

    const location = await db.query.locations.findFirst({
      where: and(eq(locations.id, id), eq(locations.accountId, session.user.accountId)),
    });
    if (!location) {
      throw new AuthError("Location not found", 404);
    }

    const body = await request.json().catch(() => null);
    const parsed = locationUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(locations)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(locations.id, id))
      .returning();

    return NextResponse.json({ location: updated });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

// DELETE /api/locations/:id — permanently removes a location. Devices at this location fall
// back to unassigned/location=null via the schema's onDelete: set null; the location's own scan
// history cascades away with it (see lib/db/schema.ts). Confirmed destructively via a dialog
// client-side before this is ever called.
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    await requireActiveAccount(session);
    const { id } = await params;

    const location = await db.query.locations.findFirst({
      where: and(eq(locations.id, id), eq(locations.accountId, session.user.accountId)),
    });
    if (!location) {
      throw new AuthError("Location not found", 404);
    }

    // Guard against orphaning an active device: devices.locationId is onDelete: set null, but
    // devices.status is NOT reset by that cascade, and scans.locationId is not-null — an
    // active-but-locationless device would throw a DB error on its next real scan. Deactivate
    // first, or reassign it, before deleting the location.
    const activeDevice = await db.query.devices.findFirst({
      where: and(eq(devices.locationId, id), eq(devices.status, "active")),
    });
    if (activeDevice) {
      return NextResponse.json(
        {
          message:
            "This location still has an active device. Deactivate or reassign it before deleting the location.",
        },
        { status: 409 }
      );
    }

    await db.delete(locations).where(eq(locations.id, id));

    // Network tier's "+$10/mo per location beyond the first" (revision.md §2.1/§2.3) — a
    // deleted location must reduce the billed quantity, same non-blocking pattern as the
    // create path in app/api/locations/route.ts.
    try {
      await syncNetworkLocationQuantity(session.user.accountId);
    } catch (err) {
      console.error(
        `[locations] Stripe location-quantity sync failed after delete for account ${session.user.accountId} — billing sync should be investigated/retried.`,
        err
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
