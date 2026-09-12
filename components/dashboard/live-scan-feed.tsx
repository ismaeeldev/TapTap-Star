"use client";

import * as React from "react";
import useSWR from "swr";
import { AnimatePresence, motion } from "framer-motion";
import { Radio, WifiOff, ChevronLeft, ChevronRight } from "lucide-react";
import { listItemEnter } from "@/lib/motion";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

type ScanRow = {
  id: string;
  scannedAt: string;
  deviceCode: string;
  locationName: string;
  employeeName: string | null;
};

type ScansResponse = {
  scans: ScanRow[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasNextPage: boolean;
};

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to load scans");
    return res.json();
  });

// Modifications 7 (client PDF, item 2): "I want this to be in minutes, then hours and after 24
// hours 1 day and x hours, not only minutes and hours." Previously capped out at raw hours
// (client's screenshot showed "82h ago") — past 24h this now reads "Nd Nh ago" instead.
function timeAgo(iso: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h ago` : `${days}d ago`;
}

// Client-side polling live scan feed — every 5s, per the locked decision (05_MASTER_BUILD_GUIDE.md
// Step 5.2): NOT websockets/SSE. Shown on /dashboard (overview) and the device detail page.
//
// Modifications 8 (client PDF, item 4): "I don't want this list to be infinite, I want it to
// have a maximum of 10 scans registered on each page, at the bottom of this I want the option
// to continue seeing on the next page." Real server-side pagination (app/api/scans/recent's own
// comment), 10 per page exactly as requested. The 5s auto-refresh stays ONLY on page 1 — once a
// user pages forward to browse older scans, live-refreshing underneath them would be
// disorienting (rows shifting/reordering while reading), so paging past 1 pauses the poll; going
// back to page 1 resumes it. This matches what "live feed" vs. "history browsing" should each
// actually feel like, rather than applying one behavior to both.
export function LiveScanFeed({ deviceId, className }: { deviceId?: string; className?: string }) {
  const [page, setPage] = React.useState(1);
  const url =
    `/api/scans/recent?page=${page}` + (deviceId ? `&deviceId=${deviceId}` : "");
  const { data, error, isLoading } = useSWR<ScansResponse>(url, fetcher, {
    refreshInterval: page === 1 ? 5000 : 0,
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

  // Poll failed but we still have data from an earlier successful fetch (SWR keeps stale data
  // around by default) — keep showing it rather than blanking the feed, but surface a clear
  // "this may be stale" signal instead of silently pretending everything's fine (category 4,
  // stuck/uncertain-state audit).
  if (error && !data) {
    return (
      <div className={className}>
        <p className="flex items-center gap-1.5 text-body-sm text-danger">
          <WifiOff className="size-4 shrink-0" />
          Couldn&apos;t load the live scan feed.
        </p>
      </div>
    );
  }

  const scans = data?.scans ?? [];

  if (scans.length === 0 && page === 1) {
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
    <div className={className}>
      <ul className="space-y-2">
        {error && (
          <li className="mb-2 flex items-center gap-1.5 rounded-md bg-warning/10 px-3 py-2 text-caption text-warning">
            <WifiOff className="size-3.5 shrink-0" />
            Connection issue — showing the last update, retrying automatically…
          </li>
        )}
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

      {data && data.totalCount > data.pageSize && (
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border-default pt-3">
          <p className="text-caption text-text-muted">
            Page {data.page} of {Math.max(1, Math.ceil(data.totalCount / data.pageSize))}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" /> Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!data.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
