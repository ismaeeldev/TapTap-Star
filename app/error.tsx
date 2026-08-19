"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Global error boundary per ../../AgentGuide/01_THEME_GUIDELINE.md section 8.3 — calm
// "Something went wrong" card, never a raw stack trace, working "Try again" wired to reset().
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO (later step): send to a real error-reporting service.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-page px-6">
      <Card className="max-w-sm text-center">
        <CardContent className="flex flex-col items-center gap-4 pt-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-danger/10 text-danger">
            <AlertTriangle className="size-6" />
          </div>
          <div className="space-y-1">
            <p className="text-h3 font-semibold text-text-primary">Something went wrong</p>
            <p className="text-body-sm text-text-muted">
              An unexpected error occurred. You can try again, or come back later.
            </p>
          </div>
          <Button onClick={reset}>Try again</Button>
        </CardContent>
      </Card>
    </div>
  );
}
