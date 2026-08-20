// Trigger #5 — billing alert / grace period started, on payment failure.
import * as React from "react";
import { Layout, BodyText, CtaButton, FinePrint } from "./Layout";

export function BillingAlertEmail({ billingUrl }: { billingUrl: string }) {
  return (
    <Layout title="Your payment failed" preview="Update your payment method to avoid interruption">
      <BodyText>
        We were unable to process your latest Taptapstar payment. Your account is now in a grace
        period — your devices keep working, but please update your payment method soon to avoid
        your dashboard going read-only.
      </BodyText>
      <CtaButton href={billingUrl}>Update payment method</CtaButton>
      <FinePrint>If you believe this is an error, please contact support.</FinePrint>
    </Layout>
  );
}
