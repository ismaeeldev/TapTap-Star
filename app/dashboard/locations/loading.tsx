import { SkeletonTable } from "@/components/shared/skeletons";

export default function Loading() {
  return <SkeletonTable rows={5} columns={3} />;
}
