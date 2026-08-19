import * as React from "react";
import { cn } from "@/lib/utils";

// Theme guideline section 0.1/0.3 — reserved for 1-3 key words in a hero H1, never body copy.
export function GradientText({
  className,
  as: Tag = "span",
  ...props
}: React.ComponentProps<"span"> & { as?: "span" | "em" }) {
  return <Tag className={cn("gradient-text", className)} {...props} />;
}
