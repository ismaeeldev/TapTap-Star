"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordSchema } from "@/lib/validation";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type FieldErrors = Partial<Record<"currentPassword" | "newPassword" | "confirmPassword", string>>;

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  async function submit() {
    const parsed = changePasswordSchema.safeParse({ currentPassword, newPassword });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({
        currentPassword: flat.currentPassword?.[0],
        newPassword: flat.newPassword?.[0],
      });
      return;
    }
    // Client-side only — a typo in the new password field has nothing else to catch it before
    // the request succeeds and silently locks the user out on their next login. The API itself
    // only needs one newPassword value (no confirm field in changePasswordSchema); this check is
    // purely a "did you mean to type that" guard on this form, not a security control.
    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords don't match" });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "Failed to change password");
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
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
        <p className="text-body-sm font-medium text-text-primary">Change password</p>

        <div className="space-y-1.5">
          <Label htmlFor="settings-current-password">Current password</Label>
          <Input
            id="settings-current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            aria-invalid={!!errors.currentPassword}
            className={cn(errors.currentPassword && "border-danger focus-visible:border-danger")}
          />
          {errors.currentPassword && (
            <p className="text-caption text-danger">{errors.currentPassword}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="settings-new-password">New password</Label>
          <Input
            id="settings-new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            aria-invalid={!!errors.newPassword}
            className={cn(errors.newPassword && "border-danger focus-visible:border-danger")}
          />
          {errors.newPassword && <p className="text-caption text-danger">{errors.newPassword}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="settings-confirm-password">Confirm new password</Label>
          <Input
            id="settings-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-invalid={!!errors.confirmPassword}
            className={cn(errors.confirmPassword && "border-danger focus-visible:border-danger")}
          />
          {errors.confirmPassword && (
            <p className="text-caption text-danger">{errors.confirmPassword}</p>
          )}
        </div>

        <Button type="submit" disabled={loading} className="self-start">
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Changing…
            </>
          ) : (
            "Change password"
          )}
        </Button>
      </form>
    </Card>
  );
}
