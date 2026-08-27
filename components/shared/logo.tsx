import Image from "next/image";
import { cn } from "@/lib/utils";

// Client-provided wordmarks: public/logo.png (dark text, for light backgrounds) and
// public/logo_dark.png (light text, for dark backgrounds — client flagged the light-mode logo
// as unreadable in dark mode; provided this second asset once it was ready). The other client
// asset, public/favicon.png (the "T + star" icon mark), is used ONLY as the actual browser
// favicon (app/icon.png) — client explicitly asked for it to not appear anywhere alongside the
// logo in the UI anymore. `iconOnly` is kept as a no-op prop (existing call sites in dashboard/
// admin mobile headers still pass it) rather than ripping it out everywhere, since there's just
// the one wordmark (per theme) to show regardless of context.
//
// Swapped via Tailwind's `dark:` variant (both images render, one hidden via CSS) rather than a
// client-side useTheme() check — keeps this a server component with no hydration-mismatch flash
// between server-rendered light and the user's actual saved theme.
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
        className="h-7 w-auto dark:hidden"
        priority
      />
      <Image
        src="/logo_dark.png"
        alt="Taptapstar"
        width={168}
        height={28}
        className="hidden h-7 w-auto dark:block"
        priority
      />
    </span>
  );
}
