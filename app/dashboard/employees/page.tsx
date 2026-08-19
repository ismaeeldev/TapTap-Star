import { Users } from "lucide-react";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { locations } from "@/lib/db/schema";
import { EmptyState } from "@/components/shared/empty-state";
import { getAccountLeaderboard, getCurrentMonthRange } from "@/lib/queries/leaderboard";
import { EmployeeLeaderboard } from "./employee-leaderboard";

export default async function EmployeesPage() {
  const session = await auth();
  if (!session?.user) return null;

  const accountLocations = await db.query.locations.findMany({
    where: eq(locations.accountId, session.user.accountId),
  });

  if (accountLocations.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No employees yet"
        description="Add a location first, then assign employees to it from the claim wizard or a device's reassign action."
      />
    );
  }

  const range = getCurrentMonthRange();
  const groups = await getAccountLeaderboard(session.user.accountId, range);

  const hasAnyEmployees = groups.some((g) => g.employees.length > 0);
  if (!hasAnyEmployees) {
    return (
      <EmptyState
        icon={Users}
        title="No employees yet"
        description="Assign an employee to a device to start tracking their scan performance."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 font-display font-semibold text-text-primary">Employees</h1>
        <p className="text-body-sm text-text-muted">
          Scan leaderboard by location, with team targets and personal links.
        </p>
      </div>
      <EmployeeLeaderboard
        initialGroups={groups}
        initialRange={{ start: range.start.toISOString(), end: range.end.toISOString() }}
      />
    </div>
  );
}
