// Admin side of the approval-based agency flow. Approval is the ONLY thing that flips
// accounts.type to 'agency' and unlocks /dashboard/clients (00_SCOPE_DOCUMENT.md §5.9).
// Minimal internal admin route for now — Step 10 owns the full admin panel polish, but this
// must actually work since nothing can become an agency without it.
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts, users } from "@/lib/db/schema";
import { requireRole, authErrorResponse } from "@/lib/auth/rbac";
import { notify } from "@/lib/email/notify";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole("taptapstar_admin");
    const { id } = await params;

    const account = await db.query.accounts.findFirst({ where: eq(accounts.id, id) });
    if (!account) {
      return NextResponse.json({ message: "Account not found" }, { status: 404 });
    }
    if (account.agencyStatus !== "pending") {
      return NextResponse.json(
        { message: "This account does not have a pending agency request" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(accounts)
      .set({
        type: "agency",
        agencyStatus: "approved",
        agencyApprovedAt: new Date(),
        agencyApprovedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, id))
      .returning();

    // requireAccountAccess() gates on role === "agency_admin" (not just accountType/agencyStatus)
    // — see lib/auth/rbac.ts's explicit BOTH-check pattern. The account's own user(s) must be
    // promoted from "owner" to "agency_admin" or approval would flip the account's fields but
    // still leave every drill-down route rejecting the now-approved agency's own admin.
    await db
      .update(users)
      .set({ role: "agency_admin", updatedAt: new Date() })
      .where(eq(users.accountId, id));

    // Trigger #10 (02_APPLICATION_FLOW.md §8): agency-request-approved.
    await notify(updated.id, "agency_request_approved", {
      dashboardUrl: `${APP_URL}/dashboard`,
    });

    return NextResponse.json({
      ok: true,
      accountId: updated.id,
      type: updated.type,
      agencyStatus: updated.agencyStatus,
    });
  } catch (error) {
    const { message, status } = authErrorResponse(error);
    return NextResponse.json({ message }, { status });
  }
}
