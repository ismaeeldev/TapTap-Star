import * as React from "react";
import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  iconOnly = false,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display font-bold", className)}>
      <span className="flex size-8 items-center justify-center rounded-md bg-brand text-text-on-primary">
        <Radio className="size-4" />
      </span>
      {!iconOnly && <span className="text-h4 text-text-primary">Taptapstar</span>}
    </span>
  );
}
