import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

const HIGHLIGHTS = [
  "NFC + QR devices that open your Google review page",
  "Live scan analytics and employee leaderboards",
  "One plan — everything included",
];

// Shared shell for signup/login/verify-email/forgot-password/reset-password.
// Split brand panel + form on desktop; stacked mesh + glass card on mobile.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-svh bg-bg-page">
      <div className="absolute right-4 top-4 z-20 md:right-6 md:top-6">
        <ThemeToggle />
      </div>

      <div className="grid min-h-svh lg:grid-cols-2">
        <aside className="gradient-mesh relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-12 xl:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />

          <Link href="/" className="relative z-10 w-fit">
            <Logo className="scale-110" />
          </Link>

          <div className="relative z-10 max-w-lg">
            <p className="font-display text-display-md font-bold tracking-tight text-text-primary xl:text-display-lg">
              Turn every tap into a{" "}
              <span className="gradient-text">Google review</span>
            </p>
            <p className="mt-4 text-body text-text-secondary">
              The dashboard for scans, rankings, and growth — built for teams that want more
              five-star reviews without more busywork.
            </p>
            <ul className="mt-10 space-y-4">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-body-sm text-text-secondary">
                  <span
                    aria-hidden
                    className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand"
                  >
                    <svg viewBox="0 0 16 16" className="size-3" fill="none" aria-hidden>
                      <path
                        d="M3.5 8.5 6.5 11.5 12.5 4.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative z-10 text-caption text-text-muted">
            Trusted by teams growing reviews with every tap.
          </p>
        </aside>

        <div className="relative flex flex-col justify-center px-4 py-12 sm:px-8">
          <div
            aria-hidden
            className="gradient-mesh pointer-events-none absolute inset-0 opacity-70 lg:hidden"
          />
          <div className="relative z-10 mx-auto w-full max-w-md">
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
