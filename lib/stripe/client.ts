// Stripe server SDK client — Step 8. Never import this from client components/edge routes
// (this is a server-only Node module, same rule as lib/db/client.ts).
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set — required for any billing operation");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
