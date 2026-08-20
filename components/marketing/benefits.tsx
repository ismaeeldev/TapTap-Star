"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { staggerContainer, fadeUp } from "@/lib/motion";

const BENEFITS = [
  {
    title: "More 5-star reviews, faster",
    body: "Removing every step between a happy customer and the review box means far more of them actually leave one.",
  },
  {
    title: "Higher local search ranking",
    body: "Google rewards businesses with more (and more recent) reviews — Taptapstar keeps that flow steady.",
  },
  {
    title: "Built-in staff motivation",
    body: "The employee leaderboard turns review generation into something your team wants to win, not a chore.",
  },
  {
    title: "Proof it's working",
    body: "Real analytics, not guesswork — see exactly which location, device, and employee is driving results.",
  },
];

export function Benefits() {
  return (
    <section className="bg-bg-surface py-24">
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-caption font-semibold uppercase tracking-wide text-brand">
            Benefits
          </p>
          <h2 className="mt-3 font-display text-display-lg font-bold text-text-primary">
            Why businesses switch to Taptapstar
          </h2>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          className="mt-14 grid gap-8 sm:grid-cols-2"
        >
          {BENEFITS.map((b) => (
            <motion.div key={b.title} variants={fadeUp} className="flex gap-4">
              <CheckCircle2 className="mt-1 size-5 shrink-0 text-success" />
              <div>
                <h3 className="text-h4 font-semibold text-text-primary">{b.title}</h3>
                <p className="mt-1.5 text-body-sm text-text-secondary">{b.body}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
