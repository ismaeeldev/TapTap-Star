// Trigger #3 — device activation confirmation, to the business owner.
import * as React from "react";
import { Layout, BodyText, CtaButton } from "./Layout";

export function DeviceActivatedEmail({
  deviceCode,
  locationName,
  dashboardUrl,
}: {
  deviceCode: string;
  locationName: string;
  dashboardUrl: string;
}) {
  return (
    <Layout title="Device activated" preview={`Device ${deviceCode} is now live at ${locationName}`}>
      <BodyText>
        Your device <strong>{deviceCode}</strong> has been activated at{" "}
        <strong>{locationName}</strong> and is now redirecting customers to your review link.
      </BodyText>
      <CtaButton href={dashboardUrl}>View device</CtaButton>
    </Layout>
  );
}
