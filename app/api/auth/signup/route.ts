import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts, users, emailVerificationTokens } from "@/lib/db/schema";
import { signupSchema } from "@/lib/validation";
import { sendVerificationEmail } from "@/lib/email/client";

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { name, email, password } = parsed.data;

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    // Deliberately specific here (unlike forgot-password) — signup email-exists is a normal,
    // expected UX case (the theme spec calls out "email already registered" explicitly as a
    // server/auth-logic failure that must surface, not be hidden).
    return NextResponse.json({ message: "An account with this email already exists" }, {
      status: 409,
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Every new account is created type: 'business' unconditionally — no Business/Agency
  // selector at signup, per 00_SCOPE_DOCUMENT.md §5.9 (agency status is requested later from
  // /dashboard/settings, Step 7).
  const [account] = await db
    .insert(accounts)
    .values({
      type: "business",
      name,
      billingEmail: email,
    })
    .returning();

  const [user] = await db
    .insert(users)
    .values({
      accountId: account.id,
      email,
      passwordHash,
      role: "owner",
      name,
    })
    .returning();

  const token = randomBytes(32).toString("hex");
  await db.insert(emailVerificationTokens).values({
    userId: user.id,
    token,
    expiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
  });

  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;
  await sendVerificationEmail(email, verifyUrl);

  return NextResponse.json({ ok: true, email }, { status: 201 });
}
