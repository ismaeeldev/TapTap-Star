// GET /api/admin/support/messages — simple inbox list of contact_messages for /admin/support.
// taptapstar_admin only.
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { requireRole, authErrorResponse } from "@/lib/auth/rbac";

export async function GET() {
  try {
    await requireRole("taptapstar_admin");
    const messages = await db.query.contactMessages.findMany({
      orderBy: (m, { desc }) => [desc(m.createdAt)],
      limit: 100,
    });
    return NextResponse.json({ messages });
  } catch (error) {
    const { message, status } = authErrorResponse(error);
    return NextResponse.json({ message }, { status });
  }
}
