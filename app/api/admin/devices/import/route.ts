// POST /api/admin/devices/import — Import from CSV mode of /admin/devices/batch-create.
// taptapstar_admin only. Accepts raw CSV/pasted text where each row is expected to contain a
// `.../r/{code}` URL (the real production format, see lib/qr/parseClaimUrlRow). Same
// no-real-transaction reasoning as app/api/admin/devices/batch/route.ts (Neon HTTP driver) — rows
// are validated/deduped against the DB in one batch query first, then inserted one at a time, and
// the response reports exactly how many were imported/skipped/rejected rather than an all-or-
// nothing guarantee this driver can't provide. This also makes a re-run of the exact same file
// naturally idempotent: every code already in the DB is reported as "skipped as duplicate", 0
// newly imported.
import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { devices, auditLogs } from "@/lib/db/schema";
import { requireRole, authErrorResponse } from "@/lib/auth/rbac";
import { batchImportSchema } from "@/lib/validation";
import { parseClaimUrlRow, buildClaimUrl, generateQrDataUrl } from "@/lib/qr";

export async function POST(req: Request) {
  try {
    const session = await requireRole("taptapstar_admin");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }
    const parsed = batchImportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const lines = parsed.data.csvText.split(/\r?\n/);
    const malformed: string[] = [];
    const candidateCodes: string[] = [];
    const seenInFile = new Set<string>();
    let duplicateWithinFile = 0;

    let isFirstNonEmptyLine = true;
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      // Tolerate a CSV header row (e.g. "url", "claim_url", "code", "qr_url" — the real
      // production file's actual header column name) without treating it as malformed data.
      // Deliberately scoped to ONLY the first non-empty line, not any bare-word line anywhere in
      // the file — a header can appear in many spellings, but a genuinely malformed data row
      // appearing later (not on line 1) must still be counted/reported as rejected, not silently
      // swallowed by a loose "any single word" match.
      if (isFirstNonEmptyLine) {
        isFirstNonEmptyLine = false;
        if (/^[A-Za-z0-9_-]+$/.test(line) && !parseClaimUrlRow(line)) continue;
      }

      const code = parseClaimUrlRow(line);
      if (!code) {
        malformed.push(line);
        continue;
      }
      if (seenInFile.has(code)) {
        duplicateWithinFile++;
        continue;
      }
      seenInFile.add(code);
      candidateCodes.push(code);
    }

    // One batch query to find which candidate codes already exist — never N+1 queries.
    const existing =
      candidateCodes.length > 0
        ? await db.query.devices.findMany({
            where: inArray(devices.code, candidateCodes),
            columns: { code: true },
          })
        : [];
    const existingSet = new Set(existing.map((d) => d.code));

    let importedCount = 0;
    let skippedDuplicateCount = duplicateWithinFile + existing.length;
    const rejectedInsertErrors: { code: string; reason: string }[] = [];

    for (const code of candidateCodes) {
      if (existingSet.has(code)) continue; // already reported above
      try {
        const claimUrl = buildClaimUrl(code);
        const qrImageUrl = await generateQrDataUrl(claimUrl);
        await db.insert(devices).values({
          code,
          type: "card", // CSV rows only carry a code, no physical type — "card" is the most
          // common device type and a reasonable v1 default (documented choice — the reference
          // CSV format doesn't specify a per-row type).
          status: "unassigned",
          source: "imported",
          qrImageUrl,
        });
        importedCount++;
      } catch (err) {
        // A race against another concurrent import (or a genuine DB error) — this row is
        // reported as rejected, not silently dropped, and doesn't abort the rest of the batch.
        const message = err instanceof Error ? err.message : String(err);
        if (message.toLowerCase().includes("unique")) {
          skippedDuplicateCount++;
        } else {
          rejectedInsertErrors.push({ code, reason: message });
        }
      }
    }

    const summary = {
      totalRows: candidateCodes.length + malformed.length + duplicateWithinFile,
      importedCount,
      skippedDuplicateCount,
      rejectedCount: malformed.length + rejectedInsertErrors.length,
      malformedRows: malformed,
      rejectedInsertErrors,
    };

    await db.insert(auditLogs).values({
      actorUserId: session.user.id,
      action: "devices_batch_imported",
      targetType: "device_batch",
      targetId: session.user.id,
      metadataJson: summary,
    });

    return NextResponse.json(summary);
  } catch (error) {
    const { message, status } = authErrorResponse(error);
    return NextResponse.json({ message }, { status });
  }
}
