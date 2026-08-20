"use client";

import { useCallback } from "react";

// Theme guideline section 0.1 — cursor-spotlight hover on bento/feature/pricing cards, desktop
// only (`pointer: fine`). Sets the `--spot-x`/`--spot-y` CSS custom properties the `.spotlight`
// utility (app/globals.css) reads to position its radial-gradient mask. Mobile/touch devices
// never fire mousemove in a way that matters here, so no extra guard is needed beyond the CSS
// utility itself only being visually meaningful on hover-capable pointers.
export function useSpotlightHover<T extends HTMLElement>() {
  const onMouseMove = useCallback((e: React.MouseEvent<T>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  }, []);

  return { onMouseMove };
}
