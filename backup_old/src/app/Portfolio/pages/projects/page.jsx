"use client";

import Script from 'next/script';

export default function Page() {
  return (
    <>
      <Script src="/Portfolio/assets/js/main.js" strategy="lazyOnload"  />
      <Script src="/Portfolio/assets/js/mobile.js" strategy="lazyOnload"  />
      <Script src="/Portfolio/assets/js/content-loader.js" strategy="lazyOnload"  />
      <Script src="/Portfolio/assets/js/transitions.js" strategy="lazyOnload"  />
      <Script src="/Portfolio/assets/js/gestures.js" strategy="lazyOnload"  />
      <Script src="/Portfolio/assets/js/app.js" strategy="lazyOnload"  />
      <Script src="/Portfolio/assets/js/page-zoom.js" strategy="lazyOnload"  />
      <head dangerouslySetInnerHTML={{ __html: "\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Projects | Anand Dev OS</title>\n  <meta name=\"description\" content=\"Case studies and engineering stories from projects I have built.\">\n  <meta name=\"theme-color\" content=\"#0a0a0b\">\n  <meta name=\"apple-mobile-web-app-capable\" content=\"yes\">\n  <meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black-translucent\">\n  <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n  <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin=\"\">\n  <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap\" rel=\"stylesheet\">\n\n  <link rel=\"stylesheet\" href=\"/Portfolio/assets/css/variables.css\">\n  <link rel=\"stylesheet\" href=\"/Portfolio/assets/css/base.css\">\n  <link rel=\"stylesheet\" href=\"/Portfolio/assets/css/layout.css\">\n  <link rel=\"stylesheet\" href=\"/Portfolio/assets/css/components.css\">\n  <link rel=\"stylesheet\" href=\"/Portfolio/assets/css/animations.css\">\n  <link rel=\"stylesheet\" href=\"/Portfolio/assets/css/responsive.css\">\n  <link rel=\"stylesheet\" href=\"/Portfolio/assets/css/zoom-transitions.css\">\n" }} />
      <div dangerouslySetInnerHTML={{ __html: "\n\n  <nav class=\"nav\">\n    <div class=\"nav__inner\">\n      <a href=\"../../\" class=\"nav__logo\" data-content=\"logo\"></a>\n      <button class=\"nav__toggle\" aria-label=\"Toggle menu\">\n        <span></span>\n        <span></span>\n        <span></span>\n      </button>\n      <div class=\"nav__links\" data-content=\"nav-links\">\n\n      </div>\n    </div>\n  </nav>\n\n  <main style=\"padding-top: var(--space-24);\">\n    <div class=\"container\">\n\n      <header class=\"section-header reveal\">\n        <span class=\"section-header__eyebrow\" data-content=\"projects-eyebrow\"></span>\n        <h1 class=\"section-header__title\" data-content=\"projects-title\"></h1>\n        <p class=\"section-header__description\" data-content=\"projects-description\"></p>\n      </header>\n\n      <div class=\"focus-cards-grid\" data-content=\"all-projects\">\n\n      </div>\n    </div>\n  </main>\n\n  <footer class=\"footer\">\n    <div class=\"container\">\n      <div class=\"footer__inner\">\n        <div class=\"footer__links\" data-content=\"footer-links\">\n\n        </div>\n        <p class=\"footer__copyright\" data-content=\"footer-copyright\"></p>\n      </div>\n    </div>\n  </footer>\n\n  \n  \n\n  \n\n  \n  \n  \n  \n\n\n" }} suppressHydrationWarning />
    </>
  );
}
