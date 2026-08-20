import Link from "next/link";
import { Logo } from "@/components/shared/logo";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#features", label: "Features" },
      { href: "/#leaderboard", label: "Employee leaderboard" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/privacy", label: "Privacy policy" },
      { href: "/legal/terms", label: "Terms of service" },
    ],
  },
];

// Plain bg-surface footer, deliberately no gradient-mesh/glass — theme section 0.3 reserves
// those devices for the hero/auth/empty-state contexts only.
export function MarketingFooter() {
  return (
    <footer className="border-t border-border-default bg-bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-body-sm text-text-muted">
              Turn every tap and scan into a real Google review — with the analytics and employee
              gamification to prove it&apos;s working.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">
                {col.title}
              </p>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-body-sm text-text-secondary transition-colors hover:text-text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border-default pt-8 text-body-sm text-text-muted md:flex-row">
          <p>© {new Date().getFullYear()} Taptapstar. All rights reserved.</p>
          <p>Made for businesses who want more Google reviews.</p>
        </div>
      </div>
    </footer>
  );
}
