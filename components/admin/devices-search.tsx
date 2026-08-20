"use client";

import { useEffect, useState } from "react";
import { Search, Radio } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge, type DomainStatus } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { SkeletonTable } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";

type DeviceRow = {
  id: string;
  code: string;
  type: string;
  status: string;
  source: string;
  accountName: string | null;
  locationName: string | null;
  createdAt: string;
};

const ANY = "any";

export function DevicesSearch({ initialStatus }: { initialStatus?: string }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(initialStatus ?? ANY);
  const [source, setSource] = useState(ANY);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<DeviceRow[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const handle = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ q, page: String(page) });
      if (status !== ANY) params.set("status", status);
      if (source !== ANY) params.set("source", source);
      fetch(`/api/admin/devices?${params.toString()}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => {
          setRows(data.devices ?? []);
          setTotalPages(data.totalPages ?? 1);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [q, status, source, page]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search by code…"
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any status</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="deactivated">Deactivated</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={source}
          onValueChange={(v) => {
            setSource(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any source</SelectItem>
            <SelectItem value="generated">Generated</SelectItem>
            <SelectItem value="imported">Imported</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <SkeletonTable rows={8} columns={6} />
      ) : !rows || rows.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="No devices match your filters"
          description="Try a different code, status, or source."
        />
      ) : (
        <>
          {/* Theme guideline §6: horizontal scroll is an explicit escape hatch for genuinely
              wide data (6 columns), not the primary mobile pattern — never let this table's
              columns squeeze/overflow the 375px viewport instead. */}
          <div className="overflow-x-auto rounded-lg border border-border-default">
            <table className="w-full min-w-[640px] text-body-sm">
              <thead className="bg-bg-muted text-left text-caption font-medium text-text-muted">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Account</th>
                  <th className="p-3">Location</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id} className="border-t border-border-default hover:bg-bg-muted/50">
                    <td className="p-3 font-mono text-caption">{d.code}</td>
                    <td className="p-3">{d.type}</td>
                    <td className="p-3">
                      <StatusBadge status={d.status as DomainStatus} />
                    </td>
                    <td className="p-3">
                      <Badge variant="neutral">{d.source}</Badge>
                    </td>
                    <td className="p-3 text-text-muted">{d.accountName ?? "—"}</td>
                    <td className="p-3 text-text-muted">{d.locationName ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-caption text-text-muted">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
