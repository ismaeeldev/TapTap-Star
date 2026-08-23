import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { targets, locations } from "@/lib/db/schema";
import { requireSession, requireActiveAccount, authErrorResponse, AuthError } from "@/lib/auth/rbac";
import { targetSchema } from "@/lib/validation";

// GET /api/targets — every active target for the session account's locations (team target
// panel on /dashboard/employees). Scoped via a SQL join on locations.account_id rather than
// loading every target row and filtering in JS.
export async function GET() {
  try {
    const session = await requireSession();

    const rows = await db
      .select({
        id: targets.id,
        locationId: targets.locationId,
        periodType: targets.periodType,
        targetScans: targets.targetScans,
        createdByUserId: targets.createdByUserId,
        createdAt: targets.createdAt,
        updatedAt: targets.updatedAt,
      })
      .from(targets)
      .innerJoin(locations, eq(targets.locationId, locations.id))
      .where(eq(locations.accountId, session.user.accountId))
      .orderBy(desc(targets.updatedAt));

    return NextResponse.json({ targets: rows });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

// POST /api/targets — set/replace the active target for a (location, period_type) pair. The
// architecture doc's design keeps no history (03_DATA_MODEL_AND_ARCHITECTURE.md section 2/9):
// any existing row for the same location + period_type is deleted first, then the new one is
// inserted, so there is always at most one active row per (location, period_type).
export async function POST(request: Request) {
  try {
    const session = await requireSession();
    await requireActiveAccount(session);
    const body = await request.json().catch(() => null);
    const parsed = targetSchema.safeParse(body);
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

    await db
      .delete(targets)
      .where(
        and(
          eq(targets.locationId, parsed.data.locationId),
          eq(targets.periodType, parsed.data.periodType)
        )
      );

    const [target] = await db
      .insert(targets)
      .values({
        locationId: parsed.data.locationId,
        periodType: parsed.data.periodType,
        targetScans: parsed.data.targetScans,
        createdByUserId: session.user.id,
      })
      .returning();

    return NextResponse.json({ target }, { status: 201 });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
