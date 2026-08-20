import { Building2, Lock } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { isApprovedAgencySession } from "@/lib/auth/rbac";
import { EmptyState } from "@/components/shared/empty-state";
import { StatTile } from "@/components/shared/stat-tile";
import { ClientsList } from "@/components/dashboard/clients-list";
import { getAgencyClients, rollupClients } from "@/lib/queries/agency";

// Requires type='agency' AND agency_status='approved' — checked BOTH here (server component,
// never trust UI hiding alone) and again in every /api/clients* route via the same
// requireAccountAccess-adjacent check, per 03_DATA_MODEL_AND_ARCHITECTURE.md §4. Uses a live DB
// re-check (isApprovedAgencySession), not the session's cached fields — see that function's doc
// comment in lib/auth/rbac.ts: without this, a just-approved agency's own already-open browser
// session would still be denied here even though /dashboard/settings (which queries the DB
// directly) already told them they're approved.
export default async function ClientsPage() {
  const session = await auth();
  if (!session?.user) return null;

  if (!(await isApprovedAgencySession(session))) {
    return (
      <div className="space-y-6">
        <h1 className="text-h2 font-display font-semibold text-text-primary">Clients</h1>
        <EmptyState
          icon={Lock}
          title="Agency access required"
          description="This account is not an approved agency yet. Request agency access from Settings — once a Taptapstar admin approves it, your client businesses will appear here."
        />
      </div>
    );
  }

  const clients = await getAgencyClients(session.user.accountId);
  const rollup = rollupClients(clients);

  const rows = clients.map((c) => ({
    id: c.id,
    name: c.name,
    billingEmail: c.billingEmail,
    locationCount: c.locationCount,
    deviceCount: c.deviceCount,
    employeeCount: c.employeeCount,
    totalScans: c.analytics.totalScans,
    activeDevices: c.analytics.activeDevices,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 font-display font-semibold text-text-primary">Clients</h1>
        <p className="text-body-sm text-text-muted">
          Every business you manage, consolidated. Click one to see its full dashboard.
        </p>
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Add your first client"
          description="Create a client business to start managing its devices, employees, and scans."
          action={<ClientsList.AddButton />}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-border-default bg-bg-card p-6 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile label="Clients" value={rollup.totalClients} />
            <StatTile label="Scans this month" value={rollup.totalScans} />
            <StatTile label="Active devices" value={rollup.activeDevices} />
            <StatTile label="Locations" value={rollup.totalLocations} />
            <StatTile label="Employees" value={rollup.totalEmployees} />
          </div>
          <ClientsList clients={rows} />
        </>
      )}
    </div>
  );
}
