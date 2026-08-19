import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Re-themed per ../../AgentGuide/01_THEME_GUIDELINE.md section 4: bg-muted fill,
        // border-default default, 2px brand ring + subtle glow on focus, 44px height.
        "h-11 w-full min-w-0 rounded-sm border border-border-default bg-bg-muted px-3 text-body transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text-primary placeholder:text-text-muted focus-visible:border-brand focus-visible:border-2 focus-visible:ring-4 focus-visible:ring-brand-subtle disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger aria-invalid:ring-3 aria-invalid:ring-danger/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
