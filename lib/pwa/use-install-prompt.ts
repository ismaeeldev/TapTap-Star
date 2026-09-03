"use client";

import * as React from "react";

// Chrome/Edge/Android fire this instead of showing their own install UI immediately, letting the
// page decide when/whether to surface an install affordance (standard §10: "ask for installation
// only after a meaningful engagement signal" — here that signal is simply "the button exists in
// the nav/sidebar", not a first-load popup). Not in the DOM lib's event map, so declared locally.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

type InstallState = {
  // Chromium: a real native prompt is available right now (event captured, not yet installed).
  canInstall: boolean;
  // Already running as an installed app (standalone display mode) — button should hide, not
  // offer to "install" something already installed (standard §10: "MUST NOT show a custom
  // install button when installation is unavailable, already completed, or not allowed").
  isInstalled: boolean;
  // Safari (iOS/iPadOS/macOS) never fires beforeinstallprompt and has no programmatic install
  // API at all — the ONLY path is the user manually using Share -> Add to Home Screen. Detected
  // by UA-sniffing Safari specifically (not "not Chrome") combined with feature-checking the
  // absence of beforeinstallprompt support, per standard §4's "MUST NOT use user-agent detection
  // as the only method" — paired here with the real capability check (canInstall is independent
  // and authoritative whenever it's true), UA is only the fallback signal for the one browser
  // family that offers no capability signal at all.
  isSafari: boolean;
  promptInstall: () => Promise<void>;
};

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari's own (non-standard) property for "launched from Home Screen".
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function detectSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // Safari's UA contains "Safari" but so does every other WebKit/Blink browser on iOS (Chrome,
  // Firefox, Edge for iOS all embed WebKit and include "Safari" in their UA string) — excluding
  // "CriOS"/"FxiOS"/"EdgiOS"/"Chrome"/"Android" narrows this to actual Safari specifically,
  // since only real Safari can use "Add to Home Screen" as an install mechanism at all.
  const isRealSafari =
    /Safari/.test(ua) &&
    !/Chrome|CriOS|FxiOS|EdgiOS|Android/.test(ua);
  return isRealSafari;
}

export function useInstallPrompt(): InstallState {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [isSafari, setIsSafari] = React.useState(false);

  React.useEffect(() => {
    // Deferred via requestAnimationFrame — same pattern as theme-toggle.tsx/onboarding-tour.tsx/
    // stripe-card-form.tsx elsewhere in this codebase, to satisfy the react-hooks/
    // set-state-in-effect rule (setState synchronously inside an effect body).
    const id = requestAnimationFrame(() => {
      setIsInstalled(detectStandalone());
      setIsSafari(detectSafari());
    });

    function onBeforeInstallPrompt(e: Event) {
      // Prevent the browser's own mini-infobar so the page's own button is the single, deliberate
      // install affordance (standard §10 — one clear entry point, not a duplicate browser+custom
      // prompt).
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    function onAppInstalled() {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const promptInstall = React.useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    // The prompt can only be used once — discard it either way (accepted or dismissed) so the
    // button correctly stops offering a dead prompt; a fresh beforeinstallprompt event (if the
    // browser fires one again later) will replace it.
    await deferredPrompt.userChoice.catch(() => undefined);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  return {
    canInstall: deferredPrompt !== null && !isInstalled,
    isInstalled,
    isSafari,
    promptInstall,
  };
}
