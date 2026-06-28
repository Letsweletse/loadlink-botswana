self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if ("caches" in self) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }

      if (self.registration && self.registration.unregister) {
        await self.registration.unregister();
      }

      if (self.clients && self.clients.matchAll) {
        const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        for (const client of clients) {
          client.navigate(client.url);
        }
      }
    })(),
  );
});
