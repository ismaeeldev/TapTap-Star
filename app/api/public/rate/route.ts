import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { devices } from "@/lib/db/schema";
import { reviewRatingSchema } from "@/lib/validation";

// POST /api/public/rate — no auth (a scanning customer, not a logged-in user). Given a device
// code + the star rating they just tapped, decides the outcome per that location's filtering
// config: rating >= threshold -> the review platform's URL (customer's own browser does the
// redirect client-side, this route never redirects itself — the star-picker page is what's
// loaded, not a route the browser navigates through again); rating < threshold -> tells the
// caller to show the private feedback form instead. Never writes anything here — the actual
// private_feedback row is only written by /api/public/feedback, once the customer optionally
// submits that form (a customer who picks a low star and then closes the tab leaves nothing
// behind, which is the correct, privacy-respecting default — same reasoning as an abandoned
// form anywhere else).
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = reviewRatingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const { code, rating } = parsed.data;

    // Case-insensitive match — same reasoning/fix as app/r/[code]/route.ts (Modifications 6).
    const device = await db.query.devices.findFirst({
      where: sql`lower(${devices.code}) = lower(${code})`,
    });
    if (!device || device.status !== "active" || !device.locationId) {
      return NextResponse.json({ message: "Device not found or not active" }, { status: 404 });
    }

    const location = await db.query.locations.findFirst({
      where: (l, { eq }) => eq(l.id, device.locationId!),
    });
    if (!location) {
      return NextResponse.json({ message: "Location not found" }, { status: 404 });
    }

    // Filtering could have been turned off between the redirect (app/r/[code]/route.ts) and
    // this submission (rare, but a business owner could disable it in that window) — re-check
    // live rather than trusting the fact the customer reached this page at all. If it's off,
    // every rating is treated as "positive" (always go to the review platform), matching what a
    // direct, unfiltered redirect would have done.
    if (!location.reviewFilterEnabled) {
      return NextResponse.json({ outcome: "redirect", url: location.googleReviewUrl });
    }

    const isPositive = rating >= location.reviewFilterThreshold;
    if (isPositive) {
      const url =
        location.reviewDestinationType === "custom" && location.reviewDestinationUrl
          ? location.reviewDestinationUrl
          : location.googleReviewUrl;
      return NextResponse.json({ outcome: "redirect", url });
    }

    return NextResponse.json({ outcome: "feedback" });
  } catch (err) {
    console.error("[public/rate] unexpected error:", err);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
