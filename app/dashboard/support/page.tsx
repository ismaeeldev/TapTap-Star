import { auth } from "@/lib/auth/auth";
import { SupportForm } from "./support-form";

// Client-requested (Modifications 3 PDF, item 8): "I want a support option so people can contact
// me if any problem." Clarified via follow-up question — this is the business owner contacting
// Taptapstar's own support team, not end-customers contacting the business. Name/email are
// server-derived from the session, not free text, and shown read-only so it's clear who the
// message is sent as.
export default async function SupportPage() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-h2 font-display font-semibold text-text-primary">Support</h1>
        <p className="text-body-sm text-text-muted">
          Have a problem or a question? Send a message straight to the Taptapstar team.
        </p>
      </div>

      <SupportForm name={session.user.name} email={session.user.email} />
    </div>
  );
}
