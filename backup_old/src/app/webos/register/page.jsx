"use client";

import Script from 'next/script';

export default function Page() {
  return (
    <>
      <Script src="/webos/js/config.js" strategy="lazyOnload"  />
      <Script src="/webos/js/api.js?v=2" strategy="lazyOnload"  />
      <Script src="/webos/js/auth.js?v=2" strategy="lazyOnload"  />
      <head dangerouslySetInnerHTML={{ __html: "\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Anand Web OS — Register</title>\n  <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n  <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap\" rel=\"stylesheet\">\n  <link rel=\"stylesheet\" href=\"/webos/css/style.css\">\n" }} />
      <div dangerouslySetInnerHTML={{ __html: "\n  <div class=\"auth-bg\"></div>\n  <div class=\"auth-card\">\n    <div class=\"auth-logo\">\n      <h1>Anand <span>Web OS</span></h1>\n      <p>Create your account</p>\n    </div>\n    <div id=\"authError\" class=\"auth-error\"></div>\n    <form id=\"registerForm\" class=\"auth-form\" autocomplete=\"off\">\n      <div class=\"form-group\">\n        <label for=\"username\">Username</label>\n        <input type=\"text\" id=\"username\" placeholder=\"Choose a username\" required=\"\">\n      </div>\n      <div class=\"form-group\">\n        <label for=\"email\">Email</label>\n        <input type=\"email\" id=\"email\" placeholder=\"you@example.com\" required=\"\">\n      </div>\n      <div class=\"form-group\">\n        <label for=\"password\">Password</label>\n        <input type=\"password\" id=\"password\" placeholder=\"Min 6 characters\" required=\"\" minlength=\"6\">\n      </div>\n      <button type=\"submit\" class=\"btn btn-primary\" id=\"registerBtn\">Create Account</button>\n    </form>\n    <div class=\"auth-footer\">\n      Already have an account? <a href=\"../login/\">Sign in</a>\n    </div>\n  </div>\n  \n  \n  \n\n\n" }} suppressHydrationWarning />
    </>
  );
}
