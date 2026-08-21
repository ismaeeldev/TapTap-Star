"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

export function BillingPortalButton({ disabled }: { disabled?: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        toast.error(data.message ?? "Failed to open the billing portal");
        setLoading(false);
        return;
      }
      // Leave `loading` true here (deliberately not reset in a `finally`) — we're about to
      // navigate away to Stripe, so the button should keep showing its "taking you there" state
      // rather than flashing back to its idle label right before the page unloads.
      window.location.href = data.url;
    } catch {
      toast.error("Failed to open the billing portal — check your connection and try again");
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={disabled || loading}>
      {loading ? "Taking you to Stripe…" : "Manage payment method & invoices"}
    </Button>
  );
}
