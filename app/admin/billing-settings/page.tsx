import { BillingSettingsForm } from "@/components/admin/billing-settings-form";
import { getDefaultPricingPlan } from "@/lib/stripe/pricing";

// requireRole("taptapstar_admin") is enforced in app/admin/layout.tsx and by
// app/api/admin/billing-settings/route.ts (the route this page's form submits to) — this page
// itself only reads via getDefaultPricingPlan().
export default async function BillingSettingsPage() {
  const plan = await getDefaultPricingPlan();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 font-display font-semibold text-text-primary">Billing settings</h1>
        <p className="text-body-sm text-text-muted">
          Edit the flat monthly price every business account is billed. Stripe Prices are
          immutable, so saving here creates a new Stripe Price under the existing product —
          existing subscriptions move to it at their next natural billing sync.
        </p>
      </div>

      <BillingSettingsForm initialPriceCents={plan.priceCents} />
    </div>
  );
}
