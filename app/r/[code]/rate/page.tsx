import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { devices } from "@/lib/db/schema";
import { GradientMesh } from "@/components/shared/gradient-mesh";
import { Logo } from "@/components/shared/logo";
import { RateWizard } from "./rate-wizard";
import { redirect } from "next/navigation";

// /r/[code]/rate — the review-filtering star picker. The ONE deliberate exception to
// app/r/[code]/route.ts's "no rendered UI, ever" rule — that route only redirects here at all
// when the location has explicitly turned filtering on. Server component: resolves the device
// fresh (never trusts anything about state from the redirecting route beyond the code itself)
// so a device deactivated/removed between the tap and this page load fails safely instead of
// showing a stale star picker for a device that no longer exists.
export default async function RatePage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ scanId?: string }>;
}) {
  const { code } = await params;
  const { scanId } = await searchParams;

  const device = await db.query.devices.findFirst({
    where: sql`lower(${devices.code}) = lower(${code})`,
  });

  // Not active anymore, or genuinely doesn't exist — fall back to the same branded pages
  // app/r/[code]/route.ts itself would have shown for these exact states, rather than a
  // star-picker page with nothing real behind it.
  if (!device || device.status !== "active" || !device.locationId) {
    redirect(`/r/deactivated`);
  }

  return (
    <GradientMesh className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <div className="mb-8">
        <Logo className="scale-110" />
      </div>
      <div className="w-full max-w-md">
        <RateWizard code={code} scanId={scanId} />
      </div>
    </GradientMesh>
  );
}
