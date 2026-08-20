// GET /api/admin/devices — platform-wide device list/search (by code, status, account, source)
// for /admin/devices. taptapstar_admin only.
import { NextResponse } from "next/server";
import { and, count, eq, ilike } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { devices } from "@/lib/db/schema";
import { requireRole, authErrorResponse } from "@/lib/auth/rbac";
import { adminDeviceSearchSchema } from "@/lib/validation";

const PAGE_SIZE = 25;

export async function GET(req: Request) {
  try {
    await requireRole("taptapstar_admin");

    const { searchParams } = new URL(req.url);
    const parsed = adminDeviceSearchSchema.safeParse({
      q: searchParams.get("q") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      source: searchParams.get("source") ?? undefined,
      page: searchParams.get("page") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid query" }, { status: 400 });
    }
    const { q, status, source, page } = parsed.data;

    const clauses = [];
    if (q) clauses.push(ilike(devices.code, `%${q}%`));
    if (status) clauses.push(eq(devices.status, status));
    if (source) clauses.push(eq(devices.source, source));
    const whereClause = clauses.length ? and(...clauses) : undefined;

    const [{ total }] = await db.select({ total: count() }).from(devices).where(whereClause);

    const rows = await db.query.devices.findMany({
      where: whereClause,
      orderBy: (d, { desc }) => [desc(d.createdAt)],
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      with: { account: true, location: true },
    });

    return NextResponse.json({
      devices: rows.map((d) => ({
        id: d.id,
        code: d.code,
        type: d.type,
        status: d.status,
        source: d.source,
        accountName: d.account?.name ?? null,
        accountId: d.accountId,
        locationName: d.location?.name ?? null,
        createdAt: d.createdAt,
        activatedAt: d.activatedAt,
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
