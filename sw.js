const CACHE = "tute-ia-v13.0.0";
const AUDIO_ASSET = "./assets/audio/casino-jazz-background.mp3";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=13.0.0",
  "./app.js?v=13.0.0",
  "./multi.html",
  "./multi.css?v=13.0.0",
  "./multi.js?v=13.0.0",
  "./local.html",
  "./local.css?v=13.0.0",
  "./local.js?v=13.0.0",
  "./manifest.webmanifest",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/cards/back.svg",
  "./assets/cards/bastos-1.webp",
  "./assets/cards/bastos-10.webp",
  "./assets/cards/bastos-11.webp",
  "./assets/cards/bastos-12.webp",
  "./assets/cards/bastos-2.webp",
  "./assets/cards/bastos-3.webp",
  "./assets/cards/bastos-4.webp",
  "./assets/cards/bastos-5.webp",
  "./assets/cards/bastos-6.webp",
  "./assets/cards/bastos-7.webp",
  "./assets/cards/copas-1.webp",
  "./assets/cards/copas-10.webp",
  "./assets/cards/copas-11.webp",
  "./assets/cards/copas-12.webp",
  "./assets/cards/copas-2.webp",
  "./assets/cards/copas-3.webp",
  "./assets/cards/copas-4.webp",
  "./assets/cards/copas-5.webp",
  "./assets/cards/copas-6.webp",
  "./assets/cards/copas-7.webp",
  "./assets/cards/espadas-1.webp",
  "./assets/cards/espadas-10.webp",
  "./assets/cards/espadas-11.webp",
  "./assets/cards/espadas-12.webp",
  "./assets/cards/espadas-2.webp",
  "./assets/cards/espadas-3.webp",
  "./assets/cards/espadas-4.webp",
  "./assets/cards/espadas-5.webp",
  "./assets/cards/espadas-6.webp",
  "./assets/cards/espadas-7.webp",
  "./assets/cards/oros-1.webp",
  "./assets/cards/oros-10.webp",
  "./assets/cards/oros-11.webp",
  "./assets/cards/oros-12.webp",
  "./assets/cards/oros-2.webp",
  "./assets/cards/oros-3.webp",
  "./assets/cards/oros-4.webp",
  "./assets/cards/oros-5.webp",
  "./assets/cards/oros-6.webp",
  "./assets/cards/oros-7.webp"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE_ASSETS);
    try {
      const audioResponse = await fetch(AUDIO_ASSET);
      if (audioResponse.ok) await cache.put(AUDIO_ASSET, audioResponse);
    } catch (_) {}
  })());
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

async function audioResponseFor(request) {
  const cache = await caches.open(CACHE);
  let fullResponse = await cache.match(AUDIO_ASSET);
  if (!fullResponse) {
    try {
      const fetched = await fetch(AUDIO_ASSET);
      if (fetched.ok) {
        await cache.put(AUDIO_ASSET, fetched.clone());
        fullResponse = fetched;
      }
    } catch (_) {}
  }
  if (!fullResponse) return fetch(request);
  const range = request.headers.get("range");
  if (!range) return fullResponse;
  const match = /bytes=(\d+)-(\d*)/.exec(range);
  if (!match) return fullResponse;
  const buffer = await fullResponse.arrayBuffer();
  const size = buffer.byteLength;
  const start = Math.min(Number(match[1]), Math.max(0, size - 1));
  const requestedEnd = match[2] ? Number(match[2]) : size - 1;
  const end = Math.min(Math.max(start, requestedEnd), size - 1);
  const chunk = buffer.slice(start, end + 1);
  return new Response(chunk, {
    status: 206,
    statusText: "Partial Content",
    headers: {
      "Content-Type": fullResponse.headers.get("Content-Type") || "audio/mpeg",
      "Content-Length": String(chunk.byteLength),
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes"
    }
  });
}

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.pathname.endsWith("casino-jazz-background.mp3")) {
    event.respondWith(audioResponseFor(event.request));
    return;
  }
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
