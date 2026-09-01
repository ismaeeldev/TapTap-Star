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

type PlanKey = "free" | "premium" | "network";

const PLAN_INFO: Record<PlanKey, { name: string; blurb: string }> = {
  free: { name: "Free", blurb: "$0/mo forever, 1 location" },
  premium: { name: "Premium", blurb: "$25/mo, 1 location" },
  network: { name: "Network", blurb: "$60/mo, unlimited locations" },
};

export function PlanSwitcher({ currentPlanKey }: { currentPlanKey: string }) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<PlanKey | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [paymentMethodId, setPaymentMethodId] = React.useState<string | null>(null);

  const current = (["free", "premium", "network"].includes(currentPlanKey) ? currentPlanKey : "premium") as PlanKey;
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
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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
