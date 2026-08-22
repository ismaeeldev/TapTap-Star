"use client";

import { useEffect, useState } from "react";
import { Copy, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import type { LeaderboardLocationGroup } from "@/lib/queries/leaderboard";

type TargetRow = {
  id: string;
  locationId: string;
  periodType: "weekly" | "monthly";
  targetScans: number;
};

function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

function CopyLinkButton({ accessToken }: { accessToken: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        const url = `${window.location.origin}/e/${accessToken}`;
        try {
          await navigator.clipboard.writeText(url);
          toast.success("Personal link copied");
        } catch {
          toast.error("Couldn't copy the link — copy it manually: " + url);
        }
      }}
    >
      <Copy className="size-3.5" /> Copy link
    </Button>
  );
}

function TeamTargetPanel({
  locationId,
  locationName,
  targets,
  onSaved,
}: {
  locationId: string;
  locationName: string;
  targets: TargetRow[];
  onSaved: () => void;
}) {
  const existing = targets.find((t) => t.locationId === locationId);
  const [periodType, setPeriodType] = useState<"weekly" | "monthly">(
    existing?.periodType ?? "monthly"
  );
  const [value, setValue] = useState(existing ? String(existing.targetScans) : "");
  const [submitting, setSubmitting] = useState(false);

  const currentForPeriod = targets.find(
    (t) => t.locationId === locationId && t.periodType === periodType
  );

  async function handleSave() {
    const targetScans = Number(value);
    if (!Number.isFinite(targetScans) || targetScans < 1) {
      toast.error("Enter a valid target (1 or more scans)");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId, periodType, targetScans }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Failed to save target");
        return;
      }
      toast.success(`Target saved for ${locationName}`);
      onSaved();
    } catch {
      toast.error("Failed to save target — check your connection and try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-md border border-border-default bg-bg-muted/40 p-3">
      <Target className="mt-2 size-4 shrink-0 text-brand" />
      <div className="space-y-1">
        <label className="text-caption text-text-muted">Period</label>
        <Select value={periodType} onValueChange={(v) => setPeriodType(v as "weekly" | "monthly")}>
          <SelectTrigger className="w-32" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <label className="text-caption text-text-muted">Target scans</label>
        <Input
          type="number"
          min={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-28"
        />
      </div>
      <Button size="sm" onClick={handleSave} disabled={submitting}>
        {submitting ? "Saving…" : currentForPeriod ? "Update target" : "Set target"}
      </Button>
      {currentForPeriod && (
        <p className="basis-full text-caption text-text-muted">
          Replaces the current {periodType} target ({currentForPeriod.targetScans} scans) — no
          history is kept.
        </p>
      )}
    </div>
  );
}

export function EmployeeLeaderboard({
  initialGroups,
  initialRange,
}: {
  initialGroups: LeaderboardLocationGroup[];
  initialRange: { start: string; end: string };
}) {
  const [groups, setGroups] = useState(initialGroups);
  const [from, setFrom] = useState(toDateInputValue(initialRange.start));
  const [to, setTo] = useState(toDateInputValue(initialRange.end));
  const [byLocation, setByLocation] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [targets, setTargets] = useState<TargetRow[]>([]);

  async function loadTargets() {
    try {
      const res = await fetch("/api/targets");
      const data = await res.json();
      setTargets(data.targets ?? []);
    } catch {
      // Non-fatal — the target panel just starts empty.
    }
  }

  async function loadLeaderboard() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/employees/leaderboard?from=${from}&to=${to}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setGroups(data.groups ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void loadTargets();
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const flatEmployees = groups
    .flatMap((g) => g.employees.map((e) => ({ ...e, locationName: g.location.name })))
    .sort((a, b) => b.scanCount - a.scanCount);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border-default bg-bg-card p-4">
        <div className="space-y-1">
          <label className="text-caption text-text-muted">From</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-caption text-text-muted">To</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button variant="secondary" onClick={loadLeaderboard} disabled={loading}>
          {loading ? "Loading…" : "Apply"}
        </Button>
        <Button variant="ghost" onClick={() => setByLocation((v) => !v)}>
          {byLocation ? "Show combined ranking" : "Show per-location breakdown"}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-4">
          <p className="text-body-sm text-danger">
            Couldn&apos;t load the leaderboard for that range.
          </p>
          <Button variant="secondary" size="sm" className="mt-2" onClick={loadLeaderboard}>
            Retry
          </Button>
        </div>
      )}

      {byLocation ? (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.location.id} className="space-y-3">
              <h3 className="text-h4 font-semibold text-text-primary">{group.location.name}</h3>

              <TeamTargetPanel
                locationId={group.location.id}
                locationName={group.location.name}
                targets={targets}
                onSaved={loadTargets}
              />

              {group.employees.length === 0 ? (
                <p className="text-body-sm text-text-muted">No employees at this location.</p>
              ) : (
                <div className="space-y-2">
                  {group.employees.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border-default bg-bg-card p-3 transition-colors hover:bg-bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-7 items-center justify-center rounded-full bg-brand-subtle text-caption font-semibold text-brand">
                          #{e.rank}
                        </span>
                        <span className="text-body-sm font-medium text-text-primary">
                          {e.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-body-sm tabular-nums text-text-muted">
                          {e.scanCount.toLocaleString()} scans
                        </span>
                        <CopyLinkButton accessToken={e.accessToken} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {flatEmployees.map((e, i) => (
            <div
              key={e.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border-default bg-bg-card p-3 transition-colors hover:bg-bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-brand-subtle text-caption font-semibold text-brand">
                  #{i + 1}
                </span>
                <div>
                  <p className="text-body-sm font-medium text-text-primary">{e.name}</p>
                  <p className="text-caption text-text-muted">{e.locationName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-body-sm tabular-nums text-text-muted">
                  {e.scanCount.toLocaleString()} scans
                </span>
                <CopyLinkButton accessToken={e.accessToken} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
