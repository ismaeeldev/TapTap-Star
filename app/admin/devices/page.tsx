import { DevicesSearch } from "@/components/admin/devices-search";

export default async function AdminDevicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 font-display font-semibold text-text-primary">Devices</h1>
        <p className="text-body-sm text-text-muted">
          Every device on the platform, across every account.
        </p>
      </div>
      <DevicesSearch initialStatus={status} />
    </div>
  );
}
