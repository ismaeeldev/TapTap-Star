// Server-side RBAC helpers per ../../AgentGuide/03_DATA_MODEL_AND_ARCHITECTURE.md section 4.
// Every API route from Step 3 onward must call one of these BEFORE touching the DB — middleware
// only does coarse route gating, it is never sufficient on its own (SRS 4.1: "Role-based access
// control enforced on every backend endpoint, not just in the UI").
//
// Usage pattern:
//   const session = await requireRole(["owner", "agency_admin"]); // throws AuthError -> 401/403
//   const rows = await db.query.devices.findMany({ where: eq(devices.accountId, session.user.accountId) });
//
// For agency drill-down into a child business (Step 7's /dashboard/clients/[id]):
//   await requireAccountAccess(session, targetAccountId);
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { Session } from "next-auth";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Throws a 401 AuthError if there is no logged-in session. */
export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    throw new AuthError("Not authenticated", 401);
  }
  return session;
}

/**
 * Throws a 401 if unauthenticated, a 403 if the session's role isn't in `roles`.
 * Pass a single role or an array of allowed roles.
 */
export async function requireRole(
  roles: Session["user"]["role"] | Session["user"]["role"][]
): Promise<Session> {
  const session = await requireSession();
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(session.user.role)) {
    throw new AuthError("Forbidden", 403);
  }
  return session;
}

/**
 * Multi-tenant isolation guard (architecture doc section 4). Verifies the session may access
 * `targetAccountId` — either it IS the session's own account, or the session belongs to an
 * approved agency (BOTH `type='agency'` AND `agency_status='approved'` — never gate on type
 * alone, see the architecture doc's explicit warning) whose `parent_agency_id` matches the
 * target account. Throws a 403 AuthError otherwise. Use this on every route that takes an
 * :accountId/:clientId param, rather than reimplementing the check ad hoc.
 */
export async function requireAccountAccess(
  session: Session,
  targetAccountId: string
): Promise<void> {
  if (session.user.accountId === targetAccountId) return;

  if (
    session.user.role === "agency_admin" &&
    session.user.accountType === "agency" &&
    session.user.agencyStatus === "approved"
  ) {
    const target = await db.query.accounts.findFirst({
      where: eq(accounts.id, targetAccountId),
    });
    if (target?.parentAgencyId === session.user.accountId) return;
  }

  throw new AuthError("Forbidden — you do not have access to this account", 403);
}

/** Convenience: turn an AuthError into a NextResponse-shaped { message, status } pair. */
export function authErrorResponse(error: unknown): { message: string; status: number } {
  if (error instanceof AuthError) {
    return { message: error.message, status: error.status };
  }
  return { message: "Something went wrong", status: 500 };
}
