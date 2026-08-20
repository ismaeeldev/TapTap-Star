import { auth, signOut } from "@/lib/auth/auth";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { BillingSettingsForm } from "@/components/admin/billing-settings-form";
import { getDefaultPricingPlan } from "@/lib/stripe/pricing";

// Minimal internal admin page, same pattern/visual-outlier status as
// app/admin/agency-requests/page.tsx (Step 10 owns the full admin shell) — functionally real
// regardless, per the master prompt's explicit "don't skip building this" instruction.
export default async function BillingSettingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const plan = await getDefaultPricingPlan();

  return (
    <div className="min-h-svh bg-bg-page">
      <header className="flex items-center justify-between border-b border-border-default bg-bg-surface px-4 py-3 lg:px-8">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="text-body-sm text-text-muted">{session.user.name}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button variant="ghost" size="sm" type="submit">
              Log out
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 lg:px-8">
        <div>
          <h1 className="text-h2 font-display font-semibold text-text-primary">
            Billing settings
          </h1>
          <p className="text-body-sm text-text-muted">
            Edit the flat monthly price every business account is billed. Stripe Prices are
            immutable, so saving here creates a new Stripe Price under the existing product —
            existing subscriptions move to it at their next natural billing sync.
          </p>
        </div>

        <BillingSettingsForm initialPriceCents={plan.priceCents} />
      </main>
    </div>
  );
}
