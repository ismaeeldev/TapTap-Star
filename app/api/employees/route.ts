import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db/client";
import { employees, locations } from "@/lib/db/schema";
import { requireSession, authErrorResponse, AuthError } from "@/lib/auth/rbac";
import { employeeSchema } from "@/lib/validation";

// GET /api/employees?locationId=... — list employees for a location, verified to belong to the
// session's account. Employees are scoped to a location, never account-wide (architecture doc
// section 2's data-integrity rule) — this route enforces that on the read side too.
export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");
    if (!locationId) {
      return NextResponse.json({ message: "locationId is required" }, { status: 400 });
    }

    const location = await db.query.locations.findFirst({
      where: eq(locations.id, locationId),
    });
    if (!location || location.accountId !== session.user.accountId) {
      throw new AuthError("Forbidden — location does not belong to your account", 403);
    }

    const rows = await db.query.employees.findMany({
      where: eq(employees.locationId, locationId),
      orderBy: (emp, { desc }) => [desc(emp.createdAt)],
    });
    return NextResponse.json({ employees: rows });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

// POST /api/employees — create an employee scoped to a locationId that must belong to the
// session's account (verified server-side, never trust the client). Used by the claim wizard's
// inline "add new employee" mini-form.
export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json().catch(() => null);
    const parsed = employeeSchema.safeParse(body);
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

    const [employee] = await db
      .insert(employees)
      .values({
        locationId: parsed.data.locationId,
        name: parsed.data.name,
        accessToken: nanoid(24),
      })
      .returning();

    return NextResponse.json({ employee }, { status: 201 });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
