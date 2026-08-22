// Neon serverless (HTTP) can fail the first request with `fetch failed` while a
// scale-to-zero compute wakes. One short retry covers that for dashboard reads
// without inventing fake data.
export async function withDbRetry<T>(
  label: string,
  fn: () => Promise<T>,
  opts?: { delayMs?: number }
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[${label}] DB read failed, retrying:`, err);
    await new Promise((r) => setTimeout(r, opts?.delayMs ?? 600));
    return await fn();
  }
}
