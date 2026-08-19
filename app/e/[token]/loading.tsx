import { SkeletonCard } from "@/components/shared/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <SkeletonCard />
    </div>
  );
}
