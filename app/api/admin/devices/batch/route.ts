// POST /api/admin/devices/batch — Generate N codes mode of /admin/devices/batch-create.
// taptapstar_admin only. Per 04_PROJECT_STATE.md Step 5's already-documented precedent, the Neon
// serverless HTTP driver does NOT support db.transaction() (it's REST-based, one round-trip per
// query — there is no session/connection to hold a transaction open across statements). Rather
// than claim an all-or-nothing guarantee this driver can't provide, rows are inserted ONE AT A
// TIME inside a try/catch per row: a collision against an existing code (astronomically unlikely
// with a 10-char random alphabet, but not impossible) is caught and that one code is regenerated
// and retried, rather than aborting the whole batch. The response always reports exactly what was
// created, never a fabricated "all N succeeded" when some subset actually failed.
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { devices, auditLogs } from "@/lib/db/schema";
import { requireRole, authErrorResponse } from "@/lib/auth/rbac";
import { batchGenerateSchema } from "@/lib/validation";
import { generateDeviceCode, buildClaimUrl, generateQrDataUrl } from "@/lib/qr";

const MAX_RETRIES_PER_CODE = 5;

export async function POST(req: Request) {
  try {
    const session = await requireRole("taptapstar_admin");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }
    const parsed = batchGenerateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { quantity, deviceType } = parsed.data;

    const created: { code: string; claimUrl: string; qrImageUrl: string }[] = [];
    const failed: { attemptedCode: string; reason: string }[] = [];

    for (let i = 0; i < quantity; i++) {
      let attempt = 0;
      let lastCode = "";
      let ok = false;
      while (attempt < MAX_RETRIES_PER_CODE && !ok) {
        attempt++;
        const code = generateDeviceCode();
        lastCode = code;
        try {
          const claimUrl = buildClaimUrl(code);
          const qrImageUrl = await generateQrDataUrl(claimUrl);
          await db.insert(devices).values({
            code,
            type: deviceType,
            status: "unassigned",
            source: "generated",
            qrImageUrl,
          });
          created.push({ code, claimUrl, qrImageUrl });
          ok = true;
        } catch (err) {
          // Unique-constraint violation on devices.code (extremely rare) — retry with a fresh
          // code. Any other DB error is a genuine failure for this one row, not retried further.
          const message = err instanceof Error ? err.message : String(err);
          if (!message.toLowerCase().includes("unique") || attempt >= MAX_RETRIES_PER_CODE) {
            failed.push({ attemptedCode: lastCode, reason: message });
            break;
          }
        }
      }
    }

    await db.insert(auditLogs).values({
      actorUserId: session.user.id,
      action: "devices_batch_generated",
      targetType: "device_batch",
      // No single row to target — audit_logs.target_id is required (see 04_PROJECT_STATE.md
      // Step 2 re-audit), so this batch-level event points at the acting admin's own user id as
      // the closest meaningful "target" for a bulk generate action with no single row subject.
      targetId: session.user.id,
      metadataJson: {
        requestedQuantity: quantity,
        deviceType,
        createdCount: created.length,
        failedCount: failed.length,
      },
    });

    return NextResponse.json({
      requested: quantity,
      createdCount: created.length,
      failedCount: failed.length,
      devices: created,
      failed,
    });
  } catch (error) {
    const { message, status } = authErrorResponse(error);
    return NextResponse.json({ message }, { status });
  }
}
