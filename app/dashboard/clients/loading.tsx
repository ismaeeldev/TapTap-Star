import { SkeletonStatTile, SkeletonTable } from "@/components/shared/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-32" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SkeletonStatTile />
        <SkeletonStatTile />
        <SkeletonStatTile />
        <SkeletonStatTile />
      </div>
      <SkeletonTable rows={5} columns={4} />
    </div>
  );
}
