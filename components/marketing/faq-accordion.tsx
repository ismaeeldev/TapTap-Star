"use client";

import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { fadeUp } from "@/lib/motion";

// Reused identically on the homepage FAQ section and the standalone /faq route (no duplicated
// markup). Explicitly answers "how does pricing work" and "what happens to my devices if I
// cancel", per the master prompt's mandatory questions.
export const FAQ_ITEMS = [
  {
    q: "How does pricing work?",
    a: "One flat rate — $29.90/month per business account. That covers unlimited devices, unlimited employees, unlimited locations, full analytics, and the employee leaderboard. There are no per-device fees and no hidden tiers.",
  },
  {
    q: "What happens to my devices if I cancel?",
    a: "Your devices stop redirecting to your Google review page once your subscription ends — they won't be reassigned or resold. Your data (scan history, employee rankings, analytics) is retained, not deleted, so if you resubscribe later everything picks back up.",
  },
  {
    q: "Do customers need to install an app?",
    a: "No. A tap or scan takes them straight to your Google review page in their phone's browser — nothing to download, nothing to log into.",
  },
  {
    q: "Can I manage more than one location?",
    a: "Yes — multi-location management is included in the flat rate. Add as many locations as you run, each with its own devices, employees, and analytics, all from one dashboard.",
  },
  {
    q: "How is the employee leaderboard calculated?",
    a: "Every scan is tied to whichever employee the device is assigned to. The leaderboard ranks by scan count for the current month (or all-time), per location or combined across your whole account.",
  },
];

export function FaqAccordion() {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-15%" }}
      className="mx-auto max-w-2xl"
    >
      <Accordion type="single" collapsible className="rounded-lg border border-border-default bg-bg-card px-6">
        {FAQ_ITEMS.map((item) => (
          <AccordionItem key={item.q} value={item.q}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionContent>{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </motion.div>
  );
}
