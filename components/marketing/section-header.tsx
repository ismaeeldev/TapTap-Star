"use client";

import { motion } from "framer-motion";
import { fadeUp, marketingInView } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={marketingInView}
      className={cn("mx-auto max-w-2xl text-center", className)}
    >
      <p className="text-caption font-semibold uppercase tracking-wide text-brand">{eyebrow}</p>
      <h2 className="mt-3 font-display text-display-lg font-bold text-text-primary">{title}</h2>
      {description ? (
        <p className="mt-3 text-body-sm text-text-muted">{description}</p>
      ) : null}
    </motion.div>
  );
}
