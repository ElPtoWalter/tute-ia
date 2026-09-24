(() => {
  "use strict";

  const STORAGE_KEY = "salaCeroStatsV26";
  const VERSION = 26;
  const CATALOG = [
    ["tute", "Tute", "T", ["tute.html", "local.html", "multi.html"]],
    ["brisca", "Brisca", "B", ["brisca.html"]],
    ["generala", "Generala", "G", ["generala.html"]],
    ["chinchon", "Chinchón", "C", ["chinchon.html"]],
    ["escoba", "Escoba", "15", ["escoba.html"]],
    ["culo", "Culo", "P", ["culo.html"]],
    ["poker", "Póker", "♠", ["poker.html"]],
    ["es-un-10", "Es un 10…", "10", ["es-un-10.html"]],
    ["blackjack", "Blackjack", "21", ["blackjack.html"]],
    ["impostor", "El impostor", "?", ["impostor.html"]],
    ["chao-pescao", "Chao Pescao", "🐟", ["chao-pescao.html"]],
    ["mentiroso-dados", "Mentiroso de dados", "🎲", ["mentiroso-dados.html"]],
    ["siete-media", "7 y Media", "7½", ["siete-media.html"]],
    ["la-bomba", "La Bomba", "💣", ["la-bomba.html"]],
    ["quien-mas-probable", "¿Quién es más probable?", "👉", ["quien-mas-probable.html"]],
    ["mentiroso-cartas", "El Mentiroso", "🂠", ["mentiroso-cartas.html"]],
    ["presidente", "Presidente", "👑", ["presidente.html"]],
    ["piramide", "La Pirámide", "△", ["piramide.html"]],
    ["tabu", "Tabú de Antón", "🚫", ["tabu.html"]],
    ["password", "Password", "🔐", ["password.html"]],
    ["ruleta-caos", "Ruleta del Caos", "🎡", ["ruleta-caos.html"]],
    ["juicio-anton", "El Juicio de Antón", "⚖", ["juicio-anton.html"]]
  ].map(([id, name, icon, pages]) => ({ id, name, icon, pages }));
  const BY_ID = Object.fromEntries(CATALOG.map(game => [game.id, game]));
  const BY_PAGE = Object.fromEntries(CATALOG.flatMap(game => game.pages.map(page => [page, game.id])));
  const LEGACY_IDS = ["tute", "generala", "chinchon", "escoba", "culo", "poker", "blackjack", "impostor", "brisca"];

  let active = null;
  let lastTick = Date.now();
  let saveTimer = 0;
  let lastResult = { signature: "", at: 0 };
  let importingLegacy = false;

  function emptyGame() {
    return { opens: 0, sessions: 0, completed: 0, wins: 0, losses: 0, seconds: 0, bestScore: 0, lastPlayed: "", lastResult: "" };
  }

  function defaultData() {
    return {
      version: VERSION,
      createdAt: new Date().toISOString(),
      sessions: 0,
      completed: 0,
      wins: 0,
      losses: 0,
      streak: 0,
      bestStreak: 0,
      seconds: 0,
      perGame: Object.fromEntries(CATALOG.map(game => [game.id, emptyGame()])),
      perPlayer: {},
      history: [],
      legacyImported: false
    };
  }

  function merge(raw) {
    const base = defaultData();
    const data = { ...base, ...(raw || {}) };
    data.perGame = Object.fromEntries(CATALOG.map(game => [game.id, { ...emptyGame(), ...(raw?.perGame?.[game.id] || {}) }]));
    data.perPlayer = raw?.perPlayer && typeof raw.perPlayer === "object" ? raw.perPlayer : {};
    data.history = Array.isArray(raw?.history) ? raw.history.slice(0, 60) : [];
    data.version = VERSION;
    return data;
  }

  function read() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch (_) {}
    const data = merge(raw);
    if (!data.legacyImported && !importingLegacy) {
      importingLegacy = true;
      try { importLegacy(data); } finally { importingLegacy = false; }
    }
    return data;
  }

  function write(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
  }

  function importLegacy(data) {
    let club = null;
    try { club = JSON.parse(localStorage.getItem("salaCeroClubV18") || "null"); } catch (_) {}
    if (club?.stats) {
      LEGACY_IDS.forEach(id => {
        const game = data.perGame[id] || (data.perGame[id] = emptyGame());
        const stem = id === "brisca" ? "brisca" : id;
        game.completed = Math.max(game.completed, Number(club.stats[`${stem}Games`]) || 0);
        game.sessions = Math.max(game.sessions, game.completed);
        game.wins = Math.max(game.wins, Number(club.stats[`${stem}Wins`]) || 0);
        game.losses = Math.max(game.losses, Math.max(0, game.completed - game.wins));
      });
      data.completed = Math.max(data.completed, Number(club.stats.games) || 0);
      data.sessions = Math.max(data.sessions, data.completed);
      data.wins = Math.max(data.wins, Number(club.stats.wins) || 0);
      data.losses = Math.max(data.losses, Number(club.stats.losses) || 0);
      data.streak = Math.max(data.streak, Number(club.stats.streak) || 0);
      data.bestStreak = Math.max(data.bestStreak, Number(club.stats.bestStreak) || 0);
    }
    data.legacyImported = true;
    write(data);
  }

  function currentGameId() {
    const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    const explicit = document.body?.dataset.game;
    return BY_ID[explicit] ? explicit : BY_PAGE[page] || null;
  }

  function profileName() {
    return String(window.SalaCeroClub?.getData?.().profile?.name || "Jugador").trim().slice(0, 24) || "Jugador";
  }

  function playerKey(name) {
    return String(name || "Jugador").trim().toLocaleLowerCase("es-ES").replace(/[^a-záéíóúüñ0-9]+/g, "-").replace(/^-|-$/g, "") || "jugador";
  }

  function ensurePlayer(data, name) {
    const key = playerKey(name);
    if (!data.perPlayer[key]) data.perPlayer[key] = { name: String(name || "Jugador").slice(0, 24), sessions: 0, completed: 0, wins: 0, seconds: 0, lastPlayed: "" };
    return data.perPlayer[key];
  }

  function openCurrentGame() {
    const id = currentGameId();
    if (!id) return;
    const now = new Date().toISOString();
    const data = read();
    data.perGame[id].opens += 1;
    data.perGame[id].lastPlayed = now;
    active = { id, started: false, completed: false, player: profileName() };
    lastTick = Date.now();
    write(data);
  }

  function startSession() {
    if (!active || active.started) return;
    active.started = true;
    lastTick = Date.now();
    const data = read();
    const game = data.perGame[active.id];
    game.sessions += 1;
    game.lastPlayed = new Date().toISOString();
    data.sessions += 1;
    const player = ensurePlayer(data, active.player);
    player.sessions += 1;
    player.lastPlayed = game.lastPlayed;
    write(data);
    render(data);
  }

  function tick() {
    if (!active?.started || document.visibilityState === "hidden") { lastTick = Date.now(); return; }
    const now = Date.now();
    const seconds = Math.min(60, Math.max(0, Math.round((now - lastTick) / 1000)));
    lastTick = now;
    if (!seconds) return;
    const data = read();
    data.seconds += seconds;
    data.perGame[active.id].seconds += seconds;
    ensurePlayer(data, active.player).seconds += seconds;
    write(data);
  }

  function normalizeGame(id) {
    const aliases = { "siete-media": "siete-media", "esun10": "es-un-10", "mentiroso": "mentiroso-cartas" };
    const normalized = aliases[id] || id;
    return BY_ID[normalized] ? normalized : currentGameId();
  }

  function recordResult(event = {}) {
    const id = normalizeGame(String(event.game || ""));
    if (!id) return null;
    if (!active) active = { id, started: false, completed: false, player: profileName() };
    if (active.id === id) startSession();
    tick();

    const score = Math.max(0, Number(event.score) || 0);
    const won = event.won === true;
    const local = Boolean(event.local || event.mode === "local");
    const signature = [id, score, won, local, event.variant || ""].join("|");
    const nowMs = Date.now();
    if (lastResult.signature === signature && nowMs - lastResult.at < 1200) return read();
    lastResult = { signature, at: nowMs };

    const now = new Date(nowMs).toISOString();
    const data = read();
    const game = data.perGame[id];
    game.completed += 1;
    game.bestScore = Math.max(game.bestScore, score);
    game.lastPlayed = now;
    game.lastResult = local ? "local" : won ? "victoria" : "derrota";
    data.completed += 1;

    if (!local && typeof event.won === "boolean") {
      if (won) {
        game.wins += 1;
        data.wins += 1;
        data.streak += 1;
        data.bestStreak = Math.max(data.bestStreak, data.streak);
      } else {
        game.losses += 1;
        data.losses += 1;
        data.streak = 0;
      }
    }

    const names = Array.isArray(event.players) && event.players.length ? event.players : [active?.player || profileName()];
    names.forEach((entry, index) => {
      const name = typeof entry === "string" ? entry : entry?.name;
      const player = ensurePlayer(data, name || `Jugador ${index + 1}`);
      player.completed += 1;
      player.lastPlayed = now;
      if ((!local && index === 0 && won) || entry?.won) player.wins += 1;
    });

    data.history.unshift({ at: now, game: id, score, won, local, mode: String(event.mode || "solo"), variant: String(event.variant || "") });
    data.history = data.history.slice(0, 60);
    write(data);
    render(data);
    window.dispatchEvent(new CustomEvent("sala-cero:stats-updated", { detail: { data, event: { ...event, game: id } } }));
    return data;
  }

  function summary(source = read()) {
    const ranked = CATALOG.map(meta => ({ ...meta, ...source.perGame[meta.id] }))
      .sort((a, b) => b.sessions - a.sessions || b.seconds - a.seconds || b.opens - a.opens);
    const favorite = ranked.find(game => game.sessions || game.opens) || null;
    return {
      catalogSize: CATALOG.length,
      sessions: source.sessions,
      completed: source.completed,
      wins: source.wins,
      losses: source.losses,
      streak: source.streak,
      bestStreak: source.bestStreak,
      seconds: source.seconds,
      uniqueGames: ranked.filter(game => game.sessions > 0 || game.completed > 0).length,
      favorite,
      ranked
    };
  }

  function formatDuration(seconds) {
    const total = Math.max(0, Number(seconds) || 0);
    if (total < 60) return `${total}s`;
    const minutes = Math.floor(total / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} h ${rest} min` : `${hours} h`;
  }

  function render(source = read()) {
    const info = summary(source);
    const values = {
      "[data-global-sessions]": info.sessions,
      "[data-global-completed]": info.sessions,
      "[data-global-wins]": info.wins,
      "[data-global-streak]": info.streak,
      "[data-global-best-streak]": info.bestStreak,
      "[data-global-time]": formatDuration(info.seconds),
      "[data-global-favorite]": info.favorite?.name || "—",
      "[data-global-unique]": `${info.uniqueGames} / ${CATALOG.length}`
    };
    Object.entries(values).forEach(([selector, value]) => document.querySelectorAll(selector).forEach(element => { element.textContent = String(value); }));

    document.querySelectorAll("[data-global-game-table]").forEach(container => {
      const games = info.ranked.filter(game => game.sessions || game.completed).slice(0, 10);
      container.innerHTML = games.length ? games.map(game => `<div class="club-history-row"><span>${game.icon}</span><div><strong>${escapeHtml(game.name)}</strong><small>${game.sessions} sesiones · ${game.completed} finalizadas · ${formatDuration(game.seconds)}</small></div><b>${game.wins} V</b></div>`).join("") : `<div class="club-empty">Empieza una partida y aquí aparecerá la actividad de todo el catálogo.</div>`;
    });

    document.querySelectorAll("[data-global-player-table]").forEach(container => {
      const players = Object.values(source.perPlayer).sort((a, b) => b.completed - a.completed || b.seconds - a.seconds).slice(0, 8);
      container.innerHTML = players.length ? players.map((player, index) => `<div class="club-history-row"><span>${index + 1}</span><div><strong>${escapeHtml(player.name)}</strong><small>${player.completed} partidas · ${player.wins} victorias</small></div><b>${formatDuration(player.seconds)}</b></div>`).join("") : `<div class="club-empty">Las estadísticas por jugador aparecerán al completar partidas.</div>`;
    });

    document.querySelectorAll("[data-global-recent]").forEach(container => {
      container.innerHTML = source.history.length ? source.history.slice(0, 8).map(item => { const meta = BY_ID[item.game] || { icon: "◆", name: item.game }; return `<div class="club-history-row"><span>${meta.icon}</span><div><strong>${escapeHtml(meta.name)}</strong><small>${item.local ? "Partida local" : item.won ? "Victoria" : "Partida completada"}${item.score ? ` · ${item.score} puntos` : ""}</small></div><time>${formatDate(item.at)}</time></div>`; }).join("") : `<div class="club-empty">Todavía no hay partidas registradas en la v26.</div>`;
    });
  }

  function formatDate(value) {
    try { return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit" }).format(new Date(value)); } catch (_) { return ""; }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = window.setTimeout(tick, 120);
  }

  document.addEventListener("DOMContentLoaded", () => {
    openCurrentGame();
    render();
    if (active) {
      document.addEventListener("pointerdown", startSession, { once: true, passive: true });
      document.addEventListener("keydown", startSession, { once: true });
      document.addEventListener("click", scheduleSave, { passive: true });
      window.setInterval(tick, 15000);
    }
  });
  document.addEventListener("visibilitychange", tick);
  window.addEventListener("pagehide", tick);

  window.SalaCeroStats = Object.freeze({
    version: VERSION,
    catalog: CATALOG.map(game => ({ ...game, pages: [...game.pages] })),
    getData: read,
    getSummary: () => summary(read()),
    recordResult,
    markStarted: startSession,
    render
  });
})();
