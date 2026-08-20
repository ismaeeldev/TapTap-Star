"use client";

import { Radio, TrendingUp, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

// Simplified, static mockups of real dashboard UI fragments (stat tile + live scan feed +
// leaderboard rank chip) — styled to match components/shared/stat-tile.tsx and
// components/dashboard/live-scan-feed.tsx's visual language, per theme section 0.1's "glass
// floating dashboard-preview cards" requirement. Deliberately NOT literal screenshots (those
// don't exist for a marketing asset yet) and NOT generic stock imagery — built from the same
// design tokens as the real app so it reads as authentic product UI.
function GlassCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "glass w-56 rounded-lg p-4 shadow-lg",
        className
      )}
    >
      {children}
    </div>
  );
}

export function HeroPreviewCards() {
  return (
    <div className="relative mx-auto mt-16 hidden h-[22rem] max-w-3xl md:block" aria-hidden="true">
      {/* Mini stat-tile card */}
      <GlassCard className="absolute top-0 left-4 hero-float-1">
        <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">
          Scans this month
        </p>
        <p className="mt-1 font-display text-display-md font-bold tabular-nums text-text-primary">
          1,284
        </p>
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-caption font-semibold text-success">
          <TrendingUp className="size-3" /> +18%
        </span>
      </GlassCard>

      {/* Mini scan-feed snippet */}
      <GlassCard className="absolute top-24 right-0 hero-float-2">
        <p className="mb-3 flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-text-muted">
          <Radio className="size-3" /> Live scan feed
        </p>
        <ul className="space-y-2.5">
          {["Table 4 · Downtown Cafe", "Counter 1 · Downtown Cafe", "Table 9 · Downtown Cafe"].map(
            (row, i) => (
              <li key={row} className="flex items-center gap-2 text-body-sm">
                <span
                  className={cn(
                    "size-1.5 rounded-full bg-success",
                    i === 0 && "animate-pulse"
                  )}
                />
                <span className="truncate text-text-secondary">{row}</span>
              </li>
            )
          )}
        </ul>
      </GlassCard>

      {/* Mini employee-leaderboard rank chip */}
      <GlassCard className="absolute bottom-0 left-20 hero-float-3">
        <p className="mb-3 flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-text-muted">
          <Trophy className="size-3" /> Leaderboard
        </p>
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-brand-subtle text-caption font-bold text-brand">
            #1
          </span>
          <div>
            <p className="text-body-sm font-semibold text-text-primary">Maria S.</p>
            <p className="text-caption text-text-muted">312 scans</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
