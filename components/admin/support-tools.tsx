"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { StatusBadge, type DomainStatus } from "@/components/shared/status-badge";
import { toast } from "@/lib/toast";

type DeviceHit = {
  id: string;
  code: string;
  status: string;
  accountName: string | null;
};

type AccountHit = { id: string; name: string; billingEmail: string };
type LocationOption = { id: string; name: string; employees: { id: string; name: string }[] };

// -------------------------------------------------------------------------------------------
// Device lookup + force-unlock / force-reassign
// -------------------------------------------------------------------------------------------

function DeviceLookup() {
  const [codeQuery, setCodeQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [hits, setHits] = useState<DeviceHit[]>([]);
  const [selected, setSelected] = useState<DeviceHit | null>(null);

  const [unlocking, setUnlocking] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);

  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [accountQuery, setAccountQuery] = useState("");
  const [accountHits, setAccountHits] = useState<AccountHit[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountHit | null>(null);
  const [accountLocations, setAccountLocations] = useState<LocationOption[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  async function searchDevices() {
    if (!codeQuery.trim()) return;
    setSearching(true);
    setSelected(null);
    try {
      const res = await fetch(`/api/admin/devices?q=${encodeURIComponent(codeQuery.trim())}&page=1`);
      const data = await res.json();
      setHits(data.devices ?? []);
    } catch {
      toast.error("Search failed — check your connection and try again");
    } finally {
      setSearching(false);
    }
  }

  async function searchAccounts(q: string) {
    setAccountQuery(q);
    if (!q.trim()) {
      setAccountHits([]);
      return;
    }
    try {
      const res = await fetch(`/api/admin/accounts?q=${encodeURIComponent(q.trim())}&page=1`);
      const data = await res.json();
      setAccountHits(data.accounts ?? []);
    } catch {
      setAccountHits([]);
    }
  }

  async function pickAccount(account: AccountHit) {
    setSelectedAccount(account);
    setSelectedLocationId("");
    setSelectedEmployeeId("");
    try {
      const res = await fetch(`/api/admin/accounts/${account.id}`);
      const data = await res.json();
      setAccountLocations(data.locations ?? []);
    } catch {
      setAccountLocations([]);
    }
  }

  async function handleForceUnlock() {
    if (!selected) return;
    setUnlocking(true);
    try {
      const res = await fetch(`/api/admin/devices/${selected.id}/force-unlock`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Failed to force-unlock device");
        return;
      }
      toast.success(`Device ${selected.code} unlocked — now unassigned`);
      setUnlockOpen(false);
      setSelected({ ...selected, status: "unassigned", accountName: null });
    } catch {
      toast.error("Failed to force-unlock device — check your connection and try again");
    } finally {
      setUnlocking(false);
    }
  }

  async function handleForceReassign() {
    if (!selected || !selectedAccount || !selectedLocationId) return;
    setReassigning(true);
    try {
      const res = await fetch(`/api/admin/devices/${selected.id}/force-reassign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: selectedLocationId,
          employeeId: selectedEmployeeId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Failed to force-reassign device");
        return;
      }
      toast.success(`Device ${selected.code} reassigned to ${selectedAccount.name}`);
      setReassignOpen(false);
      setSelected({ ...selected, status: "active", accountName: selectedAccount.name });
    } catch {
      toast.error("Failed to force-reassign device — check your connection and try again");
    } finally {
      setReassigning(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-border-default bg-bg-card p-6">
      <h2 className="text-h4 font-semibold text-text-primary">Device lookup</h2>
      <div className="flex gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={codeQuery}
            onChange={(e) => setCodeQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchDevices()}
            placeholder="Device code…"
            className="pl-9"
          />
        </div>
        <Button variant="secondary" onClick={searchDevices} disabled={searching}>
          {searching ? "Searching…" : "Search"}
        </Button>
      </div>

      {hits.length > 0 && !selected && (
        <ul className="divide-y divide-border-default rounded-md border border-border-default">
          {hits.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => setSelected(d)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-body-sm hover:bg-bg-muted"
              >
                <span className="font-mono">{d.code}</span>
                <StatusBadge status={d.status as DomainStatus} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="space-y-3 rounded-md border border-border-default p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-medium text-text-primary">{selected.code}</span>
            <StatusBadge status={selected.status as DomainStatus} />
            {selected.accountName && (
              <span className="text-caption text-text-muted">on {selected.accountName}</span>
            )}
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
              Change device
            </Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Dialog open={unlockOpen} onOpenChange={setUnlockOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">Force unlock</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Force-unlock this device?</DialogTitle>
                  <DialogDescription>
                    Clears its account/location/employee and resets it to{" "}
                    <strong>unassigned</strong> so it can be claimed again from scratch. This
                    cannot be undone from here.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="destructive" onClick={handleForceUnlock} disabled={unlocking}>
                    {unlocking ? "Unlocking…" : "Force unlock"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={reassignOpen}
              onOpenChange={(open) => {
                setReassignOpen(open);
                if (!open) {
                  setSelectedAccount(null);
                  setAccountHits([]);
                  setAccountQuery("");
                }
              }}
            >
              <DialogTrigger asChild>
                <Button variant="secondary">Force reassign</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Force-reassign this device</DialogTitle>
                  <DialogDescription>
                    Directly assign it to another account/location, bypassing the normal claim
                    flow.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                  {!selectedAccount ? (
                    <>
                      <Input
                        value={accountQuery}
                        onChange={(e) => void searchAccounts(e.target.value)}
                        placeholder="Search accounts by name/email…"
                      />
                      {accountHits.length > 0 && (
                        <ul className="max-h-48 divide-y divide-border-default overflow-y-auto rounded-md border border-border-default">
                          {accountHits.map((a) => (
                            <li key={a.id}>
                              <button
                                type="button"
                                onClick={() => void pickAccount(a)}
                                className="w-full px-3 py-2 text-left text-body-sm hover:bg-bg-muted"
                              >
                                <p className="font-medium text-text-primary">{a.name}</p>
                                <p className="text-caption text-text-muted">{a.billingEmail}</p>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-body-sm font-medium text-text-primary">
                          {selectedAccount.name}
                        </p>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedAccount(null)}>
                          Change
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Location</Label>
                        <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a location" />
                          </SelectTrigger>
                          <SelectContent>
                            {accountLocations.map((l) => (
                              <SelectItem key={l.id} value={l.id}>
                                {l.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedLocationId && (
                        <div className="space-y-1.5">
                          <Label>Employee (optional)</Label>
                          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Unassigned" />
                            </SelectTrigger>
                            <SelectContent>
                              {accountLocations
                                .find((l) => l.id === selectedLocationId)
                                ?.employees.map((e) => (
                                  <SelectItem key={e.id} value={e.id}>
                                    {e.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="primary"
                    onClick={handleForceReassign}
                    disabled={reassigning || !selectedAccount || !selectedLocationId}
                  >
                    {reassigning ? "Reassigning…" : "Force reassign"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------------------------------------
// Billing credit
// -------------------------------------------------------------------------------------------

function BillingCredit() {
  const [accountQuery, setAccountQuery] = useState("");
  const [accountHits, setAccountHits] = useState<AccountHit[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountHit | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function searchAccounts(q: string) {
    setAccountQuery(q);
    if (!q.trim()) {
      setAccountHits([]);
      return;
    }
    try {
      const res = await fetch(`/api/admin/accounts?q=${encodeURIComponent(q.trim())}&page=1`);
      const data = await res.json();
      setAccountHits(data.accounts ?? []);
    } catch {
      setAccountHits([]);
    }
  }

  async function handleApply() {
    if (!selectedAccount) return;
    const amountCents = Math.round(Number(amount) * 100);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/billing/${selectedAccount.id}/credit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Failed to apply credit");
        return;
      }
      toast.success(`Applied a $${amount} credit to ${selectedAccount.name}`);
      setOpen(false);
      setAmount("");
      setReason("");
      setSelectedAccount(null);
      setAccountQuery("");
    } catch {
      toast.error("Failed to apply credit — check your connection and try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-border-default bg-bg-card p-6">
      <h2 className="text-h4 font-semibold text-text-primary">Billing credit / adjustment</h2>
      <p className="text-body-sm text-text-muted">
        Applies a real Stripe customer-balance credit — reduces what the account owes on its next
        invoice.
      </p>

      {!selectedAccount ? (
        <>
          <Input
            value={accountQuery}
            onChange={(e) => void searchAccounts(e.target.value)}
            placeholder="Search accounts by name/email…"
            className="max-w-sm"
          />
          {accountHits.length > 0 && (
            <ul className="max-w-sm divide-y divide-border-default rounded-md border border-border-default">
              {accountHits.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedAccount(a)}
                    className="w-full px-3 py-2 text-left text-body-sm hover:bg-bg-muted"
                  >
                    <p className="font-medium text-text-primary">{a.name}</p>
                    <p className="text-caption text-text-muted">{a.billingEmail}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <div className="max-w-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-body-sm font-medium text-text-primary">{selectedAccount.name}</p>
            <Button variant="ghost" size="sm" onClick={() => setSelectedAccount(null)}>
              Change
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="creditAmount">Credit amount (USD)</Label>
            <Input
              id="creditAmount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="creditReason">Reason</Label>
            <Textarea id="creditReason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={!amount || Number(amount) <= 0 || !reason.trim()}>
                Apply credit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apply a ${amount} credit?</DialogTitle>
                <DialogDescription>
                  This creates a real Stripe balance credit for {selectedAccount.name}. Reason:{" "}
                  {reason || "—"}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={handleApply} disabled={submitting}>
                  {submitting ? "Applying…" : "Confirm credit"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------------------------------------
// Contact messages inbox
// -------------------------------------------------------------------------------------------

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: "new" | "read" | "resolved";
  createdAt: string;
};

function ContactInbox({ initial }: { initial: ContactMessage[] }) {
  const [messages, setMessages] = useState(initial);

  async function setStatus(id: string, status: "read" | "resolved") {
    try {
      const res = await fetch(`/api/admin/support/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Failed to update message");
        return;
      }
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
      toast.success(`Marked as ${status}`);
    } catch {
      toast.error("Failed to update message — check your connection and try again");
    }
  }

  if (messages.length === 0) {
    return (
      <div className="rounded-lg border border-border-default bg-bg-card p-6 text-center text-body-sm text-text-muted">
        No contact messages yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((m) => (
        <div key={m.id} className="rounded-lg border border-border-default bg-bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium text-text-primary">
                {m.name} <span className="font-normal text-text-muted">— {m.email}</span>
              </p>
              <p className="text-caption text-text-muted">
                {new Date(m.createdAt).toLocaleString()}
              </p>
            </div>
            <StatusBadge status={m.status === "new" ? "pending" : m.status === "read" ? "unassigned" : "approved"} />
          </div>
          <p className="mt-2 text-body-sm text-text-secondary">{m.message}</p>
          <div className="mt-3 flex gap-2">
            {m.status !== "read" && (
              <Button variant="ghost" size="sm" onClick={() => void setStatus(m.id, "read")}>
                Mark read
              </Button>
            )}
            {m.status !== "resolved" && (
              <Button variant="ghost" size="sm" onClick={() => void setStatus(m.id, "resolved")}>
                Mark resolved
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SupportTools({ initialMessages }: { initialMessages: ContactMessage[] }) {
  return (
    <div className="space-y-8">
      <DeviceLookup />
      <BillingCredit />
      <section className="space-y-3">
        <h2 className="text-h4 font-semibold text-text-primary">Contact messages</h2>
        <ContactInbox initial={initialMessages} />
      </section>
    </div>
  );
}
