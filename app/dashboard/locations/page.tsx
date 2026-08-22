import { MapPin } from "lucide-react";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { withDbRetry } from "@/lib/db/retry";
import { locations, scans } from "@/lib/db/schema";
import { EmptyState } from "@/components/shared/empty-state";
import { LocationsAddButton, LocationsList } from "./locations-list";

export default async function LocationsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const accountId = session.user.accountId;

  const { rows, counts } = await withDbRetry("LocationsPage", async () => {
    const rows = await db.query.locations.findMany({
      where: eq(locations.accountId, accountId),
      orderBy: (l, { desc }) => [desc(l.createdAt)],
    });

    const counts = await db
      .select({ locationId: scans.locationId, count: sql<number>`count(*)::int` })
      .from(scans)
      .innerJoin(locations, eq(scans.locationId, locations.id))
      .where(eq(locations.accountId, accountId))
      .groupBy(scans.locationId);

    return { rows, counts };
  });

  const countMap = new Map(counts.map((c) => [c.locationId, c.count]));

  const locationRows = rows.map((l) => ({
    id: l.id,
    name: l.name,
    address: l.address,
    googleReviewUrl: l.googleReviewUrl,
    scanCount: countMap.get(l.id) ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2 font-display font-semibold text-text-primary">Locations</h1>
          <p className="text-body-sm text-text-muted">
            Every business location collecting reviews through Taptapstar.
          </p>
        </div>
      </div>

      {locationRows.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No locations yet"
          description="Add your first location to start assigning devices and employees to it."
          action={<LocationsAddButton />}
        />
      ) : (
        <LocationsList locations={locationRows} />
      )}
    </div>
  );
}
