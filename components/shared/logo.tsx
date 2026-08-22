"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

function LogoMark({
  className,
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  const uid = React.useId().replace(/:/g, "");
  const gradId = `tts-mark-grad-${variant}-${uid}`;
  const glowId = `tts-mark-glow-${uid}`;
  const from = variant === "dark" ? "#3B82F6" : "#1A56E8";
  const to = variant === "dark" ? "#2DD4BF" : "#14B8A6";

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-9 shrink-0 drop-shadow-sm", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
        {variant === "dark" && (
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      <rect
        width="40"
        height="40"
        rx="10"
        fill={`url(#${gradId})`}
        filter={variant === "dark" ? `url(#${glowId})` : undefined}
      />
      <path
        d="M11 20c0-2.2 1-4.2 2.6-5.5M8.5 20c0-3.4 1.6-6.4 4.1-8.3"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.95"
      />
      <path
        d="M26.5 12.2l1.35 4.15h4.35l-3.5 2.55 1.35 4.15-3.55-2.55-3.55 2.55 1.35-4.15-3.5-2.55h4.35L26.5 12.2z"
        fill="white"
      />
      <circle cx="14.5" cy="20" r="2.35" fill="white" />
    </svg>
  );
}

// App-wide logo — light/dark mark variants + "Taptapstar" wordmark. Callers size via className.
export function Logo({
  className,
  iconOnly = false,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const variant = mounted && resolvedTheme === "dark" ? "dark" : "light";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 font-display font-bold tracking-tight",
        className
      )}
    >
      <LogoMark variant={variant} />
      {!iconOnly && (
        <span className="text-h4 text-text-primary">
          Taptap<span className="gradient-text">star</span>
        </span>
      )}
    </span>
  );
}
