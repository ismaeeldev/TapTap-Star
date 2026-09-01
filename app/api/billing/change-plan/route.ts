// Modifications 5 pricing restructure (revision.md §3.4/step 5) — dashboard billing
// plan-switcher, client-confirmed "anytime", either direction. Delegates the actual Stripe work
// to lib/stripe/subscription.ts's changeSubscriptionPlan() — see that function's own doc comment
// for the 3 genuinely different transition shapes it handles (paid<->paid item swap, paid->free
// immediate cancellation, free->paid new customer+subscription).
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts } from "@/lib/db/schema";
import { requireSession, authErrorResponse, AuthError } from "@/lib/auth/rbac";
import { changePlanSchema } from "@/lib/validation";
import { changeSubscriptionPlan } from "@/lib/stripe/subscription";

export async function POST(req: Request) {
  try {
    const session = await requireSession();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }

    const parsed = changePlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { newPlanKey, cadence, paymentMethodId } = parsed.data;

    const account = await db.query.accounts.findFirst({
      where: eq(accounts.id, session.user.accountId),
    });
    if (!account) throw new AuthError("Account not found", 404);

    // Agency accounts have their own distinct billing model (managedBusinessCount × plan
    // price, see lib/stripe/pricing.ts's getSubscriptionAmountCents) — this switcher targets
    // the new business-tier model built in this pricing restructure, not agencies. Blocking
    // this here rather than letting changeSubscriptionPlan() run into an undefined state for a
    // billing shape it was never designed for.
    if (account.type === "agency") {
      return NextResponse.json(
        { message: "Agency accounts don't use per-tier plans — contact support to change agency billing" },
        { status: 400 }
      );
    }

    if (account.planKey === newPlanKey) {
      return NextResponse.json({ message: "You're already on this plan" }, { status: 400 });
    }

    if (
      account.planKey === "free" &&
      (newPlanKey === "premium" || newPlanKey === "network") &&
      !paymentMethodId
    ) {
      return NextResponse.json(
        {
          message: "A payment method is required to switch to a paid plan",
          fieldErrors: { paymentMethodId: ["Payment method is required"] },
        },
        { status: 400 }
      );
    }

    const result = await changeSubscriptionPlan({
      accountId: account.id,
      newPlanKey,
      cadence,
      paymentMethodId,
    });

    return NextResponse.json({ ok: true, planKey: result.planKey });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
