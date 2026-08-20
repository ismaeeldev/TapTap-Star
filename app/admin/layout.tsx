import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth/auth";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { AdminNav } from "./admin-nav";

// Real admin shell for every /admin/* screen — Step 10. Dense/standard bg-surface tooling per
// 01_THEME_GUIDELINE.md §8 and its explicit §0.3 exclusion of gradient-mesh/glass from the admin
// panel (that visual treatment is reserved for marketing/auth surfaces only).
//
// Defense-in-depth: middleware.ts already gates /admin/:path* to taptapstar_admin only (a wrong-
// role session gets bounced to /dashboard, not /login), but per this project's established
// principle (every step since Step 3 has re-verified this), middleware is never sufficient on its
// own — re-check server-side here too, and every admin API route separately calls
// requireRole("taptapstar_admin") itself.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }
  if (session.user.role !== "taptapstar_admin") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-svh flex-col bg-bg-page lg:flex-row">
      <aside className="border-b border-border-default bg-bg-surface px-4 py-3 lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r lg:px-4 lg:py-6">
        <div className="mb-6 hidden lg:block">
          <Logo />
          <p className="mt-1 text-caption font-medium tracking-wide text-text-muted uppercase">
            Admin
          </p>
        </div>
        <AdminNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border-default bg-bg-surface px-4 py-3 lg:px-8">
          <div className="lg:hidden">
            <Logo iconOnly />
          </div>
          <div className="hidden text-body-sm text-text-muted lg:block">{session.user.name}</div>
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
