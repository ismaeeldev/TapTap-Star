import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

// "Trusted by" partner logos deliberately not shown yet — client is sending real client logos to
// use here; do not fill this with placeholder/generic logos in the meantime (explicit "skip for
// now" instruction). Add a real logo row here once those arrive.

// Shared shell for signup/login/verify-email/forgot-password/reset-password.
// Split brand panel + form on desktop; stacked mesh + glass card on mobile.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-svh bg-bg-page">
      <div className="absolute right-4 top-4 z-20 md:right-6 md:top-6">
        <ThemeToggle />
      </div>

      <div className="grid lg:h-svh lg:grid-cols-2">
        <aside className="gradient-mesh relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-center lg:px-12 lg:py-8 xl:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />

          <Link href="/" className="relative z-10 mb-6 w-fit shrink-0 xl:mb-8">
            <Logo className="scale-125 xl:scale-150" />
          </Link>

          {/* Modifications 6 follow-up: image and logo enlarged (client request) to fill the
              panel's previously-empty space instead of floating small in the middle. Still
              capped at a max-width (not the container width) so it can't push the panel taller
              than the viewport on short screens — sized as a fraction of the panel's own height
              (min(...vh)) rather than a fixed rem value, so it grows on tall screens but shrinks
              itself first on short ones instead of pushing the tagline off-screen. */}
          <div className="relative z-10 mx-auto w-fit max-w-[26rem] shrink-0 overflow-hidden rounded-2xl shadow-[0_20px_45px_-18px_var(--brand)] xl:max-w-[30rem]">
            <Image
              src="/login_image.png"
              alt="Physical NFC review cards, each linking straight to a Google review"
              width={1254}
              height={1254}
              className="h-auto w-full max-h-[46svh] object-cover xl:max-h-[50svh]"
              priority
            />
          </div>

          <div className="relative z-10 mt-4 max-w-lg xl:mt-6">
            <p className="font-display text-display-md font-bold tracking-tight text-text-primary xl:text-display-lg">
              Turn every tap into a{" "}
              <span className="gradient-text">Google review</span>
            </p>
          </div>
        </aside>

        {/* Right column scrolls internally on short screens instead of growing the page (which
            would either overflow the viewport or, worse, stretch the fixed-height sidebar past
            it too since they're grid siblings in the same row). min-h-svh only on mobile, where
            the layout stacks and the whole page is expected to scroll normally.
            flex + items on the OUTER column, `my-auto` on the inner card wrapper (not
            justify-center on the column) — margin:auto centers the card when it fits, but
            naturally clamps to the top once content is taller than the column, so overflow
            scrolls down from a visible top edge instead of centering-and-clipping equally off
            both the top AND bottom. That equal-clip was cutting off the "Create your account"
            heading on the longer Premium/Network signup form at common 768px laptop heights even
            though the column itself scrolls — top-anchored means the heading is always the first
            thing visible, never clipped. */}
        <div className="relative flex min-h-svh flex-col overflow-y-auto px-4 py-10 sm:px-8 lg:min-h-0 lg:py-8">
          <div
            aria-hidden
            className="gradient-mesh pointer-events-none absolute inset-0 opacity-70 lg:hidden"
          />
          <div className="relative z-10 mx-auto my-auto w-full max-w-md">
            <Link href="/" className="mb-8 flex justify-center lg:hidden">
              <Logo className="scale-110" />
            </Link>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
