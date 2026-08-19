// TODO (Step 3): route protection for /dashboard/* and /admin/*.
// Must import ONLY lib/auth/auth.config.ts (the edge-safe config), never lib/auth/auth.ts
// (which holds the bcryptjs-based Credentials provider) — see the guardrail in
// ../AgentGuide/05_MASTER_BUILD_GUIDE.md Step 3.2.
import { NextResponse } from "next/server";

export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
