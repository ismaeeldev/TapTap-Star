// GET /api/admin/accounts — searchable/paginated list of every account (business + agency), for
// /admin/accounts. taptapstar_admin only.
import { NextResponse } from "next/server";
import { count, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts, devices } from "@/lib/db/schema";
import { requireRole, authErrorResponse } from "@/lib/auth/rbac";
import { adminAccountSearchSchema } from "@/lib/validation";

const PAGE_SIZE = 20;

export async function GET(req: Request) {
  try {
    await requireRole("taptapstar_admin");

    const { searchParams } = new URL(req.url);
    const parsed = adminAccountSearchSchema.safeParse({
      q: searchParams.get("q") ?? undefined,
      page: searchParams.get("page") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid query" }, { status: 400 });
    }
    const { q, page } = parsed.data;

    const whereClause = q
      ? or(ilike(accounts.name, `%${q}%`), ilike(accounts.billingEmail, `%${q}%`))
      : undefined;

    const [{ total }] = await db
      .select({ total: count() })
      .from(accounts)
      .where(whereClause ?? sql`true`);

    const rows = await db.query.accounts.findMany({
      where: whereClause,
      orderBy: (a, { desc }) => [desc(a.createdAt)],
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    });

    const accountIds = rows.map((r) => r.id);
    const deviceCounts = accountIds.length
      ? await db
          .select({ accountId: devices.accountId, deviceCount: count() })
          .from(devices)
          .where(inArray(devices.accountId, accountIds))
          .groupBy(devices.accountId)
      : [];
    const deviceCountMap = new Map(deviceCounts.map((d) => [d.accountId, d.deviceCount]));

    return NextResponse.json({
      accounts: rows.map((a) => ({
        id: a.id,
        name: a.name,
        billingEmail: a.billingEmail,
        type: a.type,
        status: a.status,
        agencyStatus: a.agencyStatus,
        createdAt: a.createdAt,
        deviceCount: deviceCountMap.get(a.id) ?? 0,
      })),
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (error) {
    const { message, status } = authErrorResponse(error);
    return NextResponse.json({ message }, { status });
  }
}
