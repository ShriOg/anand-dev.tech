"use client";

import Script from 'next/script';

export default function Page() {
  return (
    <>
      <Script src="/Portfolio/templates/{{basePath}}assets/js/main.js" strategy="lazyOnload"  />
      <Script src="/Portfolio/templates/{{basePath}}assets/js/mobile.js" strategy="lazyOnload"  />
      <Script src="/Portfolio/templates/{{basePath}}assets/js/content-loader.js" strategy="lazyOnload"  />
      <Script src="/Portfolio/templates/{{basePath}}assets/js/transitions.js" strategy="lazyOnload"  />
      <Script src="/Portfolio/templates/{{basePath}}assets/js/gestures.js" strategy="lazyOnload"  />
      <Script src="/Portfolio/templates/{{basePath}}assets/js/app.js" strategy="lazyOnload"  />
      <head dangerouslySetInnerHTML={{ __html: "\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>{{title}} | Anand Dev OS</title>\n  <meta name=\"description\" content=\"{{description}}\">\n  <meta name=\"theme-color\" content=\"#0a0a0b\">\n  <meta name=\"apple-mobile-web-app-capable\" content=\"yes\">\n  <meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black-translucent\">\n\n  <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n  <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin=\"\">\n  <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap\" rel=\"stylesheet\">\n\n  <link rel=\"stylesheet\" href=\"/Portfolio/templates/{{basePath}}assets/css/variables.css\">\n  <link rel=\"stylesheet\" href=\"/Portfolio/templates/{{basePath}}assets/css/base.css\">\n  <link rel=\"stylesheet\" href=\"/Portfolio/templates/{{basePath}}assets/css/layout.css\">\n  <link rel=\"stylesheet\" href=\"/Portfolio/templates/{{basePath}}assets/css/components.css\">\n  <link rel=\"stylesheet\" href=\"/Portfolio/templates/{{basePath}}assets/css/animations.css\">\n  <link rel=\"stylesheet\" href=\"/Portfolio/templates/{{basePath}}assets/css/responsive.css\">\n  <link rel=\"stylesheet\" href=\"/Portfolio/templates/{{basePath}}assets/css/zoom-transitions.css\">\n" }} />
      <div dangerouslySetInnerHTML={{ __html: "\n\n  {{navigation}}\n\n  <main>\n    {{content}}\n  </main>\n\n  {{footer}}\n\n  \n  \n\n  \n\n  \n  \n  \n\n\n" }} suppressHydrationWarning />
    </>
  );
}
