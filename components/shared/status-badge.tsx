import * as React from "react";
import { Badge } from "@/components/ui/badge";

// Maps domain status strings (devices, accounts, agency requests) to the themed Badge variant
// + label, per ../../AgentGuide/01_THEME_GUIDELINE.md section 4's "Badge / status pill" spec.
// Extend this map, don't invent new inline badge styling per screen.
export type DomainStatus =
  | "active"
  | "unassigned"
  | "deactivated"
  | "pending"
  | "grace_period"
  | "suspended"
  | "approved"
  | "rejected";

const STATUS_MAP: Record<DomainStatus, { variant: React.ComponentProps<typeof Badge>["variant"]; label: string }> = {
  active: { variant: "active", label: "Active" },
  approved: { variant: "active", label: "Approved" },
  unassigned: { variant: "unassigned", label: "Unassigned" },
  deactivated: { variant: "deactivated", label: "Deactivated" },
  rejected: { variant: "deactivated", label: "Rejected" },
  pending: { variant: "pending", label: "Pending" },
  grace_period: { variant: "pending", label: "Grace period" },
  suspended: { variant: "deactivated", label: "Suspended" },
};

export function StatusBadge({ status }: { status: string }) {
  const entry = STATUS_MAP[status as DomainStatus] ?? {
    variant: "unassigned" as const,
    label: status,
  };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}
