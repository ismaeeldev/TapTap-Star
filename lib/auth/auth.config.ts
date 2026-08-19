// Edge-safe Auth.js v5 config — imported ONLY by middleware.ts (via a lightweight
// NextAuth(authConfig) instance) and by lib/auth/auth.ts (spread into the full config).
// NO Credentials provider and NO bcryptjs import here — see the bcrypt/Edge guardrail in
// ../../AgentGuide/05_MASTER_BUILD_GUIDE.md Step 3.2. Routing/callback logic only.
import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

// Module augmentation so session.user/token carry our custom RBAC fields everywhere they're
// used (middleware, API routes, server components) with full type safety.
declare module "next-auth" {
  interface User {
    accountId: string;
    role: "owner" | "agency_admin" | "taptapstar_admin";
    accountType: "business" | "agency";
    agencyStatus: "none" | "pending" | "approved" | "rejected";
    verified: boolean;
  }
  interface Session {
    user: {
      id: string;
      accountId: string;
      role: "owner" | "agency_admin" | "taptapstar_admin";
      accountType: "business" | "agency";
      agencyStatus: "none" | "pending" | "approved" | "rejected";
      verified: boolean;
      email: string;
      name: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    accountId: string;
    role: "owner" | "agency_admin" | "taptapstar_admin";
    accountType: "business" | "agency";
    agencyStatus: "none" | "pending" | "approved" | "rejected";
    verified: boolean;
  }
}

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id as string;
        token.accountId = user.accountId;
        token.role = user.role;
        token.accountType = user.accountType;
        token.agencyStatus = user.agencyStatus;
        token.verified = user.verified;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.userId;
      session.user.accountId = token.accountId;
      session.user.role = token.role;
      session.user.accountType = token.accountType;
      session.user.agencyStatus = token.agencyStatus;
      session.user.verified = token.verified;
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      if (pathname.startsWith("/admin")) {
        if (!isLoggedIn) return false; // redirects to /login (pages.signIn)
        if (auth.user.role !== "taptapstar_admin") {
          // Logged in but wrong role: bounce to their own dashboard, not back to /login.
          return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
        }
        return true;
      }
      if (pathname.startsWith("/dashboard")) {
        return isLoggedIn;
      }
      return true;
    },
  },
};

