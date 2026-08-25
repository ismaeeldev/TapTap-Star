import Image from "next/image";
import { cn } from "@/lib/utils";

// Client-provided wordmark (public/logo.png). The other client asset, public/favicon.png (the
// "T + star" icon mark), is used ONLY as the actual browser favicon (app/icon.png) — client
// explicitly asked for it to not appear anywhere alongside the logo in the UI anymore. `iconOnly`
// is kept as a no-op prop (existing call sites in dashboard/admin mobile headers still pass it)
// rather than ripping it out everywhere, since there's now just the one wordmark asset to show
// regardless of context.
export function Logo({
  className,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src="/logo.png"
        alt="Taptapstar"
        width={168}
        height={28}
        className="h-7 w-auto"
        priority
      />
    </span>
  );
}
