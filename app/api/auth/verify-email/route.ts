import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { encode } from "next-auth/jwt";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { emailVerificationTokens, users, accounts } from "@/lib/db/schema";
import { notify } from "@/lib/email/notify";

// Auth.js v5's default JWT session cookie name — "authjs.session-token" unprefixed on
// http:// (local dev), "__Secure-authjs.session-token" when served over https. Must match
// exactly what NextAuth(authConfig) reads, since we're hand-issuing this cookie rather than
// going through signIn() (there's no password to re-authenticate with at this point — the
// verification token IS the credential).
const isSecure = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://");
const COOKIE_NAME = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const token = searchParams.get("token");
  // Internal same-app redirect targets must be derived from the live request's own origin, not
  // NEXT_PUBLIC_APP_URL — see the regression-watchlist entry from Step 4's /r/[code] fix. The
  // env var is reserved for genuinely external contexts (the welcome email's dashboardUrl below).
  const appUrl = origin;
  const emailAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin;

  if (!token) {
    return NextResponse.redirect(new URL("/verify-email?error=missing_token", appUrl));
  }

  const record = await db.query.emailVerificationTokens.findFirst({
    where: eq(emailVerificationTokens.token, token),
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/verify-email?error=invalid_token", appUrl));
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, record.userId) });
  if (!user) {
    return NextResponse.redirect(new URL("/verify-email?error=invalid_token", appUrl));
  }

  const account = await db.query.accounts.findFirst({ where: eq(accounts.id, user.accountId) });
  if (!account) {
    return NextResponse.redirect(new URL("/verify-email?error=invalid_token", appUrl));
  }

  await db
    .update(users)
    .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, user.id));

  await db
    .update(emailVerificationTokens)
    .set({ usedAt: new Date() })
    .where(eq(emailVerificationTokens.id, record.id));

  // Trigger #2 (02_APPLICATION_FLOW.md §8): welcome email fires on email verification. Fire-
  // and-forget-safe — notify() never throws, so this can't break the login/redirect flow below.
  await notify(account.id, "welcome", {
    name: user.name,
    dashboardUrl: `${emailAppUrl}/dashboard`,
    recipientEmail: user.email,
  });

  // Log the user in via Auth.js: hand-issue a valid session JWT and set it as the session
  // cookie, matching the shape the `jwt`/`session` callbacks in lib/auth/auth.config.ts expect.
  const sessionToken = await encode({
    secret: process.env.AUTH_SECRET!,
    salt: COOKIE_NAME,
    token: {
      userId: user.id,
      accountId: user.accountId,
      role: user.role,
      accountType: account.type,
      agencyStatus: account.agencyStatus,
      verified: true,
      sub: user.id,
      email: user.email,
      name: user.name,
    },
    maxAge: 30 * 24 * 60 * 60,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: !!isSecure,
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });

  return NextResponse.redirect(new URL("/dashboard?verified=1", appUrl));
}

