import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { accounts } from "@/lib/db/schema";
import { AgencyRequestPanel } from "@/components/dashboard/agency-request-panel";
import { getLatestRejectionReason } from "@/lib/queries/agency";

export default async function SettingsPage() {
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
        <h1 className="text-h2 font-display font-semibold text-text-primary">Settings</h1>
        <p className="text-body-sm text-text-muted">Account preferences and access.</p>
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
