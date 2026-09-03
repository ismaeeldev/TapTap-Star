"use client";

import { Button } from "@/components/ui/button";

// Client component just for the reload action (standard §9: "MUST provide a clear retry action
// when retrying is safe" and "MUST avoid blank screens/endless loading" — this is the one
// interactive element on the static offline page). window.location.reload() re-issues the exact
// same navigation request; if the network is back, the real page loads, and if not, the service
// worker's fetch handler serves this same offline page again — never a dead end either way.
export function OfflineRetryButton() {
  return (
    <Button onClick={() => window.location.reload()}>Try again</Button>
  );
}
