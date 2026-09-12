"use client";

// Modifications 5 pricing restructure (revision.md §3.3) — replaces the old single flat-price
// PricingCard on the standalone /pricing route with a real multi-tier comparison, matching
// Digifeel's plan STRUCTURE and functionality (client's own words: "Don't copy prices, just
// functionabilities") — not Digifeel's literal copy/prices, and not Digifeel's review-management
// feature set verbatim; translated into Taptapstar's actual product (devices/locations/analytics),
// per revision.md §2.2.
//
// Modifications 9 (client PDF, item 3): "I want only 2 plans instead of 3 and I want it to be
// like in the video." Network merged into Premium (revision.md's Modifications 9 entry) — this
// is now a 2-column Free/Premium comparison instead of 3. The client's referenced video hadn't
// arrived as of this pass, so the layout below is a functional placeholder matching the new
// 2-plan data shape (nothing crashes, prices/features are all correct and live) rather than a
// redesign to match the video's exact visual layout — revisit once the video is sent.
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
  perExtraLocationCents?: number | null;
};

type FeatureRow = { label: string; free: boolean; premium: boolean };

// Feature split per revision.md §2.2 — Taptapstar's own product, not Digifeel's literal
// review-management feature list.
//
// Modifications 9 (client PDF, items 1/6): AI-answering is back in scope (client's explicit
// re-request, overriding the earlier "remove ai feature not add" decision — see revision.md's
// Modifications 9 entry) and, per item 6 ("AI answering and Review filtering I only want to be
// available for Premium Plan"), gated to Premium only, same as review filtering already was.
const FEATURES: FeatureRow[] = [
  { label: "1 location", free: true, premium: true },
  { label: "Unlimited locations", free: false, premium: true },
  { label: "Basic analytics dashboard", free: true, premium: true },
  { label: "Full analytics (location breakdown)", free: false, premium: true },
  { label: "AI-powered review replies", free: false, premium: true },
  { label: "Review filtering (route low ratings to private feedback)", free: false, premium: true },
  { label: "Real-time scan alerts", free: false, premium: true },
];

function locationSummary(limit: number | null) {
  if (limit === null) return "Unlimited locations";
  return limit === 1 ? "1 location" : `${limit} locations`;
}

export function PricingTiers({ tiers }: { tiers: Tier[] }) {
  const [annual, setAnnual] = React.useState(false);
  const free = tiers.find((t) => t.planKey === "free");
  const premium = tiers.find((t) => t.planKey === "premium");

  if (!free || !premium) return null;

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
        className="grid gap-6 md:grid-cols-2"
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
                description="AI-assisted replies, review filtering, and unlimited locations."
                priceDisplay={priceDisplay(premium)}
              />
              <p className="mt-1 text-body-sm text-text-muted">{locationSummary(premium.locationLimit)}</p>
              {/* Modifications 9 (client PDF, item 5): "the option to know prices for 2 loc, 3
                  loc, 4 loc....." — per-location pricing spelled out directly on the card. */}
              {premium.perExtraLocationCents ? (
                <p className="mt-1 text-caption text-text-muted">
                  +{formatPriceCents(premium.perExtraLocationCents, "usd").replace(/\.00$/, "")}/mo per
                  extra location — e.g. 2 locations:{" "}
                  {formatPriceCents(premium.priceCents + premium.perExtraLocationCents, "usd").replace(/\.00$/, "")}
                  /mo, 3 locations:{" "}
                  {formatPriceCents(premium.priceCents + premium.perExtraLocationCents * 2, "usd").replace(/\.00$/, "")}
                  /mo, 4 locations:{" "}
                  {formatPriceCents(premium.priceCents + premium.perExtraLocationCents * 3, "usd").replace(/\.00$/, "")}
                  /mo
                </p>
              ) : null}
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

function FeatureList({ tierKey }: { tierKey: "free" | "premium" }) {
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
