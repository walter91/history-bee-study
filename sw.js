const CACHE = "history-bee-v3";
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
    // cache: "no-cache" makes the browser revalidate with GitHub Pages instead
    // of reusing its own HTTP-cached copy (Pages sends max-age=600, which
    // otherwise lets an update sit unseen for up to 10 minutes). A navigation
    // Request can't be re-initialised, so fetch by URL.
    const fresh = isNavigation
      ? fetch(event.request.url, { cache: "no-cache", credentials: "same-origin" })
      : fetch(event.request, { cache: "no-cache" });
    event.respondWith(
      fresh
        .then((response) => (response.redirected ? fetch(event.request) : response))
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
