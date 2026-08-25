"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, MapPin, User, CheckCircle2, RotateCcw, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
import { AnimatedGradientBorder } from "@/components/shared/animated-gradient-border";
import { toast } from "@/lib/toast";
import { fadeUp } from "@/lib/motion";

type Location = {
  id: string;
  name: string;
  address: string;
  googleReviewUrl: string;
  language: string;
};

type Employee = {
  id: string;
  name: string;
  locationId: string;
};

type Step = "location" | "employee" | "confirm" | "success";

export function ClaimWizard({
  code,
  deviceId,
}: {
  code: string;
  deviceId: string;
  accountId: string;
}) {
  const [step, setStep] = React.useState<Step>("location");

  const [locations, setLocations] = React.useState<Location[] | null>(null);
  const [locationsError, setLocationsError] = React.useState(false);
  const [selectedLocationId, setSelectedLocationId] = React.useState<string | null>(null);
  const [showNewLocationForm, setShowNewLocationForm] = React.useState(false);

  const [employees, setEmployees] = React.useState<Employee[] | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string | null>(null);
  const [showNewEmployeeForm, setShowNewEmployeeForm] = React.useState(false);

  const [activating, setActivating] = React.useState(false);
  const [activateError, setActivateError] = React.useState<string | null>(null);
  const [activatedDeviceId, setActivatedDeviceId] = React.useState<string | null>(null);

  const loadLocations = React.useCallback(async () => {
    setLocationsError(false);
    try {
      const res = await fetch("/api/locations");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLocations(data.locations);
    } catch {
      setLocationsError(true);
    }
  }, []);

  React.useEffect(() => {
    // Defer the initial fetch out of the effect body itself — calling an async setState-causing
    // function synchronously inside useEffect trips the react-hooks/set-state-in-effect rule
    // (see 04_PROJECT_STATE.md regression watchlist).
    const id = setTimeout(() => loadLocations(), 0);
    return () => clearTimeout(id);
  }, [loadLocations]);

  const loadEmployees = React.useCallback(async (locationId: string) => {
    try {
      const res = await fetch(`/api/employees?locationId=${encodeURIComponent(locationId)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEmployees(data.employees);
    } catch {
      setEmployees([]);
    }
  }, []);

  const selectedLocation = locations?.find((l) => l.id === selectedLocationId) ?? null;
  const selectedEmployee = employees?.find((e) => e.id === selectedEmployeeId) ?? null;

  const goToEmployeeStep = () => {
    if (!selectedLocationId) return;
    setEmployees(null);
    setSelectedEmployeeId(null);
    loadEmployees(selectedLocationId);
    setStep("employee");
  };

  const handleActivate = async () => {
    if (!selectedLocationId) return;
    setActivating(true);
    setActivateError(null);
    try {
      const res = await fetch(`/api/devices/${deviceId}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: selectedLocationId,
          employeeId: selectedEmployeeId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActivateError(data.message ?? "Something went wrong activating this device.");
        return;
      }
      setActivatedDeviceId(data.device.id);
      setStep("success");
    } catch {
      setActivateError("Network error — please check your connection and try again.");
    } finally {
      setActivating(false);
    }
  };

  if (step === "success") {
    return <SuccessScreen deviceId={activatedDeviceId ?? deviceId} />;
  }

  return (
    <Card variant="glass">
      <CardHeader>
        <div className="mb-1 flex items-center gap-2 text-body-sm text-text-muted">
          <StepDot active={step === "location"} done={step !== "location"} label="1" />
          <span className="h-px w-4 bg-border-default" />
          <StepDot active={step === "employee"} done={step === "confirm"} label="2" />
          <span className="h-px w-4 bg-border-default" />
          <StepDot active={step === "confirm"} done={false} label="3" />
        </div>
        <p className="mb-1 text-caption uppercase tracking-wide text-text-muted">
          Activating device <span className="font-mono text-text-secondary">{code}</span>
        </p>
        <CardTitle className="text-h3">
          {step === "location" && "Where is this device going?"}
          {step === "employee" && "Assign an employee (optional)"}
          {step === "confirm" && "Confirm & activate"}
        </CardTitle>
        <CardDescription>
          {step === "location" && "Pick an existing location, or add a new one."}
          {step === "employee" &&
            "Attribute scans to a team member at this location, or skip for now."}
          {step === "confirm" && "Review the details, then activate this device."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "location" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="space-y-4">
            {locationsError && (
              <ErrorCard message="Couldn't load your locations." onRetry={loadLocations} />
            )}

            {!locationsError && locations === null && (
              <div className="flex items-center justify-center py-8 text-text-muted">
                <Loader2 className="size-5 animate-spin" />
              </div>
            )}

            {!locationsError && locations !== null && locations.length > 0 && !showNewLocationForm && (
              <div className="space-y-2">
                {locations.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setSelectedLocationId(loc.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                      selectedLocationId === loc.id
                        ? "border-brand bg-brand-subtle"
                        : "border-border-default bg-bg-surface hover:border-brand/50"
                    }`}
                  >
                    <MapPin className="size-4 shrink-0 text-brand" />
                    <span>
                      <span className="block text-body-sm font-medium text-text-primary">
                        {loc.name}
                      </span>
                      <span className="block text-body-sm text-text-muted">{loc.address}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {!locationsError && locations !== null && !showNewLocationForm && (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => setShowNewLocationForm(true)}
              >
                <Plus className="size-4" />
                Add new location
              </Button>
            )}

            {showNewLocationForm && (
              <NewLocationForm
                onCancel={() => setShowNewLocationForm(false)}
                onCreated={(loc) => {
                  setLocations((prev) => [loc, ...(prev ?? [])]);
                  setSelectedLocationId(loc.id);
                  setShowNewLocationForm(false);
                  toast.success("Location added.");
                }}
              />
            )}

            <Button
              type="button"
              size="hero"
              className="w-full"
              disabled={!selectedLocationId}
              onClick={goToEmployeeStep}
            >
              Continue
            </Button>
          </motion.div>
        )}

        {step === "employee" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="space-y-4">
            {employees === null && (
              <div className="flex items-center justify-center py-8 text-text-muted">
                <Loader2 className="size-5 animate-spin" />
              </div>
            )}

            {employees !== null && employees.length > 0 && !showNewEmployeeForm && (
              <div className="space-y-2">
                {employees.map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() =>
                      setSelectedEmployeeId((prev) => (prev === emp.id ? null : emp.id))
                    }
                    className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                      selectedEmployeeId === emp.id
                        ? "border-brand bg-brand-subtle"
                        : "border-border-default bg-bg-surface hover:border-brand/50"
                    }`}
                  >
                    <User className="size-4 shrink-0 text-brand" />
                    <span className="text-body-sm font-medium text-text-primary">{emp.name}</span>
                  </button>
                ))}
              </div>
            )}

            {!showNewEmployeeForm && (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => setShowNewEmployeeForm(true)}
              >
                <Plus className="size-4" />
                Add new employee
              </Button>
            )}

            {showNewEmployeeForm && selectedLocationId && (
              <NewEmployeeForm
                locationId={selectedLocationId}
                onCancel={() => setShowNewEmployeeForm(false)}
                onCreated={(emp) => {
                  setEmployees((prev) => [emp, ...(prev ?? [])]);
                  setSelectedEmployeeId(emp.id);
                  setShowNewEmployeeForm(false);
                  toast.success("Employee added.");
                }}
              />
            )}

            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setStep("location")}>
                Back
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setStep("confirm")}
              >
                {selectedEmployeeId ? "Continue" : "Skip & continue"}
              </Button>
            </div>
          </motion.div>
        )}

        {step === "confirm" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="space-y-4">
            <div className="space-y-3 rounded-lg border border-border-default bg-bg-surface p-4">
              <SummaryRow label="Device code" value={code} />
              <SummaryRow label="Location" value={selectedLocation?.name ?? "—"} />
              <SummaryRow label="Employee" value={selectedEmployee?.name ?? "Unassigned"} />
            </div>

            {activateError && (
              <ErrorCard message={activateError} onRetry={handleActivate} retryLabel="Retry" />
            )}

            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setStep("employee")}>
                Back
              </Button>
              <AnimatedGradientBorder className="flex-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="hero"
                  className="w-full border-0 bg-transparent hover:bg-transparent hover:scale-100"
                  disabled={activating}
                  onClick={handleActivate}
                >
                  {activating && <Loader2 className="animate-spin" />}
                  {activating ? "Activating…" : "Activate Device"}
                </Button>
              </AnimatedGradientBorder>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <span
      className={`flex size-5 items-center justify-center rounded-full text-[11px] font-medium ${
        active
          ? "bg-brand text-text-on-primary"
          : done
            ? "bg-brand-subtle text-brand"
            : "bg-bg-surface text-text-muted"
      }`}
    >
      {label}
    </span>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-body-sm text-text-muted">{label}</span>
      <span className="text-body-sm font-medium text-text-primary">{value}</span>
    </div>
  );
}

