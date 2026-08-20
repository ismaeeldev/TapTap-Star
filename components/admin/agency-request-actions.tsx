"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";

export function AgencyRequestActions({ accountId }: { accountId: string }) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  async function handleApprove() {
    setApproving(true);
    try {
      const res = await fetch(`/api/admin/agency-requests/${accountId}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Failed to approve request");
        return;
      }
      toast.success("Agency request approved");
      router.refresh();
    } catch {
      toast.error("Failed to approve request — check your connection and try again");
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    setRejecting(true);
    try {
      const res = await fetch(`/api/admin/agency-requests/${accountId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Failed to reject request");
        return;
      }
      toast.success("Agency request rejected");
      setRejectOpen(false);
      setReason("");
      router.refresh();
    } catch {
      toast.error("Failed to reject request — check your connection and try again");
    } finally {
      setRejecting(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={handleApprove} disabled={approving || rejecting}>
        {approving ? "Approving…" : "Approve"}
      </Button>
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setRejectOpen(true)}
          disabled={approving || rejecting}
        >
          Reject
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this agency request?</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Textarea
              placeholder="Reason (optional) — shown to the business on their settings page"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={handleReject} disabled={rejecting}>
              {rejecting ? "Rejecting…" : "Reject request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
