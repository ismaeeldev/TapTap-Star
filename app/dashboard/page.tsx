import { Radio } from "lucide-react";
import { auth, signOut } from "@/lib/auth/auth";
import { GradientMesh } from "@/components/shared/gradient-mesh";
import { EmptyState } from "@/components/shared/empty-state";
import { AnimatedGradientBorder } from "@/components/shared/animated-gradient-border";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Minimal first-login onboarding empty-state (02_APPLICATION_FLOW.md §2 step 5) proving the
// auth+redirect chain works end to end. The full bento-grid overview (theme §0.4) replaces this
// screen's contents in Step 5 — this is deliberately not that yet.
export default async function DashboardPage() {
  const session = await auth();

  return (
    <GradientMesh className="flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <p className="text-body-sm text-text-muted">
          Welcome, {session?.user.name ?? "there"}
        </p>
        <EmptyState
          icon={Radio}
          title="Activate your first device"
          description="Scan a Taptapstar device or add a location manually to start collecting reviews."
          action={
            <AnimatedGradientBorder>
              <Link href="/dashboard/devices">
                <Button variant="secondary" className="border-0 bg-transparent hover:bg-transparent hover:scale-100">
                  Activate a device
                </Button>
              </Link>
            </AnimatedGradientBorder>
          }
          className="mt-6 border-none bg-transparent"
        />
      </div>

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
    </GradientMesh>
  );
}
