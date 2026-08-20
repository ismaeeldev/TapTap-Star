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
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error("Failed to open the billing portal — check your connection and try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={disabled || loading}>
      {loading ? "Opening…" : "Manage payment method & invoices"}
    </Button>
  );
}
