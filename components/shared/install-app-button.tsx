"use client";

import * as React from "react";
import { Download, Share, SquarePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/lib/pwa/use-install-prompt";
import { cn } from "@/lib/utils";

// Dedicated install affordance for the marketing navbar and dashboard sidebar footer (client
// request). Standard §10: hides itself entirely once installed, on genuinely unsupported
// browsers, or before the browser has signaled installability — never shows a button it can't
// honor. Two variants share this one component (and one behavior) rather than duplicating the
// install logic in two places.
export function InstallAppButton({
  variant = "navbar",
  className,
}: {
  variant?: "navbar" | "sidebar";
  className?: string;
}) {
  const { canInstall, isInstalled, isSafari, promptInstall } = useInstallPrompt();
  const [safariDialogOpen, setSafariDialogOpen] = React.useState(false);

  // Nothing to offer: already installed, or neither a real install prompt is available nor is
  // this Safari (which has its own always-available manual path) — e.g. Firefox desktop, which
  // supports neither. Standard §10: "MUST NOT show a custom install button when installation is
  // unavailable, already completed, or not allowed by the platform."
  if (isInstalled || (!canInstall && !isSafari)) return null;

  async function handleClick() {
    if (canInstall) {
      await promptInstall();
      return;
    }
    // Safari has no programmatic prompt at all — the only real path is the user manually using
    // Share -> Add to Home Screen, so the button's job here is just to explain that clearly.
    setSafariDialogOpen(true);
  }

  if (variant === "sidebar") {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md border border-border-default px-3 py-2.5 text-body-sm font-medium text-text-secondary transition-colors hover:border-brand hover:bg-brand-subtle hover:text-brand",
            className
          )}
        >
          <Download className="size-4 shrink-0" />
          Install app
        </button>
        <SafariInstallDialog open={safariDialogOpen} onOpenChange={setSafariDialogOpen} />
      </>
    );
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={handleClick} className={className}>
        <Download className="size-4" />
        Install
      </Button>
      <SafariInstallDialog open={safariDialogOpen} onOpenChange={setSafariDialogOpen} />
    </>
  );
}

function SafariInstallDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Install Taptapstar</DialogTitle>
          <DialogDescription>
            Safari doesn&apos;t support one-tap install — add it to your Home Screen instead, it
            only takes a few seconds.
          </DialogDescription>
        </DialogHeader>
        <ol className="space-y-3 text-body-sm text-text-secondary">
          <li className="flex items-start gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-caption font-semibold text-brand">
              1
            </span>
            <span>
              Tap the Share icon <Share className="inline size-4 align-text-bottom text-text-muted" /> in
              Safari&apos;s toolbar.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-caption font-semibold text-brand">
              2
            </span>
            <span>
              Scroll down and tap{" "}
              <SquarePlus className="inline size-4 align-text-bottom text-text-muted" />{" "}
              <strong className="text-text-primary">Add to Home Screen</strong>.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-caption font-semibold text-brand">
              3
            </span>
            <span>
              Tap <strong className="text-text-primary">Add</strong> — Taptapstar now opens like
              any other app, right from your Home Screen.
            </span>
          </li>
        </ol>
      </DialogContent>
    </Dialog>
  );
}
