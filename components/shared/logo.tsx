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
// public/logo_dark.png as originally supplied had a huge amount of transparent padding baked
// into its canvas (its visible text only filled ~48% of the image's height, vs. ~95% for
// logo.png) — both were rendered at the same fixed CSS height, so the dark-mode logo's actual
// text came out roughly half the size everywhere it appeared (navbar, footer, dashboard, admin
// — every place this shared component renders). Fixed by trimming the source file's transparent
// padding (sharp's `.trim()`) rather than compensating with a larger className size, since that
// would have just meant guessing a different fudge-factor per surface instead of fixing the
// actual mismatch once at the source.
//
// Swapped via Tailwind's `dark:` variant (both images render, one hidden via CSS) rather than a
// client-side useTheme() check — keeps this a server component with no hydration-mismatch flash
// between server-rendered light and the user's actual saved theme.
//
// Both images are forced to the exact same fixed pixel width (LOGO_WIDTH) rather than letting
// each keep its own natural aspect-ratio width (168px vs 164px, close but not identical) —
// client-reported bug: any parent using `justify-center` (e.g. the dashboard sidebar) recenters
// around the visible child's actual width, so a ~4px width difference between the two logos
// made the whole lockup visibly shift a few pixels sideways on every theme toggle. Pinning both
// to one identical width (with `object-contain` so neither image distorts) makes the toggle
// truly zero-layout-shift instead of approximately so.
const LOGO_WIDTH = 166;
const LOGO_HEIGHT = 28;

export function Logo({
  className,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  return (
    <span
      className={cn("relative inline-block", className)}
      style={{ width: LOGO_WIDTH, height: LOGO_HEIGHT }}
    >
      <Image
        src="/logo.png"
        alt="Taptapstar"
        fill
        className="object-contain object-left dark:hidden"
        priority
      />
      <Image
        src="/logo_dark.png"
        alt="Taptapstar"
        fill
        className="hidden object-contain object-left dark:block"
        priority
      />
    </span>
  );
}
