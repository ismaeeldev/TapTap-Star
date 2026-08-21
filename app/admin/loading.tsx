import { SkeletonStatTile } from "@/components/shared/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-40 animate-pulse rounded bg-bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded bg-bg-muted" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SkeletonStatTile />
        <SkeletonStatTile />
        <SkeletonStatTile />
        <SkeletonStatTile />
      </div>
    </div>
  );
}
