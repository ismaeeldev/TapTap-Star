// Trigger #9 — contact-form-submitted, internal notification to ADMIN_INBOX_EMAIL.
import * as React from "react";
import { Layout, BodyText } from "./Layout";

export function ContactFormAdminEmail({
  name,
  email,
  message,
}: {
  name: string;
  email: string;
  message: string;
}) {
  return (
    <Layout title="New contact form submission" preview={`From ${name} <${email}>`}>
      <BodyText>
        <strong>From:</strong> {name} ({email})
      </BodyText>
      <BodyText>{message}</BodyText>
    </Layout>
  );
}
