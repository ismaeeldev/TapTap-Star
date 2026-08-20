import Link from "next/link";
import { auth, signOut } from "@/lib/auth/auth";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { DashboardNav } from "./dashboard-nav";

// Minimal dashboard shell (sidebar nav + topbar) — first real shell for the /dashboard route
// group, built as part of Step 5 since Steps 3/4 only needed a single onboarding screen with no
// navigation. Every /dashboard/* screen renders inside this.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-svh flex-col bg-bg-page lg:flex-row">
      <aside className="border-b border-border-default bg-bg-surface px-4 py-3 lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r lg:px-4 lg:py-6">
        <div className="mb-6 hidden lg:block">
          <Link href="/dashboard" className="no-underline">
            <Logo />
          </Link>
        </div>
        <DashboardNav
          showClients={session?.user.accountType === "agency" && session?.user.agencyStatus === "approved"}
        />
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

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
