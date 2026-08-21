import { SkeletonTable } from "@/components/shared/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-40 animate-pulse rounded bg-bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded bg-bg-muted" />
      </div>
      <SkeletonTable rows={6} columns={4} />
    </div>
  );
}
