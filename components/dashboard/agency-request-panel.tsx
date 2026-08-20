"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { toast } from "@/lib/toast";

type AgencyStatus = "none" | "pending" | "approved" | "rejected";

export function AgencyRequestPanel({
  agencyStatus,
  rejectionReason,
}: {
  agencyStatus: AgencyStatus;
  rejectionReason: string | null;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleRequest() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/agency/request", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Failed to submit request");
        return;
      }
      toast.success("Agency access requested — an admin will review it shortly");
      router.refresh();
    } catch {
      toast.error("Failed to submit request — check your connection and try again");
    } finally {
      setSubmitting(false);
    }
  }

  if (agencyStatus === "approved") {
    // Already an agency — settings has nothing left to show here, /dashboard/clients owns it.
    return null;
  }

  return (
    <div className="space-y-4 rounded-lg border border-border-default bg-bg-card p-6">
      <div className="flex items-center gap-2">
        <Building2 className="size-5 text-brand" />
        <h2 className="text-h4 font-semibold text-text-primary">Agency access</h2>
      </div>

      {agencyStatus === "none" && (
        <>
          <p className="text-body-sm text-text-muted">
            Manage multiple client businesses from one login. Request agency access and a
            Taptapstar admin will review it.
          </p>
          <Button onClick={handleRequest} disabled={submitting}>
            {submitting ? "Submitting…" : "Request Agency Access"}
          </Button>
        </>
      )}

      {agencyStatus === "pending" && (
        <div className="flex items-start gap-3 rounded-md bg-bg-muted p-4">
          <Clock className="mt-0.5 size-5 shrink-0 text-text-muted" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-text-primary">Your request is pending review</p>
              <StatusBadge status="pending" />
            </div>
            <p className="text-body-sm text-text-muted">
              A Taptapstar admin will approve or reject this request. You&apos;ll keep using your
              account normally in the meantime.
            </p>
          </div>
        </div>
      )}

      {agencyStatus === "rejected" && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-md bg-danger/10 p-4">
            <XCircle className="mt-0.5 size-5 shrink-0 text-danger" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-text-primary">Your request was rejected</p>
                <StatusBadge status="rejected" />
              </div>
              {rejectionReason && (
                <p className="text-body-sm text-text-muted">Reason: {rejectionReason}</p>
              )}
            </div>
          </div>
          <Button onClick={handleRequest} disabled={submitting}>
            {submitting ? "Submitting…" : "Request Again"}
          </Button>
        </div>
      )}
    </div>
  );
}
