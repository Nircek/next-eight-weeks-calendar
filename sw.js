const CACHE_VERSION = 2;
const CACHE_NAME = `weekly-calendar-v${CACHE_VERSION}`;
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./dates.js",
  "./text-fit.js",
  "./preview-scale.js",
  "./manifest.json",
  "./icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (k) => k.startsWith("weekly-calendar-v") && k !== CACHE_NAME
          )
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);

      const revalidate = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            return cache.put(event.request, response.clone()).then(() => response);
          }
          return response;
        })
        .catch(() => null);

      if (cached) {
        event.waitUntil(revalidate);
        return cached;
      }

      const fresh = await revalidate;
      return fresh || cached;
    })
  );
});
