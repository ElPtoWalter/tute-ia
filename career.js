(() => {
  "use strict";

  const STORAGE_KEY = "salaCeroCareerV19";
  const PENDING_KEY = "salaCeroCareerPendingV19";

  const RIVALS = {
    prudencio: {
      id: "prudencio", name: "Don Prudencio", monogram: "DP", personality: "conservative",
      label: "Conservador", difficulty: "easy", strength: 1,
      motto: "Primero asegurar, después arriesgar.",
      description: "Protege los puntos, evita sacrificios y suele cerrar una jugada antes de exponerse."
    },
    lola: {
      id: "lola", name: "Lola Relámpago", monogram: "LR", personality: "aggressive",
      label: "Agresiva", difficulty: "normal", strength: 2,
      motto: "La mesa es de quien se atreve.",
      description: "Persigue bazas, pókeres y generalas incluso cuando la opción segura ya está disponible."
    },
    tahur: {
      id: "tahur", name: "El Tahúr", monogram: "ET", personality: "unpredictable",
      label: "Imprevisible", difficulty: "normal", strength: 2,
      motto: "Nadie puede leer una jugada que ni yo he decidido.",
      description: "Cambia de plan, fuerza decisiones extrañas y convierte cada encuentro en una partida distinta."
    },
    virtud: {
      id: "virtud", name: "Doña Virtud", monogram: "DV", personality: "calculating",
      label: "Calculadora", difficulty: "hard", strength: 3,
      motto: "Toda carta deja una pista.",
      description: "Cuenta recursos, protege parejas de cante y minimiza los puntos que entrega."
    },
    fortuna: {
      id: "fortuna", name: "Doña Fortuna", monogram: "DF", personality: "balanced",
      label: "Equilibrada", difficulty: "hard", strength: 3,
      motto: "La suerte ayuda a quien sabe esperar.",
      description: "Alterna seguridad y ambición. Es la rival más completa de la liga de dados."
    },
    maestro: {
      id: "maestro", name: "Maestro Cero", monogram: "M0", personality: "master",
      label: "Maestro", difficulty: "hard", strength: 4,
      motto: "No juegas contra mí: juegas contra todo lo que has aprendido.",
      description: "Rival final de Sala Cero. Combina lectura, riesgo y memoria con muy pocos errores."
    }
  };

  const COMPETITIONS = {
    initiation: {
      id: "initiation", order: 1, type: "series", icon: "◆", title: "Circuito de iniciación",
      subtitle: "Cuatro mesas para entrar en la competición", unlock: () => true,
      description: "Un recorrido mixto por Tute y Generala. Terminarlo abre las competiciones especializadas.",
      reward: { trophy: "bronze", xp: 250, unlocks: ["felt_burgundy"] },
      matches: [
        { game: "generala", rival: "prudencio", difficulty: "easy", label: "Mesa 1 · Primeros dados" },
        { game: "tute", rival: "lola", difficulty: "easy", variant: "house", label: "Mesa 2 · Naipes al ataque" },
        { game: "generala", rival: "tahur", difficulty: "normal", label: "Mesa 3 · Nada es seguro" },
        { game: "tute", rival: "virtud", difficulty: "normal", variant: "fournier", label: "Mesa 4 · Examen del club" }
      ]
    },
    diceLeague: {
      id: "diceLeague", order: 2, type: "league", icon: "⚄", title: "Liga de Generala",
      subtitle: "Cinco jornadas y una clasificación completa",
      unlock: data => data.competitions.initiation.status === "completed",
      description: "Suma tres puntos por victoria. El resto de encuentros se simula entre los rivales del club.",
      reward: { trophy: "dice", xp: 400, unlocks: ["dice_ebony", "cup_royal"] },
      matches: [
        { game: "generala", rival: "prudencio", difficulty: "normal", label: "Jornada 1" },
        { game: "generala", rival: "lola", difficulty: "normal", label: "Jornada 2" },
        { game: "generala", rival: "tahur", difficulty: "normal", label: "Jornada 3" },
        { game: "generala", rival: "fortuna", difficulty: "hard", label: "Jornada 4" },
        { game: "generala", rival: "maestro", difficulty: "hard", label: "Jornada 5" }
      ]
    },
    tuteCup: {
      id: "tuteCup", order: 3, type: "cup", icon: "T", title: "Copa de Maestros del Tute",
      subtitle: "Cuartos, semifinal y final",
      unlock: data => data.competitions.initiation.status === "completed",
      description: "Una derrota elimina. Puedes reiniciar la copa y volver a intentarlo sin perder el resto del progreso.",
      reward: { trophy: "cards", xp: 400, unlocks: ["cards_burgundy", "felt_night"] },
      matches: [
        { game: "tute", rival: "lola", difficulty: "normal", variant: "house", label: "Cuartos de final" },
        { game: "tute", rival: "virtud", difficulty: "hard", variant: "fournier", label: "Semifinal" },
        { game: "tute", rival: "maestro", difficulty: "hard", variant: "americano", label: "Final" }
      ]
    },
    grandFinal: {
      id: "grandFinal", order: 4, type: "series", icon: "♛", title: "Campeonato de Sala Cero",
      subtitle: "La prueba definitiva de cartas y dados",
      unlock: data => data.competitions.diceLeague.trophy && data.competitions.tuteCup.trophy,
      description: "Cinco encuentros mixtos. Cuatro victorias conceden la Corona de Sala Cero.",
      reward: { trophy: "crown", xp: 750, unlocks: ["dice_gold", "felt_royal", "cup_champion"] },
      matches: [
        { game: "tute", rival: "virtud", difficulty: "hard", variant: "house", label: "Ronda 1 · Dominio del tapete" },
        { game: "generala", rival: "fortuna", difficulty: "hard", label: "Ronda 2 · Planilla maestra" },
        { game: "tute", rival: "tahur", difficulty: "hard", variant: "habanero", label: "Ronda 3 · Juego incierto" },
        { game: "generala", rival: "maestro", difficulty: "hard", label: "Ronda 4 · Dados de campeón" },
        { game: "tute", rival: "maestro", difficulty: "hard", variant: "americano", label: "Gran final" }
      ]
    }
  };

  const TROPHIES = {
    bronze: { id: "bronze", icon: "◆", title: "Copa de Iniciación", text: "Terminaste el primer circuito con al menos dos victorias." },
    dice: { id: "dice", icon: "⚄", title: "Trofeo de los Cinco Dados", text: "Ganaste la Liga de Generala." },
    cards: { id: "cards", icon: "T", title: "Copa de Maestros", text: "Conquistaste el torneo de Tute sin caer eliminado." },
    crown: { id: "crown", icon: "♛", title: "Corona de Sala Cero", text: "Superaste el campeonato definitivo con cuatro victorias." }
  };

  const COSMETICS = {
    felt: [
      { id: "classic", label: "Verde clásico", type: "felt", unlock: null },
      { id: "burgundy", label: "Burdeos de copa", type: "felt", unlock: "felt_burgundy" },
      { id: "night", label: "Noche de maestros", type: "felt", unlock: "felt_night" },
      { id: "royal", label: "Salón de campeones", type: "felt", unlock: "felt_royal" }
    ],
    dice: [
      { id: "ivory", label: "Marfil clásico", type: "dice", unlock: null },
      { id: "ebony", label: "Ébano de liga", type: "dice", unlock: "dice_ebony" },
      { id: "gold", label: "Dados de campeón", type: "dice", unlock: "dice_gold" }
    ],
    cup: [
      { id: "classic", label: "Cubilete clásico", type: "cup", unlock: null },
      { id: "royal", label: "Cubilete de liga", type: "cup", unlock: "cup_royal" },
      { id: "champion", label: "Cubilete campeón", type: "cup", unlock: "cup_champion" }
    ],
    cards: [
      { id: "classic", label: "Reverso del club", type: "cards", unlock: null },
      { id: "burgundy", label: "Reverso de copa", type: "cards", unlock: "cards_burgundy" }
    ]
  };

  function defaultCompetitionState(id) {
    return {
      id, status: id === "initiation" ? "active" : "locked", stage: 0,
      wins: 0, losses: 0, results: [], trophy: false, best: null,
      standings: id === "diceLeague" ? initialStandings() : null
    };
  }

  function defaultData() {
    return {
      version: 19,
      season: 1,
      rank: "Aspirante",
      careerXp: 0,
      competitions: Object.fromEntries(Object.keys(COMPETITIONS).map(id => [id, defaultCompetitionState(id)])),
      trophies: {},
      unlocks: {},
      equipped: { felt: "classic", dice: "ivory", cup: "classic", cards: "classic" },
      history: [],
      lastSummary: null
    };
  }

  function initialStandings() {
    return ["player", "prudencio", "lola", "tahur", "fortuna", "maestro"].map(id => ({ id, played: 0, wins: 0, losses: 0, points: 0, scored: 0, conceded: 0 }));
  }

  function read() {
    let incoming = null;
    try { incoming = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch (_) {}
    const data = merge(defaultData(), incoming || {});
    normalizeUnlocks(data);
    write(data);
    return data;
  }

  function merge(base, incoming) {
    const data = { ...base, ...incoming };
    data.competitions = { ...base.competitions };
    Object.keys(COMPETITIONS).forEach(id => {
      const fallback = base.competitions[id];
      const previous = incoming.competitions?.[id] || {};
      data.competitions[id] = { ...fallback, ...previous };
      data.competitions[id].results = Array.isArray(previous.results) ? previous.results : [];
      if (id === "diceLeague") {
        data.competitions[id].standings = Array.isArray(previous.standings) && previous.standings.length
          ? previous.standings.map(row => ({ played: 0, wins: 0, losses: 0, points: 0, scored: 0, conceded: 0, ...row }))
          : initialStandings();
      }
    });
    data.trophies = { ...(incoming.trophies || {}) };
    data.unlocks = { ...(incoming.unlocks || {}) };
    data.equipped = { ...base.equipped, ...(incoming.equipped || {}) };
    data.history = Array.isArray(incoming.history) ? incoming.history : [];
    return data;
  }

  function write(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
  }

  function normalizeUnlocks(data) {
    Object.values(COMPETITIONS).forEach(comp => {
      const state = data.competitions[comp.id];
      if (state.status === "completed" || state.status === "eliminated" || state.status === "active") return;
      if (comp.unlock(data)) state.status = "active";
    });
    data.rank = rankFor(data);
  }

  function rankFor(data) {
    const count = Object.values(data.trophies).filter(Boolean).length;
    if (data.trophies.crown) return "Campeón de Sala Cero";
    if (count >= 2) return "Maestro del club";
    if (count >= 1) return "Competidor";
    if (data.competitions.initiation.stage >= 2) return "Aspirante avanzado";
    return "Aspirante";
  }

  function getPending(game) {
    let pending = null;
    try { pending = JSON.parse(localStorage.getItem(PENDING_KEY) || "null"); } catch (_) {}
    if (!pending || pending.consumed) return null;
    if (game && pending.game !== game) return null;
    return pending;
  }

  function clearPending() {
    try { localStorage.removeItem(PENDING_KEY); } catch (_) {}
  }

  function getCompetitionState(id, data = read()) {
    return data.competitions[id] || null;
  }

  function nextMatch(id, data = read()) {
    const comp = COMPETITIONS[id];
    const state = data.competitions[id];
    if (!comp || !state || state.status === "locked" || state.status === "completed") return null;
    if (state.status === "eliminated") return null;
    return comp.matches[state.stage] || null;
  }

  function startMatch(id) {
    const data = read();
    const comp = COMPETITIONS[id];
    const state = data.competitions[id];
    const match = nextMatch(id, data);
    if (!comp || !state || !match) return false;
    const rival = RIVALS[match.rival];
    const pending = {
      token: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      competitionId: id,
      competitionTitle: comp.title,
      stage: state.stage,
      totalStages: comp.matches.length,
      game: match.game,
      rivalId: rival.id,
      name: rival.name,
      personality: rival.personality,
      personalityLabel: rival.label,
      difficulty: match.difficulty || rival.difficulty,
      variant: match.variant || "",
      matchLabel: match.label,
      startedAt: new Date().toISOString(),
      consumed: false
    };
    try { localStorage.setItem(PENDING_KEY, JSON.stringify(pending)); } catch (_) { return false; }
    location.href = `${match.game === "tute" ? "tute.html" : "generala.html"}?career=1`;
    return true;
  }

  function restartCompetition(id) {
    const data = read();
    if (!COMPETITIONS[id] || !COMPETITIONS[id].unlock(data)) return false;
    data.competitions[id] = defaultCompetitionState(id);
    data.competitions[id].status = "active";
    write(data);
    renderAll();
    return true;
  }

  function consumeMatch(event = {}) {
    const pending = getPending(event.game);
    if (!pending || event.local) return null;
    const data = read();
    const comp = COMPETITIONS[pending.competitionId];
    const state = data.competitions[pending.competitionId];
    if (!comp || !state || state.stage !== pending.stage || state.status === "locked") {
      clearPending();
      return null;
    }

    const won = Boolean(event.won);
    const score = Math.max(0, Number(event.score) || 0);
    const opponentScore = Math.max(0, Number(event.opponentScore) || simulatedOpponentScore(pending.game, RIVALS[pending.rivalId], score));
    const result = {
      at: new Date().toISOString(), stage: pending.stage, game: pending.game,
      rivalId: pending.rivalId, rivalName: pending.name, won, score, opponentScore,
      label: pending.matchLabel, variant: pending.variant || event.variant || "",
      special: event.special || ""
    };

    state.results.push(result);
    state.wins += won ? 1 : 0;
    state.losses += won ? 0 : 1;
    state.stage += 1;

    let rewardXp = won ? 90 : 35;
    let trophy = null;
    let competitionFinished = false;
    let standingText = "";

    if (comp.type === "league") {
      updateLeagueStandings(data, pending, result);
      standingText = leaguePositionText(state.standings);
      if (state.stage >= comp.matches.length) {
        competitionFinished = true;
        state.status = "completed";
        const rank = leagueRank(state.standings);
        state.best = state.best === null ? rank : Math.min(state.best, rank);
        if (rank === 1) trophy = awardCompetitionReward(data, comp);
      }
    } else if (comp.type === "cup") {
      if (!won) {
        state.status = "eliminated";
        standingText = "Eliminado. La copa puede reiniciarse desde la Carrera.";
      } else if (state.stage >= comp.matches.length) {
        competitionFinished = true;
        state.status = "completed";
        state.best = 1;
        trophy = awardCompetitionReward(data, comp);
      } else {
        standingText = `Clasificado para ${comp.matches[state.stage].label.toLowerCase()}.`;
      }
    } else {
      if (state.stage >= comp.matches.length) {
        competitionFinished = true;
        state.status = "completed";
        state.best = state.best === null ? state.wins : Math.max(state.best, state.wins);
        const required = comp.id === "grandFinal" ? 4 : 2;
        if (state.wins >= required) trophy = awardCompetitionReward(data, comp);
      } else {
        standingText = `${state.wins} victorias en ${state.stage} encuentros.`;
      }
    }

    if (competitionFinished) rewardXp += trophy ? comp.reward.xp : 120;
    data.careerXp += rewardXp;
    data.rank = rankFor(data);
    data.history.unshift(result);
    data.history = data.history.slice(0, 40);
    normalizeUnlocks(data);

    const summary = buildSummary(comp, state, pending, result, { rewardXp, trophy, competitionFinished, standingText });
    data.lastSummary = summary;
    write(data);
    clearPending();
    document.querySelector(".career-active-banner")?.remove();
    applyCosmetics(data);
    window.SalaCeroClub?.addXp?.(rewardXp, comp.title);
    renderAll();
    setTimeout(() => showResultOverlay(summary), 650);
    window.dispatchEvent(new CustomEvent("sala-cero:career-updated", { detail: { data, summary } }));
    return summary;
  }

  function updateLeagueStandings(data, pending, result) {
    const standings = data.competitions.diceLeague.standings;
    const player = rowFor(standings, "player");
    const rival = rowFor(standings, pending.rivalId);
    registerLeagueGame(player, rival, result.won, result.score, result.opponentScore);

    const round = pending.stage;
    const schedule = [
      [["lola","tahur"],["fortuna","maestro"]],
      [["prudencio","fortuna"],["tahur","maestro"]],
      [["prudencio","maestro"],["lola","fortuna"]],
      [["prudencio","tahur"],["lola","maestro"]],
      [["prudencio","lola"],["tahur","fortuna"]]
    ];
    (schedule[round % schedule.length] || []).forEach(pair => {
      const a = rowFor(standings, pair[0]);
      const b = rowFor(standings, pair[1]);
      const simulated = simulateLeagueGame(RIVALS[pair[0]], RIVALS[pair[1]], round);
      registerLeagueGame(a, b, simulated.aWon, simulated.aScore, simulated.bScore);
    });
  }

  function registerLeagueGame(a, b, aWon, aScore, bScore) {
    if (!a || !b) return;
    a.played += 1; b.played += 1;
    a.scored += aScore; a.conceded += bScore;
    b.scored += bScore; b.conceded += aScore;
    if (aWon) { a.wins += 1; a.points += 3; b.losses += 1; }
    else { b.wins += 1; b.points += 3; a.losses += 1; }
  }

  function rowFor(rows, id) { return rows.find(row => row.id === id); }

  function simulateLeagueGame(a, b, round) {
    const seed = ((round + 1) * 97 + a.strength * 31 + b.strength * 43) % 101;
    const aScore = 118 + a.strength * 15 + (seed % 37);
    const bScore = 118 + b.strength * 15 + ((seed * 7) % 39);
    return { aWon: aScore >= bScore, aScore, bScore };
  }

  function simulatedOpponentScore(game, rival, playerScore) {
    if (game === "generala") return 115 + rival.strength * 18 + ((playerScore + rival.strength * 13) % 31);
    return Math.max(0, rival.strength >= 3 ? 3 : 2);
  }

  function sortedStandings(rows) {
    return [...rows].sort((a, b) => b.points - a.points || (b.scored - b.conceded) - (a.scored - a.conceded) || b.scored - a.scored);
  }

  function leagueRank(rows) {
    return sortedStandings(rows).findIndex(row => row.id === "player") + 1;
  }

  function leaguePositionText(rows) {
    const rank = leagueRank(rows);
    return `${rank}.ª posición provisional en la Liga de Generala.`;
  }

  function awardCompetitionReward(data, comp) {
    const trophyId = comp.reward.trophy;
    if (!data.trophies[trophyId]) {
      data.trophies[trophyId] = new Date().toISOString();
      comp.reward.unlocks.forEach(id => { data.unlocks[id] = true; });
    }
    data.competitions[comp.id].trophy = true;
    return TROPHIES[trophyId];
  }

  function buildSummary(comp, state, pending, result, extra) {
    const difference = Math.abs(result.score - result.opponentScore);
    let decisive;
    if (result.special === "tute") decisive = "Un tute directo decidió el encuentro.";
    else if (result.special === "capote") decisive = "El capote fue el momento decisivo de la mesa.";
    else if (result.game === "generala" && result.score >= 180) decisive = `Planilla sobresaliente: ${result.score} puntos.`;
    else if (difference <= 5) decisive = "La partida se resolvió por un margen mínimo.";
    else decisive = result.won ? "Controlaste el tramo final y aseguraste la victoria." : "El rival aprovechó mejor las últimas decisiones.";

    return {
      at: result.at,
      competitionId: comp.id,
      competitionTitle: comp.title,
      matchLabel: pending.matchLabel,
      rivalName: pending.name,
      won: result.won,
      score: result.score,
      opponentScore: result.opponentScore,
      rewardXp: extra.rewardXp,
      trophy: extra.trophy,
      competitionFinished: extra.competitionFinished,
      standingText: extra.standingText,
      decisive,
      nextAvailable: state.status === "active" && state.stage < comp.matches.length
    };
  }

  function equip(type, id) {
    const data = read();
    const item = COSMETICS[type]?.find(entry => entry.id === id);
    if (!item || (item.unlock && !data.unlocks[item.unlock])) return false;
    data.equipped[type] = id;
    write(data);
    applyCosmetics(data);
    renderAll();
    return true;
  }

  function applyCosmetics(data = read()) {
    const root = document.documentElement;
    root.dataset.careerFelt = data.equipped.felt;
    root.dataset.careerDice = data.equipped.dice;
    root.dataset.careerCup = data.equipped.cup;
    root.dataset.careerCards = data.equipped.cards;
  }

  function getAiConfig(game) {
    const pending = getPending(game);
    if (!pending) return null;
    const rival = RIVALS[pending.rivalId];
    return { ...rival, difficulty: pending.difficulty, variant: pending.variant, competitionTitle: pending.competitionTitle, matchLabel: pending.matchLabel };
  }

  function renderAll() {
    const data = read();
    applyCosmetics(data);
    renderSummary(data);
    renderCompetitions(data);
    renderRivals();
    renderTrophies(data);
    renderCosmetics(data);
    renderCareerHistory(data);
    renderLeague(data);
  }

  function renderSummary(data) {
    document.querySelectorAll("[data-career-rank]").forEach(el => el.textContent = data.rank);
    document.querySelectorAll("[data-career-xp]").forEach(el => el.textContent = `${data.careerXp} PX`);
    document.querySelectorAll("[data-career-trophies-count]").forEach(el => el.textContent = String(Object.values(data.trophies).filter(Boolean).length));
    document.querySelectorAll("[data-career-next]").forEach(container => {
      const next = firstPlayableCompetition(data);
      if (!next) {
        container.innerHTML = `<strong>Temporada completada</strong><small>Repite las competiciones para mejorar tus marcas.</small><a href="career.html">Ver vitrina</a>`;
        return;
      }
      const match = nextMatch(next.id, data);
      const rival = match ? RIVALS[match.rival] : null;
      container.innerHTML = `<strong>${escapeHtml(next.title)}</strong><small>${match ? `${escapeHtml(match.label)} · ${escapeHtml(rival.name)}` : "Disponible para reiniciar"}</small><a href="career.html">Abrir carrera →</a>`;
    });
  }

  function firstPlayableCompetition(data) {
    return Object.values(COMPETITIONS).sort((a, b) => a.order - b.order).find(comp => {
      const state = data.competitions[comp.id];
      return state.status === "active" || state.status === "eliminated";
    }) || null;
  }

  function renderCompetitions(data) {
    document.querySelectorAll("[data-career-competitions]").forEach(container => {
      container.innerHTML = Object.values(COMPETITIONS).sort((a,b) => a.order-b.order).map(comp => competitionCard(comp, data)).join("");
      container.querySelectorAll("[data-career-start]").forEach(button => button.addEventListener("click", () => startMatch(button.dataset.careerStart)));
      container.querySelectorAll("[data-career-restart]").forEach(button => button.addEventListener("click", () => restartCompetition(button.dataset.careerRestart)));
    });
  }

  function competitionCard(comp, data) {
    const state = data.competitions[comp.id];
    const match = nextMatch(comp.id, data);
    const locked = state.status === "locked";
    const completed = state.status === "completed";
    const eliminated = state.status === "eliminated";
    const progress = Math.min(100, Math.round(state.stage / comp.matches.length * 100));
    const rival = match ? RIVALS[match.rival] : null;
    const status = locked ? "BLOQUEADO" : completed ? state.trophy ? "TROFEO CONSEGUIDO" : "COMPLETADO" : eliminated ? "ELIMINADO" : `${state.stage + 1} / ${comp.matches.length}`;
    return `<article class="career-competition ${locked ? "locked" : ""} ${completed ? "completed" : ""} ${eliminated ? "eliminated" : ""}">
      <div class="career-comp-head"><span>${comp.icon}</span><div><small>COMPETICIÓN ${String(comp.order).padStart(2,"0")}</small><h3>${escapeHtml(comp.title)}</h3><p>${escapeHtml(comp.subtitle)}</p></div><b>${status}</b></div>
      <p class="career-comp-description">${escapeHtml(comp.description)}</p>
      <div class="career-comp-progress"><i style="width:${progress}%"></i></div>
      <div class="career-comp-stats"><span><b>${state.wins}</b> victorias</span><span><b>${state.losses}</b> derrotas</span><span><b>${comp.matches.length}</b> encuentros</span></div>
      ${match ? `<div class="career-next-match"><span>${match.game === "tute" ? "T" : "⚄"}</span><div><small>${escapeHtml(match.label)}</small><strong>${escapeHtml(rival.name)}</strong><p>${escapeHtml(rival.label)} · ${difficultyLabel(match.difficulty)}</p></div></div>` : ""}
      <div class="career-comp-actions">
        ${locked ? `<button disabled>Completa la competición anterior</button>` : eliminated ? `<button data-career-restart="${comp.id}">Reiniciar copa</button>` : match ? `<button data-career-start="${comp.id}">Jugar siguiente encuentro</button>` : `<button data-career-restart="${comp.id}">Repetir competición</button>`}
        ${state.trophy ? `<span class="career-earned-trophy">${TROPHIES[comp.reward.trophy].icon} ${escapeHtml(TROPHIES[comp.reward.trophy].title)}</span>` : ""}
      </div>
    </article>`;
  }

  function renderRivals() {
    document.querySelectorAll("[data-career-rivals]").forEach(container => {
      container.innerHTML = Object.values(RIVALS).map(rival => `<article class="career-rival" data-personality="${rival.personality}"><span>${rival.monogram}</span><div><small>${rival.label}</small><strong>${escapeHtml(rival.name)}</strong><p>${escapeHtml(rival.description)}</p><em>“${escapeHtml(rival.motto)}”</em></div></article>`).join("");
    });
  }

  function renderTrophies(data) {
    document.querySelectorAll("[data-career-trophies]").forEach(container => {
      container.innerHTML = Object.values(TROPHIES).map(trophy => {
        const unlocked = Boolean(data.trophies[trophy.id]);
        return `<article class="career-trophy ${unlocked ? "unlocked" : "locked"}"><span>${unlocked ? trophy.icon : "?"}</span><div><strong>${escapeHtml(trophy.title)}</strong><p>${escapeHtml(trophy.text)}</p></div><small>${unlocked ? "EN VITRINA" : "SIN CONSEGUIR"}</small></article>`;
      }).join("");
    });
  }

  function renderCosmetics(data) {
    document.querySelectorAll("[data-career-cosmetics]").forEach(container => {
      container.innerHTML = Object.entries(COSMETICS).map(([type, items]) => `<section class="career-cosmetic-group"><h4>${cosmeticTypeLabel(type)}</h4><div>${items.map(item => {
        const unlocked = !item.unlock || data.unlocks[item.unlock];
        const active = data.equipped[type] === item.id;
        return `<button type="button" data-career-equip="${type}:${item.id}" ${!unlocked ? "disabled" : ""} class="${active ? "active" : ""}"><i data-preview="${type}-${item.id}"></i><span><strong>${escapeHtml(item.label)}</strong><small>${unlocked ? active ? "ACTIVO" : "EQUIPAR" : "BLOQUEADO"}</small></span></button>`;
      }).join("")}</div></section>`).join("");
      container.querySelectorAll("[data-career-equip]").forEach(button => button.addEventListener("click", () => {
        const [type,id] = button.dataset.careerEquip.split(":");
        equip(type,id);
      }));
    });
  }

  function renderCareerHistory(data) {
    document.querySelectorAll("[data-career-history]").forEach(container => {
      if (!data.history.length) { container.innerHTML = `<div class="career-empty">Aún no has disputado encuentros de carrera.</div>`; return; }
      container.innerHTML = data.history.slice(0,12).map(item => `<div class="career-history-row"><span>${item.game === "tute" ? "T" : "⚄"}</span><div><strong>${item.won ? "Victoria" : "Derrota"} ante ${escapeHtml(item.rivalName)}</strong><small>${escapeHtml(item.label)} · ${item.score}–${item.opponentScore}</small></div><time>${formatDate(item.at)}</time></div>`).join("");
    });
  }

  function renderLeague(data) {
    document.querySelectorAll("[data-career-league]").forEach(container => {
      const rows = sortedStandings(data.competitions.diceLeague.standings);
      container.innerHTML = `<div class="career-league-head"><span>POS</span><span>JUGADOR</span><span>PJ</span><span>V</span><span>PTS</span></div>${rows.map((row,index) => `<div class="career-league-row ${row.id === "player" ? "player" : ""}"><b>${index+1}</b><span>${row.id === "player" ? escapeHtml(window.SalaCeroClub?.getData()?.profile?.name || "Jugador") : escapeHtml(RIVALS[row.id]?.name || row.id)}</span><i>${row.played}</i><i>${row.wins}</i><strong>${row.points}</strong></div>`).join("")}`;
    });
  }

  function showResultOverlay(summary) {
    if (!document.body || !summary) return;
    document.querySelector(".career-result-overlay")?.remove();
    const overlay = document.createElement("section");
    overlay.className = `career-result-overlay ${summary.trophy ? "has-trophy" : ""}`;
    const ceremony = summary.trophy ? `<div class="career-confetti" aria-hidden="true">${Array.from({length:24},(_,index)=>`<i style="--x:${(index*37)%100};--delay:${(index%8)*55}ms;--spin:${180+(index%5)*90}deg"></i>`).join("")}</div>` : "";
    overlay.innerHTML = `${ceremony}<div class="career-result-card">
      <button type="button" class="career-result-close" aria-label="Cerrar">×</button>
      <small>${escapeHtml(summary.competitionTitle)} · ${escapeHtml(summary.matchLabel)}</small>
      <span class="career-result-emblem">${summary.won ? "V" : "D"}</span>
      <h2>${summary.won ? "Victoria de campeonato" : "Derrota en competición"}</h2>
      <p>${escapeHtml(summary.decisive)}</p>
      <div class="career-result-score"><span>TÚ <b>${summary.score}</b></span><i>:</i><span><b>${summary.opponentScore}</b> ${escapeHtml(summary.rivalName)}</span></div>
      <div class="career-result-meta"><span>+${summary.rewardXp} PX</span><span>${escapeHtml(summary.standingText || "Progreso actualizado")}</span></div>
      ${summary.trophy ? `<div class="career-result-trophy"><b>${summary.trophy.icon}</b><span><strong>${escapeHtml(summary.trophy.title)}</strong><small>NUEVO TROFEO Y RECOMPENSAS</small></span></div>` : ""}
      <div class="career-result-actions"><a href="career.html">Volver al campeonato</a><button type="button" class="career-result-stay">Seguir aquí</button></div>
    </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("visible"));
    const close = () => { overlay.classList.remove("visible"); setTimeout(() => overlay.remove(), 260); };
    overlay.querySelector(".career-result-close")?.addEventListener("click", close);
    overlay.querySelector(".career-result-stay")?.addEventListener("click", close);
  }

  function renderActiveBanner() {
    const game = location.pathname.toLowerCase().includes("generala") ? "generala" : location.pathname.toLowerCase().includes("tute") ? "tute" : null;
    const pending = game ? getPending(game) : null;
    if (!pending || document.querySelector(".career-active-banner")) return;
    const rival = RIVALS[pending.rivalId];
    const banner = document.createElement("aside");
    banner.className = "career-active-banner";
    banner.innerHTML = `<span>${rival.monogram}</span><div><small>${escapeHtml(pending.competitionTitle)} · ${escapeHtml(pending.matchLabel)}</small><strong>Rival: ${escapeHtml(rival.name)}</strong><p>${escapeHtml(rival.label)} · ${difficultyLabel(pending.difficulty)}</p></div><a href="career.html" data-career-abandon>Abandonar</a>`;
    banner.querySelector("[data-career-abandon]")?.addEventListener("click", () => clearPending());
    document.body.appendChild(banner);
  }

  function difficultyLabel(value) { return value === "hard" ? "Maestra" : value === "easy" ? "Casual" : "Clásica"; }
  function cosmeticTypeLabel(type) { return ({ felt: "Tapetes", dice: "Dados", cup: "Cubiletes", cards: "Reversos" })[type] || type; }
  function formatDate(iso) { return new Intl.DateTimeFormat("es-ES", { day:"2-digit", month:"2-digit" }).format(new Date(iso)); }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[char]); }

  document.addEventListener("DOMContentLoaded", () => {
    read();
    renderAll();
    renderActiveBanner();
  });

  window.SalaCeroCareer = {
    getData: read,
    getPending,
    getAiConfig,
    getActiveRival: getAiConfig,
    startMatch,
    restartCompetition,
    consumeMatch,
    equip,
    render: renderAll,
    competitions: COMPETITIONS,
    rivals: RIVALS,
    trophies: TROPHIES,
    cosmetics: COSMETICS
  };
})();
