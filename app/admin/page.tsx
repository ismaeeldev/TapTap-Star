import Link from "next/link";
import { sql, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts, devices, contactMessages } from "@/lib/db/schema";

async function getCounts() {
  const [[accountCount], [deviceCount], [unassignedCount], [pendingAgencyCount], [newMessageCount]] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(accounts),
      db.select({ count: sql<number>`count(*)::int` }).from(devices),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(devices)
        .where(eq(devices.status, "unassigned")),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(accounts)
        .where(eq(accounts.agencyStatus, "pending")),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(contactMessages)
        .where(eq(contactMessages.status, "new")),
    ]);
  return {
    accounts: accountCount.count,
    devices: deviceCount.count,
    unassignedDevices: unassignedCount.count,
    pendingAgencyRequests: pendingAgencyCount.count,
    newMessages: newMessageCount.count,
  };
}

export default async function AdminOverviewPage() {
  const counts = await getCounts();

  const tiles = [
    { label: "Accounts", value: counts.accounts, href: "/admin/accounts" },
    { label: "Devices", value: counts.devices, href: "/admin/devices" },
    { label: "Unassigned devices", value: counts.unassignedDevices, href: "/admin/devices?status=unassigned" },
    { label: "Pending agency requests", value: counts.pendingAgencyRequests, href: "/admin/agency-requests" },
    { label: "New contact messages", value: counts.newMessages, href: "/admin/support" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 font-display font-semibold text-text-primary">Admin overview</h1>
        <p className="text-body-sm text-text-muted">Platform-wide snapshot.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="rounded-lg border border-border-default bg-bg-card p-6 transition-colors hover:border-brand/50"
          >
            <p className="text-body-sm text-text-muted">{t.label}</p>
            <p className="mt-1 text-h1 font-display font-semibold text-text-primary">{t.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
