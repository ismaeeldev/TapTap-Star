"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, type DomainStatus } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { SkeletonTable } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";

type AccountRow = {
  id: string;
  name: string;
  billingEmail: string;
  type: string;
  status: string;
  agencyStatus: string;
  createdAt: string;
  deviceCount: number;
};

export function AccountsSearch() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AccountRow[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const handle = setTimeout(() => {
      setLoading(true);
      fetch(`/api/admin/accounts?q=${encodeURIComponent(q)}&page=${page}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => {
          setRows(data.accounts ?? []);
          setTotalPages(data.totalPages ?? 1);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [q, page]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted" />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search by business name or email…"
          className="pl-9"
        />
      </div>

      {loading ? (
        <SkeletonTable rows={6} columns={5} />
      ) : !rows || rows.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No accounts match your search"
          description="Try a different name or email."
          action={
            q && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setQ("");
                  setPage(1);
                }}
              >
                Clear search
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* Theme guideline §6: horizontal scroll is an explicit escape hatch for genuinely
              wide data (5 columns incl. an email address), not the primary mobile pattern —
              never let this table's columns squeeze/overflow the 375px viewport instead. */}
          <div className="overflow-x-auto rounded-lg border border-border-default">
            <table className="w-full min-w-[560px] text-body-sm">
              <thead className="bg-bg-muted text-left text-caption font-medium text-text-muted">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Devices</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="border-t border-border-default hover:bg-bg-muted/50">
                    <td className="p-3">
                      <Link href={`/admin/accounts/${a.id}`} className="font-medium text-brand hover:underline">
                        {a.name}
                      </Link>
                    </td>
                    <td className="p-3 text-text-muted">{a.billingEmail}</td>
                    <td className="p-3">
                      <Badge variant="neutral">{a.type}</Badge>
                      {a.type === "agency" && a.agencyStatus !== "approved" && (
                        <span className="ml-1 text-caption text-text-muted">({a.agencyStatus})</span>
                      )}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={a.status as DomainStatus} />
                    </td>
                    <td className="p-3">{a.deviceCount}</td>
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
