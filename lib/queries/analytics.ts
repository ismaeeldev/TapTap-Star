// Shared analytics query layer for /dashboard/analytics (Step 6) — mirrors the pattern
// established in ../../lib/queries/leaderboard.ts (Step 5): query functions live here, both the
// page and any API route (export) reuse them rather than duplicating SQL.
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { devices, locations, scans } from "@/lib/db/schema";

export type DateRange = { start: Date; end: Date };

export type AnalyticsFilters = {
  accountId: string;
  range: DateRange;
  locationId?: string;
  deviceId?: string;
};

/** The previous period of equal length immediately before `range` — for period-over-period %. */
export function previousPeriod(range: DateRange): DateRange {
  const lengthMs = range.end.getTime() - range.start.getTime();
  return { start: new Date(range.start.getTime() - lengthMs), end: range.start };
}

function scopeCondition(filters: AnalyticsFilters, range: DateRange) {
  const conditions = [
    eq(locations.accountId, filters.accountId),
    gte(scans.scannedAt, range.start),
    lt(scans.scannedAt, range.end),
  ];
  if (filters.locationId) conditions.push(eq(scans.locationId, filters.locationId));
  if (filters.deviceId) conditions.push(eq(scans.deviceId, filters.deviceId));
  return and(...conditions);
}

/** Total scan count for the account (scoped, filtered) within a date range. */
export async function getScanCount(filters: AnalyticsFilters, range: DateRange): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(scans)
    .innerJoin(locations, eq(scans.locationId, locations.id))
    .where(scopeCondition(filters, range));
  return row?.count ?? 0;
}

/**
 * Count of currently-active devices for the account — not date-scoped (a point-in-time fact),
 * but DOES respect the location/device dimensional filters, same as every other KPI here.
 * Ignoring those filters would make this tile silently disagree with the rest of the filtered
 * report (e.g. showing the account's total device count while everything else is scoped to one
 * location the user just selected).
 */
export async function getActiveDeviceCount(filters: AnalyticsFilters): Promise<number> {
  const conditions = [eq(devices.accountId, filters.accountId), eq(devices.status, "active")];
  if (filters.locationId) conditions.push(eq(devices.locationId, filters.locationId));
  if (filters.deviceId) conditions.push(eq(devices.id, filters.deviceId));
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(devices)
    .where(and(...conditions));
  return row?.count ?? 0;
}

/** The location with the most scans in the range, and its review link — "most-used review link". */
export async function getMostUsedLocation(
  filters: AnalyticsFilters,
  range: DateRange
): Promise<{ locationId: string; name: string; googleReviewUrl: string; scanCount: number } | null> {
  const conditions = [
    eq(locations.accountId, filters.accountId),
    gte(scans.scannedAt, range.start),
    lt(scans.scannedAt, range.end),
  ];
  if (filters.locationId) conditions.push(eq(scans.locationId, filters.locationId));
  if (filters.deviceId) conditions.push(eq(scans.deviceId, filters.deviceId));

  const rows = await db
    .select({
      locationId: locations.id,
      name: locations.name,
      googleReviewUrl: locations.googleReviewUrl,
      count: sql<number>`count(${scans.id})::int`,
    })
    .from(scans)
    .innerJoin(locations, eq(scans.locationId, locations.id))
    .where(and(...conditions))
    .groupBy(locations.id, locations.name, locations.googleReviewUrl)
    .orderBy(sql`count(${scans.id}) desc`)
    .limit(1);

  const top = rows[0];
  if (!top || top.count === 0) return null;
  return { locationId: top.locationId, name: top.name, googleReviewUrl: top.googleReviewUrl, scanCount: top.count };
}

export type TimeSeriesPoint = { date: string; scans: number };

/**
 * Daily scan counts across the range, one point per calendar day (UTC), including zero-count
 * days so the chart never has gaps — generated via Postgres' generate_series joined against the
 * real counts, a single round trip rather than N queries.
 */
