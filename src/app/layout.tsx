import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { HUDCursor } from "@/components/cursor/HUDCursor";
import { SFXToggle } from "@/components/audio/SFXToggle";
import { SpectrumCanvas } from "@/components/hero/SpectrumCanvas";
import { ScrollProgress } from "@/components/ui/ScrollProgress";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "600", "900"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anand Shukla — Builder, Founder, Developer",
  description:
    "A Class 11 student who builds things that shouldn't exist yet. Founder of MenuNova. Creator of Nova Companion. Real products from ideas.",
  openGraph: {
    title: "Anand Shukla — Builder, Founder, Developer",
    description: "A Class 11 student who builds things that shouldn't exist yet.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* JetBrains Mono — terminal/label font */}
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.variable} suppressHydrationWarning>
        {/* WebGL Fluid Background */}
        <SpectrumCanvas />

        {/* Vertical Rainbow Scroll Progress Indicator */}
        <ScrollProgress />

        {/* Dot grid — fixed behind content */}
        <div
          className="bg-dot-grid"
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
            opacity: 0.4,
          }}
        />

        <a
          href="#main-content"
          className="skip-to-content"
        >
          Skip to content
        </a>

        {/* HUD Cursor — desktop only */}
        <HUDCursor />

        {/* SFX toggle — top-right */}
        <SFXToggle />

        {/* Main content */}
        <main id="main-content" style={{ position: "relative", zIndex: 1 }}>
          {children}
        </main>
      </body>
    </html>
  );
}
