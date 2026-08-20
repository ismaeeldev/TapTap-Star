// Trigger #7 — suspension notice.
import * as React from "react";
import { Layout, BodyText, CtaButton } from "./Layout";

export function SuspensionEmail({ billingUrl }: { billingUrl: string }) {
  return (
    <Layout title="Your account has been suspended" preview="Your Taptapstar subscription was canceled">
      <BodyText>
        Your Taptapstar subscription has been canceled and your account is now suspended. Your
        devices will stop redirecting to your review link until you reactivate.
      </BodyText>
      <CtaButton href={billingUrl}>Reactivate your account</CtaButton>
    </Layout>
  );
}
