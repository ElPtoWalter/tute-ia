(() => {
  "use strict";

  const STORAGE_KEY = "salaCeroCasualV261";
  const MAX_RECENT = 4;
  const defaults = { name: "Jugador", sound: true, haptics: true, recent: [] };

  function read() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch (_) {}
    const data = { ...defaults, ...saved };
    data.name = String(data.name || defaults.name).trim().slice(0, 18) || defaults.name;
    data.sound = data.sound !== false;
    data.haptics = data.haptics !== false;
    data.recent = Array.isArray(data.recent) ? data.recent.slice(0, MAX_RECENT) : [];
    return data;
  }

  function write(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
    window.dispatchEvent(new CustomEvent("sala-cero:preferences", { detail: data }));
    return data;
  }

  function migrateName() {
    const current = read();
    if (current.name !== defaults.name) return current;
    try {
      const legacy = JSON.parse(localStorage.getItem("salaCeroClubV18") || "null");
      const legacyName = String(legacy?.profile?.name || "").trim();
      if (legacyName) return write({ ...current, name: legacyName.slice(0, 18) });
    } catch (_) {}
    return current;
  }

  function savePreferences(patch) {
    const current = read();
    return write({
      ...current,
      ...patch,
      name: String(patch.name ?? current.name).trim().slice(0, 18) || defaults.name,
      recent: current.recent
    });
  }

  function rememberGame(game) {
    if (!game?.id || !game?.href || game.id === "inicio") return;
    const current = read();
    const entry = {
      id: String(game.id),
      title: String(game.title || game.id),
      href: String(game.href),
      playedAt: Date.now()
    };
    current.recent = [entry, ...current.recent.filter(item => item.id !== entry.id)].slice(0, MAX_RECENT);
    write(current);
  }

  function noteResult(event = {}) {
    const body = document.body;
    rememberGame({
      id: event.game || body?.dataset.game,
      title: body?.dataset.gameTitle || document.title.split("—")[0].trim(),
      href: `${location.pathname.split("/").pop() || "index.html"}`
    });
  }

  function haptic(pattern = 18) {
    if (!read().haptics) return false;
    try { return Boolean(navigator.vibrate?.(pattern)); } catch (_) { return false; }
  }

  function beep(frequency = 520, duration = .06) {
    if (!read().sound) return;
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      const context = window.__salaCeroAudio || (window.__salaCeroAudio = new Context());
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.025, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + duration);
    } catch (_) {}
  }

  function fold(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function initCatalog() {
    const cards = [...document.querySelectorAll("[data-game-card]")];
    if (!cards.length) return;
    const search = document.getElementById("gameSearch");
    const output = document.getElementById("gameCount");
    const empty = document.getElementById("catalogEmpty");
    const filters = [...document.querySelectorAll("[data-filter]")];
    let active = "todos";

    const update = () => {
      const query = fold(search?.value.trim());
      let count = 0;
      cards.forEach(card => {
        const categories = (card.dataset.categories || "").split(/\s+/);
        const matchesCategory = active === "todos" || categories.includes(active);
        const matchesQuery = !query || fold(`${card.dataset.title} ${card.textContent}`).includes(query);
        card.hidden = !(matchesCategory && matchesQuery);
        if (!card.hidden) count += 1;
      });
      if (output) output.textContent = `${count} ${count === 1 ? "juego" : "juegos"}`;
      if (empty) empty.hidden = count !== 0;
    };

    filters.forEach(button => button.addEventListener("click", () => {
      active = button.dataset.filter;
      filters.forEach(item => item.setAttribute("aria-pressed", String(item === button)));
      update();
    }));
    search?.addEventListener("input", () => {
      if (search.value.trim() && active !== "todos") {
        active = "todos";
        filters.forEach(item => item.setAttribute("aria-pressed", String(item.dataset.filter === "todos")));
      }
      update();
    });
    cards.forEach(card => card.addEventListener("click", () => rememberGame({
      id: card.dataset.gameCard,
      title: card.dataset.title,
      href: card.getAttribute("href")
    })));

    document.querySelectorAll("[data-random-game]").forEach(button => button.addEventListener("click", () => {
      const available = cards.filter(card => !card.hidden);
      const selected = available[Math.floor(Math.random() * available.length)] || cards[Math.floor(Math.random() * cards.length)];
      if (!selected) return;
      rememberGame({ id: selected.dataset.gameCard, title: selected.dataset.title, href: selected.getAttribute("href") });
      location.href = selected.getAttribute("href");
    }));
    update();
    renderRecent(cards);
  }

  function renderRecent(cards) {
    const section = document.getElementById("recentSection");
    const list = document.getElementById("recentGames");
    if (!section || !list) return;
    const byId = new Map(cards.map(card => [card.dataset.gameCard, card]));
    const recent = read().recent.filter(item => byId.has(item.id)).slice(0, 3);
    if (!recent.length) { section.hidden = true; return; }
    section.hidden = false;
    list.innerHTML = recent.map(item => {
      const source = byId.get(item.id);
      return `<a class="recent-game" href="${source.getAttribute("href")}" data-recent-id="${item.id}"><span>${source.querySelector(".game-icon")?.textContent || "J"}</span><div><small>JUGADO RECIENTEMENTE</small><strong>${escapeHtml(source.dataset.title)}</strong></div><b>Continuar →</b></a>`;
    }).join("");
    list.querySelectorAll("[data-recent-id]").forEach(link => link.addEventListener("click", () => {
      const source = byId.get(link.dataset.recentId);
      rememberGame({ id: source.dataset.gameCard, title: source.dataset.title, href: source.getAttribute("href") });
    }));
  }

  function initSettings() {
    const dialog = document.getElementById("settingsDialog");
    if (!dialog) return;
    const form = document.getElementById("settingsForm");
    const name = document.getElementById("playerName");
    const sound = document.getElementById("soundEnabled");
    const haptics = document.getElementById("hapticsEnabled");
    const sync = () => {
      const data = read();
      name.value = data.name;
      sound.checked = data.sound;
      haptics.checked = data.haptics;
    };
    document.querySelectorAll("[data-open-settings]").forEach(button => button.addEventListener("click", () => { sync(); dialog.showModal(); }));
    document.querySelectorAll("[data-close-settings]").forEach(button => button.addEventListener("click", () => dialog.close()));
    form?.addEventListener("submit", event => {
      event.preventDefault();
      savePreferences({ name: name.value, sound: sound.checked, haptics: haptics.checked });
      dialog.close();
      haptic(22);
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function init() {
    migrateName();
    initCatalog();
    initSettings();
    const game = document.body?.dataset.game;
    if (game && game !== "inicio") rememberGame({
      id: game,
      title: document.body.dataset.gameTitle || document.title.split("—")[0].trim(),
      href: location.pathname.split("/").pop() || "index.html"
    });
    document.addEventListener("click", event => {
      if (event.target.closest("[data-haptic]")) haptic(16);
    });
  }

  window.SalaCeroPrefs = Object.freeze({
    version: "26.1.2",
    get: read,
    getName: () => read().name,
    save: savePreferences,
    rememberGame,
    noteResult,
    haptic,
    beep
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
