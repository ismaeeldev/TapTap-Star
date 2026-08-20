// Trigger #11 — agency-request-rejected, with reason if given.
import * as React from "react";
import { Layout, BodyText } from "./Layout";

export function AgencyRejectedEmail({ reason }: { reason?: string | null }) {
  return (
    <Layout title="Your agency request was not approved" preview="Update on your agency request">
      <BodyText>
        Your request to become a Taptapstar agency account was not approved at this time.
      </BodyText>
      {reason && (
        <BodyText>
          <strong>Reason:</strong> {reason}
        </BodyText>
      )}
      <BodyText>If you have questions, please reply to this email or contact support.</BodyText>
    </Layout>
  );
}
