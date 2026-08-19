import { notFound } from "next/navigation";

// Catch-all so any unmatched /dashboard/* URL triggers app/dashboard/not-found.tsx (the
// shell-preserving 404) instead of falling through to the root marketing 404 — Next.js only
// auto-invokes a nested not-found.tsx for URLs that actually match into that segment tree,
// so a genuinely nonexistent path needs this catch-all to match into it first.
export default function DashboardCatchAll(): never {
  notFound();
}
