import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { withDbRetry } from "@/lib/db/retry";
import { locations } from "@/lib/db/schema";
import { requireSession, authErrorResponse } from "@/lib/auth/rbac";
import { locationSchema } from "@/lib/validation";

// GET /api/locations — list the session account's locations (used by the claim wizard's
// location-picker step and later dashboard screens).
export async function GET() {
  try {
    const session = await requireSession();
    const rows = await withDbRetry("GET /api/locations", () =>
      db.query.locations.findMany({
        where: eq(locations.accountId, session.user.accountId),
        orderBy: (loc, { desc }) => [desc(loc.createdAt)],
      })
    );
    return NextResponse.json({ locations: rows });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

// POST /api/locations — create a location scoped to the session's accountId. Used by the claim
// wizard's inline "+ Add new location" mini-form.
export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json().catch(() => null);
    const parsed = locationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const [location] = await db
      .insert(locations)
      .values({
        accountId: session.user.accountId,
        name: parsed.data.name,
        address: parsed.data.address,
        googleReviewUrl: parsed.data.googleReviewUrl,
        language: parsed.data.language,
      })
      .returning();

    return NextResponse.json({ location }, { status: 201 });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
