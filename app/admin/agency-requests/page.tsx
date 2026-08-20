import { eq } from "drizzle-orm";
import { auth, signOut } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { accounts } from "@/lib/db/schema";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { AgencyRequestActions } from "@/components/admin/agency-request-actions";
import { Inbox } from "lucide-react";

// Minimal internal admin page — Step 10 owns the full admin panel's visual polish/shell. This
// route must be functionally real regardless (no other way for any account to become an agency),
// per 05_MASTER_BUILD_GUIDE.md Step 7.2's explicit "don't skip building SOME way to approve
// requests" instruction.
export default async function AgencyRequestsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const pending = await db.query.accounts.findMany({
    where: eq(accounts.agencyStatus, "pending"),
    orderBy: (a, { asc }) => [asc(a.agencyRequestedAt)],
  });

  return (
    <div className="min-h-svh bg-bg-page">
      <header className="flex items-center justify-between border-b border-border-default bg-bg-surface px-4 py-3 lg:px-8">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="text-body-sm text-text-muted">{session.user.name}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button variant="ghost" size="sm" type="submit">
              Log out
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 lg:px-8">
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
      </main>
    </div>
  );
}
