"use client";

import { useEffect } from "react";

// Global error boundary per ../../AgentGuide/01_THEME_GUIDELINE.md section 8.3 — calm
// "Something went wrong" UI, never a raw stack trace, working "Try again" wired to reset().
// Kept dependency-free (no lucide / ui kit) so a broken import chain cannot take down the
// boundary itself — see prior "Lazy element type must resolve" failures when Card/Button failed.
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
      <div className="max-w-sm rounded-lg border border-border-default bg-bg-card p-6 text-center shadow-xs">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-danger/10 text-danger">
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
        <div className="mt-4 space-y-1">
          <p className="text-h3 font-semibold text-text-primary">Something went wrong</p>
          <p className="text-body-sm text-text-muted">
            An unexpected error occurred. You can try again, or come back later.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-text-on-primary shadow-xs transition-all duration-150 hover:bg-brand-hover hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/30"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
