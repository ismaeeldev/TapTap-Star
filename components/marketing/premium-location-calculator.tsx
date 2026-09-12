"use client";

// Modifications 9 (client PDF, item 3 — "I want it to be like in the video"): a live
// per-location price calculator matching the reference video's structure — a location-count
// slider (+/- stepper) that shows the per-location price and running total, both of which drop
// as more locations are added. See lib/pricing/per-location-curve.ts for the pricing formula
// itself (a PLACEHOLDER fitted to the video's 3 visible data points — not yet confirmed by the
// client) — this component only renders whatever that function returns, so the real numbers
// slot in with a one-line change there once confirmed.
import * as React from "react";
import { Lock, Minus, Plus } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { formatPriceCents } from "@/lib/format";
import {
  MAX_LOCATIONS,
  MIN_LOCATIONS,
  perLocationPriceCents,
  totalPriceCents,
} from "@/lib/pricing/per-location-curve";

export function PremiumLocationCalculator({ trialDays }: { trialDays: number | null }) {
  const [locations, setLocations] = React.useState(4);

  const perLocation = perLocationPriceCents(locations);
  const total = totalPriceCents(locations);

  function clamp(n: number) {
    return Math.max(MIN_LOCATIONS, Math.min(MAX_LOCATIONS, n));
  }

  return (
    <div className="rounded-lg border border-border-default bg-bg-card p-6">
      {trialDays ? (
        <p className="mb-5 w-fit rounded-full bg-warning/15 px-3 py-1 text-caption font-medium text-text-primary">
          Activate your <span className="font-semibold">{trialDays}-day free trial</span> right now
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="location-count" className="text-body-sm text-text-secondary">
          How many locations do you manage?
        </label>
        <div className="flex items-center gap-3">
          <Slider
            id="location-count"
            min={MIN_LOCATIONS}
            max={MAX_LOCATIONS}
            step={1}
            value={[locations]}
            onValueChange={([v]) => setLocations(clamp(v))}
            className="flex-1"
          />
          <div className="flex shrink-0 items-center gap-1 rounded-md border border-border-default bg-bg-page px-1.5 py-1">
            <button
              type="button"
              aria-label="Decrease locations"
              onClick={() => setLocations((n) => clamp(n - 1))}
              className="flex size-6 items-center justify-center rounded text-text-secondary hover:bg-bg-muted"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-8 text-center text-body-sm font-semibold tabular-nums text-text-primary">
              {locations}
            </span>
            <button
              type="button"
              aria-label="Increase locations"
              onClick={() => setLocations((n) => clamp(n + 1))}
              className="flex size-6 items-center justify-center rounded text-text-secondary hover:bg-bg-muted"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        </div>
        <p className="text-caption text-text-muted">
          {locations} location{locations === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mt-5 flex items-end gap-1.5">
        <span className="font-display text-display-md font-extrabold tabular-nums text-text-primary">
          {formatPriceCents(perLocation, "usd").replace(/\.00$/, "")}
        </span>
        <span className="mb-1 text-body-sm text-text-muted">per location / month</span>
      </div>

      <p className="mt-3 text-body-sm text-text-muted">
        Billed monthly, with no minimum commitment period.
      </p>
      <p className="mt-1.5 flex items-center gap-1.5 text-caption text-text-muted">
        <Lock className="size-3.5 shrink-0" />
        Lock in your rate at the location count you sign up with.
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-border-default pt-4">
        <span className="text-body-sm text-text-muted">Total</span>
        <span className="text-h4 font-display font-semibold text-text-primary">
          {formatPriceCents(total, "usd").replace(/\.00$/, "")}/mo
        </span>
      </div>

      <Button asChild size="hero" className="mt-5 w-full">
        <a href={`/signup?plan=premium&locations=${locations}`}>
          {trialDays ? `Get ${trialDays} days free` : "Get started"}
        </a>
      </Button>
    </div>
  );
}
