// Stripe server SDK client — Step 8. Never import this from client components/edge routes
// (this is a server-only Node module, same rule as lib/db/client.ts).
//
// Lazily constructed (not at module import time) — a missing/invalid STRIPE_SECRET_KEY must only
// fail the specific billing operation that needed it, not crash every page/route that happens to
// import this module transitively (billing, signup, the webhook, admin billing tools). Same fix
// already applied to lib/email/client.ts for the equivalent Resend/SMTP import-time throw.
import Stripe from "stripe";

let cachedStripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (cachedStripe) return cachedStripe;
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set — required for any billing operation");
  }
  cachedStripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return cachedStripe;
}

// Proxy so every existing `stripe.xyz(...)` call site keeps working unchanged — `getStripe()` is
// only actually invoked (and can only throw) at the moment a property is accessed, i.e. right
// before a real API call, not at import time.
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    // Pass the real instance as both target and receiver (not the proxy) so any getter-based
    // property on the SDK's class runs with the correct `this`, rather than this empty shell.
    const real = getStripe();
    return Reflect.get(real, prop, real);
  },
});
