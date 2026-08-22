const CACHE = "history-bee-v2";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];
// The HTML shell carries the question bank inline, so it must always be
// fetched fresh when online -- a stale-while-revalidate cache here means a
// content update can silently sit one visit behind. Static assets (icons,
// manifest) rarely change, so those stay cache-first for offline speed.
const NETWORK_FIRST = new Set(["./", "./index.html"]);

function requestKey(request) {
  const url = new URL(request.url);
  const path = url.pathname.endsWith("/") ? "./" : "." + url.pathname.replace(/^\/[^/]*\//, "/");
  return path;
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const isNavigation = event.request.mode === "navigate";
  const networkFirst = isNavigation || NETWORK_FIRST.has(requestKey(event.request));

  if (networkFirst) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
