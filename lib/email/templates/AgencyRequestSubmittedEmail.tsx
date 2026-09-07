// Modifications 7 (client PDF, item 4): "Is AGENCY option developed, where do I receive mails
// and messages from clients interested in this service?" — previously, a business requesting
// agency access only ever showed up inside /admin/agency-requests; nothing notified an admin
// that a new request existed at all. Mirrors ContactFormAdminEmail's exact pattern (internal
// notification to ADMIN_INBOX_EMAIL, not to the requesting business).
import * as React from "react";
import { Layout, BodyText, CtaButton } from "./Layout";

export function AgencyRequestSubmittedEmail({
  accountName,
  reviewUrl,
}: {
  accountName: string;
  reviewUrl: string;
}) {
  return (
    <Layout
      title="New agency access request"
      preview={`${accountName} requested agency access`}
    >
      <BodyText>
        <strong>{accountName}</strong> just requested agency access. Review and approve or
        reject it from the admin dashboard.
      </BodyText>
      <CtaButton href={reviewUrl}>Review request</CtaButton>
    </Layout>
  );
}
