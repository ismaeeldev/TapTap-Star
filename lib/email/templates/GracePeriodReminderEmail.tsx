// Trigger #6 — grace-period-about-to-expire reminder. Template + notify() type only — see
// 04_PROJECT_STATE.md's Step 9 entry for why the time-based trigger point itself is deferred.
import * as React from "react";
import { Layout, BodyText, CtaButton, FinePrint } from "./Layout";

export function GracePeriodReminderEmail({
  daysRemaining,
  billingUrl,
}: {
  daysRemaining: number;
  billingUrl: string;
}) {
  return (
    <Layout
      title="Your grace period is ending soon"
      preview={`${daysRemaining} day(s) left before your account is suspended`}
    >
      <BodyText>
        Your Taptapstar account is still in a grace period after a failed payment. You have{" "}
        <strong>{daysRemaining} day(s)</strong> left to update your payment method before your
        account is suspended.
      </BodyText>
      <CtaButton href={billingUrl}>Update payment method</CtaButton>
      <FinePrint>If you believe this is an error, please contact support.</FinePrint>
    </Layout>
  );
}
