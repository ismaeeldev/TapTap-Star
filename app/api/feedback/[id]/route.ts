import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { privateFeedback } from "@/lib/db/schema";
import { requireSession, authErrorResponse, AuthError } from "@/lib/auth/rbac";

const patchSchema = z.object({ status: z.enum(["new", "reviewed"]) });

// PATCH /api/feedback/:id — toggle a private-feedback row's reviewed status. The dashboard-side
// "view and manage all private feedback received" requirement — this is the "manage" half (the
// "view" half is a straight server-rendered list, no API needed there).
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const row = await db.query.privateFeedback.findFirst({
      where: eq(privateFeedback.id, id),
    });
    if (!row || row.accountId !== session.user.accountId) {
      throw new AuthError("Forbidden — feedback does not belong to your account", 403);
    }

    const body = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const [updated] = await db
      .update(privateFeedback)
      .set({ status: parsed.data.status })
      .where(eq(privateFeedback.id, id))
      .returning();

    return NextResponse.json({ feedback: updated });
  } catch (err) {
    const { message, status } = authErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
