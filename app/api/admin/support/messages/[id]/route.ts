// PATCH /api/admin/support/messages/[id] — mark a contact message read/resolved.
// taptapstar_admin only.
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { contactMessages } from "@/lib/db/schema";
import { requireRole, authErrorResponse } from "@/lib/auth/rbac";

const patchSchema = z.object({ status: z.enum(["new", "read", "resolved"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("taptapstar_admin");
    const { id } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const existing = await db.query.contactMessages.findFirst({ where: eq(contactMessages.id, id) });
    if (!existing) {
      return NextResponse.json({ message: "Message not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(contactMessages)
      .set({ status: parsed.data.status })
      .where(eq(contactMessages.id, id))
      .returning();

    return NextResponse.json({ message: updated });
  } catch (error) {
    const { message, status } = authErrorResponse(error);
    return NextResponse.json({ message }, { status });
  }
}
