import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { accounts, users } from "@/lib/db/schema";
import { ProfileForm } from "./profile-form";
import { ChangePasswordForm } from "./change-password-form";

// Client-requested (Modifications 5 PDF): "Settings is not developed." — first real pass: profile
// (name / business name) and a proper change-password form. Agency access moved out of this page
// to its own /dashboard/agency item in an earlier round — see that page for the reasoning.
export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  // Read name/email straight from the DB, not session.user — the JWT session strategy
  // (lib/auth/auth.config.ts) freezes name/email at login time, so a save-then-view on this
  // page would otherwise keep showing the pre-edit value until the next login.
  const [account, user] = await Promise.all([
    db.query.accounts.findFirst({ where: eq(accounts.id, session.user.accountId) }),
    db.query.users.findFirst({ where: eq(users.id, session.user.id) }),
  ]);
  if (!account || !user) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-h2 font-display font-semibold text-text-primary">Settings</h1>
        <p className="text-body-sm text-text-muted">Account preferences and access.</p>
      </div>

      <ProfileForm name={user.name} accountName={account.name} email={user.email} />
      <ChangePasswordForm />
    </div>
  );
}
