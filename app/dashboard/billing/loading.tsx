import { SkeletonCard, SkeletonTable } from "@/components/shared/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-40" />
      <SkeletonCard />
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <SkeletonTable rows={4} columns={4} />
      </div>
    </div>
  );
}
