"use client";

// Real Step 9 route wiring (/api/contact), re-themed for Step 11's polish pass: inline
// field-level validation (theme section 8.3), action-loading on submit (section 8.1), success
// toast + inline confirmation (section 8.4), error toast with Retry.
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contactFormSchema } from "@/lib/validation";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type FieldErrors = Partial<Record<"name" | "email" | "message", string>>;

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    const parsed = contactFormSchema.safeParse({ name, email, message });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({
        name: flat.name?.[0],
        email: flat.email?.[0],
        message: flat.message?.[0],
      });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? "Failed to send message");
      }
      setSent(true);
      toast.success("Message sent — we'll get back to you soon.");
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
          We&apos;ve received your message and will get back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="space-y-1.5">
        <Label htmlFor="contact-name">Name</Label>
        <Input
          id="contact-name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            const r = contactFormSchema.shape.name.safeParse(name);
            setErrors((prev) => ({ ...prev, name: r.success ? undefined : r.error.issues[0]?.message }));
          }}
          aria-invalid={!!errors.name}
          className={cn(errors.name && "border-danger focus-visible:border-danger")}
        />
        {errors.name && <p className="text-caption text-danger">{errors.name}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-email">Email</Label>
        <Input
          id="contact-email"
          type="email"
          placeholder="you@business.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => {
            const r = contactFormSchema.shape.email.safeParse(email);
            setErrors((prev) => ({ ...prev, email: r.success ? undefined : r.error.issues[0]?.message }));
          }}
          aria-invalid={!!errors.email}
          className={cn(errors.email && "border-danger focus-visible:border-danger")}
        />
        {errors.email && <p className="text-caption text-danger">{errors.email}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          placeholder="Tell us about your business and how many locations you have..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onBlur={() => {
            const r = contactFormSchema.shape.message.safeParse(message);
            setErrors((prev) => ({ ...prev, message: r.success ? undefined : r.error.issues[0]?.message }));
          }}
          aria-invalid={!!errors.message}
          rows={5}
          className={cn(errors.message && "border-danger focus-visible:border-danger")}
        />
        {errors.message && <p className="text-caption text-danger">{errors.message}</p>}
      </div>

      <Button type="submit" disabled={loading} size="hero">
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
