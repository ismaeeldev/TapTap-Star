"use client";

import * as React from "react";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";

type Step = "rating" | "loading" | "feedback" | "submitted";

// Isolated as its own top-level function (not inline) — React Compiler's react-hooks/
// immutability rule flags a direct `window.location.href = ...` assignment written inline
// inside a component's event-handler closure as if it were mutating a value from render scope,
// even though `window` is a genuine external browser global, not component state. Same
// operation, same effect, no false positive once it's a plain function the compiler doesn't try
// to track render-scope ownership through.
function navigateAway(url: string) {
  window.location.href = url;
}

// Review-filtering feature's customer-facing star picker. No login, no account — a scanning
// customer's whole interaction is: tap a star, then either get redirected to the review
// platform (handled with a real window.location navigation, not a Next.js route change — this
// is leaving the app entirely) or see the private feedback form inline on this same page.
export function RateWizard({ code, scanId }: { code: string; scanId?: string }) {
  const [step, setStep] = React.useState<Step>("rating");
  const [rating, setRating] = React.useState<number | null>(null);
  const [hovered, setHovered] = React.useState<number | null>(null);
  const [comment, setComment] = React.useState("");
  const [contactName, setContactName] = React.useState("");
  const [contactEmail, setContactEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleStarClick(value: number) {
    setRating(value);
    setStep("loading");
    try {
      const res = await fetch("/api/public/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, rating: value, scanId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Something went wrong — please try again.");
        setStep("rating");
        return;
      }
      if (data.outcome === "redirect") {
        // A real, full navigation away from this app — matches app/r/[code]/route.ts's own
        // "customer leaves the app entirely" behavior for the non-filtered path.
        navigateAway(data.url);
        return;
      }
      setStep("feedback");
    } catch {
      toast.error("Network error — please check your connection and try again.");
      setStep("rating");
    }
  }

  async function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          rating,
          scanId,
          comment: comment.trim() || undefined,
          contactName: contactName.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message ?? "Something went wrong — please try again.");
        return;
      }
      setStep("submitted");
    } catch {
      toast.error("Network error — please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "submitted") {
    return (
      <Card variant="glass" className="text-center shadow-xl">
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <CheckCircle2 className="size-12 text-success" />
          <p className="text-h4 font-display font-semibold text-text-primary">Thank you</p>
          <p className="text-body-sm text-text-muted">
            Your feedback has been sent directly to the business. It won&apos;t be posted
            publicly.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (step === "feedback") {
    return (
      <Card variant="glass" className="shadow-xl">
        <CardHeader className="space-y-2">
          <CardTitle className="font-display text-display-md">
            We&apos;re sorry to hear that
          </CardTitle>
          <CardDescription className="text-body-sm">
            Tell us what went wrong — this goes directly to the business, not a public review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFeedbackSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="fb-comment">What happened?</Label>
              <Textarea
                id="fb-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us more (optional)"
                rows={4}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fb-name">Your name (optional)</Label>
              <Input id="fb-name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fb-email">Email, if you&apos;d like a reply (optional)</Label>
              <Input
                id="fb-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
            <Button type="submit" size="hero" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              {submitting ? "Sending…" : "Send feedback"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // step === "rating" | "loading"
  return (
    <Card variant="glass" className="text-center shadow-xl">
      <CardHeader className="space-y-2">
        <CardTitle className="font-display text-display-md">How was your experience?</CardTitle>
        <CardDescription className="text-body-sm">Tap a star to let us know.</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="flex items-center justify-center gap-2"
          role="radiogroup"
          aria-label="Star rating"
        >
          {[1, 2, 3, 4, 5].map((value) => {
            const filled = hovered !== null ? value <= hovered : rating !== null && value <= rating;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
                disabled={step === "loading"}
                onClick={() => handleStarClick(value)}
                onMouseEnter={() => setHovered(value)}
                onMouseLeave={() => setHovered(null)}
                className="rounded-md p-1.5 transition-transform hover:scale-110 disabled:pointer-events-none disabled:opacity-60"
              >
                <Star
                  className={
                    "size-10 transition-colors " +
                    (filled ? "fill-warning text-warning" : "text-border-default")
                  }
                />
              </button>
            );
          })}
        </div>
        {step === "loading" && (
          <p className="mt-6 flex items-center justify-center gap-2 text-body-sm text-text-muted">
            <Loader2 className="size-4 animate-spin" /> One moment…
          </p>
        )}
      </CardContent>
    </Card>
  );
}
