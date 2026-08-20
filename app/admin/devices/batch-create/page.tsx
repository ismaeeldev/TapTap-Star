import { BatchCreateForm } from "@/components/admin/batch-create-form";

export default function BatchCreatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 font-display font-semibold text-text-primary">
          Batch-create devices
        </h1>
        <p className="text-body-sm text-text-muted">
          Generate a fresh batch of unique short codes, or import the real production CSV sent by
          the supplier. Every code becomes an <code className="text-caption">unassigned</code>{" "}
          device, ready to be claimed at <code className="text-caption">/claim/[code]</code>.
        </p>
      </div>
      <BatchCreateForm />
    </div>
  );
}
