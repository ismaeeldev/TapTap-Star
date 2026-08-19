"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { MailCheck, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

const ERROR_COPY: Record<string, string> = {
  missing_token: "That verification link is missing its token.",
  invalid_token: "That verification link is invalid or has expired.",
};

export default function VerifyEmailPage() {
  return (
    <React.Suspense fallback={null}>
      <VerifyEmailContent />
    </React.Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const error = searchParams.get("error");
  const [isResending, setIsResending] = React.useState(false);

  React.useEffect(() => {
    if (error) {
      toast.error(ERROR_COPY[error] ?? "Something went wrong verifying your email.");
    }
  }, [error]);

  const handleResend = async () => {
    if (!email) {
      toast.error("We don't have an email on file — please sign up again.");
      return;
    }
    setIsResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      toast.success("Verification email sent — check your inbox.");
    } catch {
      toast.error("Couldn't resend the email. Please try again shortly.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card variant="glass">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-brand-subtle text-brand">
          <MailCheck className="size-7" />
        </div>
        <CardTitle className="text-h3">Check your inbox</CardTitle>
        <CardDescription>
          {email ? (
            <>
              We sent a verification link to <span className="font-medium text-text-primary">{email}</span>.
              Click it to activate your account.
            </>
          ) : (
            "We sent you a verification link. Click it to activate your account."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <Button variant="secondary" onClick={handleResend} disabled={isResending}>
          {isResending && <Loader2 className="animate-spin" />}
          {isResending ? "Resending…" : "Resend verification email"}
        </Button>
      </CardContent>
    </Card>
  );
}
