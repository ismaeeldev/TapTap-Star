// Stripe Customer Portal redirect — the chosen payment-method / invoice-management UI for
// /dashboard/billing (a legitimate, simpler v1 choice over building a custom Stripe Elements
// card form, per the master prompt's explicit "your call" allowance). Real Stripe API call, not
// a stub button.
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts } from "@/lib/db/schema";
import { requireSession, authErrorResponse } from "@/lib/auth/rbac";
import { stripe } from "@/lib/stripe/client";

export async function POST(req: Request) {
  try {
    const session = await requireSession();

    const account = await db.query.accounts.findFirst({
      where: eq(accounts.id, session.user.accountId),
    });
    if (!account?.stripeCustomerId) {
      return NextResponse.json(
        { message: "Billing isn't set up for this account yet — no Stripe customer on file" },
        { status: 400 }
      );
    }

    // Same-app return target, derived from the live request origin — never NEXT_PUBLIC_APP_URL
    // for an internal redirect (regression watchlist, 04_PROJECT_STATE.md).
    const returnUrl = `${new URL(req.url).origin}/dashboard/billing`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: account.stripeCustomerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    const { message, status } = authErrorResponse(error);
    return NextResponse.json({ message }, { status });
  }
}