function ErrorCard({
  message,
  onRetry,
  retryLabel = "Retry",
}: {
  message: string;
  onRetry: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3">
      <p className="text-body-sm text-danger">{message}</p>
      <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
        <RotateCcw className="size-3.5" />
        {retryLabel}
      </Button>
    </div>
  );
}

function NewLocationForm({
  onCreated,
  onCancel,
}: {
  onCreated: (loc: Location) => void;
  onCancel: () => void;
}) {
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = React.useState("");
  const [language, setLanguage] = React.useState("en");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address, googleReviewUrl, language }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? "Couldn't save this location.");
        return;
      }
      onCreated(data.location);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-border-default bg-bg-surface p-4">
      <div className="space-y-1.5">
        <Label htmlFor="loc-name">Location name</Label>
        <Input id="loc-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="loc-address">Address</Label>
        <Input id="loc-address" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="loc-review-url">Google review link</Label>
        <Input
          id="loc-review-url"
          placeholder="https://g.page/r/..."
          value={googleReviewUrl}
          onChange={(e) => setGoogleReviewUrl(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="loc-language">Language</Label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger id="loc-language" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
            <SelectItem value="fr">French</SelectItem>
            <SelectItem value="de">German</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-body-sm text-danger">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="flex-1"
          disabled={submitting || !name || !address || !googleReviewUrl}
          onClick={submit}
        >
          {submitting && <Loader2 className="animate-spin" />}
          {submitting ? "Saving…" : "Save location"}
        </Button>
      </div>
    </div>
  );
}

