"use client";

import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/lib/motion";

// Wraps the /dashboard bento grid so its tiles stagger-reveal on load, per
// 01_THEME_GUIDELINE.md section 5.2. The grid's direct children each get the fadeUp variant via
// this wrapper's context — see BentoTileMotion usage inline in page.tsx's BentoGrid children.
export function DashboardReveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible">
      {children}
    </motion.div>
  );
}

export const bentoTileMotionProps = {
  variants: fadeUp,
};
