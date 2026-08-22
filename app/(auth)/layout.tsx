import Link from "next/link";
import { GradientMesh } from "@/components/shared/gradient-mesh";
import { Logo } from "@/components/shared/logo";

// Shared shell for signup/login/verify-email/forgot-password/reset-password — gradient-mesh
// background (theme guideline §0.1/§0.3: auth screens are an explicit gradient-mesh use case)
// behind a centered glass auth card. Each page supplies only its own card content.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <GradientMesh className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8">
        <Logo className="scale-110" />
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </GradientMesh>
  );
}
