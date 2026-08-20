// GET /api/admin/accounts/[id] — one account's detail for /admin/accounts/[id]: its businesses
// (if agency), devices, and subscription status. taptapstar_admin only.
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts, devices, subscriptions, locations } from "@/lib/db/schema";
import { requireRole, authErrorResponse } from "@/lib/auth/rbac";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("taptapstar_admin");
    const { id } = await params;

    const account = await db.query.accounts.findFirst({ where: eq(accounts.id, id) });
    if (!account) {
      return NextResponse.json({ message: "Account not found" }, { status: 404 });
    }

    const [accountDevices, subscription, childBusinesses, accountLocations] = await Promise.all([
      db.query.devices.findMany({
        where: eq(devices.accountId, id),
        orderBy: (d, { desc }) => [desc(d.createdAt)],
      }),
      db.query.subscriptions.findFirst({
        where: eq(subscriptions.accountId, id),
        orderBy: (s, { desc }) => [desc(s.createdAt)],
      }),
      account.type === "agency"
        ? db.query.accounts.findMany({ where: eq(accounts.parentAgencyId, id) })
        : Promise.resolve([]),
      // Used by /admin/support's force-reassign tool to populate the location/employee pickers
      // for an arbitrary (not the session's own) account.
      db.query.locations.findMany({
        where: eq(locations.accountId, id),
        with: { employees: true },
      }),
    ]);

    return NextResponse.json({
      account,
      devices: accountDevices,
      subscription: subscription ?? null,
      childBusinesses,
      locations: accountLocations.map((l) => ({
        id: l.id,
        name: l.name,
        employees: l.employees.map((e) => ({ id: e.id, name: e.name })),
      })),
    });
  } catch (error) {
    const { message, status } = authErrorResponse(error);
    return NextResponse.json({ message }, { status });
  }
}
