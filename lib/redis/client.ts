// Upstash Redis REST client per ../../AgentGuide/03_DATA_MODEL_AND_ARCHITECTURE.md section 7 —
// used exclusively for the /r/[code] fraud-throttle. Edge-compatible (REST-based, no TCP socket).
import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();
