// Pure formatting helpers with no server-only imports — safe to use from client components
// (unlike lib/queries/marketing.ts, which imports the Drizzle db client).
export function formatPriceCents(cents: number, currency: string = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
