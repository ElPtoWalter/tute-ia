const VERSION = "21.0.1";
const SHELL_CACHE = `tute-ia-shell-${VERSION}`;
const RUNTIME_CACHE = `tute-ia-runtime-${VERSION}`;
const MEDIA_CACHE = `tute-ia-media-${VERSION}`;
const OFFLINE_URL = "./offline.html";
const LITE_AUDIO = "./assets/audio/casino-jazz-lite.mp3";
const FULL_AUDIO = "./assets/audio/casino-jazz-background.mp3";
const CORE_ASSETS = ["./","./app.js","./auth.css","./auth.js","./cante-effects.css","./cante-effects.js","./card-preview.html","./career.css","./career.html","./career.js","./chinchon.html","./chinchon.js","./club.css","./club.js","./culo.css","./culo.html","./culo.js","./escoba.html","./escoba.js","./generala-classic.css","./generala.css","./generala.html","./generala.js","./hub.css","./index.html","./local.css","./local.html","./local.js","./manifest.webmanifest","./mobile-final.css","./mobile-layout.js","./mobile.css","./multi.css","./multi.html","./multi.js","./music-continuity.js","./offline.html","./poker-assets.js","./poker-core.js","./poker.css","./poker.html","./poker.js","./pwa.css","./pwa.js","./salon-games.css","./styles.css","./sw.js","./tute.html","./tutorials.css","./tutorials.js","./assets/audio/casino-jazz-lite.mp3","./assets/cards/back.svg","./assets/cards/bastos-1.webp","./assets/cards/bastos-10.webp","./assets/cards/bastos-11.webp","./assets/cards/bastos-12.webp","./assets/cards/bastos-2.webp","./assets/cards/bastos-3.webp","./assets/cards/bastos-4.webp","./assets/cards/bastos-5.webp","./assets/cards/bastos-6.webp","./assets/cards/bastos-7.webp","./assets/cards/copas-1.webp","./assets/cards/copas-10.webp","./assets/cards/copas-11.webp","./assets/cards/copas-12.webp","./assets/cards/copas-2.webp","./assets/cards/copas-3.webp","./assets/cards/copas-4.webp","./assets/cards/copas-5.webp","./assets/cards/copas-6.webp","./assets/cards/copas-7.webp","./assets/cards/espadas-1.webp","./assets/cards/espadas-10.webp","./assets/cards/espadas-11.webp","./assets/cards/espadas-12.webp","./assets/cards/espadas-2.webp","./assets/cards/espadas-3.webp","./assets/cards/espadas-4.webp","./assets/cards/espadas-5.webp","./assets/cards/espadas-6.webp","./assets/cards/espadas-7.webp","./assets/cards/oros-1.webp","./assets/cards/oros-10.webp","./assets/cards/oros-11.webp","./assets/cards/oros-12.webp","./assets/cards/oros-2.webp","./assets/cards/oros-3.webp","./assets/cards/oros-4.webp","./assets/cards/oros-5.webp","./assets/cards/oros-6.webp","./assets/cards/oros-7.webp","./assets/cubilete-generala.png","./assets/cubilete-generala.webp","./assets/icon-192.png","./assets/icon-512.png","./assets/icons/apple-touch-icon.png","./assets/icons/favicon-64.png","./assets/icons/icon-maskable-512.png","./assets/poker/README-ASSETS.md","./assets/poker/anton-crupier-placeholder.svg","./assets/poker/anton-crupier.webp","./assets/poker/card-back.svg","./assets/poker/cards/J-c.webp","./assets/poker/cards/J-d.webp","./assets/poker/cards/J-h.webp","./assets/poker/cards/J-s.webp","./assets/poker/cards/K-c.webp","./assets/poker/cards/K-d.webp","./assets/poker/cards/K-h.webp","./assets/poker/cards/K-s.webp","./assets/poker/cards/Q-c.webp","./assets/poker/cards/Q-d.webp","./assets/poker/cards/Q-h.webp","./assets/poker/cards/Q-s.webp","./assets/poker/chips/chip-1.webp","./assets/poker/chips/chip-10.webp","./assets/poker/chips/chip-100.webp","./assets/poker/chips/chip-25.webp","./assets/poker/chips/chip-5.webp","./assets/poker/chips/chip-50.webp","./assets/poker/chips/chip-500.webp","./assets/poker/markers/bb.webp","./assets/poker/markers/ciega-grande.svg","./assets/poker/markers/ciega-pequena.svg","./assets/poker/markers/dealer.svg","./assets/poker/markers/dealer.webp","./assets/poker/markers/sb.webp","./assets/screenshots/desktop-table.png","./assets/screenshots/local-handoff.png","./assets/screenshots/mobile-home.png"];

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
  const hit = await cache.match(request, { ignoreSearch: true });
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
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
      : path.endsWith("/chinchon.html") ? "./chinchon.html"
      : path.endsWith("/escoba.html") ? "./escoba.html"
      : path.endsWith("/culo.html") ? "./culo.html"
      : path.endsWith("/poker.html") ? "./poker.html"
      : path.endsWith("/tute.html") ? "./tute.html"
      : path.endsWith("/career.html") ? "./career.html"
      : "./index.html";
    return (await cache.match(request, { ignoreSearch: true }))
      || (await caches.match(request, { ignoreSearch: true }))
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
  if (url.pathname.includes("/assets/cards/") || url.pathname.includes("/assets/poker/") || url.pathname.includes("/assets/icons/") || /icon-(192|512)\.png$/.test(url.pathname)) { event.respondWith(cacheFirst(event.request)); return; }
  if (["style", "script", "font", "image"].includes(event.request.destination)) { event.respondWith(staleWhileRevalidate(event.request)); return; }
  event.respondWith(staleWhileRevalidate(event.request));
});
