// /admin/billing-settings data source — taptapstar_admin only. Per
// 03_DATA_MODEL_AND_ARCHITECTURE.md §8: the DB (`pricing_plans`) is the source of truth for the
// price; every change creates a brand-new Stripe Price under the fixed STRIPE_PRODUCT_ID (Stripe
// Prices are immutable — never edited in place, never a new Product) and is logged to
// `audit_logs`. Existing subscriptions are NOT force-migrated here — that's the
// invoice.upcoming webhook safety-net's job (see app/api/billing/webhook/route.ts).
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { auditLogs, pricingPlans } from "@/lib/db/schema";
import { requireRole, authErrorResponse } from "@/lib/auth/rbac";
import { updatePricingPlanSchema } from "@/lib/validation";
import { getDefaultPricingPlan } from "@/lib/stripe/pricing";
import { stripe } from "@/lib/stripe/client";

export async function GET() {
  try {
    await requireRole("taptapstar_admin");
    const plan = await getDefaultPricingPlan();
    return NextResponse.json({ plan });
  } catch (error) {
    const { message, status } = authErrorResponse(error);
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireRole("taptapstar_admin");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }
    const parsed = updatePricingPlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const productId = process.env.STRIPE_PRODUCT_ID;
    if (!productId) {
      return NextResponse.json(
        { message: "STRIPE_PRODUCT_ID is not configured on the server" },
        { status: 500 }
      );
    }

    const plan = await getDefaultPricingPlan();
    const oldPriceCents = plan.priceCents;
    const newPriceCents = parsed.data.priceCents;

    if (newPriceCents === oldPriceCents) {
      return NextResponse.json({ message: "New price matches the current price" }, { status: 400 });
    }

    // Stripe Prices are immutable — always create a new one under the SAME fixed Product, never
    // edit the existing Price object and never create a new Product.
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: newPriceCents,
      currency: plan.currency,
      recurring: { interval: "month" },
    });

    const [updated] = await db
      .update(pricingPlans)
      .set({
        priceCents: newPriceCents,
        stripePriceId: price.id,
        updatedByUserId: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(pricingPlans.id, plan.id))
      .returning();

    await db.insert(auditLogs).values({
      actorUserId: session.user.id,
      action: "pricing_plan_price_changed",
      targetType: "pricing_plan",
      targetId: plan.id,
      metadataJson: {
        planKey: plan.planKey,
        oldPriceCents,
        newPriceCents,
        newStripePriceId: price.id,
      },
    });

    return NextResponse.json({ plan: updated });
  } catch (error) {
    const { message, status } = authErrorResponse(error);
    return NextResponse.json({ message }, { status });
  }
}
