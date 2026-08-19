import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-sm border border-border-default bg-bg-muted px-3 py-2.5 text-body transition-colors outline-none placeholder:text-text-muted focus-visible:border-brand focus-visible:border-2 focus-visible:ring-4 focus-visible:ring-brand-subtle disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger aria-invalid:ring-3 aria-invalid:ring-danger/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
