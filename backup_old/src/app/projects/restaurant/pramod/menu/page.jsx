"use client";

import Script from 'next/script';

export default function Page() {
  return (
    <>
      <Script src="/projects/restaurant/pramod/shared/config.js" strategy="lazyOnload"  />
      <Script src="/projects/restaurant/pramod/shared/api.js" strategy="lazyOnload"  />
      <Script src="/projects/restaurant/pramod/menu/menu.js" strategy="lazyOnload"  />
      <head dangerouslySetInnerHTML={{ __html: "\n    <meta charset=\"utf-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n    <title>Pramod Menu</title>\n    <link rel=\"icon\" href=\"/projects/restaurant/pramod/favicon.ico\">\n    <link rel=\"stylesheet\" href=\"/projects/restaurant/pramod/menu/menu.css\">\n  " }} />
      <div dangerouslySetInnerHTML={{ __html: "\n    <main class=\"page\">\n      <header class=\"page__header\">\n        <h1>Pramod Menu</h1>\n      </header>\n      <section id=\"menu-root\" class=\"menu-root\" aria-live=\"polite\"></section>\n    </main>\n\n    \n    \n    \n  \n\n" }} suppressHydrationWarning />
    </>
  );
}
