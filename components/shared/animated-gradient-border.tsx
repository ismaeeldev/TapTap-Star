import * as React from "react";
import { cn } from "@/lib/utils";

// Theme guideline section 0.1/0.3 — reserved for the SINGLE highest-priority CTA per page
// (hero button, recommended pricing card, claim wizard's final "Activate Device" button).
// Using this on more than one element per page defeats the effect — see section 5.3.
export function AnimatedGradientBorder({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("gradient-border-cta p-[2px]", className)}
      {...props}
    >
      <div className="rounded-[calc(var(--radius-md)-2px)] bg-bg-card">
        {children}
      </div>
    </div>
  );
}
