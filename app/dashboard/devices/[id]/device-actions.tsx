"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QrScanFillButton } from "@/components/dashboard/qr-scan-fill-button";
import { toast } from "@/lib/toast";

type LocationOption = { id: string; name: string };
type EmployeeOption = { id: string; name: string };

export function DeviceActions({
  deviceId,
  deviceCode,
  currentStatus,
  currentLocationId,
  currentEmployeeId,
  locations,
}: {
  deviceId: string;
  deviceCode: string;
  currentStatus: string;
  currentLocationId: string | null;
  currentEmployeeId: string | null;
  locations: LocationOption[];
}) {
  const router = useRouter();

  const [reassignOpen, setReassignOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState(currentLocationId ?? "");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeOption[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const locationChanged = selectedLocationId !== currentLocationId;
  // Case/whitespace-insensitive — see the reset dialog's comment above for why (this confirms
  // intent, it isn't a credential; session auth is the actual access control on this action).
  const isResetConfirmMatch =
    resetConfirmText.trim().toLowerCase() === deviceCode.trim().toLowerCase();

  async function loadEmployees(locationId: string, opts?: { preserveSelection?: boolean }) {
    setLoadingEmployees(true);
    if (!opts?.preserveSelection) setSelectedEmployeeId("");
    try {
      const res = await fetch(`/api/employees?locationId=${locationId}`);
      const data = await res.json();
      setEmployeeOptions(data.employees ?? []);
    } catch {
      setEmployeeOptions([]);
    } finally {
      setLoadingEmployees(false);
    }
  }

  function handleLocationChange(locationId: string) {
    setSelectedLocationId(locationId);
    void loadEmployees(locationId);
  }

  async function handleReassignSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/devices/${deviceId}/reassign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: selectedLocationId,
          employeeId: selectedEmployeeId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Failed to reassign device");
        return;
      }
      toast.success("Device reassigned");
      setReassignOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to reassign device — check your connection and try again");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/devices/${deviceId}/reset`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Failed to reset device");
        return;
      }
      toast.success("Device reset — the code can now be scanned as a brand-new device");
      router.push("/dashboard/devices");
      router.refresh();
    } catch {
      toast.error("Failed to reset device — check your connection and try again");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/devices/${deviceId}/deactivate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Failed to deactivate device");
        return;
      }
      toast.success("Device deactivated");
      setDeactivateOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to deactivate device — check your connection and try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex gap-3">
      <Dialog
        open={reassignOpen}
        onOpenChange={(open) => {
          setReassignOpen(open);
          if (open) {
            setSelectedLocationId(currentLocationId ?? "");
            setSelectedEmployeeId(currentEmployeeId ?? "");
            if (currentLocationId)
              void loadEmployees(currentLocationId, { preserveSelection: true });
          }
        }}
      >
        <DialogTrigger asChild>
          <Button variant="secondary">Reassign</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign device</DialogTitle>
            <DialogDescription>
              {currentStatus === "deactivated"
                ? "Move this device to a location and/or employee — saving reactivates it."
                : "Move this device to a different location and/or employee."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-body-sm font-medium text-text-primary">Location</label>
              <Select value={selectedLocationId} onValueChange={handleLocationChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-body-sm font-medium text-text-primary">Employee</label>
              {locationChanged && (
                <p className="text-caption text-warning">
                  Moving to a new location — pick an employee who works there (or leave
                  unassigned).
                </p>
              )}
              <Select
                value={selectedEmployeeId}
                onValueChange={setSelectedEmployeeId}
                disabled={!selectedLocationId || loadingEmployees}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingEmployees ? "Loading…" : "Unassigned"} />
                </SelectTrigger>
                <SelectContent>
                  {employeeOptions.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="primary"
              onClick={handleReassignSubmit}
              disabled={submitting || !selectedLocationId}
            >
              {submitting ? "Saving…" : "Save reassignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client-requested (Modifications 3 PDF, items 4/6): deactivation was previously
          presented as permanent ("cannot be undone from here"), which is what led the client to
          ask for a reassign-instead-of-deactivate option in the first place. Reassign now
          reactivates a deactivated device (see reassign/route.ts), so the Deactivate button only
          makes sense while the device is currently active — hidden once it's already
          deactivated, since Reassign is now the only (and correct) way back. */}
      {currentStatus !== "deactivated" && (
        <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">Deactivate</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deactivate this device?</DialogTitle>
              <DialogDescription>
                Scans will stop redirecting customers to your destination link until this
                device is reassigned to a location again.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="destructive" onClick={handleDeactivate} disabled={submitting}>
                {submitting ? "Deactivating…" : "Deactivate device"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Client-requested (Modifications 5 PDF): "the option to eliminate device so later people
          could scan again from the beginning and it acts as a new device." Not a real row
          delete — see reset/route.ts's comment for why a hard delete would actually break the
          re-claim flow the client is asking for. Gated behind typing the device code, not just a
          click, since this permanently erases real scan history (unlike Deactivate/Reassign,
          which are both fully reversible).

          Follow-up fix (client): "Plates doesn't have alphanumeric codes. Only QR codes." — the
          physical card/plate device has no printed code to read off of, and the confirm input's
          code was previously shown ONLY as a vanishing placeholder (gone the instant you start
          typing), forcing the person to memorize a random string from a fleeting glance or keep
          scrolling back up to the page's own <h1>. The code is now shown as persistent text next
          to the field (never disappears while typing), and matching is case/whitespace-insensitive
          since this is a "did you mean to click this" safety check, not a security credential —
          the actual account/session auth is what protects this action, not this string match. */}
      <Dialog
        open={resetOpen}
        onOpenChange={(open) => {
          setResetOpen(open);
          if (!open) setResetConfirmText("");
        }}
      >
        <DialogTrigger asChild>
          <Button variant="destructive">Reset device</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset this device?</DialogTitle>
            <DialogDescription>
              This permanently deletes all scan history for this device — including from its
              location&apos;s and employee&apos;s all-time totals — and unassigns it from your
              account. The code becomes claimable again from scratch — anyone who scans it will
              go through the setup wizard as if it were a brand-new device. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <label className="text-body-sm font-medium text-text-primary">
                Type the device code to confirm:{" "}
                <span className="font-mono text-brand">{deviceCode}</span>
              </label>
              <QrScanFillButton onScan={setResetConfirmText} />
            </div>
            <Input
              type="text"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="Type the code above, or scan the device's QR"
              className="font-mono"
            />
            <p className="text-caption text-text-muted">
              No code printed on the device? Use &quot;Scan QR instead&quot; to fill this in
              automatically.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={submitting || !isResetConfirmMatch}
            >
              {submitting ? "Resetting…" : "Reset device"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
