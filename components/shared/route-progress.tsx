"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

// Global top-of-page route-transition bar per
// ../../AgentGuide/01_THEME_GUIDELINE.md section 8.1 — mounted once in the root layout.
// Pseudo-progress tied to pathname/search-param changes (the App Router doesn't expose a
// real navigation-start/navigation-end event), same pattern used by most App Router apps.
export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Deferred via setTimeout(0) rather than calling setState synchronously in the effect
    // body, to satisfy react-hooks/set-state-in-effect.
    const start = setTimeout(() => {
      setVisible(true);
      setProgress(20);
    }, 0);
    const grow = setTimeout(() => setProgress(70), 80);
    const finish = setTimeout(() => {
      setProgress(100);
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 200);
    }, 260);

    return () => {
      clearTimeout(start);
      clearTimeout(grow);
      clearTimeout(finish);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pathname, searchParams]);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "fixed top-0 left-0 z-50 h-[3px] bg-brand transition-all duration-300 ease-out motion-reduce:transition-none",
        visible ? "opacity-100" : "opacity-0"
      )}
      style={{ width: `${progress}%` }}
    />
  );
}
