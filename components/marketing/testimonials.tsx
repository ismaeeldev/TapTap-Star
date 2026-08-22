"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/marketing/section-header";
import { staggerContainer, fadeUp, marketingInView } from "@/lib/motion";

// Placeholder content, clearly labeled as illustrative rather than claiming real customers yet —
// structured so real quotes can drop in later without a rebuild (per the master prompt's
// explicit instruction not to read as fabricated testimonials — no invented names/businesses
// presented as real reviews, ever, even when the visual design gets a polish pass). Each entry
// is framed as "what a [persona] could say" rather than a named byline, which is what makes the
// honesty legible in the design itself, not just in a disclaimer paragraph.
const PREVIEW_QUOTES = [
  {
    quote:
      "A steady lift in Google reviews within the first month, with zero extra effort from the front counter — that's the kind of result we're aiming for.",
    persona: "A restaurant owner",
  },
  {
    quote:
      "A leaderboard the team actually checks, because it turns asking for reviews into something worth competing over instead of a chore.",
    persona: "A multi-location manager",
  },
  {
    quote:
      "Per-location analytics without juggling spreadsheets for every client — that's the whole pitch for an agency managing several businesses at once.",
    persona: "An agency partner",
  },
];

export function Testimonials() {
  return (
    <section className="bg-bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <SectionHeader
          eyebrow="What businesses will say"
          title="A preview, not a review — yet"
          description="We're early, so there are no real customer reviews to show yet. Here's the kind of feedback we're building toward."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={marketingInView}
          className="mt-14 grid gap-6 md:grid-cols-3"
        >
          {PREVIEW_QUOTES.map((t, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Card variant="standard" className="h-full p-6">
                <div className="flex items-start justify-between gap-3">
                  <Quote className="size-6 text-brand/50" />
                  <Badge variant="neutral">Preview</Badge>
                </div>
                <p className="mt-4 text-body-sm text-text-secondary italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-5 border-t border-border-default pt-4">
                  <p className="text-caption text-text-muted">What {t.persona.toLowerCase()} could say</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
