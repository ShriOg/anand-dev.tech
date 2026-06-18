import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/layout/Navbar";
import { headers } from "next/headers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Anand Shukla | Founder & Developer",
  description: "Futuristic interactive founder portfolio built by a top-tier creative engineer.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const isNova = headersList.get('x-is-nova') === 'true';

  if (isNova) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body suppressHydrationWarning>
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} antialiased bg-zinc-950 text-zinc-50 min-h-screen selection:bg-brand-blue/30 selection:text-white font-sans`} suppressHydrationWarning>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
