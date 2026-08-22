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

export { formatPriceCents } from "@/lib/format";
