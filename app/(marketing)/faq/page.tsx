import type { Metadata } from "next";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { getPublicPricingTiers } from "@/lib/queries/marketing";

export const metadata: Metadata = {
  title: "FAQ — Taptapstar",
  description: "Answers to common questions about pricing, devices, and how Taptapstar works.",
};

// Same "always read live, never hardcode" rule as the homepage/pricing routes — the FAQ's
// pricing answer interpolates live values, so it must be dynamic too.
export const dynamic = "force-dynamic";

// Standalone route reusing the same FaqAccordion component as the homepage FAQ section.
// Modifications 6: reads the 3-tier Free/Premium/Network prices (see app/(marketing)/page.tsx's
// comment for the full reasoning) instead of the retired single flat plan.
export default async function FaqPage() {
  const tiers = await getPublicPricingTiers();

  return (
    <div className="mx-auto max-w-3xl px-6 pt-32 pb-24 md:px-8">
      <div className="text-center">
        <h1 className="font-display text-display-lg font-bold text-text-primary">
          Frequently asked questions
        </h1>
        <p className="mt-4 text-body-lg text-text-secondary">
          Everything you need to know before getting started.
        </p>
      </div>
      <div className="mt-14">
        <FaqAccordion tiers={tiers} currency="usd" />
      </div>
    </div>
  );
}
