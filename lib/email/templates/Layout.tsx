// Shared React Email layout for every Taptapstar notification template — brand blue #1A56E8,
// wordmark styling per 01_THEME_GUIDELINE.md, migrated from lib/email/client.ts's old
// plain-HTML wrapperHtml() so every Step 9 template shares one visual language.
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

const BRAND = "#1A56E8";

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
            <Text
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: BRAND,
                marginBottom: 8,
              }}
            >
              Taptapstar
            </Text>
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

export function CtaButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Section style={{ margin: "24px 0" }}>
      <a
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
      </a>
    </Section>
  );
}

export function FinePrint({ children }: { children: React.ReactNode }) {
  return <Text style={{ color: "#94A3B8", fontSize: 12 }}>{children}</Text>;
}
