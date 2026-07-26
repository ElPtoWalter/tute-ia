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
  let handGesture = null;

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
      "setupForm", "targetSelect", "tuteToggle", "soundButton", "soundIcon", "drawButton",
      "newMatchButton", "rulesButton", "closeRulesButton", "rulesUnderstoodButton",
      "resultKicker", "resultEmblem", "resultTitle", "resultSummary",
      "resultPlayerScore", "resultAiScore", "resultActionButton",
      "resultExitButton", "toastRegion", "brandButton",
      "aiCapturePile", "playerCapturePile", "aiCaptureCount", "playerCaptureCount", "manualOrderHint"
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
    UI.drawButton.addEventListener("click", manualPlayerDraw);
    UI.deckStack.addEventListener("click", manualPlayerDraw);
    UI.deckStack.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        manualPlayerDraw();
      }
    });
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
    const starter = state.match.round % 2 === 1 ? "player" : "ai";

    state.round = {
      stock: deck,
      trumpCard: null,
      trumpSuit: null,
      hands: {
        player: [],
        ai: []
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
      currentTurn: null,
      pendingCante: null,
      lastTrickWinner: null,
      phase: "dealing",
      log: [],
      specialWin: null,
      drawQueue: [],
      drawIndex: 0,
      drawActor: null,
      drawing: false,
      lastDrawnId: null,
      busyFlight: false,
      collecting: false,
      pendingHandFlip: null
    };

    addLog(`<strong>Mano ${state.match.round}.</strong> Barajando las cartas.`);
    render();
    playSound("deal");
    later(beginInitialDeal, 420);
  }

  async function beginInitialDeal() {
    const round = state.round;
    if (!round || round.phase !== "dealing") return;

    for (let i = 0; i < 8; i += 1) {
      await dealOneCard("player");
      await sleep(45);
      await dealOneCard("ai");
      await sleep(45);
    }

    if (!state.round || state.round.phase !== "dealing") return;
    round.trumpCard = round.stock.pop();
    round.trumpSuit = round.trumpCard.suit;
    round.hands.ai = sortHand(round.hands.ai);
    round.phase = "playing";
    round.currentTurn = round.leader;

    addLog(`Pinta <strong>${cardName(round.trumpCard)}</strong>.`);
    addLog(`${round.leader === "player" ? "Sales tú" : "Sale la IA"}.`);
    playSound("exchange");
    render();

    if (round.currentTurn === "ai") scheduleAiTurn();
  }

  async function dealOneCard(actor) {
    const round = state.round;
    if (!round || round.phase !== "dealing" || round.stock.length === 0) return;

    const sourceRect = UI.deckStack.getBoundingClientRect();
    const card = round.stock.pop();
    renderDeck();
    await animateCardFlight(actor, card, sourceRect, false, 310);

    if (!state.round || state.round.phase !== "dealing") return;
    const previousRects = actor === "player" ? capturePlayerHandRects() : null;
    round.hands[actor].push(card);
    if (actor === "player") {
      round.pendingHandFlip = previousRects;
      round.lastDrawnId = card.id;
    }
    playSound("card");
    render();
    if (actor === "player") later(() => {
      if (state.round?.lastDrawnId === card.id) {
        state.round.lastDrawnId = null;
        render();
      }
    }, 430);
  }

  function sleep(ms) {
    return new Promise(resolve => later(resolve, ms));
  }

  function createFlightShell(card, { backFirst = false, reveal = false } = {}) {
    const shell = document.createElement("div");
    shell.className = "flight-card flight-shell";
    shell.setAttribute("aria-hidden", "true");
    const flipper = document.createElement("div");
    flipper.className = "flight-flipper";
    if (backFirst) flipper.classList.add("show-back");

    const front = createCardElement(card);
    front.classList.add("flight-face", "flight-front");
    const back = createBackCard();
    back.classList.add("flight-face", "flight-back");
    flipper.append(front, back);
    shell.appendChild(flipper);
    document.body.appendChild(shell);

    if (backFirst && reveal) {
      flipper.animate([
        { transform: "rotateY(180deg)", offset: 0 },
        { transform: "rotateY(180deg)", offset: .56 },
        { transform: "rotateY(0deg)", offset: .84 },
        { transform: "rotateY(0deg)", offset: 1 }
      ], { duration: 520, easing: "cubic-bezier(.3,.7,.2,1)", fill: "forwards" });
    }
    return shell;
  }

  function calculateHandLanding(actor, targetRect, cardWidth, cardHeight) {
    const round = state.round;
    const existing = round?.hands?.[actor]?.length || 0;
    const countAfter = existing + 1;
    const spread = Math.min(cardWidth * .58, Math.max(18, targetRect.width / Math.max(3.8, countAfter + .8)));
    const index = existing;
    const centerOffset = (index - (countAfter - 1) / 2) * spread;
    return {
      x: targetRect.left + targetRect.width / 2 + centerOffset - cardWidth / 2,
      y: actor === "player"
        ? targetRect.bottom - cardHeight * .78
        : targetRect.top + cardHeight * .04
    };
  }

  async function animateCardFlight(actor, card, sourceRect, faceUp, duration = 520) {
    const target = actor === "player" ? UI.playerHand : UI.aiHand;
    const targetRect = target.getBoundingClientRect();
    const backFirst = !faceUp;
    const reveal = actor === "player" && backFirst;
    const flying = createFlightShell(card, { backFirst, reveal });
    const flightRect = flying.getBoundingClientRect();
    const landing = calculateHandLanding(actor, targetRect, flightRect.width, flightRect.height);
    const startX = sourceRect.left + sourceRect.width / 2 - flightRect.width / 2;
    const startY = sourceRect.top + sourceRect.height / 2 - flightRect.height / 2;
    const dx = landing.x - startX;
    const dy = landing.y - startY;
    const side = actor === "player" ? -1 : 1;

    flying.style.left = `${startX}px`;
    flying.style.top = `${startY}px`;
    const animation = flying.animate([
      { transform: `translate3d(0,0,0) rotate(${side * 3}deg) scale(.76)`, opacity: .92 },
      { transform: `translate3d(${dx * .24}px, ${dy * .18 - 22}px, 0) rotate(${side * 13}deg) scale(.9)`, opacity: 1, offset: .32 },
      { transform: `translate3d(${dx * .68}px, ${dy * .57 - 46}px, 0) rotate(${side * -7}deg) scale(1.04)`, opacity: 1, offset: .7 },
      { transform: `translate3d(${dx}px, ${dy}px, 0) rotate(${side * .8}deg) scale(1)`, opacity: 1 }
    ], { duration, easing: "cubic-bezier(.18,.82,.18,1)", fill: "forwards" });
    try { await animation.finished; } catch (_) {}
    flying.remove();
  }

  async function animatePlayToTable(actor, card, sourceRect, targetRect) {
    const flying = createFlightShell(card, { backFirst: actor === "ai", reveal: actor === "ai" });
    flying.classList.add("table-flight");
    const flightRect = flying.getBoundingClientRect();
    const startX = sourceRect.left + sourceRect.width / 2 - flightRect.width / 2;
    const startY = sourceRect.top + sourceRect.height / 2 - flightRect.height / 2;
    const endX = targetRect.left + targetRect.width / 2 - flightRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2 - flightRect.height / 2;
    const dx = endX - startX;
    const dy = endY - startY;
    const side = actor === "player" ? -1 : 1;
    const finalRotation = actor === "player" ? -4.5 : 4;

    flying.style.left = `${startX}px`;
    flying.style.top = `${startY}px`;
    const animation = flying.animate([
      { transform: `translate3d(0,0,0) rotate(${side * 5}deg) scale(1)`, opacity: 1 },
      { transform: `translate3d(${dx * .32}px, ${dy * .18 - 38}px, 0) rotate(${side * 15}deg) scale(1.07)`, opacity: 1, offset: .35 },
      { transform: `translate3d(${dx * .74}px, ${dy * .62 - 58}px, 0) rotate(${side * -9}deg) scale(1.035)`, opacity: 1, offset: .74 },
      { transform: `translate3d(${dx}px, ${dy}px, 0) rotate(${finalRotation}deg) scale(1)`, opacity: 1 }
    ], { duration: 480, easing: "cubic-bezier(.16,.84,.16,1)", fill: "forwards" });
    try { await animation.finished; } catch (_) {}
    flying.remove();
  }

  function capturePlayerHandRects() {
    const rects = new Map();
    UI.playerHand?.querySelectorAll("[data-card-id]").forEach(element => {
      rects.set(element.dataset.cardId, element.getBoundingClientRect());
    });
    return rects;
  }

  function animateHandFlip(previousRects) {
    if (!previousRects?.size) return;
    requestAnimationFrame(() => {
      UI.playerHand.querySelectorAll("[data-card-id]").forEach(element => {
        const previous = previousRects.get(element.dataset.cardId);
        if (!previous) return;
        const current = element.getBoundingClientRect();
        const dx = previous.left - current.left;
        const dy = previous.top - current.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        element.animate([
          { translate: `${dx}px ${dy}px` },
          { translate: "0px 0px" }
        ], { duration: 360, easing: "cubic-bezier(.2,.8,.2,1)" });
      });
    });
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
    renderCaptures();
    renderLog();
    renderActions();
  }

  function renderHands() {
    const round = state.round;
    const canPlayNow = round.currentTurn === "player" && !round.pendingCante && round.phase === "playing";
    const legalIds = canPlayNow
      ? new Set(getLegalCards("player").map(card => card.id))
      : new Set();
    const flipRects = round.pendingHandFlip;
    round.pendingHandFlip = null;

    UI.playerHand.innerHTML = "";
    const playerCount = round.hands.player.length || 1;
    round.hands.player.forEach((card, index) => {
      const cardButton = createCardElement(card, { button: true });
      cardButton.dataset.cardId = card.id;
      cardButton.style.zIndex = index + 1;
      const normalized = playerCount > 1 ? (index - (playerCount - 1) / 2) / ((playerCount - 1) / 2) : 0;
      cardButton.style.setProperty("--rest-rotate", `${normalized * 10.5}deg`);
      cardButton.style.setProperty("--rest-y", `${Math.abs(normalized) * 16}px`);
      cardButton.style.setProperty("--rest-x", `${normalized * 3}px`);
      if (round.lastDrawnId === card.id) cardButton.classList.add("newly-drawn");
      const isPlayable = legalIds.has(card.id);
      cardButton.setAttribute("aria-disabled", isPlayable ? "false" : "true");
      if (canPlayNow && !isPlayable) cardButton.classList.add("illegal");
      cardButton.setAttribute("aria-label", `${cardName(card)}${isPlayable ? ", jugar" : ", no disponible para jugar"}`);
      cardButton.addEventListener("pointerdown", event => beginHandGesture(event, card.id, isPlayable));
      cardButton.addEventListener("keydown", event => {
        if ((event.key === "Enter" || event.key === " ") && isPlayable) {
          event.preventDefault();
          playCard("player", card.id);
        }
      });
      UI.playerHand.appendChild(cardButton);
    });

    UI.aiHand.innerHTML = "";
    const aiCount = round.hands.ai.length || 1;
    round.hands.ai.forEach((_, index) => {
      const back = createBackCard();
      const normalized = aiCount > 1 ? (index - (aiCount - 1) / 2) / ((aiCount - 1) / 2) : 0;
      back.style.zIndex = index + 1;
      back.style.setProperty("--rest-rotate", `${normalized * -7.5}deg`);
      back.style.setProperty("--rest-y", `${Math.abs(normalized) * 8}px`);
      UI.aiHand.appendChild(back);
    });

    UI.manualOrderHint?.classList.toggle("visible", round.hands.player.length > 1 && !["dealing", "roundOver"].includes(round.phase));
    animateHandFlip(flipRects);
  }

  function beginHandGesture(event, cardId, isPlayable) {
    const round = state.round;
    if (!round || round.busyFlight || round.collecting || event.button > 0 || event.isPrimary === false) return;
    const canOrganize = !["dealing", "roundOver"].includes(round.phase) && !round.drawing;
    if (!canOrganize && !isPlayable) return;

    const element = event.currentTarget;
    event.preventDefault();
    element.setPointerCapture?.(event.pointerId);
    handGesture = {
      pointerId: event.pointerId,
      cardId,
      playable: isPlayable,
      element,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      insertIndex: round.hands.player.findIndex(card => card.id === cardId),
      ghost: null,
      marker: null
    };
    element.classList.add("card-pressed");
    element.addEventListener("pointermove", moveHandGesture);
    element.addEventListener("pointerup", endHandGesture, { once: true });
    element.addEventListener("pointercancel", cancelHandGesture, { once: true });
  }

  function moveHandGesture(event) {
    if (!handGesture || event.pointerId !== handGesture.pointerId) return;
    const dx = event.clientX - handGesture.startX;
    const dy = event.clientY - handGesture.startY;
    if (!handGesture.moved && Math.hypot(dx, dy) < 8) return;
    if (!handGesture.moved) startHandReorder(event);
    event.preventDefault();
    handGesture.ghost.style.left = `${event.clientX}px`;
    handGesture.ghost.style.top = `${event.clientY}px`;
    updateHandDropIndex(event.clientX);
  }

  function startHandReorder(event) {
    handGesture.moved = true;
    handGesture.element.classList.add("gesture-source");
    document.body.classList.add("reordering-hand");
    const rect = handGesture.element.getBoundingClientRect();
    const ghost = handGesture.element.cloneNode(true);
    ghost.classList.remove("illegal", "newly-drawn", "card-pressed");
    ghost.classList.add("hand-drag-ghost");
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.left = `${event.clientX}px`;
    ghost.style.top = `${event.clientY}px`;
    document.body.appendChild(ghost);
    handGesture.ghost = ghost;

    const marker = document.createElement("span");
    marker.className = "hand-drop-marker";
    UI.playerHand.appendChild(marker);
    handGesture.marker = marker;
  }

  function updateHandDropIndex(clientX) {
    if (!handGesture) return;
    const cards = [...UI.playerHand.querySelectorAll("[data-card-id]")]
      .filter(element => element.dataset.cardId !== handGesture.cardId);
    const sorted = cards.map(element => ({ element, rect: element.getBoundingClientRect() }))
      .sort((a, b) => a.rect.left - b.rect.left);
    let insertIndex = sorted.filter(item => clientX > item.rect.left + item.rect.width / 2).length;
    handGesture.insertIndex = insertIndex;

    const handRect = UI.playerHand.getBoundingClientRect();
    let markerX;
    if (!sorted.length) markerX = handRect.width / 2;
    else if (insertIndex === 0) markerX = sorted[0].rect.left - handRect.left;
    else if (insertIndex >= sorted.length) markerX = sorted.at(-1).rect.right - handRect.left;
    else markerX = (sorted[insertIndex - 1].rect.right + sorted[insertIndex].rect.left) / 2 - handRect.left;
    handGesture.marker.style.left = `${markerX}px`;
  }

  function endHandGesture(event) {
    if (!handGesture || event.pointerId !== handGesture.pointerId) return;
    const gesture = handGesture;
    if (gesture.moved) {
      const round = state.round;
      const previousRects = capturePlayerHandRects();
      const fromIndex = round.hands.player.findIndex(card => card.id === gesture.cardId);
      const [movedCard] = round.hands.player.splice(fromIndex, 1);
      let insertIndex = gesture.insertIndex;
      if (fromIndex < insertIndex) insertIndex -= 1;
      insertIndex = Math.max(0, Math.min(round.hands.player.length, insertIndex));
      round.hands.player.splice(insertIndex, 0, movedCard);
      round.pendingHandFlip = previousRects;
      cleanupHandGesture();
      playSound("card");
      render();
    } else {
      cleanupHandGesture();
      if (gesture.playable && state.round?.currentTurn === "player" && state.round.phase === "playing") {
        playCard("player", gesture.cardId);
      }
    }
  }

  function cancelHandGesture() {
    cleanupHandGesture();
  }

  function cleanupHandGesture() {
    if (!handGesture) return;
    handGesture.element?.classList.remove("card-pressed", "gesture-source");
    handGesture.element?.removeEventListener("pointermove", moveHandGesture);
    handGesture.ghost?.remove();
    handGesture.marker?.remove();
    document.body.classList.remove("reordering-hand");
    handGesture = null;
  }

  function renderTrick() {
    UI.aiTrickSlot.innerHTML = '<span class="slot-label">IA</span>';
    UI.playerTrickSlot.innerHTML = '<span class="slot-label">TÚ</span>';

    state.round.trick.forEach((play, index) => {
      const slot = play.actor === "player" ? UI.playerTrickSlot : UI.aiTrickSlot;
      slot.innerHTML = "";
      const cardElement = createCardElement(play.card);
      cardElement.style.setProperty("--play-rotation", `${play.rotation ?? (play.actor === "player" ? -4 : 4)}deg`);
      cardElement.style.setProperty("--play-x", `${play.offsetX ?? (index ? 4 : -3)}px`);
      cardElement.style.setProperty("--play-y", `${play.offsetY ?? 0}px`);
      slot.appendChild(cardElement);
    });
  }

  function renderDeck() {
    const round = state.round;
    const count = drawPileCount();
    UI.deckCount.textContent = count;
    UI.deckStack.classList.toggle("hidden", count === 0);
    UI.deckStack.style.setProperty("--deck-progress", String(Math.max(0, Math.min(1, count / 24))));
    UI.deckStack.style.setProperty("--deck-height", `${Math.max(1, Math.ceil(count / 4))}px`);
    UI.deckStack.querySelectorAll(".deck-layer").forEach((layer, index) => {
      layer.style.opacity = count > index * 5 ? "1" : "0";
    });

    const playerMustDraw = round.phase === "awaitingDraw" &&
      round.drawQueue[round.drawIndex] === "player" && !round.drawing;
    UI.deckStack.classList.toggle("draw-ready", playerMustDraw);
    UI.deckStack.setAttribute("aria-disabled", playerMustDraw ? "false" : "true");

    UI.trumpCard.innerHTML = "";
    if (round.trumpCard) {
      UI.trumpCard.appendChild(createCardElement(round.trumpCard));
    } else if (round.phase === "dealing") {
      UI.trumpCard.innerHTML = '<span class="slot-label">POR DESCUBRIR</span>';
    } else {
      UI.trumpCard.innerHTML = '<span class="slot-label">AGOTADO</span>';
    }
  }

  function renderStatus() {
    const round = state.round;
    const strict = round.phase !== "dealing" && isStrictPhase();

    if (round.phase === "dealing") {
      UI.phaseBadge.textContent = "REPARTIENDO";
      UI.phaseBadge.classList.remove("strict");
      UI.ruleStateTitle.textContent = "Reparto manual";
      UI.ruleStateText.textContent = "Las cartas salen de la baceta una a una y llegan físicamente a cada mano.";
      UI.statusText.textContent = `Repartiendo… ${round.hands.player.length}/8 cartas para ti.`;
      UI.playerTurnPill.classList.remove("visible");
      UI.aiTurnPill.classList.remove("visible");
    } else if (round.phase === "awaitingDraw") {
      const actor = round.drawQueue[round.drawIndex];
      UI.phaseBadge.textContent = "FASE DE ROBO";
      UI.phaseBadge.classList.remove("strict");
      UI.ruleStateTitle.textContent = "Robo por orden de baza";
      UI.ruleStateText.textContent = "Quien gana la baza roba primero. Para tu carta debes tocar personalmente la baceta.";
      UI.statusText.textContent = round.drawing
        ? `${actor === "player" ? "Estás robando" : "La IA está robando"}…`
        : actor === "player"
          ? "Te toca robar. Pulsa la baceta."
          : "La IA roba primero.";
      UI.playerTurnPill.classList.toggle("visible", actor === "player" && !round.drawing);
      UI.aiTurnPill.classList.toggle("visible", actor === "ai");
    } else {
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
      } else if (round.phase === "roundOver") {
        UI.statusText.textContent = "La mano ha terminado.";
      } else {
        UI.statusText.textContent = "Doña Virtud está calculando.";
      }
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

  function renderCaptures() {
    const round = state.round;
    UI.playerCaptureCount.textContent = round.tricksWon.player;
    UI.aiCaptureCount.textContent = round.tricksWon.ai;
    UI.playerCapturePile.classList.toggle("has-cards", round.tricksWon.player > 0);
    UI.aiCapturePile.classList.toggle("has-cards", round.tricksWon.ai > 0);
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

    const playerMustDraw = round.phase === "awaitingDraw" &&
      round.drawQueue[round.drawIndex] === "player" && !round.drawing;
    UI.drawButton.classList.toggle("hidden", !playerMustDraw);

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
    if (round.phase === "dealing") return "Mira cómo se reparten las cartas una a una.";
    if (round.phase === "awaitingDraw") {
      const actor = round.drawQueue[round.drawIndex];
      if (round.drawing) return "La carta está viajando desde la baceta hasta la mano.";
      return actor === "player"
        ? "Toca la baceta o pulsa «Robar de la baceta»."
        : "La IA debe robar antes que tú.";
    }
    if (round.phase !== "playing") return "La mano ha terminado.";
    if (round.currentTurn === "ai") return "La IA solo conoce sus cartas y las jugadas visibles.";
    if (!isStrictPhase()) return "Baceta abierta. Toca para jugar o arrastra para ordenar tu mano.";
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
    element.innerHTML = `<img class="card-image" src="assets/cards/${card.suit}-${card.rank}.webp" alt="${cardName(card)}" draggable="false" decoding="async">`;
    return element;
  }

  function createBackCard() {
    const card = document.createElement("div");
    card.className = "playing-card";
    card.innerHTML = '<img class="card-image" src="assets/cards/back.svg" alt="Carta boca abajo" draggable="false">';
    return card;
  }

  async function playCard(actor, cardId) {
    const round = state.round;
    if (!round || round.phase !== "playing" || round.currentTurn !== actor || round.pendingCante) return;
    if (round.busyFlight || round.collecting) return;

    const legalCards = getLegalCards(actor);
    const card = round.hands[actor].find(c => c.id === cardId);
    if (!card || !legalCards.some(c => c.id === cardId)) {
      showToast("<strong>Renuncio bloqueado.</strong> Esa carta no es legal ahora.");
      playSound("error");
      return;
    }

    cleanupHandGesture();
    const cardIndex = round.hands[actor].findIndex(c => c.id === cardId);
    const sourceElement = actor === "player"
      ? UI.playerHand.querySelector(`[data-card-id="${card.id}"]`)
      : UI.aiHand.children[cardIndex] || UI.aiHand.querySelector('.playing-card');
    const targetSlot = actor === "player" ? UI.playerTrickSlot : UI.aiTrickSlot;
    const previousRects = actor === "player" ? capturePlayerHandRects() : null;

    if (sourceElement) {
      round.busyFlight = true;
      sourceElement.classList.add("source-in-flight");
      const sourceRect = sourceElement.getBoundingClientRect();
      const targetRect = targetSlot.getBoundingClientRect();
      await animatePlayToTable(actor, card, sourceRect, targetRect);
      round.busyFlight = false;
    }

    round.hands[actor].splice(cardIndex, 1);
    if (actor === "player") round.pendingHandFlip = previousRects;
    const seed = round.playedCards.length + (actor === "player" ? 1 : 7);
    round.trick.push({
      actor,
      card,
      rotation: (actor === "player" ? -4.5 : 4) + ((seed % 3) - 1) * 1.35,
      offsetX: ((seed * 7) % 9) - 4,
      offsetY: ((seed * 5) % 7) - 3
    });
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
    later(resolveTrick, 560);
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

  async function animateCollectTrick(winner) {
    const target = winner === "player" ? UI.playerCapturePile : UI.aiCapturePile;
    let targetRect = target.getBoundingClientRect();
    if (!targetRect.width) {
      targetRect = document.querySelector(winner === "player" ? ".player-badge:not(.opponent)" : ".player-badge.opponent").getBoundingClientRect();
    }
    const entries = state.round.trick.map(play => ({
      element: (play.actor === "player" ? UI.playerTrickSlot : UI.aiTrickSlot).querySelector(".playing-card"),
      play
    })).filter(entry => entry.element);
    const animations = entries.map((entry, index) => {
      const rect = entry.element.getBoundingClientRect();
      const clone = entry.element.cloneNode(true);
      clone.classList.add("capture-flight-card");
      clone.style.left = `${rect.left}px`;
      clone.style.top = `${rect.top}px`;
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      document.body.appendChild(clone);
      entry.element.style.opacity = "0";
      const dx = targetRect.left + targetRect.width / 2 - (rect.left + rect.width / 2) + index * 5;
      const dy = targetRect.top + targetRect.height / 2 - (rect.top + rect.height / 2) + index * 4;
      const animation = clone.animate([
        { transform: `translate3d(0,0,0) rotate(${entry.play.rotation || 0}deg) scale(1)`, opacity: 1 },
        { transform: `translate3d(${dx * .42}px, ${dy * .32 - 34}px,0) rotate(${winner === "player" ? -18 : 18}deg) scale(.84)`, opacity: 1, offset: .52 },
        { transform: `translate3d(${dx}px, ${dy}px,0) rotate(${winner === "player" ? -28 : 28}deg) scale(.34)`, opacity: .2 }
      ], { duration: 460 + index * 55, easing: "cubic-bezier(.22,.78,.18,1)", fill: "forwards" });
      return animation.finished.catch(() => {}).then(() => clone.remove());
    });
    target.classList.add("capture-bump");
    await Promise.all(animations);
    later(() => target.classList.remove("capture-bump"), 260);
  }

  async function resolveTrick() {
    const round = state.round;
    if (!round || round.trick.length !== 2 || round.collecting) return;
    round.collecting = true;

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
    await animateCollectTrick(winner);
    if (!state.round) return;
    round.trick = [];
    round.collecting = false;
    render();

    const options = getCanteOptions(winner);
    if (options.length > 0 && drawPileCount() > 0) {
      round.pendingCante = { actor: winner, options };
      render();
      if (winner === "ai") later(() => resolveAiCante(options), 540);
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
      round.phase = "awaitingDraw";
      round.currentTurn = null;
      round.drawQueue = [round.leader, other(round.leader)];
      round.drawIndex = 0;
      round.drawActor = round.drawQueue[0];
      round.drawing = false;
      addLog(`${round.leader === "player" ? "Robas tú primero" : "La IA roba primero"}.`);
      render();
      later(advanceDrawQueue, 300);
      return;
    }

    beginNextTrick();
  }

  function advanceDrawQueue() {
    const round = state.round;
    if (!round || round.phase !== "awaitingDraw" || round.drawing) return;

    if (round.drawIndex >= round.drawQueue.length) {
      finishDrawPhase();
      return;
    }

    round.drawActor = round.drawQueue[round.drawIndex];
    render();

    if (round.drawActor === "ai") {
      later(() => performDraw("ai"), 620);
    }
  }

  function manualPlayerDraw() {
    const round = state.round;
    if (!round || round.phase !== "awaitingDraw" || round.drawing) return;
    if (round.drawQueue[round.drawIndex] !== "player") return;
    performDraw("player");
  }

  async function performDraw(actor) {
    const round = state.round;
    if (!round || round.phase !== "awaitingDraw" || round.drawing) return;
    if (round.drawQueue[round.drawIndex] !== actor) return;

    round.drawing = true;
    const fromStock = round.stock.length > 0;
    const sourceElement = fromStock ? UI.deckStack : UI.trumpCard;
    const sourceRect = sourceElement.getBoundingClientRect();
    const card = fromStock ? round.stock.pop() : round.trumpCard;
    if (!fromStock) round.trumpCard = null;

    UI.deckStack.classList.add("deck-drawing");
    render();
    await animateCardFlight(actor, card, sourceRect, !fromStock, 600);
    UI.deckStack.classList.remove("deck-drawing");
    if (!state.round || state.round.phase !== "awaitingDraw") return;

    const previousRects = actor === "player" ? capturePlayerHandRects() : null;
    round.hands[actor].push(card);
    if (actor === "ai") round.hands[actor] = sortHand(round.hands[actor]);
    if (actor === "player") round.pendingHandFlip = previousRects;
    round.lastDrawnId = actor === "player" ? card.id : null;
    round.drawIndex += 1;
    round.drawing = false;
    playSound("draw");

    if (actor === "player") {
      addLog(`Robas <strong>${cardName(card)}</strong>.`);
    } else {
      addLog(fromStock ? "La IA roba una carta." : `La IA recoge <strong>${cardName(card)}</strong>.`);
    }

    render();
    if (round.lastDrawnId) {
      later(() => {
        if (!state.round) return;
        state.round.lastDrawnId = null;
        render();
      }, 850);
    }
    later(advanceDrawQueue, 300);
  }

  function finishDrawPhase() {
    const round = state.round;
    if (!round || round.phase !== "awaitingDraw") return;
    round.phase = "playing";
    round.drawQueue = [];
    round.drawIndex = 0;
    round.drawActor = null;
    round.drawing = false;
    beginNextTrick();
  }

  function beginNextTrick() {
    const round = state.round;
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
    if (actor === "ai") sortHand(hand);

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
