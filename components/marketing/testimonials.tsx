"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/marketing/section-header";
import { staggerContainer, fadeUp, marketingInView } from "@/lib/motion";

// Placeholder content, clearly labeled as illustrative rather than claiming real customers yet —
// structured so real quotes can drop in later without a rebuild (per the master prompt's
// explicit instruction not to read as fabricated testimonials).
const SAMPLE_QUOTES = [
  {
    quote:
      "This is the kind of result a business running Taptapstar could expect: a steady lift in Google reviews within the first month, with zero extra effort from the front counter.",
    name: "Sample quote",
    role: "Illustrative — restaurant owner",
  },
  {
    quote:
      "The employee leaderboard is exactly the kind of feature that gets a team genuinely competing to ask for reviews.",
    name: "Sample quote",
    role: "Illustrative — multi-location chain",
  },
  {
    quote:
      "Being able to see analytics per location, without juggling spreadsheets, is the whole pitch for an agency managing several clients.",
    name: "Sample quote",
    role: "Illustrative — agency partner",
  },
];

export function Testimonials() {
  return (
    <section className="bg-bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <SectionHeader
          eyebrow="What businesses will say"
          title="Illustrative sample quotes"
          description={"We're early — these are sample quotes showing the kind of feedback we expect, not real customer reviews yet."}
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={marketingInView}
          className="mt-14 grid gap-6 md:grid-cols-3"
        >
          {SAMPLE_QUOTES.map((t, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Card variant="standard" className="h-full p-6">
                <Quote className="size-6 text-brand/50" />
                <p className="mt-4 text-body-sm text-text-secondary italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-5 border-t border-border-default pt-4">
                  <p className="text-body-sm font-semibold text-text-primary">{t.name}</p>
                  <p className="text-caption text-text-muted">{t.role}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
