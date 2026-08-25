import { Radio, Building2 } from "lucide-react";
import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { isApprovedAgencySession } from "@/lib/auth/rbac";
import { db } from "@/lib/db/client";
import { devices, locations, employees, scans } from "@/lib/db/schema";
import { getCurrentMonthRange } from "@/lib/queries/leaderboard";
import { GradientMesh } from "@/components/shared/gradient-mesh";
import { EmptyState } from "@/components/shared/empty-state";
import { AnimatedGradientBorder } from "@/components/shared/animated-gradient-border";
import { Button } from "@/components/ui/button";
import { BentoGrid, BentoTile } from "@/components/shared/bento-grid";
import { StatTile } from "@/components/shared/stat-tile";
import { LiveScanFeed } from "@/components/dashboard/live-scan-feed";
import { DashboardReveal } from "@/components/dashboard/dashboard-reveal";
import { RevealItem } from "@/components/dashboard/reveal-item";
import Link from "next/link";

// /dashboard — the bento-grid overview per 01_THEME_GUIDELINE.md section 0.4. Business-owner
// accounts see their single-business summary here; agency accounts get a simple placeholder
// (agency drill-down UI is Step 7, not this step). The genuine first-login empty state (zero
// devices AND zero locations) still shows instead of the bento grid, per
// 02_APPLICATION_FLOW.md section 2.
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  // Live DB re-check (isApprovedAgencySession), not session.user.accountType — see that
  // function's doc comment in lib/auth/rbac.ts for why: a just-approved agency's own already-open
  // session must see the real Clients entry point immediately, not a stale "coming later" message
  // (which was also outdated copy — /dashboard/clients was built in Step 7 and exists now).
  if (await isApprovedAgencySession(session)) {
    return (
      <GradientMesh className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-lg px-4 py-16 text-center">
        <Building2 className="size-10 text-brand" />
        <p className="text-h3 font-semibold text-text-primary">Agency dashboard</p>
        <p className="max-w-sm text-body-sm text-text-muted">
          Manage every business you work with from one place.
        </p>
        <AnimatedGradientBorder>
          <Link href="/dashboard/clients">
            <Button variant="secondary" className="border-0 bg-transparent hover:bg-transparent hover:scale-100">
              Go to Clients
            </Button>
          </Link>
        </AnimatedGradientBorder>
      </GradientMesh>
    );
  }

  const accountId = session.user.accountId;

  const [deviceCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(devices)
    .where(eq(devices.accountId, accountId));
  const [locationCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(locations)
    .where(eq(locations.accountId, accountId));

  if ((deviceCount?.count ?? 0) === 0 && (locationCount?.count ?? 0) === 0) {
    return (
      <GradientMesh className="flex min-h-[60vh] flex-col items-center justify-center gap-8 rounded-lg px-4 py-16">
        <div className="w-full max-w-lg text-center">
          <p className="text-body-sm text-text-muted">Welcome {session.user.name}</p>
          <EmptyState
            icon={Radio}
            title="Activate your first device"
            description="Scan a Taptapstar device or add a location manually to start collecting reviews."
            action={
              <AnimatedGradientBorder>
                <Link href="/dashboard/devices">
                  <Button
                    variant="secondary"
                    className="border-0 bg-transparent hover:scale-100 hover:bg-transparent"
                  >
                    Activate a device
                  </Button>
                </Link>
              </AnimatedGradientBorder>
            }
            className="mt-6 border-none bg-transparent"
          />
        </div>
      </GradientMesh>
    );
  }

  const thisMonth = getCurrentMonthRange();
  const lastMonthEnd = thisMonth.start;
  const lastMonthStart = new Date(
    Date.UTC(thisMonth.start.getUTCFullYear(), thisMonth.start.getUTCMonth() - 1, 1)
  );

  const [locIds, empCount] = await Promise.all([
    db.query.locations.findMany({ where: eq(locations.accountId, accountId) }),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(employees)
      .innerJoin(locations, eq(employees.locationId, locations.id))
      .where(eq(locations.accountId, accountId)),
  ]);
  const locationIdList = locIds.map((l) => l.id);

  async function scanCountInRange(start: Date, end: Date) {
    if (locationIdList.length === 0) return 0;
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(scans)
      .where(
        and(
          inArray(scans.locationId, locationIdList),
          gte(scans.scannedAt, start),
          lt(scans.scannedAt, end)
        )
      );
    return row?.count ?? 0;
  }

  const [scansThisMonth, scansLastMonth, activeDeviceCount] = await Promise.all([
    scanCountInRange(thisMonth.start, thisMonth.end),
    scanCountInRange(lastMonthStart, lastMonthEnd),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(devices)
      .where(and(eq(devices.accountId, accountId), eq(devices.status, "active")))
      .then((r) => r[0]?.count ?? 0),
  ]);

  const trend =
    scansLastMonth > 0
      ? Math.round(((scansThisMonth - scansLastMonth) / scansLastMonth) * 100)
      : scansThisMonth > 0
        ? 100
        : 0;

  return (
    <DashboardReveal>
      <BentoGrid>
        <RevealItem>
          <BentoTile span="hero" glow={trend > 0}>
            <StatTile
              label="Scans this month"
              value={scansThisMonth}
              trend={{ direction: trend >= 0 ? "up" : "down", percent: Math.abs(trend) }}
            />
          </BentoTile>
        </RevealItem>
        <RevealItem>
          <BentoTile>
            <StatTile label="Active devices" value={activeDeviceCount} />
          </BentoTile>
        </RevealItem>
        <RevealItem>
          <BentoTile>
            <StatTile label="Locations" value={locationCount?.count ?? 0} />
          </BentoTile>
        </RevealItem>
        <RevealItem>
          <BentoTile>
            <StatTile label="Employees" value={empCount[0]?.count ?? 0} />
          </BentoTile>
        </RevealItem>
        <RevealItem>
          <BentoTile>
            <StatTile label="Total devices" value={deviceCount?.count ?? 0} />
          </BentoTile>
        </RevealItem>
        <RevealItem>
          <BentoTile span="wide">
            <p className="mb-3 text-body-sm font-semibold text-text-primary">Live scan feed</p>
            <LiveScanFeed className="space-y-2" />
          </BentoTile>
        </RevealItem>
      </BentoGrid>
    </DashboardReveal>
  );
}
