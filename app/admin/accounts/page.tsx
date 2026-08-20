import { AccountsSearch } from "@/components/admin/accounts-search";

export default function AdminAccountsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 font-display font-semibold text-text-primary">Accounts</h1>
        <p className="text-body-sm text-text-muted">
          Every business and agency account on the platform. Click a name to drill into its
          businesses/devices/subscription.
        </p>
      </div>
      <AccountsSearch />
    </div>
  );
}
