import './globals.css';
import Script from 'next/script';

export const metadata = {
  title: 'anand.dev — Building Systems. Not Just Websites.',
  description: 'Premium developer portfolio showcasing Web OS, Domain Battle, and innovative projects.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div id="particleField" aria-hidden="true"></div>

        <div className="env-light" aria-hidden="true">
            <div className="env-light__halo" id="envHalo"></div>
            <div className="env-light__glow" id="envGlow"></div>
            <div className="env-light__core" id="envCore"></div>
        </div>

        <div className="atmosphere" aria-hidden="true">
            <div className="atmosphere__gradient" id="atmGradient"></div>
            <div className="atmosphere__ambient atmosphere__ambient--1"></div>
            <div className="atmosphere__ambient atmosphere__ambient--2"></div>
            <div className="atmosphere__ambient atmosphere__ambient--3"></div>
            <canvas className="atmosphere__grain" id="atmGrain"></canvas>
        </div>

        <main className="container">
          {children}
        </main>

        <Script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" strategy="beforeInteractive" />
        <Script src="/script.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
