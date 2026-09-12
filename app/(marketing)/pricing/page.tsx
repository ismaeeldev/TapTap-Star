import type { Metadata } from "next";
import { GradientMesh } from "@/components/shared/gradient-mesh";
import { PricingTiers } from "@/components/marketing/pricing-tiers";
import { getPublicPricingTiers } from "@/lib/queries/marketing";

// Modifications 9 (client PDF, item 3): "I want only 2 plans instead of 3." Was "Free, Premium,
// and Network plans" — a stale SEO description leftover from before the Network-into-Premium
// merge (revision.md's Modifications 9 entry). Not user-visible on the page itself, but shows up
// in page source / search results / social-share previews, so it needed fixing too.
export const metadata: Metadata = {
  title: "Pricing — Taptapstar",
  description: "Free and Premium plans — pick the tier that fits your business.",
};

// Same "always read live, never hardcode" rule as the homepage — see app/(marketing)/page.tsx.
export const dynamic = "force-dynamic";

// Modifications 5 pricing restructure (revision.md §3.3) — tier comparison, replacing the old
// single flat-price card. See components/marketing/pricing-tiers.tsx for the tier content.
export default async function PricingPage() {
  const tiers = await getPublicPricingTiers();

  return (
    <>
      <GradientMesh className="pt-32 pb-16">
        <div className="mx-auto max-w-2xl px-6 text-center md:px-8">
          <h1 className="font-display text-display-lg font-bold text-text-primary">
            Pick the plan that fits your business
          </h1>
          <p className="mt-4 text-body-lg text-text-secondary">
            Start free, upgrade whenever you&apos;re ready — switch plans anytime.
          </p>
        </div>
      </GradientMesh>
      <div className="px-6 py-16 md:px-8">
        <PricingTiers tiers={tiers} />
      </div>
    </>
  );
}
