const CACHE = "tute-ia-v7.0.0";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=7.0.0",
  "./app.js?v=7.0.0",
  "./manifest.webmanifest",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/cards/back.svg",
  "./assets/cards/bastos-1.svg",
  "./assets/cards/bastos-10.svg",
  "./assets/cards/bastos-11.svg",
  "./assets/cards/bastos-12.svg",
  "./assets/cards/bastos-2.svg",
  "./assets/cards/bastos-3.svg",
  "./assets/cards/bastos-4.svg",
  "./assets/cards/bastos-5.svg",
  "./assets/cards/bastos-6.svg",
  "./assets/cards/bastos-7.svg",
  "./assets/cards/copas-1.svg",
  "./assets/cards/copas-10.svg",
  "./assets/cards/copas-11.svg",
  "./assets/cards/copas-12.svg",
  "./assets/cards/copas-2.svg",
  "./assets/cards/copas-3.svg",
  "./assets/cards/copas-4.svg",
  "./assets/cards/copas-5.svg",
  "./assets/cards/copas-6.svg",
  "./assets/cards/copas-7.svg",
  "./assets/cards/espadas-1.svg",
  "./assets/cards/espadas-10.svg",
  "./assets/cards/espadas-11.svg",
  "./assets/cards/espadas-12.svg",
  "./assets/cards/espadas-2.svg",
  "./assets/cards/espadas-3.svg",
  "./assets/cards/espadas-4.svg",
  "./assets/cards/espadas-5.svg",
  "./assets/cards/espadas-6.svg",
  "./assets/cards/espadas-7.svg",
  "./assets/cards/oros-1.svg",
  "./assets/cards/oros-10.svg",
  "./assets/cards/oros-11.svg",
  "./assets/cards/oros-12.svg",
  "./assets/cards/oros-2.svg",
  "./assets/cards/oros-3.svg",
  "./assets/cards/oros-4.svg",
  "./assets/cards/oros-5.svg",
  "./assets/cards/oros-6.svg",
  "./assets/cards/oros-7.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then(hit => hit || caches.match("./index.html")))
  );
});
