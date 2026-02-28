const CACHE_NAME = "pf-admin-v1";
const BASE_PATH = "/extrass/admin/";

const STATIC_FILES = [
  BASE_PATH,
  BASE_PATH + "index.html",
  BASE_PATH + "manifest.json",
  BASE_PATH + "css/admin.css",
  BASE_PATH + "js/admin-ui.js",
  BASE_PATH + "js/admin-api.js",
  BASE_PATH + "js/admin-socket.js",
  BASE_PATH + "js/admin-app.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (!event.request.url.includes(BASE_PATH)) return;

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
