// Trigger #8 — payment-recovered / reactivation confirmation. Only sent on a genuine recovery
// from grace_period/suspended to active — see app/api/billing/webhook/route.ts.
import * as React from "react";
import { Layout, BodyText, CtaButton } from "./Layout";

export function PaymentRecoveredEmail({ dashboardUrl }: { dashboardUrl: string }) {
  return (
    <Layout title="Your account is active again" preview="Payment received — your account has been reactivated">
      <BodyText>
        We received your payment and your Taptapstar account is fully active again. Thanks for
        staying with us.
      </BodyText>
      <CtaButton href={dashboardUrl}>Go to your dashboard</CtaButton>
    </Layout>
  );
}