export async function getScansTimeSeries(
  filters: AnalyticsFilters,
  range: DateRange
): Promise<TimeSeriesPoint[]> {
  const deviceFilter = filters.deviceId ? sql`AND s.device_id = ${filters.deviceId}` : sql``;
  const locationFilter = filters.locationId ? sql`AND s.location_id = ${filters.locationId}` : sql``;

  const rows = await db.execute<{ day: string; count: number }>(sql`
    SELECT to_char(d.day, 'YYYY-MM-DD') AS day, count(s.id)::int AS count
    FROM generate_series(${range.start}::timestamptz, ${range.end}::timestamptz - interval '1 day', interval '1 day') AS d(day)
    LEFT JOIN scans s
      ON s.scanned_at >= d.day AND s.scanned_at < d.day + interval '1 day'
      AND s.location_id IN (SELECT id FROM locations WHERE account_id = ${filters.accountId})
      ${locationFilter}
      ${deviceFilter}
    GROUP BY d.day
    ORDER BY d.day
  `);

  return rows.rows.map((r) => ({ date: r.day, scans: Number(r.count) }));
}

export type AnalyticsSummary = {
  totalScans: number;
  totalScansTrendPercent: number | null; // null = no previous-period data to compare against
  activeDevices: number;
  mostUsedLocation: { name: string; googleReviewUrl: string; scanCount: number } | null;
  conversionTrendPercent: number | null; // period-over-period % change in total scans — see
  // 04_PROJECT_STATE.md's Step 6 entry for why this is the chosen interpretation of the scope
  // doc's "conversion/engagement stats" (Google doesn't report review submissions back to us,
  // so there is no real conversion-tracking data in the schema to compute a true conversion rate
  // from — the trend of scan volume itself is the closest honest proxy available).
  timeSeries: TimeSeriesPoint[];
};

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? null : 100;
  return Math.round(((current - previous) / previous) * 100);
}

export async function getAnalyticsSummary(filters: AnalyticsFilters): Promise<AnalyticsSummary> {
  const prevRange = previousPeriod(filters.range);

  const [totalScans, prevScans, activeDevices, mostUsedLocation, timeSeries] = await Promise.all([
    getScanCount(filters, filters.range),
    getScanCount(filters, prevRange),
    getActiveDeviceCount(filters),
    getMostUsedLocation(filters, filters.range),
    getScansTimeSeries(filters, filters.range),
  ]);

  const trend = pctChange(totalScans, prevScans);

  return {
    totalScans,
    totalScansTrendPercent: trend,
    activeDevices,
    mostUsedLocation: mostUsedLocation
      ? {
          name: mostUsedLocation.name,
          googleReviewUrl: mostUsedLocation.googleReviewUrl,
          scanCount: mostUsedLocation.scanCount,
        }
      : null,
    conversionTrendPercent: trend,
    timeSeries,
  };
}

export type ScanExportRow = {
  scannedAt: string;
  deviceCode: string;
  locationName: string;
  employeeName: string | null;
};

/** Raw scan rows for CSV/PDF export, scoped + filtered identically to the on-screen view. */
export async function getScanExportRows(filters: AnalyticsFilters): Promise<ScanExportRow[]> {
  const conditions = [
    eq(locations.accountId, filters.accountId),
    gte(scans.scannedAt, filters.range.start),
    lt(scans.scannedAt, filters.range.end),
  ];
  if (filters.locationId) conditions.push(eq(scans.locationId, filters.locationId));
  if (filters.deviceId) conditions.push(eq(scans.deviceId, filters.deviceId));

  const rows = await db
    .select({
      scannedAt: scans.scannedAt,
      deviceCode: devices.code,
      locationName: locations.name,
      employeeName: sql<string | null>`(SELECT name FROM employees WHERE id = ${scans.employeeId})`,
    })
    .from(scans)
    .innerJoin(locations, eq(scans.locationId, locations.id))
    .innerJoin(devices, eq(scans.deviceId, devices.id))
    .where(and(...conditions))
    .orderBy(scans.scannedAt);

  return rows.map((r) => ({
    scannedAt: r.scannedAt.toISOString(),
    deviceCode: r.deviceCode,
    locationName: r.locationName,
    employeeName: r.employeeName,
  }));
}
