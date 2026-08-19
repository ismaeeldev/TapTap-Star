"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

// Single stagger-reveal child, used inside <DashboardReveal> (which provides the
// staggerContainer parent variants) — per 01_THEME_GUIDELINE.md section 5.2.
export function RevealItem({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div variants={fadeUp} className={cn("contents", className)}>
      {children}
    </motion.div>
  );
}
