"use client";

import * as React from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { ArrowDown, ArrowUp, BarChart3, Download, Loader2, RotateCcw } from "lucide-react";
import { StatTile } from "@/components/shared/stat-tile";
import { EmptyState } from "@/components/shared/empty-state";
import { SkeletonStatTile } from "@/components/shared/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { Card } from "@/components/ui/card";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type AnalyticsSummary = {
  totalScans: number;
  totalScansTrendPercent: number | null;
  activeDevices: number;
  mostUsedLocation: { name: string; googleReviewUrl: string; scanCount: number } | null;
  conversionTrendPercent: number | null;
  timeSeries: { date: string; scans: number }[];
  byLocation: { locationId: string; name: string; scans: number }[];
};

// Client-requested (Modifications 3 PDF, item 2): "like a graphic for seeing usage, maybe an
// option like the second image too" — a pie/percentage-slice breakdown. Reuses the app's own
// brand/gradient palette (theme tokens) rather than inventing new colors, cycling if there are
// more locations than swatches.
const PIE_COLORS = [
  "var(--brand)",
  "var(--gradient-2)",
  "var(--success)",
  "var(--warning)",
  "var(--danger)",
  "var(--text-muted)",
];

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

function defaultRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return { from: toDateInputValue(start), to: toDateInputValue(now) };
}

