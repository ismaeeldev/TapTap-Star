// Public contact form submission handler (marketing site) — was a { todo } stub. Inserts a real
// contact_messages row, then fires trigger #9 (02_APPLICATION_FLOW.md §8): an internal
// notification to ADMIN_INBOX_EMAIL. notification_events.account_id is NOT NULL and this
// submission has no associated business account, so the notification is tied to the seeded
// taptapstar_admin's own account (a real, meaningful account, not an invented placeholder) —
// documented in 04_PROJECT_STATE.md.
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { contactMessages, users } from "@/lib/db/schema";
import { contactFormSchema } from "@/lib/validation";
import { notify } from "@/lib/email/notify";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { name, email, message } = parsed.data;

  const [row] = await db.insert(contactMessages).values({ name, email, message }).returning();

  const adminUser = await db.query.users.findFirst({ where: eq(users.role, "taptapstar_admin") });
  if (adminUser) {
    const adminInboxEmail = process.env.ADMIN_INBOX_EMAIL;
    await notify(adminUser.accountId, "contact_form_submitted", {
      name,
      email,
      message,
      recipientEmail: adminInboxEmail || undefined,
    });
  } else {
    console.error("[contact] no taptapstar_admin user found — admin notification not sent");
  }

  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
}
