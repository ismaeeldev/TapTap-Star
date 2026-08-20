import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts, users, emailVerificationTokens } from "@/lib/db/schema";
import { signupSchema } from "@/lib/validation";
import { notify } from "@/lib/email/notify";
import { createStripeCustomerAndSubscription } from "@/lib/stripe/subscription";

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

  // Real Stripe Customer + Subscription creation at signup (locked decision — Step 8, not
  // deferred to first device activation). Deliberately NOT allowed to fail the whole signup:
  // Stripe is a third-party dependency, and a transient network blip here must not block a
  // business owner from creating their account at all — the account can exist locally without a
  // live subscription temporarily; /dashboard/billing degrades to a "billing not set up yet"
  // state in that case rather than 500ing, and a future manual/lazy retry (e.g. re-attempting on
  // next billing-page visit) can pick it up. Logged loudly so this never goes unnoticed.
  try {
    await createStripeCustomerAndSubscription({
      accountId: account.id,
      billingEmail: email,
      name,
    });
  } catch (err) {
    console.error(
      `[signup] Stripe customer/subscription creation failed for account ${account.id} — account created locally without billing. This should be investigated / retried.`,
      err
    );
  }

  const token = randomBytes(32).toString("hex");
  await db.insert(emailVerificationTokens).values({
    userId: user.id,
    token,
    expiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
  });

  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;
  await notify(account.id, "verification", { verifyUrl, recipientEmail: email });

  return NextResponse.json({ ok: true, email }, { status: 201 });
}
