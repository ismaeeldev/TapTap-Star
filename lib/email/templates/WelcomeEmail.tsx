// Trigger #2 — fires when email gets verified (02_APPLICATION_FLOW.md §8).
import * as React from "react";
import { Layout, BodyText, CtaButton } from "./Layout";

export function WelcomeEmail({ name, dashboardUrl }: { name: string; dashboardUrl: string }) {
  return (
    <Layout title={`Welcome to Taptapstar, ${name}`} preview="Your account is verified — let's get your first device activated">
      <BodyText>
        Your email is verified and your Taptapstar account is ready. Activate your first NFC/QR
        device to start collecting reviews, or explore your dashboard now.
      </BodyText>
      <CtaButton href={dashboardUrl}>Go to your dashboard</CtaButton>
    </Layout>
  );
}
