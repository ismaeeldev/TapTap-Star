"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";

// Real-world activation is scanning a physical device's QR/NFC — but there was no way to
// activate one from inside the dashboard at all otherwise (no scanner, no manual entry), a real
// dead end for anyone testing/demoing without a physical device in hand, or a business owner who
// prefers to type the code printed on their card rather than scan it. This takes a bare code
// (e.g. "cpNeqxKzxC") and sends them into the same /claim/[code] wizard a real scan would.
export function ManualActivateForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      // toast.warning, not toast.error — this is a light input nudge, not a real failure, so it
      // should auto-dismiss (toast.error is deliberately permanent app-wide per the theme
      // guideline's "never auto-hide a real error" rule; this isn't one).
      toast.warning("Enter the device code first");
      return;
    }
    setSubmitting(true);
    router.push(`/claim/${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-2 sm:flex-row">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter device code (e.g. cpNeqxKzxC)"
        className="font-mono"
        aria-label="Device code"
      />
      <Button type="submit" disabled={submitting} className="shrink-0">
        {submitting ? "Opening…" : "Activate"}
        {!submitting && <ArrowRight className="size-4" />}
      </Button>
    </form>
  );
}
