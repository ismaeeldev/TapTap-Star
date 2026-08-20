import { NextResponse } from "next/server";
import { requireSession, authErrorResponse } from "@/lib/auth/rbac";
import { getScanExportRows } from "@/lib/queries/analytics";
import { parseAnalyticsFilters } from "@/lib/validation";

// GET /api/scans/export?format=csv|pdf&from=&to=&locationId=&deviceId= — filtered identically to
// the on-screen /dashboard/analytics view (both read the same parseAnalyticsFilters +
// getScanExportRows), so what the owner exports always matches what they were looking at.
export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const parsed = parseAnalyticsFilters(searchParams);
    if (!parsed.ok) {
      return NextResponse.json({ message: parsed.message }, { status: 400 });
    }
    const format = searchParams.get("format") === "pdf" ? "pdf" : "csv";

    const rows = await getScanExportRows({
      accountId: session.user.accountId,
      range: parsed.range,
      locationId: parsed.locationId,
      deviceId: parsed.deviceId,
    });

    if (format === "csv") {
      const csv = toCsv(rows);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="taptapstar-scans.csv"`,
        },
      });
    }

    const html = toPrintableHtml(rows, parsed.range);
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

// Escapes a field per RFC 4180: wrap in quotes and double any embedded quote whenever the value
// contains a comma, quote, or newline — required since location/device names are free text.
function csvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(rows: Awaited<ReturnType<typeof getScanExportRows>>): string {
  const header = ["Scanned At", "Device Code", "Location", "Employee"];
  const lines = [header.map(csvField).join(",")];
  for (const r of rows) {
    lines.push(
      [r.scannedAt, r.deviceCode, r.locationName, r.employeeName ?? ""].map(csvField).join(",")
    );
  }
  return lines.join("\r\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// "PDF" export is a print-friendly HTML document the browser turns into a PDF via its own
// print-to-PDF dialog (window.print()) — a deliberately simple v1 approach per the master build
// guide's "don't over-engineer this" guidance, avoids adding a server-side PDF-rendering
// dependency for a report that's fundamentally just a styled table.
function toPrintableHtml(
  rows: Awaited<ReturnType<typeof getScanExportRows>>,
  range: { start: Date; end: Date }
): string {
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const rowsHtml = rows
    .map(
      (r) =>
        `<tr><td>${escapeHtml(new Date(r.scannedAt).toLocaleString())}</td><td>${escapeHtml(r.deviceCode)}</td><td>${escapeHtml(r.locationName)}</td><td>${escapeHtml(r.employeeName ?? "—")}</td></tr>`
    )
    .join("");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Taptapstar scan report</title>
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #0f172a; padding: 32px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  p.range { color: #64748b; font-size: 13px; margin-top: 0; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
  th { background: #f8fafc; font-weight: 600; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <h1>Taptapstar — Scan Report</h1>
  <p class="range">${fmt(range.start)} to ${fmt(new Date(range.end.getTime() - 86400000))} &middot; ${rows.length} scans</p>
  <table>
    <thead><tr><th>Scanned At</th><th>Device</th><th>Location</th><th>Employee</th></tr></thead>
    <tbody>${rowsHtml || `<tr><td colspan="4">No scans in this period.</td></tr>`}</tbody>
  </table>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
}
