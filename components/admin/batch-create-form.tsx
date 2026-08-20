"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type GeneratedRow = { code: string; claimUrl: string; qrImageUrl: string };

type GenerateResult = {
  requested: number;
  createdCount: number;
  failedCount: number;
  devices: GeneratedRow[];
  failed: { attemptedCode: string; reason: string }[];
};

type ImportResult = {
  totalRows: number;
  importedCount: number;
  skippedDuplicateCount: number;
  rejectedCount: number;
  malformedRows: string[];
  rejectedInsertErrors: { code: string; reason: string }[];
};

function toCsv(rows: GeneratedRow[]): string {
  const header = "code,claim_url,qr_image_url";
  const body = rows
    .map((r) => `${r.code},${r.claimUrl},${r.qrImageUrl}`)
    .join("\n");
  return `${header}\n${body}`;
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function BatchCreateForm() {
  const [mode, setMode] = useState<"generate" | "import">("generate");

  // Generate mode state
  const [quantity, setQuantity] = useState("10");
  const [deviceType, setDeviceType] = useState<"card" | "plaque" | "stand">("card");
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null);

  // Import mode state
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setGenerateResult(null);
    try {
      const res = await fetch("/api/admin/devices/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: Number(quantity), deviceType }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Failed to generate codes");
        return;
      }
      setGenerateResult(data);
      toast.success(`Generated ${data.createdCount} of ${data.requested} codes`);
    } catch {
      toast.error("Failed to generate codes — check your connection and try again");
    } finally {
      setGenerating(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!csvText.trim()) {
      toast.error("Paste or upload a CSV first");
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/admin/devices/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Failed to import CSV");
        return;
      }
      setImportResult(data);
      toast.success(
        `Import complete: ${data.importedCount} imported, ${data.skippedDuplicateCount} skipped, ${data.rejectedCount} rejected`
      );
    } catch {
      toast.error("Failed to import CSV — check your connection and try again");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-1 rounded-lg border border-border-default bg-bg-surface p-1">
        {(["generate", "import"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 rounded-md px-4 py-2 text-body-sm font-medium transition-colors",
              mode === m
                ? "bg-brand-subtle text-brand"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            {m === "generate" ? "Generate N codes" : "Import from CSV"}
          </button>
        ))}
      </div>

      {mode === "generate" ? (
        <div className="space-y-4 rounded-lg border border-border-default bg-bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={1000}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deviceType">Device type</Label>
              <Select value={deviceType} onValueChange={(v) => setDeviceType(v as typeof deviceType)}>
                <SelectTrigger id="deviceType" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="plaque">Plaque</SelectItem>
                  <SelectItem value="stand">Stand</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? "Generating…" : "Generate codes"}
          </Button>

          {generateResult && (
            <div className="space-y-3 border-t border-border-default pt-4">
              <p className="text-body-sm text-text-secondary">
                Created <strong className="text-text-primary">{generateResult.createdCount}</strong>{" "}
                of {generateResult.requested} requested
                {generateResult.failedCount > 0 && (
                  <span className="text-danger"> — {generateResult.failedCount} failed</span>
                )}
                .
              </p>
              <Button
                variant="secondary"
                onClick={() =>
                  downloadCsv(
                    toCsv(generateResult.devices),
                    `taptapstar-devices-${new Date().toISOString().slice(0, 10)}.csv`
                  )
                }
              >
                Download CSV ({generateResult.createdCount} rows)
              </Button>
              {generateResult.failed.length > 0 && (
                <ul className="list-inside list-disc text-caption text-danger">
                  {generateResult.failed.map((f, i) => (
                    <li key={i}>
                      {f.attemptedCode || "(no code)"}: {f.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 rounded-lg border border-border-default bg-bg-card p-6">
          <div className="space-y-1.5">
            <Label htmlFor="csvFile">Upload CSV file</Label>
            <Input id="csvFile" type="file" accept=".csv,text/csv,text/plain" onChange={handleFileChange} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="csvText">…or paste CSV contents</Label>
            <Textarea
              id="csvText"
              rows={8}
              placeholder="https://taptapstar.com/r/AbCdEf1234&#10;https://taptapstar.com/r/GhIjKl5678"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
            />
          </div>
          <Button onClick={handleImport} disabled={importing}>
            {importing ? "Importing…" : "Import codes"}
          </Button>

          {importResult && (
            <div className="space-y-2 border-t border-border-default pt-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-md bg-success/10 p-3">
                  <p className="text-h3 font-semibold text-success">{importResult.importedCount}</p>
                  <p className="text-caption text-text-muted">Imported</p>
                </div>
                <div className="rounded-md bg-warning/10 p-3">
                  <p className="text-h3 font-semibold text-warning">
                    {importResult.skippedDuplicateCount}
                  </p>
                  <p className="text-caption text-text-muted">Skipped (duplicate)</p>
                </div>
                <div className="rounded-md bg-danger/10 p-3">
                  <p className="text-h3 font-semibold text-danger">{importResult.rejectedCount}</p>
                  <p className="text-caption text-text-muted">Rejected</p>
                </div>
              </div>
              {importResult.malformedRows.length > 0 && (
                <details className="text-caption text-text-muted">
                  <summary className="cursor-pointer">
                    {importResult.malformedRows.length} malformed row(s)
                  </summary>
                  <ul className="mt-1 list-inside list-disc">
                    {importResult.malformedRows.slice(0, 20).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
