import { WifiOff } from "lucide-react";
import { GradientMesh } from "@/components/shared/gradient-mesh";
import { Logo } from "@/components/shared/logo";
import { OfflineRetryButton } from "./offline-retry-button";

// PWA offline fallback (standard §9) — served by public/sw.js when a navigation request fails
// with no network. Styled consistently with the other branded state pages (app/not-found.tsx),
// but deliberately has NO Button-asChild-Link navigation: a "take me home" link would itself be a
// navigation request that fails again while offline, right back into this same page. The only
// interactive element is a client-side reload button (offline-retry-button.tsx), which correctly
// either succeeds (network is back) or reloads back to this same offline page (still down) rather
// than ever producing a dead link.
export const metadata = {
  title: "You're offline — Taptapstar",
};

export default function OfflinePage() {
  return (
    <GradientMesh className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo className="scale-110" />
      <div className="flex size-16 items-center justify-center rounded-full bg-brand-subtle text-brand">
        <WifiOff className="size-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-display-md font-display font-bold text-text-primary">
          You&apos;re offline
        </h1>
        <p className="max-w-md text-body text-text-secondary">
          We couldn&apos;t reach Taptapstar. Check your connection and try again — your dashboard
          needs a live connection for billing and scan data to stay accurate.
        </p>
      </div>
      <OfflineRetryButton />
    </GradientMesh>
  );
}
