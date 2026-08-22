import { SearchX } from "lucide-react";
import { GradientMesh } from "@/components/shared/gradient-mesh";
import { Logo } from "@/components/shared/logo";

// Branded "this code doesn't exist" page for /r/[code] hitting an unknown device code.
// Theme guideline section 0.3 explicitly lists 404/claim-error pages as a gradient-mesh use
// case — never a raw error/500.
export default function RedirectNotFoundPage() {
  return (
    <GradientMesh className="flex min-h-svh flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-8">
        <Logo className="scale-110" />
      </div>
      <div className="flex size-16 items-center justify-center rounded-full bg-brand-subtle text-brand">
        <SearchX className="size-8" />
      </div>
      <h1 className="mt-6 text-h3 font-semibold text-text-primary">This code isn&apos;t recognized</h1>
      <p className="mt-2 max-w-sm text-body-sm text-text-muted">
        We couldn&apos;t find a Taptapstar device for this link. Double-check the QR code or NFC
        tap and try again.
      </p>
    </GradientMesh>
  );
}
