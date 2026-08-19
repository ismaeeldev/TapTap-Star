// Resend wiring. Full templated (React Email) versions are Step 9's job — these are real,
// working sends (not console.log stubs), just plain-HTML templates for now.
import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set — check .env.local");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// Resend's shared sandbox domain — works without a verified custom domain, real requirement
// for this environment since Taptapstar's own sending domain hasn't been verified yet.
const FROM = "Taptapstar <onboarding@resend.dev>";

function wrapperHtml(title: string, bodyHtml: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:32px;">
            <tr><td>
              <div style="font-size:18px;font-weight:700;color:#1A56E8;margin-bottom:24px;">Taptapstar</div>
              <h1 style="font-size:20px;margin:0 0 12px;color:#0F172A;">${title}</h1>
              ${bodyHtml}
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  const html = wrapperHtml(
    "Verify your email",
    `<p style="color:#475569;font-size:14px;line-height:1.6;">Confirm your email address to activate your Taptapstar account.</p>
     <p style="margin:24px 0;"><a href="${verifyUrl}" style="background:#1A56E8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Verify email</a></p>
     <p style="color:#94A3B8;font-size:12px;">This link expires in 24 hours. If you didn't create a Taptapstar account, you can ignore this email.</p>`
  );
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Verify your Taptapstar email",
    html,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const html = wrapperHtml(
    "Reset your password",
    `<p style="color:#475569;font-size:14px;line-height:1.6;">We received a request to reset your Taptapstar password.</p>
     <p style="margin:24px 0;"><a href="${resetUrl}" style="background:#1A56E8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Reset password</a></p>
     <p style="color:#94A3B8;font-size:12px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`
  );
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your Taptapstar password",
    html,
  });
}
