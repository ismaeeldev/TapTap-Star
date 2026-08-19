import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ todo: "api/admin/agency-requests/[id]/reject" });
}
