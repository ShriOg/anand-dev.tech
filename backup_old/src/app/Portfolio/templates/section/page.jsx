"use client";

import Script from 'next/script';

export default function Page() {
  return (
    <>
      <head dangerouslySetInnerHTML={{ __html: "" }} />
      <div dangerouslySetInnerHTML={{ __html: "<section class=\"case-study-section\">\n  <h2 class=\"case-study-section__title\">{{title}}</h2>\n  <div class=\"case-study-text\">\n    {{content}}\n  </div>\n</section>\n" }} suppressHydrationWarning />
    </>
  );
}
