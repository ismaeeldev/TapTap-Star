// Trigger #1 (02_APPLICATION_FLOW.md §8) — migrated from lib/email/client.ts's plain-HTML
// sendVerificationEmail() to a real React Email component. The old function is removed so there
// is only one implementation of this email.
import * as React from "react";
import { Layout, BodyText, CtaButton, FinePrint } from "./Layout";

export function VerificationEmail({ verifyUrl }: { verifyUrl: string }) {
  return (
    <Layout title="Verify your email" preview="Confirm your email to activate your Taptapstar account">
      <BodyText>Confirm your email address to activate your Taptapstar account.</BodyText>
      <CtaButton href={verifyUrl}>Verify email</CtaButton>
      <FinePrint>
        This link expires in 24 hours. If you didn&apos;t create a Taptapstar account, you can
        ignore this email.
      </FinePrint>
    </Layout>
  );
}
