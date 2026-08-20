import { NextResponse } from "next/server";
import { requireSession, authErrorResponse } from "@/lib/auth/rbac";
import { getAnalyticsSummary } from "@/lib/queries/analytics";
import { parseAnalyticsFilters } from "@/lib/validation";

// GET /api/analytics?from=&to=&locationId=&deviceId= — the /dashboard/analytics data source.
export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const parsed = parseAnalyticsFilters(searchParams);
    if (!parsed.ok) {
      return NextResponse.json({ message: parsed.message }, { status: 400 });
    }

    const summary = await getAnalyticsSummary({
      accountId: session.user.accountId,
      range: parsed.range,
      locationId: parsed.locationId,
      deviceId: parsed.deviceId,
    });

    return NextResponse.json({ summary });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
