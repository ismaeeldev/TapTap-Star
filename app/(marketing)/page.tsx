import { MarketingHero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { FeatureBento } from "@/components/marketing/feature-bento";
import { LeaderboardShowcase } from "@/components/marketing/leaderboard-showcase";
import { Benefits } from "@/components/marketing/benefits";
import { UseCases } from "@/components/marketing/use-cases";
import { PricingTiers } from "@/components/marketing/pricing-tiers";
import { Testimonials } from "@/components/marketing/testimonials";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { ContactSection } from "@/components/marketing/contact-section";
import { SectionHeader } from "@/components/marketing/section-header";
import { getPublicPricingTiers } from "@/lib/queries/marketing";

// Force dynamic rendering (not static prerender) so pricing always reflects the live
// pricing_plans rows, even if an admin changes a price at /admin/billing-settings without a
// redeploy — consistent with the "always read live, never hardcode" rule from /dashboard/billing.
export const dynamic = "force-dynamic";

// The client's #1 conversion asset (00_SCOPE_DOCUMENT.md §5.1, client's exact content list —
// see 04_PROJECT_STATE.md for the device-usage-restraint audit run against this page).
//
// Modifications 6: swapped the old single flat-price PricingCard for the real 3-tier
// Free/Premium/Network model (components/marketing/pricing-tiers.tsx) — this page was the one
// spot in the app still showing the old $29.90 flat rate after the Modifications 5 pricing
// restructure shipped everywhere else (that page's own comment flagged this exact swap as a
// "separate follow-up, not bundled into this step"). FaqAccordion updated alongside it since its
// pricing answer must describe the same 3 tiers, not the retired flat rate.
export default async function MarketingHomePage() {
  const tiers = await getPublicPricingTiers();

  return (
    <>
      <MarketingHero />
      <HowItWorks />
      <FeatureBento />
      <LeaderboardShowcase />
      <Benefits />
      <UseCases />

      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20 md:px-8 md:py-28">
        <SectionHeader eyebrow="Pricing" title="Pick the plan that fits your business" />
        <div className="mt-14">
          <PricingTiers tiers={tiers} />
        </div>
      </section>

      <Testimonials />

      <section id="faq" className="mx-auto max-w-6xl px-6 py-20 md:px-8 md:py-28">
        <SectionHeader eyebrow="FAQ" title="Common questions" />
        <div className="mt-14">
          <FaqAccordion tiers={tiers} currency="usd" />
        </div>
      </section>

      <ContactSection />
    </>
  );
}
