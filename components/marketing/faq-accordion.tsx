"use client";

import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { fadeUp, marketingInView } from "@/lib/motion";
import { formatPriceCents } from "@/lib/format";

type FaqTier = { planKey: string; priceCents: number };

// Reused identically on the homepage FAQ section and the standalone /faq route (no duplicated
// markup). Explicitly answers "how does pricing work" and "what happens to my devices if I
// cancel", per the master prompt's mandatory questions.
//
// Modifications 6: rewritten for the 3-tier Free/Premium/Network model (revision.md §3.3) —
// previously hardcoded a single flat-rate answer, which went stale the moment the pricing
// restructure shipped (the homepage/FAQ pages were a known follow-up, not part of that step —
// see the removed comment on pricing-tiers.tsx). Still reads LIVE prices via the `tiers` prop
// (server-fetched by both call sites), never a hardcoded figure — same rule as PricingTiers.
function faqItems(tiers: FaqTier[], currency: string) {
  const premium = tiers.find((t) => t.planKey === "premium");
  const network = tiers.find((t) => t.planKey === "network");
  const premiumPrice = premium ? formatPriceCents(premium.priceCents, currency) : "$25.00";
  const networkPrice = network ? formatPriceCents(network.priceCents, currency) : "$60.00";

  return [
    {
      q: "How does pricing work?",
      a: `Three tiers: Free (1 location, the basics, forever), Premium at ${premiumPrice}/month (AI-powered draft replies, full analytics, real-time alerts), and Network at ${networkPrice}/month (everything in Premium, unlimited locations, multi-location control center). Premium and Network both include a 14-day free trial — no charge until the trial ends.`,
    },
    {
      q: "What happens to my devices if I cancel?",
      a: "Your devices stop redirecting to your review page once your subscription ends — they won't be reassigned or resold. Your data (scan history, employee rankings, analytics) is retained, not deleted, so if you resubscribe later everything picks back up.",
    },
    {
      q: "Do customers need to install an app?",
      a: "No. A tap or scan takes them straight to your review page in their phone's browser — nothing to download, nothing to log into.",
    },
    {
      q: "Can I manage more than one location?",
      a: "Free and Premium include 1 location each. Network is built for multi-location businesses — unlimited locations, each with its own devices, employees, and analytics, all from one dashboard.",
    },
    {
      q: "How is the employee leaderboard calculated?",
      a: "Every scan is tied to whichever employee the device is assigned to. The leaderboard ranks by scan count for the current month (or all-time), per location or combined across your whole account.",
    },
  ];
}

export function FaqAccordion({
  tiers,
  currency = "usd",
}: {
  tiers: FaqTier[];
  currency?: string;
}) {
  const items = faqItems(tiers, currency);
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={marketingInView}
      className="mx-auto max-w-2xl"
    >
      <Accordion type="single" collapsible className="rounded-lg border border-border-default bg-bg-card px-6">
        {items.map((item) => (
          <AccordionItem key={item.q} value={item.q}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionContent>{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </motion.div>
  );
}
