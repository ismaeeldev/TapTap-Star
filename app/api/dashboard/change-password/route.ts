// Client-requested (Modifications 5 PDF): "Settings is not developed." — an in-session password
// change (current password + new password), distinct from the existing forgot/reset-password
// email flow (app/api/auth/reset-password/route.ts) which is for a user who is locked out and
// has no session at all. Same bcrypt cost factor (12) as that route for consistency.
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { changePasswordSchema } from "@/lib/validation";
import { requireSession, authErrorResponse, AuthError } from "@/lib/auth/rbac";

export async function POST(req: Request) {
  try {
    const session = await requireSession();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }

    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, session.user.id) });
    if (!user) {
      throw new AuthError("Your session has expired — please log in again.", 401);
    }

    const currentOk = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!currentOk) {
      return NextResponse.json({ message: "Current password is incorrect" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
