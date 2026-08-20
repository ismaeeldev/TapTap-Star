"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { BarChart3, MapPinned, Trophy, Users } from "lucide-react";
import { BentoGrid, BentoTile } from "@/components/shared/bento-grid";
import { useSpotlightHover } from "@/components/shared/use-spotlight-hover";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

// One tile per required content item (04_PROJECT_STATE.md / scope §5.1): employee tracking,
// employee leaderboard, business analytics, multi-location management — each gets its own
// visible tile, not a sub-bullet, per the client's explicit ask. Cursor-spotlight hover
// (theme section 0.1) applied via the shared hook, desktop-only in effect since it only
// matters on a hover-capable pointer.
function SpotlightTile({
  className,
  span,
  glow,
  children,
}: {
  className?: string;
  span?: "hero" | "wide" | "default";
  glow?: boolean;
  children: React.ReactNode;
}) {
  const { onMouseMove } = useSpotlightHover<HTMLDivElement>();
  return (
    <motion.div variants={fadeUp} className={cn(span === "hero" && "sm:col-span-2 sm:row-span-2 lg:col-span-2 lg:row-span-2", span === "wide" && "sm:col-span-2 lg:col-span-2")}>
      <BentoTile onMouseMove={onMouseMove} glow={glow} className={cn("h-full", className)}>
        {children}
      </BentoTile>
    </motion.div>
  );
}

export function FeatureBento() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24 md:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-caption font-semibold uppercase tracking-wide text-brand">
          Why Taptapstar
        </p>
        <h2 className="mt-3 font-display text-display-lg font-bold text-text-primary">
          Everything you need to turn scans into growth
        </h2>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-10%" }}
        className="mt-14"
      >
        <BentoGrid>
          <SpotlightTile span="hero" glow>
            <div className="flex h-full flex-col justify-between">
              <div>
                <div className="flex size-11 items-center justify-center rounded-full bg-brand-subtle text-brand">
                  <BarChart3 className="size-5" />
                </div>
                <h3 className="mt-4 text-h3 font-semibold text-text-primary">
                  Business analytics
                </h3>
                <p className="mt-2 max-w-sm text-body text-text-secondary">
                  See scan volume trends, your busiest locations, and top review sources — filter
                  by date range, location, or device, then export to CSV or PDF.
                </p>
              </div>
              <div className="mt-6 flex items-end gap-1.5" aria-hidden="true">
                {[40, 65, 50, 80, 60, 95, 75].map((h, i) => (
                  <div
                    key={i}
                    className="w-6 rounded-t bg-brand/70"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            </div>
          </SpotlightTile>

          <SpotlightTile>
            <div className="flex size-11 items-center justify-center rounded-full bg-brand-subtle text-brand">
              <Users className="size-5" />
            </div>
            <h3 className="mt-4 text-h3 font-semibold text-text-primary">Employee tracking</h3>
            <p className="mt-2 text-body-sm text-text-secondary">
              Assign devices to individual employees and see exactly who&apos;s driving reviews at
              each location.
            </p>
          </SpotlightTile>

          <SpotlightTile>
            <div className="flex size-11 items-center justify-center rounded-full bg-brand-subtle text-brand">
              <MapPinned className="size-5" />
            </div>
            <h3 className="mt-4 text-h3 font-semibold text-text-primary">
              Multi-location management
            </h3>
            <p className="mt-2 text-body-sm text-text-secondary">
              Run one location or fifty from a single dashboard — devices, staff, and analytics
              all scoped per location.
            </p>
          </SpotlightTile>

          <SpotlightTile span="wide">
            <div className="flex size-11 items-center justify-center rounded-full bg-brand-subtle text-brand">
              <Trophy className="size-5" />
            </div>
            <h3 className="mt-4 text-h3 font-semibold text-text-primary">Employee leaderboard</h3>
            <p className="mt-2 max-w-md text-body-sm text-text-secondary">
              A live-ranked leaderboard turns getting reviews into a friendly competition —
              employees can even check their own rank on a personal link, no login required.
            </p>
          </SpotlightTile>
        </BentoGrid>
      </motion.div>
    </section>
  );
}
