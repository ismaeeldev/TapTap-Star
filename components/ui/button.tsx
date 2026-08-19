import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

// Re-themed per ../../AgentGuide/01_THEME_GUIDELINE.md section 4 — do not revert to shadcn's
// default slate/zinc palette or default sizing (44px/52px heights are a deliberate touch-target
// choice, see section 6).
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent text-sm font-medium whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:ring-3 focus-visible:ring-brand/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-text-on-primary shadow-xs hover:bg-brand-hover hover:scale-[1.02]",
        secondary:
          "bg-bg-card text-text-primary border-border-default hover:border-border-strong hover:bg-bg-muted",
        ghost: "text-text-secondary hover:text-text-primary hover:bg-bg-muted",
        destructive: "bg-danger text-text-on-primary hover:bg-danger/90",
        link: "text-brand underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 gap-1.5 px-4 has-[>svg]:px-3.5",
        hero: "h-13 gap-2 px-6 text-base has-[>svg]:px-5",
        sm: "h-9 gap-1.5 px-3 text-[0.8rem] has-[>svg]:px-2.5",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "primary",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
