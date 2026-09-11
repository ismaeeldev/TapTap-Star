// Review-filtering feature (client feature request, Sept 2026 round) — real-time alert to the
// business owner when a customer submits a low star rating via a filtered location. Sent to the
// account's own users (not an internal admin alert like ContactFormAdminEmail) — this is the
// "real-time scan alerts" capability already listed as a Premium/Network feature.
import * as React from "react";
import { Layout, BodyText, CtaButton } from "./Layout";

export function LowRatingAlertEmail({
  locationName,
  rating,
  comment,
  feedbackUrl,
}: {
  locationName: string;
  rating: number;
  comment: string | null;
  feedbackUrl: string;
}) {
  return (
    <Layout
      title="New private feedback received"
      preview={`${rating}-star feedback at ${locationName}`}
    >
      <BodyText>
        A customer at <strong>{locationName}</strong> left a {rating}-star rating and was routed
        to your private feedback form instead of a public review.
      </BodyText>
      {comment && <BodyText>&ldquo;{comment}&rdquo;</BodyText>}
      <CtaButton href={feedbackUrl}>View feedback</CtaButton>
    </Layout>
  );
}
