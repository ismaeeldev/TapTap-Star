import { SkeletonCard } from "@/components/shared/skeletons";

export default function Loading() {
  return (
    <div className="space-y-4">
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
