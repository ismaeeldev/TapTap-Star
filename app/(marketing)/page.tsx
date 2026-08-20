import { MarketingHero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { FeatureBento } from "@/components/marketing/feature-bento";
import { LeaderboardShowcase } from "@/components/marketing/leaderboard-showcase";
import { Benefits } from "@/components/marketing/benefits";
import { UseCases } from "@/components/marketing/use-cases";
import { PricingCard } from "@/components/marketing/pricing-card";
import { Testimonials } from "@/components/marketing/testimonials";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { ContactSection } from "@/components/marketing/contact-section";
import { getPublicPricingPlan } from "@/lib/queries/marketing";

// Force dynamic rendering (not static prerender) so the pricing card always reflects the live
// pricing_plans row, even if an admin changes the price at /admin/billing-settings without a
// redeploy — consistent with the "always read live, never hardcode" rule from /dashboard/billing.
export const dynamic = "force-dynamic";

// The client's #1 conversion asset (00_SCOPE_DOCUMENT.md §5.1, client's exact content list —
// see 04_PROJECT_STATE.md for the device-usage-restraint audit run against this page). Reads
// the live pricing_plans row server-side rather than hardcoding "$29.90" — same
// "always read live, never hardcode" rule already established at /dashboard/billing.
export default async function MarketingHomePage() {
  const plan = await getPublicPricingPlan();

  return (
    <>
      <MarketingHero />
      <HowItWorks />
      <FeatureBento />
      <LeaderboardShowcase />
      <Benefits />
      <UseCases />

      <section id="pricing" className="mx-auto max-w-6xl px-6 py-24 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-caption font-semibold uppercase tracking-wide text-brand">Pricing</p>
          <h2 className="mt-3 font-display text-display-lg font-bold text-text-primary">
            One plan. Everything included.
          </h2>
        </div>
        <div className="mt-14">
          <PricingCard priceCents={plan.priceCents} currency={plan.currency} />
        </div>
      </section>

      <Testimonials />

      <section id="faq" className="mx-auto max-w-6xl px-6 py-24 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-caption font-semibold uppercase tracking-wide text-brand">FAQ</p>
          <h2 className="mt-3 font-display text-display-lg font-bold text-text-primary">
            Common questions
          </h2>
        </div>
        <div className="mt-14">
          <FaqAccordion priceCents={plan.priceCents} currency={plan.currency} />
        </div>
      </section>

      <ContactSection />
    </>
  );
}
