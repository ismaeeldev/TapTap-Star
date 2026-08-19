import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

// Dashboard-shell 404 per ../../AgentGuide/01_THEME_GUIDELINE.md section 8.3 — deliberately
// NO gradient-mesh (dense-screen exclusion, theme section 0.3). Nests inside
// app/dashboard/layout.tsx automatically once that shell exists (Step 5), so a logged-in user
// never gets bounced out to the bare marketing shell by a bad link.
export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-bg-muted text-text-muted">
        <FileQuestion className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="text-h3 font-semibold text-text-primary">Page not found</p>
        <p className="max-w-sm text-body-sm text-text-muted">
          That page doesn&apos;t exist in your dashboard.
        </p>
      </div>
      <Button asChild variant="secondary">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
