import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Skeleton family per ../../AgentGuide/01_THEME_GUIDELINE.md section 8.1 — every `loading.tsx`
// uses one of these, matching the real layout it's standing in for, never a bare spinner.

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border-default bg-bg-card p-6", className)}>
      <Skeleton className="mb-4 h-5 w-1/3" />
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border-default">
      <div className="flex gap-4 border-b border-border-default bg-bg-muted p-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-border-default p-3 last:border-0">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStatTile() {
  return (
    <div className="space-y-3 rounded-lg border border-border-default bg-bg-card p-6">
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-5 w-14 rounded-full" />
    </div>
  );
}

export function SkeletonBentoGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
      <div className="sm:col-span-2 sm:row-span-2 lg:col-span-2 lg:row-span-2">
        <SkeletonStatTile />
      </div>
      <SkeletonStatTile />
      <SkeletonStatTile />
    </div>
  );
}
