"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { animate, useInView, useMotionValue, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

// The signature "analytics" component per ../../AgentGuide/01_THEME_GUIDELINE.md section 4 —
// label -> big number (animated count-up on scroll-into-view, section 5.2) -> trend badge.
export function StatTile({
  label,
  value,
  trend,
  glow = false,
  className,
}: {
  label: string;
  value: number;
  trend?: { direction: "up" | "down"; percent: number };
  glow?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(0);

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      if (ref.current) ref.current.textContent = value.toLocaleString();
      return;
    }
    const controls = animate(motionValue, value, {
      duration: 1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = Math.round(v).toLocaleString();
      },
    });
    return () => controls.stop();
  }, [inView, value, motionValue, reduceMotion]);

  return (
    <div className={cn("relative space-y-2", glow && "glow-success", className)}>
      <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className="text-display-md font-display font-bold tabular-nums text-text-primary">
        <span ref={ref}>0</span>
      </p>
      {trend && (
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-caption font-semibold",
            trend.direction === "up" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
          )}
        >
          {trend.direction === "up" ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )}
          {trend.percent}%
        </span>
      )}
    </div>
  );
}
