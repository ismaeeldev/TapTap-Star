// OpenAI SDK client — Modifications 9 (client PDF, item 1: AI-answered reviews). Same lazy-
// construction pattern as lib/stripe/client.ts: a missing key must only fail the one AI-reply
// generation attempt that needed it, not crash every page/route that transitively imports this
// module. Reads OPEN_AI_KEYS specifically — the exact var name already present in this project's
// .env.local, not the SDK's own default OPENAI_API_KEY name.
import OpenAI from "openai";

let cachedClient: OpenAI | null = null;

export function getOpenAiClient(): OpenAI {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.OPEN_AI_KEYS?.trim();
  if (!apiKey) {
    throw new Error("OPEN_AI_KEYS is not set — required for AI-generated review replies");
  }
  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}
