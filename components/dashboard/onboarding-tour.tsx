"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Step = {
  tourId: string | null; // null = centered welcome/intro step, no target element
  title: string;
  description: string;
};

const BASE_STEPS: Step[] = [
  {
    tourId: null,
    title: "Welcome to Taptapstar",
    description: "A 30-second look around your dashboard. Skip anytime — you can always replay this from the help icon up top.",
  },
  {
    tourId: "nav-dashboard",
    title: "Overview",
    description: "Your at-a-glance numbers: scans this month, active devices, locations, and employees.",
  },
  {
    tourId: "nav-devices",
    title: "Devices",
    description: "Every NFC/QR device you own, its status, and where to reassign or deactivate one.",
  },
  {
    tourId: "nav-locations",
    title: "Locations",
    description: "The physical places your devices point customers to leave a review.",
  },
  {
    tourId: "nav-employees",
    title: "Employees",
    description: "A live leaderboard, shareable personal links, and monthly scan targets.",
  },
  {
    tourId: "nav-agency",
    title: "Agency",
    description: "Request agency access to manage multiple client businesses from one account.",
  },
  {
    tourId: "nav-analytics",
    title: "Analytics",
    description: "Scan trends over time — filter by location or device, export as CSV or PDF.",
  },
  {
    tourId: "nav-billing",
    title: "Billing",
    description: "Your subscription, invoice history, and payment method.",
  },
  {
    tourId: "nav-support",
    title: "Support",
    description: "Have a problem or a question? Send a message straight to the Taptapstar team.",
  },
  {
    tourId: "theme-toggle",
    title: "Light & dark mode",
    description: "Switch themes anytime — your dashboard remembers your choice.",
  },
];

const CLIENTS_STEP: Step = {
  tourId: "nav-clients",
  title: "Clients",
  description: "Manage every business you handle from this one place.",
};

const STORAGE_PREFIX = "taptapstar:tour:";
const TOOLTIP_MARGIN = 12;
const TOOLTIP_EST_HEIGHT = 190;

