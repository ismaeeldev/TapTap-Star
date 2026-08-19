import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

// Re-themed per ../../AgentGuide/01_THEME_GUIDELINE.md section 4: status pill spec —
// radius-full, caption type, uppercase, mapped to device/account status colors.
const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-caption font-medium tracking-wide uppercase whitespace-nowrap transition-all focus-visible:ring-3 focus-visible:ring-brand/30 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        active: "bg-success/10 text-success",
        unassigned: "bg-bg-muted text-text-muted",
        deactivated: "bg-danger/10 text-danger",
        pending: "bg-warning/10 text-warning",
        neutral: "bg-brand-subtle text-brand",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

function Badge({
  className,
  variant = "neutral",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
