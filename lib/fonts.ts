// Font setup per ../../AgentGuide/01_THEME_GUIDELINE.md section 2.
// Clash Display is self-hosted (next/font/local) from an already-licensed local file — see
// the theme guideline for the source path and licensing note. Inter and JetBrains Mono are
// pulled via next/font/google (self-hosted at build time either way, no runtime CDN request).
import { Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";

export const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const fontDisplay = localFont({
  src: [
    {
      path: "../app/fonts/ClashDisplay/ClashDisplay-Semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../app/fonts/ClashDisplay/ClashDisplay-Bold.woff2",
      weight: "700 800",
      style: "normal",
    },
  ],
  variable: "--font-display",
  display: "swap",
});
