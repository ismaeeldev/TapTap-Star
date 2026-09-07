// Business-owner side of the approval-based agency flow (00_SCOPE_DOCUMENT.md §5.9).
// POST sets agency_status: 'pending' + agency_requested_at — nothing else about the account
// changes (type stays 'business', /dashboard/clients stays locked) until a taptapstar_admin
// approves from /admin/agency-requests.
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts, users } from "@/lib/db/schema";
import { requireSession, authErrorResponse } from "@/lib/auth/rbac";
import { notify } from "@/lib/email/notify";

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

    // Modifications 7 (client PDF, item 4): "where do I receive mails and messages from clients
    // interested in this service?" — previously nothing notified an admin that a new request
    // existed at all; it only ever showed up by manually checking /admin/agency-requests. Same
    // admin-lookup pattern as app/api/contact/route.ts's trigger #9 — never allowed to fail the
    // actual request submission itself, only logged if something goes wrong.
    try {
      const adminUser = await db.query.users.findFirst({
        where: eq(users.role, "taptapstar_admin"),
      });
      if (adminUser) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://taptap-star.vercel.app";
        await notify(adminUser.accountId, "agency_request_submitted", {
          accountName: account.name,
          reviewUrl: `${appUrl.replace(/\/$/, "")}/admin/agency-requests`,
          recipientEmail: process.env.ADMIN_INBOX_EMAIL || undefined,
        });
      } else {
        console.error("[agency/request] no taptapstar_admin user found — admin notification not sent");
      }
    } catch (err) {
      console.error("[agency/request] failed to send admin notification:", err);
    }

    return NextResponse.json({ ok: true, agencyStatus: updated.agencyStatus });
  } catch (error) {
    const { message, status } = authErrorResponse(error);
    return NextResponse.json({ message }, { status });
  }
}
