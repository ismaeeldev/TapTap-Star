"use client";

import { motion } from "framer-motion";
import { Smartphone, Star, Wifi } from "lucide-react";
import { SectionHeader } from "@/components/marketing/section-header";
import { staggerContainer, fadeUp, marketingInView } from "@/lib/motion";

const STEPS = [
  {
    icon: Wifi,
    title: "Customer taps or scans",
    body: "A Taptapstar NFC device or QR code sits on the counter, table, or receipt — one tap or scan is all it takes.",
  },
  {
    icon: Smartphone,
    title: "Instant redirect",
    body: "They land straight on your Google review page — no app to download, no account to create.",
  },
  {
    icon: Star,
    title: "Review left, scan logged",
    body: "The scan is logged to your dashboard in real time — location, employee, and timestamp, ready for the leaderboard and analytics.",
  },
];

// Original illustration of the tap/scan -> Google review flow, built from primitives (not the
// client's raw plate photo — that asset lives under ../Refrence/ and is explicitly not used
// directly here, only as loose inspiration for the rounded-plate silhouette). Pure SVG/CSS.
function FlowIllustration() {
  return (
    <motion.svg
      viewBox="0 0 480 200"
      className="mx-auto w-full max-w-xl"
      role="img"
      aria-label="A customer taps a Taptapstar device, which redirects them to leave a Google review"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={marketingInView}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      <defs>
        <linearGradient id="plateGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--brand)" />
          <stop offset="100%" stopColor="var(--gradient-2)" />
        </linearGradient>
      </defs>

      {/* device plate */}
      <rect x="24" y="60" width="120" height="80" rx="20" fill="url(#plateGradient)" opacity="0.15" />
      <rect x="24" y="60" width="120" height="80" rx="20" fill="none" stroke="var(--brand)" strokeWidth="2" />
      <circle cx="84" cy="100" r="22" fill="none" stroke="var(--brand)" strokeWidth="2" />
      <path
        d="M74 100a10 10 0 0 1 20 0M70 100a14 14 0 0 1 28 0"
        stroke="var(--brand)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* animated arc showing the tap/scan travelling */}
      <motion.path
        d="M150 100 C 220 40, 260 40, 330 100"
        fill="none"
        stroke="var(--gradient-2)"
        strokeWidth="2.5"
        strokeDasharray="6 6"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={marketingInView}
        transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* google review star card */}
      <rect x="330" y="55" width="130" height="90" rx="16" fill="var(--bg-card)" stroke="var(--border-default)" strokeWidth="1.5" />
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d="M0 -6 L1.7 -1.8 L6 -1.8 L2.6 1 L3.7 5.5 L0 3 L-3.7 5.5 L-2.6 1 L-6 -1.8 L-1.7 -1.8 Z"
          fill="var(--warning)"
          transform={`translate(${357 + i * 18}, 90) scale(0.9)`}
        />
      ))}
      <rect x="345" y="105" width="100" height="6" rx="3" fill="var(--bg-muted)" />
      <rect x="345" y="118" width="70" height="6" rx="3" fill="var(--bg-muted)" />
    </motion.svg>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20 md:px-8 md:py-28">
      <SectionHeader
        eyebrow="How it works"
        title="From tap to five stars in seconds"
      />

      <div className="mt-14">
        <FlowIllustration />
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={marketingInView}
        className="mt-14 grid gap-8 md:grid-cols-3"
      >
        {STEPS.map((step, i) => (
          <motion.div key={step.title} variants={fadeUp} className="text-center md:text-left">
            <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-brand-subtle text-brand md:mx-0">
              <step.icon className="size-5" />
            </div>
            <p className="mt-4 text-caption font-semibold uppercase tracking-wide text-text-muted">
              Step {i + 1}
            </p>
            <h3 className="mt-1 text-h3 font-semibold text-text-primary">{step.title}</h3>
            <p className="mt-2 text-body text-text-secondary">{step.body}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
