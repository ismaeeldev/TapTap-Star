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
  const contentRef = React.useRef<HTMLDivElement>(null);
  const cardsRef = React.useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (reduceMotion) return;

    const section = sectionRef.current;
    const content = contentRef.current;
    const cards = cardsRef.current;
    if (!section || !content || !cards) return;

    // Signature GSAP ScrollTrigger moment (theme section 5.2): pin the hero while the floating
    // preview cards settle and the copy recedes, then release into "how it works".
    //
    // Critical: do NOT put overflow:hidden on the pinned section (or any ancestor) — that breaks
    // ScrollTrigger pinning and leaves transforms/spacers in a bad state that skips or freezes
    // Framer whileInView reveals on every section below the hero.
    //
    // Preview cards are `hidden` below md — pinning an empty/zero-height block on mobile
    // corrupts pin-spacing and breaks the scroll-reveal chain underneath.
    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "+=65%",
            scrub: 0.65,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        tl.to(content, { opacity: 0.2, y: -40, ease: "none" }, 0).to(
          cards,
          { scale: 0.88, y: 48, opacity: 0.35, ease: "none" },
          0
        );
      }, section);

      return () => ctx.revert();
    });

    const refreshId = window.requestAnimationFrame(() => ScrollTrigger.refresh());
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);

    return () => {
      window.cancelAnimationFrame(refreshId);
      window.removeEventListener("load", onLoad);
      mm.revert();
    };
  }, [reduceMotion]);

  return (
    <section ref={sectionRef} className="relative pt-36 pb-16 md:pt-44 md:pb-24">
      {/* Clip mesh only — never the section — so pin spacers stay correct. */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <GradientMesh className="absolute inset-0" />
      </div>

      <div ref={contentRef} className="mx-auto max-w-5xl px-6 text-center will-change-transform md:px-8">
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

      <div ref={cardsRef} className="will-change-transform">
        <HeroPreviewCards />
      </div>
    </section>
  );
}
