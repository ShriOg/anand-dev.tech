"use client";

import Script from 'next/script';

export default function Page() {
  return (
    <>
      <head dangerouslySetInnerHTML={{ __html: "" }} />
      <div dangerouslySetInnerHTML={{ __html: "<section class=\"case-study-hero\">\n  <div class=\"container\">\n    <span class=\"case-study-hero__badge\">\n      <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" width=\"16\" height=\"16\">\n        <path d=\"M22 11.08V12a10 10 0 1 1-5.93-9.14\"></path>\n        <polyline points=\"22 4 12 14.01 9 11.01\"></polyline>\n      </svg>\n      {{badge}}\n    </span>\n    <h1 class=\"case-study-hero__title\">{{title}}</h1>\n    <p class=\"case-study-hero__subtitle\">{{subtitle}}</p>\n    <div class=\"case-study-hero__actions\">\n      {{actionButtons}}\n    </div>\n  </div>\n</section>\n\n<section class=\"case-study-content\">\n  <div class=\"container\">\n    {{sections}}\n\n    <div class=\"case-study-section\">\n      <h2 class=\"case-study-section__title\">Tech Stack</h2>\n      <div class=\"tech-stack\">\n        {{techStack}}\n      </div>\n    </div>\n  </div>\n</section>\n" }} suppressHydrationWarning />
    </>
  );
}
