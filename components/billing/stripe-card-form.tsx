"use client";

// Modifications 5 pricing restructure (revision.md §3.4) — real Stripe Elements card
// collection for Premium/Network signup, the client-confirmed "card since the beginning" flow.
// No card-collection UI existed anywhere in this app before this — the legacy signup path never
// asked for one (payment_behavior: "default_incomplete", card added later via the Customer
// Portal). This is genuinely new infrastructure, not a rewrite of anything.
import * as React from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { AlertCircle } from "lucide-react";

let stripePromise: Promise<Stripe | null> | null = null;
function getStripePromise() {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error("[StripeCardForm] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
      stripePromise = Promise.resolve(null);
    } else {
      stripePromise = loadStripe(key);
    }
  }
  return stripePromise;
}

function cardElementOptions(isDark: boolean) {
  // Mirrors this app's own design tokens rather than Stripe's generic default styling, so the
  // embedded card field doesn't look like a foreign widget dropped into the page.
  return {
    style: {
      base: {
        fontSize: "15px",
        color: isDark ? "#F1F5F9" : "#0F172A",
        fontFamily: "inherit",
        "::placeholder": { color: isDark ? "#64748B" : "#94A3B8" },
      },
      invalid: { color: "#EF4444" },
    },
  };
}

function CardFormInner({
  onPaymentMethodReady,
  disabled,
}: {
  onPaymentMethodReady: (paymentMethodId: string | null) => void;
  disabled?: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = React.useState<string | null>(null);
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    // Deferred via rAF (rather than calling setState synchronously in the effect body) to
    // satisfy the react-hooks/set-state-in-effect rule — same pattern as ThemeToggle's mount
    // check and OnboardingTour's mount flag.
    const id = requestAnimationFrame(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Re-tokenizes on every change, not only at final submit — lets the parent form's submit
  // button enable/disable based on card validity in real time, matching this app's existing
  // pattern of disabling submit until a form is genuinely valid (see change-password-form.tsx's
  // confirm-match gating for the same idea, different mechanism).
  const handleChange = React.useCallback(
    async (event: { complete: boolean; error?: { message: string } }) => {
      setError(event.error?.message ?? null);
      if (!event.complete || !stripe || !elements) {
        onPaymentMethodReady(null);
        return;
      }
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        onPaymentMethodReady(null);
        return;
      }
      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });
      if (pmError) {
        setError(pmError.message ?? "Could not process this card");
        onPaymentMethodReady(null);
        return;
      }
      onPaymentMethodReady(paymentMethod?.id ?? null);
    },
    [stripe, elements, onPaymentMethodReady]
  );

  return (
    <div className="space-y-1.5">
      <div
        className={`rounded-md border px-3 py-2.5 ${
          error ? "border-danger" : "border-border-default"
        } ${disabled ? "opacity-50" : ""}`}
      >
        <CardElement options={cardElementOptions(isDark)} onChange={handleChange} />
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-caption text-danger">
          <AlertCircle className="size-3.5" /> {error}
        </p>
      )}
      <p className="text-caption text-text-muted">
        Test mode — use card number 4242 4242 4242 4242, any future expiry, any CVC.
      </p>
    </div>
  );
}

/**
 * Wraps CardFormInner in Stripe's <Elements> provider. `onPaymentMethodReady` fires with a real
 * Stripe PaymentMethod id once the entered card is valid and has been tokenized, or null while
 * incomplete/invalid — the parent signup form uses this directly as its submit-gate, the same
 * shape as every other "disable submit until valid" pattern already in this codebase.
 */
export function StripeCardForm({
  onPaymentMethodReady,
  disabled,
}: {
  onPaymentMethodReady: (paymentMethodId: string | null) => void;
  disabled?: boolean;
}) {
  const [loadFailed, setLoadFailed] = React.useState(false);

  React.useEffect(() => {
    getStripePromise()
      .then((s) => {
        if (!s) setLoadFailed(true);
      })
      .catch(() => setLoadFailed(true));
  }, []);

  if (loadFailed) {
    return (
      <p className="flex items-center gap-1.5 text-caption text-danger">
        <AlertCircle className="size-3.5" /> Payment form failed to load — please refresh and try
        again, or contact support if this keeps happening.
      </p>
    );
  }

  return (
    <Elements stripe={getStripePromise()}>
      <CardFormInner onPaymentMethodReady={onPaymentMethodReady} disabled={disabled} />
    </Elements>
  );
}
