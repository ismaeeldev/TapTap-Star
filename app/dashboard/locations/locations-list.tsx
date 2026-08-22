"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/lib/toast";

type LocationRow = {
  id: string;
  name: string;
  address: string;
  googleReviewUrl: string;
  scanCount: number;
};

function AddLocationDialog({ trigger }: { trigger: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", googleReviewUrl: "", language: "en" });

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Failed to create location");
        return;
      }
      toast.success("Location created");
      setOpen(false);
      setForm({ name: "", address: "", googleReviewUrl: "", language: "en" });
      router.refresh();
    } catch {
      toast.error("Failed to create location — check your connection and try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a location</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="loc-name">Name</Label>
            <Input
              id="loc-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="loc-address">Address</Label>
            <Input
              id="loc-address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="loc-url">Google review URL</Label>
            <Input
              id="loc-url"
              value={form.googleReviewUrl}
              onChange={(e) => setForm({ ...form, googleReviewUrl: e.target.value })}
              placeholder="https://g.page/r/..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !form.name || !form.address || !form.googleReviewUrl}
          >
            {submitting ? "Creating…" : "Create location"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddButton() {
  return (
    <AddLocationDialog
      trigger={
        <Button>
          <Plus className="size-4" /> Add location
        </Button>
      }
    />
  );
}

// Named export for the empty-state CTA — do NOT attach this as LocationsList.AddButton.
// Static properties on Client Components are unreliable across the RSC import boundary and
// can resolve to undefined (→ dashboard error boundary "Try again").
export function LocationsAddButton() {
  return <AddButton />;
}

function EditDeleteControls({ location }: { location: LocationRow }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: location.name,
    address: location.address,
    googleReviewUrl: location.googleReviewUrl,
  });

  async function handleEdit() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/locations/${location.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Failed to update location");
        return;
      }
      toast.success("Location updated");
      setEditOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to update location — check your connection and try again");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/locations/${location.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Failed to delete location");
        return;
      }
      toast.success("Location deleted");
      setDeleteOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to delete location — check your connection and try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary" size="sm">
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Google review URL</Label>
              <Input
                value={form.googleReviewUrl}
                onChange={(e) => setForm({ ...form, googleReviewUrl: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEdit} disabled={submitting}>
              {submitting ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm">
            Delete
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this location?</DialogTitle>
          </DialogHeader>
          <p className="text-body-sm text-text-muted">
            This permanently deletes &ldquo;{location.name}&rdquo; and its scan history. Any
            active device here must be deactivated or reassigned first. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? "Deleting…" : "Delete location"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function LocationsList({ locations }: { locations: LocationRow[] }) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddButton />
      </div>
      <div className="space-y-3">
        {locations.map((loc) => (
          <div
            key={loc.id}
            onClick={() => router.push(`/dashboard/locations/${loc.id}`)}
            className="flex cursor-pointer flex-col gap-3 rounded-lg border border-border-default bg-bg-card p-4 shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-semibold text-text-primary">{loc.name}</p>
              <p className="text-body-sm text-text-muted">{loc.address}</p>
              <p className="text-caption text-text-muted">
                {loc.scanCount.toLocaleString()} scans
              </p>
            </div>
            <EditDeleteControls location={loc} />
          </div>
        ))}
      </div>
    </div>
  );
}

