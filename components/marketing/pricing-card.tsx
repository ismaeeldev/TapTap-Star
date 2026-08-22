"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { AnimatedGradientBorder } from "@/components/shared/animated-gradient-border";
import { useSpotlightHover } from "@/components/shared/use-spotlight-hover";
import { Button } from "@/components/ui/button";
import { fadeUp, marketingInView } from "@/lib/motion";
import { formatPriceCents } from "@/lib/format";

const FEATURES = [
  "Unlimited devices",
  "Unlimited employees",
  "Unlimited locations",
  "Full analytics",
  "Employee leaderboard",
];

// The client's exact single flat-price offer (00_SCOPE_DOCUMENT.md §5.1) — reused identically on
// the homepage pricing section and the standalone /pricing route, never duplicated markup.
// This card is deliberately the ONLY AnimatedGradientBorder element on the page it's used on,
// per theme section 0.1's one-CTA-per-page rule (audited — see 04_PROJECT_STATE.md).
export function PricingCard({
  priceCents,
  currency = "usd",
}: {
  priceCents: number;
  currency?: string;
}) {
  const { onMouseMove } = useSpotlightHover<HTMLDivElement>();

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={marketingInView}
      className="mx-auto max-w-md"
    >
      <AnimatedGradientBorder>
        <div onMouseMove={onMouseMove} className="spotlight rounded-[calc(var(--radius-md)-2px)] p-8">
          <p className="text-caption font-semibold uppercase tracking-wide text-brand">
            One simple plan
          </p>
          <p className="mt-3 flex items-end gap-1">
            <span className="font-display text-display-lg font-extrabold tabular-nums text-text-primary">
              {formatPriceCents(priceCents, currency)}
            </span>
            <span className="mb-1.5 text-body text-text-muted">/month</span>
          </p>
          <p className="mt-1 text-body-sm text-text-muted">Flat rate. No hidden tiers.</p>

          <ul className="mt-6 space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-body-sm text-text-secondary">
                <Check className="size-4 shrink-0 text-success" /> {f}
              </li>
            ))}
          </ul>

          <Button asChild size="hero" className="mt-8 w-full">
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </AnimatedGradientBorder>
    </motion.div>
  );
}
