import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts, locations } from "@/lib/db/schema";
import { requireSession, requireActiveAccount, authErrorResponse, AuthError } from "@/lib/auth/rbac";
import { reviewFilterSettingsSchema } from "@/lib/validation";
import { getPricingPlanByKey } from "@/lib/stripe/pricing";

// PATCH /api/locations/:id/review-filter — the business-owner-facing settings panel for the
// review-filtering feature (Premium/Network only, per pricing-tiers.tsx's feature table).
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    await requireActiveAccount(session);
    const { id } = await params;

    const account = await db.query.accounts.findFirst({
      where: eq(accounts.id, session.user.accountId),
    });
    if (!account) {
      return NextResponse.json({ message: "Account not found" }, { status: 404 });
    }

    // Free tier: this is a real, priced Premium/Network feature (revision.md pricing table) —
    // never allow enabling it from Free, even if the request is crafted directly (the UI
    // already hides the toggle, but that's not enforcement — this is).
    const plan = await getPricingPlanByKey(account.planKey);
    const canUseReviewFiltering = plan.planKey !== "free";
    if (!canUseReviewFiltering) {
      return NextResponse.json(
        { message: "Review filtering is a Premium/Network feature. Upgrade to use it." },
        { status: 403 }
      );
    }

    const location = await db.query.locations.findFirst({
      where: eq(locations.id, id),
    });
    if (!location || location.accountId !== session.user.accountId) {
      throw new AuthError("Forbidden — location does not belong to your account", 403);
    }

    const body = await request.json().catch(() => null);
    const parsed = reviewFilterSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    // Modifications 9 (client PDF, items 1/6): AI-answered reviews — same Premium-only gate as
    // review filtering above (this route already required a paid plan to reach this point), so
    // no separate check needed. aiReplyEnabled/aiReplyThreshold are optional in the schema (see
    // its own comment) — only written when the request actually includes them, so this route
    // stays backward-compatible with any caller that doesn't send those fields.
    const [updated] = await db
      .update(locations)
      .set({
        reviewFilterEnabled: parsed.data.reviewFilterEnabled,
        reviewFilterThreshold: parsed.data.reviewFilterThreshold,
        reviewDestinationType: parsed.data.reviewDestinationType,
        reviewDestinationUrl:
          parsed.data.reviewDestinationType === "custom" ? parsed.data.reviewDestinationUrl || null : null,
        ...(parsed.data.aiReplyEnabled !== undefined ? { aiReplyEnabled: parsed.data.aiReplyEnabled } : {}),
        ...(parsed.data.aiReplyThreshold !== undefined ? { aiReplyThreshold: parsed.data.aiReplyThreshold } : {}),
        updatedAt: new Date(),
      })
      .where(eq(locations.id, id))
      .returning();

    return NextResponse.json({ location: updated });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
