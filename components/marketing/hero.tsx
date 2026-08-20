"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GradientMesh } from "@/components/shared/gradient-mesh";
import { GradientText } from "@/components/shared/gradient-text";
import { Button } from "@/components/ui/button";
import { HeroPreviewCards } from "./hero-preview-cards";
import { staggerContainer, wordReveal } from "@/lib/motion";

// Hero headline split word-by-word for the stagger reveal (theme section 0.1/5.2). The 2
// gradient-text words are the client's own core value prop ("Google reviews").
const HEADLINE = ["Turn", "every", "tap", "into", "a", "Google", "review"];
const GRADIENT_WORDS = new Set(["Google", "review"]);

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function MarketingHero() {
  const sectionRef = React.useRef<HTMLElement>(null);
  const cardsRef = React.useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (reduceMotion) return;
    if (!sectionRef.current || !cardsRef.current) return;

    // Signature GSAP ScrollTrigger moment (theme section 5.2): as the user scrolls from the hero
    // into "how it works", the floating preview cards pin briefly and settle/scale down while the
    // hero content recedes — a pin + reveal transition, not a plain scroll-past.
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=60%",
          scrub: 0.6,
          pin: cardsRef.current,
        },
      });
      tl.to(cardsRef.current, { scale: 0.85, y: 40, opacity: 0.4, ease: "none" });
    }, sectionRef);

    return () => ctx.revert();
  }, [reduceMotion]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden pt-36 pb-20 md:pt-44 md:pb-28">
      <GradientMesh className="absolute inset-0 -z-10" />

      <div className="mx-auto max-w-5xl px-6 text-center md:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mx-auto inline-flex flex-wrap justify-center gap-x-3 gap-y-1"
        >
          <h1 className="font-display text-display-xl leading-[1.02] font-extrabold tracking-tight text-text-primary">
            {HEADLINE.map((word, i) => (
              <motion.span
                key={`${word}-${i}`}
                variants={wordReveal}
                className="inline-block"
              >
                {GRADIENT_WORDS.has(word) ? (
                  <GradientText as="span">{word}</GradientText>
                ) : (
                  word
                )}
                {i < HEADLINE.length - 1 ? " " : ""}
              </motion.span>
            ))}
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-6 max-w-2xl text-body-lg text-text-secondary"
        >
          NFC and QR devices that send happy customers straight to your Google review page —
          plus the dashboard to track every scan, rank your employees, and prove it&apos;s
          working.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          {/* Deliberately a plain primary button, not AnimatedGradientBorder — the pricing
              card below is this page's one animated-gradient-border CTA per theme section
              0.1's one-per-page rule (see the Step 11 device-usage audit in
              04_PROJECT_STATE.md). */}
          <Button asChild size="hero">
            <Link href="/signup">
              Get started <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary" size="hero">
            <Link href="#how-it-works">See how it works</Link>
          </Button>
        </motion.div>
      </div>

      <div ref={cardsRef}>
        <HeroPreviewCards />
      </div>
    </section>
  );
}
