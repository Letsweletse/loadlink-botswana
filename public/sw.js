const CACHE_NAME = "vanlink-pwa-v6";
const APP_SHELL = ["/", "/manifest.webmanifest", "/icon.svg"];

async function cacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(
    APP_SHELL.map(function cacheShellUrl(url) {
      return cache.add(url).catch(function ignoreCacheFailure() {
        return null;
      });
    }),
  );
}

async function clearOldCaches() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith("vanlink-pwa-") && key !== CACHE_NAME)
      .map((key) => caches.delete(key)),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheAppShell());
  await Promise.allSettled(APP_SHELL.map((url) => cache.add(url)));
}

async function clearOldCaches() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith("vanlink-pwa-") && key !== CACHE_NAME)
      .map((key) => caches.delete(key)),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheAppShell());
const CACHE_NAME = 'vanlink-pwa-v9';
const APP_SHELL = ['/', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => null));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clearOldCaches().then(() => self.clients.claim()));
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((response) => {
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put("/", clone))
            .catch(() => null);
          return response;
        })
        .catch(async () => {
          const cachedShell = await caches.match("/");
          return (
            cachedShell ||
            new Response("Van-Link is offline. Please refresh when your network returns.", {
              headers: { "Content-Type": "text/plain; charset=utf-8" },
              status: 503,
              statusText: "Service Unavailable",
            })
          );
        }),
          return response;
        })
        .catch(async () => {
          const cachedShell = await caches.match("/");
          return (
            cachedShell ||
            new Response("Van-Link is offline. Please refresh when your network returns.", {
              headers: { "Content-Type": "text/plain; charset=utf-8" },
              status: 503,
              statusText: "Service Unavailable",
            })
          );
        }),
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/', clone)).catch(() => null);
          }
          return response;
        })
        .catch(() => caches.match('/')),
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && response.status === 200) {
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone))
            .catch(() => null);
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        return (
          cached ||
          new Response("", {
            status: 503,
            statusText: "Service Unavailable",
          })
        );
      }),
  );
});
