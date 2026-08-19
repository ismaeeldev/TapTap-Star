"use client";

import useSWR from "swr";
import { AnimatePresence, motion } from "framer-motion";
import { Radio } from "lucide-react";
import { listItemEnter } from "@/lib/motion";
import { EmptyState } from "@/components/shared/empty-state";

type ScanRow = {
  id: string;
  scannedAt: string;
  deviceCode: string;
  locationName: string;
  employeeName: string | null;
};

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to load scans");
    return res.json();
  });

function timeAgo(iso: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

// Client-side polling live scan feed — every 5s, per the locked decision (05_MASTER_BUILD_GUIDE.md
// Step 5.2): NOT websockets/SSE. Shown on /dashboard (overview) and the device detail page.
export function LiveScanFeed({ deviceId, className }: { deviceId?: string; className?: string }) {
  const url = deviceId ? `/api/scans/recent?deviceId=${deviceId}` : "/api/scans/recent";
  const { data, error, isLoading } = useSWR<{ scans: ScanRow[] }>(url, fetcher, {
    refreshInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className={className}>
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 rounded-md bg-bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <p className="text-body-sm text-danger">Couldn&apos;t load the live scan feed.</p>
      </div>
    );
  }

  const scans = data?.scans ?? [];

  if (scans.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          icon={Radio}
          title="No scans yet"
          description="Scans will appear here in real time as customers tap or scan your devices."
          className="border-none bg-transparent py-8"
        />
      </div>
    );
  }

  return (
    <ul className={className}>
      <AnimatePresence initial={false}>
        {scans.map((scan) => (
          <motion.li
            key={scan.id}
            layout
            variants={listItemEnter}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-between gap-3 rounded-md border border-border-default bg-bg-card px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-body-sm font-medium text-text-primary">
                {scan.employeeName ?? "Unassigned"} · {scan.locationName}
              </p>
              <p className="truncate text-caption text-text-muted">Device {scan.deviceCode}</p>
            </div>
            <span className="shrink-0 text-caption text-text-muted tabular-nums">
              {timeAgo(scan.scannedAt)}
            </span>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
