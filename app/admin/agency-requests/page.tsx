import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts } from "@/lib/db/schema";
import { EmptyState } from "@/components/shared/empty-state";
import { AgencyRequestActions } from "@/components/admin/agency-request-actions";
import { Inbox } from "lucide-react";

// requireRole("taptapstar_admin") is already enforced in app/admin/layout.tsx (defense-in-depth,
// alongside middleware.ts) and by every mutating route this page calls
// (app/api/admin/agency-requests/[id]/{approve,reject}/route.ts) — no additional gate needed
// here, this page only reads.
export default async function AgencyRequestsPage() {
  const pending = await db.query.accounts.findMany({
    where: eq(accounts.agencyStatus, "pending"),
    orderBy: (a, { asc }) => [asc(a.agencyRequestedAt)],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 font-display font-semibold text-text-primary">
          Agency access requests
        </h1>
        <p className="text-body-sm text-text-muted">
          Businesses that have requested agency status. Approve to unlock their
          /dashboard/clients — reject to leave them as a regular business account.
        </p>
      </div>

      {pending.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No pending requests"
          description="Every agency access request has been reviewed."
        />
      ) : (
        <div className="space-y-3">
          {pending.map((account) => (
            <div
              key={account.id}
              className="flex flex-col gap-3 rounded-lg border border-border-default bg-bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-text-primary">{account.name}</p>
                <p className="text-body-sm text-text-muted">{account.billingEmail}</p>
                <p className="text-caption text-text-muted">
                  Requested{" "}
                  {account.agencyRequestedAt
                    ? new Date(account.agencyRequestedAt).toLocaleString()
                    : "—"}
                </p>
              </div>
              <AgencyRequestActions accountId={account.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
