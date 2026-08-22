import { LinkIcon, Trophy } from "lucide-react";
import { GradientMesh } from "@/components/shared/gradient-mesh";
import { Logo } from "@/components/shared/logo";
import {
  getActiveTargetsWithProgress,
  getCurrentMonthRange,
  getEmployeeAllTimeCount,
  getEmployeeByAccessToken,
  getEmployeeRankingsForLocation,
} from "@/lib/queries/leaderboard";

// /e/[token] — the employee private view. PUBLIC, NO auth, NO middleware gate, NO RBAC helper
// at all, per 03_DATA_MODEL_AND_ARCHITECTURE.md section 9 (the same "public by design" pattern
// as /r/[code]). Zero write actions, zero navigation elsewhere in the app.
export default async function EmployeePrivateViewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const employee = await getEmployeeByAccessToken(token);

  if (!employee) {
    return (
      <GradientMesh className="flex min-h-svh flex-col items-center justify-center px-4 py-12 text-center">
        <div className="mb-8">
          <Logo className="scale-110" />
        </div>
        <div className="flex size-16 items-center justify-center rounded-full bg-brand-subtle text-brand">
          <LinkIcon className="size-8" />
        </div>
        <h1 className="mt-6 text-h3 font-semibold text-text-primary">This link isn&apos;t valid</h1>
        <p className="mt-2 max-w-sm text-body-sm text-text-muted">
          We couldn&apos;t find a Taptapstar employee page for this link. Double-check the URL you
          were given.
        </p>
      </GradientMesh>
    );
  }

  const range = getCurrentMonthRange();
  const [rankings, allTimeCount, activeTargets] = await Promise.all([
    getEmployeeRankingsForLocation(employee.locationId, range),
    getEmployeeAllTimeCount(employee.id),
    getActiveTargetsWithProgress(employee.locationId),
  ]);

  const mine = rankings.find((r) => r.id === employee.id);

  return (
    <GradientMesh className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo className="scale-110" />
        </div>

        <div className="rounded-lg border border-border-default bg-bg-card p-6 text-center shadow-lg">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-subtle text-brand">
            <Trophy className="size-7" />
          </div>
          <h1 className="mt-4 text-h3 font-semibold text-text-primary">{employee.name}</h1>
          <p className="text-body-sm text-text-muted">{employee.location.name}</p>

          {mine && (
            <p className="mt-2 text-body-sm font-medium text-brand">
              #{mine.rank} of {mine.totalEmployees} this month
            </p>
          )}

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-md bg-bg-muted p-4">
              <p className="text-caption uppercase text-text-muted">This month</p>
              <p className="text-display-md font-display font-bold text-text-primary">
                {(mine?.scanCount ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-md bg-bg-muted p-4">
              <p className="text-caption uppercase text-text-muted">All-time</p>
              <p className="text-display-md font-display font-bold text-text-primary">
                {allTimeCount.toLocaleString()}
              </p>
            </div>
          </div>

          {activeTargets.length > 0 && (
            <div className="mt-6 space-y-3 text-left">
              <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">
                Team target
              </p>
              {activeTargets.map((t) => (
                <div key={t.id}>
                  <div className="mb-1 flex items-center justify-between text-caption text-text-muted">
                    <span className="capitalize">{t.periodType}</span>
                    <span>
                      {t.currentScans.toLocaleString()} / {t.targetScans.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-bg-muted">
                    <div
                      className="h-full rounded-full bg-brand transition-all"
                      style={{ width: `${Math.min(100, Math.round(t.progress * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </GradientMesh>
  );
}
