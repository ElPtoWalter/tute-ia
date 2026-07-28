(() => {
  "use strict";
  const POSITION_KEY = "tuteIaMusicPosition";
  const ENABLED_KEY = "tuteIaMusicEnabled";
  let audio = null;
  let lastSavedAt = 0;
  const enabled = () => localStorage.getItem(ENABLED_KEY) !== "false";
  function savePosition() {
    if (!audio || !Number.isFinite(audio.currentTime)) return;
    try { localStorage.setItem(POSITION_KEY, String(Math.max(0, audio.currentTime))); } catch (_) {}
  }
  function restorePosition() {
    if (!audio) return;
    try {
      const saved = Number(localStorage.getItem(POSITION_KEY));
      if (!Number.isFinite(saved) || saved <= 0) return;
      const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : null;
      audio.currentTime = duration ? saved % duration : saved;
    } catch (_) {}
  }
  async function resume() {
    if (!audio || !enabled() || !audio.paused) return;
    try { await audio.play(); } catch (_) {}
  }
  function bind(target) {
    if (!target || target.dataset.continuityBound === "true") return;
    audio = target;
    audio.dataset.continuityBound = "true";
    audio.loop = true;
    audio.preload = "auto";
    if (audio.readyState >= 1) restorePosition();
    else audio.addEventListener("loadedmetadata", restorePosition, { once: true });
    audio.addEventListener("timeupdate", () => {
      const now = performance.now();
      if (now - lastSavedAt < 1200) return;
      lastSavedAt = now;
      savePosition();
    });
    audio.addEventListener("ended", () => {
      try { audio.currentTime = 0; } catch (_) {}
      if (enabled()) resume();
    });
    audio.addEventListener("pause", savePosition);
    audio.addEventListener("play", () => { try { localStorage.setItem(ENABLED_KEY, "true"); } catch (_) {} });
    document.addEventListener("pointerdown", resume, { capture: true, passive: true });
    document.addEventListener("keydown", resume, { capture: true });
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", () => document.hidden ? savePosition() : resume());
    window.addEventListener("pagehide", savePosition);
    window.addEventListener("beforeunload", savePosition);
    if (enabled()) resume();
  }
  function locateAndBind() { bind(document.querySelector("audio#backgroundMusic, audio#localMusic, audio#multiMusic")); }
  window.TuteMusicContinuity = { bind, resume, savePosition, sync() { locateAndBind(); resume(); } };
  document.addEventListener("DOMContentLoaded", locateAndBind);
})();
