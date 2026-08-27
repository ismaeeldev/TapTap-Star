// Client-requested (Modifications 3 PDF, item 1): "Agency access is not a setting, is an option
// for some clients, so I don't think that this should be in Settings." — the AgencyRequestPanel
// block that used to live here has moved to its own dedicated /dashboard/agency page/nav item
// (see app/dashboard/agency/page.tsx and dashboard-nav.tsx).
export default async function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-h2 font-display font-semibold text-text-primary">Settings</h1>
        <p className="text-body-sm text-text-muted">Account preferences and access.</p>
      </div>

      <div className="rounded-lg border border-border-default bg-bg-card p-6">
        <p className="text-body-sm text-text-muted">
          More account preferences are coming here soon.
        </p>
      </div>
    </div>
  );
}
