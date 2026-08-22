"use client";

import * as React from "react";
import Link from "next/link";
import { useScroll, useMotionValueEvent, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
];

// Theme guideline section 4's "Navbar (marketing)" spec: transparent-over-hero at the top of the
// page, then a glass card (backdrop-blur-xl + hairline border, section 0.3) once the user scrolls
// past the hero — never a flat solid fill on scroll.
export function MarketingNavbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 24);
  });

  return (
    // Outer padding (not margin on the bar) keeps mx-auto centering stable when the glass
    // pill appears — swapping mx-auto for md:mx-6 used to shove the bar off-center.
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-[padding] duration-300",
        scrolled && "px-3 md:px-6"
      )}
    >
      <motion.div
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between px-6 py-4 transition-all duration-300 md:px-8",
          scrolled &&
            "mt-3 rounded-full border border-white/12 bg-bg-card/70 shadow-md backdrop-blur-xl dark:border-white/8 dark:bg-bg-card/40"
        )}
      >
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-body-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Get started</Link>
          </Button>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="flex size-11 items-center justify-center rounded-md text-text-primary"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </motion.div>

      {mobileOpen && (
        <div className="mx-4 mt-2 flex flex-col gap-1 rounded-lg border border-white/12 bg-bg-card/90 p-4 shadow-lg backdrop-blur-xl md:hidden">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-3 text-body font-medium text-text-secondary hover:bg-bg-muted hover:text-text-primary"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-border-default pt-3">
            <Button asChild variant="secondary" onClick={() => setMobileOpen(false)}>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild onClick={() => setMobileOpen(false)}>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
