(() => {
  "use strict";

  const SUITS = ["oros", "copas", "espadas", "bastos"];
  const SUIT_LABELS = { oros: "oros", copas: "copas", espadas: "espadas", bastos: "bastos" };
  const RANKS = [
    { rank: 1, label: "As", points: 11, strength: 10 },
    { rank: 3, label: "Tres", points: 10, strength: 9 },
    { rank: 12, label: "Rey", points: 4, strength: 8 },
    { rank: 11, label: "Caballo", points: 3, strength: 7 },
    { rank: 10, label: "Sota", points: 2, strength: 6 },
    { rank: 7, label: "Siete", points: 0, strength: 5 },
    { rank: 6, label: "Seis", points: 0, strength: 4 },
    { rank: 5, label: "Cinco", points: 0, strength: 3 },
    { rank: 4, label: "Cuatro", points: 0, strength: 2 },
    { rank: 2, label: "Dos", points: 0, strength: 1 }
  ];
  const RANK_MAP = Object.fromEntries(RANKS.map(item => [item.rank, item]));

  const UI = {};
  let handGesture = null;
  let musicEnabled = false;
  let localAutosaveTimer = null;
  let localSaveRecord = null;

  const state = {
    config: {
      count: 2,
      teams: false,
      names: ["Jugador 1", "Jugador 2"],
      handSize: 8,
      hasStock: true,
      firstSongTrump: false
    },
    players: [],
    dealer: 0,
    leader: 0,
    current: 0,
    stage: "play",
    phase: "setup",
    revealed: false,
    busy: false,
    stock: [],
    trumpCard: null,
    trumpSuit: null,
    asideCard: null,
    trick: [],
    trickNumber: 1,
    pendingDeclaration: null,
    drawQueue: [],
    drawIndex: 0,
    log: [],
    lastDrawnId: null
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheUI();
    bindUI();
    syncSetupUI();
    renderRules();
    UI.localSetup.showModal();
    refreshLocalSaveCard();
  }

  function cacheUI() {
    [
      "localMusicButton", "localRulesButton", "localTable", "stockPod", "localDeck", "localDeckCount",
      "localTrump", "localTrumpSuit", "localTrickRing", "localDropCore", "localPhase", "localStatus",
      "localActionDock", "localDeclarationActions", "localHint", "privateZone", "privateHand", "activePlayerName",
      "privateInstruction", "privacyCurtain", "handoffKicker", "handoffAvatar", "handoffName", "handoffAction",
      "handoffMeta", "revealHandButton", "localScoreTitle", "localTrickCounter", "localScoreList", "localRuleTitle",
      "localRuleText", "localCardsLeft", "localTricksPlayed", "localLeader", "localLog", "localSetup", "localSetupForm",
      "fourPlayerOptions", "localNameGrid", "localRulesModal", "closeLocalRules", "localRulesHeading", "localRulesGrid",
      "understandLocalRules", "localResult", "localResultSeal", "localResultTitle", "localResultText", "localFinalRanking",
      "localRematch", "localMusic", "localResumeCard", "localResumeTitle", "localResumeMeta", "localResumeSave", "localDiscardSave"
    ].forEach(id => { UI[id] = document.getElementById(id); });

    for (let i = 0; i < 4; i += 1) {
      UI[`seat${i}`] = document.getElementById(`localSeat${i}`);
      UI[`name${i}`] = document.getElementById(`name${i}`);
      UI[`role${i}`] = document.getElementById(`role${i}`);
      UI[`avatar${i}`] = document.getElementById(`avatar${i}`);
      UI[`count${i}`] = document.getElementById(`count${i}`);
      UI[`turn${i}`] = document.getElementById(`turn${i}`);
      UI[`slot${i}`] = document.getElementById(`localSlot${i}`);
      UI[`nameInput${i}`] = document.getElementById(`playerName${i}`);
    }
  }

  function bindUI() {
    document.querySelectorAll('input[name="localPlayerCount"]').forEach(input => input.addEventListener("change", syncSetupUI));
    document.querySelectorAll('input[name="localFourMode"]').forEach(input => input.addEventListener("change", syncSetupUI));
    UI.localSetupForm.addEventListener("submit", event => {
      event.preventDefault();
      configureFromForm();
      UI.localSetup.close();
      startMusic();
      startGame();
    });
    UI.localRulesButton.addEventListener("click", () => { renderRules(); UI.localRulesModal.showModal(); });
    UI.closeLocalRules.addEventListener("click", () => UI.localRulesModal.close());
    UI.understandLocalRules.addEventListener("click", () => UI.localRulesModal.close());
    UI.revealHandButton.addEventListener("click", revealPrivateTurn);
    UI.localDeck.addEventListener("click", manualDraw);
    UI.localDeck.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); manualDraw(); }
    });
    UI.localMusicButton.addEventListener("click", toggleMusic);
    UI.localResumeSave?.addEventListener("click", resumeLocalGame);
    UI.localDiscardSave?.addEventListener("click", discardLocalSave);
    window.addEventListener("tute:privacy-lock", lockPrivateView);
    UI.localRematch.addEventListener("click", () => {
      UI.localResult.close();
      startGame();
    });
  }

  function syncSetupUI() {
    const count = Number(document.querySelector('input[name="localPlayerCount"]:checked')?.value || 2);
    UI.fourPlayerOptions.classList.toggle("hidden", count !== 4);
    document.querySelectorAll(".optional-player").forEach(label => {
      const index = Number(label.dataset.playerIndex);
      label.classList.toggle("disabled", index >= count);
    });
  }

  function configureFromForm() {
    const count = Number(document.querySelector('input[name="localPlayerCount"]:checked')?.value || 2);
    const fourMode = document.querySelector('input[name="localFourMode"]:checked')?.value || "individual";
    const names = Array.from({ length: count }, (_, index) => UI[`nameInput${index}`].value.trim() || `Jugador ${index + 1}`);
    state.config = {
      count,
      teams: count === 4 && fourMode === "pairs",
      names,
      handSize: count === 2 ? 8 : count === 3 ? 13 : 10,
      hasStock: count === 2,
      firstSongTrump: count === 3
    };
  }

  function buildDeck() {
    return SUITS.flatMap(suit => RANKS.map(data => ({ id: `${suit}-${data.rank}`, suit, ...data })));
  }

  function shuffle(cards) {
    const deck = [...cards];
    for (let i = deck.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  async function startGame() {
    cleanupHandGesture();
    window.TutePWA?.setPlaying(true);
    state.players = Array.from({ length: state.config.count }, (_, id) => ({
      id,
      name: state.config.names[id],
      hand: [],
      cardPoints: 0,
      songPoints: 0,
      tricks: 0,
      captured: [],
      sung: new Set(),
      postStockCanteChanceUsed: false
    }));
    state.dealer = Math.floor(Math.random() * state.config.count);
    state.leader = (state.dealer + 1) % state.config.count;
    state.current = state.leader;
    state.stage = "play";
    state.phase = "dealing";
    state.revealed = false;
    state.busy = false;
    state.stock = [];
    state.trumpCard = null;
    state.trumpSuit = null;
    state.asideCard = null;
    state.trick = [];
    state.trickNumber = 1;
    state.pendingDeclaration = null;
    state.drawQueue = [];
    state.drawIndex = 0;
    state.log = [];
    state.lastDrawnId = null;
    clearTable();
    addLog(`<strong>${state.players[state.dealer].name}</strong> reparte.`);
    render();
    await dealCards();
    preparePrivateTurn(state.leader, "play");
  }

  async function dealCards() {
    const deck = shuffle(buildDeck());
    let lastDealt = null;
    for (let round = 0; round < state.config.handSize; round += 1) {
      for (let offset = 1; offset <= state.config.count; offset += 1) {
        const playerId = (state.dealer + offset) % state.config.count;
        const card = deck.pop();
        lastDealt = card;
        state.players[playerId].hand.push(card);
        renderSeats();
        await wait(28);
      }
    }

    if (state.config.count === 2) {
      state.trumpCard = deck.pop();
      state.trumpSuit = state.trumpCard.suit;
      state.stock = deck;
      addLog(`Pinta <strong>${cardName(state.trumpCard)}</strong>.`);
    } else if (state.config.count === 3) {
      state.asideCard = deck.pop();
      state.trumpCard = null;
      state.trumpSuit = null;
      addLog("Se aparta una carta boca abajo. <strong>El primer cante fijará el triunfo.</strong>");
    } else {
      state.trumpCard = null;
      state.trumpSuit = lastDealt.suit;
      addLog(`${cardName(lastDealt)} es la última carta repartida y marca <strong>${SUIT_LABELS[state.trumpSuit]}</strong> como triunfo.`);
    }
    state.phase = "handoff";
    render();
  }

  function clearTable() {
    UI.privateHand.replaceChildren();
    for (let i = 0; i < 4; i += 1) {
      UI[`slot${i}`].dataset.key = "";
      UI[`slot${i}`].innerHTML = `<span>J${i + 1}</span>`;
    }
  }

  function preparePrivateTurn(playerId, stage) {
    state.current = playerId;
    state.stage = stage;
    state.phase = "handoff";
    state.revealed = false;
    state.lastDrawnId = null;
    cleanupHandGesture();
    render();
  }

  function revealPrivateTurn() {
    if (state.phase !== "handoff") return;
    state.phase = "active";
    state.revealed = true;
    navigator.vibrate?.(8);
    render();
  }

  function render() {
    renderSeats();
    renderPrivateHand();
    renderTrick();
    renderTrump();
    renderStock();
    renderStatus();
    renderScores();
    renderLog();
    renderDeclarations();
    renderPrivacy();
    queueLocalAutosave();
  }

  function renderSeats() {
    for (let i = 0; i < 4; i += 1) {
      const visible = i < state.config.count;
      UI[`seat${i}`].classList.toggle("hidden-seat", !visible);
      UI[`slot${i}`].classList.toggle("hidden", !visible);
      if (!visible) continue;
      const player = state.players[i];
      const name = player?.name || state.config.names[i] || `Jugador ${i + 1}`;
      UI[`name${i}`].textContent = name;
      UI[`avatar${i}`].textContent = initials(name);
      UI[`count${i}`].textContent = player?.hand.length ?? 0;
      UI[`seat${i}`].classList.toggle("active", ["handoff", "active"].includes(state.phase) && state.current === i);
      if (state.config.teams) UI[`role${i}`].textContent = i % 2 === 0 ? "EQUIPO ORO" : "EQUIPO VERDE";
      else UI[`role${i}`].textContent = `JUGADOR ${i + 1}`;
    }
  }

  function renderPrivateHand() {
    const player = state.players[state.current];
    const shouldShow = state.phase === "active" && state.revealed && player;
    UI.privateZone.classList.toggle("private-hidden", !shouldShow);
    UI.activePlayerName.textContent = shouldShow ? player.name : "Mano oculta";
    UI.privateInstruction.textContent = shouldShow ? stageInstruction() : "Espera a la pantalla de entrega";
    if (!shouldShow) {
      UI.privateHand.replaceChildren();
      return;
    }

    const canPlay = state.stage === "play" && !state.busy;
    const legalIds = new Set(canPlay ? getLegalCards(state.current).map(card => card.id) : []);
    const existing = new Map([...UI.privateHand.querySelectorAll("[data-card-id]")].map(el => [el.dataset.cardId, el]));
    const count = player.hand.length || 1;
    player.hand.forEach((card, index) => {
      let element = existing.get(card.id);
      if (!element) element = createInteractiveCard(card);
      const normalized = count > 1 ? (index - (count - 1) / 2) / ((count - 1) / 2) : 0;
      element.dataset.playable = legalIds.has(card.id) ? "true" : "false";
      element.style.zIndex = String(index + 1);
      element.style.setProperty("--rest-rotate", `${normalized * 10}deg`);
      element.style.setProperty("--rest-y", `${Math.abs(normalized) * 13}px`);
      element.style.setProperty("--rest-x", `${normalized * 2}px`);
      element.classList.toggle("legal", canPlay && legalIds.has(card.id));
      element.classList.toggle("illegal", canPlay && !legalIds.has(card.id));
      element.classList.toggle("newly-drawn", state.lastDrawnId === card.id);
      element.setAttribute("aria-label", `${cardName(card)}${legalIds.has(card.id) ? ", jugar" : ""}`);
      UI.privateHand.appendChild(element);
      existing.delete(card.id);
    });
    existing.forEach(element => element.remove());
    UI.localCardsLeft.textContent = player.hand.length;
  }

  function createCard(card, back = false) {
    const button = document.createElement("button");
    button.className = "local-card";
    button.type = "button";
    button.dataset.cardId = card?.id || "back";
    const img = document.createElement("img");
    img.src = back ? "assets/cards/back.svg" : `assets/cards/${card.suit}-${card.rank}.webp`;
    img.alt = back ? "Carta boca abajo" : cardName(card);
    img.draggable = false;
    button.appendChild(img);
    return button;
  }

  function createInteractiveCard(card) {
    const element = createCard(card, false);
    element.addEventListener("pointerdown", event => {
      beginHandGesture(event, element.dataset.cardId, element.dataset.playable === "true");
    });
    element.addEventListener("keydown", event => {
      if ((event.key === "Enter" || event.key === " ") && element.dataset.playable === "true") {
        event.preventDefault();
        playCard(state.current, element.dataset.cardId);
      }
    });
    return element;
  }

  function renderTrick() {
    for (let i = 0; i < 4; i += 1) {
      const slot = UI[`slot${i}`];
      if (!slot) continue;
      const play = state.trick.find(item => item.player === i);
      const key = play?.card.id || `empty:${i}`;
      if (slot.dataset.key === key) continue;
      slot.dataset.key = key;
      slot.replaceChildren();
      if (play) slot.appendChild(createCard(play.card));
      else {
        const span = document.createElement("span");
        span.textContent = initials(state.config.names[i] || `J${i + 1}`);
        slot.appendChild(span);
      }
    }
  }

  function renderTrump() {
    if (!state.trumpSuit) {
      UI.localTrump.dataset.key = "pending";
      UI.localTrump.innerHTML = '<span class="trump-pending"><b>?</b><small>PRIMER CANTE</small></span>';
      UI.localTrumpSuit.textContent = "POR DECIDIR";
      return;
    }
    if (state.trumpCard) {
      if (UI.localTrump.dataset.key !== state.trumpCard.id) {
        UI.localTrump.dataset.key = state.trumpCard.id;
        UI.localTrump.replaceChildren(createCard(state.trumpCard));
      }
    } else {
      const key = `suit:${state.trumpSuit}`;
      if (UI.localTrump.dataset.key !== key) {
        UI.localTrump.dataset.key = key;
        UI.localTrump.innerHTML = `<span class="trump-suit-seal"><b>${state.trumpSuit[0].toUpperCase()}</b><small>${SUIT_LABELS[state.trumpSuit]}</small></span>`;
      }
    }
    UI.localTrumpSuit.textContent = SUIT_LABELS[state.trumpSuit].toUpperCase();
  }

  function renderStock() {
    UI.stockPod.classList.toggle("hidden", !state.config.hasStock);
    if (!state.config.hasStock) return;
    const count = drawPileCount();
    UI.localDeckCount.textContent = String(count);
    UI.localDeck.classList.toggle("hidden", count === 0);
    const ready = state.phase === "active" && state.stage === "draw" && !state.busy;
    UI.localDeck.classList.toggle("draw-ready", ready);
    UI.localDeck.setAttribute("aria-disabled", ready ? "false" : "true");
  }

  function renderStatus() {
    const player = state.players[state.current];
    UI.localTrickCounter.textContent = `BAZA ${state.trickNumber}`;
    UI.localTricksPlayed.textContent = String(Math.max(0, state.trickNumber - 1));
    UI.localLeader.textContent = state.players[state.leader]?.name?.split(" ")[0]?.toUpperCase() || "—";

    if (state.phase === "dealing") {
      UI.localPhase.textContent = "REPARTIENDO";
      UI.localStatus.textContent = "Repartiendo las cartas de la mesa local…";
    } else if (state.phase === "handoff") {
      UI.localPhase.textContent = "PASA EL MÓVIL";
      UI.localStatus.textContent = `Entrega el dispositivo a ${player?.name || "el siguiente jugador"}.`;
    } else if (state.phase === "active") {
      UI.localPhase.textContent = state.stage === "draw" ? "ROBO PRIVADO" : state.stage === "declaration" ? "CANTE PRIVADO" : "TURNO ACTIVO";
      UI.localStatus.textContent = `${player.name}: ${stageInstruction()}`;
    } else if (state.phase === "resolving") {
      UI.localPhase.textContent = "RESOLVIENDO";
      UI.localStatus.textContent = "Comprobando la baza…";
    } else {
      UI.localPhase.textContent = "FINAL";
      UI.localStatus.textContent = "La partida ha terminado.";
    }

    const reading = getRuleReading();
    UI.localRuleTitle.textContent = reading.title;
    UI.localRuleText.textContent = reading.text;
    UI.localHint.textContent = reading.hint;
  }

  function stageInstruction() {
    if (state.stage === "draw") return "pulsa la baceta para robar tu carta";
    if (state.stage === "declaration") return "decide si quieres cantar";
    return "juega una carta pulsándola o arrastrándola al tapete";
  }

  function getRuleReading() {
    if (state.phase === "handoff") return { title: "Privacidad activada", text: "Ninguna mano está visible durante el cambio de jugador.", hint: "Entrega el dispositivo al nombre indicado." };
    if (state.stage === "draw") return { title: "Robo por orden de baza", text: "Quien ganó la baza roba primero. La carta solo la verá el jugador activo.", hint: "Pulsa la baceta para robar." };
    if (state.stage === "declaration") return { title: "Cante después de ganar", text: state.config.firstSongTrump && !state.trumpSuit ? "El primer cante vale 40 y fija ese palo como triunfo." : "Rey y caballo de triunfo valen 40; de otro palo, 20.", hint: "Elige un cante o continúa sin cantar." };
    if (!state.trick.length) return { title: "Abres la baza", text: "Puedes salir con cualquier carta.", hint: "Pulsa una carta o arrástrala al centro." };

    const lead = state.trick[0].card;
    const winner = currentWinningPlay()?.card;
    const hand = state.players[state.current]?.hand || [];
    const leadCards = hand.filter(card => card.suit === lead.suit);
    if (leadCards.length) {
      if (state.trumpSuit && winner.suit === state.trumpSuit && lead.suit !== state.trumpSuit) {
        return { title: "La baza ya está fallada", text: `Debes asistir a ${SUIT_LABELS[lead.suit]}, pero no tienes que superar la carta inicial.`, hint: `Juega cualquier ${SUIT_LABELS[lead.suit]}.` };
      }
      const higher = leadCards.filter(card => card.strength > winner.strength);
      return higher.length
        ? { title: "Debes montar", text: `Tienes ${SUIT_LABELS[lead.suit]} capaces de superar la carta que gana.`, hint: "Solo están resaltadas las cartas válidas." }
        : { title: "Debes asistir", text: `Tienes ${SUIT_LABELS[lead.suit]}, pero no puedes superar.`, hint: `Juega cualquier ${SUIT_LABELS[lead.suit]}.` };
    }
    if (!state.trumpSuit) return { title: "Sin triunfo todavía", text: `No tienes ${SUIT_LABELS[lead.suit]} y el primer cante aún no ha fijado el pinte.`, hint: "Puedes descartarte con cualquier carta." };
    if (winner.suit === state.trumpSuit) {
      const higher = hand.filter(card => card.suit === state.trumpSuit && card.strength > winner.strength);
      return higher.length
        ? { title: "Debes pisar", text: "No tienes el palo de salida y puedes superar el triunfo ganador.", hint: "Juega un triunfo superior." }
        : { title: "Descarte libre", text: "No puedes asistir ni superar el triunfo ganador.", hint: "Puedes jugar cualquier carta." };
    }
    const trumps = hand.filter(card => card.suit === state.trumpSuit);
    return trumps.length
      ? { title: "Debes fallar", text: `No tienes ${SUIT_LABELS[lead.suit]}; debes jugar triunfo.`, hint: "Juega una carta del palo de triunfo." }
      : { title: "Descarte libre", text: "No tienes el palo de salida ni triunfo.", hint: "Puedes jugar cualquier carta." };
  }

  function renderScores() {
    if (!state.players.length) return;
    UI.localScoreTitle.textContent = state.config.teams ? "Marcador por parejas" : "Puntuación individual";
    if (state.config.teams) {
      const teamA = totalPlayer(0) + totalPlayer(2);
      const teamB = totalPlayer(1) + totalPlayer(3);
      UI.localScoreList.innerHTML = `<div class="score-entry"><span>${state.players[0].name.toUpperCase()} + ${state.players[2].name.toUpperCase()}</span><strong>${teamA}</strong></div><div class="score-entry"><span>${state.players[1].name.toUpperCase()} + ${state.players[3].name.toUpperCase()}</span><strong>${teamB}</strong></div>`;
    } else {
      UI.localScoreList.innerHTML = state.players.map((player, index) => `<div class="score-entry ${index === state.current && state.phase !== "finished" ? "active" : ""}"><span>${player.name.toUpperCase()}</span><strong>${totalPlayer(index)}</strong></div>`).join("");
    }
  }

  function renderLog() {
    UI.localLog.innerHTML = state.log.slice(-12).reverse().map(line => `<div class="log-line">${line}</div>`).join("");
  }

  function renderDeclarations() {
    UI.localDeclarationActions.replaceChildren();
    if (state.phase === "active" && state.stage === "play" && state.config.count === 2 && state.trick.length === 0) {
      const exchange = getExchangeOption(state.current);
      if (exchange) {
        const button = document.createElement("button");
        button.className = "declaration-action";
        button.textContent = `Cambiar el pinte con el ${exchange.requiredRank}`;
        button.addEventListener("click", () => exchangeTrump(state.current));
        UI.localDeclarationActions.appendChild(button);
      }
    }
    if (!(state.phase === "active" && state.stage === "declaration" && state.pendingDeclaration?.player === state.current)) return;
    const options = state.pendingDeclaration.options;
    options.forEach(option => {
      const button = document.createElement("button");
      button.className = "declaration-action";
      if (option.type === "tute") button.textContent = option.label;
      else if (option.setsTrump) button.textContent = `Cantar 40 y fijar ${SUIT_LABELS[option.suit]} como triunfo`;
      else button.textContent = `Cantar ${option.points} en ${SUIT_LABELS[option.suit]}`;
      button.addEventListener("click", () => resolveDeclaration(option));
      UI.localDeclarationActions.appendChild(button);
    });
    const pass = document.createElement("button");
    pass.className = "declaration-action pass";
    pass.textContent = "No cantar";
    pass.addEventListener("click", () => resolveDeclaration(null));
    UI.localDeclarationActions.appendChild(pass);
  }

  function renderPrivacy() {
    const show = state.phase === "handoff";
    UI.privacyCurtain.classList.toggle("hidden", !show);
    if (!show) return;
    const player = state.players[state.current];
    const actionLabel = state.stage === "draw" ? "Te toca robar una carta." : state.stage === "declaration" ? "Has ganado la baza. Comprueba tus posibles cantes." : "Te toca jugar una carta.";
    UI.handoffKicker.textContent = state.stage === "draw" ? "ROBO PRIVADO" : state.stage === "declaration" ? "DECLARACIÓN PRIVADA" : "PASA EL DISPOSITIVO";
    UI.handoffAvatar.textContent = initials(player.name);
    UI.handoffName.textContent = player.name;
    UI.handoffAction.textContent = actionLabel;
    const trumpText = state.trumpSuit ? `Triunfo: ${SUIT_LABELS[state.trumpSuit]}` : "Triunfo: por decidir";
    UI.handoffMeta.innerHTML = `<span>Baza ${state.trickNumber}</span><span>${state.trick.length} cartas en mesa</span><span>${trumpText}</span>`;
    UI.revealHandButton.textContent = `Soy ${player.name} · ver mi mano`;
  }

  function currentWinningPlay() {
    if (!state.trick.length) return null;
    const leadSuit = state.trick[0].card.suit;
    return state.trick.slice(1).reduce((winner, play) => beats(play.card, winner.card, leadSuit, state.trumpSuit) ? play : winner, state.trick[0]);
  }

  function beats(challenger, current, leadSuit, trumpSuit) {
    if (challenger.suit === current.suit) return challenger.strength > current.strength;
    if (trumpSuit && challenger.suit === trumpSuit && current.suit !== trumpSuit) return true;
    if (trumpSuit && current.suit === trumpSuit) return false;
    return challenger.suit === leadSuit && current.suit !== leadSuit;
  }

  function getLegalCards(playerId) {
    const hand = state.players[playerId].hand;
    if (!state.trick.length) return [...hand];
    const lead = state.trick[0].card;
    const winner = currentWinningPlay().card;
    const leadCards = hand.filter(card => card.suit === lead.suit);
    if (leadCards.length) {
      const alreadyTrumped = state.trumpSuit && winner.suit === state.trumpSuit && lead.suit !== state.trumpSuit;
      if (!alreadyTrumped) {
        const higher = leadCards.filter(card => card.strength > winner.strength);
        if (higher.length) return higher;
      }
      return leadCards;
    }

    if (!state.trumpSuit) return [...hand];
    const trumps = hand.filter(card => card.suit === state.trumpSuit);
    if (winner.suit !== state.trumpSuit) return trumps.length ? trumps : [...hand];
    const higherTrumps = trumps.filter(card => card.strength > winner.strength);
    return higherTrumps.length ? higherTrumps : [...hand];
  }

  async function playCard(playerId, cardId) {
    if (state.busy || state.phase !== "active" || state.stage !== "play" || state.current !== playerId) return;
    const player = state.players[playerId];
    const index = player.hand.findIndex(card => card.id === cardId);
    if (index < 0) return;
    const legal = getLegalCards(playerId);
    if (!legal.some(card => card.id === cardId)) {
      toast(getIllegalPlayReason(cardId));
      navigator.vibrate?.([20, 25, 20]);
      return;
    }

    state.busy = true;
    const card = player.hand[index];
    const source = UI.privateHand.querySelector(`[data-card-id="${cardId}"]`);
    const target = UI[`slot${playerId}`];
    if (source) await animateFlight(source, target, card);
    player.hand.splice(index, 1);
    state.trick.push({ player: playerId, card });
    addLog(`<strong>${player.name}</strong> juega ${cardName(card)}.`);
    state.busy = false;
    state.revealed = false;
    state.phase = "resolving";
    render();

    if (state.trick.length === state.config.count) {
      await wait(650);
      await resolveTrick();
    } else {
      const next = (playerId + 1) % state.config.count;
      await wait(320);
      preparePrivateTurn(next, "play");
    }
  }

  async function animateFlight(source, target, card) {
    const sr = source.getBoundingClientRect();
    const tr = target.getBoundingClientRect();
    const clone = createCard(card);
    clone.classList.add("flight-local");
    Object.assign(clone.style, { left: `${sr.left}px`, top: `${sr.top}px`, width: `${sr.width}px`, height: `${sr.height}px` });
    document.body.appendChild(clone);
    const dx = tr.left + tr.width / 2 - (sr.left + sr.width / 2);
    const dy = tr.top + tr.height / 2 - (sr.top + sr.height / 2);
    const animation = clone.animate([
      { transform: "translate3d(0,0,0) rotate(0deg) scale(1)", opacity: 1 },
      { transform: `translate3d(${dx * .52}px,${dy * .34 - 48}px,0) rotate(-13deg) scale(1.06)`, opacity: 1, offset: .58 },
      { transform: `translate3d(${dx}px,${dy}px,0) rotate(${playerRotation(state.current)}deg) scale(.9)`, opacity: 1 }
    ], { duration: 480, easing: "cubic-bezier(.18,.82,.18,1)", fill: "forwards" });
    try { await animation.finished; } catch (_) {}
    clone.remove();
  }

  function playerRotation(playerId) {
    return [-3, -6, 3, 6][playerId] || 0;
  }

  async function resolveTrick() {
    const winnerPlay = currentWinningPlay();
    const winner = winnerPlay.player;
    const points = state.trick.reduce((sum, play) => sum + play.card.points, 0);
    const captured = state.trick.map(play => play.card);
    state.players[winner].cardPoints += points;
    state.players[winner].tricks += 1;
    state.players[winner].captured.push(...captured);
    state.leader = winner;
    addLog(`<strong>${state.players[winner].name}</strong> gana la baza${points ? ` y suma ${points}` : ""}.`);
    await collectTrick(winner);
    state.trick = [];
    renderTrick();

    const declarations = getDeclarations(winner);
    const canDeclareNow = canDeclareAfterTrick(winner);
    if (declarations.length && canDeclareNow) {
      state.pendingDeclaration = { player: winner, options: declarations };
      preparePrivateTurn(winner, "declaration");
      return;
    }
    continueAfterTrick();
  }

  function canDeclareAfterTrick(playerId) {
    if (!state.config.hasStock) return true;
    if (drawPileCount() > 0) return true;

    const player = state.players[playerId];
    if (!player || player.postStockCanteChanceUsed) return false;
    player.postStockCanteChanceUsed = true;
    return true;
  }

  async function collectTrick(winner) {
    const target = UI[`seat${winner}`].getBoundingClientRect();
    const jobs = [];
    state.trick.forEach(play => {
      const element = UI[`slot${play.player}`].querySelector(".local-card");
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const clone = element.cloneNode(true);
      clone.classList.add("capture-local");
      Object.assign(clone.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
      document.body.appendChild(clone);
      const dx = target.left + target.width / 2 - (rect.left + rect.width / 2);
      const dy = target.top + target.height / 2 - (rect.top + rect.height / 2);
      const animation = clone.animate([
        { transform: "translate3d(0,0,0) scale(1)", opacity: 1 },
        { transform: `translate3d(${dx}px,${dy}px,0) rotate(18deg) scale(.18)`, opacity: .05 }
      ], { duration: 470, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" });
      jobs.push(animation.finished.catch(() => {}).then(() => clone.remove()));
    });
    await Promise.all(jobs);
  }

  function getExchangeOption(playerId) {
    if (state.config.count !== 2 || !state.trumpCard || state.trick.length !== 0 || state.leader !== playerId) return null;
    const player = state.players[playerId];
    if (!player) return null;
    const openingExchange = state.trickNumber === 1 && state.trick.length === 0;
    if (player.tricks < 1 && !openingExchange) return null;
    const highPinte = [1, 3, 10, 11, 12].includes(state.trumpCard.rank);
    const requiredRank = highPinte ? 7 : 2;
    if (state.trumpCard.rank === requiredRank) return null;
    const card = player.hand.find(item => item.suit === state.trumpSuit && item.rank === requiredRank);
    return card ? { card, requiredRank } : null;
  }

  function exchangeTrump(playerId) {
    if (state.phase !== "active" || state.stage !== "play" || state.current !== playerId) return;
    const option = getExchangeOption(playerId);
    if (!option) return;
    const player = state.players[playerId];
    const index = player.hand.findIndex(card => card.id === option.card.id);
    const oldTrump = state.trumpCard;
    player.hand[index] = oldTrump;
    state.trumpCard = option.card;
    addLog(`<strong>${player.name}</strong> cambia el pinte: ${cardName(option.card)} por ${cardName(oldTrump)}.`);
    navigator.vibrate?.(10);
    render();
  }

  function getDeclarations(playerId) {
    const player = state.players[playerId];
    const kings = player.hand.filter(card => card.rank === 12);
    const knights = player.hand.filter(card => card.rank === 11);
    if (kings.length === 4) return [{ type: "tute", label: "Tute de reyes" }];
    if (knights.length === 4) return [{ type: "tute", label: "Tute de caballos" }];
    const options = [];
    SUITS.forEach(suit => {
      if (player.sung.has(suit)) return;
      const hasKing = player.hand.some(card => card.suit === suit && card.rank === 12);
      const hasKnight = player.hand.some(card => card.suit === suit && card.rank === 11);
      if (!hasKing || !hasKnight) return;
      const setsTrump = state.config.firstSongTrump && !state.trumpSuit;
      options.push({ type: "song", suit, points: setsTrump ? 40 : suit === state.trumpSuit ? 40 : 20, setsTrump });
    });
    options.sort((a, b) => (b.points || 999) - (a.points || 999));
    return options;
  }

  async function resolveDeclaration(option) {
    if (state.phase !== "active" || state.stage !== "declaration" || !state.pendingDeclaration) return;
    const player = state.players[state.pendingDeclaration.player];
    state.pendingDeclaration = null;
    state.revealed = false;
    if (!option) {
      addLog(`${player.name} continúa sin cantar.`);
      continueAfterTrick();
      return;
    }
    if (option.type === "tute") {
      addLog(`<strong>${player.name} declara ${option.label}.</strong>`);
      finishGame(player.id, option.label);
      return;
    }
    if (option.setsTrump && !state.trumpSuit) {
      state.trumpSuit = option.suit;
      state.trumpCard = null;
      addLog(`<strong>${player.name} canta 40 y fija ${SUIT_LABELS[option.suit]} como triunfo.</strong>`);
    } else {
      addLog(`<strong>${player.name} canta ${option.points} en ${SUIT_LABELS[option.suit]}.</strong>`);
    }
    player.songPoints += option.points;
    player.sung.add(option.suit);
    render();
    if (window.TuteCanteFX) await window.TuteCanteFX.play({ points: option.points, suit: option.suit, actorName: player.name, setsTrump: Boolean(option.setsTrump) });
    continueAfterTrick();
  }

  function continueAfterTrick() {
    if (state.config.hasStock && drawPileCount() > 0) {
      state.drawQueue = [state.leader, (state.leader + 1) % 2];
      state.drawIndex = 0;
      preparePrivateTurn(state.drawQueue[0], "draw");
      return;
    }
    if (state.players.every(player => player.hand.length === 0)) {
      state.players[state.leader].cardPoints += 10;
      addLog(`<strong>Diez de últimas</strong> para ${state.players[state.leader].name}.`);
      finishGame();
      return;
    }
    state.trickNumber += 1;
    preparePrivateTurn(state.leader, "play");
  }

  function drawPileCount() {
    return state.stock.length + (state.trumpCard ? 1 : 0);
  }

  async function manualDraw() {
    if (state.busy || state.phase !== "active" || state.stage !== "draw" || state.drawQueue[state.drawIndex] !== state.current) return;
    const player = state.players[state.current];
    const fromStock = state.stock.length > 0;
    const card = fromStock ? state.stock.pop() : state.trumpCard;
    if (!card) return;
    const source = fromStock ? UI.localDeck : UI.localTrump;
    const sourceRect = source.getBoundingClientRect();
    state.busy = true;
    renderStock();
    await animateDraw(sourceRect, card);
    if (!fromStock) state.trumpCard = null;
    player.hand.push(card);
    state.lastDrawnId = card.id;
    addLog(fromStock ? `<strong>${player.name}</strong> roba una carta.` : `<strong>${player.name}</strong> recoge ${cardName(card)}.`);
    state.busy = false;
    render();
    await wait(720);
    state.lastDrawnId = null;
    state.drawIndex += 1;
    if (state.drawIndex < state.drawQueue.length) {
      preparePrivateTurn(state.drawQueue[state.drawIndex], "draw");
      return;
    }
    state.drawQueue = [];
    state.drawIndex = 0;
    state.trickNumber += 1;
    preparePrivateTurn(state.leader, "play");
  }

  async function animateDraw(sourceRect, card) {
    const targetRect = UI.privateHand.getBoundingClientRect();
    const clone = createCard(card);
    clone.classList.add("flight-local");
    const width = Math.min(96, Math.max(70, sourceRect.width));
    const height = width * 1.716;
    const startX = sourceRect.left + sourceRect.width / 2 - width / 2;
    const startY = sourceRect.top + sourceRect.height / 2 - height / 2;
    const endX = targetRect.right - width - 28;
    const endY = targetRect.top + 16;
    Object.assign(clone.style, { left: `${startX}px`, top: `${startY}px`, width: `${width}px`, height: `${height}px` });
    document.body.appendChild(clone);
    const dx = endX - startX;
    const dy = endY - startY;
    const animation = clone.animate([
      { transform: "translate3d(0,0,0) rotate(0deg) scale(.8)", opacity: .9 },
      { transform: `translate3d(${dx * .5}px,${dy * .42 - 38}px,0) rotate(-8deg) scale(1)`, opacity: 1, offset: .55 },
      { transform: `translate3d(${dx}px,${dy}px,0) rotate(2deg) scale(1)`, opacity: 1 }
    ], { duration: 520, easing: "cubic-bezier(.2,.8,.18,1)", fill: "forwards" });
    try { await animation.finished; } catch (_) {}
    clone.remove();
  }

  function getIllegalPlayReason(cardId) {
    if (state.stage !== "play") return "Ahora no estás en la fase de jugar una carta.";
    const legal = getLegalCards(state.current);
    if (legal.some(card => card.id === cardId)) return "Arrastra la carta hasta el centro para jugarla.";
    if (!state.trick.length) return "Esa carta no está disponible ahora.";
    const lead = state.trick[0].card;
    const winner = currentWinningPlay().card;
    const hand = state.players[state.current].hand;
    const leadCards = hand.filter(card => card.suit === lead.suit);
    if (leadCards.length) {
      const alreadyTrumped = state.trumpSuit && winner.suit === state.trumpSuit && lead.suit !== state.trumpSuit;
      if (alreadyTrumped) return `La baza está fallada, pero debes asistir a ${SUIT_LABELS[lead.suit]}.`;
      const higher = leadCards.some(card => card.strength > winner.strength);
      return higher ? `Debes asistir a ${SUIT_LABELS[lead.suit]} y superar la carta ganadora.` : `Debes asistir a ${SUIT_LABELS[lead.suit]}.`;
    }
    if (!state.trumpSuit) return "Todavía no existe triunfo, así que puedes descartarte con cualquiera de las cartas habilitadas.";
    if (winner.suit === state.trumpSuit && hand.some(card => card.suit === state.trumpSuit && card.strength > winner.strength)) return "Debes pisar el triunfo ganador.";
    if (legal.every(card => card.suit === state.trumpSuit)) return "No tienes el palo de salida: debes fallar con triunfo.";
    return "Esa carta no cumple las obligaciones de la baza.";
  }

  function beginHandGesture(event, cardId, playable) {
    if (state.phase !== "active" || state.busy || event.button > 0 || event.isPrimary === false) return;
    const element = event.currentTarget;
    event.preventDefault();
    element.setPointerCapture?.(event.pointerId);
    handGesture = {
      pointerId: event.pointerId,
      cardId,
      playable,
      element,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      mode: "tap",
      insertIndex: state.players[state.current].hand.findIndex(card => card.id === cardId),
      ghost: null,
      slot: null,
      sourceRect: null
    };
    document.addEventListener("pointermove", moveHandGesture, { passive: false });
    document.addEventListener("pointerup", endHandGesture, { once: true });
    document.addEventListener("pointercancel", cancelHandGesture, { once: true });
  }

  function moveHandGesture(event) {
    if (!handGesture || event.pointerId !== handGesture.pointerId) return;
    const dx = event.clientX - handGesture.startX;
    const dy = event.clientY - handGesture.startY;
    if (!handGesture.moved && Math.hypot(dx, dy) < 9) return;
    if (!handGesture.moved) startHandDrag(event);
    event.preventDefault();
    handGesture.ghost.style.left = `${event.clientX}px`;
    handGesture.ghost.style.top = `${event.clientY}px`;
    if (isPointInPlayZone(event.clientX, event.clientY)) {
      setGestureMode(handGesture.playable ? "play" : "invalid-play");
      return;
    }
    if (isPointNearHand(event.clientX, event.clientY)) {
      setGestureMode("reorder");
      updateDropIndex(event.clientX);
      autoScrollActiveHand(event.clientX);
      return;
    }
    setGestureMode("cancel");
  }

  function startHandDrag(event) {
    handGesture.moved = true;
    const rect = handGesture.element.getBoundingClientRect();
    handGesture.sourceRect = rect;
    handGesture.element.classList.add("gesture-source");
    const ghost = handGesture.element.cloneNode(true);
    ghost.classList.remove("legal", "illegal", "gesture-source");
    ghost.classList.add("hand-drag-ghost");
    Object.assign(ghost.style, { width: `${rect.width}px`, height: `${rect.height}px`, left: `${event.clientX}px`, top: `${event.clientY}px` });
    document.body.appendChild(ghost);
    handGesture.ghost = ghost;
    const slot = document.createElement("span");
    slot.className = "hand-drop-slot";
    slot.innerHTML = "<b>AQUÍ</b>";
    handGesture.slot = slot;
    setGestureMode("reorder");
    updateDropIndex(event.clientX, true);
  }

  function isPointInPlayZone(x, y) {
    const rect = UI.localTrickRing.getBoundingClientRect();
    return x >= rect.left - 70 && x <= rect.right + 70 && y >= rect.top - 70 && y <= rect.bottom + 70;
  }

  function isPointNearHand(x, y) {
    const rect = UI.privateHand.getBoundingClientRect();
    return x >= rect.left - 80 && x <= rect.right + 80 && y >= rect.top - 85 && y <= rect.bottom + 105;
  }

  function autoScrollActiveHand(clientX) {
    const hand = UI.privateHand;
    const rect = hand.getBoundingClientRect();
    const edge = 48;
    if (clientX < rect.left + edge) hand.scrollLeft -= 11;
    if (clientX > rect.right - edge) hand.scrollLeft += 11;
  }

  function setGestureMode(mode) {
    if (!handGesture || handGesture.mode === mode) return;
    handGesture.mode = mode;
    UI.localTrickRing.classList.toggle("play-drop-active", mode === "play" || mode === "invalid-play");
    UI.localTrickRing.classList.toggle("play-drop-valid", mode === "play");
    UI.localTrickRing.classList.toggle("play-drop-invalid", mode === "invalid-play");
    UI.localDropCore.querySelector("span").textContent = mode === "invalid-play" ? "JUGADA NO VÁLIDA" : "SUELTA PARA JUGAR";
    if (mode === "reorder") {
      if (handGesture.slot && !handGesture.slot.isConnected) UI.privateHand.appendChild(handGesture.slot);
    } else handGesture.slot?.remove();
  }

  function updateDropIndex(clientX, force = false) {
    if (!handGesture || handGesture.mode !== "reorder") return;
    const cards = [...UI.privateHand.querySelectorAll("[data-card-id]")].filter(element => element.dataset.cardId !== handGesture.cardId);
    const sorted = cards.map(element => ({ element, rect: element.getBoundingClientRect() })).sort((a, b) => a.rect.left - b.rect.left);
    const index = sorted.filter(item => clientX > item.rect.left + item.rect.width / 2).length;
    if (!force && index === handGesture.insertIndex && handGesture.slot?.isConnected) return;
    const previous = captureHandRects();
    handGesture.insertIndex = index;
    UI.privateHand.insertBefore(handGesture.slot, sorted[index]?.element || null);
    animateHandReflow(previous);
  }

  function captureHandRects() {
    return new Map([...UI.privateHand.querySelectorAll("[data-card-id]")].map(element => [element.dataset.cardId, element.getBoundingClientRect()]));
  }

  function animateHandReflow(previous) {
    requestAnimationFrame(() => {
      UI.privateHand.querySelectorAll("[data-card-id]").forEach(element => {
        if (element.dataset.cardId === handGesture?.cardId) return;
        const before = previous.get(element.dataset.cardId);
        if (!before) return;
        const after = element.getBoundingClientRect();
        const dx = before.left - after.left;
        const dy = before.top - after.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        element.animate([{ translate: `${dx}px ${dy}px` }, { translate: "0 0" }], { duration: 175, easing: "cubic-bezier(.2,.8,.2,1)" });
      });
    });
  }

  async function endHandGesture(event) {
    if (!handGesture || event.pointerId !== handGesture.pointerId) return;
    const gesture = handGesture;
    if (!gesture.moved) {
      cleanupHandGesture();
      if (gesture.playable) playCard(state.current, gesture.cardId);
      return;
    }
    if (gesture.mode === "play") {
      cleanupHandGesture();
      navigator.vibrate?.(10);
      playCard(state.current, gesture.cardId);
      return;
    }
    if (gesture.mode === "invalid-play") {
      await animateGhostBack(gesture);
      cleanupHandGesture();
      toast(getIllegalPlayReason(gesture.cardId));
      return;
    }
    if (gesture.mode === "reorder") {
      const player = state.players[state.current];
      const from = player.hand.findIndex(card => card.id === gesture.cardId);
      const insert = Math.max(0, Math.min(player.hand.length - 1, gesture.insertIndex));
      cleanupHandGesture();
      const [card] = player.hand.splice(from, 1);
      player.hand.splice(Math.min(insert, player.hand.length), 0, card);
      navigator.vibrate?.(6);
      renderPrivateHand();
      return;
    }
    await animateGhostBack(gesture);
    cleanupHandGesture();
  }

  async function cancelHandGesture() {
    const gesture = handGesture;
    if (gesture?.moved) await animateGhostBack(gesture);
    cleanupHandGesture();
  }

  async function animateGhostBack(gesture) {
    if (!gesture?.ghost || !gesture.element?.isConnected) return;
    const ghostRect = gesture.ghost.getBoundingClientRect();
    const sourceRect = gesture.sourceRect || gesture.element.getBoundingClientRect();
    const dx = sourceRect.left + sourceRect.width / 2 - (ghostRect.left + ghostRect.width / 2);
    const dy = sourceRect.top + sourceRect.height / 2 - (ghostRect.top + ghostRect.height / 2);
    const animation = gesture.ghost.animate([
      { transform: "translate(-50%,-88%) rotate(-3deg) scale(1.06)", opacity: .98 },
      { transform: `translate(calc(-50% + ${dx}px),calc(-88% + ${dy}px)) rotate(0deg) scale(.96)`, opacity: .3 }
    ], { duration: 220, easing: "cubic-bezier(.22,.78,.18,1)", fill: "forwards" });
    try { await animation.finished; } catch (_) {}
  }

  function cleanupHandGesture() {
    if (!handGesture) return;
    handGesture.element?.classList.remove("gesture-source");
    handGesture.ghost?.remove();
    handGesture.slot?.remove();
    document.removeEventListener("pointermove", moveHandGesture);
    document.removeEventListener("pointerup", endHandGesture);
    document.removeEventListener("pointercancel", cancelHandGesture);
    UI.localTrickRing.classList.remove("play-drop-active", "play-drop-valid", "play-drop-invalid");
    handGesture = null;
  }

  function finishGame(specialWinner = null, reason = "puntos") {
    state.phase = "finished";
    window.TuteDB?.remove("local-current").catch(() => {});
    localSaveRecord = null;
    window.TutePWA?.setPlaying(false);
    state.revealed = false;
    render();
    let title = "Partida terminada";
    let ranking = [];
    if (specialWinner !== null) {
      if (state.config.teams) {
        const team = specialWinner % 2;
        const members = team === 0 ? [state.players[0].name, state.players[2].name] : [state.players[1].name, state.players[3].name];
        title = `${members.join(" y ")} ganan por ${reason.toLowerCase()}`;
      } else title = `${state.players[specialWinner].name} gana por ${reason.toLowerCase()}`;
    }

    if (state.config.teams) {
      ranking = [
        { name: `${state.players[0].name} + ${state.players[2].name}`, score: totalPlayer(0) + totalPlayer(2) },
        { name: `${state.players[1].name} + ${state.players[3].name}`, score: totalPlayer(1) + totalPlayer(3) }
      ].sort((a, b) => b.score - a.score);
      if (specialWinner === null) title = `${ranking[0].name} ganan la partida`;
    } else {
      ranking = state.players.map((player, id) => ({ name: player.name, score: totalPlayer(id), id })).sort((a, b) => b.score - a.score);
      if (specialWinner === null) title = `${ranking[0].name} gana la partida`;
    }

    UI.localResultSeal.textContent = "T";
    UI.localResultTitle.textContent = title;
    UI.localResultText.textContent = `Mesa local completada en ${state.trickNumber} bazas. Ninguna mano ha permanecido visible durante los cambios de jugador.`;
    UI.localFinalRanking.innerHTML = ranking.map((entry, index) => `<div class="final-row"><span>${index + 1}. ${entry.name}</span><strong>${entry.score}</strong></div>`).join("");
    updateStats();
    setTimeout(() => UI.localResult.showModal(), 420);
  }

  function renderRules() {
    const count = state.config.count || Number(document.querySelector('input[name="localPlayerCount"]:checked')?.value || 2);
    const teams = count === 4 && (state.config.teams || document.querySelector('input[name="localFourMode"]:checked')?.value === "pairs");
    UI.localRulesHeading.textContent = count === 2 ? "Uno contra uno" : count === 3 ? "Tres jugadores · primer cante" : teams ? "Cuatro por parejas" : "Cuatro individual";
    const rules = [
      ["01", "Privacidad", "Solo se muestra la mano del jugador activo. Después de cada acción, la pantalla se bloquea antes de pasar el dispositivo."],
      ["02", "Asistir", "Debes jugar siempre el palo de salida cuando tengas alguna carta de ese palo."],
      ["03", "Montar", "Si la baza sigue ganándose con el palo de salida y puedes superarla, debes hacerlo."],
      ["04", "Baza fallada", "Si ya gana un triunfo pero tienes el palo de salida, debes asistir, aunque no necesitas superar la carta inicial."],
      ["05", "Fallar y pisar", "Sin el palo de salida, debes usar triunfo. Si ya hay triunfo, debes superarlo cuando puedas; si no puedes, el descarte es libre."],
      ["06", "Cantes", count === 3 ? "No existe triunfo inicial. El primer cante vale 40 y fija ese palo como triunfo; los siguientes valen 40 o 20." : count === 2 ? "Mientras queda baceta puedes cantar después de cualquier baza ganada. Al agotarse, solo puedes cantar al ganar tu primera baza de la fase final: 40 en triunfo o 20 en otro palo." : "Después de ganar una baza, rey y caballo del triunfo valen 40; los demás palos, 20."],
      ["07", "Final", "Las cartas suman 120 puntos y la última baza añade 10. Gana el mayor total."],
      ["08", count === 2 ? "Cambio del pinte" : teams ? "Parejas" : "Orden de turno", count === 2 ? "Después de ganar una baza, el siete cambia un pinte alto y el dos cambia un pinte bajo." : teams ? "Los jugadores 1 y 3 forman equipo; los jugadores 2 y 4 forman el otro." : "Quien gana una baza abre la siguiente."]
    ];
    UI.localRulesGrid.innerHTML = rules.map(([n, title, text]) => `<article><span>${n}</span><h3>${title}</h3><p>${text}</p></article>`).join("");
  }

  function normalizeLocalState(snapshot) {
    snapshot.players ||= [];
    snapshot.players.forEach(player => {
      if (!(player.sung instanceof Set)) player.sung = new Set(player.sung || []);
      player.postStockCanteChanceUsed = Boolean(player.postStockCanteChanceUsed);
    });
    snapshot.busy = false;
    snapshot.revealed = false;
    snapshot.lastDrawnId = null;
    if (!["finished", "setup", "dealing"].includes(snapshot.phase)) snapshot.phase = "handoff";
    return snapshot;
  }

  function localSnapshot() {
    const snapshot = structuredClone(state);
    return normalizeLocalState(snapshot);
  }

  function queueLocalAutosave() {
    if (!window.TuteDB || !state.players.length || ["setup", "dealing", "finished"].includes(state.phase) || state.busy) return;
    clearTimeout(localAutosaveTimer);
    localAutosaveTimer = setTimeout(async () => {
      try {
        const snapshot = localSnapshot();
        localSaveRecord = await window.TuteDB.save("local-current", snapshot, {
          title: `${state.config.count} jugadores · ${state.config.teams ? "por parejas" : "individual"}`,
          detail: `Baza ${state.trickNumber} · turno de ${state.players[state.current]?.name || "jugador"}`,
          href: "local.html"
        });
        refreshLocalSaveCard();
      } catch (_) {}
    }, 500);
  }

  async function refreshLocalSaveCard() {
    if (!UI.localResumeCard || !window.TuteDB) return;
    try {
      localSaveRecord = await window.TuteDB.load("local-current");
      const valid = Boolean(localSaveRecord?.value?.players?.length && localSaveRecord.value.phase !== "finished");
      UI.localResumeCard.classList.toggle("hidden", !valid);
      if (!valid) return;
      UI.localResumeTitle.textContent = localSaveRecord.meta?.title || "Continuar mesa local";
      const age = Math.max(0, Math.round((Date.now() - localSaveRecord.updatedAt) / 60000));
      UI.localResumeMeta.textContent = `${localSaveRecord.meta?.detail || "Partida guardada"} · ${age < 1 ? "ahora" : `hace ${age} min`}`;
    } catch (_) { UI.localResumeCard.classList.add("hidden"); }
  }

  async function discardLocalSave() {
    await window.TuteDB?.remove("local-current").catch(() => {});
    localSaveRecord = null;
    UI.localResumeCard?.classList.add("hidden");
    window.TutePWA?.toast("Partida local descartada.");
  }

  async function resumeLocalGame() {
    try {
      const record = localSaveRecord || await window.TuteDB.load("local-current");
      if (!record?.value?.players?.length) throw new Error("invalid-save");
      cleanupHandGesture();
      const snapshot = normalizeLocalState(record.value);
      Object.keys(state).forEach(key => delete state[key]);
      Object.assign(state, snapshot);
      UI.localSetup.close();
      clearTable();
      renderRules();
      preparePrivateTurn(state.current, state.stage || "play");
      startMusic();
      window.TutePWA?.setPlaying(true);
      window.TutePWA?.toast("Mesa local recuperada con las manos ocultas.");
    } catch (_) {
      discardLocalSave();
      window.TutePWA?.toast("La partida guardada no se pudo recuperar.");
    }
  }

  function lockPrivateView() {
    if (!state.players.length || !state.revealed || state.phase !== "active") return;
    state.revealed = false;
    state.phase = "handoff";
    cleanupHandGesture();
    render();
  }

  function updateStats() {
    try {
      const stats = JSON.parse(localStorage.getItem("tuteIaStats") || "{}");
      stats.matchesPlayed = (stats.matchesPlayed || 0) + 1;
      stats.localMatches = (stats.localMatches || 0) + 1;
      stats.variantPlays ||= {};
      const key = state.config.count === 4 && state.config.teams ? "local4pairs" : `local${state.config.count}`;
      stats.variantPlays[key] = (stats.variantPlays[key] || 0) + 1;
      localStorage.setItem("tuteIaStats", JSON.stringify(stats));
    } catch (_) {}
  }

  async function startMusic() {
    try {
      const enabled = localStorage.getItem("tuteIaMusicEnabled") !== "false";
      const volume = Number(localStorage.getItem("tuteIaMusicVolume"));
      UI.localMusic.volume = Number.isFinite(volume) ? volume : .28;
      if (enabled) {
        await UI.localMusic.play();
        musicEnabled = true;
        UI.localMusicButton.textContent = "♫";
      }
      window.TuteMusicContinuity?.sync();
    } catch (_) {}
  }

  async function toggleMusic() {
    if (!musicEnabled) {
      try {
        await UI.localMusic.play();
        musicEnabled = true;
        localStorage.setItem("tuteIaMusicEnabled", "true");
        UI.localMusicButton.textContent = "♫";
      } catch (_) {}
    } else {
      window.TuteMusicContinuity?.savePosition();
      UI.localMusic.pause();
      musicEnabled = false;
      localStorage.setItem("tuteIaMusicEnabled", "false");
      UI.localMusicButton.textContent = "♩";
    }
  }

  function totalPlayer(id) {
    const player = state.players[id];
    return (player?.cardPoints || 0) + (player?.songPoints || 0);
  }

  function addLog(html) {
    state.log.push(html);
    if (state.log.length > 100) state.log.shift();
    renderLog();
  }

  function cardName(card) {
    return `${RANK_MAP[card.rank].label} de ${SUIT_LABELS[card.suit]}`;
  }

  function initials(name) {
    return String(name).trim().split(/\s+/).slice(0, 2).map(word => word[0]?.toUpperCase()).join("") || "J";
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function toast(text) {
    const element = document.createElement("div");
    element.textContent = text;
    Object.assign(element.style, {
      position: "fixed", left: "50%", bottom: "24px", transform: "translateX(-50%)", zIndex: "3200",
      maxWidth: "min(520px,calc(100vw - 24px))", padding: "12px 16px", borderRadius: "12px",
      color: "#172018", background: "#f0cf83", boxShadow: "0 18px 44px rgba(0,0,0,.45)",
      fontSize: "10px", fontWeight: "900", textAlign: "center"
    });
    document.body.appendChild(element);
    setTimeout(() => element.remove(), 2600);
  }
})();