function NewEmployeeForm({
  locationId,
  onCreated,
  onCancel,
}: {
  locationId: string;
  onCreated: (emp: Employee) => void;
  onCancel: () => void;
}) {
  const [name, setName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, locationId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? "Couldn't save this employee.");
        return;
      }
      onCreated(data.employee);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-border-default bg-bg-surface p-4">
      <div className="space-y-1.5">
        <Label htmlFor="emp-name">Employee name</Label>
        <Input id="emp-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      {error && <p className="text-body-sm text-danger">{error}</p>}
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="flex-1"
          disabled={submitting || !name}
          onClick={submit}
        >
          {submitting && <Loader2 className="animate-spin" />}
          {submitting ? "Saving…" : "Save employee"}
        </Button>
      </div>
    </div>
  );
}

// Signature "activation success" animation per theme guideline section 5.2 — SVG checkmark
// draw-in + a scale-pop, reusing lib/motion.ts's easing conventions rather than inventing new
// ones.
function SuccessScreen({ deviceId }: { deviceId: string }) {
  return (
    <Card variant="glass" className="w-full items-center text-center">
      {/* CardHeader is a CSS grid (see components/ui/card.tsx) nested inside Card's flex column.
          Without an explicit width, the flex item (CardHeader) and the grid track inside it can
          disagree on how wide the box actually is — the grid track sizes itself to its content's
          max-content width while the flex item's own box stays at a narrower intrinsic width,
          so children end up positioned relative to a wider column than the box that's actually
          visible, reading as "the icon is shoved off to one side" (this is what the client
          reported as the activation screen "not being responsive"). `w-full` on the Card forces
          an unambiguous width the whole way down instead of relying on flex/grid intrinsic
          sizing to agree on their own. `justify-items-center` on CardHeader is still needed too
          — `items-center` alone only centers vertically, not horizontally. */}
      <CardHeader className="w-full items-center justify-items-center">
        <motion.svg
          width="72"
          height="72"
          viewBox="0 0 72 72"
          fill="none"
          initial="hidden"
          animate="visible"
        >
          <motion.circle
            cx="36"
            cy="36"
            r="34"
            stroke="var(--color-brand)"
            strokeWidth="3"
            variants={{
              hidden: { pathLength: 0, opacity: 0 },
              visible: {
                pathLength: 1,
                opacity: 1,
                transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
              },
            }}
          />
          <motion.path
            d="M22 37 L31 46 L50 26"
            stroke="var(--color-brand)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={{
              hidden: { pathLength: 0, opacity: 0 },
              visible: {
                pathLength: 1,
                opacity: 1,
                transition: { duration: 0.4, delay: 0.35, ease: [0.16, 1, 0.3, 1] },
              },
            }}
          />
        </motion.svg>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.6, ease: "easeOut" }}
        >
          <CardTitle className="mt-4 text-h3">Device activated!</CardTitle>
          <CardDescription className="mt-1">
            <CheckCircle2 className="mr-1 inline size-4 text-brand" />
            You&apos;re all set — scans on this device now count toward your reviews.
          </CardDescription>
        </motion.div>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.8 }}
        >
          <AnimatedGradientBorder>
            <Link href={`/dashboard/devices/${deviceId}`}>
              <Button
                variant="secondary"
                size="hero"
                className="border-0 bg-transparent hover:bg-transparent hover:scale-100"
              >
                Go to dashboard
              </Button>
            </Link>
          </AnimatedGradientBorder>
        </motion.div>
      </CardContent>
    </Card>
  );
}
