// Device code + QR image generation — Step 10 (../../AgentGuide/05_MASTER_BUILD_GUIDE.md
// "STEP 10 — Internal").
//
// QR image storage decision (documented per the master prompt's "your call, just make it real"
// allowance): QR images are generated as base64 data: URLs (via `qrcode`'s `toDataURL`) and
// stored directly in `devices.qr_image_url` (a `text` column, already wide enough for a data
// URL). No object-storage bucket (S3/R2/Vercel Blob) exists anywhere else in this project, and
// standing one up just for this would be new infrastructure for a single column — a data URL is
// self-contained, works immediately in an <img src> or a CSV cell, and needs no new env vars/
// dependencies. Trade-off accepted: ~1-3KB of DB storage per device row. Revisit only if a
// future step needs to serve these images at very high volume/CDN-cached.
import QRCode from "qrcode";
import { customAlphabet } from "nanoid";

// Unambiguous, URL-safe alphabet — deliberately excludes visually-confusable characters
// (0/O, 1/I/l) since these codes get printed on physical NFC/QR devices and may be manually
// typed/read by a customer support agent troubleshooting a device.
const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const CODE_LENGTH = 10;

const generateCode = customAlphabet(CODE_ALPHABET, CODE_LENGTH);

/** Generates a single cryptographically-random-safe short device code (nanoid, not sequential). */
export function generateDeviceCode(): string {
  return generateCode();
}

/** Generates `count` unique codes (unique within the returned batch — DB-uniqueness is still
 * verified/enforced at insert time by the caller, since a collision against ALREADY-EXISTING
 * devices can't be ruled out from in-memory generation alone). */
export function generateDeviceCodes(count: number): string[] {
  const codes = new Set<string>();
  while (codes.size < count) {
    codes.add(generateCode());
  }
  return Array.from(codes);
}

/** Builds the public claim URL for a device code, `${NEXT_PUBLIC_APP_URL}/r/{code}` — this is a
 * printed/exported artifact (QR image, CSV column), not a live-request redirect target, so
 * (unlike app/r/[code]/route.ts's internal redirects) using the configured public app URL here
 * is correct, not the same-app-origin mistake documented in the regression watchlist. */
export function buildClaimUrl(code: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://taptapstar.com";
  return `${base.replace(/\/$/, "")}/r/${code}`;
}

/** Generates a QR code image (PNG) for a URL as a base64 data: URL. */
export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 300,
  });
}

/** Parses a single CSV/pasted-text row expected to be `https://taptapstar.com/r/{code}` (or any
 * host — only the `/r/{code}` path shape is validated, per the import spec) and returns the
 * extracted code, or null if the row doesn't match the expected shape. */
export function parseClaimUrlRow(rawLine: string): string | null {
  const line = rawLine.trim();
  if (!line) return null;
  const match = line.match(/\/r\/([A-Za-z0-9_-]{4,64})\/?$/);
  if (!match) return null;
  return match[1];
}
