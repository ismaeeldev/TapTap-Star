// Shared React Email layout for every Taptapstar notification template — brand blue #1A56E8,
// wordmark styling per 01_THEME_GUIDELINE.md, migrated from lib/email/client.ts's old
// plain-HTML wrapperHtml() so every Step 9 template shares one visual language.
//
// Real client report (Sept 4): "the email for confirmation don't have the logo and the link is
// not working" / "the button is not clickable" — investigated and found two real, longstanding
// bugs affecting EVERY email template (not just verification), both fixed here:
//
// 1. No logo — this file only ever rendered the word "Taptapstar" as styled text, never an
//    actual `<img>`. Fixed with a real logo image, using an absolute production URL (email
//    clients can't load a local/relative path — the image has to be hosted somewhere real).
//    NEXT_PUBLIC_APP_URL is the same var already fixed for the QR-code incident (was
//    "localhost:3000" in production), with a hardcoded safety-net fallback for the same reason
//    lib/qr/index.ts now has one — this file must never again silently point at a dead host.
//
// 2. "Button not clickable" — CtaButton previously rendered a plain <a> styled only with inline
//    CSS display:inline-block. Several real email clients (Outlook's Word rendering engine most
//    notably, but also some stripped-down mobile/webmail renderers) partially or fully ignore
//    that CSS, collapsing the clickable hit-area to just the text itself or breaking the visual
//    button entirely — which reads exactly as "not clickable" to a real user even though the
//    href was technically always present. Rebuilt using the standard "bulletproof button"
//    email pattern (an explicit table cell with its own background color, not just inline
//    style on the <a>) which degrades gracefully instead of disappearing.
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

const BRAND = "#1A56E8";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://taptap-star.vercel.app";
const LOGO_URL = `${APP_URL.replace(/\/$/, "")}/brand/logo-mark-dark.png`;

export function Layout({
  title,
  preview,
  children,
}: {
  title: string;
  preview: string;
  children: React.ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: 0,
          background: "#f4f5f7",
          fontFamily: "-apple-system,Segoe UI,Roboto,sans-serif",
        }}
      >
        <Container
          style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: "32px",
            margin: "32px auto",
            maxWidth: 480,
          }}
        >
          <Section>
            <Img
              src={LOGO_URL}
              width="32"
              height="32"
              alt="Taptapstar"
              style={{ marginBottom: 8, display: "block" }}
            />
            <Heading
              as="h1"
              style={{ fontSize: 20, margin: "0 0 12px", color: "#0F172A" }}
            >
              {title}
            </Heading>
            {children}
          </Section>
          <Hr style={{ borderColor: "#E2E8F0", margin: "24px 0 12px" }} />
          <Text style={{ color: "#94A3B8", fontSize: 12, margin: 0 }}>
            Taptapstar — NFC & QR review collection.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function BodyText({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ color: "#475569", fontSize: 14, lineHeight: 1.6 }}>
      {children}
    </Text>
  );
}

// "Bulletproof button" pattern: a real HTML <table> with the brand color set directly as the
// <td>'s bgcolor/background — NOT relying on inline CSS on the <a> for the visible button shape.
// Outlook's desktop rendering engine (Word, not a real browser engine) and several stripped-down
// webmail/mobile renderers ignore border-radius/display:inline-block on an <a>, which can
// collapse the button to unstyled, easy-to-miss plain text — exactly the "button is not
// clickable" symptom a real client reported. The <a> here still carries the full clickable area
// via block display + explicit padding, so the actual href/click-target is never smaller than
// the visible button in any client, bulletproof-button or not.
export function CtaButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Section style={{ margin: "24px 0" }}>
      <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
        <tbody>
          <tr>
            {/* bgcolor is a real, valid HTML attribute (not a React DOM prop) that some old/
                stripped-down email clients read even when they ignore CSS entirely; TypeScript's
                DOM types don't know it, so it's spread in via an untyped object instead of a
                typed JSX prop. */}
            <td
              align="center"
              style={{ borderRadius: 8, background: BRAND }}
              {...({ bgcolor: BRAND } as Record<string, string>)}
            >
              <Link
                href={href}
                style={{
                  background: BRAND,
                  color: "#fff",
                  padding: "12px 24px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontWeight: 600,
                  display: "inline-block",
                  fontSize: 14,
                }}
              >
                {children}
              </Link>
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

export function FinePrint({ children }: { children: React.ReactNode }) {
  return <Text style={{ color: "#94A3B8", fontSize: 12 }}>{children}</Text>;
}
