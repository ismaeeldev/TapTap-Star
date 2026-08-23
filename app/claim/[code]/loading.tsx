import { GradientMesh } from "@/components/shared/gradient-mesh";
import { SkeletonCard } from "@/components/shared/skeletons";

// Was missing entirely — the page does two sequential DB round-trips (device lookup, then
// auth()) before it can render any of its four branches (not-found/deactivated/wizard/redirect),
// so a slow request showed a blank white screen instead of a skeleton, unlike every other public
// route in this app (e.g. app/e/[token]/loading.tsx).
export default function Loading() {
  return (
    <GradientMesh className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <SkeletonCard />
      </div>
    </GradientMesh>
  );
}
