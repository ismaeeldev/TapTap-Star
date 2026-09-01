import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { withDbRetry } from "@/lib/db/retry";
import { accounts, locations } from "@/lib/db/schema";
import { requireSession, requireActiveAccount, authErrorResponse } from "@/lib/auth/rbac";
import { locationSchema } from "@/lib/validation";
import { getPricingPlanByKey } from "@/lib/stripe/pricing";
import { syncNetworkLocationQuantity } from "@/lib/stripe/subscription";

// GET /api/locations — list the session account's locations (used by the claim wizard's
// location-picker step and later dashboard screens).
export async function GET() {
  try {
    const session = await requireSession();
    const rows = await withDbRetry("GET /api/locations", () =>
      db.query.locations.findMany({
        where: eq(locations.accountId, session.user.accountId),
        orderBy: (loc, { desc }) => [desc(loc.createdAt)],
      })
    );
    return NextResponse.json({ locations: rows });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

// POST /api/locations — create a location scoped to the session's accountId. Used by the claim
// wizard's inline "+ Add new location" mini-form.
export async function POST(request: Request) {
  try {
    const session = await requireSession();
    await requireActiveAccount(session);
    const body = await request.json().catch(() => null);
    const parsed = locationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    // Modifications 5 pricing restructure (revision.md §3.4/step 6) — location cap for
    // Free/Premium tiers (locationLimit: 1). Network is unlimited (locationLimit: null), and so
    // is the legacy "default" plan every pre-restructure account still points at
    // (locationLimit: null from step 1's additive migration) — this check is a genuine no-op
    // for every account that existed before this pricing work, by construction, not a special
    // case that needs its own branch.
    const account = await db.query.accounts.findFirst({
      where: eq(accounts.id, session.user.accountId),
    });
    if (!account) {
      return NextResponse.json({ message: "Account not found" }, { status: 404 });
    }
    const plan = await getPricingPlanByKey(account.planKey);
    if (plan.locationLimit !== null) {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(locations)
        .where(eq(locations.accountId, account.id));
      if (count >= plan.locationLimit) {
        return NextResponse.json(
          {
            message: `Your ${plan.name} plan allows up to ${plan.locationLimit} location${
              plan.locationLimit === 1 ? "" : "s"
            }. Upgrade to Network for unlimited locations.`,
          },
          { status: 403 }
        );
      }
    }

    const [location] = await db
      .insert(locations)
      .values({
        accountId: session.user.accountId,
        name: parsed.data.name,
        address: parsed.data.address,
        googleReviewUrl: parsed.data.googleReviewUrl,
        language: parsed.data.language,
      })
      .returning();

    // Network tier's "+$10/mo per location beyond the first" (revision.md §2.1/§2.3) — keeps
    // the real Stripe subscription's per-location item in sync with the new location count.
    // A no-op for every plan except network (see syncNetworkLocationQuantity's own doc
    // comment); never allowed to fail the location creation itself, same "Stripe sync must not
    // block the primary user action" pattern used at signup (app/api/auth/signup/route.ts).
    try {
      await syncNetworkLocationQuantity(session.user.accountId);
    } catch (err) {
      console.error(
        `[locations] Stripe location-quantity sync failed for account ${session.user.accountId} — location created locally, billing sync should be investigated/retried.`,
        err
      );
    }

    return NextResponse.json({ location }, { status: 201 });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
