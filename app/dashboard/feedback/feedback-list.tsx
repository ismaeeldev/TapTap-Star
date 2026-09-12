"use client";

import * as React from "react";
import { Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { toast } from "@/lib/toast";

type FeedbackRow = {
  id: string;
  rating: number;
  comment: string | null;
  contactName: string | null;
  contactEmail: string | null;
  status: "new" | "reviewed";
  createdAt: string;
  locationName: string;
  deviceCode: string | null;
  employeeName: string | null;
  aiReplyStatus: "idle" | "generating" | "drafted" | "failed";
  aiReplyDraft: string | null;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((v) => (
        <Star
          key={v}
          className={
            "size-4 " + (v <= rating ? "fill-warning text-warning" : "text-border-default")
          }
        />
      ))}
    </div>
  );
}

export function FeedbackList({ initialRows }: { initialRows: FeedbackRow[] }) {
  const [rows, setRows] = React.useState(initialRows);

  async function toggleStatus(id: string, next: "new" | "reviewed") {
    // Optimistic — a plain status toggle, no meaningful conflict/rollback surface (worst case a
    // second manual toggle re-corrects it, same as any simple two-state UI toggle elsewhere).
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: next } : r)));
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: next === "reviewed" ? "new" : "reviewed" } : r)));
        toast.error("Failed to update — check your connection and try again");
      }
    } catch {
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: next === "reviewed" ? "new" : "reviewed" } : r)));
      toast.error("Failed to update — check your connection and try again");
    }
  }

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.id} className="rounded-lg border border-border-default bg-bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Stars rating={r.rating} />
                <StatusBadge status={r.status} />
              </div>
              <p className="text-caption text-text-muted">
                {r.locationName}
                {r.deviceCode ? ` · Device ${r.deviceCode}` : ""}
                {r.employeeName ? ` · ${r.employeeName}` : ""} ·{" "}
                {new Date(r.createdAt).toLocaleString()}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toggleStatus(r.id, r.status === "new" ? "reviewed" : "new")}
            >
              {r.status === "new" ? "Mark reviewed" : "Mark unreviewed"}
            </Button>
          </div>

          {r.comment && <p className="mt-3 text-body-sm text-text-secondary">&ldquo;{r.comment}&rdquo;</p>}

          {(r.contactName || r.contactEmail) && (
            <p className="mt-2 text-caption text-text-muted">
              Contact: {[r.contactName, r.contactEmail].filter(Boolean).join(" · ")}
            </p>
          )}

          {/* Modifications 9 (client PDF, item 1): AI-answered reviews — a drafted reply, never
              auto-sent (no guaranteed channel back to an anonymous customer). The owner copies
              and sends it themselves wherever they'd normally respond. */}
          {r.aiReplyStatus === "drafted" && r.aiReplyDraft && (
            <div className="mt-3 rounded-md border border-brand/30 bg-brand-subtle p-3">
              <p className="flex items-center gap-1.5 text-caption font-medium text-brand">
                <Sparkles className="size-3.5" />
                AI-drafted reply
              </p>
              <p className="mt-1.5 text-body-sm text-text-primary">{r.aiReplyDraft}</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(r.aiReplyDraft!);
                    toast.success("Reply copied to clipboard");
                  } catch {
                    toast.error("Couldn't copy — select and copy the text manually");
                  }
                }}
              >
                Copy reply
              </Button>
            </div>
          )}
          {r.aiReplyStatus === "failed" && (
            <p className="mt-2 text-caption text-danger">AI reply generation failed for this one.</p>
          )}
        </div>
      ))}
    </div>
  );
}
