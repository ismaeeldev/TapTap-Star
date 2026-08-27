"use client";

// Modeled on app/(marketing)/contact/contact-form.tsx, minus the name/email inputs — those are
// derived server-side from the session (see support/page.tsx) and shown here read-only so it's
// clear who the message is sent as, not editable free text a user could spoof.
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { dashboardSupportSchema } from "@/lib/validation";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export function SupportForm({ name, email }: { name: string; email: string }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    const parsed = dashboardSupportSchema.safeParse({ message });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? "Failed to send message");
      }
      setSent(true);
      toast.success("Message sent — the Taptapstar team will get back to you soon.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong", {
        action: { label: "Retry", onClick: () => submit() },
      });
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void submit();
  }

  if (sent) {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-3 rounded-lg border border-success/30 bg-success/5 px-6 py-12 text-center"
      >
        <CheckCircle2 className="size-10 text-success" />
        <p className="text-h4 font-semibold text-text-primary">Thanks — message sent</p>
        <p className="max-w-sm text-body-sm text-text-secondary">
          We&apos;ve received your message and will get back to you at {email} shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 rounded-lg border border-border-default bg-bg-card p-4">
        <div>
          <p className="text-caption uppercase text-text-muted">From</p>
          <p className="text-body-sm text-text-primary">{name}</p>
        </div>
        <div>
          <p className="text-caption uppercase text-text-muted">Email</p>
          <p className="text-body-sm text-text-primary">{email}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="support-message">Message</Label>
        <Textarea
          id="support-message"
          placeholder="Tell us what's going on — the more detail, the faster we can help."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onBlur={() => {
            const r = dashboardSupportSchema.shape.message.safeParse(message);
            setError(r.success ? undefined : r.error.issues[0]?.message);
          }}
          aria-invalid={!!error}
          rows={6}
          className={cn(error && "border-danger focus-visible:border-danger")}
        />
        {error && <p className="text-caption text-danger">{error}</p>}
      </div>

      <Button type="submit" disabled={loading} size="hero" className="self-start">
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Sending…
          </>
        ) : (
          "Send message"
        )}
      </Button>
    </form>
  );
}
