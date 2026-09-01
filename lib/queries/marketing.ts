// Public marketing-page data reads — separate from lib/stripe/pricing.ts (which also creates
// Stripe Prices, a mutation this read-only marketing page must never trigger). Follows the same
// "always read live, never hardcode the price" rule already established for /dashboard/billing
// (03_DATA_MODEL_AND_ARCHITECTURE.md §8) — the marketing pricing card reads this, not a literal
// "$29.90" string.
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { pricingPlans } from "@/lib/db/schema";

const FALLBACK_PLAN = {
  name: "Taptapstar",
  priceCents: 2990,
  currency: "usd",
} as const;

async function fetchDefaultPlan() {
  return db.query.pricingPlans.findFirst({
    where: eq(pricingPlans.planKey, "default"),
  });
}

export async function getPublicPricingPlan() {
  // Neon scale-to-zero can fail the first HTTP request with `fetch failed` while the
  // compute wakes; one short retry covers that. Fallback only if both attempts fail
  // (or the seed row is genuinely missing) so the marketing page does not 500.
  try {
    const plan = await fetchDefaultPlan();
    return plan ?? FALLBACK_PLAN;
  } catch (err) {
    console.error("[getPublicPricingPlan] DB read failed, retrying:", err);
    try {
      await new Promise((r) => setTimeout(r, 600));
      const plan = await fetchDefaultPlan();
      return plan ?? FALLBACK_PLAN;
    } catch (retryErr) {
      console.error("[getPublicPricingPlan] retry failed, using fallback:", retryErr);
      return FALLBACK_PLAN;
    }
  }
}

// Modifications 5 pricing restructure (revision.md §3.3) — the new 3-tier marketing pricing
// page. Deliberately a separate function from getPublicPricingPlan() above rather than a
// rewrite of it: the homepage pricing section and FAQ page still read the single "default"
// plan (their own rewrite to the 3-tier model is a separate follow-up, not bundled into this
// step — see revision.md's change log), so getPublicPricingPlan() must keep working unchanged.
type PublicTier = {
  planKey: string;
  name: string;
  priceCents: number;
  annualPriceCents: number | null;
  locationLimit: number | null;
  trialDays: number | null;
};

const FALLBACK_TIERS: PublicTier[] = [
  { planKey: "free", name: "Free", priceCents: 0, annualPriceCents: null, locationLimit: 1, trialDays: null },
  { planKey: "premium", name: "Premium", priceCents: 2500, annualPriceCents: 24000, locationLimit: 1, trialDays: 14 },
  { planKey: "network", name: "Network", priceCents: 6000, annualPriceCents: 57600, locationLimit: null, trialDays: 14 },
];

export async function getPublicPricingTiers(): Promise<PublicTier[]> {
  const planKeys = ["free", "premium", "network"] as const;
  try {
    const rows = await db.query.pricingPlans.findMany({
      where: (p, { inArray }) => inArray(p.planKey, planKeys),
    });
    if (rows.length !== planKeys.length) {
      console.error(
        `[getPublicPricingTiers] expected ${planKeys.length} tiers, found ${rows.length} — using fallback`
      );
      return FALLBACK_TIERS;
    }
    // Return in a fixed, deliberate order (Free, Premium, Network) — DB row order is not
    // guaranteed, and the page's layout depends on this exact left-to-right order.
    return planKeys.map((key) => rows.find((r) => r.planKey === key)!);
  } catch (err) {
    console.error("[getPublicPricingTiers] DB read failed, using fallback:", err);
    return FALLBACK_TIERS;
  }
}

export { formatPriceCents } from "@/lib/format";