export default function AnalyticsPage() {
  const [{ from, to }, setRange] = React.useState(defaultRange);
  const [locationId, setLocationId] = React.useState<string>("all");
  const [deviceId, setDeviceId] = React.useState<string>("all");
  const [exporting, setExporting] = React.useState<"csv" | "pdf" | null>(null);

  const { data: locationsData } = useSWR<{ locations: { id: string; name: string }[] }>(
    "/api/locations",
    fetcher
  );
  const { data: devicesData } = useSWR<{ devices: { id: string; code: string }[] }>(
    "/api/devices",
    fetcher
  );

  const query = new URLSearchParams({ from, to });
  if (locationId !== "all") query.set("locationId", locationId);
  if (deviceId !== "all") query.set("deviceId", deviceId);

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<{ summary: AnalyticsSummary } | { message: string }>(
    `/api/analytics?${query.toString()}`,
    fetcher
  );

  const summary = data && "summary" in data ? data.summary : null;
  const hasActivity = (summary?.totalScans ?? 0) > 0;

  const handleExport = async (format: "csv" | "pdf") => {
    setExporting(format);
    try {
      const exportQuery = new URLSearchParams(query);
      exportQuery.set("format", format);
      const res = await fetch(`/api/scans/export?${exportQuery.toString()}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (format === "csv") {
        const a = document.createElement("a");
        a.href = url;
        a.download = "taptapstar-scans.csv";
        a.click();
      } else {
        window.open(url, "_blank");
      }
      URL.revokeObjectURL(url);
      toast.success(format === "csv" ? "CSV downloaded." : "Report opened — use your browser's print dialog to save as PDF.");
    } catch {
      toast.error(`Couldn't generate the ${format.toUpperCase()} export. Please try again.`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 font-display font-semibold text-text-primary">Analytics</h1>
        <p className="text-body-sm text-text-muted">Scan activity across your locations and devices.</p>
      </div>

      <Card className="px-5">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          <div className="space-y-1">
            <Label htmlFor="from" className="text-caption">
              From
            </Label>
            <Input
              id="from"
              type="date"
              value={from}
              max={to}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
              className="w-auto"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to" className="text-caption">
              To
            </Label>
            <Input
              id="to"
              type="date"
              value={to}
              min={from}
              max={toDateInputValue(new Date())}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
              className="w-auto"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-caption">Location</Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {locationsData?.locations.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-caption">Device</Label>
            <Select value={deviceId} onValueChange={setDeviceId}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All devices</SelectItem>
                {devicesData?.devices.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto flex items-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={exporting !== null}
              onClick={() => handleExport("csv")}
            >
              {exporting === "csv" ? <Loader2 className="animate-spin" /> : <Download className="size-3.5" />}
              CSV
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={exporting !== null}
              onClick={() => handleExport("pdf")}
            >
              {exporting === "pdf" ? <Loader2 className="animate-spin" /> : <Download className="size-3.5" />}
              PDF
            </Button>
          </div>
        </div>
      </Card>

      {error || (data && "message" in data) ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3">
          <p className="text-body-sm text-danger">
            {data && "message" in data ? data.message : "Couldn't load analytics."}
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={() => mutate()}>
            <RotateCcw className="size-3.5" />
            Retry
          </Button>
        </div>
      ) : isLoading || !summary ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SkeletonStatTile />
            <SkeletonStatTile />
            <SkeletonStatTile />
            <SkeletonStatTile />
          </div>
          <div className="space-y-4 rounded-lg border border-border-default bg-bg-card p-6">
            <Skeleton className="h-5 w-40" />
            <div className="flex h-64 items-end gap-2">
              {[40, 65, 50, 80, 60, 90, 55, 70, 45, 85, 60, 75].map((h, i) => (
                <Skeleton key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      ) : !hasActivity ? (
        <EmptyState
          icon={BarChart3}
          title="No activity in this period"
          description="No scans were recorded for the selected date range and filters. Try widening the date range or clearing a filter."
        />
      ) : (
        <>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <motion.div variants={fadeUp}>
              <Card className="px-6 transition-shadow duration-150 hover:shadow-md">
                <StatTile
                  label="Total scans"
                  value={summary.totalScans}
                  trend={
                    summary.totalScansTrendPercent === null
                      ? undefined
                      : {
                          direction: summary.totalScansTrendPercent >= 0 ? "up" : "down",
                          percent: Math.abs(summary.totalScansTrendPercent),
                        }
                  }
                  glow={summary.totalScansTrendPercent !== null && summary.totalScansTrendPercent > 0}
                />
              </Card>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Card className="px-6 transition-shadow duration-150 hover:shadow-md">
                <StatTile label="Active devices" value={summary.activeDevices} />
              </Card>
            </motion.div>
            {/* Custom tile (not StatTile) — this KPI's headline IS the % change itself, not a
                count with a trend badge bolted on, so re-using StatTile here would either
                duplicate the "Total scans" number (the original bug) or need a fake integer
                animation on a percentage. See 04_PROJECT_STATE.md's Step 6 UI-polish entry. */}
            <motion.div variants={fadeUp}>
              <Card className="space-y-2 px-6 transition-shadow duration-150 hover:shadow-md">
                <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">
                  Scan trend
                </p>
                {summary.conversionTrendPercent === null ? (
                  <p className="text-h4 font-semibold text-text-muted">—</p>
                ) : (
                  <p
                    className={`flex items-baseline gap-1 text-display-md font-display font-bold tabular-nums ${
                      summary.conversionTrendPercent >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {summary.conversionTrendPercent >= 0 ? (
                      <ArrowUp className="size-5" />
                    ) : (
                      <ArrowDown className="size-5" />
                    )}
                    {Math.abs(summary.conversionTrendPercent)}%
                  </p>
                )}
                <p className="text-body-sm text-text-muted">vs. previous period</p>
              </Card>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Card className="space-y-2 px-6 transition-shadow duration-150 hover:shadow-md">
                <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">
                  Most-used review link
                </p>
                {summary.mostUsedLocation ? (
                  <>
                    <p className="text-h4 font-semibold text-text-primary">
                      {summary.mostUsedLocation.name}
                    </p>
                    <p className="text-body-sm text-text-muted">
                      {summary.mostUsedLocation.scanCount.toLocaleString()} scans
                    </p>
                  </>
                ) : (
                  <p className="text-body-sm text-text-muted">No scans yet</p>
                )}
              </Card>
            </motion.div>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <Card className="px-6">
            <p className="mb-4 text-body-sm font-medium text-text-primary">Scans over time</p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={summary.timeSeries} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                  axisLine={{ stroke: "var(--border-default)" }}
                  tickLine={false}
                  // Avoid a wall of overlapping date labels on longer ranges / narrow viewports
                  // (theme guideline section 6 responsiveness requirement) — recharts skips ticks
                  // to fit the available width and always keeps the first/last labeled.
                  interval="preserveStartEnd"
                  minTickGap={24}
                  tickFormatter={(value: string) => {
                    const d = new Date(`${value}T00:00:00Z`);
                    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
                  }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "var(--text-primary)",
                  }}
                  labelStyle={{ color: "var(--text-muted)" }}
                  labelFormatter={(value) => {
                    if (typeof value !== "string") return value;
                    return new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "UTC",
                    });
                  }}
                  formatter={(value) => [`${Number(value).toLocaleString()} scans`, ""]}
                />
                <Line
                  type="monotone"
                  dataKey="scans"
                  stroke="var(--brand)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          </motion.div>

          {/* Client-requested (Modifications 3 PDF, item 2): a pie/percentage breakdown view,
              alongside the existing line chart rather than replacing it — the line chart answers
              "when," this answers "where." Hidden when there's only one (or zero) location slice
              to show, since a pie chart with a single 100% slice conveys nothing a stat tile
              doesn't already say. */}
          {summary.byLocation.length > 1 && (
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <Card className="px-6">
                <p className="mb-4 text-body-sm font-medium text-text-primary">Scans by location</p>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={summary.byLocation}
                      dataKey="scans"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ percent }) => `${Math.round((percent ?? 0) * 100)}%`}
                    >
                      {summary.byLocation.map((entry, i) => (
                        <Cell key={entry.locationId} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-default)",
                        borderRadius: 8,
                        fontSize: 13,
                        color: "var(--text-primary)",
                      }}
                      formatter={(value, name) => [`${Number(value).toLocaleString()} scans`, name]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 13, color: "var(--text-secondary)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
