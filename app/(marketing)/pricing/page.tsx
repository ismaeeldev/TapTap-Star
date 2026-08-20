import type { Metadata } from "next";
import { GradientMesh } from "@/components/shared/gradient-mesh";
import { PricingCard } from "@/components/marketing/pricing-card";
import { getPublicPricingPlan } from "@/lib/queries/marketing";

export const metadata: Metadata = {
  title: "Pricing — Taptapstar",
  description: "One flat monthly rate — unlimited devices, employees, locations, and analytics.",
};

// Same "always read live, never hardcode" rule as the homepage — see app/(marketing)/page.tsx.
export const dynamic = "force-dynamic";

// Standalone route reusing the same PricingCard component as the homepage's pricing section
// (no duplicated markup), same live-read pricing_plans query.
export default async function PricingPage() {
  const plan = await getPublicPricingPlan();

  return (
    <>
      <GradientMesh className="pt-32 pb-16">
        <div className="mx-auto max-w-2xl px-6 text-center md:px-8">
          <h1 className="font-display text-display-lg font-bold text-text-primary">
            Simple, flat pricing
          </h1>
          <p className="mt-4 text-body-lg text-text-secondary">
            No per-device fees, no tiers to compare — one price covers your whole business.
          </p>
        </div>
      </GradientMesh>
      <div className="px-6 py-16 md:px-8">
        <PricingCard priceCents={plan.priceCents} currency={plan.currency} />
      </div>
    </>
  );
}
