import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

// Admin-shell 404 — same rationale as app/dashboard/not-found.tsx: keeps the dense admin
// tooling shell instead of falling through to the marketing gradient-mesh 404 (theme
// guideline section 0.3 explicitly excludes gradient-mesh from the admin panel).
export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-bg-muted text-text-muted">
        <FileQuestion className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="text-h3 font-semibold text-text-primary">Page not found</p>
        <p className="max-w-sm text-body-sm text-text-muted">
          That page doesn&apos;t exist in the admin panel.
        </p>
      </div>
      <Button asChild variant="secondary">
        <Link href="/admin">Back to admin</Link>
      </Button>
    </div>
  );
}
