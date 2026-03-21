"use client";

import Script from 'next/script';

export default function Page() {
  return (
    <>
      <Script src="/webos/js/config.js" strategy="lazyOnload"  />
      <Script src="/webos/js/api.js?v=2" strategy="lazyOnload"  />
      <Script src="/webos/js/protect.js?v=2" strategy="lazyOnload"  />
      <Script src="/webos/js/modules/notes.js?v=2" strategy="lazyOnload"  />
      <Script src="/webos/js/modules/files.js?v=2" strategy="lazyOnload"  />
      <Script src="/webos/js/modules/ai.js?v=2" strategy="lazyOnload"  />
      <Script src="/webos/js/modules/admin.js?v=2" strategy="lazyOnload"  />
      <Script src="/webos/js/dashboard.js?v=2" strategy="lazyOnload"  />
      <head dangerouslySetInnerHTML={{ __html: "\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Anand Web OS</title>\n    <link rel=\"stylesheet\" href=\"/webos/css/dashboard.css\">\n" }} />
      <div dangerouslySetInnerHTML={{ __html: "\n    <div class=\"dashboard-container\">\n        <div class=\"top-bar\">\n            <div class=\"top-bar-left\">\n                <div class=\"app-name\">Anand Web OS</div>\n            </div>\n            <div class=\"top-bar-right\">\n                <span class=\"user-email\" id=\"userEmail\"></span>\n                <button class=\"btn-logout\" onclick=\"logout()\">Logout</button>\n            </div>\n        </div>\n\n        <div class=\"main-container\">\n            <div class=\"sidebar\">\n                <div class=\"dock-icon active\" data-module=\"notes\" onclick=\"loadModule('notes')\" title=\"Notes\">\n                    📝\n                </div>\n                <div class=\"dock-icon\" data-module=\"files\" onclick=\"loadModule('files')\" title=\"Files\">\n                    📁\n                </div>\n                <div class=\"dock-icon\" data-module=\"ai\" onclick=\"loadModule('ai')\" title=\"AI Assistant\">\n                    🤖\n                </div>\n                <div class=\"dock-icon\" data-module=\"admin\" onclick=\"loadModule('admin')\" title=\"Admin\">\n                    ⚙️\n                </div>\n            </div>\n\n            <div class=\"workspace\" id=\"workspace\"></div>\n        </div>\n    </div>\n\n    \n    \n    \n    \n    \n    \n    \n    \n\n\n" }} suppressHydrationWarning />
    </>
  );
}
