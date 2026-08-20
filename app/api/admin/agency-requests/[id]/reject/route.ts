// Reject an agency request — sets agency_status: 'rejected', account stays type: 'business'.
// An optional reason is accepted; the schema has no dedicated rejection-reason column (no
// migration invented for it here — see 04_PROJECT_STATE.md), so the reason (when given) is
// recorded on the existing audit_logs table instead, which already exists for exactly this kind
// of admin-action trail.
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts, auditLogs } from "@/lib/db/schema";
import { requireRole, authErrorResponse } from "@/lib/auth/rbac";
import { agencyRejectSchema } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole("taptapstar_admin");
    const { id } = await params;

    let body: unknown = {};
    try {
      body = await req.json();
    } catch {
      // No body sent — reason is optional, fine to proceed with {}.
    }
    const parsed = agencyRejectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

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
      .set({ agencyStatus: "rejected", updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning();

    await db.insert(auditLogs).values({
      actorUserId: session.user.id,
      action: "agency_request_rejected",
      targetType: "account",
      targetId: id,
      metadataJson: parsed.data.reason ? { reason: parsed.data.reason } : null,
    });

    return NextResponse.json({ ok: true, accountId: updated.id, agencyStatus: updated.agencyStatus });
  } catch (error) {
    const { message, status } = authErrorResponse(error);
    return NextResponse.json({ message }, { status });
  }
}
