import * as React from "react";
import { cn } from "@/lib/utils";

// Theme guideline section 0.4 — bento grid spec: 4/6-col desktop with a 2x2 hero tile, 2-col
// tablet, 1-col mobile stacked in priority order. Used for the marketing "why Taptapstar"
// section and the /dashboard overview home — NOT for dense list/table views (section 0.3).
export function BentoGrid({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4",
        className
      )}
      {...props}
    />
  );
}

type BentoSpan = "hero" | "wide" | "default";

const spanClasses: Record<BentoSpan, string> = {
  hero: "sm:col-span-2 sm:row-span-2 lg:col-span-2 lg:row-span-2",
  wide: "sm:col-span-2 lg:col-span-2",
  default: "",
};

export function BentoTile({
  className,
  span = "default",
  glow = false,
  children,
  ...props
}: React.ComponentProps<"div"> & { span?: BentoSpan; glow?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border-default bg-bg-card p-6 shadow-xs spotlight",
        spanClasses[span],
        glow && "glow-success",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
