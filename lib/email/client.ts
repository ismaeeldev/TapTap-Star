// Email wiring — migrated from Resend to Nodemailer/SMTP (client has no domain yet, so a Resend
// account can't be domain-verified right now; Nodemailer works with any SMTP account/relay the
// client provides, no domain of their own required to at least get real sends out). The Resend
// version is commented out below rather than deleted — switching back is a matter of
// uncommenting this block, restoring the `resend.emails.send(...)` call in
// lib/email/notify.ts's matching comment, and removing the SMTP block, once/if a Resend account
// + verified sending domain exists.
import nodemailer from "nodemailer";

/* ---------------------------------------------------------------------------------------
 * Resend (previous provider, commented out — not deleted)
 * ---------------------------------------------------------------------------------------
import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set — check .env.local");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// Resend's shared sandbox domain — only deliverable to Resend's own approved testing
// addresses without a verified custom domain, which this project doesn't have yet.
export const FROM = "Taptapstar <onboarding@resend.dev>";
 * --------------------------------------------------------------------------------------- */

// Set these in .env.local: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and optionally SMTP_SECURE
// ("true" for port 465, otherwise STARTTLS is used automatically) and SMTP_FROM (defaults below
// if unset). Nothing here throws at import time if they're missing — a missing/broken SMTP
// config must only fail the specific send attempt (logged, same "never fake success" contract
// notify() already relies on), not crash every route that happens to import this module.
export const FROM = process.env.SMTP_FROM || "Taptapstar <no-reply@example.com>";

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (cachedTransporter) return cachedTransporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  // Gmail app passwords are often copied with spaces; strip them so auth stays reliable.
  const pass = (SMTP_PASS ?? "").replace(/\s+/g, "");
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !pass) {
    console.error(
      "[email] SMTP is not configured — set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS in .env.local"
    );
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true" || Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass },
  });
  return cachedTransporter;
}

/** Optional health check — verifies SMTP auth/handshake without sending a message. */
export async function verifySmtp(): Promise<{ ok: true } | { ok: false; message: string }> {
  const transporter = getTransporter();
  if (!transporter) {
    return { ok: false, message: "SMTP is not configured — see .env.local" };
  }
  try {
    await transporter.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
}

export type SendResult = { error: { message: string } | null };

// Single choke point for every outgoing email (notify() and sendPasswordResetEmail both go
// through this) — one place that talks to SMTP, one error shape to check, matching the
// { error } shape the Resend SDK used to return so lib/email/notify.ts didn't need to change its
// own error-handling contract when this file switched providers.
export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<SendResult> {
  const transporter = getTransporter();
  if (!transporter) {
    return { error: { message: "SMTP is not configured — see .env.local" } };
  }

  try {
    await transporter.sendMail({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    return { error: null };
  } catch (err) {
    return { error: { message: err instanceof Error ? err.message : String(err) } };
  }
}

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

// sendVerificationEmail() was migrated to a real React Email component — see
// lib/email/notify.ts's "verification" type / lib/email/templates/VerificationEmail.tsx. Removed
// here so there is only one implementation of this email (Step 9 requirement).

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const html = wrapperHtml(
    "Reset your password",
    `<p style="color:#475569;font-size:14px;line-height:1.6;">We received a request to reset your Taptapstar password.</p>
     <p style="margin:24px 0;"><a href="${resetUrl}" style="background:#1A56E8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Reset password</a></p>
     <p style="color:#94A3B8;font-size:12px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`
  );
  const result = await sendMail({ to, subject: "Reset your Taptapstar password", html });
  if (result.error) {
    console.error("[email] sendPasswordResetEmail failed:", result.error.message);
  }
  return result;
}
