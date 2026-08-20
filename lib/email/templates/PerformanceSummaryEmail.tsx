// Trigger #4 — weekly/monthly performance summary, wired to the Vercel Cron job in
// app/api/cron/weekly-summary/route.ts.
import * as React from "react";
import { Layout, BodyText, CtaButton } from "./Layout";

export function PerformanceSummaryEmail({
  accountName,
  periodLabel,
  totalScans,
  trendPercent,
  topLocationName,
  dashboardUrl,
}: {
  accountName: string;
  periodLabel: string;
  totalScans: number;
  trendPercent: number | null;
  topLocationName: string | null;
  dashboardUrl: string;
}) {
  return (
    <Layout
      title={`Your ${periodLabel} performance summary`}
      preview={`${totalScans} scans ${periodLabel} for ${accountName}`}
    >
      <BodyText>
        Here&apos;s how {accountName} performed {periodLabel}:
      </BodyText>
      <BodyText>
        <strong>{totalScans}</strong> total scans
        {trendPercent !== null ? ` (${trendPercent >= 0 ? "+" : ""}${trendPercent}% vs. the previous period)` : ""}
        .
      </BodyText>
      {topLocationName && <BodyText>Top-performing location: <strong>{topLocationName}</strong>.</BodyText>}
      <CtaButton href={dashboardUrl}>View full analytics</CtaButton>
    </Layout>
  );
}
