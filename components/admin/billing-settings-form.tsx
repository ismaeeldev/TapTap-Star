"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/lib/toast";

function formatDollars(cents: number) {
  return (cents / 100).toFixed(2);
}

export function BillingSettingsForm({ initialPriceCents }: { initialPriceCents: number }) {
  const router = useRouter();
  const [dollarsInput, setDollarsInput] = useState(formatDollars(initialPriceCents));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const parsedCents = Math.round(parseFloat(dollarsInput || "0") * 100);
  const isValid = Number.isFinite(parsedCents) && parsedCents >= 100;
  const isUnchanged = parsedCents === initialPriceCents;

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/billing-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceCents: parsedCents }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Failed to update the price");
        return;
      }
      toast.success("Default plan price updated — a new Stripe Price was created");
      setConfirmOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to update the price — check your connection and try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-sm space-y-4 rounded-lg border border-border-default bg-bg-card p-5">
      <div className="space-y-1.5">
        <Label htmlFor="price">Flat price (per business / month, USD)</Label>
        <div className="flex items-center gap-2">
          <span className="text-body-sm text-text-muted">$</span>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="1"
            value={dollarsInput}
            onChange={(e) => setDollarsInput(e.target.value)}
          />
        </div>
        <p className="text-caption text-text-muted">
          Current: ${formatDollars(initialPriceCents)}/month. Changing this creates a new Stripe
          Price — existing subscriptions move to it at their next natural billing sync, not
          instantly.
        </p>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Button disabled={!isValid || isUnchanged} onClick={() => setConfirmOpen(true)}>
          Save price
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change the default plan price?</DialogTitle>
            <DialogDescription>
              This will change the price every business account is billed on their next
              natural billing sync — from ${formatDollars(initialPriceCents)}/month to $
              {formatDollars(parsedCents)}/month. A new Stripe Price is created (the old one is
              never deleted, only stops being used for new subscriptions).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Confirm price change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
