import * as React from "react";
import { cn } from "@/lib/utils";

// Theme guideline section 0.1/0.3 — gradient-mesh background for hero sections, auth screens,
// dashboard empty states, and claim/redirect error pages. NOT for dense dashboard/admin screens
// — see section 0.3's "where to use each device" table.
export function GradientMesh({
  className,
  noise = true,
  children,
  ...props
}: React.ComponentProps<"div"> & { noise?: boolean }) {
  return (
    <div className={cn("gradient-mesh relative", className)} {...props}>
      {noise && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
