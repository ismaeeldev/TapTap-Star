import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Flexible base per ../../AgentGuide/01_THEME_GUIDELINE.md section 8.2 — every screen that can
// legitimately be empty configures its own icon/copy/action here; never reuse one hardcoded
// "no data" instance across screens. See the theme guideline's table for the required
// copy direction per screen.
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border-default bg-bg-surface px-6 py-16 text-center",
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-brand-subtle text-brand">
        <Icon className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="text-h4 font-semibold text-text-primary">{title}</p>
        {description && (
          <p className="max-w-sm text-body-sm text-text-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
