// Drizzle client per ../../AgentGuide/03_DATA_MODEL_AND_ARCHITECTURE.md section 1 — the
// Neon serverless HTTP driver, locked specifically because it works on the Vercel Edge
// runtime, required for the /r/[code] hot path's <300ms latency budget (see architecture
// doc section 7). Do not swap to node-postgres/pg here.
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — check .env.local");
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });
