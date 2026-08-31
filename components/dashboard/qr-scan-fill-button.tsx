"use client";

// Client-reported gap (Modifications 5 follow-up): "Plates doesn't have alphanumeric codes.
// Only QR codes." — the card/plate device type has no printed code to read off of, so any flow
// that requires the owner to TYPE the code by hand is unusable for that device type; they'd have
// to leave the dashboard, scan the QR in a separate camera app, then manually copy the code back
// in. This reuses the exact same camera-scan pattern already built for device activation
// (activate-device-widget.tsx) as a small, reusable "scan to fill a text field" button, so any
// code-confirmation flow (starting with Reset device) can offer scan-to-fill instead of forcing
// manual typing.
import { useEffect, useRef, useState } from "react";
import type QrScannerType from "qr-scanner";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/lib/toast";

export function QrScanFillButton({ onScan }: { onScan: (code: string) => void }) {
  const [scanOpen, setScanOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScannerType | null>(null);

  useEffect(() => {
    if (!scanOpen) return;
    let cancelled = false;

    (async () => {
      const { default: QrScanner } = await import("qr-scanner");
      QrScanner.WORKER_PATH = "/qr-scanner-worker.min.js";
      if (cancelled || !videoRef.current) return;

      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          const raw = result.data.trim();
          // Same extraction as activate-device-widget.tsx — a real printed device QR encodes
          // the full redirect URL (…/r/{code}), not a bare code.
          const code = raw.split(/[/?#]/).filter(Boolean).pop() ?? raw;
          scanner.stop();
          setScanOpen(false);
          onScan(code);
        },
        {
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
          "Couldn't access your camera — check your browser's camera permission, or type the code instead."
        );
        setScanOpen(false);
      }
    })();

    return () => {
      cancelled = true;
      scannerRef.current?.stop();
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, [scanOpen, onScan]);

  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={() => setScanOpen(true)}>
        <Camera className="size-3.5" />
        Scan QR instead
      </Button>

      <Dialog open={scanOpen} onOpenChange={setScanOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan the device&apos;s QR code</DialogTitle>
          </DialogHeader>
          <div className="overflow-hidden rounded-lg bg-black">
            <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
          </div>
          <p className="text-center text-caption text-text-muted">
            Point your camera at the QR code printed on the device.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
