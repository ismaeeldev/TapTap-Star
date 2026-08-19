import type { Metadata } from "next";
import { Suspense } from "react";
import { fontSans, fontMono, fontDisplay } from "@/lib/fonts";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { RouteProgress } from "@/components/shared/route-progress";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taptapstar — Turn every tap into a Google review",
  description:
    "NFC/QR devices and a dashboard to track scans, rank employees, and grow your Google reviews.",
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
        </ThemeProvider>
      </body>
    </html>
  );
}
