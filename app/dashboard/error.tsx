"use client";

import { useEffect } from "react";

// Dashboard-scoped error boundary — same calm pattern as the root one, but keeps the
// dashboard shell instead of falling back to a bare page (per theme guideline section 8.3).
// Dependency-free so a broken ui/lucide import cannot crash the boundary itself.
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
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="size-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      </div>
      <div className="space-y-1">
        <p className="text-h3 font-semibold text-text-primary">Something went wrong</p>
        <p className="max-w-sm text-body-sm text-text-muted">
          This part of the dashboard hit an error. You can try again.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="inline-flex h-11 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-text-on-primary shadow-xs transition-all duration-150 hover:bg-brand-hover hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/30"
      >
        Try again
      </button>
    </div>
  );
}
