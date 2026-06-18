import { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: "Nova — AI Companion",
  description: "Your personal AI companion",
  metadataBase: new URL("https://fineshit.anand-dev.tech"),
  manifest: "/manifest.json",
};

export default function NovaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/tokyo-night-dark.min.css" />
      {children}
      <Script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js" strategy="beforeInteractive" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js" strategy="beforeInteractive" />
    </>
  );
}
