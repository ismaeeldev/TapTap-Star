"use client";

// Minimal functional contact form — gives trigger #9 (contact-form-submitted) a real call site.
// Full marketing-page visual polish (gradient-mesh, bento, etc.) is Step 11's job per
// 04_PROJECT_STATE.md's locked decisions list; this is deliberately simple, not a placeholder.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? "Failed to send message");
      }
      setSent(true);
      toast.success("Message sent — we'll get back to you soon.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong", {
        action: { label: "Retry", onClick: () => handleSubmit(e) },
      });
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return <p className="text-muted-foreground">Thanks — your message has been sent.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <Input
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Textarea
        placeholder="How can we help?"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        rows={5}
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
