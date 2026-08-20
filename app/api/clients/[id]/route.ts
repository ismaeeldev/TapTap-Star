// /dashboard/clients/[id] drill-down data source — devices, employees, scans, rankings for one
// client business, scoped to that client's own account id (never the session's own accountId).
// Access verified via requireAccountAccess() (lib/auth/rbac.ts's shared BOTH-check helper) —
// this is the multi-tenant isolation boundary the client called out as non-negotiable, so this
// route must reject (403), not just hide in the UI, any account without a real parent_agency_id
// match.
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts, devices, locations } from "@/lib/db/schema";
import { requireSession, requireAccountAccess, authErrorResponse } from "@/lib/auth/rbac";
import { getAnalyticsSummary } from "@/lib/queries/analytics";
import { getAccountLeaderboard, getCurrentMonthRange } from "@/lib/queries/leaderboard";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;

    await requireAccountAccess(session, id);

    const account = await db.query.accounts.findFirst({ where: eq(accounts.id, id) });
    if (!account) {
      return NextResponse.json({ message: "Client not found" }, { status: 404 });
    }

    const range = getCurrentMonthRange();

    const [deviceRows, locationRows, analytics, leaderboard] = await Promise.all([
      db.query.devices.findMany({
        where: eq(devices.accountId, id),
        orderBy: (d, { desc }) => [desc(d.createdAt)],
      }),
      db.query.locations.findMany({ where: eq(locations.accountId, id) }),
      getAnalyticsSummary({ accountId: id, range }),
      getAccountLeaderboard(id, range),
    ]);

    return NextResponse.json({
      client: { id: account.id, name: account.name, billingEmail: account.billingEmail, status: account.status },
      devices: deviceRows,
      locations: locationRows,
      analytics,
      leaderboard,
    });
  } catch (error) {
    const { message, status } = authErrorResponse(error);
    return NextResponse.json({ message }, { status });
  }
}
