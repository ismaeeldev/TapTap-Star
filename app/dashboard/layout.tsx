import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth, signOut } from "@/lib/auth/auth";
import { isApprovedAgencySession } from "@/lib/auth/rbac";
import { db } from "@/lib/db/client";
import { accounts } from "@/lib/db/schema";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { DashboardNav } from "./dashboard-nav";

// Minimal dashboard shell (sidebar nav + topbar) — first real shell for the /dashboard route
// group, built as part of Step 5 since Steps 3/4 only needed a single onboarding screen with no
// navigation. Every /dashboard/* screen renders inside this.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Suspended/grace-period read-only banner (Step 8, 02_APPLICATION_FLOW.md §6) — a live DB
  // read, same reasoning as isApprovedAgencySession: account status can change (a failed
  // payment) while a session stays open. Global here so every /dashboard/* screen shows it, per
  // the master prompt's explicit "shown across the dashboard shell" instruction. This is display
  // only — it does NOT block any device redirect (app/r/[code]/route.ts is untouched and has no
  // billing awareness at all, by design).
  const account = session?.user
    ? await db.query.accounts.findFirst({ where: eq(accounts.id, session.user.accountId) })
    : null;

  // Live DB re-check (isApprovedAgencySession), not session.user.accountType/agencyStatus — same
  // stale-JWT reasoning as the Step 7 final-verification fix (see lib/auth/rbac.ts's doc comment
  // and 04_PROJECT_STATE.md's regression watchlist entry): without this, a just-approved agency's
  // own already-open session could reach /dashboard/clients directly by URL (that page does the
  // live re-check correctly) but never see the "Clients" nav link appear here until a re-login —
  // a real, confusing inconsistency this global shell must not reintroduce.
  const showClients = session ? await isApprovedAgencySession(session) : false;

  return (
    <div className="flex min-h-svh flex-col bg-bg-page lg:flex-row">
      <aside className="border-b border-border-default bg-bg-surface px-4 py-3 lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r lg:px-4 lg:py-6">
        <div className="mb-6 hidden lg:block">
          <Link href="/dashboard" className="no-underline">
            <Logo />
          </Link>
        </div>
        <DashboardNav showClients={showClients} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border-default bg-bg-surface px-4 py-3 lg:px-8">
          <div className="lg:hidden">
            <Logo iconOnly />
          </div>
          <div className="hidden text-body-sm text-text-muted lg:block">
            {session?.user.name}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
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

        {account && account.status !== "active" && (
          <div
            className={
              account.status === "grace_period"
                ? "border-b border-warning/30 bg-warning/10 px-4 py-2 text-center text-body-sm text-warning lg:px-8"
                : "border-b border-danger/30 bg-danger/10 px-4 py-2 text-center text-body-sm text-danger lg:px-8"
            }
          >
            {account.status === "grace_period"
              ? "Your last payment failed — your dashboard will become read-only if this isn't resolved. "
              : "Your account is suspended due to a payment issue — your dashboard is read-only. Devices already in the field keep working for your customers. "}
            <Link href="/dashboard/billing" className="font-medium underline underline-offset-2">
              Update payment method
            </Link>
          </div>
        )}

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
