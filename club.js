(() => {
  "use strict";

  const STORAGE_KEY = "salaCeroClubV18";
  const DAY_REWARD = 70;
  const ACHIEVEMENTS = [
    { id: "welcome", icon: "♣", title: "Bienvenido al club", text: "Crea tu perfil de Sala Cero.", test: () => true },
    { id: "first_game", icon: "◆", title: "Primera mesa", text: "Termina tu primera partida.", test: data => data.stats.games >= 1 },
    { id: "first_win", icon: "★", title: "Primera victoria", text: "Gana una partida contra la IA.", test: data => data.stats.wins >= 1 },
    { id: "tute_win", icon: "T", title: "As de la mesa", text: "Gana una partida de Tute.", test: data => data.stats.tuteWins >= 1 },
    { id: "generala_finish", icon: "G", title: "Cinco dados", text: "Completa una partida de Generala.", test: data => data.stats.generalaGames >= 1 },
    { id: "generala_180", icon: "⚄", title: "Planilla de honor", text: "Alcanza 180 puntos en Generala.", test: data => data.stats.generalaBestScore >= 180 },
    { id: "streak3", icon: "♛", title: "En racha", text: "Consigue tres victorias consecutivas.", test: data => data.stats.bestStreak >= 3 },
    { id: "veteran10", icon: "10", title: "Habitual de Sala Cero", text: "Termina diez partidas.", test: data => data.stats.games >= 10 },
    { id: "two_tables", icon: "∞", title: "Jugador completo", text: "Juega al Tute y a la Generala.", test: data => data.stats.tuteGames >= 1 && data.stats.generalaGames >= 1 },
    { id: "served", icon: "✦", title: "Golpe de fortuna", text: "Consigue una Generala servida.", test: data => data.stats.generalaServed >= 1 }
  ];

  const THEMES = [
    { id: "emerald", label: "Verde club", level: 1, accent: "#f0cf83", surface: "#071611" },
    { id: "burgundy", label: "Burdeos clásico", level: 2, accent: "#efc680", surface: "#240b10" },
    { id: "midnight", label: "Azul nocturno", level: 3, accent: "#d8c792", surface: "#08131f" },
    { id: "royal", label: "Salón real", level: 5, accent: "#f7d37f", surface: "#17100a" }
  ];

  const AVATARS = ["♠", "♣", "♦", "★", "♛", "⚄", "T", "G"];

  function defaultData() {
    return {
      version: 18,
      profile: { name: "Eduardo", avatar: "♠" },
      xp: 0,
      theme: "emerald",
      stats: {
        games: 0, wins: 0, losses: 0, streak: 0, bestStreak: 0,
        tuteGames: 0, tuteWins: 0, generalaGames: 0, generalaWins: 0,
        generalaBestScore: 0, generalaServed: 0, localGames: 0
      },
      achievements: {},
      daily: { date: "", counters: {}, claimed: {} },
      legacyImported: false,
      history: []
    };
  }

  function read() {
    let data;
    try { data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch (_) { data = null; }
    data = merge(defaultData(), data || {});
    if (!data.legacyImported) importLegacy(data);
    resetDaily(data);
    unlockAchievements(data, false);
    write(data);
    return data;
  }

  function write(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
  }

  function merge(base, incoming) {
    const output = { ...base, ...incoming };
    output.profile = { ...base.profile, ...(incoming.profile || {}) };
    output.stats = { ...base.stats, ...(incoming.stats || {}) };
    output.achievements = { ...base.achievements, ...(incoming.achievements || {}) };
    output.daily = { ...base.daily, ...(incoming.daily || {}) };
    output.daily.counters = { ...(incoming.daily?.counters || {}) };
    output.daily.claimed = { ...(incoming.daily?.claimed || {}) };
    output.history = Array.isArray(incoming.history) ? incoming.history : [];
    return output;
  }

  function importLegacy(data) {
    try {
      const legacy = JSON.parse(localStorage.getItem("tuteIaStats") || "{}");
      data.stats.tuteGames = Math.max(data.stats.tuteGames, Number(legacy.matchesPlayed) || 0);
      data.stats.tuteWins = Math.max(data.stats.tuteWins, Number(legacy.matchesWon) || 0);
      data.stats.games = Math.max(data.stats.games, data.stats.tuteGames);
      data.stats.wins = Math.max(data.stats.wins, data.stats.tuteWins);
      data.stats.losses = Math.max(0, data.stats.games - data.stats.wins);
      data.xp = Math.max(data.xp, data.stats.games * 20 + data.stats.wins * 35);
    } catch (_) {}
    try {
      const prefs = JSON.parse(localStorage.getItem("salaCeroGeneralaPrefsV17") || localStorage.getItem("salaCeroGeneralaPrefsV16") || "{}");
      if (prefs.name && data.profile.name === "Eduardo") data.profile.name = String(prefs.name).slice(0, 18);
    } catch (_) {}
    data.legacyImported = true;
  }

  function todayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }

  function resetDaily(data) {
    const key = todayKey();
    if (data.daily.date === key) return;
    data.daily = { date: key, counters: { games: 0, wins: 0, tute: 0, generala: 0 }, claimed: {} };
  }

  function dailyDefinitions(data) {
    const dayNumber = Math.floor(new Date(`${data.daily.date}T12:00:00`).getTime() / 86400000);
    const game = dayNumber % 2 === 0 ? "tute" : "generala";
    return [
      { id: "play", title: "Abrir la sala", text: "Termina una partida en cualquier juego.", target: 1, value: data.daily.counters.games || 0, reward: DAY_REWARD },
      { id: "win", title: "Mandar en la mesa", text: "Consigue una victoria contra la IA.", target: 1, value: data.daily.counters.wins || 0, reward: 100 },
      { id: game, title: game === "tute" ? "Noche de cartas" : "Cinco dados", text: game === "tute" ? "Juega una partida de Tute." : "Completa una partida de Generala.", target: 1, value: data.daily.counters[game] || 0, reward: 80 }
    ];
  }

  function levelForXp(xp) { return Math.floor(Math.max(0, xp) / 250) + 1; }
  function levelProgress(xp) { return { current: xp % 250, target: 250, percent: Math.min(100, Math.round((xp % 250) / 250 * 100)) }; }

  function recordMatch(event = {}) {
    const data = read();
    const game = event.game === "generala" ? "generala" : "tute";
    const local = Boolean(event.local || event.mode === "local");
    const won = Boolean(event.won) && !local;
    const score = Math.max(0, Number(event.score) || 0);

    data.stats.games += 1;
    data.stats[`${game}Games`] += 1;
    data.daily.counters.games = (data.daily.counters.games || 0) + 1;
    data.daily.counters[game] = (data.daily.counters[game] || 0) + 1;
    if (local) data.stats.localGames += 1;

    if (won) {
      data.stats.wins += 1;
      data.stats[`${game}Wins`] += 1;
      data.stats.streak += 1;
      data.stats.bestStreak = Math.max(data.stats.bestStreak, data.stats.streak);
      data.daily.counters.wins = (data.daily.counters.wins || 0) + 1;
    } else if (!local) {
      data.stats.losses += 1;
      data.stats.streak = 0;
    }

    if (game === "generala") {
      data.stats.generalaBestScore = Math.max(data.stats.generalaBestScore, score);
      if (event.servedGenerala) data.stats.generalaServed += 1;
    }

    let xp = 25;
    if (won) xp += 45;
    if (local) xp += 10;
    if (game === "generala") xp += Math.min(35, Math.floor(score / 20));
    if (won && (event.special === "tute" || event.special === "capote")) xp += 25;
    data.xp += xp;

    data.history.unshift({
      at: new Date().toISOString(), game, won, local, score,
      mode: String(event.mode || "solo"), variant: String(event.variant || "")
    });
    data.history = data.history.slice(0, 30);

    const unlocked = unlockAchievements(data, true);
    write(data);
    applyTheme(data.theme);
    renderAll();
    showClubToast(`+${xp} XP · ${game === "tute" ? "Tute" : "Generala"}`, unlocked);
    window.dispatchEvent(new CustomEvent("sala-cero:updated", { detail: { data, unlocked } }));
    return { data, xp, unlocked };
  }

  function unlockAchievements(data, notify) {
    const unlocked = [];
    ACHIEVEMENTS.forEach(item => {
      if (data.achievements[item.id] || !item.test(data)) return;
      data.achievements[item.id] = new Date().toISOString();
      data.xp += item.id === "welcome" ? 25 : 50;
      if (notify) unlocked.push(item);
    });
    return unlocked;
  }

  function claimDaily(id) {
    const data = read();
    const challenge = dailyDefinitions(data).find(item => item.id === id);
    if (!challenge || challenge.value < challenge.target || data.daily.claimed[id]) return false;
    data.daily.claimed[id] = true;
    data.xp += challenge.reward;
    const unlocked = unlockAchievements(data, true);
    write(data);
    renderAll();
    showClubToast(`Reto cobrado · +${challenge.reward} XP`, unlocked);
    return true;
  }

  function updateProfile(profile = {}) {
    const data = read();
    const name = String(profile.name || data.profile.name).trim().slice(0, 18);
    const avatar = AVATARS.includes(profile.avatar) ? profile.avatar : data.profile.avatar;
    data.profile = { name: name || "Jugador", avatar };
    write(data);
    renderAll();
    return data;
  }

  function setTheme(id) {
    const data = read();
    const theme = THEMES.find(item => item.id === id);
    if (!theme || levelForXp(data.xp) < theme.level) return false;
    data.theme = id;
    write(data);
    applyTheme(id);
    renderAll();
    return true;
  }

  function applyTheme(id) {
    const theme = THEMES.find(item => item.id === id) || THEMES[0];
    document.documentElement.dataset.clubTheme = theme.id;
    document.documentElement.style.setProperty("--club-accent", theme.accent);
    document.documentElement.style.setProperty("--club-surface", theme.surface);
  }

  function renderAll() {
    const data = read();
    const level = levelForXp(data.xp);
    const progress = levelProgress(data.xp);
    applyTheme(data.theme);

    document.querySelectorAll("[data-club-name]").forEach(el => el.textContent = data.profile.name);
    document.querySelectorAll("[data-club-avatar]").forEach(el => el.textContent = data.profile.avatar);
    document.querySelectorAll("[data-club-level]").forEach(el => el.textContent = String(level));
    document.querySelectorAll("[data-club-xp]").forEach(el => el.textContent = `${data.xp} XP`);
    document.querySelectorAll("[data-club-games]").forEach(el => el.textContent = String(data.stats.games));
    document.querySelectorAll("[data-club-wins]").forEach(el => el.textContent = String(data.stats.wins));
    document.querySelectorAll("[data-club-streak]").forEach(el => el.textContent = String(data.stats.streak));
    document.querySelectorAll("[data-club-best-generala]").forEach(el => el.textContent = String(data.stats.generalaBestScore));
    document.querySelectorAll("[data-club-progress]").forEach(el => el.style.setProperty("--progress", `${progress.percent}%`));
    document.querySelectorAll("[data-club-progress-text]").forEach(el => el.textContent = `${progress.current} / ${progress.target} XP`);

    renderChallenges(data);
    renderAchievements(data);
    renderThemes(data);
    renderHistory(data);
    renderCompactChips(data, level);
  }

  function renderChallenges(data) {
    document.querySelectorAll("[data-club-challenges]").forEach(container => {
      container.innerHTML = dailyDefinitions(data).map(item => {
        const complete = item.value >= item.target;
        const claimed = Boolean(data.daily.claimed[item.id]);
        const pct = Math.min(100, Math.round(item.value / item.target * 100));
        return `<article class="club-challenge ${complete ? "complete" : ""} ${claimed ? "claimed" : ""}">
          <span class="club-challenge-icon">${claimed ? "✓" : item.id === "win" ? "★" : item.id === "tute" ? "T" : item.id === "generala" ? "G" : "◆"}</span>
          <div><small>RETO DIARIO</small><strong>${item.title}</strong><p>${item.text}</p><div class="club-mini-progress"><i style="width:${pct}%"></i></div><em>${Math.min(item.value, item.target)} / ${item.target}</em></div>
          <button type="button" data-claim-daily="${item.id}" ${!complete || claimed ? "disabled" : ""}>${claimed ? "Cobrado" : `+${item.reward} XP`}</button>
        </article>`;
      }).join("");
      container.querySelectorAll("[data-claim-daily]").forEach(button => button.addEventListener("click", () => claimDaily(button.dataset.claimDaily)));
    });
  }

  function renderAchievements(data) {
    document.querySelectorAll("[data-club-achievements]").forEach(container => {
      container.innerHTML = ACHIEVEMENTS.map(item => {
        const unlocked = Boolean(data.achievements[item.id]);
        return `<article class="club-achievement ${unlocked ? "unlocked" : "locked"}"><span>${unlocked ? item.icon : "?"}</span><div><strong>${item.title}</strong><p>${item.text}</p></div><small>${unlocked ? "DESBLOQUEADO" : "BLOQUEADO"}</small></article>`;
      }).join("");
    });
  }

  function renderThemes(data) {
    const level = levelForXp(data.xp);
    document.querySelectorAll("[data-club-themes]").forEach(container => {
      container.innerHTML = THEMES.map(theme => {
        const unlocked = level >= theme.level;
        const active = data.theme === theme.id;
        return `<button type="button" class="club-theme-card ${active ? "active" : ""}" data-theme-id="${theme.id}" ${!unlocked ? "disabled" : ""}>
          <i style="--swatch:${theme.surface};--accent:${theme.accent}"></i><span><strong>${theme.label}</strong><small>${unlocked ? active ? "ACTIVO" : "USAR" : `NIVEL ${theme.level}`}</small></span>
        </button>`;
      }).join("");
      container.querySelectorAll("[data-theme-id]").forEach(button => button.addEventListener("click", () => setTheme(button.dataset.themeId)));
    });
  }

  function renderHistory(data) {
    document.querySelectorAll("[data-club-history]").forEach(container => {
      if (!data.history.length) {
        container.innerHTML = `<div class="club-empty">Todavía no hay partidas registradas en el club.</div>`;
        return;
      }
      container.innerHTML = data.history.slice(0, 8).map(item => `<div class="club-history-row"><span>${item.game === "tute" ? "T" : "G"}</span><div><strong>${item.game === "tute" ? "Tute" : "Generala"}</strong><small>${item.local ? "Partida local" : item.won ? "Victoria" : "Derrota"}${item.score ? ` · ${item.score} puntos` : ""}</small></div><time>${formatDate(item.at)}</time></div>`).join("");
    });
  }

  function renderCompactChips(data, level) {
    document.querySelectorAll("[data-club-chip]").forEach(chip => {
      chip.innerHTML = `<span class="club-chip-avatar">${data.profile.avatar}</span><span><strong>${escapeHtml(data.profile.name)}</strong><small>NIVEL ${level} · ${data.xp} XP</small></span>`;
    });
  }

  function formatDate(iso) {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit" }).format(date);
  }

  function showClubToast(message, unlocked = []) {
    if (!document.body) return;
    const toast = document.createElement("div");
    toast.className = "club-toast";
    toast.innerHTML = `<strong>${escapeHtml(message)}</strong>${unlocked.length ? `<small>Logro: ${escapeHtml(unlocked[0].title)}</small>` : ""}`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("visible"));
    setTimeout(() => { toast.classList.remove("visible"); setTimeout(() => toast.remove(), 300); }, 2600);
  }

  function bindGlobalUi() {
    document.addEventListener("click", event => {
      const opener = event.target.closest("[data-club-open]");
      if (opener) document.getElementById("clubProfileDialog")?.showModal();
      const closer = event.target.closest("[data-club-close]");
      if (closer) closer.closest("dialog")?.close();
    });

    const form = document.getElementById("clubProfileForm");
    if (form) {
      const data = read();
      const nameInput = form.querySelector("[name=clubName]");
      if (nameInput) nameInput.value = data.profile.name;
      form.querySelectorAll("[name=clubAvatar]").forEach(input => input.checked = input.value === data.profile.avatar);
      form.addEventListener("submit", event => {
        event.preventDefault();
        updateProfile({ name: nameInput?.value, avatar: form.querySelector("[name=clubAvatar]:checked")?.value });
        form.closest("dialog")?.close();
        showClubToast("Perfil actualizado");
      });
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  document.addEventListener("DOMContentLoaded", () => {
    read();
    bindGlobalUi();
    renderAll();
    if (location.hash === "#perfil") document.getElementById("clubProfileDialog")?.showModal();
  });

  window.SalaCeroClub = {
    getData: read,
    recordMatch,
    updateProfile,
    claimDaily,
    setTheme,
    render: renderAll,
    achievements: ACHIEVEMENTS,
    themes: THEMES,
    avatars: AVATARS
  };
})();
