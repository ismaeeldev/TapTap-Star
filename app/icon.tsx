import { ImageResponse } from "next/og";

// App Router icon convention — replaces the old static app/favicon.ico. Mirrors
// components/shared/logo.tsx's LogoMark (gradient rounded square, tap-ripple + star) so the
// browser tab icon matches the in-app logo exactly.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <svg
        width={32}
        height={32}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="tts-mark-grad" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1a56e8" />
            <stop offset="1" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="10" fill="url(#tts-mark-grad)" />
        <path
          d="M11 20c0-2.2 1-4.2 2.6-5.5M8.5 20c0-3.4 1.6-6.4 4.1-8.3"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.95"
        />
        <path
          d="M26.5 12.2l1.35 4.15h4.35l-3.5 2.55 1.35 4.15-3.55-2.55-3.55 2.55 1.35-4.15-3.5-2.55h4.35L26.5 12.2z"
          fill="white"
        />
        <circle cx="14.5" cy="20" r="2.25" fill="white" />
      </svg>
    ),
    { ...size }
  );
}
