import type { Variants } from "framer-motion";

// Reusable Framer Motion variants per ../../AgentGuide/01_THEME_GUIDELINE.md section 5.
// Import from here rather than redefining ad hoc per component, so timing/easing stays
// consistent across the app.

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.18, ease: "easeOut" },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

// Word-by-word hero headline reveal (theme section 0.1) — split text into words, wrap each in
// a motion.span using this variant inside a parent using staggerContainer.
export const wordReveal: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

// Dashboard route-change transition (theme section 5.2) — subtle fade+slide, not a white flash.
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.18, ease: "easeOut" },
};

// Live-feed entry pulse (theme section 5.2) — new scan sliding/fading into a list.
export const listItemEnter: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

// Timings, centralized so components reference these instead of hardcoding ms values.
export const motionDuration = {
  ui: 0.15, // dashboard interactions, 120-220ms range per theme section 5.1
  marketing: 0.5, // marketing reveals, 400-800ms range
};
