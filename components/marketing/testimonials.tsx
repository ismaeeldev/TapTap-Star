"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/marketing/section-header";
import { staggerContainer, fadeUp, marketingInView } from "@/lib/motion";

// Modifications 6 (client PDF, Sept 3-4): "This needs to be filled with reviews, use AI to
// create some of them." Redesigned from the earlier explicit "Preview"-badge grid (still no
// real customer reviews exist yet) into a normal-reading testimonials section — star ratings,
// initials avatar, name + business line — with a single section-level disclaimer instead of a
// badge on every card, so the section reads like a typical testimonials block at a glance while
// staying honest that these are illustrative, not real submitted reviews (never present as
// genuine collected feedback — no invented business ever gets treated as a real, identifiable
// company). Names/businesses below are generic placeholders (first name only, generic business
// type), not modeled on any real person or company.
const TESTIMONIALS = [
  {
    quote:
      "A steady lift in Google reviews within the first month, with zero extra effort from the front counter — exactly the kind of result we wanted.",
    name: "Marcus",
    role: "Restaurant owner",
    initial: "M",
  },
  {
    quote:
      "The leaderboard is the reason it actually works. Staff started asking for reviews on their own because it turned into something worth competing over.",
    name: "Priya",
    role: "Multi-location manager",
    initial: "P",
  },
  {
    quote:
      "Per-location analytics without juggling spreadsheets for every client — that's the whole pitch for an agency managing several businesses at once.",
    name: "Daniel",
    role: "Agency partner",
    initial: "D",
  },
  {
    quote:
      "Setup took minutes. Tap the card, leave a review, done — no app, no login, nothing for the customer to figure out.",
    name: "Sofia",
    role: "Café owner",
    initial: "S",
  },
  {
    quote:
      "Being able to see which employee drove which review changed how we run shift incentives entirely.",
    name: "Ethan",
    role: "Salon owner",
    initial: "E",
  },
  {
    quote:
      "Switched from a QR-only sign to NFC cards and scans roughly doubled. Customers just tap and go.",
    name: "Layla",
    role: "Retail store manager",
    initial: "L",
  },
];

function Stars() {
  return (
    <div className="flex gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="size-4 fill-warning text-warning" />
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="bg-bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <SectionHeader
          eyebrow="What businesses are saying"
          title="Built for teams that live off reviews"
          description="Illustrative feedback based on what businesses tell us they need — not yet collected from live customers."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={marketingInView}
          className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {TESTIMONIALS.map((t) => (
            <motion.div key={t.name} variants={fadeUp}>
              <Card variant="standard" className="h-full p-6">
                <Stars />
                <p className="mt-4 text-body-sm text-text-secondary">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-5 flex items-center gap-3 border-t border-border-default pt-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-body-sm font-semibold text-brand">
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-body-sm font-semibold text-text-primary">{t.name}</p>
                    <p className="text-caption text-text-muted">{t.role}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
