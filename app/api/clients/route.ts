// /dashboard/clients data source. Requires type='agency' AND agency_status='approved' — checked
// server-side here (not just UI-hidden), per 03_DATA_MODEL_AND_ARCHITECTURE.md §4's explicit
// "check BOTH" warning.
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts, users } from "@/lib/db/schema";
import { requireSession, authErrorResponse, AuthError, isApprovedAgencySession } from "@/lib/auth/rbac";
import { createClientAccountSchema } from "@/lib/validation";
import { getAgencyClients, rollupClients } from "@/lib/queries/agency";
import { syncAgencySubscriptionQuantity } from "@/lib/stripe/subscription";

// Live DB re-check, not the session's cached accountType/agencyStatus/role — see
// isApprovedAgencySession's doc comment in lib/auth/rbac.ts for why this matters (a
// just-approved agency's own already-open session must not be denied its own /dashboard/clients).
async function assertApprovedAgency(session: Awaited<ReturnType<typeof requireSession>>) {
  if (!(await isApprovedAgencySession(session))) {
    throw new AuthError("This account is not an approved agency", 403);
  }
}

export async function GET() {
  try {
    const session = await requireSession();
    await assertApprovedAgency(session);

    const clients = await getAgencyClients(session.user.accountId);
    const rollup = rollupClients(clients);

    return NextResponse.json({ clients, rollup });
  } catch (error) {
    const { message, status } = authErrorResponse(error);
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    await assertApprovedAgency(session);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }
    const parsed = createClientAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { businessName, ownerName, email, password } = parsed.data;

    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existing) {
      return NextResponse.json({ message: "An account with this email already exists" }, {
        status: 409,
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [account] = await db
      .insert(accounts)
      .values({
        type: "business",
        name: businessName,
        billingEmail: email,
        parentAgencyId: session.user.accountId,
      })
      .returning();

    await db.insert(users).values({
      accountId: account.id,
      email,
      passwordHash,
      role: "owner",
      name: ownerName,
      // Client accounts created directly by their agency don't need the signup email-verify
      // loop — the agency vouches for them. Marked verified immediately so the agency can log
      // in on the client's behalf / the client can log in right away without a verify step.
      emailVerifiedAt: new Date(),
    });

    // The one remaining quantity-based Stripe sync (§6/§8): a new managed business changes the
    // agency's own billable_quantity — recompute + push to Stripe. Deliberately NOT allowed to
    // fail the client-creation request itself (same reasoning as signup's Stripe try/catch) —
    // the client account is real and usable either way; the quantity will self-correct at the
    // next invoice.upcoming webhook safety-net sync if this call has a transient failure.
    try {
      await syncAgencySubscriptionQuantity(session.user.accountId);
    } catch (err) {
      console.error(
        `[clients] Stripe agency quantity sync failed for agency ${session.user.accountId} after creating client ${account.id}`,
        err
      );
    }

    return NextResponse.json({ ok: true, clientId: account.id }, { status: 201 });
  } catch (error) {
    const { message, status } = authErrorResponse(error);
    return NextResponse.json({ message }, { status });
  }
}
