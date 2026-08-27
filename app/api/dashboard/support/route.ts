// Authenticated dashboard support submission — client-requested (Modifications 3 PDF, item 8):
// "I want a support option so people can contact me if any problem. I need you to tell me how to
// assist customers too." Clarified via follow-up question: this is the BUSINESS OWNER contacting
// Taptapstar's own support team, not end-customers contacting the business.
//
// Deliberately reuses the same contactMessages table + notify() pipeline as the public marketing
// /api/contact route (app/api/contact/route.ts) rather than building a parallel system — the
// existing app/admin/support inbox already lists/manages that table, so a dashboard submission
// shows up there for free. name/email come from the authenticated session, never from request
// body input, and the message body is prefixed with the account context so an admin reading the
// inbox can immediately tell this came from an existing paying customer's dashboard, not the
// public marketing site.
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { contactMessages, users, accounts } from "@/lib/db/schema";
import { dashboardSupportSchema } from "@/lib/validation";
import { notify } from "@/lib/email/notify";
import { requireSession, authErrorResponse } from "@/lib/auth/rbac";

export async function POST(req: Request) {
  try {
    const session = await requireSession();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }

    const parsed = dashboardSupportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const account = await db.query.accounts.findFirst({
      where: eq(accounts.id, session.user.accountId),
    });

    const businessLabel = account?.name ? ` (${account.name})` : "";
    const message = `[Dashboard support request${businessLabel}]\n\n${parsed.data.message}`;

    const [row] = await db
      .insert(contactMessages)
      .values({ name: session.user.name, email: session.user.email, message })
      .returning();

    const adminUser = await db.query.users.findFirst({ where: eq(users.role, "taptapstar_admin") });
    if (adminUser) {
      const adminInboxEmail = process.env.ADMIN_INBOX_EMAIL;
      await notify(adminUser.accountId, "contact_form_submitted", {
        name: session.user.name,
        email: session.user.email,
        message,
        recipientEmail: adminInboxEmail || undefined,
      });
    } else {
      console.error("[dashboard/support] no taptapstar_admin user found — admin notification not sent");
    }

    return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
