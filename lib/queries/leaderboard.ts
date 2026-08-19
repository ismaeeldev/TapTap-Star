// Shared rank/scan-count computation per ../../AgentGuide/03_DATA_MODEL_AND_ARCHITECTURE.md
// section 9 — used by BOTH the owner's /dashboard/employees leaderboard and the public
// /e/[token] employee private view. Do not duplicate this ranking logic anywhere else.
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { employees, locations, scans, targets } from "@/lib/db/schema";

export type PeriodRange = { start: Date; end: Date };

/** Current calendar month, UTC-based, [start, end). */
export function getCurrentMonthRange(now: Date = new Date()): PeriodRange {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

/** Current ISO week (Monday-based), UTC, [start, end). */
export function getCurrentWeekRange(now: Date = new Date()): PeriodRange {
  const day = now.getUTCDay(); // 0=Sun..6=Sat
  const diffToMonday = day === 0 ? 6 : day - 1;
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday)
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  return { start, end };
}

export function rangeForPeriodType(periodType: "weekly" | "monthly", now: Date = new Date()) {
  return periodType === "weekly" ? getCurrentWeekRange(now) : getCurrentMonthRange(now);
}

export type EmployeeRankRow = {
  id: string;
  name: string;
  locationId: string;
  accessToken: string;
  scanCount: number;
  rank: number;
  totalEmployees: number;
};

/**
 * Ranks every employee at `locationId` by scan count within `range` (descending — most scans
 * is rank 1). Ties share display order by name for stability. Used by the owner leaderboard
 * (per-location breakdown) and the /e/[token] "rank at their location" figure.
 */
export async function getEmployeeRankingsForLocation(
  locationId: string,
  range: PeriodRange
): Promise<EmployeeRankRow[]> {
  const emps = await db.query.employees.findMany({
    where: eq(employees.locationId, locationId),
    orderBy: (e, { asc }) => [asc(e.name)],
  });
  if (emps.length === 0) return [];

  const counts = await db
    .select({ employeeId: scans.employeeId, count: sql<number>`count(*)::int` })
    .from(scans)
    .where(
      and(
        eq(scans.locationId, locationId),
        gte(scans.scannedAt, range.start),
        lt(scans.scannedAt, range.end)
      )
    )
    .groupBy(scans.employeeId);

  const countMap = new Map(counts.map((c) => [c.employeeId, c.count]));
  const withCounts = emps.map((e) => ({
    id: e.id,
    name: e.name,
    locationId: e.locationId,
    accessToken: e.accessToken,
    scanCount: countMap.get(e.id) ?? 0,
  }));

  withCounts.sort((a, b) => b.scanCount - a.scanCount || a.name.localeCompare(b.name));

  return withCounts.map((e, i) => ({
    ...e,
    rank: i + 1,
    totalEmployees: withCounts.length,
  }));
}

/** All-time scan count for a single employee (no date range). */
export async function getEmployeeAllTimeCount(employeeId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(scans)
    .where(eq(scans.employeeId, employeeId));
  return row?.count ?? 0;
}

export type ActiveTargetWithProgress = {
  id: string;
  periodType: "weekly" | "monthly";
  targetScans: number;
  currentScans: number;
  progress: number; // 0..1+ (can exceed 1 if goal is beaten)
};

/**
 * Every active target row for a location (at most one per period_type, per the architecture
 * doc's "no history kept" design), each with the team's current progress for that target's own
 * period window. Returns [] if the location has no target set — callers must never render a
 * broken 0/0 progress bar in that case.
 */
export async function getActiveTargetsWithProgress(
  locationId: string
): Promise<ActiveTargetWithProgress[]> {
  const rows = await db.query.targets.findMany({
    where: eq(targets.locationId, locationId),
  });
  if (rows.length === 0) return [];

  const results: ActiveTargetWithProgress[] = [];
  for (const t of rows) {
    const range = rangeForPeriodType(t.periodType);
    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(scans)
      .where(
        and(
          eq(scans.locationId, locationId),
          gte(scans.scannedAt, range.start),
          lt(scans.scannedAt, range.end)
        )
      );
    const currentScans = countRow?.count ?? 0;
    results.push({
      id: t.id,
      periodType: t.periodType,
      targetScans: t.targetScans,
      currentScans,
      progress: t.targetScans > 0 ? currentScans / t.targetScans : 0,
    });
  }
  return results;
}

/** Looks up an employee by their public access token, including their location. */
export async function getEmployeeByAccessToken(accessToken: string) {
  return db.query.employees.findFirst({
    where: eq(employees.accessToken, accessToken),
    with: { location: true },
  });
}

export type LeaderboardLocationGroup = {
  location: { id: string; name: string };
  employees: EmployeeRankRow[];
};

/** Every location for an account, each with its ranked employee list for `range`. */
export async function getAccountLeaderboard(
  accountId: string,
  range: PeriodRange
): Promise<LeaderboardLocationGroup[]> {
  const locs = await db.query.locations.findMany({
    where: eq(locations.accountId, accountId),
    orderBy: (l, { asc }) => [asc(l.name)],
  });
  const groups: LeaderboardLocationGroup[] = [];
  for (const loc of locs) {
    const rankings = await getEmployeeRankingsForLocation(loc.id, range);
    groups.push({ location: { id: loc.id, name: loc.name }, employees: rankings });
  }
  return groups;
}
