"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AnimatedGradientBorder } from "@/components/shared/animated-gradient-border";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation";
import { toast } from "@/lib/toast";

export default function ForgotPasswordPage() {
  const [sent, setSent] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: ForgotPasswordInput) => {
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      toast.error("Something went wrong — please try again.");
    }
  };

  if (sent) {
    return (
      <Card variant="glass">
        <CardHeader className="items-center justify-items-center text-center">
          <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-brand-subtle text-brand">
            <MailCheck className="size-7" />
          </div>
          <CardTitle className="text-h3">Check your inbox</CardTitle>
          <CardDescription>
            If an account exists for that email, we&apos;ve sent a link to reset your password.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="text-h3">Forgot your password?</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a link to reset it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-body-sm text-danger">{errors.email.message}</p>
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
              {isSubmitting ? "Sending…" : "Send reset link"}
            </Button>
          </AnimatedGradientBorder>
        </form>

        <p className="mt-6 text-center text-body-sm text-text-muted">
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Back to login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
