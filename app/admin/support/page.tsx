import { db } from "@/lib/db/client";
import { SupportTools } from "@/components/admin/support-tools";

export default async function AdminSupportPage() {
  const messages = await db.query.contactMessages.findMany({
    orderBy: (m, { desc }) => [desc(m.createdAt)],
    limit: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 font-display font-semibold text-text-primary">Support</h1>
        <p className="text-body-sm text-text-muted">
          Force-reassign or unlock a device, apply a billing credit, and review incoming contact
          messages.
        </p>
      </div>
      <SupportTools
        initialMessages={messages.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
