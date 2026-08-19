import { SkeletonTable } from "@/components/shared/skeletons";

export default function Loading() {
  return <SkeletonTable rows={6} columns={5} />;
}
