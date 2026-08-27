import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { accounts } from "@/lib/db/schema";
import { AgencyRequestPanel } from "@/components/dashboard/agency-request-panel";
import { getLatestRejectionReason } from "@/lib/queries/agency";

// Client-requested (Modifications 3 PDF, item 1): "Agency access is not a setting, is an option
// for some clients, so I don't think that this should be in Settings." — moved verbatim out of
// app/dashboard/settings/page.tsx into its own dedicated sidebar destination. Content/logic is
// unchanged from the old Settings block, just relocated.
export default async function AgencyPage() {
  const session = await auth();
  if (!session?.user) return null;

  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, session.user.accountId),
  });
  if (!account) return null;

  const rejectionReason =
    account.agencyStatus === "rejected" ? await getLatestRejectionReason(account.id) : null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-h2 font-display font-semibold text-text-primary">Agency</h1>
        <p className="text-body-sm text-text-muted">
          Agency access lets you manage multiple client businesses from one account.
        </p>
      </div>

      {account.type === "business" && (
        <AgencyRequestPanel agencyStatus={account.agencyStatus} rejectionReason={rejectionReason} />
      )}

      {account.type === "agency" && (
        <div className="rounded-lg border border-border-default bg-bg-card p-6">
          <p className="text-body-sm text-text-muted">
            This account is an approved agency. Manage your client businesses from{" "}
            <Link href="/dashboard/clients" className="text-brand underline">
              Clients
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
