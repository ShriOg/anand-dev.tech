"use client";

import Script from 'next/script';

export default function Page() {
  return (
    <>
      <Script src="/Portfolio/project/anand-web-os/js/api.js" strategy="lazyOnload"  />
      <Script src="/Portfolio/project/anand-web-os/js/auth.js" strategy="lazyOnload"  />
      <head dangerouslySetInnerHTML={{ __html: "\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Anand Web OS — Login</title>\n  <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n  <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap\" rel=\"stylesheet\">\n  <link rel=\"stylesheet\" href=\"/Portfolio/project/anand-web-os/css/style.css\">\n" }} />
      <div dangerouslySetInnerHTML={{ __html: "\n  <div class=\"auth-bg\"></div>\n  <div class=\"auth-card\">\n    <div class=\"auth-logo\">\n      <h1>Anand <span>Web OS</span></h1>\n      <p>Sign in to your workspace</p>\n    </div>\n    <div id=\"authError\" class=\"auth-error\"></div>\n    <form id=\"loginForm\" class=\"auth-form\" autocomplete=\"off\">\n      <div class=\"form-group\">\n        <label for=\"email\">Email</label>\n        <input type=\"email\" id=\"email\" placeholder=\"you@example.com\" required=\"\">\n      </div>\n      <div class=\"form-group\">\n        <label for=\"password\">Password</label>\n        <input type=\"password\" id=\"password\" placeholder=\"Enter password\" required=\"\">\n      </div>\n      <button type=\"submit\" class=\"btn btn-primary\" id=\"loginBtn\">Sign In</button>\n    </form>\n    <div class=\"auth-footer\">\n      Don't have an account? <a href=\"register.html\">Create one</a>\n    </div>\n  </div>\n  \n  \n\n\n" }} suppressHydrationWarning />
    </>
  );
}
