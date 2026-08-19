import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { devices, locations, scans } from "@/lib/db/schema";
import { redis } from "@/lib/redis/client";

export const runtime = "edge";

// /r/[code] — the redirect engine. Per 02_APPLICATION_FLOW.md section 4 /
// 03_DATA_MODEL_AND_ARCHITECTURE.md section 7:
//   unassigned  -> /claim/[code] (the owner activating their own new device)
//   active      -> log a scan (throttled) + instant 302 to the location's google_review_url,
//                  NO rendered UI, ever — a scanning customer must never see a Taptapstar page.
//   deactivated -> branded "not active" page
//   unknown code -> branded "not found" page
// Total added latency budget: <300ms. Keep this edge-runtime, no client-rendered React page in
// the active-device path.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  // Use the incoming request's own origin for internal same-app redirects (/claim/[code],
  // /r/not-found, /r/deactivated) rather than NEXT_PUBLIC_APP_URL — that env var can point at
  // the canonical production domain while this route is actually being served from a different
  // host (local dev on a non-default port, a Vercel preview deployment, etc.), which would send
  // a scanning customer's browser to the wrong place. The final external redirect (to the
  // location's google_review_url) is already an absolute URL and doesn't use this at all.
  const appUrl = new URL(request.url).origin;

  const device = await db.query.devices.findFirst({ where: eq(devices.code, code) });

  if (!device) {
    return NextResponse.redirect(new URL(`/r/not-found?code=${encodeURIComponent(code)}`, appUrl));
  }

  if (device.status === "unassigned") {
    return NextResponse.redirect(new URL(`/claim/${encodeURIComponent(code)}`, appUrl));
  }

  if (device.status === "deactivated") {
    return NextResponse.redirect(new URL(`/r/deactivated`, appUrl));
  }

  // device.status === "active"
  if (!device.locationId) {
    // Data-integrity guard: an active device should always have a locationId (set atomically
    // at activation time). If this ever isn't true, fail to the branded "not active" page
    // rather than 500ing or redirecting nowhere.
    return NextResponse.redirect(new URL(`/r/deactivated`, appUrl));
  }

  const location = await db.query.locations.findFirst({
    where: eq(locations.id, device.locationId),
  });
  if (!location) {
    return NextResponse.redirect(new URL(`/r/deactivated`, appUrl));
  }

  // --- Fraud-throttle (architecture doc section 7) ---
  // Hash the IP (never store/key on the raw IP), atomic SET NX EX 5 via Upstash. Fail-open on
  // any Upstash error/timeout ("not throttled") — a throttle-store outage must never gate the
  // redirect itself.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const ipHash = await sha256Hex(ip);

  let shouldLogScan = true;
  try {
    const throttleKey = `throttle:${device.code}:${ipHash}`;
    const setResult = await redis.set(throttleKey, "1", { nx: true, ex: 5 });
    // setResult is "OK" if the key was newly set, null if a duplicate hit it within the window.
    shouldLogScan = setResult !== null;
  } catch {
    // Fail open: Upstash errored/timed out — treat as "not throttled" so analytics still count
    // this scan; never let a throttle-store outage delay or block the redirect.
    shouldLogScan = true;
  }

  if (shouldLogScan) {
    try {
      await db.insert(scans).values({
        deviceId: device.id,
        locationId: device.locationId,
        employeeId: device.employeeId ?? null,
        ipHash,
      });
    } catch {
      // Scan-logging must never block/break the redirect itself.
    }
  }

  return NextResponse.redirect(location.googleReviewUrl, { status: 302 });
}

// Edge runtime has Web Crypto (crypto.subtle) but not Node's `crypto` module — use SubtleCrypto
// so this route stays edge-compatible per lib/db/client.ts's edge requirement.
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
