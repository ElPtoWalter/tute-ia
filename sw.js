const VERSION = "18.0.0";
const SHELL_CACHE = `tute-ia-shell-${VERSION}`;
const RUNTIME_CACHE = `tute-ia-runtime-${VERSION}`;
const MEDIA_CACHE = `tute-ia-media-${VERSION}`;
const OFFLINE_URL = "./offline.html";
const LITE_AUDIO = "./assets/audio/casino-jazz-lite.mp3";
const FULL_AUDIO = "./assets/audio/casino-jazz-background.mp3";
const CORE_ASSETS = ["./","./index.html","./tute.html","./generala.html","./local.html","./multi.html","./offline.html","./manifest.webmanifest","./club.css?v=18.0.0","./hub.css?v=18.0.0","./club.js?v=18.0.0","./styles.css?v=18.0.0","./pwa.css?v=18.0.0","./mobile.css?v=18.0.0","./cante-effects.css?v=18.0.0","./app.js?v=18.0.0","./pwa.js?v=18.0.0","./music-continuity.js?v=18.0.0","./cante-effects.js?v=18.0.0","./generala.css?v=18.0.0","./generala-classic.css?v=18.0.0","./generala.js?v=18.0.0","./local.css?v=16.0.0","./local.js?v=16.0.0","./multi.css?v=16.0.0","./multi.js?v=16.0.0","./assets/icon-192.png","./assets/icon-512.png","./assets/icons/icon-maskable-512.png","./assets/icons/apple-touch-icon.png","./assets/icons/favicon-64.png","./assets/audio/casino-jazz-lite.mp3","./assets/cubilete-generala.webp","./assets/cubilete-generala.png","./assets/cards/back.svg","./assets/cards/bastos-1.webp","./assets/cards/bastos-2.webp","./assets/cards/bastos-3.webp","./assets/cards/bastos-4.webp","./assets/cards/bastos-5.webp","./assets/cards/bastos-6.webp","./assets/cards/bastos-7.webp","./assets/cards/bastos-10.webp","./assets/cards/bastos-11.webp","./assets/cards/bastos-12.webp","./assets/cards/copas-1.webp","./assets/cards/copas-2.webp","./assets/cards/copas-3.webp","./assets/cards/copas-4.webp","./assets/cards/copas-5.webp","./assets/cards/copas-6.webp","./assets/cards/copas-7.webp","./assets/cards/copas-10.webp","./assets/cards/copas-11.webp","./assets/cards/copas-12.webp","./assets/cards/espadas-1.webp","./assets/cards/espadas-2.webp","./assets/cards/espadas-3.webp","./assets/cards/espadas-4.webp","./assets/cards/espadas-5.webp","./assets/cards/espadas-6.webp","./assets/cards/espadas-7.webp","./assets/cards/espadas-10.webp","./assets/cards/espadas-11.webp","./assets/cards/espadas-12.webp","./assets/cards/oros-1.webp","./assets/cards/oros-2.webp","./assets/cards/oros-3.webp","./assets/cards/oros-4.webp","./assets/cards/oros-5.webp","./assets/cards/oros-6.webp","./assets/cards/oros-7.webp","./assets/cards/oros-10.webp","./assets/cards/oros-11.webp","./assets/cards/oros-12.webp"];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(CORE_ASSETS);
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE, RUNTIME_CACHE, MEDIA_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith("tute-ia-") && !keep.has(key)).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", event => {
  const port = event.ports?.[0];
  const reply = value => port?.postMessage(value);
  if (event.data?.type === "SKIP_WAITING") { self.skipWaiting(); reply({ ok: true }); return; }
  if (event.data?.type === "CACHE_FULL_AUDIO") {
    event.waitUntil((async () => {
      try {
        const response = await fetch(FULL_AUDIO, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await (await caches.open(MEDIA_CACHE)).put(FULL_AUDIO, response.clone());
        reply({ ok: true, fullAudio: true });
      } catch (error) { reply({ ok: false, error: String(error) }); }
    })());
    return;
  }
  if (event.data?.type === "REMOVE_FULL_AUDIO") {
    event.waitUntil((async () => {
      const removed = await (await caches.open(MEDIA_CACHE)).delete(FULL_AUDIO);
      reply({ ok: true, removed });
    })());
    return;
  }
  if (event.data?.type === "GET_CACHE_STATUS") {
    event.waitUntil((async () => {
      const shell = await caches.open(SHELL_CACHE);
      const media = await caches.open(MEDIA_CACHE);
      reply({
        ok: true,
        fullAudio: Boolean(await media.match(FULL_AUDIO)),
        liteAudio: Boolean(await shell.match(LITE_AUDIO)),
        version: VERSION
      });
    })());
  }
});

async function cacheFirst(request, cacheName = SHELL_CACHE) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request, { ignoreSearch: false });
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || (await network) || Response.error();
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (_) {
    const url = new URL(request.url);
    const path = url.pathname.toLowerCase();
    const shellFallback = path.endsWith("/local.html") ? "./local.html"
      : path.endsWith("/multi.html") ? "./multi.html"
      : path.endsWith("/generala.html") ? "./generala.html"
      : path.endsWith("/tute.html") ? "./tute.html"
      : "./index.html";
    return (await cache.match(request))
      || (await caches.match(request))
      || (await caches.match(shellFallback))
      || (await caches.match(OFFLINE_URL));
  }
}

async function audioResponse(request) {
  const url = new URL(request.url);
  const target = url.pathname.endsWith("casino-jazz-background.mp3") ? FULL_AUDIO : LITE_AUDIO;
  const preferredCache = target === FULL_AUDIO ? MEDIA_CACHE : SHELL_CACHE;
  const cache = await caches.open(preferredCache);
  let response = await cache.match(target);
  if (!response) {
    try {
      response = await fetch(target);
      if (response.ok) await cache.put(target, response.clone());
    } catch (_) {}
  }
  if (!response) return new Response("Audio unavailable", { status: 503 });
  const range = request.headers.get("range");
  if (!range) return response;
  const match = /bytes=(\d+)-(\d*)/.exec(range);
  if (!match) return response;
  const buffer = await response.arrayBuffer();
  const size = buffer.byteLength;
  const start = Math.min(Number(match[1]), Math.max(0, size - 1));
  const requestedEnd = match[2] ? Number(match[2]) : size - 1;
  const end = Math.min(Math.max(start, requestedEnd), size - 1);
  const chunk = buffer.slice(start, end + 1);
  return new Response(chunk, {
    status: 206,
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "audio/mpeg",
      "Content-Length": String(chunk.byteLength),
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes"
    }
  });
}

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.mode === "navigate") { event.respondWith(networkFirstNavigation(event.request)); return; }
  if (url.pathname.endsWith(".mp3")) { event.respondWith(audioResponse(event.request)); return; }
  if (url.pathname.includes("/assets/cards/") || url.pathname.includes("/assets/icons/") || /icon-(192|512)\.png$/.test(url.pathname)) { event.respondWith(cacheFirst(event.request)); return; }
  if (["style", "script", "font", "image"].includes(event.request.destination)) { event.respondWith(staleWhileRevalidate(event.request)); return; }
  event.respondWith(staleWhileRevalidate(event.request));
});
