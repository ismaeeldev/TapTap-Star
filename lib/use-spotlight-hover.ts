"use client";

import { useCallback, type RefObject } from "react";

// Theme guideline section 0.1 — cursor-spotlight hover for marketing/bento/pricing cards
// (desktop only). Create the ref in the consuming component with `useRef` and pass it in here
// (rather than this hook returning its own ref object) — keeps the ref the canonical
// `useRef`-created value at the call site, which is what react-hooks/refs expects when it's
// passed straight to a `ref=` prop. No-ops harmlessly on touch devices since onMouseMove never
// fires there.
export function useSpotlightHover<T extends HTMLElement = HTMLDivElement>(
  elementRef: RefObject<T | null>
) {
  return useCallback(
    (event: React.MouseEvent<T>) => {
      const el = elementRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
      el.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
    },
    [elementRef]
  );
}
