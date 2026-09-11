import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { devices, privateFeedback } from "@/lib/db/schema";
import { privateFeedbackSchema } from "@/lib/validation";
import { notify } from "@/lib/email/notify";

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

    return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
  } catch (err) {
    console.error("[public/feedback] unexpected error:", err);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
