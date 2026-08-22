import * as React from "react";
import { cn } from "@/lib/utils";

// The mark: gradient rounded square, tap-ripple + review-star motif. Fixed intrinsic size
// (size-9) — callers scale the whole lockup via Logo's className (e.g. `scale-110`) rather than
// resizing the mark alone, so the mark/wordmark ratio never drifts out of proportion.
function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-9 shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="tts-mark-grad" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--brand)" />
          <stop offset="1" stopColor="var(--gradient-2)" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#tts-mark-grad)" />
      {/* Tap ripples */}
      <path
        d="M11 20c0-2.2 1-4.2 2.6-5.5M8.5 20c0-3.4 1.6-6.4 4.1-8.3"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.95"
      />
      {/* Star */}
      <path
        d="M26.5 12.2l1.35 4.15h4.35l-3.5 2.55 1.35 4.15-3.55-2.55-3.55 2.55 1.35-4.15-3.5-2.55h4.35L26.5 12.2z"
        fill="white"
      />
      {/* Tap center dot */}
      <circle cx="14.5" cy="20" r="2.25" fill="white" />
    </svg>
  );
}

// The app-wide logo — gradient mark + "Taptaptar" wordmark, "star" in the brand gradient.
// `className` on the outer span is the sizing lever for callers (e.g. `scale-110` for a
// standalone branded page vs. the bare default for compact chrome like a navbar/sidebar) —
// see the call sites for the actual per-placement sizes chosen and why.
export function Logo({
  className,
  iconOnly = false,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-display font-bold tracking-tight", className)}>
      <LogoMark />
      {!iconOnly && (
        <span className="text-h4 text-text-primary">
          Taptap<span className="gradient-text">star</span>
        </span>
      )}
    </span>
  );
}
