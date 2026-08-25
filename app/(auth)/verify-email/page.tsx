"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailCheck, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

const ERROR_COPY: Record<string, string> = {
  missing_token: "That verification link is missing its token.",
  invalid_token: "That verification link is invalid or has expired.",
  // Distinct from invalid_token — a used link almost always means verification already
  // succeeded (a double-click, or a second tab), not that something went wrong.
  already_verified: "That link was already used — your email is probably already verified.",
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
  // "0" means signup's own send attempt failed (see app/api/auth/signup/route.ts's `emailSent`) —
  // absent (arriving here any other way, e.g. a bookmark) defaults to the normal copy rather than
  // assuming failure.
  const sendFailed = searchParams.get("sent") === "0";
  const alreadyVerified = error === "already_verified";
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
      // This endpoint deliberately never confirms whether the send actually succeeded (see its
      // route comment — doing so would leak whether the email is registered at all), so the copy
      // here stays honestly hedged rather than claiming a guaranteed "sent".
      toast.success("If that email is registered and not yet verified, a new link is on its way.");
    } catch {
      toast.error("Couldn't resend the email. Please try again shortly.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card variant="glass">
      <CardHeader className="items-center justify-items-center text-center">
        <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-brand-subtle text-brand">
          <MailCheck className="size-7" />
        </div>
        <CardTitle className="text-h3">
          {alreadyVerified ? "Already verified" : sendFailed ? "One more step" : "Check your inbox"}
        </CardTitle>
        <CardDescription>
          {alreadyVerified ? (
            "That link was already used, which almost always means your email is already verified — try logging in."
          ) : sendFailed ? (
            <>
              We couldn&apos;t send a verification email
              {email ? (
                <>
                  {" "}
                  to <span className="font-medium text-text-primary">{email}</span>
                </>
              ) : null}{" "}
              just now. Click &ldquo;Resend&rdquo; below to try again.
            </>
          ) : email ? (
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
        {alreadyVerified ? (
          <Button variant="secondary" asChild>
            <Link href="/login">Go to login</Link>
          </Button>
        ) : (
          <Button variant="secondary" onClick={handleResend} disabled={isResending}>
            {isResending && <Loader2 className="animate-spin" />}
            {isResending ? "Resending…" : "Resend verification email"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
