"use client";

import * as React from "react";
import { Lock, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type Settings = {
  reviewFilterEnabled: boolean;
  reviewFilterThreshold: number;
  reviewDestinationType: "google" | "custom";
  reviewDestinationUrl: string | null;
  aiReplyEnabled: boolean;
  aiReplyThreshold: number;
};

// Business-owner-facing review-filtering settings panel — client feature request, Sept 2026
// round: "Enable or disable review filtering. Choose which star ratings are considered
// positive. Configure the action for each rating. Select the destination review platform or
// URL." All four requirements map directly onto the fields here.
export function ReviewFilterSettings({
  locationId,
  initial,
  canUse,
}: {
  locationId: string;
  initial: Settings;
  canUse: boolean;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = React.useState(initial.reviewFilterEnabled);
  const [threshold, setThreshold] = React.useState(initial.reviewFilterThreshold);
  const [destType, setDestType] = React.useState(initial.reviewDestinationType);
  const [destUrl, setDestUrl] = React.useState(initial.reviewDestinationUrl ?? "");
  const [aiEnabled, setAiEnabled] = React.useState(initial.aiReplyEnabled);
  const [aiThreshold, setAiThreshold] = React.useState(initial.aiReplyThreshold);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSave() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/locations/${locationId}/review-filter`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewFilterEnabled: enabled,
          reviewFilterThreshold: threshold,
          reviewDestinationType: destType,
          reviewDestinationUrl: destType === "custom" ? destUrl : undefined,
          aiReplyEnabled: aiEnabled,
          aiReplyThreshold: aiThreshold,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Failed to save review filtering settings");
        return;
      }
      toast.success("Review filtering settings saved");
      router.refresh();
    } catch {
      toast.error("Failed to save — check your connection and try again");
    } finally {
      setSubmitting(false);
    }
  }

  if (!canUse) {
    return (
      <div className="rounded-lg border border-border-default bg-bg-card p-4">
        <div className="flex items-center gap-2">
          <Lock className="size-4 text-text-muted" />
          <h3 className="text-h4 font-semibold text-text-primary">Review filtering</h3>
        </div>
        <p className="mt-2 text-body-sm text-text-muted">
          Route low-star ratings to a private feedback form instead of a public review. This is
          a Premium feature —{" "}
          <Link href="/dashboard/billing" className="text-brand hover:underline">
            upgrade your plan
          </Link>{" "}
          to use it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-border-default bg-bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-h4 font-semibold text-text-primary">Review filtering</h3>
          <p className="text-body-sm text-text-muted">
            Ratings below the threshold go to a private form instead of a public review.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((v) => !v)}
          className="relative h-7 w-12 shrink-0 rounded-full bg-bg-muted transition-colors data-[on=true]:bg-brand"
          data-on={enabled}
        >
          <span
            className={cn(
              "absolute top-1 left-1 size-5 rounded-full bg-white shadow-sm transition-transform",
              enabled && "translate-x-5"
            )}
          />
        </button>
      </div>

      {enabled && (
        <div className="space-y-4 border-t border-border-default pt-4">
          <div className="space-y-1.5">
            <Label>Positive rating threshold</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setThreshold(value)}
                  className="rounded-md p-1"
                >
                  <Star
                    className={cn(
                      "size-6 transition-colors",
                      value <= threshold ? "fill-warning text-warning" : "text-border-default"
                    )}
                  />
                </button>
              ))}
            </div>
            <p className="text-caption text-text-muted">
              {threshold}–5 stars → public review. 1–{threshold - 1 || 0} stars → private
              feedback form.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dest-type">Destination for positive ratings</Label>
            <Select value={destType} onValueChange={(v) => setDestType(v as "google" | "custom")}>
              <SelectTrigger id="dest-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google">This location&apos;s Google review link</SelectItem>
                <SelectItem value="custom">A different platform / custom URL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {destType === "custom" && (
            <div className="space-y-1.5">
              <Label htmlFor="dest-url">Custom review URL</Label>
              <Input
                id="dest-url"
                value={destUrl}
                onChange={(e) => setDestUrl(e.target.value)}
                placeholder="https://www.trustpilot.com/review/..."
              />
            </div>
          )}
        </div>
      )}

      {/* Modifications 9 (client PDF, items 1/6): "I want that reviews over the rating that
          owner selects be auto answered using AI." / "AI answering and Review filtering I only
          want to be available for Premium Plan." A separate on/off + threshold from the
          filtering settings above — this app never stores the text of a genuine public review
          (high-star taps redirect straight out before anything is captured), so this drafts an
          AI reply to a PRIVATE feedback submission whose rating meets this threshold, for the
          owner to review/edit in the Feedback inbox — never auto-sent, since there's no
          guaranteed channel back to an anonymous customer. */}
      <div className="space-y-4 border-t border-border-default pt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-body-sm font-semibold text-text-primary">AI-answered reviews</h3>
            <p className="text-body-sm text-text-muted">
              Auto-draft a reply for feedback at or above the rating you choose — you review and
              send it yourself from the Feedback inbox.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={aiEnabled}
            onClick={() => setAiEnabled((v) => !v)}
            className="relative h-7 w-12 shrink-0 rounded-full bg-bg-muted transition-colors data-[on=true]:bg-brand"
            data-on={aiEnabled}
          >
            <span
              className={cn(
                "absolute top-1 left-1 size-5 rounded-full bg-white shadow-sm transition-transform",
                aiEnabled && "translate-x-5"
              )}
            />
          </button>
        </div>

        {aiEnabled && (
          <div className="space-y-1.5">
            <Label>Auto-reply rating threshold</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAiThreshold(value)}
                  className="rounded-md p-1"
                >
                  <Star
                    className={cn(
                      "size-6 transition-colors",
                      value <= aiThreshold ? "fill-warning text-warning" : "text-border-default"
                    )}
                  />
                </button>
              ))}
            </div>
            <p className="text-caption text-text-muted">
              Feedback rated {aiThreshold}–5 stars gets an AI-drafted reply automatically.
            </p>
          </div>
        )}
      </div>

      <Button size="sm" onClick={handleSave} disabled={submitting}>
        {submitting ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}
