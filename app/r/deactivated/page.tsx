import { PowerOff } from "lucide-react";
import { GradientMesh } from "@/components/shared/gradient-mesh";
import { Logo } from "@/components/shared/logo";

// Branded "this device is no longer active" page — shown for deactivated devices (and as a
// safety fallback for an active device with corrupted location data). Theme guideline section
// 0.3 explicitly lists claim-error pages as a gradient-mesh use case, not a raw error page.
export default function DeactivatedDevicePage() {
  return (
    <GradientMesh className="flex min-h-svh flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="flex size-16 items-center justify-center rounded-full bg-brand-subtle text-brand">
        <PowerOff className="size-8" />
      </div>
      <h1 className="mt-6 text-h3 font-semibold text-text-primary">This device is no longer active</h1>
      <p className="mt-2 max-w-sm text-body-sm text-text-muted">
        This Taptapstar device has been deactivated. If you think this is a mistake, please
        contact the business or reach out to support.
      </p>
    </GradientMesh>
  );
}
