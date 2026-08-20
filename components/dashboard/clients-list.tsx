"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/lib/toast";

export type ClientRow = {
  id: string;
  name: string;
  billingEmail: string;
  locationCount: number;
  deviceCount: number;
  employeeCount: number;
  totalScans: number;
  activeDevices: number;
};

function AddClientDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ businessName: "", ownerName: "", email: "", password: "" });

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Failed to create client");
        return;
      }
      toast.success("Client business created");
      setOpen(false);
      setForm({ businessName: "", ownerName: "", email: "", password: "" });
      router.refresh();
    } catch {
      toast.error("Failed to create client — check your connection and try again");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    form.businessName.trim() &&
    form.ownerName.trim() &&
    form.email.trim() &&
    form.password.length >= 8;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Add client
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a client business</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="client-business-name">Business name</Label>
            <Input
              id="client-business-name"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="client-owner-name">Owner name</Label>
            <Input
              id="client-owner-name"
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="client-email">Owner login email</Label>
            <Input
              id="client-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="client-password">Temporary password</Label>
            <Input
              id="client-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 8 characters"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting || !canSubmit}>
            {submitting ? "Creating…" : "Create client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ClientsList({ clients }: { clients: ClientRow[] }) {
  const router = useRouter();
  const [filterId, setFilterId] = useState<string>("all");

  const visible = useMemo(
    () => (filterId === "all" ? clients : clients.filter((c) => c.id === filterId)),
    [clients, filterId]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={filterId} onValueChange={setFilterId}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="All clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All clients</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <AddClientDialog />
      </div>

      <div className="space-y-3">
        {visible.map((client) => (
          <div
            key={client.id}
            onClick={() => router.push(`/dashboard/clients/${client.id}`)}
            className="flex cursor-pointer flex-col gap-3 rounded-lg border border-border-default bg-bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-semibold text-text-primary">{client.name}</p>
              <p className="text-body-sm text-text-muted">{client.billingEmail}</p>
              <p className="text-caption text-text-muted">
                {client.locationCount.toLocaleString()} locations ·{" "}
                {client.deviceCount.toLocaleString()} devices ·{" "}
                {client.employeeCount.toLocaleString()} employees
              </p>
            </div>
            <div className="text-right">
              <p className="text-h4 font-display font-semibold text-text-primary">
                {client.totalScans.toLocaleString()}
              </p>
              <p className="text-caption text-text-muted">scans this month</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

ClientsList.AddButton = AddClientDialog;
