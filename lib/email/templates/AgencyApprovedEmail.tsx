// Trigger #10 — agency-request-approved.
import * as React from "react";
import { Layout, BodyText, CtaButton } from "./Layout";

export function AgencyApprovedEmail({ dashboardUrl }: { dashboardUrl: string }) {
  return (
    <Layout title="You're now an agency account" preview="Your agency request has been approved">
      <BodyText>
        Great news — your request to become a Taptapstar agency account has been approved. You
        can now manage client businesses from your dashboard.
      </BodyText>
      <CtaButton href={dashboardUrl}>Go to your dashboard</CtaButton>
    </Layout>
  );
}
