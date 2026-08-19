import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { devices } from "@/lib/db/schema";
import { GradientMesh } from "@/components/shared/gradient-mesh";
import { Logo } from "@/components/shared/logo";
import { PowerOff, SearchX } from "lucide-react";
import { ClaimWizard } from "./claim-wizard";

// /claim/[code] — the device-activation wizard (02_APPLICATION_FLOW.md section 3). Server
// component: resolves the device's real status first so an already-active or deactivated code
// never renders wizard UI — it behaves like a normal end-customer scan or a branded error page
// instead.
export default async function ClaimPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const device = await db.query.devices.findFirst({ where: eq(devices.code, code) });

  if (!device) {
    return (
      <GradientMesh className="flex min-h-svh flex-col items-center justify-center px-4 py-12 text-center">
        <div className="mb-8">
          <Logo />
        </div>
        <div className="flex size-16 items-center justify-center rounded-full bg-brand-subtle text-brand">
          <SearchX className="size-8" />
        </div>
        <h1 className="mt-6 text-h3 font-semibold text-text-primary">This code isn&apos;t recognized</h1>
        <p className="mt-2 max-w-sm text-body-sm text-text-muted">
          We couldn&apos;t find a Taptapstar device for this link. Double-check the QR code or
          NFC tap and try again.
        </p>
      </GradientMesh>
    );
  }

  // Already claimed (by this owner or anyone else) — never show wizard UI for an active device,
  // behave exactly like a normal end-customer scan instead.
  if (device.status === "active") {
    redirect(`/r/${encodeURIComponent(code)}`);
  }

  if (device.status === "deactivated") {
    return (
      <GradientMesh className="flex min-h-svh flex-col items-center justify-center px-4 py-12 text-center">
        <div className="mb-8">
          <Logo />
        </div>
        <div className="flex size-16 items-center justify-center rounded-full bg-brand-subtle text-brand">
          <PowerOff className="size-8" />
        </div>
        <h1 className="mt-6 text-h3 font-semibold text-text-primary">This device is no longer active</h1>
        <p className="mt-2 max-w-sm text-body-sm text-text-muted">
          This Taptapstar device has been deactivated. If you think this is a mistake, please
          contact support.
        </p>
      </GradientMesh>
    );
  }

  // device.status === "unassigned" — auth gate, then the wizard.
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/claim/${code}`)}`);
  }

  return (
    <GradientMesh className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 no-underline">
        <Logo />
      </Link>
      <div className="w-full max-w-lg">
        <ClaimWizard code={code} deviceId={device.id} accountId={session.user.accountId} />
      </div>
    </GradientMesh>
  );
}
