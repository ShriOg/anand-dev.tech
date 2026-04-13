"use client";

import Script from 'next/script';

export default function Page() {
  return (
    <>
      <head dangerouslySetInnerHTML={{ __html: "" }} />
      <div dangerouslySetInnerHTML={{ __html: "<article class=\"focus-card reveal\" id=\"{{id}}\" data-focus-id=\"{{id}}\" data-project-id=\"{{id}}\">\n  <div class=\"focus-card__preview\">\n    <div class=\"focus-card__preview-visual\">\n      <canvas data-preview=\"{{previewType}}\"></canvas>\n    </div>\n  </div>\n  <div class=\"focus-card__body\">\n    <span class=\"focus-card__tag\">{{techStackShort}}</span>\n    <h2 class=\"focus-card__title\">{{title}}</h2>\n    <p class=\"focus-card__description\">{{shortDescription}}</p>\n    <div class=\"focus-card__meta\">\n      <span class=\"focus-card__meta-item\">Timeline: <span>{{timeline}}</span></span>\n      <span class=\"focus-card__meta-item\">Role: <span>{{role}}</span></span>\n    </div>\n    <div class=\"focus-card__actions\">\n      {{liveButton}}\n      {{sourceButton}}\n    </div>\n  </div>\n  <div class=\"focus-card__arrow\">→</div>\n\n  <template class=\"focus-card__content-template\">\n    {{overlayContent}}\n  </template>\n</article>\n" }} suppressHydrationWarning />
    </>
  );
}
