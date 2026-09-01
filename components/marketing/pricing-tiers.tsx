"use client";

// Modifications 5 pricing restructure (revision.md §3.3) — replaces the old single flat-price
// PricingCard on the standalone /pricing route with a real 3-tier comparison, matching Digifeel's
// plan STRUCTURE and functionality (client's own words: "Don't copy prices, just
// functionabilities") — not Digifeel's literal copy/prices, and not Digifeel's review-management
// feature set verbatim; translated into Taptapstar's actual product (devices/locations/analytics),
// per revision.md §2.2.
//
// PricingCard (components/marketing/pricing-card.tsx) is untouched and still used on the
// homepage + kept for now — rewriting those to the 3-tier model is a separate follow-up, not
// bundled into this step (see revision.md's change log).
import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { AnimatedGradientBorder } from "@/components/shared/animated-gradient-border";
import { Button } from "@/components/ui/button";
import { fadeUp, marketingInView, staggerContainer } from "@/lib/motion";
import { formatPriceCents } from "@/lib/format";
import { cn } from "@/lib/utils";

type Tier = {
  planKey: string;
  name: string;
  priceCents: number;
  annualPriceCents: number | null;
  locationLimit: number | null;
  trialDays: number | null;
};

type FeatureRow = { label: string; free: boolean; premium: boolean; network: boolean };

// Feature split per revision.md §2.2 — Taptapstar's own product, not Digifeel's literal
// review-management feature list.
const FEATURES: FeatureRow[] = [
  { label: "1 location", free: true, premium: true, network: true },
  { label: "Unlimited locations", free: false, premium: false, network: true },
  { label: "Basic analytics dashboard", free: true, premium: true, network: true },
  { label: "Full analytics (location breakdown)", free: false, premium: true, network: true },
  { label: "AI-powered draft reply suggestions", free: false, premium: true, network: true },
  { label: "Real-time scan alerts", free: false, premium: true, network: true },
  { label: "Multi-location control center", free: false, premium: false, network: true },
];

function locationSummary(limit: number | null) {
  if (limit === null) return "Unlimited locations";
  return limit === 1 ? "1 location" : `${limit} locations`;
}

export function PricingTiers({ tiers }: { tiers: Tier[] }) {
  const [annual, setAnnual] = React.useState(false);
  const free = tiers.find((t) => t.planKey === "free");
  const premium = tiers.find((t) => t.planKey === "premium");
  const network = tiers.find((t) => t.planKey === "network");

  if (!free || !premium || !network) return null;

  function priceDisplay(tier: Tier) {
    if (tier.priceCents === 0) return { amount: "Free", suffix: "forever" };
    const cents = annual && tier.annualPriceCents !== null ? Math.round(tier.annualPriceCents / 12) : tier.priceCents;
    return { amount: formatPriceCents(cents, "usd").replace(/\.00$/, ""), suffix: "/month" };
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Monthly/annual toggle — client-confirmed: annual billing offered at a 20% discount on
          every paid tier (revision.md §2.1). */}
      <div className="mb-10 flex items-center justify-center gap-3">
        <span className={cn("text-body-sm font-medium", !annual ? "text-text-primary" : "text-text-muted")}>
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={annual}
          onClick={() => setAnnual((v) => !v)}
          className="relative h-7 w-12 rounded-full bg-bg-muted transition-colors data-[on=true]:bg-brand"
          data-on={annual}
        >
          <span
            className={cn(
              "absolute top-1 left-1 size-5 rounded-full bg-white shadow-sm transition-transform",
              annual && "translate-x-5"
            )}
          />
        </button>
        <span className={cn("text-body-sm font-medium", annual ? "text-text-primary" : "text-text-muted")}>
          Annual
        </span>
        <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-caption font-semibold text-success">
          Save 20%
        </span>
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={marketingInView}
        variants={staggerContainer}
        className="grid gap-6 md:grid-cols-3"
      >
        {/* Free */}
        <motion.div variants={fadeUp} className="rounded-lg border border-border-default bg-bg-card p-8">
          <TierHeader
            name="Free"
            description="Just what you need to set up and manage your account."
            priceDisplay={priceDisplay(free)}
          />
          <p className="mt-1 text-body-sm text-text-muted">{locationSummary(free.locationLimit)}</p>
          <Button asChild variant="secondary" size="hero" className="mt-6 w-full">
            <Link href="/signup?plan=free">Get started free</Link>
          </Button>
          <FeatureList tierKey="free" />
        </motion.div>

        {/* Premium — the one AnimatedGradientBorder on this page (theme guideline 0.1's
            one-per-page rule), matching Digifeel's own "most popular" visual emphasis on this
            same tier. */}
        <motion.div variants={fadeUp}>
          <AnimatedGradientBorder className="relative h-full">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-caption font-semibold text-white">
              Most popular
            </span>
            <div className="flex h-full flex-col p-8">
              <TierHeader
                name="Premium"
                description="Activate automation and grow faster with AI-powered tools."
                priceDisplay={priceDisplay(premium)}
              />
              <p className="mt-1 text-body-sm text-text-muted">{locationSummary(premium.locationLimit)}</p>
              {premium.trialDays && (
                <p className="mt-1 text-caption text-brand">{premium.trialDays}-day free trial</p>
              )}
              <Button asChild size="hero" className="mt-6 w-full">
                <Link href="/signup?plan=premium">Get {premium.trialDays} days free</Link>
              </Button>
              <FeatureList tierKey="premium" />
            </div>
          </AnimatedGradientBorder>
        </motion.div>

        {/* Network */}
        <motion.div variants={fadeUp} className="rounded-lg border border-border-default bg-bg-card p-8">
          <TierHeader
            name="Network"
            description="All the growth tools to manage multiple locations."
            priceDisplay={priceDisplay(network)}
          />
          <p className="mt-1 text-body-sm text-text-muted">{locationSummary(network.locationLimit)}</p>
          {network.trialDays && (
            <p className="mt-1 text-caption text-brand">{network.trialDays}-day free trial</p>
          )}
          <Button asChild variant="secondary" size="hero" className="mt-6 w-full">
            <Link href="/signup?plan=network">Get {network.trialDays} days free</Link>
          </Button>
          <FeatureList tierKey="network" />
        </motion.div>
      </motion.div>
    </div>
  );
}

function TierHeader({
  name,
  description,
  priceDisplay,
}: {
  name: string;
  description: string;
  priceDisplay: { amount: string; suffix: string };
}) {
  return (
    <>
      <p className="text-h4 font-display font-semibold text-text-primary">{name}</p>
      <p className="mt-1 text-body-sm text-text-muted">{description}</p>
      <p className="mt-4 flex items-end gap-1.5">
        <span className="font-display text-display-md font-extrabold tabular-nums text-text-primary">
          {priceDisplay.amount}
        </span>
        <span className="mb-1 text-body-sm text-text-muted">{priceDisplay.suffix}</span>
      </p>
    </>
  );
}

function FeatureList({ tierKey }: { tierKey: "free" | "premium" | "network" }) {
  return (
    <ul className="mt-6 space-y-3 border-t border-border-default pt-6">
      {FEATURES.map((f) => {
        const included = f[tierKey];
        return (
          <li
            key={f.label}
            className={cn(
              "flex items-center gap-2.5 text-body-sm",
              included ? "text-text-secondary" : "text-text-muted line-through"
            )}
          >
            {included ? (
              <Check className="size-4 shrink-0 text-success" />
            ) : (
              <X className="size-4 shrink-0 text-text-muted" />
            )}
            {f.label}
          </li>
        );
      })}
    </ul>
  );
}
