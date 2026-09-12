import { toast as sonnerToast } from "sonner";

// Thin wrapper enforcing the exact per-variant timing from
// ../../AgentGuide/01_THEME_GUIDELINE.md section 8.4 — always import `toast` from here, never
// call `sonner`'s `toast` directly, so these durations can't silently drift per call site.
export const toast = {
  success: (message: string, opts?: Parameters<typeof sonnerToast.success>[1]) =>
    sonnerToast.success(message, { duration: 4000, ...opts }),
  error: (message: string, opts?: Parameters<typeof sonnerToast.error>[1]) =>
    // Modifications 8 (client PDF, item 1): "This error messages have unlimited duration, I
    // want it to last 3.5 seconds before disappearing." Previously duration: Infinity
    // (manual-dismiss only, per the original theme guideline) — client's screenshot showed the
    // "Please verify your email before logging in." error sitting on screen indefinitely,
    // which they want auto-dismissed like every other toast variant, just after a slightly
    // longer read window than success/info given errors matter more to actually read.
    sonnerToast.error(message, { duration: 3500, ...opts }),
  warning: (message: string, opts?: Parameters<typeof sonnerToast.warning>[1]) =>
    sonnerToast.warning(message, { duration: 6000, ...opts }),
  info: (message: string, opts?: Parameters<typeof sonnerToast.info>[1]) =>
    sonnerToast.info(message, { duration: 4000, ...opts }),
};
