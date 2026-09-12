// Modifications 9 (client PDF, item 3 + client's reference video): the Premium plan's
// per-location price DECREASES as a business adds more locations (volume discount), unlike the
// flat "+$10/mo per extra location" mechanic this app currently bills through Stripe
// (lib/stripe/subscription.ts's syncPremiumLocationQuantity, ensureExtraLocationPriceId).
//
// The video showed 3 data points (EUR, kept here in the SAME unit the client will confirm —
// currently USD-equivalent numbers, see this file's own placeholder note):
//   4 locations  -> $22.40/location  ($89.60 total)
//   18 locations -> $16.30/location  ($293.40 total)
//   20 locations -> $15.90/location  ($318.00 total)
// total = locations × price-per-location exactly, confirmed from those 3 points. A straight
// line through them is close but not exact, so this could be a smooth decay curve or a fixed
// tiered table — the client is getting the exact formula/table from their side (Modifications 9
// follow-up). DO NOT treat the curve below as final: it's a placeholder that reproduces the 3
// known points closely enough to demo/test the slider end-to-end, not a confirmed pricing rule.
// Swap PLACEHOLDER_PER_LOCATION_CENTS (or this whole function) once the real numbers arrive —
// this is the ONLY place that formula needs to change; the slider UI and Stripe billing wiring
// are unaffected by which curve/table ends up here.
export const MIN_LOCATIONS = 1;
export const MAX_LOCATIONS = 30;

/**
 * PLACEHOLDER pricing curve — see this file's header comment. Exponential decay
 * (floor + amp * e^(-decay * (n-1))) fit via least-squares against all 4 known points (1 loc =
 * Premium's existing $25 base, plus the video's 4/18/20-location points) — reproduces
 * 1->$25.00, 4->$22.40, 18->$16.30, 20->$15.90 essentially exactly. Replace with the client's
 * real formula/table when it arrives; only this function needs to change.
 */
export function perLocationPriceCents(locationCount: number): number {
  const n = Math.max(MIN_LOCATIONS, Math.min(MAX_LOCATIONS, Math.round(locationCount)));
  const floorPriceCents = 1379; // fitted asymptote, not itself a real advertised price
  const amplitudeCents = 1121;
  const decayRate = 0.088;
  const raw = floorPriceCents + amplitudeCents * Math.exp(-decayRate * (n - 1));
  return Math.round(raw);
}

export function totalPriceCents(locationCount: number): number {
  const n = Math.max(MIN_LOCATIONS, Math.min(MAX_LOCATIONS, Math.round(locationCount)));
  return perLocationPriceCents(n) * n;
}
