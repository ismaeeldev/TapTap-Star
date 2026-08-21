"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AnimatedGradientBorder } from "@/components/shared/animated-gradient-border";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation";
import { toast } from "@/lib/toast";

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={null}>
      <ResetPasswordContent />
    </React.Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "" },
  });

  React.useEffect(() => {
    setValue("token", token);
  }, [token, setValue]);

  const onSubmit = async (values: ResetPasswordInput) => {
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.message ?? "That reset link is invalid or has expired.");
        return;
      }

      toast.success("Password reset — you can now log in.");
      router.push("/login");
    } catch {
      toast.error("Network error — please try again.");
    }
  };

  if (!token) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-h3">Invalid link</CardTitle>
          <CardDescription>
            This password reset link is missing its token. Request a new one below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/forgot-password">
            <Button variant="secondary" className="w-full">
              Request new link
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="text-h3">Set a new password</CardTitle>
        <CardDescription>Choose a new password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <input type="hidden" {...register("token")} />
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-body-sm text-danger">{errors.password.message}</p>
            ) : (
              <p className="text-caption text-text-muted">At least 8 characters.</p>
            )}
          </div>

          <AnimatedGradientBorder className="w-full">
            <Button
              type="submit"
              variant="secondary"
              size="hero"
              className="w-full border-0 bg-transparent hover:bg-transparent hover:scale-100"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="animate-spin" />}
              {isSubmitting ? "Resetting…" : "Reset password"}
            </Button>
          </AnimatedGradientBorder>
        </form>
      </CardContent>
    </Card>
  );
}
