"use client";

// Modifications 5 pricing restructure (revision.md §3.4/step 5) — dashboard billing
// plan-switcher, client-confirmed "anytime", either direction. No plan-switching UI existed
// anywhere in the dashboard before this — the billing page only ever showed the one plan
// read-only.
import { useRouter } from "next/navigation";
import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StripeCardForm } from "@/components/billing/stripe-card-form";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

// Modifications 9 (client PDF, item 3): "I want only 2 plans instead of 3." Network merged into
// Premium (revision.md's Modifications 9 entry) — Premium now includes what Network used to
// (unlimited locations, +$10/mo per extra location) at the client's stated $25/mo base.
type PlanKey = "free" | "premium";

const PLAN_INFO: Record<PlanKey, { name: string; blurb: string }> = {
  free: { name: "Free", blurb: "$0/mo forever, 1 location" },
  premium: { name: "Premium", blurb: "$25/mo, unlimited locations (+$10/mo per extra)" },
};

export function PlanSwitcher({ currentPlanKey }: { currentPlanKey: string }) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<PlanKey | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [paymentMethodId, setPaymentMethodId] = React.useState<string | null>(null);

  // A legacy "default" or (now-retired) "network" plan_key falls back to displaying as
  // "premium" here — neither is a selectable option anymore, but an account can still point at
  // one (pre-restructure accounts on "default"; any account switched to "network" before this
  // merge), and this UI needs *some* valid current selection to render against.
  const current = (["free", "premium"].includes(currentPlanKey) ? currentPlanKey : "premium") as PlanKey;
  // Free -> paid is the one transition that needs a brand-new card (Free never has one on
  // file) — see changeSubscriptionPlan()'s doc comment for why the other two transitions
  // (paid<->paid, paid->free) don't need this dialog step at all.
  const needsCard = current === "free" && selected !== null && selected !== "free";

  async function confirmSwitch() {
    if (!selected) return;
    if (needsCard && !paymentMethodId) {
      toast.error("Enter a valid card to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/billing/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPlanKey: selected,
          cadence: "monthly",
          ...(needsCard ? { paymentMethodId } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "Failed to change plan");
      toast.success(`Switched to ${PLAN_INFO[selected].name}`);
      setSelected(null);
      setPaymentMethodId(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-body-sm font-medium text-text-primary">Change plan</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {(Object.keys(PLAN_INFO) as PlanKey[]).map((key) => {
          const isCurrent = key === current;
          return (
            <button
              key={key}
              type="button"
              disabled={isCurrent}
              onClick={() => {
                setSelected(key);
                setPaymentMethodId(null);
              }}
              className={cn(
                "relative rounded-md border px-3 py-2.5 text-left transition-colors",
                isCurrent
                  ? "cursor-default border-brand bg-brand-subtle"
                  : "border-border-default hover:border-text-muted"
              )}
            >
              {isCurrent && <Check className="absolute top-2 right-2 size-3.5 text-brand" />}
              <p className="text-body-sm font-semibold text-text-primary">
                {PLAN_INFO[key].name}
                {isCurrent && <span className="ml-1.5 text-caption font-normal text-text-muted">(current)</span>}
              </p>
              <p className="mt-0.5 text-caption text-text-muted">{PLAN_INFO[key].blurb}</p>
            </button>
          );
        })}
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setPaymentMethodId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selected ? `Switch to ${PLAN_INFO[selected].name}?` : ""}
            </DialogTitle>
            <DialogDescription>
              {selected === "free"
                ? "This cancels your current subscription immediately and drops you to the Free plan right away."
                : needsCard
                  ? "Switching to a paid plan needs a payment method — enter your card below."
                  : "Your subscription updates immediately; any price difference is prorated on your next invoice."}
            </DialogDescription>
          </DialogHeader>

          {needsCard && selected && (
            <StripeCardForm onPaymentMethodReady={setPaymentMethodId} disabled={submitting} />
          )}

          <DialogFooter>
            <Button
              onClick={confirmSwitch}
              disabled={submitting || (needsCard && !paymentMethodId)}
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Switching…" : "Confirm switch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
