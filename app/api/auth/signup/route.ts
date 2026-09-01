import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts, users, emailVerificationTokens } from "@/lib/db/schema";
import { signupSchema } from "@/lib/validation";
import { notify } from "@/lib/email/notify";
import {
  createStripeCustomerAndSubscription,
  createStripeSubscriptionForPlan,
} from "@/lib/stripe/subscription";

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
  const { name, email, password, planKey, cadence, paymentMethodId } = parsed.data;

  // Modifications 5 pricing restructure (revision.md §3.4): a paid tier (premium/network)
  // requires a real payment method — client-confirmed ("Yes, card since the beginning"). Not a
  // zod-level requirement (see the schema's own comment) so this produces a clear field-specific
  // error instead of a generic 400 from a failed schema shape.
  if ((planKey === "premium" || planKey === "network") && !paymentMethodId) {
    return NextResponse.json(
      { message: "A payment method is required for this plan", fieldErrors: { paymentMethodId: ["Payment method is required"] } },
      { status: 400 }
    );
  }

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
  //
  // status at creation depends on which signup path this is:
  //   - No planKey (legacy path, pre-Modifications-5 callers): 'grace_period' — locked v1
  //     decision, no card collected at signup, read-only via lib/auth/rbac.ts's
  //     requireActiveAccount() until the Customer Portal + a first real charge flips it to
  //     'active' (invoice.payment_succeeded webhook, app/api/billing/webhook/route.ts).
  //   - planKey: 'free' — 'active' immediately. Free is truly free forever (client-confirmed,
  //     revision.md §2.1), there is no billing gate to wait on at all.
  //   - planKey: 'premium'/'network' — createStripeSubscriptionForPlan() below sets 'active'
  //     itself once the real trial subscription is created (see that function's own comment for
  //     why: a real card is already attached, so there's no "wait for first charge" period like
  //     the legacy no-card path has). Seeded as 'grace_period' here as a safe default in case
  //     that Stripe call fails before reaching its own status update.
  const [account] = await db
    .insert(accounts)
    .values({
      type: "business",
      name,
      billingEmail: email,
      status: planKey === "free" ? "active" : "grace_period",
      planKey: planKey ?? "default",
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
  //
  // Free tier: no Stripe subscription at all — see createStripeSubscriptionForPlan's own doc
  // comment and revision.md §3.2 for why (Free never bills anything, ever).
  if (planKey === "premium" || planKey === "network") {
    try {
      await createStripeSubscriptionForPlan({
        accountId: account.id,
        billingEmail: email,
        name,
        planKey,
        cadence: cadence ?? "monthly",
        paymentMethodId: paymentMethodId!, // presence already enforced above for these plans
      });
    } catch (err) {
      console.error(
        `[signup] Stripe subscription creation failed for account ${account.id} (plan ${planKey}) — account created locally without billing. This should be investigated / retried.`,
        err
      );
    }
  } else if (!planKey) {
    // Legacy no-tier path — unchanged behavior for any caller that doesn't send planKey.
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
  }
  // planKey === "free": intentionally no Stripe call at all.

  const token = randomBytes(32).toString("hex");
  await db.insert(emailVerificationTokens).values({
    userId: user.id,
    token,
    expiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
  });

  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;
  // Signup already confidently reveals "email already exists" above (unlike forgot-password /
  // resend-verification, which deliberately stay ambiguous) — so there's no enumeration risk in
  // also telling the client whether the verification email actually sent. The account itself is
  // still created either way; a failed send must not block account creation, only the copy shown
  // for it (see the frontend, which now branches on `emailSent` instead of always claiming sent).
  const { sent } = await notify(account.id, "verification", { verifyUrl, recipientEmail: email });

  return NextResponse.json({ ok: true, email, emailSent: sent }, { status: 201 });
}
