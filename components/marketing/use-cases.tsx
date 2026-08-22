"use client";

import { motion } from "framer-motion";
import { Building2, Store, Users2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/marketing/section-header";
import { staggerContainer, fadeUp, marketingInView } from "@/lib/motion";

const CASES = [
  {
    icon: Store,
    title: "Restaurants & cafes",
    body: "A device on every table or counter — staff naturally point to it after a great meal or order.",
  },
  {
    icon: Building2,
    title: "Multi-location chains",
    body: "Manage every location's devices, staff, and review performance from one account — no spreadsheets.",
  },
  {
    icon: Users2,
    title: "Agencies",
    body: "Manage review-generation for multiple client businesses under one agency account, with per-client visibility.",
  },
];

export function UseCases() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:px-8 md:py-28">
      <SectionHeader
        eyebrow="Use cases"
        title="Built for any business that wants more reviews"
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={marketingInView}
        className="mt-14 grid gap-6 md:grid-cols-3"
      >
        {CASES.map((c) => (
          <motion.div key={c.title} variants={fadeUp}>
            <Card variant="standard" className="h-full p-6 transition-shadow duration-300 hover:shadow-md">
              <div className="flex size-11 items-center justify-center rounded-full bg-brand-subtle text-brand">
                <c.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-h3 font-semibold text-text-primary">{c.title}</h3>
              <p className="mt-2 text-body-sm text-text-secondary">{c.body}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
