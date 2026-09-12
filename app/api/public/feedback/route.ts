import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts, devices, privateFeedback } from "@/lib/db/schema";
import { privateFeedbackSchema } from "@/lib/validation";
import { notify } from "@/lib/email/notify";
import { generateReviewReply } from "@/lib/ai/reply";

// POST /api/public/feedback — no auth. Writes a real private_feedback row for a low-star
// submission (never posted publicly, never touches the review platform — the business owner
// reviews/manages these from /dashboard/feedback). deviceId is stored on the row itself (not a
// separate scanId) — the dashboard can already resolve "which employee's tap led to this" via
// the device's current employeeId, the same way every other device-scoped view in this app
// already does, without needing a second denormalized reference.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = privateFeedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const { code, rating, comment, contactName, contactEmail } = parsed.data;

    const device = await db.query.devices.findFirst({
      where: sql`lower(${devices.code}) = lower(${code})`,
    });
    if (!device || device.status !== "active" || !device.locationId || !device.accountId) {
      return NextResponse.json({ message: "Device not found or not active" }, { status: 404 });
    }

    const location = await db.query.locations.findFirst({
      where: (l, { eq }) => eq(l.id, device.locationId!),
    });
    if (!location) {
      return NextResponse.json({ message: "Location not found" }, { status: 404 });
    }

    const [row] = await db
      .insert(privateFeedback)
      .values({
        accountId: device.accountId,
        locationId: device.locationId,
        deviceId: device.id,
        rating,
        comment: comment || null,
        contactName: contactName || null,
        contactEmail: contactEmail || null,
      })
      .returning();

    // Real-time alert (Premium/Network's "real-time scan alerts" feature) — a low-star private
    // submission is exactly the kind of event a business owner wants to know about immediately,
    // not just see later in a list. Never allowed to fail the submission itself.
    try {
      await notify(device.accountId, "low_rating_feedback", {
        locationName: location.name,
        rating,
        comment: comment || null,
        feedbackUrl: `${new URL(request.url).origin}/dashboard/feedback`,
      });
    } catch (err) {
      // Notification failures must never surface as a submission failure to the customer.
      console.error("[public/feedback] alert notification failed:", err);
    }

    // Modifications 9 (client PDF, items 1/6): AI-answered reviews, Premium-only (server-side
    // gate — mirrors review filtering's own plan check, never trust a client-side toggle alone),
    // and only when this location has turned it on and this rating meets the owner's own
    // threshold. Fire-and-forget-ish: awaited so aiReplyStatus is accurate in the same response
    // cycle, but any failure here must never fail (or even slow down the customer's view of) the
    // submission itself — the draft is a dashboard-only convenience for the owner, not something
    // the customer is waiting on.
    const account = await db.query.accounts.findFirst({ where: eq(accounts.id, device.accountId) });
    const aiEligible =
      (account?.planKey === "premium" || account?.planKey === "network") &&
      location.aiReplyEnabled &&
      rating >= location.aiReplyThreshold;
    if (aiEligible) {
      try {
        const draft = await generateReviewReply({
          businessName: account!.name,
          rating,
          comment: comment || null,
        });
        await db
          .update(privateFeedback)
          .set({ aiReplyStatus: "drafted", aiReplyDraft: draft })
          .where(eq(privateFeedback.id, row.id));
      } catch (err) {
        console.error(`[public/feedback] AI reply generation failed for feedback ${row.id}:`, err);
        await db
          .update(privateFeedback)
          .set({ aiReplyStatus: "failed" })
          .where(eq(privateFeedback.id, row.id));
      }
    }

    return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
  } catch (err) {
    console.error("[public/feedback] unexpected error:", err);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
