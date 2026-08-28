"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileSchema } from "@/lib/validation";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type FieldErrors = Partial<Record<"name" | "accountName", string>>;

export function ProfileForm({
  name: initialName,
  accountName: initialAccountName,
  email,
}: {
  name: string;
  accountName: string;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [accountName, setAccountName] = useState(initialAccountName);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  async function submit() {
    const parsed = updateProfileSchema.safeParse({ name, accountName });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({ name: flat.name?.[0], accountName: flat.accountName?.[0] });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "Failed to save changes");
      toast.success("Profile updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void submit();
  }

  return (
    <Card className="px-6">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <p className="text-body-sm font-medium text-text-primary">Profile</p>

        <div className="space-y-1.5">
          <Label htmlFor="settings-account-name">Business name</Label>
          <Input
            id="settings-account-name"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            aria-invalid={!!errors.accountName}
            className={cn(errors.accountName && "border-danger focus-visible:border-danger")}
          />
          {errors.accountName && <p className="text-caption text-danger">{errors.accountName}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="settings-name">Your name</Label>
          <Input
            id="settings-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
            className={cn(errors.name && "border-danger focus-visible:border-danger")}
          />
          {errors.name && <p className="text-caption text-danger">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="settings-email">Email</Label>
          <Input id="settings-email" value={email} disabled />
          <p className="text-caption text-text-muted">
            Contact Support if you need to change your email address.
          </p>
        </div>

        <Button type="submit" disabled={loading} className="self-start">
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Saving…
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </form>
    </Card>
  );
}
