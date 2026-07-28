(() => {
  "use strict";

  const VERSION = "16.0.0";
  const DB_NAME = "tute-ia-offline";
  const STORE = "saves";
  const FULL_AUDIO = "./assets/audio/casino-jazz-background.mp3";
  const LITE_AUDIO = "./assets/audio/casino-jazz-lite.mp3";
  let deferredInstallPrompt = null;
  let swRegistration = null;
  let wakeLock = null;

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "key" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function dbAction(mode, operation) {
    const db = await openDb();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const store = tx.objectStore(STORE);
        let result;
        try { result = operation(store); } catch (error) { reject(error); return; }
        if (result && "onsuccess" in result) {
          result.onsuccess = () => resolve(result.result);
          result.onerror = () => reject(result.error);
        } else {
          tx.oncomplete = () => resolve(result);
          tx.onerror = () => reject(tx.error);
        }
      });
    } finally {
      db.close();
    }
  }

  window.TuteDB = {
    async save(key, value, meta = {}) {
      const record = { key, value, meta, updatedAt: Date.now(), version: VERSION };
      await dbAction("readwrite", store => store.put(record));
      window.dispatchEvent(new CustomEvent("tute:save-updated", { detail: record }));
      return record;
    },
    async load(key) {
      const record = await dbAction("readonly", store => store.get(key));
      return record || null;
    },
    async remove(key) {
      await dbAction("readwrite", store => store.delete(key));
      window.dispatchEvent(new CustomEvent("tute:save-updated", { detail: { key, removed: true } }));
    },
    async list() {
      const records = await dbAction("readonly", store => store.getAll());
      return (records || []).sort((a, b) => b.updatedAt - a.updatedAt);
    },
    async clear() {
      await dbAction("readwrite", store => store.clear());
      window.dispatchEvent(new CustomEvent("tute:save-updated", { detail: { cleared: true } }));
    }
  };

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function isIos() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  }

  function createShell() {
    if (document.getElementById("pwaControlButton")) return;
    const shell = document.createElement("div");
    shell.className = "pwa-shell-controls";
    shell.innerHTML = `
      <button class="pwa-status-pill" id="pwaNetworkStatus" type="button" aria-label="Estado de conexión">
        <i></i><span>Comprobando…</span>
      </button>
      <button class="pwa-control-button" id="pwaControlButton" type="button" aria-label="Instalar y gestionar aplicación">
        <span>↓</span><b>APP</b>
      </button>`;
    document.body.appendChild(shell);

    const dialog = document.createElement("dialog");
    dialog.id = "pwaPanel";
    dialog.className = "pwa-panel";
    dialog.innerHTML = `
      <div class="pwa-panel-card">
        <button class="pwa-panel-close" id="pwaPanelClose" type="button" aria-label="Cerrar">×</button>
        <span class="pwa-panel-kicker">TUTE IA · V${VERSION}</span>
        <h2>Aplicación offline</h2>
        <p id="pwaPanelLead">Instala Tute IA y juega sin depender de la conexión.</p>
        <div class="pwa-readiness">
          <article><span>APLICACIÓN</span><strong id="pwaInstallState">Comprobando</strong><small>Icono y pantalla completa</small></article>
          <article><span>JUEGO OFFLINE</span><strong id="pwaOfflineState">Preparando</strong><small>Cartas, reglas y tutoriales</small></article>
          <article><span>ALMACENAMIENTO</span><strong id="pwaStorageState">Normal</strong><small>Protección de partidas guardadas</small></article>
        </div>
        <button class="pwa-main-action" id="pwaInstallAction" type="button">Instalar Tute IA</button>
        <div class="pwa-panel-actions">
          <button id="pwaFullscreenAction" type="button">Pantalla completa</button>
          <button id="pwaAudioAction" type="button">Descargar música completa</button>
          <button id="pwaPersistAction" type="button">Proteger datos</button>
          <button id="pwaExportAction" type="button">Exportar copia</button>
          <button id="pwaImportAction" type="button">Importar copia</button>
          <input id="pwaImportFile" class="hidden" type="file" accept="application/json,.json">
        </div>
        <div class="pwa-download-progress hidden" id="pwaDownloadProgress"><span></span><b>Descargando música…</b></div>
        <div class="pwa-ios-help hidden" id="pwaIosHelp">
          <strong>Instalación en iPhone o iPad</strong>
          <p>Pulsa el botón Compartir de Safari y selecciona «Añadir a pantalla de inicio».</p>
        </div>
        <button class="pwa-danger-action" id="pwaClearAction" type="button">Borrar partidas guardadas y ajustes</button>
      </div>`;
    document.body.appendChild(dialog);

    document.getElementById("pwaControlButton").addEventListener("click", openPanel);
    document.getElementById("pwaNetworkStatus").addEventListener("click", openPanel);
    document.getElementById("pwaPanelClose").addEventListener("click", () => dialog.close());
    document.getElementById("pwaInstallAction").addEventListener("click", installApp);
    document.getElementById("pwaFullscreenAction").addEventListener("click", toggleFullscreen);
    document.getElementById("pwaAudioAction").addEventListener("click", toggleFullAudio);
    document.getElementById("pwaPersistAction").addEventListener("click", requestPersistence);
    document.getElementById("pwaExportAction").addEventListener("click", exportBackup);
    document.getElementById("pwaImportAction").addEventListener("click", () => document.getElementById("pwaImportFile").click());
    document.getElementById("pwaImportFile").addEventListener("change", importBackup);
    document.getElementById("pwaClearAction").addEventListener("click", clearAppData);
    dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
    updateNetworkUi();
    refreshPanelState();
  }

  function openPanel() {
    const panel = document.getElementById("pwaPanel");
    refreshPanelState();
    panel?.showModal();
  }

  function updateNetworkUi() {
    const pill = document.getElementById("pwaNetworkStatus");
    if (!pill) return;
    const online = navigator.onLine;
    pill.classList.toggle("offline", !online);
    pill.querySelector("span").textContent = online ? "Con conexión" : "Modo offline";
    document.documentElement.classList.toggle("is-offline", !online);
  }

  async function installApp() {
    if (isStandalone()) return toast("Tute IA ya está instalada.");
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === "accepted") toast("Instalación iniciada.");
      deferredInstallPrompt = null;
      refreshPanelState();
      return;
    }
    if (isIos()) {
      document.getElementById("pwaIosHelp")?.classList.remove("hidden");
      return;
    }
    toast("Abre el menú del navegador y elige «Instalar aplicación» o «Añadir a pantalla de inicio». ");
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen({ navigationUI: "hide" });
      refreshPanelState();
    } catch (_) { toast("El navegador no permite pantalla completa desde aquí."); }
  }

  async function requestPersistence() {
    if (!navigator.storage?.persist) return toast("Este navegador gestiona el almacenamiento automáticamente.");
    const granted = await navigator.storage.persist();
    toast(granted ? "Partidas protegidas frente a limpiezas automáticas." : "El navegador no ha concedido almacenamiento persistente.");
    refreshPanelState();
  }

  async function postToServiceWorker(message) {
    const controller = navigator.serviceWorker?.controller || swRegistration?.active || swRegistration?.waiting;
    if (!controller) throw new Error("service-worker-unavailable");
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      const timeout = setTimeout(() => reject(new Error("timeout")), 5000);
      channel.port1.onmessage = event => { clearTimeout(timeout); resolve(event.data); };
      controller.postMessage(message, [channel.port2]);
    });
  }

  async function fullAudioCached() {
    try {
      const result = await postToServiceWorker({ type: "GET_CACHE_STATUS" });
      return Boolean(result?.fullAudio);
    } catch (_) {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        const match = await caches.open(name).then(cache => cache.match(FULL_AUDIO));
        if (match) return true;
      }
      return false;
    }
  }

  async function toggleFullAudio() {
    const button = document.getElementById("pwaAudioAction");
    const progress = document.getElementById("pwaDownloadProgress");
    const cached = await fullAudioCached();
    button.disabled = true;
    progress?.classList.remove("hidden");
    try {
      if (cached) {
        await postToServiceWorker({ type: "REMOVE_FULL_AUDIO" });
        localStorage.setItem("tuteIaMusicQuality", "lite");
        setAudioSource("lite");
        toast("Se ha conservado la pista ligera offline.");
      } else {
        await postToServiceWorker({ type: "CACHE_FULL_AUDIO" });
        localStorage.setItem("tuteIaMusicQuality", "full");
        setAudioSource("full");
        toast("Música completa preparada para jugar sin conexión.");
      }
    } catch (_) {
      toast("No se pudo completar la descarga. Comprueba la conexión y vuelve a intentarlo.");
    } finally {
      button.disabled = false;
      progress?.classList.add("hidden");
      refreshPanelState();
    }
  }

  function setAudioSource(quality) {
    document.querySelectorAll("audio").forEach(audio => {
      const wasPlaying = !audio.paused;
      const time = audio.currentTime || 0;
      audio.src = quality === "full" ? FULL_AUDIO : LITE_AUDIO;
      audio.load();
      if (wasPlaying) {
        audio.currentTime = Math.min(time, quality === "full" ? time : 299);
        audio.play().catch(() => {});
      }
      window.TuteMusicContinuity?.bind(audio);
    });
  }

  function backupReplacer(_key, value) {
    if (value instanceof Set) return { __tuteType: "Set", values: [...value] };
    return value;
  }

  function backupReviver(_key, value) {
    if (value && value.__tuteType === "Set") return new Set(value.values || []);
    return value;
  }

  async function exportBackup() {
    try {
      const saves = await window.TuteDB.list();
      const preferences = {};
      Object.keys(localStorage).filter(key => key.startsWith("tute")).forEach(key => { preferences[key] = localStorage.getItem(key); });
      const payload = { format: "tute-ia-backup", version: VERSION, exportedAt: new Date().toISOString(), saves, preferences };
      const blob = new Blob([JSON.stringify(payload, backupReplacer, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tute-ia-copia-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast("Copia de seguridad creada.");
    } catch (_) { toast("No se pudo crear la copia de seguridad."); }
  }

  async function importBackup(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text(), backupReviver);
      if (payload?.format !== "tute-ia-backup" || !Array.isArray(payload.saves)) throw new Error("invalid-backup");
      const confirmed = window.confirm("Se importarán las partidas y ajustes de la copia. Los datos con el mismo nombre serán reemplazados. ¿Continuar?");
      if (!confirmed) return;
      for (const record of payload.saves) {
        if (!record?.key) continue;
        await window.TuteDB.save(record.key, record.value, record.meta || {});
      }
      Object.entries(payload.preferences || {}).forEach(([key, value]) => {
        if (key.startsWith("tute") && typeof value === "string") localStorage.setItem(key, value);
      });
      toast("Copia importada correctamente.");
      setTimeout(() => location.reload(), 800);
    } catch (_) { toast("El archivo no es una copia válida de Tute IA."); }
  }

  async function clearAppData() {
    const confirmed = window.confirm("Se borrarán las partidas guardadas, estadísticas y ajustes de Tute IA en este dispositivo. ¿Continuar?");
    if (!confirmed) return;
    await window.TuteDB.clear().catch(() => {});
    Object.keys(localStorage).filter(key => key.startsWith("tute")).forEach(key => localStorage.removeItem(key));
    toast("Datos locales borrados.");
    setTimeout(() => location.reload(), 700);
  }

  async function refreshPanelState() {
    const installed = isStandalone();
    const installState = document.getElementById("pwaInstallState");
    const installAction = document.getElementById("pwaInstallAction");
    const offlineState = document.getElementById("pwaOfflineState");
    const storageState = document.getElementById("pwaStorageState");
    const audioAction = document.getElementById("pwaAudioAction");
    if (installState) installState.textContent = installed ? "Instalada" : deferredInstallPrompt || isIos() ? "Disponible" : "Desde navegador";
    if (installAction) {
      installAction.textContent = installed ? "Aplicación instalada" : isIos() && !deferredInstallPrompt ? "Ver cómo instalar" : "Instalar Tute IA";
      installAction.disabled = installed;
    }
    if (offlineState) offlineState.textContent = navigator.serviceWorker?.controller ? "Lista" : "Instalando…";
    try {
      const persisted = await navigator.storage?.persisted?.();
      if (storageState) storageState.textContent = persisted ? "Protegido" : "Normal";
    } catch (_) {}
    try {
      const cached = await fullAudioCached();
      if (audioAction) audioAction.textContent = cached ? "Usar música ligera" : "Descargar música completa";
    } catch (_) {}
  }

  function toast(text) {
    let region = document.getElementById("pwaToastRegion");
    if (!region) {
      region = document.createElement("div");
      region.id = "pwaToastRegion";
      region.className = "pwa-toast-region";
      document.body.appendChild(region);
    }
    const item = document.createElement("div");
    item.textContent = text;
    region.appendChild(item);
    setTimeout(() => item.remove(), 3600);
  }

  function showUpdate(registration) {
    if (document.getElementById("pwaUpdateBanner")) return;
    const banner = document.createElement("div");
    banner.id = "pwaUpdateBanner";
    banner.className = "pwa-update-banner";
    banner.innerHTML = `<div><strong>Nueva versión disponible</strong><span>Actualiza sin perder tus partidas guardadas.</span></div><button type="button">Actualizar</button>`;
    banner.querySelector("button").addEventListener("click", () => {
      registration.waiting?.postMessage({ type: "SKIP_WAITING" });
    });
    document.body.appendChild(banner);
  }

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    try {
      swRegistration = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
      if (swRegistration.waiting) showUpdate(swRegistration);
      swRegistration.addEventListener("updatefound", () => {
        const worker = swRegistration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) showUpdate(swRegistration);
        });
      });
      navigator.serviceWorker.addEventListener("controllerchange", () => location.reload());
      refreshPanelState();
    } catch (_) {
      document.getElementById("pwaOfflineState")?.replaceChildren(document.createTextNode("No disponible"));
    }
  }

  async function requestWakeLock() {
    if (!("wakeLock" in navigator) || wakeLock) return;
    try {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => { wakeLock = null; });
    } catch (_) {}
  }

  async function releaseWakeLock() {
    try { await wakeLock?.release(); } catch (_) {}
    wakeLock = null;
  }

  window.TutePWA = {
    version: VERSION,
    openPanel,
    toast,
    requestWakeLock,
    releaseWakeLock,
    async setPlaying(active) {
      document.body.classList.toggle("game-in-progress", Boolean(active));
      if (active) await requestWakeLock(); else await releaseWakeLock();
    },
    async save(key, value, meta) { return window.TuteDB.save(key, value, meta); },
    async load(key) { return window.TuteDB.load(key); },
    async removeSave(key) { return window.TuteDB.remove(key); }
  };

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    document.body.classList.add("pwa-installable");
    refreshPanelState();
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    document.body.classList.add("pwa-installed");
    toast("Tute IA instalada correctamente.");
    refreshPanelState();
  });
  window.addEventListener("online", updateNetworkUi);
  window.addEventListener("offline", updateNetworkUi);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) window.dispatchEvent(new CustomEvent("tute:privacy-lock"));
    else if (document.body.classList.contains("game-in-progress")) requestWakeLock();
  });
  window.addEventListener("orientationchange", () => {
    document.documentElement.dataset.orientation = screen.orientation?.type || "unknown";
  });

  document.addEventListener("DOMContentLoaded", () => {
    createShell();
    const quality = localStorage.getItem("tuteIaMusicQuality") === "full" ? "full" : "lite";
    setAudioSource(quality);
    registerServiceWorker();
    navigator.storage?.persisted?.().then(persisted => {
      if (!persisted && isStandalone()) navigator.storage.persist?.().catch(() => {});
    }).catch(() => {});
  });
})();
