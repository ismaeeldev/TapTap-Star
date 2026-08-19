import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientMesh } from "@/components/shared/gradient-mesh";
import { Logo } from "@/components/shared/logo";

// Marketing/public 404 per ../../AgentGuide/01_THEME_GUIDELINE.md section 8.3 — gradient-mesh
// background, branded illustration, not a generic numeral graphic.
export default function NotFound() {
  return (
    <GradientMesh className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <div className="flex size-16 items-center justify-center rounded-full bg-brand-subtle text-brand">
        <Compass className="size-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-display-md font-display font-bold text-text-primary">
          This page took a wrong turn
        </h1>
        <p className="max-w-md text-body text-text-secondary">
          We couldn&apos;t find what you were looking for. It may have moved, or the link might
          be off by a character.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Take me home</Link>
      </Button>
    </GradientMesh>
  );
}
