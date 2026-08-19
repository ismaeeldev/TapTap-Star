// Route protection for /dashboard/* and /admin/*.
// Imports ONLY lib/auth/auth.config.ts (the edge-safe config), never lib/auth/auth.ts (which
// holds the bcryptjs-based Credentials provider) — see the guardrail in
// ../AgentGuide/05_MASTER_BUILD_GUIDE.md Step 3.2. Building a *separate*, lightweight
// NextAuth(authConfig) instance here (rather than importing `auth` from lib/auth/auth.ts) is
// the standard Auth.js v5 edge-middleware pattern and is what keeps bcryptjs out of the Edge
// bundle entirely.
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
