import { NextResponse } from "next/server";
import { requireSession, authErrorResponse } from "@/lib/auth/rbac";
import { getAccountLeaderboard, getCurrentMonthRange } from "@/lib/queries/leaderboard";

// GET /api/employees/leaderboard?from=&to= — the owner-facing ranking leaderboard, grouped by
// location, defaulting to the current calendar month per 00_SCOPE_DOCUMENT.md section 5.7. Uses
// the SAME shared ranking function as the public /e/[token] view (lib/queries/leaderboard.ts) —
// do not duplicate the ranking logic here.
export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const range =
      fromParam && toParam
        ? { start: new Date(fromParam), end: new Date(toParam) }
        : getCurrentMonthRange();

    if (Number.isNaN(range.start.getTime()) || Number.isNaN(range.end.getTime())) {
      return NextResponse.json({ message: "Invalid date range" }, { status: 400 });
    }

    const groups = await getAccountLeaderboard(session.user.accountId, range);

    return NextResponse.json({
      groups,
      range: { start: range.start.toISOString(), end: range.end.toISOString() },
    });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
