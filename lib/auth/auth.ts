// Full Auth.js v5 config — imported ONLY by app/api/auth/[...nextauth]/route.ts and other
// Node-runtime API routes (e.g. app/api/auth/verify-email/route.ts, which logs the user in
// programmatically after verifying their token). Never import this from middleware.ts — see
// the bcrypt/Edge guardrail in ../../AgentGuide/05_MASTER_BUILD_GUIDE.md Step 3.2.
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, accounts } from "@/lib/db/schema";
import { loginSchema } from "@/lib/validation";
import { authConfig } from "./auth.config";

// Custom Credentials-provider errors, per Auth.js v5's pattern for surfacing a specific reason
// to the client without leaking it into the generic `error` field (only the safe `code` query
// param carries it) — see node_modules/@auth/core/errors.d.ts's CredentialsSignin doc comment.
class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });
        if (!user) return null;

        // Never reveal via a generic error which of "no such user"/"wrong password" happened —
        // both return null here and the login route's caller shows one generic message.
        // Unverified accounts get a distinct, specific error so the UI can point them back to
        // /verify-email instead of implying a wrong password.
        if (!user.emailVerifiedAt) {
          throw new EmailNotVerifiedError();
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        const account = await db.query.accounts.findFirst({
          where: eq(accounts.id, user.accountId),
        });
        if (!account) return null;

        return {
          id: user.id,
          accountId: user.accountId,
          role: user.role,
          accountType: account.type,
          agencyStatus: account.agencyStatus,
          verified: !!user.emailVerifiedAt,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
});

