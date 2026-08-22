"use client";

import { motion } from "framer-motion";
import { Trophy, Medal } from "lucide-react";
import { fadeUp, marketingInView, staggerContainer } from "@/lib/motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Employee leaderboard gets its own clearly-visible marketing section, not just a bento tile —
// this is a stated core selling point per 00_SCOPE_DOCUMENT.md §5.1 / the client's own words.
const ROWS = [
  { rank: 1, name: "Maria S.", location: "Downtown Cafe", scans: 312 },
  { rank: 2, name: "Jonas K.", location: "Downtown Cafe", scans: 271 },
  { rank: 3, name: "Aiko T.", location: "Uptown Bistro", scans: 244 },
  { rank: 4, name: "Diego R.", location: "Downtown Cafe", scans: 198 },
];

const MEDAL_COLOR: Record<number, string> = {
  1: "text-warning",
  2: "text-text-muted",
  3: "text-brand",
};

export function LeaderboardShowcase() {
  return (
    <section id="leaderboard" className="mx-auto max-w-6xl px-6 py-20 md:px-8 md:py-28">
      <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={marketingInView}
        >
          <p className="text-caption font-semibold uppercase tracking-wide text-brand">
            Gamification
          </p>
          <h2 className="mt-3 font-display text-display-lg font-bold text-text-primary">
            The employee leaderboard people actually check
          </h2>
          <p className="mt-4 text-body-lg text-text-secondary">
            Every scan is credited to the employee who earned it. Rankings update in real time, so
            staff stay motivated to ask for that next review — and managers can set team targets
            and watch progress in one glance.
          </p>
          <ul className="mt-6 space-y-3 text-body text-text-secondary">
            <li className="flex items-start gap-2">
              <Trophy className="mt-0.5 size-4 shrink-0 text-brand" /> Ranked by this-month or
              all-time scan count, per location or combined.
            </li>
            <li className="flex items-start gap-2">
              <Trophy className="mt-0.5 size-4 shrink-0 text-brand" /> Employees get a personal,
              no-login link to check their own rank and progress toward the team target.
            </li>
          </ul>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={marketingInView}
        >
          <Card variant="standard" className="p-6">
            <p className="mb-4 text-caption font-semibold uppercase tracking-wide text-text-muted">
              This month
            </p>
            <ul className="space-y-1">
              {ROWS.map((row) => (
                <motion.li
                  key={row.rank}
                  variants={fadeUp}
                  className="flex items-center gap-4 rounded-md px-2 py-3 transition-colors hover:bg-bg-muted"
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full bg-bg-muted text-body-sm font-bold",
                      MEDAL_COLOR[row.rank] ?? "text-text-muted"
                    )}
                  >
                    {row.rank <= 3 ? <Medal className="size-4" /> : row.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-sm font-semibold text-text-primary">
                      {row.name}
                    </p>
                    <p className="truncate text-caption text-text-muted">{row.location}</p>
                  </div>
                  <span className="text-body-sm font-semibold tabular-nums text-text-primary">
                    {row.scans}
                  </span>
                </motion.li>
              ))}
            </ul>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
