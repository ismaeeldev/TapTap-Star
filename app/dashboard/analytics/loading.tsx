import { SkeletonStatTile } from "@/components/shared/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SkeletonStatTile />
        <SkeletonStatTile />
        <SkeletonStatTile />
        <SkeletonStatTile />
      </div>
      {/* Chart-shaped skeleton (theme guideline section 8.1 — matches the real chart's layout,
          not a generic spinner): a title bar, then a flat baseline with a wandering "line" shape
          suggested via staggered-height bars, so the loading state at least hints at a
          time-series chart rather than an unrelated blank card. */}
      <div className="space-y-4 rounded-lg border border-border-default bg-bg-card p-6">
        <Skeleton className="h-5 w-40" />
        <div className="flex h-64 items-end gap-2">
          {[40, 65, 50, 80, 60, 90, 55, 70, 45, 85, 60, 75].map((h, i) => (
            <Skeleton key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
