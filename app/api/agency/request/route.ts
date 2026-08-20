// Business-owner side of the approval-based agency flow (00_SCOPE_DOCUMENT.md §5.9).
// POST sets agency_status: 'pending' + agency_requested_at — nothing else about the account
// changes (type stays 'business', /dashboard/clients stays locked) until a taptapstar_admin
// approves from /admin/agency-requests.
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts } from "@/lib/db/schema";
import { requireSession, authErrorResponse } from "@/lib/auth/rbac";

export async function POST() {
  try {
    const session = await requireSession();

    const account = await db.query.accounts.findFirst({
      where: eq(accounts.id, session.user.accountId),
    });
    if (!account) {
      return NextResponse.json({ message: "Account not found" }, { status: 404 });
    }
    if (account.type !== "business") {
      return NextResponse.json(
        { message: "Only business accounts can request agency access" },
        { status: 400 }
      );
    }
    if (account.agencyStatus !== "none" && account.agencyStatus !== "rejected") {
      return NextResponse.json(
        { message: "A request is already pending or this account is already an agency" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(accounts)
      .set({ agencyStatus: "pending", agencyRequestedAt: new Date(), updatedAt: new Date() })
      .where(eq(accounts.id, account.id))
      .returning();

    return NextResponse.json({ ok: true, agencyStatus: updated.agencyStatus });
  } catch (error) {
    const { message, status } = authErrorResponse(error);
    return NextResponse.json({ message }, { status });
  }
}
