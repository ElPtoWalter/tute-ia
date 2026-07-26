(() => {
  "use strict";

  const SUITS = ["oros", "copas", "espadas", "bastos"];
  const SUIT_LABELS = {
    oros: "oros",
    copas: "copas",
    espadas: "espadas",
    bastos: "bastos"
  };

  const RANKS = [
    { rank: 1,  label: "As",      short: "A", points: 11, strength: 10 },
    { rank: 3,  label: "Tres",    short: "3", points: 10, strength: 9 },
    { rank: 12, label: "Rey",     short: "R", points: 4,  strength: 8 },
    { rank: 11, label: "Caballo", short: "C", points: 3,  strength: 7 },
    { rank: 10, label: "Sota",    short: "S", points: 2,  strength: 6 },
    { rank: 7,  label: "Siete",   short: "7", points: 0,  strength: 5 },
    { rank: 6,  label: "Seis",    short: "6", points: 0,  strength: 4 },
    { rank: 5,  label: "Cinco",   short: "5", points: 0,  strength: 3 },
    { rank: 4,  label: "Cuatro",  short: "4", points: 0,  strength: 2 },
    { rank: 2,  label: "Dos",     short: "2", points: 0,  strength: 1 }
  ];

  const RANK_MAP = Object.fromEntries(RANKS.map(r => [r.rank, r]));
  const UI = {};
  let audioContext = null;
  let soundEnabled = true;
  let timers = [];

  const state = {
    settings: {
      difficulty: "normal",
      targetRounds: 3,
      allowTute: true
    },
    match: {
      playerRounds: 0,
      aiRounds: 0,
      round: 0
    },
    round: null
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheUI();
    bindUI();
    renderEmptyState();
    UI.setupModal.showModal();
  }

  function cacheUI() {
    [
      "aiName", "aiHand", "playerHand", "aiTrickSlot", "playerTrickSlot",
      "deckStack", "deckCount", "trumpCard", "phaseBadge", "statusText",
      "canteActions", "exchangeButton", "hintText", "aiTurnPill",
      "playerTurnPill", "roundNumber", "playerRounds", "aiRounds",
      "playerCardPoints", "aiCardPoints", "playerSongPoints", "aiSongPoints",
      "playerTotal", "aiTotal", "targetRounds", "roundPips",
      "ruleStateTitle", "ruleStateText", "playerTricks", "aiTricks",
      "unknownCards", "gameLog", "setupModal", "rulesModal", "resultModal",
      "setupForm", "targetSelect", "tuteToggle", "soundButton", "soundIcon",
      "newMatchButton", "rulesButton", "closeRulesButton", "rulesUnderstoodButton",
      "resultKicker", "resultEmblem", "resultTitle", "resultSummary",
      "resultPlayerScore", "resultAiScore", "resultActionButton",
      "resultExitButton", "toastRegion", "brandButton"
    ].forEach(id => UI[id] = document.getElementById(id));
  }

  function bindUI() {
    document.querySelectorAll('input[name="difficulty"]').forEach(input => {
      input.addEventListener("change", () => {
        document.querySelectorAll(".choice-card").forEach(card => card.classList.remove("selected"));
        input.closest(".choice-card").classList.add("selected");
      });
    });

    UI.setupForm.addEventListener("submit", event => {
      event.preventDefault();
      const difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || "normal";
      state.settings.difficulty = difficulty;
      state.settings.targetRounds = Number(UI.targetSelect.value);
      state.settings.allowTute = UI.tuteToggle.checked;
      UI.setupModal.close();
      startMatch();
    });

    UI.newMatchButton.addEventListener("click", () => UI.setupModal.showModal());
    UI.brandButton.addEventListener("click", () => UI.setupModal.showModal());
    UI.rulesButton.addEventListener("click", () => UI.rulesModal.showModal());
    UI.closeRulesButton.addEventListener("click", () => UI.rulesModal.close());
    UI.rulesUnderstoodButton.addEventListener("click", () => UI.rulesModal.close());
    UI.soundButton.addEventListener("click", toggleSound);
    UI.exchangeButton.addEventListener("click", () => exchangeTrump("player"));
    UI.resultActionButton.addEventListener("click", handleResultAction);
    UI.resultExitButton.addEventListener("click", () => {
      UI.resultModal.close();
      UI.setupModal.showModal();
    });
  }

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function later(fn, delay) {
    const id = setTimeout(fn, delay);
    timers.push(id);
    return id;
  }

  function startMatch() {
    clearTimers();
    state.match.playerRounds = 0;
    state.match.aiRounds = 0;
    state.match.round = 0;
    startRound();
  }

  function startRound() {
    clearTimers();
    state.match.round += 1;

    const deck = shuffle(buildDeck());
    const playerHand = [];
    const aiHand = [];

    for (let i = 0; i < 8; i += 1) {
      playerHand.push(deck.pop());
      aiHand.push(deck.pop());
    }

    const trumpCard = deck.pop();
    const starter = state.match.round % 2 === 1 ? "player" : "ai";

    state.round = {
      stock: deck,
      trumpCard,
      trumpSuit: trumpCard.suit,
      hands: {
        player: sortHand(playerHand),
        ai: sortHand(aiHand)
      },
      captured: {
        player: [],
        ai: []
      },
      cardPoints: {
        player: 0,
        ai: 0
      },
      songPoints: {
        player: 0,
        ai: 0
      },
      tricksWon: {
        player: 0,
        ai: 0
      },
      hasWonTrick: {
        player: false,
        ai: false
      },
      sungSuits: {
        player: new Set(),
        ai: new Set()
      },
      playedCards: [],
      trick: [],
      leader: starter,
      currentTurn: starter,
      pendingCante: null,
      lastTrickWinner: null,
      phase: "playing",
      log: [],
      specialWin: null
    };

    addLog(`<strong>Mano ${state.match.round}.</strong> ${starter === "player" ? "Sales tú." : "Sale la IA."}`);
    addLog(`Pinta <strong>${cardName(trumpCard)}</strong>.`);
    playSound("deal");
    render();

    if (starter === "ai") {
      scheduleAiTurn();
    }
  }

  function buildDeck() {
    const deck = [];
    SUITS.forEach(suit => {
      RANKS.forEach(rankData => {
        deck.push({
          id: `${suit}-${rankData.rank}`,
          suit,
          rank: rankData.rank,
          label: rankData.label,
          short: rankData.short,
          points: rankData.points,
          strength: rankData.strength
        });
      });
    });
    return deck;
  }

  function shuffle(cards) {
    const copy = [...cards];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function sortHand(hand) {
    const suitOrder = Object.fromEntries(SUITS.map((s, i) => [s, i]));
    return hand.sort((a, b) => {
      if (a.suit !== b.suit) return suitOrder[a.suit] - suitOrder[b.suit];
      return b.strength - a.strength;
    });
  }

  function drawPileCount() {
    if (!state.round) return 0;
    return state.round.stock.length + (state.round.trumpCard ? 1 : 0);
  }

  function isStrictPhase() {
    return drawPileCount() === 0;
  }

  function renderEmptyState() {
    UI.playerHand.innerHTML = "";
    UI.aiHand.innerHTML = "";
    UI.trumpCard.innerHTML = "";
    UI.aiTrickSlot.innerHTML = '<span class="slot-label">IA</span>';
    UI.playerTrickSlot.innerHTML = '<span class="slot-label">TÚ</span>';
  }

  function render() {
    if (!state.round) return;

    renderHands();
    renderTrick();
    renderDeck();
    renderStatus();
    renderScores();
    renderLog();
    renderActions();
  }

  function renderHands() {
    const round = state.round;
    const legalIds = round.currentTurn === "player" && !round.pendingCante && round.phase === "playing"
      ? new Set(getLegalCards("player").map(card => card.id))
      : new Set();

    UI.playerHand.innerHTML = "";
    round.hands.player.forEach((card, index) => {
      const cardButton = createCardElement(card, { button: true });
      cardButton.style.zIndex = index + 1;
      const isPlayable = legalIds.has(card.id);
      cardButton.disabled = !isPlayable;
      if (!isPlayable) cardButton.classList.add("illegal");
      cardButton.setAttribute("aria-label", `${cardName(card)}${isPlayable ? ", jugar" : ", no disponible"}`);
      cardButton.addEventListener("click", () => playCard("player", card.id));
      UI.playerHand.appendChild(cardButton);
    });

    UI.aiHand.innerHTML = "";
    round.hands.ai.forEach((_, index) => {
      const back = createBackCard();
      back.style.zIndex = index + 1;
      UI.aiHand.appendChild(back);
    });
  }

  function renderTrick() {
    UI.aiTrickSlot.innerHTML = '<span class="slot-label">IA</span>';
    UI.playerTrickSlot.innerHTML = '<span class="slot-label">TÚ</span>';

    state.round.trick.forEach(play => {
      const slot = play.actor === "player" ? UI.playerTrickSlot : UI.aiTrickSlot;
      slot.innerHTML = "";
      slot.appendChild(createCardElement(play.card));
    });
  }

  function renderDeck() {
    const count = drawPileCount();
    UI.deckCount.textContent = count;
    UI.deckStack.classList.toggle("hidden", count === 0);
    UI.trumpCard.innerHTML = "";
    if (state.round.trumpCard) {
      UI.trumpCard.appendChild(createCardElement(state.round.trumpCard));
    } else {
      UI.trumpCard.innerHTML = '<span class="slot-label">AGOTADO</span>';
    }
  }

  function renderStatus() {
    const round = state.round;
    const strict = isStrictPhase();
    UI.phaseBadge.textContent = strict ? "JUEGO OBLIGADO" : "BACETA ABIERTA";
    UI.phaseBadge.classList.toggle("strict", strict);

    UI.ruleStateTitle.textContent = strict ? "Asistir y montar" : "Juego libre";
    UI.ruleStateText.textContent = strict
      ? "Sin baceta: debes asistir, montar si puedes y fallar con triunfo cuando no tengas el palo."
      : "Mientras quede baceta puedes jugar cualquier carta.";

    const isPlayerTurn = round.currentTurn === "player" && round.phase === "playing";
    const isAiTurn = round.currentTurn === "ai" && round.phase === "playing";
    UI.playerTurnPill.classList.toggle("visible", isPlayerTurn);
    UI.aiTurnPill.classList.toggle("visible", isAiTurn);

    if (round.pendingCante?.actor === "player") {
      UI.statusText.textContent = "Has ganado la baza. Puedes cantar.";
    } else if (round.pendingCante?.actor === "ai") {
      UI.statusText.textContent = "La IA está valorando un cante.";
    } else if (round.trick.length === 1) {
      const opener = round.trick[0].actor;
      UI.statusText.textContent = opener === "player" ? "La IA debe responder." : "Te toca responder.";
    } else if (isPlayerTurn) {
      UI.statusText.textContent = round.leader === "player" ? "Abres la baza." : "Juega tu carta.";
    } else {
      UI.statusText.textContent = "Doña Virtud está calculando.";
    }

    const unseen = round.hands.ai.length + drawPileCount();
    UI.unknownCards.textContent = unseen;
  }

  function renderScores() {
    const round = state.round;
    const playerTotal = round.cardPoints.player + round.songPoints.player;
    const aiTotal = round.cardPoints.ai + round.songPoints.ai;

    UI.roundNumber.textContent = `MANO ${state.match.round}`;
    UI.playerRounds.textContent = state.match.playerRounds;
    UI.aiRounds.textContent = state.match.aiRounds;
    UI.playerCardPoints.textContent = round.cardPoints.player;
    UI.aiCardPoints.textContent = round.cardPoints.ai;
    UI.playerSongPoints.textContent = round.songPoints.player;
    UI.aiSongPoints.textContent = round.songPoints.ai;
    UI.playerTotal.textContent = playerTotal;
    UI.aiTotal.textContent = aiTotal;
    UI.playerTricks.textContent = round.tricksWon.player;
    UI.aiTricks.textContent = round.tricksWon.ai;
    UI.targetRounds.textContent = `${state.settings.targetRounds} ${state.settings.targetRounds === 1 ? "mano" : "manos"}`;

    UI.roundPips.style.setProperty("--pip-count", state.settings.targetRounds);
    UI.roundPips.innerHTML = "";
    for (let i = 0; i < state.settings.targetRounds; i += 1) {
      const pip = document.createElement("span");
      pip.className = "round-pip";
      if (i < state.match.playerRounds) pip.classList.add("player");
      else if (i < state.match.playerRounds + state.match.aiRounds) pip.classList.add("ai");
      UI.roundPips.appendChild(pip);
    }
  }

  function renderLog() {
    UI.gameLog.innerHTML = state.round.log
      .slice(-9)
      .reverse()
      .map(entry => `<div class="log-entry">${entry}</div>`)
      .join("");
  }

  function renderActions() {
    const round = state.round;
    UI.canteActions.innerHTML = "";

    if (round.pendingCante?.actor === "player") {
      round.pendingCante.options.forEach(option => {
        const button = document.createElement("button");
        button.className = "cante-button";
        button.textContent = option.type === "tute"
          ? `Cantar ${option.label}`
          : `Cantar ${option.points} en ${SUIT_LABELS[option.suit]}`;
        button.addEventListener("click", () => resolveCanteChoice(option));
        UI.canteActions.appendChild(button);
      });

      const pass = document.createElement("button");
      pass.className = "pass-button";
      pass.textContent = "No cantar";
      pass.addEventListener("click", () => resolveCanteChoice(null));
      UI.canteActions.appendChild(pass);
      UI.hintText.textContent = "Solo puede declararse un cante por baza ganada.";
    } else {
      UI.hintText.textContent = getHintText();
    }

    const exchange = getExchangeOption("player");
    const canShowExchange = exchange &&
      round.currentTurn === "player" &&
      round.trick.length === 0 &&
      !round.pendingCante &&
      round.phase === "playing";

    UI.exchangeButton.classList.toggle("hidden", !canShowExchange);
    if (canShowExchange) {
      UI.exchangeButton.textContent = `Cambiar ${RANK_MAP[exchange.requiredRank].label.toLowerCase()} por el pinte`;
    }
  }

  function getHintText() {
    const round = state.round;
    if (round.phase !== "playing") return "La mano ha terminado.";
    if (round.currentTurn === "ai") return "La IA solo conoce sus cartas y las jugadas visibles.";
    if (!isStrictPhase()) return "Baceta abierta: puedes jugar cualquiera de tus cartas.";
    const legal = getLegalCards("player");
    if (legal.length === round.hands.player.length) return "Puedes jugar cualquier carta.";
    if (round.trick.length === 1) {
      const lead = round.trick[0].card;
      if (legal.every(c => c.suit === lead.suit)) return `Debes asistir a ${SUIT_LABELS[lead.suit]}.`;
      if (legal.every(c => c.suit === round.trumpSuit)) return `No tienes ${SUIT_LABELS[lead.suit]}: debes fallar.`;
    }
    return "La web ha marcado automáticamente tus jugadas legales.";
  }

  function createCardElement(card, options = {}) {
    const element = document.createElement(options.button ? "button" : "div");
    element.className = `playing-card suit-${card.suit}`;
    if (options.button) element.type = "button";

    const rankData = RANK_MAP[card.rank];
    const court = [10, 11, 12].includes(card.rank);
    const pipCount = [1, 2, 3, 4, 5, 6, 7].includes(card.rank) ? Math.min(card.rank, 5) : 1;
    const pips = Array.from({ length: pipCount }, () => suitIcon(card.suit)).join("");

    element.innerHTML = `
      <div class="card-face">
        <div class="card-corner">
          <span>${rankData.short}</span>
          ${suitIcon(card.suit)}
        </div>
        <div class="card-art">
          ${court
            ? `<div class="court-badge">${rankData.short}</div><span class="rank-word">${rankData.label.toUpperCase()}</span>`
            : `<div class="pip-row">${pips}</div><span class="rank-word">${rankData.label.toUpperCase()}</span>`
          }
        </div>
        <div class="card-corner bottom">
          <span>${rankData.short}</span>
          ${suitIcon(card.suit)}
        </div>
      </div>
    `;
    return element;
  }

  function createBackCard() {
    const card = document.createElement("div");
    card.className = "playing-card";
    card.innerHTML = '<div class="card-back"></div>';
    return card;
  }

  function suitIcon(suit) {
    const common = 'viewBox="0 0 64 64" aria-hidden="true" focusable="false"';
    if (suit === "oros") {
      return `<svg ${common}><circle cx="32" cy="32" r="23" fill="currentColor"/><circle cx="32" cy="32" r="15" fill="none" stroke="#f8e4aa" stroke-width="4"/><path d="M17 32h30M32 17v30" stroke="#f8e4aa" stroke-width="3" opacity=".65"/></svg>`;
    }
    if (suit === "copas") {
      return `<svg ${common}><path d="M14 10h36c-1 19-6 29-15 32v8h10v6H19v-6h10v-8C20 39 15 29 14 10Z" fill="currentColor"/><path d="M20 16h24c-2 12-5 18-12 21-7-3-10-9-12-21Z" fill="#f3d4b1" opacity=".55"/></svg>`;
    }
    if (suit === "espadas") {
      return `<svg ${common}><path d="M32 4 42 15 35 43l8 8-5 5-6-8-6 8-5-5 8-8-7-28L32 4Z" fill="currentColor"/><path d="m32 11 4 7-4 21-4-21 4-7Z" fill="#d7e5e8" opacity=".68"/></svg>`;
    }
    return `<svg ${common}><g transform="rotate(-38 32 32)"><rect x="25" y="4" width="14" height="56" rx="7" fill="currentColor"/><path d="M24 17h16M24 28h16M24 39h16M24 50h16" stroke="#dce6cf" stroke-width="3" opacity=".55"/></g></svg>`;
  }

  function playCard(actor, cardId) {
    const round = state.round;
    if (!round || round.phase !== "playing" || round.currentTurn !== actor || round.pendingCante) return;

    const legalCards = getLegalCards(actor);
    const card = round.hands[actor].find(c => c.id === cardId);
    if (!card || !legalCards.some(c => c.id === cardId)) {
      showToast("<strong>Renuncio bloqueado.</strong> Esa carta no es legal ahora.");
      playSound("error");
      return;
    }

    const index = round.hands[actor].findIndex(c => c.id === cardId);
    round.hands[actor].splice(index, 1);
    round.trick.push({ actor, card });
    round.playedCards.push(card);
    addLog(`${actor === "player" ? "Tú juegas" : "La IA juega"} <strong>${cardName(card)}</strong>.`);
    playSound("card");
    render();

    if (round.trick.length === 1) {
      round.currentTurn = other(actor);
      render();
      if (round.currentTurn === "ai") scheduleAiTurn();
      return;
    }

    round.currentTurn = null;
    render();
    later(resolveTrick, 680);
  }

  function getLegalCards(actor) {
    const round = state.round;
    const hand = round.hands[actor];

    if (!isStrictPhase() || round.trick.length === 0) return [...hand];

    const leadCard = round.trick[0].card;
    const leadSuitCards = hand.filter(card => card.suit === leadCard.suit);

    if (leadSuitCards.length > 0) {
      const higher = leadSuitCards.filter(card => card.strength > leadCard.strength);
      return higher.length > 0 ? higher : leadSuitCards;
    }

    const trumps = hand.filter(card => card.suit === round.trumpSuit);
    if (trumps.length > 0) return trumps;

    return [...hand];
  }

  function resolveTrick() {
    const round = state.round;
    if (!round || round.trick.length !== 2) return;

    const first = round.trick[0];
    const second = round.trick[1];
    const winner = beats(second.card, first.card, first.card.suit, round.trumpSuit)
      ? second.actor
      : first.actor;

    const points = first.card.points + second.card.points;
    round.captured[winner].push(first.card, second.card);
    round.cardPoints[winner] += points;
    round.tricksWon[winner] += 1;
    round.hasWonTrick[winner] = true;
    round.lastTrickWinner = winner;
    round.leader = winner;

    addLog(`<strong>${winner === "player" ? "Ganas" : "La IA gana"} la baza</strong>${points ? ` y suma ${points}` : ""}.`);
    playSound(winner === "player" ? "winTrick" : "loseTrick");

    const options = getCanteOptions(winner);
    if (options.length > 0 && drawPileCount() > 0) {
      round.pendingCante = { actor: winner, options };
      render();
      if (winner === "ai") {
        later(() => resolveAiCante(options), 650);
      }
      return;
    }

    continueAfterTrick();
  }

  function beats(challenger, current, leadSuit, trumpSuit) {
    if (challenger.suit === current.suit) {
      return challenger.strength > current.strength;
    }
    if (challenger.suit === trumpSuit && current.suit !== trumpSuit) return true;
    if (current.suit === trumpSuit) return false;
    return challenger.suit === leadSuit && current.suit !== leadSuit;
  }

  function getCanteOptions(actor) {
    const round = state.round;
    const hand = round.hands[actor];
    const options = [];

    if (state.settings.allowTute) {
      const kings = hand.filter(c => c.rank === 12);
      const knights = hand.filter(c => c.rank === 11);
      if (kings.length === 4) {
        return [{ type: "tute", label: "tute de reyes", rank: 12 }];
      }
      if (knights.length === 4) {
        return [{ type: "tute", label: "tute de caballos", rank: 11 }];
      }
    }

    const possibleSuits = SUITS.filter(suit => {
      if (round.sungSuits[actor].has(suit)) return false;
      return hand.some(c => c.suit === suit && c.rank === 12) &&
             hand.some(c => c.suit === suit && c.rank === 11);
    });

    if (possibleSuits.includes(round.trumpSuit)) {
      return [{ type: "song", suit: round.trumpSuit, points: 40 }];
    }

    possibleSuits.forEach(suit => {
      options.push({ type: "song", suit, points: 20 });
    });

    return options;
  }

  function resolveAiCante(options) {
    const round = state.round;
    if (!round.pendingCante || round.pendingCante.actor !== "ai") return;
    const choice = chooseAiCante(options);
    resolveCanteChoice(choice);
  }

  function chooseAiCante(options) {
    if (!options.length) return null;
    if (options[0].type === "tute") return options[0];
    if (state.settings.difficulty === "easy" && Math.random() < 0.22) return null;
    return [...options].sort((a, b) => b.points - a.points)[0];
  }

  function resolveCanteChoice(option) {
    const round = state.round;
    const pending = round.pendingCante;
    if (!pending) return;
    const actor = pending.actor;
    round.pendingCante = null;

    if (!option) {
      addLog(`${actor === "player" ? "Renuncias" : "La IA renuncia"} al cante.`);
      continueAfterTrick();
      return;
    }

    if (option.type === "tute") {
      round.specialWin = actor;
      addLog(`<strong>${actor === "player" ? "Cantas" : "La IA canta"} ${option.label}.</strong>`);
      playSound("song");
      finishRound(actor, option.label);
      return;
    }

    round.songPoints[actor] += option.points;
    round.sungSuits[actor].add(option.suit);
    addLog(`<strong>${actor === "player" ? "Cantas" : "La IA canta"} ${option.points} en ${SUIT_LABELS[option.suit]}.</strong>`);
    showToast(`<strong>+${option.points}</strong> para ${actor === "player" ? "ti" : "la IA"} · ${SUIT_LABELS[option.suit]}`);
    playSound("song");
    continueAfterTrick();
  }

  function continueAfterTrick() {
    const round = state.round;
    if (!round || round.phase !== "playing") return;

    if (round.hands.player.length === 0 && round.hands.ai.length === 0 && drawPileCount() === 0) {
      round.cardPoints[round.lastTrickWinner] += 10;
      addLog(`<strong>Diez de últimas</strong> para ${round.lastTrickWinner === "player" ? "ti" : "la IA"}.`);
      const playerTotal = totalPoints("player");
      const aiTotal = totalPoints("ai");
      const winner = playerTotal === aiTotal ? round.lastTrickWinner : (playerTotal > aiTotal ? "player" : "ai");
      finishRound(winner, "puntos");
      return;
    }

    if (drawPileCount() > 0) {
      const winner = round.leader;
      const loser = other(winner);
      drawToHand(winner);
      drawToHand(loser);
      round.hands.player = sortHand(round.hands.player);
      round.hands.ai = sortHand(round.hands.ai);
      addLog(`${winner === "player" ? "Robas primero" : "La IA roba primero"}.`);
      playSound("draw");
    }

    round.trick = [];
    round.currentTurn = round.leader;
    render();

    if (round.currentTurn === "ai") {
      const exchange = getExchangeOption("ai");
      if (exchange && state.settings.difficulty !== "easy") {
        later(() => {
          exchangeTrump("ai");
          scheduleAiTurn();
        }, 450);
      } else {
        scheduleAiTurn();
      }
    }
  }

  function drawToHand(actor) {
    const round = state.round;
    let card = null;
    if (round.stock.length > 0) {
      card = round.stock.pop();
    } else if (round.trumpCard) {
      card = round.trumpCard;
      round.trumpCard = null;
    }
    if (card) round.hands[actor].push(card);
  }

  function getExchangeOption(actor) {
    const round = state.round;
    if (!round || !round.trumpCard || !round.hasWonTrick[actor]) return null;
    if (round.leader !== actor || round.trick.length !== 0) return null;

    const pinte = round.trumpCard;
    const highPinte = [1, 3, 10, 11, 12].includes(pinte.rank);
    const requiredRank = highPinte ? 7 : 2;
    if (pinte.rank === requiredRank) return null;

    const card = round.hands[actor].find(c => c.suit === round.trumpSuit && c.rank === requiredRank);
    return card ? { card, requiredRank } : null;
  }

  function exchangeTrump(actor) {
    const round = state.round;
    const option = getExchangeOption(actor);
    if (!option) return;

    const hand = round.hands[actor];
    const index = hand.findIndex(c => c.id === option.card.id);
    const oldPinte = round.trumpCard;
    hand[index] = oldPinte;
    round.trumpCard = option.card;
    sortHand(hand);

    addLog(`<strong>${actor === "player" ? "Cambias" : "La IA cambia"} el pinte:</strong> ${cardName(option.card)} por ${cardName(oldPinte)}.`);
    showToast(`${actor === "player" ? "Has cambiado" : "La IA cambia"} el pinte`);
    playSound("exchange");
    render();
  }

  function scheduleAiTurn() {
    const round = state.round;
    if (!round || round.currentTurn !== "ai" || round.phase !== "playing" || round.pendingCante) return;

    render();
    const delay = state.settings.difficulty === "hard" ? 760 : 620;
    later(() => {
      const current = state.round;
      if (!current || current.currentTurn !== "ai" || current.phase !== "playing") return;
      const card = chooseAiCard();
      playCard("ai", card.id);
    }, delay);
  }

  function chooseAiCard() {
    const round = state.round;
    const legal = getLegalCards("ai");
    if (legal.length === 1) return legal[0];

    if (state.settings.difficulty === "easy") {
      return legal[Math.floor(Math.random() * legal.length)];
    }

    const opponentCard = round.trick[0]?.card || null;
    const leadSuit = opponentCard?.suit || null;
    const songPairs = getProtectedSongCards("ai");

    const scored = legal.map(card => {
      let score = 0;
      const wins = opponentCard ? beats(card, opponentCard, leadSuit, round.trumpSuit) : false;
      const trickValue = opponentCard ? opponentCard.points + card.points : card.points;

      if (opponentCard) {
        score += wins ? 36 + opponentCard.points * 5 : 0;
        score -= card.points * (wins ? 1.5 : 4.2);
        score -= card.strength * (wins ? 0.35 : 0.7);

        if (card.suit === round.trumpSuit) {
          score -= wins ? 7 : 16;
          if (opponentCard.points >= 10) score += 12;
        }

        if (!wins && card.points === 0) score += 14;
        if (!wins && card.points > 0) score -= 22;
        if (wins && trickValue >= 20) score += 18;
      } else {
        score -= card.points * 2.2;
        score -= card.strength * 0.8;
        if (card.suit === round.trumpSuit) score -= 9;
        if (card.points === 0) score += 9;

        const sameSuit = round.hands.ai.filter(c => c.suit === card.suit);
        const unknownHigher = countUnknownHigher(card);
        if (card.strength >= 9 && unknownHigher === 0) score += 24;
        if (sameSuit.length >= 4 && card.points === 0) score += 5;
      }

      if (songPairs.has(card.id)) score -= 20;

      if (state.settings.difficulty === "hard") {
        score += expertAdjustment(card, opponentCard, wins);
      }

      score += Math.random() * 1.8;
      return { card, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].card;
  }

  function getProtectedSongCards(actor) {
    const protectedIds = new Set();
    const hand = state.round.hands[actor];
    SUITS.forEach(suit => {
      if (state.round.sungSuits[actor].has(suit)) return;
      const king = hand.find(c => c.suit === suit && c.rank === 12);
      const knight = hand.find(c => c.suit === suit && c.rank === 11);
      if (king && knight) {
        protectedIds.add(king.id);
        protectedIds.add(knight.id);
      }
    });
    return protectedIds;
  }

  function countUnknownHigher(card) {
    const round = state.round;
    const knownIds = new Set([
      ...round.hands.ai.map(c => c.id),
      ...round.playedCards.map(c => c.id),
      ...(round.trumpCard ? [round.trumpCard.id] : [])
    ]);
    return RANKS.filter(r => r.strength > card.strength)
      .map(r => `${card.suit}-${r.rank}`)
      .filter(id => !knownIds.has(id))
      .length;
  }

  function expertAdjustment(card, opponentCard, wins) {
    const round = state.round;
    let score = 0;
    const stockOpen = drawPileCount() > 0;
    const trumpsSeen = round.playedCards.filter(c => c.suit === round.trumpSuit).length +
      round.hands.ai.filter(c => c.suit === round.trumpSuit).length +
      (round.trumpCard?.suit === round.trumpSuit ? 1 : 0);

    if (!stockOpen && card.suit === round.trumpSuit && trumpsSeen >= 8) score += 5;
    if (!stockOpen && opponentCard && wins && card.points === 0) score += 8;
    if (!stockOpen && !opponentCard && countUnknownHigher(card) === 0) score += 17;
    if (stockOpen && opponentCard && wins && opponentCard.points === 0 && card.suit === round.trumpSuit) score -= 9;

    return score;
  }

  function finishRound(winner, reason) {
    const round = state.round;
    round.phase = "roundOver";
    round.currentTurn = null;

    if (winner === "player") state.match.playerRounds += 1;
    else state.match.aiRounds += 1;

    const matchOver = state.match.playerRounds >= state.settings.targetRounds ||
                      state.match.aiRounds >= state.settings.targetRounds;
    const matchWinner = state.match.playerRounds > state.match.aiRounds ? "player" : "ai";

    render();
    updatePersistentStats(winner, matchOver ? matchWinner : null);

    const playerScore = totalPoints("player");
    const aiScore = totalPoints("ai");

    UI.resultPlayerScore.textContent = playerScore;
    UI.resultAiScore.textContent = aiScore;

    if (matchOver) {
      UI.resultKicker.textContent = "PARTIDA TERMINADA";
      UI.resultEmblem.textContent = matchWinner === "player" ? "V" : "D";
      UI.resultTitle.textContent = matchWinner === "player" ? "Has conquistado la mesa" : "Doña Virtud gana la partida";
      UI.resultSummary.textContent = matchWinner === "player"
        ? `Victoria por ${state.match.playerRounds} a ${state.match.aiRounds}. La IA no ha visto tus cartas en ningún momento.`
        : `Resultado final: ${state.match.playerRounds} a ${state.match.aiRounds}. Puedes bajar la dificultad o pedir la revancha.`;
      UI.resultActionButton.firstChild.textContent = " Revancha ";
      UI.resultActionButton.dataset.action = "rematch";
      playSound(matchWinner === "player" ? "victory" : "defeat");
    } else {
      UI.resultKicker.textContent = reason.includes?.("tute") ? "VICTORIA POR TUTE" : "MANO TERMINADA";
      UI.resultEmblem.textContent = winner === "player" ? "V" : "D";
      UI.resultTitle.textContent = winner === "player" ? "Has ganado la mano" : "La IA se lleva la mano";
      UI.resultSummary.textContent = reason === "puntos"
        ? `${winner === "player" ? "Te impones" : "Doña Virtud se impone"} por ${Math.max(playerScore, aiScore)} a ${Math.min(playerScore, aiScore)} tantos.`
        : `${winner === "player" ? "Has cantado" : "La IA ha cantado"} ${reason} y la mano termina de inmediato.`;
      UI.resultActionButton.firstChild.textContent = " Siguiente mano ";
      UI.resultActionButton.dataset.action = "next";
    }

    later(() => UI.resultModal.showModal(), 500);
  }

  function handleResultAction() {
    const action = UI.resultActionButton.dataset.action;
    UI.resultModal.close();
    if (action === "rematch") startMatch();
    else startRound();
  }

  function totalPoints(actor) {
    if (!state.round) return 0;
    return state.round.cardPoints[actor] + state.round.songPoints[actor];
  }

  function other(actor) {
    return actor === "player" ? "ai" : "player";
  }

  function cardName(card) {
    return `${RANK_MAP[card.rank].label} de ${SUIT_LABELS[card.suit]}`;
  }

  function addLog(html) {
    if (!state.round) return;
    state.round.log.push(html);
    if (state.round.log.length > 60) state.round.log.shift();
  }

  function showToast(html) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = html;
    UI.toastRegion.appendChild(toast);
    later(() => toast.remove(), 2800);
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    UI.soundIcon.textContent = soundEnabled ? "♪" : "∅";
    UI.soundButton.setAttribute("aria-label", soundEnabled ? "Desactivar sonido" : "Activar sonido");
    if (soundEnabled) playSound("card");
  }

  function playSound(type) {
    if (!soundEnabled) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const now = audioContext.currentTime;
      const sequences = {
        card: [[260, .035, .045]],
        deal: [[220, .025, .03], [280, .025, .08], [340, .03, .13]],
        draw: [[310, .025, .03], [365, .025, .07]],
        exchange: [[360, .04, .02], [520, .06, .08]],
        winTrick: [[390, .04, .01], [540, .055, .07]],
        loseTrick: [[260, .04, .01], [210, .06, .07]],
        song: [[440, .06, .01], [550, .06, .09], [660, .09, .17]],
        error: [[155, .08, .01]],
        victory: [[392, .08, .01], [494, .08, .11], [587, .08, .21], [784, .16, .31]],
        defeat: [[330, .09, .01], [277, .09, .12], [220, .15, .23]]
      };

      (sequences[type] || sequences.card).forEach(([freq, duration, offset]) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.07, now + offset + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + duration);
        osc.connect(gain).connect(audioContext.destination);
        osc.start(now + offset);
        osc.stop(now + offset + duration + 0.02);
      });
    } catch (_) {
      soundEnabled = false;
    }
  }

  function updatePersistentStats(roundWinner, matchWinner) {
    try {
      const current = JSON.parse(localStorage.getItem("tuteIaStats") || "{}");
      current.roundsPlayed = (current.roundsPlayed || 0) + 1;
      if (roundWinner === "player") current.roundsWon = (current.roundsWon || 0) + 1;
      if (matchWinner) {
        current.matchesPlayed = (current.matchesPlayed || 0) + 1;
        if (matchWinner === "player") current.matchesWon = (current.matchesWon || 0) + 1;
      }
      localStorage.setItem("tuteIaStats", JSON.stringify(current));
    } catch (_) {}
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();
