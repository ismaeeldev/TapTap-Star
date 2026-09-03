import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { fontSans, fontMono, fontDisplay } from "@/lib/fonts";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { RouteProgress } from "@/components/shared/route-progress";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegister } from "@/components/shared/service-worker-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taptapstar — Turn every tap into a Google review",
  description:
    "NFC/QR devices and a dashboard to track scans, rank employees, and grow your Google reviews.",
  manifest: "/manifest.webmanifest",
  // Safari/iOS has no web app manifest install support — these meta tags + apple-touch-icon are
  // the actual mechanism "Add to Home Screen" uses to name/icon the installed app there
  // (PWA standard §6, §28's Safari row). Chromium reads the manifest instead and ignores these.
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Taptapstar",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

// theme_color as a <meta> tag (not just the manifest) is what Chromium actually uses to color the
// address bar / title bar in browser tabs and standalone windows before/without installation.
export const viewport: Viewport = {
  themeColor: "#1a56e8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontMono.variable} ${fontDisplay.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-bg-page text-text-primary">
        <ThemeProvider>
          <Suspense fallback={null}>
            <RouteProgress />
          </Suspense>
          {children}
          <Toaster />
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
