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
// what a real physical device is used for — scanning), with the manual code-entry box (the only
// option that existed before this) hidden by default rather than removed — kept for future
// device batches / anyone without a working camera, reachable via the small link below the
// scanner button. qr-scanner (nimiq/qr-scanner) is loaded dynamically so its ~50KB decode engine
// never ships in the initial bundle for users who never open the scanner.
export function ActivateDeviceWidget() {
  const router = useRouter();
  const [scanOpen, setScanOpen] = useState(false);
  const [showManual, setShowManual] = useState(false);
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

      {showManual ? (
        <ManualActivateForm />
      ) : (
        <button
          type="button"
          onClick={() => setShowManual(true)}
          className="inline-flex items-center gap-1.5 text-caption text-text-muted underline-offset-2 transition-colors hover:text-text-primary hover:underline"
        >
          <KeyRound className="size-3.5" />
          Don&apos;t have a camera? Enter the code manually
        </button>
      )}
    </div>
  );
}
