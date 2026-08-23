import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { employees, locations } from "@/lib/db/schema";
import { requireSession, authErrorResponse, AuthError } from "@/lib/auth/rbac";
import { employeeUpdateSchema } from "@/lib/validation";

// Employees don't carry their own accountId (they're scoped to a locationId, per the
// architecture doc's data-integrity rule — same reasoning as api/employees/route.ts's GET/POST),
// so ownership is verified by joining through the employee's location, exactly like that route
// already does for create.
async function findOwnedEmployee(id: string, accountId: string) {
  const employee = await db.query.employees.findFirst({ where: eq(employees.id, id) });
  if (!employee) return null;
  const location = await db.query.locations.findFirst({
    where: and(eq(locations.id, employee.locationId), eq(locations.accountId, accountId)),
  });
  if (!location) return null;
  return employee;
}

// PATCH /api/employees/:id — edit an employee's name. Was a `{ todo }` stub with no auth at all;
// implemented per the Locations edit/delete pattern (app/api/locations/[id]/route.ts).
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const employee = await findOwnedEmployee(id, session.user.accountId);
    if (!employee) {
      throw new AuthError("Employee not found", 404);
    }

    const body = await request.json().catch(() => null);
    const parsed = employeeUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(employees)
      .set({ name: parsed.data.name })
      .where(eq(employees.id, id))
      .returning();

    return NextResponse.json({ employee: updated });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

// DELETE /api/employees/:id — permanently removes an employee. Their devices/scans keep working
// (devices.employeeId and scans.employeeId are both onDelete: set null per lib/db/schema.ts) —
// this only drops the employee record and disables their /e/[token] personal link, it never
// touches device status or scan history. No extra guard needed (unlike deleting a location,
// which blocks on an active device) since nothing here can be left in a broken state.
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const employee = await findOwnedEmployee(id, session.user.accountId);
    if (!employee) {
      throw new AuthError("Employee not found", 404);
    }

    await db.delete(employees).where(eq(employees.id, id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
