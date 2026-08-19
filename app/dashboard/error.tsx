"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Dashboard-scoped error boundary — same calm pattern as the root one, but keeps the
// dashboard shell instead of falling back to a bare page (per theme guideline section 8.3).
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-danger/10 text-danger">
        <AlertTriangle className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="text-h3 font-semibold text-text-primary">Something went wrong</p>
        <p className="max-w-sm text-body-sm text-text-muted">
          This part of the dashboard hit an error. You can try again.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
