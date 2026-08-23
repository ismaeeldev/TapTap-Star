import Image from "next/image";
import { cn } from "@/lib/utils";

// Client-provided logo assets (public/favicon.png — the "T + star" icon mark, public/logo.png —
// the "TaptapStar" wordmark) — replaces the earlier generated SVG mark + HTML text version.
// Both are transparent-background PNGs designed to sit on either theme, so unlike the previous
// version this needs no light/dark variant switching (no useTheme, no "use client").
export function Logo({
  className,
  iconOnly = false,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/favicon.png"
        alt={iconOnly ? "Taptapstar" : ""}
        width={36}
        height={36}
        className="size-9 shrink-0"
        priority
      />
      {!iconOnly && (
        <Image
          src="/logo.png"
          alt="Taptapstar"
          width={168}
          height={28}
          className="h-7 w-auto"
          priority
        />
      )}
    </span>
  );
}
