"use client";

import { motion } from "framer-motion";
import {
  Star,
  UtensilsCrossed,
  Building2,
  Users2,
  Coffee,
  Scissors,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/marketing/section-header";
import { staggerContainer, fadeUp, marketingInView } from "@/lib/motion";

// Modifications 6 (client PDF, Sept 3-4): "This needs to be filled with reviews, use AI to
// create some of them." Redesigned from the earlier explicit "Preview"-badge grid (still no
// real customer reviews exist yet) into a normal-reading testimonials section — star ratings,
// name + business line — with a single section-level disclaimer instead of a badge on every
// card, so the section reads like a typical testimonials block at a glance while staying honest
// that these are illustrative, not real submitted reviews (never present as genuine collected
// feedback — no invented business ever gets treated as a real, identifiable company). Names/
// businesses below are generic placeholders (first name only, generic business type), not
// modeled on any real person or company.
//
// Modifications 8 (client PDF, item 2): "I want this review profiles to have some images of
// their business on their names, some logo or something more credible." A plain letter-in-
// circle read as too generic. Since these are illustrative personas, not real companies, an
// actual photo/logo would misleadingly imply a specific real business exists — a business-type
// icon mark (a coffee cup for the café owner, scissors for the salon, etc.) reads as a real
// branded mark rather than a bare initial, without fabricating a company that doesn't exist.
const TESTIMONIALS: {
  quote: string;
  name: string;
  role: string;
  icon: LucideIcon;
}[] = [
  {
    quote:
      "A steady lift in Google reviews within the first month, with zero extra effort from the front counter — exactly the kind of result we wanted.",
    name: "Marcus",
    role: "Restaurant owner",
    icon: UtensilsCrossed,
  },
  {
    quote:
      "The leaderboard is the reason it actually works. Staff started asking for reviews on their own because it turned into something worth competing over.",
    name: "Priya",
    role: "Multi-location manager",
    icon: Building2,
  },
  {
    quote:
      "Per-location analytics without juggling spreadsheets for every client — that's the whole pitch for an agency managing several businesses at once.",
    name: "Daniel",
    role: "Agency partner",
    icon: Users2,
  },
  {
    quote:
      "Setup took minutes. Tap the card, leave a review, done — no app, no login, nothing for the customer to figure out.",
    name: "Sofia",
    role: "Café owner",
    icon: Coffee,
  },
  {
    quote:
      "Being able to see which employee drove which review changed how we run shift incentives entirely.",
    name: "Ethan",
    role: "Salon owner",
    icon: Scissors,
  },
  {
    quote:
      "Switched from a QR-only sign to NFC cards and scans roughly doubled. Customers just tap and go.",
    name: "Layla",
    role: "Retail store manager",
    icon: ShoppingBag,
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
          {TESTIMONIALS.map((t) => {
            const Icon = t.icon;
            return (
              <motion.div key={t.name} variants={fadeUp}>
                <Card variant="standard" className="h-full p-6">
                  <Stars />
                  <p className="mt-4 text-body-sm text-text-secondary">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-5 flex items-center gap-3 border-t border-border-default pt-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand">
                      <Icon className="size-4.5" aria-hidden />
                    </div>
                    <div>
                      <p className="text-body-sm font-semibold text-text-primary">{t.name}</p>
                      <p className="text-caption text-text-muted">{t.role}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
