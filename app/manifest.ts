import type { MetadataRoute } from "next";

// PWA manifest — Next.js App Router file convention, served at /manifest.webmanifest with the
// correct content type automatically. `id` is deliberately stable ("/") and must never change
// between releases (PWA standard §6) — it's the installed app's persistent identity, separate
// from analytics params or route changes.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Taptapstar",
    short_name: "Taptapstar",
    description:
      "NFC/QR devices and a dashboard to track scans, rank employees, and grow your Google reviews.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    // Matches the light-theme --bg-page / --brand tokens (app/globals.css) — the installed
    // window/splash background and OS theming should match the app's own light surface, since
    // display: standalone has no way to know the user's in-app dark-mode preference before load.
    background_color: "#ffffff",
    theme_color: "#1a56e8",
    lang: "en",
    dir: "ltr",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
