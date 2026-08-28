// Client-requested (Modifications 5 PDF): "Settings is not developed." — profile update: the
// logged-in user's own display name, and the account's business name.
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts, users } from "@/lib/db/schema";
import { updateProfileSchema } from "@/lib/validation";
import { requireSession, authErrorResponse } from "@/lib/auth/rbac";

export async function POST(req: Request) {
  try {
    const session = await requireSession();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }

    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await Promise.all([
      db
        .update(users)
        .set({ name: parsed.data.name, updatedAt: new Date() })
        .where(eq(users.id, session.user.id)),
      db
        .update(accounts)
        .set({ name: parsed.data.accountName, updatedAt: new Date() })
        .where(eq(accounts.id, session.user.accountId)),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
