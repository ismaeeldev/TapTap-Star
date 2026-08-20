// POST /api/admin/billing/[accountId]/credit — admin support tool: applies a real Stripe
// customer-balance credit (reduces what the account owes on its next invoice). taptapstar_admin
// only. Logs to audit_logs, confirm-dialog enforced client-side per theme guideline §4's
// destructive-action pattern (this moves real money, same treatment as Step 8's
// /admin/billing-settings price change).
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts, auditLogs } from "@/lib/db/schema";
import { requireRole, authErrorResponse } from "@/lib/auth/rbac";
import { supportBillingCreditSchema } from "@/lib/validation";
import { stripe } from "@/lib/stripe/client";

export async function POST(req: Request, { params }: { params: Promise<{ accountId: string }> }) {
  try {
    const session = await requireRole("taptapstar_admin");
    const { accountId } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }
    const parsed = supportBillingCreditSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { amountCents, reason } = parsed.data;

    const account = await db.query.accounts.findFirst({ where: eq(accounts.id, accountId) });
    if (!account) {
      return NextResponse.json({ message: "Account not found" }, { status: 404 });
    }
    if (!account.stripeCustomerId) {
      return NextResponse.json(
        { message: "This account has no Stripe customer on file yet — nothing to credit" },
        { status: 400 }
      );
    }

    // A negative amount on a Customer Balance Transaction is a CREDIT (reduces the customer's
    // amount due on their next invoice) — a positive amount would be a debit. Real Stripe API
    // call, not simulated.
    const balanceTransaction = await stripe.customers.createBalanceTransaction(
      account.stripeCustomerId,
      {
        amount: -amountCents,
        currency: "usd",
        description: reason,
      }
    );

    await db.insert(auditLogs).values({
      actorUserId: session.user.id,
      action: "admin_billing_credit_applied",
      targetType: "account",
      targetId: accountId,
      metadataJson: {
        amountCents,
        reason,
        stripeBalanceTransactionId: balanceTransaction.id,
        stripeCustomerId: account.stripeCustomerId,
        newStripeBalance: balanceTransaction.ending_balance,
      },
    });

    return NextResponse.json({
      ok: true,
      stripeBalanceTransactionId: balanceTransaction.id,
      newStripeBalance: balanceTransaction.ending_balance,
    });
  } catch (error) {
    const { message, status } = authErrorResponse(error);
    return NextResponse.json({ message }, { status });
  }
}
