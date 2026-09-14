"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type QrScannerType from "qr-scanner";
import { Camera, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/lib/toast";
import { ManualActivateForm } from "./manual-activate-form";

// Client-requested: a real camera QR scanner as the primary way to activate a device (matching
// what a real physical device is used for — scanning). qr-scanner (nimiq/qr-scanner) is loaded
// dynamically so its ~50KB decode engine never ships in the initial bundle for users who never
// open the scanner.
//
// Modifications 9 (client PDF, item 4) briefly hid the scanner entirely ("Can I hide this?
// Dont have a camera....") — re-enabled per the client's urgent follow-up (Sept 14). That same
// follow-up also asked to hide the manual "Don't have a camera? Enter the code manually" link
// specifically — camera scan should be the only visible way in for now, manual entry reserved
// for a future re-enable. SHOW_MANUAL_ENTRY_LINK controls only the visible fallback link;
// ManualActivateForm itself, and the auto-reveal-on-real-camera-failure path below, are left
// alone on purpose — a user whose camera permission is denied or hardware genuinely fails still
// needs *some* way to activate a device, so that safety net stays even while the link is hidden.
const SHOW_CAMERA_SCAN = true;
const SHOW_MANUAL_ENTRY_LINK = false;
export function ActivateDeviceWidget() {
  const router = useRouter();
  const [scanOpen, setScanOpen] = useState(false);
  // Also the last-resort safety net for a real camera failure below (denied permission, no
  // hardware) — setShowManual(true) there reveals ManualActivateForm directly even though
  // SHOW_MANUAL_ENTRY_LINK is off, so a real user isn't stuck with a dead scan button.
  const [showManual, setShowManual] = useState(!SHOW_CAMERA_SCAN);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScannerType | null>(null);

  useEffect(() => {
    if (!scanOpen) return;
    let cancelled = false;

    (async () => {
      const { default: QrScanner } = await import("qr-scanner");
      // Bundlers can't reliably resolve this pre-built worker file's own relative path once
      // it's inside a Next.js chunk — served as a static asset instead (copied into public/ at
      // build time, see 04_PROJECT_STATE.md). Marked @deprecated in the library's types but
      // still fully functional; it's the documented workaround for exactly this bundler case.
      QrScanner.WORKER_PATH = "/qr-scanner-worker.min.js";
      if (cancelled || !videoRef.current) return;

      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          const raw = result.data.trim();
          // A real printed device QR encodes the full redirect URL (…/r/{code}), not a bare
          // code — pull just the code out so this works whether the QR contains a bare code or
          // the full URL.
          const code = raw.split(/[/?#]/).filter(Boolean).pop() ?? raw;
          scanner.stop();
          setScanOpen(false);
          router.push(`/claim/${encodeURIComponent(code)}`);
        },
        {
          // Fires continuously while no code is in frame — expected, not a real error to surface.
          onDecodeError: () => {},
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: "environment",
        }
      );
      scannerRef.current = scanner;

      try {
        await scanner.start();
      } catch {
        toast.error(
          "Couldn't access your camera — check your browser's camera permission, or enter the code manually below."
        );
        setScanOpen(false);
        setShowManual(true);
      }
    })();

    return () => {
      cancelled = true;
      scannerRef.current?.stop();
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, [scanOpen, router]);

  return (
    <div className="flex flex-col items-center gap-3">
      {SHOW_CAMERA_SCAN && (
        <>
          <Button type="button" onClick={() => setScanOpen(true)}>
            <Camera className="size-4" />
            Scan QR code
          </Button>

          <Dialog open={scanOpen} onOpenChange={setScanOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Scan a device&apos;s QR code</DialogTitle>
              </DialogHeader>
              <div className="overflow-hidden rounded-lg bg-black">
                <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
              </div>
              <p className="text-center text-caption text-text-muted">
                Point your camera at the device&apos;s QR code — it activates automatically once
                recognized.
              </p>
            </DialogContent>
          </Dialog>
        </>
      )}

      {showManual ? (
        // Rendered when SHOW_CAMERA_SCAN is off, a real camera failure fired the setShowManual
        // safety net above, or the client re-enables SHOW_MANUAL_ENTRY_LINK below — never for a
        // plain "I'd rather type it" click while camera scan is working, per the client's
        // current request.
        <ManualActivateForm />
      ) : SHOW_MANUAL_ENTRY_LINK ? (
        <button
          type="button"
          onClick={() => setShowManual(true)}
          className="inline-flex items-center gap-1.5 text-caption text-text-muted underline-offset-2 transition-colors hover:text-text-primary hover:underline"
        >
          <KeyRound className="size-3.5" />
          Don&apos;t have a camera? Enter the code manually
        </button>
      ) : null}
    </div>
  );
}
