// Vercel Cron target for trigger #4 (02_APPLICATION_FLOW.md §8) — weekly performance summary.
// Registered in vercel.json's `crons` array (Vercel itself sends a GET with an
// `Authorization: Bearer ${CRON_SECRET}` header per Vercel's documented convention — this route
// rejects any request that doesn't present that exact header, so it can't be triggered publicly).
// Reuses lib/queries/analytics.ts's getAnalyticsSummary — no duplicated query logic.
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts } from "@/lib/db/schema";
import { getAnalyticsSummary } from "@/lib/queries/analytics";
import { notify } from "@/lib/email/notify";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function lastWeekRange(now: Date = new Date()) {
  const day = now.getUTCDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  const thisWeekStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday)
  );
  const start = new Date(thisWeekStart);
  start.setUTCDate(start.getUTCDate() - 7);
  const end = thisWeekStart;
  return { start, end };
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ message: "CRON_SECRET not configured" }, { status: 500 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const range = lastWeekRange();
  const activeAccounts = await db.query.accounts.findMany({
    where: eq(accounts.status, "active"),
  });

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const account of activeAccounts) {
    try {
      const summary = await getAnalyticsSummary({ accountId: account.id, range });
      if (summary.totalScans === 0 && !summary.mostUsedLocation) {
        // No activity at all this week — skip sending a near-empty summary rather than
        // notifying every dormant account weekly.
        skipped++;
        continue;
      }
      await notify(account.id, "performance_summary", {
        accountName: account.name,
        periodLabel: "this week",
        totalScans: summary.totalScans,
        trendPercent: summary.totalScansTrendPercent,
        topLocationName: summary.mostUsedLocation?.name ?? null,
        dashboardUrl: `${APP_URL}/dashboard/analytics`,
      });
      sent++;
    } catch (err) {
      console.error(`[cron/weekly-summary] failed for account ${account.id}`, err);
      errors.push(account.id);
    }
  }

  return NextResponse.json({ ok: true, accountsProcessed: activeAccounts.length, sent, skipped, errors });
}
