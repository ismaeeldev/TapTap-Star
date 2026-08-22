import { ImageResponse } from "next/og";

// Favicon mirrors the in-app logo mark (gradient rounded square, tap-ripple + star).
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          background: "linear-gradient(135deg, #1a56e8 0%, #14b8a6 100%)",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
          <path
            d="M11 20c0-2.2 1-4.2 2.6-5.5M8.5 20c0-3.4 1.6-6.4 4.1-8.3"
            stroke="white"
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity="0.95"
          />
          <path
            d="M26.5 12.2l1.35 4.15h4.35l-3.5 2.55 1.35 4.15-3.55-2.55-3.55 2.55 1.35-4.15-3.5-2.55h4.35L26.5 12.2z"
            fill="white"
          />
          <circle cx="14.5" cy="20" r="2.4" fill="white" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
