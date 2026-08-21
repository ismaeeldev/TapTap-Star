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
import { accounts, users } from "@/lib/db/schema";
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
    throw new AuthError("Your session has expired — please log in again.", 401);
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
 * Live re-check of an account's `type`/`agency_status` (and the session's own role) straight
 * from the DB — never trust the session's cached copies of these three fields for an
 * authorization decision. Auth.js v5's JWT `jwt()` callback (lib/auth/auth.config.ts) only
 * refreshes token fields on sign-in, not on every request, so `session.user.accountType`/
 * `agencyStatus`/`role` are a snapshot from whenever the user last logged in — stale the moment
 * an admin approves/rejects an agency request or promotes a user's role while that user's
 * browser session is still open. Every agency-gate check must call this instead of reading
 * `session.user.accountType`/`agencyStatus`/`role` directly, or a just-approved agency's own
 * still-open session gets incorrectly denied access to its own new `/dashboard/clients` (while
 * e.g. the settings page, which already queries the DB directly, correctly shows "you're
 * approved" — a real, user-visible contradiction, not just staleness in the abstract).
 */
export async function isApprovedAgencySession(session: Session): Promise<boolean> {
  // Role is promoted to "agency_admin" in the SAME approve-route transaction that flips
  // type/agencyStatus (see app/api/admin/agency-requests/[id]/approve/route.ts) — it goes stale
  // in the JWT at exactly the same moment those two fields do. Gating on the session's cached
  // `role` first (as an earlier version of this function did) silently defeated the whole point
  // of this live re-check: a just-approved session would still fail here on the stale role
  // before ever reaching the DB query. Read the user's live role from the DB too, not the token.
  const [account, user] = await Promise.all([
    db.query.accounts.findFirst({ where: eq(accounts.id, session.user.accountId) }),
    db.query.users.findFirst({ where: eq(users.id, session.user.id) }),
  ]);
  return (
    user?.role === "agency_admin" &&
    account?.type === "agency" &&
    account?.agencyStatus === "approved"
  );
}

/**
 * Multi-tenant isolation guard (architecture doc section 4). Verifies the session may access
 * `targetAccountId` — either it IS the session's own account, or the session belongs to an
 * approved agency (BOTH `type='agency'` AND `agency_status='approved'` — never gate on type
 * alone, see the architecture doc's explicit warning, and always re-verified live via
 * `isApprovedAgencySession` rather than the session's cached snapshot) whose `parent_agency_id`
 * matches the target account. Throws a 403 AuthError otherwise. Use this on every route that
 * takes an :accountId/:clientId param, rather than reimplementing the check ad hoc.
 */
export async function requireAccountAccess(
  session: Session,
  targetAccountId: string
): Promise<void> {
  if (session.user.accountId === targetAccountId) return;

  if (await isApprovedAgencySession(session)) {
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
