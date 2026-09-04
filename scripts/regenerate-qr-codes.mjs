// One-time repair script — regenerates every device's stored QR image against the correct
// production URL. Root cause: NEXT_PUBLIC_APP_URL was "localhost:3000" in the live deployment
// when every existing device's QR was generated (checked directly: 410/410 devices decoded to a
// localhost:3000 URL). Fixing the env var alone does not retroactively fix already-generated
// images stored in devices.qr_image_url — this script does that.
//
// Run with: DATABASE_URL="..." node scripts/regenerate-qr-codes.mjs
// Reads the target base URL from PUBLIC_APP_URL_OVERRIDE (falls back to the confirmed real
// production URL) rather than NEXT_PUBLIC_APP_URL, deliberately — this script must not silently
// inherit whatever might still be wrong in the calling shell's env.
import { neon } from "@neondatabase/serverless";
import QRCode from "qrcode";

const BASE_URL = process.env.PUBLIC_APP_URL_OVERRIDE || "https://taptap-star.vercel.app";
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}
if (process.env.CONFIRM !== "yes") {
  console.error(
    "This rewrites devices.qr_image_url for every device. Re-run with CONFIRM=yes to proceed."
  );
  process.exit(1);
}

const sql = neon(DATABASE_URL);

function buildClaimUrl(code) {
  return `${BASE_URL.replace(/\/$/, "")}/r/${code}`;
}

async function main() {
  console.log(`Regenerating QR codes against base URL: ${BASE_URL}`);

  const devices = await sql`select id, code, status from devices`;
  console.log(`Found ${devices.length} devices.`);

  // Active devices first — these are real, in-field, customer-facing stands, highest priority to
  // fix and to verify.
  devices.sort((a, b) => (a.status === "active" ? -1 : 1) - (b.status === "active" ? -1 : 1));

  let updated = 0;
  let failed = 0;
  for (const device of devices) {
    try {
      const claimUrl = buildClaimUrl(device.code);
      const qrImageUrl = await QRCode.toDataURL(claimUrl, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 300,
      });
      await sql`update devices set qr_image_url = ${qrImageUrl} where id = ${device.id}`;
      updated++;
      if (device.status === "active") {
        console.log(`  [active] ${device.code} -> ${claimUrl}`);
      }
    } catch (err) {
      failed++;
      console.error(`  FAILED ${device.code}:`, err.message);
    }
  }

  console.log(`\nDone. Updated ${updated}/${devices.length}, failed ${failed}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
