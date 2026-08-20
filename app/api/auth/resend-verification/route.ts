import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, emailVerificationTokens } from "@/lib/db/schema";
import { forgotPasswordSchema as emailOnlySchema } from "@/lib/validation";
import { notify } from "@/lib/email/notify";

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const parsed = emailOnlySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }
  const { email } = parsed.data;

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });

  // Same "never reveal whether it exists" posture as forgot-password.
  if (user && !user.emailVerifiedAt) {
    const token = randomBytes(32).toString("hex");
    await db.insert(emailVerificationTokens).values({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
    });
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;
    await notify(user.accountId, "verification", { verifyUrl, recipientEmail: email });
  }

  return NextResponse.json({ ok: true });
}
