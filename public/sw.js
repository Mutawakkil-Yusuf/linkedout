const CACHE = "linkedout-shell-v2";
// "/" removed from the precache list: navigation requests are now
// always network-first with no cache fallback (see the fetch handler
// below), so precaching it here would be dead weight at best.
const SHELL = [
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-192",
  "/icon-512",
  "/apple-icon",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Navigation requests (HTML page loads, e.g. "/", "/login", "/rooms")
// are NEVER cached or served from cache. These carry auth state (via
// cookies checked by middleware), so caching them risks showing a
// stale signed-out landing page even after a successful sign-in —
// which is exactly the bug this fixed. Always hit the network for
// these; if the device is truly offline, show a minimal offline
// fallback instead of a stale shell that could misrepresent auth state.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response(
            "<!doctype html><meta charset=utf-8><title>Offline</title><body style='font-family:system-ui;padding:2rem'><p>You're offline. Reconnect and reload.</p>",
            { headers: { "Content-Type": "text/html" } }
          )
      )
    );
    return;
  }

  // Static assets (icons, manifest, etc.): network-first, cached as a
  // fallback for offline use only.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
