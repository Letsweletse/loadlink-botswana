// Bumping this forces every device that already has an old worker installed
// (from before this fix) to install fresh and purge its old cache on next
// visit, instead of being stuck on whatever this file's SW last was.
const CACHE_NAME = "vanlink-runtime-v7";
// Server-rendered HTML embeds this build's specific hashed JS chunk URLs
// (e.g. /assets/index-CoP2puzP.js). Precaching "/" and serving it later as a
// fallback meant a slow-network visit could get served a PAST deploy's HTML
// pointing at chunk hashes that no longer exist once a newer deploy has
// shipped — the exact "frozen/blank on mobile" failure this project has hit
// repeatedly. Only precache the hash-free manifest; never cache "/" itself.
const APP_SHELL = ["/manifest.webmanifest"];
// Generous enough for a slow (not dead) Botswana mobile connection to still
// finish a real network fetch instead of being cut off into the fallback.
const NAVIGATE_TIMEOUT_MS = 20000;

// Last-resort body if the network is down AND the app shell was never
// successfully cached (e.g. the very first visit was offline). This is the
// one thing the fetch handler must never fail to produce, since an
// event.respondWith() that resolves to undefined throws inside the browser
// and hard-fails the navigation instead of just showing a blank/offline page.
const FALLBACK_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>VanLink Botswana</title>
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #071426; color: #fff; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 24rem; text-align: center; }
      button { margin-top: 1rem; padding: 0.6rem 1.2rem; border-radius: 0.6rem; border: 0; background: linear-gradient(135deg,#c89a63,#e0c296); color: #46321e; font-weight: 700; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>You're offline</h1>
      <p>VanLink couldn't reach the network and hasn't cached this page yet.</p>
      <button onclick="location.reload()">Try again</button>
    </div>
  </body>
</html>`;

function offlineFallbackResponse() {
  return new Response(FALLBACK_HTML, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => null)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
            return null;
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;
  if (!request.url || !request.url.startsWith("http")) return;

  const url = new URL(request.url);

  // Never interfere with auth, database calls, APIs, Vercel internals, or browser extensions.
  if (
    url.hostname.includes("supabase.co") ||
    url.pathname.includes("/rest/v1/") ||
    url.pathname.includes("/auth/v1/") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.includes("/_vercel") ||
    url.pathname.includes("hot-update")
  ) {
    return;
  }

  // App routes: always network-first so login/signup/profile screens stay
  // fresh. A timeout keeps a stalled mobile connection from hanging the
  // navigation forever. The fallback is always the static, hash-free "offline"
  // page — never a cached copy of "/" — so a slow/failed request can never
  // resolve into a stale shell pointing at JS chunks from an old deploy.
  if (request.mode === "navigate") {
    event.respondWith(
      withTimeout(fetch(request), NAVIGATE_TIMEOUT_MS).catch(offlineFallbackResponse),
    );
    return;
  }

  // Vercel fingerprinted assets are safe to cache. Avoid caching random runtime responses.
  if (url.origin === self.location.origin && url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        });
      }),
    );
  }
});