// A lightweight, dependency-free "new here?" product tour for first-time dashboard visitors —
// no full-screen dimming on targeted steps (keeps the rest of the app usable mid-tour), a soft
// backdrop only on the centered welcome/closing step, skippable at every step, replayable
// anytime via the help icon, and safe to re-mount across route changes because it lives in the
// dashboard layout (not a per-page component). Progress is remembered per-account in
// localStorage so it never nags a returning user, and never throws if storage is unavailable
// (private browsing) — it just falls back to "always show the trigger, never auto-start".
export function OnboardingTour({
  accountId,
  showClients,
}: {
  accountId: string;
  showClients: boolean;
}) {
  const steps = React.useMemo(() => {
    if (!showClients) return BASE_STEPS;
    const idx = BASE_STEPS.findIndex((s) => s.tourId === "nav-employees") + 1;
    return [...BASE_STEPS.slice(0, idx), CLIENTS_STEP, ...BASE_STEPS.slice(idx)];
  }, [showClients]);

  const storageKey = `${STORAGE_PREFIX}${accountId}`;
  const reduceMotion = useReducedMotion();

  const [mounted, setMounted] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [rect, setRect] = React.useState<DOMRect | null>(null);

  React.useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    let alreadySeen = true;
    try {
      alreadySeen = window.localStorage.getItem(storageKey) === "done";
    } catch {
      // Storage unavailable (private mode, disabled cookies) — don't auto-start, but the help
      // icon trigger still works, so the tour is never fully unreachable.
      return;
    }
    if (!alreadySeen) {
      const id = setTimeout(() => setActive(true), 600);
      return () => clearTimeout(id);
    }
  }, [mounted, storageKey]);

  const step = steps[stepIndex];

  const updateRect = React.useCallback(() => {
    if (!step?.tourId) {
      setRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${step.tourId}"]`);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

  React.useEffect(() => {
    if (!active) return;
    // Deferred via rAF (rather than calling updateRect synchronously in the effect body) to
    // satisfy the react-hooks/set-state-in-effect rule — same pattern as ThemeToggle's mount check.
    const id = requestAnimationFrame(updateRect);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [active, updateRect]);

  const finish = React.useCallback(() => {
    setActive(false);
    setStepIndex(0);
    try {
      window.localStorage.setItem(storageKey, "done");
    } catch {
      // Non-fatal — worst case the tour offers itself again next visit, nothing breaks.
    }
  }, [storageKey]);

  React.useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") finish();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, finish]);

  function start() {
    setStepIndex(0);
    setActive(true);
  }

  function next() {
    if (stepIndex >= steps.length - 1) {
      finish();
      return;
    }
    setStepIndex((i) => i + 1);
  }

  function back() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  const tooltipStyle = React.useMemo<React.CSSProperties>(() => {
    if (!rect) return {};
    const width = Math.min(320, window.innerWidth - TOOLTIP_MARGIN * 2);
    const spaceRight = window.innerWidth - rect.right;

    // Prefer placing to the right of the target when there's room — this is what the sidebar
    // needs (its nav items stack vertically, so a below-placed tooltip would cover the very
    // items still to come in the tour). Fall back to below/above only when there isn't enough
    // horizontal room (narrow viewports, or a target near the right edge like the theme toggle).
    if (spaceRight > width + TOOLTIP_MARGIN * 2) {
      const top = Math.min(
        Math.max(rect.top, TOOLTIP_MARGIN),
        window.innerHeight - TOOLTIP_EST_HEIGHT - TOOLTIP_MARGIN
      );
      return { position: "fixed", left: rect.right + TOOLTIP_MARGIN, top, width };
    }

    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < TOOLTIP_EST_HEIGHT + TOOLTIP_MARGIN && rect.top > TOOLTIP_EST_HEIGHT;
    const left = Math.min(Math.max(rect.left, TOOLTIP_MARGIN), window.innerWidth - width - TOOLTIP_MARGIN);
    return {
      position: "fixed",
      left,
      width,
      ...(placeAbove
        ? { bottom: window.innerHeight - rect.top + TOOLTIP_MARGIN }
        : { top: rect.bottom + TOOLTIP_MARGIN }),
    };
  }, [rect]);

  const centered = !step?.tourId;
  // On a targeted step whose element hasn't resolved yet (e.g. mid-navigation), skip rendering
  // the tooltip rather than showing one floating at 0,0 — it'll reposition next paint via the
  // resize/scroll listeners once `rect` resolves.
  const showTooltip = active && (centered || rect !== null);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Replay the dashboard tour"
        title="Replay the dashboard tour"
        onClick={start}
      >
        <HelpCircle className="size-4" />
      </Button>

      {mounted && (
        <AnimatePresence>
          {showTooltip && (
            <React.Fragment key={stepIndex}>
              {centered && (
                <motion.div
                  key="tour-backdrop"
                  className="fixed inset-0 z-50 bg-black/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.15 }}
                  onClick={finish}
                />
              )}

              {!centered && rect && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none fixed z-50 rounded-lg ring-2 ring-brand ring-offset-2 ring-offset-bg-page transition-all duration-200"
                  style={{
                    top: rect.top - 4,
                    left: rect.left - 4,
                    width: rect.width + 8,
                    height: rect.height + 8,
                  }}
                />
              )}

              <motion.div
                role="dialog"
                aria-modal={centered}
                aria-label={`Dashboard tour, step ${stepIndex + 1} of ${steps.length}: ${step.title}`}
                className={cn("fixed z-50", centered && "inset-0 flex items-center justify-center p-4")}
                style={!centered ? tooltipStyle : undefined}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
              >
                <Card
                  variant="standard"
                  className={cn("p-5 shadow-lg", centered && "w-full max-w-sm")}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-caption font-semibold tracking-wide text-brand uppercase">
                      Step {stepIndex + 1} of {steps.length}
                    </p>
                    <button
                      type="button"
                      onClick={finish}
                      aria-label="Close tour"
                      className="rounded-md p-1 text-text-muted transition-colors hover:bg-bg-muted hover:text-text-primary"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <h3 className="text-h4 font-semibold text-text-primary">{step.title}</h3>
                  <p className="mt-1.5 text-body-sm text-text-secondary">{step.description}</p>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <Button variant="ghost" size="sm" onClick={finish}>
                      Skip
                    </Button>
                    <div className="flex items-center gap-2">
                      {stepIndex > 0 && (
                        <Button variant="secondary" size="sm" onClick={back}>
                          Back
                        </Button>
                      )}
                      <Button size="sm" onClick={next}>
                        {stepIndex === steps.length - 1 ? "Got it" : "Next"}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </React.Fragment>
          )}
        </AnimatePresence>
      )}
    </>
  );
}
