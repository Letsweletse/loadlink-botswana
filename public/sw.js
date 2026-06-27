const CACHE_PREFIX = "vanlink-pwa-";
const CACHE_NAME = "vanlink-pwa-v11";

async function clearOldCaches() {
  if (!("caches" in self)) return;

  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map((key) => caches.delete(key)),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(clearOldCaches());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clearOldCaches().then(() => self.clients.claim()));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request, { cache: "reload" }).catch(() =>
        new Response("Van-Link is offline. Please refresh when your network returns.", {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
          status: 503,
          statusText: "Service Unavailable",
        }),
      ),
    );
  }
});
