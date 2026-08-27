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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";

type LocationOption = { id: string; name: string };
type EmployeeOption = { id: string; name: string };

export function DeviceActions({
  deviceId,
  currentStatus,
  currentLocationId,
  currentEmployeeId,
  locations,
}: {
  deviceId: string;
  currentStatus: string;
  currentLocationId: string | null;
  currentEmployeeId: string | null;
  locations: LocationOption[];
}) {
  const router = useRouter();

  const [reassignOpen, setReassignOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState(currentLocationId ?? "");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeOption[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const locationChanged = selectedLocationId !== currentLocationId;

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
                Scans will stop redirecting customers to your Google review link until this
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
    </div>
  );
}
