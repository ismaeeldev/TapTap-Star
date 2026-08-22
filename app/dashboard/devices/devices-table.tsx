"use client";

import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DeviceRow = {
  id: string;
  code: string;
  type: string;
  status: "unassigned" | "active" | "deactivated";
  location: { id: string; name: string } | null;
  employee: { id: string; name: string } | null;
  scanCount: number;
};

// Responsive per 01_THEME_GUIDELINE.md section 6 — a real table at md+ widths, stacked cards on
// mobile. Row click navigates to /dashboard/devices/[id] for reassign/deactivate.
export function DevicesTable({ devices }: { devices: DeviceRow[] }) {
  const router = useRouter();

  return (
    <>
      <Card className="hidden overflow-hidden py-0 md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead className="text-right">Scans</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((d) => (
              <TableRow
                key={d.id}
                className="cursor-pointer"
                onClick={() => router.push(`/dashboard/devices/${d.id}`)}
              >
                <TableCell className="font-mono">{d.code}</TableCell>
                <TableCell>
                  <StatusBadge status={d.status} />
                </TableCell>
                <TableCell>{d.location?.name ?? "—"}</TableCell>
                <TableCell>{d.employee?.name ?? "—"}</TableCell>
                <TableCell className="text-right font-semibold">
                  {d.scanCount.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="space-y-3 md:hidden">
        {devices.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => router.push(`/dashboard/devices/${d.id}`)}
            className="w-full rounded-lg border border-border-default bg-bg-card p-4 text-left shadow-xs transition-shadow active:shadow-none"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-body-sm text-text-primary">{d.code}</span>
              <StatusBadge status={d.status} />
            </div>
            <div className="space-y-1 text-body-sm text-text-muted">
              <p>Location: {d.location?.name ?? "—"}</p>
              <p>Employee: {d.employee?.name ?? "—"}</p>
              <p>Scans: {d.scanCount.toLocaleString()}</p>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
