import { SkeletonCard } from "@/components/shared/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-32" />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
