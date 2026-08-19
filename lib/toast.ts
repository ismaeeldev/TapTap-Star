import { toast as sonnerToast } from "sonner";

// Thin wrapper enforcing the exact per-variant timing from
// ../../AgentGuide/01_THEME_GUIDELINE.md section 8.4 — always import `toast` from here, never
// call `sonner`'s `toast` directly, so these durations can't silently drift per call site.
export const toast = {
  success: (message: string, opts?: Parameters<typeof sonnerToast.success>[1]) =>
    sonnerToast.success(message, { duration: 4000, ...opts }),
  error: (message: string, opts?: Parameters<typeof sonnerToast.error>[1]) =>
    // Errors are manual-dismiss only per theme guideline — never auto-hide before the user
    // can read it.
    sonnerToast.error(message, { duration: Infinity, ...opts }),
  warning: (message: string, opts?: Parameters<typeof sonnerToast.warning>[1]) =>
    sonnerToast.warning(message, { duration: 6000, ...opts }),
  info: (message: string, opts?: Parameters<typeof sonnerToast.info>[1]) =>
    sonnerToast.info(message, { duration: 4000, ...opts }),
};
