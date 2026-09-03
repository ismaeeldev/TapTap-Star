// Taptapstar service worker — Offline Level 0 per PWA standard §9: app-shell/static-asset
// reliability + a clean offline fallback page. Deliberately does NOT cache dashboard/API/auth
// responses — this is a live billing/analytics SaaS, and showing stale account, subscription, or
// scan data as if current would be actively misleading (standard §8's "authenticated or
// personalized responses" row: network-first, cache only after explicit risk review — the review
// here concluded "don't cache these at all").
//
// Bump CACHE_VERSION on any deploy that changes cached assets or this file's own logic — old
// caches are deleted on activate (§7's "remove obsolete application-managed caches").
const CACHE_VERSION = "v1";
const STATIC_CACHE = `taptapstar-static-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";

// Precached at install: the offline fallback page itself (must always be available offline, or
// the fallback has nothing to fall back to) plus the app's own icons (small, stable, used by the
// offline page and browser UI). Deliberately NOT precaching JS/CSS bundle chunks — Next.js
// content-hashes those per build and they're already served with long-lived immutable HTTP
// cache-control, so the browser's own HTTP cache already satisfies §8's "immutable asset" rule
// without this service worker needing to track hashed filenames itself.
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      // Activate this worker immediately instead of waiting for old tabs to close — safe here
      // specifically because this worker caches almost nothing account/state-specific, so an
      // old tab being taken over mid-session can't hand it stale personalized data (§11's "use
      // immediate activation only when the new worker can safely control existing pages").
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("taptapstar-") && key !== STATIC_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle same-origin GET requests. Everything else (POST/PUT/PATCH/DELETE mutations,
  // cross-origin requests to Stripe/analytics/etc.) passes straight through to the network,
  // untouched — §7's "MUST NOT cache mutation requests" and "MUST NOT cache cross-origin
  // responses without a deliberate reason".
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  const url = new URL(request.url);

  // Never intercept API routes or auth routes — always hit the network directly, no
  // service-worker-level fallback or caching. A network failure here should surface as a normal
  // fetch failure that the page's own error UI handles (§9's per-state error handling), not a
  // service-worker cached response standing in for live billing/account data.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/dashboard")) {
    return;
  }

  // Navigation requests (actual page loads / route changes): network-first, falling back to the
  // cached offline page only when the network genuinely fails (offline, DNS failure, etc.) —
  // never falls back to a stale cached HTML page standing in as if it were current content
  // (§7's "navigation requests never become permanently trapped by a bad cached shell").
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL).then((res) => res ?? Response.error()))
    );
    return;
  }

  // Static, hashed Next.js build assets: cache-first, since the filename itself changes on every
  // new build (content-addressed) — a cache hit is always correct, never stale.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ??
            fetch(request).then((response) => {
              if (response.ok) cache.put(request, response.clone());
              return response;
            })
        )
      )
    );
    return;
  }

  // Marketing-site icons/images: stale-while-revalidate — serve the cached copy instantly if
  // present, refresh it in the background. Scoped to /icons/ and /brand/ only, not every image
  // route, so this cache can't grow unbounded (§8's "apply size/age/entry-count limits").
  if (url.pathname.startsWith("/icons/") || url.pathname.startsWith("/brand/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
          return cached ?? network;
        })
      )
    );
    return;
  }

  // Everything else (marketing pages' other assets, fonts, etc.): let the browser's normal HTTP
  // cache handle it — no service-worker involvement needed or wanted.
});
