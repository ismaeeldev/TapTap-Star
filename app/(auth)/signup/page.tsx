"use client";

// Modifications 5 pricing restructure (revision.md §3.4) — signup now offers real tier
// selection (previously every account was silently created on the single old "default" plan
// with no choice at all) and, for Premium/Network, real upfront card collection via Stripe
// Elements (client-confirmed: "Yes, card since the beginning"). Free tier skips card collection
// entirely — it's truly free forever, nothing to charge.
//
// The /pricing page's "Get started"/"Get N days free" buttons link here with ?plan=<key> — that
// query param preselects the plan below rather than starting the user back at a blank picker.
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedGradientBorder } from "@/components/shared/animated-gradient-border";
import { Button } from "@/components/ui/button";
import { StripeCardForm } from "@/components/billing/stripe-card-form";
import { signupSchema, type SignupInput } from "@/lib/validation";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type PlanKey = "free" | "premium" | "network";

const PLAN_INFO: Record<PlanKey, { name: string; blurb: string }> = {
  free: { name: "Free", blurb: "$0/mo forever, 1 location" },
  premium: { name: "Premium", blurb: "$25/mo, 14-day free trial" },
  network: { name: "Network", blurb: "$60/mo, unlimited locations, 14-day free trial" },
};

function isPlanKey(value: string | null): value is PlanKey {
  return value === "free" || value === "premium" || value === "network";
}

export default function SignupPage() {
  return (
    <React.Suspense fallback={null}>
      <SignupPageContent />
    </React.Suspense>
  );
}

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("plan");

  const [planKey, setPlanKey] = React.useState<PlanKey>(isPlanKey(preselected) ? preselected : "free");
  const [showPassword, setShowPassword] = React.useState(false);
  const [paymentMethodId, setPaymentMethodId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  const requiresCard = planKey === "premium" || planKey === "network";

  const onSubmit = async (values: SignupInput) => {
    if (requiresCard && !paymentMethodId) {
      toast.error("Enter a valid card to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          planKey,
          cadence: "monthly",
          ...(requiresCard ? { paymentMethodId } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message ?? "Something went wrong. Please try again.");
        return;
      }

      const data = await res.json().catch(() => ({ emailSent: false }));

      if (data.emailSent) {
        toast.success("Account created — check your inbox to verify your email.");
      } else {
        toast.warning(
          "Account created, but we couldn't send the verification email just now. You can retry from the next page."
        );
      }
      router.push(
        `/verify-email?email=${encodeURIComponent(values.email)}&sent=${data.emailSent ? "1" : "0"}`
      );
    } catch {
      toast.error("Network error — please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card variant="glass" className="shadow-xl">
      <CardHeader className="space-y-1.5">
        <CardTitle className="font-display text-display-md">Create your account</CardTitle>
        <CardDescription className="text-body-sm">
          Start turning every tap into a 5-star review — set up in minutes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Tightened from space-y-5 (Modifications 6 follow-up: signup was overflowing the
            viewport on common laptop heights once the card-collection step is shown for
            Premium/Network — the right column now scrolls internally if it still needs to,
            but this keeps the common case fitting without any scroll at all). */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Plan selector — client-requested tier structure (Free/Premium/Network),
              revision.md §2.1. Compact pill row rather than reusing the full pricing-tiers
              cards here — this is a quick confirm/change step, not the primary comparison
              (that's /pricing, which is where these links come from). */}
          <div className="space-y-1.5">
            <Label>Plan</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PLAN_INFO) as PlanKey[]).map((key) => {
                const active = planKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPlanKey(key)}
                    aria-pressed={active}
                    className={cn(
                      "relative rounded-md border px-3 py-2.5 text-left transition-colors",
                      active
                        ? "border-brand bg-brand-subtle"
                        : "border-border-default hover:border-text-muted"
                    )}
                  >
                    {active && (
                      <Check className="absolute top-2 right-2 size-3.5 text-brand" />
                    )}
                    <p className="text-body-sm font-semibold text-text-primary">
                      {PLAN_INFO[key].name}
                    </p>
                    <p className="mt-0.5 text-caption text-text-muted">{PLAN_INFO[key].blurb}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Business name</Label>
            <Input
              id="name"
              placeholder="Acme Coffee"
              autoComplete="organization"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-body-sm text-danger">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@business.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-body-sm text-danger">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                className="pr-11"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-card hover:text-text-primary"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password ? (
              <p className="text-body-sm text-danger">{errors.password.message}</p>
            ) : (
              <p className="text-caption text-text-muted">Use at least 8 characters.</p>
            )}
          </div>

          {requiresCard && (
            <div className="space-y-1.5">
              <Label>Card details</Label>
              <StripeCardForm onPaymentMethodReady={setPaymentMethodId} disabled={submitting} />
            </div>
          )}

          <AnimatedGradientBorder className="w-full">
            <Button
              type="submit"
              variant="secondary"
              size="hero"
              className="w-full border-0 bg-transparent hover:bg-transparent hover:scale-100"
              disabled={submitting || (requiresCard && !paymentMethodId)}
            >
              {submitting && <Loader2 className="animate-spin" />}
              {submitting
                ? "Creating account…"
                : requiresCard
                  ? "Start free trial"
                  : "Create account"}
            </Button>
          </AnimatedGradientBorder>
        </form>

        <p className="mt-6 text-center text-caption text-text-muted">
          By creating an account you agree to our{" "}
          <Link href="/legal/terms" className="text-brand hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="text-brand hover:underline">
            Privacy Policy
          </Link>
          .
        </p>

        <p className="mt-4 text-center text-body-sm text-text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
