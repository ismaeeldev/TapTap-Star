import { NextResponse } from "next/server";

export const runtime = "edge";

// TODO (Step 4): look up device by code, branch on status
// (unassigned -> /claim/[code], active -> log scan + 302 to google_review_url,
// deactivated/unknown -> branded page). See 03_DATA_MODEL_AND_ARCHITECTURE.md section 7
// for the Upstash fraud-throttle mechanism this route must implement.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  return NextResponse.json({ todo: "redirect handler", code }, { status: 501 });
}
