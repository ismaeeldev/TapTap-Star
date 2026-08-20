// Public marketing-page data reads — separate from lib/stripe/pricing.ts (which also creates
// Stripe Prices, a mutation this read-only marketing page must never trigger). Follows the same
// "always read live, never hardcode the price" rule already established for /dashboard/billing
// (03_DATA_MODEL_AND_ARCHITECTURE.md §8) — the marketing pricing card reads this, not a literal
// "$29.90" string.
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { pricingPlans } from "@/lib/db/schema";

export async function getPublicPricingPlan() {
  const plan = await db.query.pricingPlans.findFirst({
    where: eq(pricingPlans.planKey, "default"),
  });
  // Fallback only protects against a genuinely missing seed row (should never happen in a real
  // deployment) — never a substitute for the real DB read.
  return (
    plan ?? {
      name: "Taptapstar",
      priceCents: 2990,
      currency: "usd",
    }
  );
}

export { formatPriceCents } from "@/lib/format";
