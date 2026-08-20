// Shared agency/multi-client query layer for Step 7 — mirrors the pattern established in
// lib/queries/leaderboard.ts and lib/queries/analytics.ts: query functions live here, reused by
// both server components and API routes rather than duplicating SQL.
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts, auditLogs, devices, employees, locations } from "@/lib/db/schema";
import { getAnalyticsSummary, type AnalyticsSummary } from "@/lib/queries/analytics";
import { getCurrentMonthRange } from "@/lib/queries/leaderboard";

/** Most recent rejection reason recorded against an account, if any (see the reject route's
 * audit_logs note — there is no dedicated schema column for this). */
export async function getLatestRejectionReason(accountId: string): Promise<string | null> {
  const row = await db.query.auditLogs.findFirst({
    where: and(eq(auditLogs.targetId, accountId), eq(auditLogs.action, "agency_request_rejected")),
    orderBy: [desc(auditLogs.createdAt)],
  });
  const metadata = row?.metadataJson as { reason?: string } | null | undefined;
  return metadata?.reason ?? null;
}

export type ClientSummaryRow = {
  id: string;
  name: string;
  billingEmail: string;
  status: string;
  locationCount: number;
  deviceCount: number;
  employeeCount: number;
  createdAt: string;
  analytics: AnalyticsSummary;
};

/** Every child business account under an agency, each with a roll-up summary for the current
 * calendar month, reusing lib/queries/analytics.ts's per-account query (no duplicated logic). */
export async function getAgencyClients(agencyAccountId: string): Promise<ClientSummaryRow[]> {
  const rows = await db.query.accounts.findMany({
    where: eq(accounts.parentAgencyId, agencyAccountId),
    orderBy: (a, { desc: descOrder }) => [descOrder(a.createdAt)],
  });

  const range = getCurrentMonthRange();

  const clients = await Promise.all(
    rows.map(async (account) => {
      const [locationRows, deviceRows, employeeRows, analytics] = await Promise.all([
        db.query.locations.findMany({ where: eq(locations.accountId, account.id) }),
        db.query.devices.findMany({ where: eq(devices.accountId, account.id) }),
        db
          .select({ id: employees.id })
          .from(employees)
          .innerJoin(locations, eq(employees.locationId, locations.id))
          .where(eq(locations.accountId, account.id)),
        getAnalyticsSummary({ accountId: account.id, range }),
      ]);

      return {
        id: account.id,
        name: account.name,
        billingEmail: account.billingEmail,
        status: account.status,
        locationCount: locationRows.length,
        deviceCount: deviceRows.length,
        employeeCount: employeeRows.length,
        createdAt: account.createdAt.toISOString(),
        analytics,
      };
    })
  );

  return clients;
}

export type ClientRollup = {
  totalScans: number;
  totalDevices: number;
  activeDevices: number;
  totalLocations: number;
  totalEmployees: number;
  totalClients: number;
};

export function rollupClients(clients: ClientSummaryRow[]): ClientRollup {
  return {
    totalScans: clients.reduce((sum, c) => sum + c.analytics.totalScans, 0),
    totalDevices: clients.reduce((sum, c) => sum + c.deviceCount, 0),
    activeDevices: clients.reduce((sum, c) => sum + c.analytics.activeDevices, 0),
    totalLocations: clients.reduce((sum, c) => sum + c.locationCount, 0),
    totalEmployees: clients.reduce((sum, c) => sum + c.employeeCount, 0),
    totalClients: clients.length,
  };
}
