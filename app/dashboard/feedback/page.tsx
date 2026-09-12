import { MessageSquareWarning } from "lucide-react";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { withDbRetry } from "@/lib/db/retry";
import { privateFeedback } from "@/lib/db/schema";
import { EmptyState } from "@/components/shared/empty-state";
import { FeedbackList } from "./feedback-list";

// /dashboard/feedback — review-filtering feature's private-feedback inbox. Client's requirement:
// "View and manage all private feedback received." Reads with()-joined location/device names
// directly (small per-account volume, same reasoning as /api/scans/recent's own comment about
// not needing a wider join for dashboard-scale reads).
export default async function FeedbackPage() {
  const session = await auth();
  if (!session?.user) return null;

  const rows = await withDbRetry("FeedbackPage", () =>
    db.query.privateFeedback.findMany({
      where: eq(privateFeedback.accountId, session.user.accountId),
      with: {
        location: { columns: { name: true } },
        device: { columns: { code: true, employeeId: true }, with: { employee: { columns: { name: true } } } },
      },
      orderBy: [desc(privateFeedback.createdAt)],
      limit: 100,
    })
  );

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={MessageSquareWarning}
        title="No private feedback yet"
        description="When review filtering is on for a location, low-star ratings land here instead of a public review."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 font-display font-semibold text-text-primary">Private feedback</h1>
        <p className="text-body-sm text-text-muted">
          Low-star ratings routed here instead of a public review — never posted publicly.
        </p>
      </div>
      <FeedbackList
        initialRows={rows.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          contactName: r.contactName,
          contactEmail: r.contactEmail,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
          locationName: r.location?.name ?? "Unknown location",
          deviceCode: r.device?.code ?? null,
          employeeName: r.device?.employee?.name ?? null,
          aiReplyStatus: r.aiReplyStatus,
          aiReplyDraft: r.aiReplyDraft,
        }))}
      />
    </div>
  );
}
