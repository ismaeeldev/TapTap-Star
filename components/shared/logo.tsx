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
// Both public/logo.png and public/logo_dark.png as originally supplied had transparent padding
// baked into their canvases, and NOT the same amount — logo_dark.png's visible text filled only
// ~48% of its own canvas height (fixed in an earlier round via sharp's `.trim()`), but logo.png
// still had ~9% left/right padding of its own, never trimmed until now (Modifications 5 PDF:
// client reported the logo "still not centered" and "both logos are placed in different position
// and are of different size" — a real, confirmed regression of an earlier fix that only trimmed
// one of the two files). Both are now trimmed to their actual glyph content, edge to edge.
//
// Even after trimming, the two source wordmarks' own artwork isn't pixel-identical in aspect
// ratio (5.71 vs 5.85) — close, but not exact. Earlier this used `object-left` inside a fixed-
// width wrapper, which meant any leftover letterboxing from `object-contain` pooled entirely on
// the right edge of whichever logo rendered narrower — invisible to a bounding-box measurement
// of the `<img>` element itself (that always reports the fixed wrapper size, not the visible
// glyph pixels inside it), but visibly off-center to a human eye. `object-center` instead
// distributes that residual gap evenly on both sides, so the visible wordmark is always centered
// in its wrapper regardless of which theme's logo is showing.
//
// Swapped via Tailwind's `dark:` variant (both images render, one hidden via CSS) rather than a
// client-side useTheme() check — keeps this a server component with no hydration-mismatch flash
// between server-rendered light and the user's actual saved theme.
//
// Both images are forced to the exact same fixed pixel width (LOGO_WIDTH) rather than letting
// each keep its own natural aspect-ratio width — any parent using `justify-center` (e.g. the
// dashboard sidebar) recenters around the visible child's actual width, so a width mismatch
// between the two logos would visibly shift the whole lockup sideways on every theme toggle.
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
        className="object-contain object-center dark:hidden"
        priority
      />
      <Image
        src="/logo_dark.png"
        alt="Taptapstar"
        fill
        className="hidden object-contain object-center dark:block"
        priority
      />
    </span>
  );
}
