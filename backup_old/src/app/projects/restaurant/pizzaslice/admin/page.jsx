"use client";

import Script from 'next/script';

export default function Page() {
  return (
    <>
      <Script src="/projects/restaurant/pizzaslice/shared/config.js" strategy="lazyOnload"  />
      <Script src="/projects/restaurant/pizzaslice/shared/socket.js" strategy="lazyOnload"  />
      <Script src="/projects/restaurant/pizzaslice/shared/api.js" strategy="lazyOnload"  />
      <Script src="/projects/restaurant/pizzaslice/admin/admin.js" strategy="lazyOnload"  />
      <head dangerouslySetInnerHTML={{ __html: "\n    <meta charset=\"utf-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n    <title>PizzaSlice Admin</title>\n    <link rel=\"icon\" href=\"/projects/restaurant/pizzaslice/favicon.ico\">\n    <link rel=\"stylesheet\" href=\"/projects/restaurant/pizzaslice/admin/admin.css\">\n  " }} />
      <div dangerouslySetInnerHTML={{ __html: "\n    <main class=\"page\">\n      <header class=\"page__header\">\n        <h1>PizzaSlice Admin</h1>\n      </header>\n      <section id=\"admin-root\" class=\"admin-root\" aria-live=\"polite\"></section>\n    </main>\n\n    \n    \n    \n    \n  \n\n" }} suppressHydrationWarning />
    </>
  );
}
