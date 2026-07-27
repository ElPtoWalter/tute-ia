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
    mode: "home",
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
    tutorial: {
      active: false,
      stepIndex: 0,
      completed: false,
      busy: false
    },
    round: null
  };

  const TUTORIAL_STEPS = [
    {
      id: "welcome",
      title: "Bienvenido a la mesa",
      text: "Este recorrido utiliza exactamente la misma mesa, las mismas cartas y las mismas reglas que la partida clásica. Aprenderás jugando, no leyendo un manual interminable.",
      tip: "El tutorial puede repetirse siempre desde el menú principal.",
      focus: "table",
      action: "next",
      button: "Empezar"
    },
    {
      id: "values",
      title: "Valor y fuerza de las cartas",
      text: "Las cartas que puntúan son el as (11), el tres (10), el rey (4), el caballo (3) y la sota (2). Para ganar una baza, su fuerza sigue este orden: as, tres, rey, caballo, sota, siete, seis, cinco, cuatro y dos.",
      tip: "Los números del 2 al 7 no suman puntos, pero pueden servir para conservar cartas valiosas o controlar el triunfo.",
      focus: "hand",
      action: "next",
      button: "Entendido"
    },
    {
      id: "trump",
      title: "El palo de triunfo",
      text: "La carta visible junto a la baceta determina el triunfo. Una carta de triunfo gana a cualquier carta de los otros palos, aunque sea un dos contra un as.",
      tip: "En esta lección pinta bastos. Fíjate en la carta visible junto al mazo.",
      focus: "trump",
      action: "next",
      button: "Continuar"
    },
    {
      id: "organize",
      title: "Organiza tu mano",
      text: "Tu mano conserva el orden de reparto. Mantén pulsada una carta y desplázala entre las demás: el hueco visible indica dónde quedará al soltarla.",
      tip: "Mueve cualquier carta a una posición distinta para continuar.",
      focus: "hand",
      action: "reorder"
    },
    {
      id: "open-play",
      title: "Con baceta, juego libre",
      text: "Mientras queden cartas para robar no estás obligado a asistir. Puedes jugar cualquier carta. Para practicar, juega el as de copas pulsándolo o arrastrándolo al tapete.",
      tip: "El as de copas está resaltado. Después responderá la IA.",
      focus: "hand",
      action: "play",
      allowedCardId: "copas-1"
    },
    {
      id: "draw",
      title: "El ganador roba primero",
      text: "Tu as ha ganado la baza y suma 11 puntos. Tras cada baza roba primero quien la gana y después el rival. En esta versión debes hacerlo tú mismo.",
      tip: "Pulsa la baceta o el botón «Robar de la baceta».",
      focus: "deck",
      action: "draw"
    },
    {
      id: "mount",
      title: "Sin baceta: asistir y montar",
      text: "Cuando se agota la baceta comienzan las obligaciones. La IA ha salido con el siete de copas. Tienes copas y, además, puedes superar el siete: debes jugar el tres de copas.",
      tip: "Las demás cartas quedan bloqueadas para evitar un renuncio.",
      focus: "hand",
      action: "play",
      allowedCardId: "copas-3"
    },
    {
      id: "trump-fail",
      title: "Fallar con triunfo",
      text: "La IA sale ahora con el as de espadas. No tienes espadas, pero sí un triunfo. Estás obligado a fallar con el dos de bastos, que gana la baza aunque sea la carta más baja del triunfo.",
      tip: "Juega el dos de bastos.",
      focus: "hand",
      action: "play",
      allowedCardId: "bastos-2"
    },
    {
      id: "song",
      title: "Cantar 20 o 40",
      text: "Después de ganar una baza puedes cantar si conservas rey y caballo del mismo palo. En triunfo valen 40 puntos; en otro palo, 20.",
      tip: "Pulsa «Cantar 40 en bastos».",
      focus: "actions",
      action: "song"
    },
    {
      id: "finish",
      title: "Ya sabes jugar al tute clásico",
      text: "Las cartas suman 120 puntos y la última baza añade 10. Los cantes se agregan al total. Ya puedes iniciar una partida real contra la IA y consultar las reglas completas cuando lo necesites.",
      tip: "Tutorial completado. El menú recordará tu progreso en este dispositivo.",
      focus: "score",
      action: "finish",
      button: "Volver al menú"
    }
  ];

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheUI();
    bindUI();
    renderEmptyState();
    updateTutorialCompletionBadge();
    showHome();
  }

  function cacheUI() {
    [
      "aiName", "aiHand", "playerHand", "aiTrickSlot", "playerTrickSlot", "trickArea", "playDropIndicator",
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
      "aiCapturePile", "playerCapturePile", "aiCaptureCount", "playerCaptureCount", "manualOrderHint",
      "homeScreen", "appShell", "classicModeButton", "tutorialModeButton", "tutorialCompletionBadge",
      "tutorialCoach", "tutorialKicker", "tutorialProgress", "tutorialTitle", "tutorialText", "tutorialTip",
      "tutorialNextButton", "tutorialExitButton"
    ].forEach(id => UI[id] = document.getElementById(id));
  }

  function bindUI() {
    document.querySelectorAll('input[name="difficulty"]').forEach(input => {
      input.addEventListener("change", () => {
        document.querySelectorAll(".choice-card").forEach(card => card.classList.remove("selected"));
        input.closest(".choice-card").classList.add("selected");
      });
    });

    UI.classicModeButton.addEventListener("click", openClassicSetup);
    UI.tutorialModeButton.addEventListener("click", startTutorial);
    UI.tutorialNextButton.addEventListener("click", handleTutorialNext);
    UI.tutorialExitButton.addEventListener("click", showHome);

    UI.setupForm.addEventListener("submit", event => {
      event.preventDefault();
      const difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || "normal";
      state.settings.difficulty = difficulty;
      state.settings.targetRounds = Number(UI.targetSelect.value);
      state.settings.allowTute = UI.tuteToggle.checked;
      state.mode = "game";
      state.tutorial.active = false;
      document.body.classList.remove("tutorial-mode");
      UI.setupModal.close();
      showGameTable();
      startMatch();
    });

    UI.setupModal.addEventListener("close", () => {
      if (state.mode === "home") showHome();
    });

    UI.newMatchButton.addEventListener("click", () => {
      if (state.mode === "tutorial") showHome();
      else openClassicSetup();
    });
    UI.brandButton.addEventListener("click", showHome);
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
      showHome();
    });
  }

  function safeCloseDialog(dialog) {
    if (dialog?.open) dialog.close();
  }

  function showGameTable() {
    UI.homeScreen.classList.add("hidden");
    UI.appShell.classList.remove("hidden");
  }

  function openClassicSetup() {
    clearTimers();
    cleanupHandGesture();
    safeCloseDialog(UI.resultModal);
    state.tutorial.active = false;
    document.body.classList.remove("tutorial-mode");
    UI.tutorialCoach.classList.add("hidden");
    UI.aiName.textContent = "Doña Virtud";
    UI.newMatchButton.textContent = "Partida clásica";
    if (!UI.setupModal.open) UI.setupModal.showModal();
  }

  function showHome() {
    clearTimers();
    cleanupHandGesture();
    safeCloseDialog(UI.setupModal);
    safeCloseDialog(UI.rulesModal);
    safeCloseDialog(UI.resultModal);
    state.mode = "home";
    state.tutorial.active = false;
    state.tutorial.busy = false;
    state.round = null;
    document.body.classList.remove("tutorial-mode");
    UI.tutorialCoach.classList.add("hidden");
    UI.appShell.classList.add("hidden");
    UI.homeScreen.classList.remove("hidden");
    UI.aiName.textContent = "Doña Virtud";
    UI.newMatchButton.textContent = "Partida clásica";
    clearTutorialFocus();
    renderEmptyState();
    updateTutorialCompletionBadge();
  }

  function updateTutorialCompletionBadge() {
    let complete = false;
    try { complete = localStorage.getItem("tuteTutorialClassicComplete") === "true"; } catch (_) {}
    state.tutorial.completed = complete;
    UI.tutorialCompletionBadge.textContent = complete ? "Tutorial completado" : `${TUTORIAL_STEPS.length} lecciones`;
    UI.tutorialModeButton.classList.toggle("tutorial-complete", complete);
  }

  function startTutorial() {
    clearTimers();
    cleanupHandGesture();
    safeCloseDialog(UI.setupModal);
    safeCloseDialog(UI.rulesModal);
    safeCloseDialog(UI.resultModal);
    state.mode = "tutorial";
    state.tutorial.active = true;
    state.tutorial.busy = false;
    state.match.playerRounds = 0;
    state.match.aiRounds = 0;
    state.match.round = 1;
    state.settings.targetRounds = 1;
    state.settings.allowTute = true;
    document.body.classList.add("tutorial-mode");
    UI.aiName.textContent = "Maestra Virtud";
    UI.newMatchButton.textContent = "Salir";
    showGameTable();
    UI.tutorialCoach.classList.remove("hidden");
    setTutorialStep(0);
  }

  function makeCard(suit, rank) {
    const data = RANK_MAP[rank];
    return {
      id: `${suit}-${rank}`,
      suit,
      rank,
      label: data.label,
      short: data.short,
      points: data.points,
      strength: data.strength
    };
  }

  function makeTutorialRound(config = {}) {
    const trumpCard = config.trumpCard || null;
    return {
      stock: config.stock || [],
      trumpCard,
      trumpSuit: config.trumpSuit || trumpCard?.suit || "bastos",
      hands: {
        player: config.playerHand || [],
        ai: config.aiHand || []
      },
      captured: {
        player: config.playerCaptured || [],
        ai: config.aiCaptured || []
      },
      cardPoints: {
        player: config.playerCardPoints || 0,
        ai: config.aiCardPoints || 0
      },
      songPoints: {
        player: config.playerSongPoints || 0,
        ai: config.aiSongPoints || 0
      },
      tricksWon: {
        player: config.playerTricks || 0,
        ai: config.aiTricks || 0
      },
      hasWonTrick: {
        player: Boolean(config.playerTricks),
        ai: Boolean(config.aiTricks)
      },
      sungSuits: {
        player: new Set(config.playerSung || []),
        ai: new Set(config.aiSung || [])
      },
      playedCards: config.playedCards || (config.trick || []).map(play => play.card),
      trick: config.trick || [],
      leader: config.leader || "player",
      currentTurn: config.currentTurn ?? null,
      pendingCante: config.pendingCante || null,
      lastTrickWinner: config.lastTrickWinner || null,
      phase: config.phase || "playing",
      log: config.log || ["<strong>Tutorial clásico.</strong> Sigue las indicaciones de la maestra."],
      specialWin: null,
      drawQueue: config.drawQueue || [],
      drawIndex: config.drawIndex || 0,
      drawActor: config.drawActor || null,
      drawing: false,
      lastDrawnId: null,
      busyFlight: false,
      collecting: false,
      pendingHandFlip: null
    };
  }

  function tutorialRoundForStep(index) {
    const stockOpen = [makeCard("oros", 4), makeCard("espadas", 6), makeCard("copas", 6), makeCard("oros", 11)];
    const commonTrump = makeCard("bastos", 5);

    switch (index) {
      case 0:
        return makeTutorialRound({
          playerHand: [makeCard("oros", 1), makeCard("copas", 3), makeCard("espadas", 12), makeCard("bastos", 7)],
          aiHand: [makeCard("oros", 2), makeCard("copas", 4), makeCard("espadas", 5), makeCard("bastos", 6)],
          stock: stockOpen,
          trumpCard: commonTrump,
          currentTurn: null
        });
      case 1:
        return makeTutorialRound({
          playerHand: [makeCard("oros", 1), makeCard("copas", 3), makeCard("espadas", 12), makeCard("bastos", 11), makeCard("oros", 10), makeCard("copas", 7)],
          aiHand: [makeCard("oros", 2), makeCard("copas", 4), makeCard("espadas", 5)],
          stock: stockOpen,
          trumpCard: commonTrump,
          currentTurn: null
        });
      case 2:
        return makeTutorialRound({
          playerHand: [makeCard("oros", 6), makeCard("copas", 4), makeCard("espadas", 1), makeCard("bastos", 2)],
          aiHand: [makeCard("oros", 4), makeCard("copas", 5), makeCard("espadas", 6), makeCard("bastos", 7)],
          stock: stockOpen,
          trumpCard: commonTrump,
          currentTurn: null
        });
      case 3:
        return makeTutorialRound({
          playerHand: [makeCard("oros", 2), makeCard("copas", 1), makeCard("espadas", 12), makeCard("bastos", 7)],
          aiHand: [makeCard("oros", 4), makeCard("copas", 5), makeCard("espadas", 6), makeCard("bastos", 3)],
          stock: stockOpen,
          trumpCard: commonTrump,
          currentTurn: null
        });
      case 4:
        return makeTutorialRound({
          playerHand: [makeCard("copas", 1), makeCard("oros", 5), makeCard("espadas", 2), makeCard("bastos", 12)],
          aiHand: [makeCard("copas", 7), makeCard("oros", 4), makeCard("espadas", 6), makeCard("bastos", 3)],
          stock: stockOpen,
          trumpCard: commonTrump,
          currentTurn: "player",
          leader: "player",
          log: ["<strong>Baceta abierta.</strong> Puedes jugar cualquier carta."]
        });
      case 5:
        return makeTutorialRound({
          playerHand: [makeCard("oros", 5), makeCard("espadas", 2), makeCard("bastos", 12)],
          aiHand: [makeCard("oros", 4), makeCard("espadas", 6), makeCard("bastos", 3)],
          playerCaptured: [makeCard("copas", 1), makeCard("copas", 7)],
          playerCardPoints: 11,
          playerTricks: 1,
          stock: [makeCard("oros", 11), makeCard("copas", 6)],
          trumpCard: commonTrump,
          currentTurn: null,
          phase: "awaitingDraw",
          leader: "player",
          drawQueue: ["player"],
          drawActor: "player",
          lastTrickWinner: "player",
          log: ["<strong>Has ganado la baza</strong> con el as de copas.", "Te corresponde robar primero."]
        });
      case 6: {
        const lead = makeCard("copas", 7);
        return makeTutorialRound({
          playerHand: [makeCard("copas", 3), makeCard("copas", 5), makeCard("oros", 1), makeCard("bastos", 2)],
          aiHand: [makeCard("oros", 6), makeCard("espadas", 4), makeCard("bastos", 12)],
          stock: [],
          trumpCard: null,
          trumpSuit: "bastos",
          trick: [{ actor: "ai", card: lead, rotation: 4, offsetX: 0, offsetY: 0 }],
          currentTurn: "player",
          leader: "ai",
          log: ["La IA juega <strong>Siete de copas</strong>.", "Sin baceta: debes asistir y montar si puedes."]
        });
      }
      case 7: {
        const lead = makeCard("espadas", 1);
        return makeTutorialRound({
          playerHand: [makeCard("bastos", 2), makeCard("oros", 12), makeCard("copas", 5)],
          aiHand: [makeCard("oros", 6), makeCard("copas", 4), makeCard("bastos", 7)],
          stock: [],
          trumpCard: null,
          trumpSuit: "bastos",
          trick: [{ actor: "ai", card: lead, rotation: 4, offsetX: 0, offsetY: 0 }],
          currentTurn: "player",
          leader: "ai",
          log: ["La IA juega <strong>As de espadas</strong>.", "No tienes espadas: debes fallar con triunfo."]
        });
      }
      case 8:
        return makeTutorialRound({
          playerHand: [makeCard("bastos", 12), makeCard("bastos", 11), makeCard("oros", 1), makeCard("copas", 5)],
          aiHand: [makeCard("oros", 6), makeCard("copas", 4), makeCard("espadas", 7)],
          stock: [makeCard("oros", 4), makeCard("espadas", 6)],
          trumpCard: makeCard("bastos", 4),
          currentTurn: null,
          playerTricks: 2,
          pendingCante: { actor: "player", options: [{ type: "song", suit: "bastos", points: 40 }] },
          log: ["Has ganado una baza y conservas <strong>rey y caballo de bastos</strong>."]
        });
      case 9:
      default:
        return makeTutorialRound({
          playerHand: [],
          aiHand: [],
          stock: [],
          trumpCard: null,
          trumpSuit: "bastos",
          phase: "roundOver",
          playerCardPoints: 82,
          aiCardPoints: 48,
          playerSongPoints: 40,
          playerTricks: 5,
          aiTricks: 3,
          lastTrickWinner: "player",
          log: ["<strong>Tutorial completado.</strong> Resultado de ejemplo: 122 a 48."]
        });
    }
  }

  function currentTutorialStep() {
    return TUTORIAL_STEPS[state.tutorial.stepIndex] || TUTORIAL_STEPS[0];
  }

  function setTutorialStep(index) {
    if (!state.tutorial.active) return;
    clearTimers();
    cleanupHandGesture();
    state.tutorial.stepIndex = Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, index));
    state.tutorial.busy = false;
    state.round = tutorialRoundForStep(state.tutorial.stepIndex);
    render();
    renderTutorialCoach();
  }

  function renderTutorialCoach() {
    if (!state.tutorial.active) return;
    const step = currentTutorialStep();
    UI.tutorialKicker.textContent = `LECCIÓN ${state.tutorial.stepIndex + 1} DE ${TUTORIAL_STEPS.length}`;
    UI.tutorialTitle.textContent = step.title;
    UI.tutorialText.innerHTML = step.text;
    UI.tutorialTip.textContent = step.tip || "";
    UI.tutorialTip.classList.toggle("hidden", !step.tip);
    UI.tutorialNextButton.classList.toggle("hidden", !["next", "finish"].includes(step.action));
    UI.tutorialNextButton.firstChild.textContent = `${step.button || "Continuar"} `;
    UI.tutorialProgress.replaceChildren();
    TUTORIAL_STEPS.forEach((_, index) => {
      const pip = document.createElement("span");
      if (index < state.tutorial.stepIndex) pip.classList.add("done");
      if (index === state.tutorial.stepIndex) pip.classList.add("current");
      UI.tutorialProgress.appendChild(pip);
    });
    applyTutorialFocus(step);
  }

  function clearTutorialFocus() {
    document.querySelectorAll(".tutorial-focus, .tutorial-card-target").forEach(element => {
      element.classList.remove("tutorial-focus", "tutorial-card-target");
    });
  }

  function applyTutorialFocus(step) {
    clearTutorialFocus();
    let target = null;
    if (step.focus === "hand") target = UI.playerHand;
    else if (step.focus === "trump") target = document.querySelector(".trump-wrap");
    else if (step.focus === "deck") target = UI.deckStack;
    else if (step.focus === "actions") target = document.getElementById("actionDock");
    else if (step.focus === "score") target = document.querySelector(".score-card");
    else target = document.querySelector(".table-center");
    target?.classList.add("tutorial-focus");
    if (step.allowedCardId) {
      UI.playerHand.querySelector(`[data-card-id="${step.allowedCardId}"]`)?.classList.add("tutorial-card-target");
    }
  }

  function handleTutorialNext() {
    if (!state.tutorial.active || state.tutorial.busy) return;
    const step = currentTutorialStep();
    if (step.action === "finish") {
      completeTutorial();
      return;
    }
    if (step.action === "next") setTutorialStep(state.tutorial.stepIndex + 1);
  }

  function completeTutorial() {
    try { localStorage.setItem("tuteTutorialClassicComplete", "true"); } catch (_) {}
    state.tutorial.completed = true;
    playSound("victory");
    showToast("<strong>Tutorial clásico completado.</strong> Ya puedes enfrentarte a la IA.");
    showHome();
  }

  function notifyTutorialAction(action) {
    if (!state.tutorial.active || currentTutorialStep().action !== action || state.tutorial.busy) return;
    state.tutorial.busy = true;
    later(() => setTutorialStep(state.tutorial.stepIndex + 1), 520);
  }

  async function tutorialMoveCard(actor, cardId) {
    const round = state.round;
    const hand = round.hands[actor];
    const cardIndex = hand.findIndex(card => card.id === cardId);
    const card = hand[cardIndex];
    if (!card) return null;
    const sourceElement = actor === "player"
      ? UI.playerHand.querySelector(`[data-card-id="${cardId}"]`)
      : UI.aiHand.children[cardIndex] || UI.aiHand.querySelector(".playing-card");
    const targetSlot = actor === "player" ? UI.playerTrickSlot : UI.aiTrickSlot;
    if (sourceElement) {
      round.busyFlight = true;
      const sourceRect = sourceElement.getBoundingClientRect();
      const targetRect = targetSlot.getBoundingClientRect();
      await animatePlayToTable(actor, card, sourceRect, targetRect);
      round.busyFlight = false;
    }
    const previousRects = actor === "player" ? capturePlayerHandRects() : null;
    hand.splice(cardIndex, 1);
    if (actor === "player") round.pendingHandFlip = previousRects;
    round.trick.push({
      actor,
      card,
      rotation: actor === "player" ? -4 : 4,
      offsetX: actor === "player" ? -2 : 2,
      offsetY: 0
    });
    round.playedCards.push(card);
    addLog(`${actor === "player" ? "Tú juegas" : "La IA juega"} <strong>${cardName(card)}</strong>.`);
    playSound("card");
    render();
    return card;
  }

  async function handleTutorialCardPlay(actor, cardId) {
    if (!state.tutorial.active || actor !== "player" || state.tutorial.busy) return;
    const step = currentTutorialStep();
    if (step.action !== "play") return;
    if (step.allowedCardId && cardId !== step.allowedCardId) {
      showToast(`<strong>Prueba con la carta resaltada.</strong> ${step.tip || ""}`);
      playSound("error");
      return;
    }
    state.tutorial.busy = true;
    cleanupHandGesture();
    await tutorialMoveCard("player", cardId);

    if (step.id === "open-play") {
      await sleep(300);
      await tutorialMoveCard("ai", "copas-7");
      state.round.cardPoints.player = 11;
      state.round.tricksWon.player = 1;
      state.round.captured.player.push(makeCard("copas", 1), makeCard("copas", 7));
      addLog("<strong>Ganas la baza</strong> con el as de copas y sumas 11 puntos.");
      playSound("winTrick");
      await sleep(380);
      await animateCollectTrick("player");
      state.round.trick = [];
      render();
      await sleep(360);
      setTutorialStep(5);
      return;
    }

    const winner = "player";
    const gained = state.round.trick.reduce((total, play) => total + play.card.points, 0);
    state.round.cardPoints.player += gained;
    state.round.tricksWon.player += 1;
    state.round.captured.player.push(...state.round.trick.map(play => play.card));
    addLog(step.id === "mount"
      ? "<strong>Correcto.</strong> Has asistido y montado el siete."
      : "<strong>Correcto.</strong> El triunfo gana al as de espadas.");
    playSound("winTrick");
    await sleep(330);
    await animateCollectTrick(winner);
    state.round.trick = [];
    render();
    await sleep(420);
    setTutorialStep(state.tutorial.stepIndex + 1);
  }

  async function handleTutorialDraw() {
    if (!state.tutorial.active || state.tutorial.busy || currentTutorialStep().action !== "draw") return;
    const round = state.round;
    state.tutorial.busy = true;
    round.drawing = true;
    const sourceRect = UI.deckStack.getBoundingClientRect();
    const card = round.stock.pop();
    renderDeck();
    await animateCardFlight("player", card, sourceRect, false, 600);
    const previousRects = capturePlayerHandRects();
    round.hands.player.push(card);
    round.pendingHandFlip = previousRects;
    round.lastDrawnId = card.id;
    round.drawing = false;
    addLog(`Robas <strong>${cardName(card)}</strong>.`);
    playSound("draw");
    render();
    await sleep(650);
    setTutorialStep(6);
  }

  function handleTutorialCante(option) {
    if (!state.tutorial.active || state.tutorial.busy || currentTutorialStep().action !== "song") return false;
    if (!option || option.type !== "song" || option.points !== 40) {
      showToast("<strong>En esta lección debes cantar las 40.</strong>");
      playSound("error");
      return true;
    }
    state.tutorial.busy = true;
    state.round.pendingCante = null;
    state.round.songPoints.player += 40;
    state.round.sungSuits.player.add("bastos");
    addLog("<strong>Cantas 40 en bastos.</strong>");
    showToast("<strong>+40 puntos.</strong> Rey y caballo del triunfo.");
    playSound("song");
    render();
    later(() => setTutorialStep(9), 780);
    return true;
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
    if (state.tutorial.active) renderTutorialCoach();
  }

  function renderHands() {
    const round = state.round;
    const canPlayNow = round.currentTurn === "player" && !round.pendingCante && round.phase === "playing";
    const legalIds = canPlayNow
      ? new Set(getLegalCards("player").map(card => card.id))
      : new Set();
    const flipRects = round.pendingHandFlip;
    round.pendingHandFlip = null;

    syncPlayerHand(round, canPlayNow, legalIds);
    syncAiHand(round);

    UI.manualOrderHint?.classList.toggle("visible", round.hands.player.length > 1 && !["dealing", "roundOver"].includes(round.phase));
    animateHandFlip(flipRects);
  }

  function syncPlayerHand(round, canPlayNow, legalIds) {
    const existing = new Map(
      [...UI.playerHand.querySelectorAll("[data-card-id]")]
        .map(element => [element.dataset.cardId, element])
    );
    const desired = [];
    const playerCount = round.hands.player.length || 1;

    round.hands.player.forEach((card, index) => {
      let cardButton = existing.get(card.id);
      if (!cardButton) cardButton = createInteractivePlayerCard(card);
      desired.push(cardButton);
      updatePlayerCardElement(cardButton, card, index, playerCount, canPlayNow, legalIds.has(card.id), round);
    });

    existing.forEach((element, id) => {
      if (!round.hands.player.some(card => card.id === id)) element.remove();
    });

    desired.forEach((element, index) => {
      const current = [...UI.playerHand.children].filter(child => child.matches?.("[data-card-id]"))[index];
      if (current !== element) UI.playerHand.insertBefore(element, current || null);
    });
  }

  function createInteractivePlayerCard(card) {
    const element = createCardElement(card, { button: true });
    element.dataset.cardId = card.id;
    element.addEventListener("pointerdown", event => {
      const playable = event.currentTarget.dataset.playable === "true";
      beginHandGesture(event, event.currentTarget.dataset.cardId, playable);
    });
    element.addEventListener("keydown", event => {
      const playable = event.currentTarget.dataset.playable === "true";
      if ((event.key === "Enter" || event.key === " ") && playable) {
        event.preventDefault();
        playCard("player", event.currentTarget.dataset.cardId);
      }
    });
    return element;
  }

  function updatePlayerCardElement(element, card, index, playerCount, canPlayNow, isPlayable, round) {
    const normalized = playerCount > 1 ? (index - (playerCount - 1) / 2) / ((playerCount - 1) / 2) : 0;
    element.dataset.cardId = card.id;
    element.dataset.playable = isPlayable ? "true" : "false";
    element.style.zIndex = index + 1;
    element.style.setProperty("--rest-rotate", `${normalized * 10.5}deg`);
    element.style.setProperty("--rest-y", `${Math.abs(normalized) * 16}px`);
    element.style.setProperty("--rest-x", `${normalized * 3}px`);
    element.classList.toggle("newly-drawn", round.lastDrawnId === card.id);
    element.classList.toggle("illegal", canPlayNow && !isPlayable);
    element.setAttribute("aria-disabled", isPlayable ? "false" : "true");
    element.setAttribute("aria-label", `${cardName(card)}${isPlayable ? ", jugar" : ", no disponible para jugar"}`);

    let pointsBadge = element.querySelector(".tutorial-points-badge");
    const showPoints = state.tutorial.active && currentTutorialStep().id === "values";
    if (showPoints && !pointsBadge) {
      pointsBadge = document.createElement("span");
      pointsBadge.className = "tutorial-points-badge";
      element.appendChild(pointsBadge);
    }
    if (pointsBadge) {
      pointsBadge.textContent = `${card.points} puntos`;
      pointsBadge.classList.toggle("hidden", !showPoints);
    }
  }

  function syncAiHand(round) {
    while (UI.aiHand.children.length < round.hands.ai.length) UI.aiHand.appendChild(createBackCard());
    while (UI.aiHand.children.length > round.hands.ai.length) UI.aiHand.lastElementChild?.remove();

    const aiCount = round.hands.ai.length || 1;
    [...UI.aiHand.children].forEach((back, index) => {
      const normalized = aiCount > 1 ? (index - (aiCount - 1) / 2) / ((aiCount - 1) / 2) : 0;
      back.style.zIndex = index + 1;
      back.style.setProperty("--rest-rotate", `${normalized * -7.5}deg`);
      back.style.setProperty("--rest-y", `${Math.abs(normalized) * 8}px`);
    });
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
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
      mode: "tap",
      insertIndex: round.hands.player.findIndex(card => card.id === cardId),
      ghost: null,
      slot: null
    };
    element.classList.add("card-pressed");
    document.addEventListener("pointermove", moveHandGesture, { passive: false });
    document.addEventListener("pointerup", endHandGesture, { once: true });
    document.addEventListener("pointercancel", cancelHandGesture, { once: true });
  }

  function moveHandGesture(event) {
    if (!handGesture || event.pointerId !== handGesture.pointerId) return;
    handGesture.lastX = event.clientX;
    handGesture.lastY = event.clientY;
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
      updateHandDropIndex(event.clientX);
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
    ghost.classList.remove("illegal", "newly-drawn", "card-pressed", "gesture-source");
    ghost.classList.add("hand-drag-ghost");
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.left = `${event.clientX}px`;
    ghost.style.top = `${event.clientY}px`;
    document.body.appendChild(ghost);
    handGesture.ghost = ghost;

    const slot = document.createElement("span");
    slot.className = "hand-drop-slot";
    slot.innerHTML = "<b>AQUÍ</b>";
    slot.setAttribute("aria-hidden", "true");
    handGesture.slot = slot;
    setGestureMode("reorder");
    updateHandDropIndex(event.clientX, true);
  }

  function isPointInPlayZone(x, y) {
    const rect = UI.trickArea.getBoundingClientRect();
    const paddingX = Math.min(120, rect.width * .22);
    const paddingY = 90;
    return x >= rect.left - paddingX && x <= rect.right + paddingX &&
      y >= rect.top - paddingY && y <= rect.bottom + paddingY;
  }

  function isPointNearHand(x, y) {
    const rect = UI.playerHand.getBoundingClientRect();
    return x >= rect.left - 90 && x <= rect.right + 90 &&
      y >= rect.top - 85 && y <= rect.bottom + 105;
  }

  function setGestureMode(mode) {
    if (!handGesture || handGesture.mode === mode) return;
    handGesture.mode = mode;
    document.body.classList.toggle("reordering-hand", mode === "reorder");
    document.body.classList.toggle("dragging-to-table", mode === "play" || mode === "invalid-play");
    UI.playerHand.classList.toggle("showing-drop-slot", mode === "reorder");
    UI.trickArea.classList.toggle("play-drop-active", mode === "play" || mode === "invalid-play");
    UI.trickArea.classList.toggle("play-drop-valid", mode === "play");
    UI.trickArea.classList.toggle("play-drop-invalid", mode === "invalid-play");
    UI.playDropIndicator.querySelector("span").textContent = mode === "invalid-play" ? "JUGADA NO VÁLIDA" : "SUELTA PARA JUGAR";

    if (mode === "reorder") {
      if (handGesture.slot && !handGesture.slot.isConnected) UI.playerHand.appendChild(handGesture.slot);
    } else {
      handGesture.slot?.remove();
    }
  }

  function updateHandDropIndex(clientX, force = false) {
    if (!handGesture || handGesture.mode !== "reorder") return;
    const cards = [...UI.playerHand.querySelectorAll("[data-card-id]")]
      .filter(element => element.dataset.cardId !== handGesture.cardId);
    const sorted = cards.map(element => ({ element, rect: element.getBoundingClientRect() }))
      .sort((a, b) => a.rect.left - b.rect.left);
    const insertIndex = sorted.filter(item => clientX > item.rect.left + item.rect.width / 2).length;
    if (!force && insertIndex === handGesture.insertIndex && handGesture.slot?.isConnected) return;

    const previousRects = capturePlayerHandRects();
    handGesture.insertIndex = insertIndex;
    const target = sorted[insertIndex]?.element || null;
    UI.playerHand.insertBefore(handGesture.slot, target);
    animateDirectHandReflow(previousRects);
  }

  function animateDirectHandReflow(previousRects) {
    requestAnimationFrame(() => {
      UI.playerHand.querySelectorAll("[data-card-id]").forEach(element => {
        if (element.dataset.cardId === handGesture?.cardId) return;
        const previous = previousRects.get(element.dataset.cardId);
        if (!previous) return;
        const current = element.getBoundingClientRect();
        const dx = previous.left - current.left;
        const dy = previous.top - current.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        element.animate([
          { translate: `${dx}px ${dy}px` },
          { translate: "0px 0px" }
        ], { duration: 175, easing: "cubic-bezier(.2,.8,.2,1)" });
      });
    });
  }

  async function endHandGesture(event) {
    if (!handGesture || event.pointerId !== handGesture.pointerId) return;
    const gesture = handGesture;

    if (!gesture.moved) {
      cleanupHandGesture();
      if (gesture.playable && state.round?.currentTurn === "player" && state.round.phase === "playing") {
        playCard("player", gesture.cardId);
      }
      return;
    }

    if (gesture.mode === "play") {
      cleanupHandGesture();
      navigator.vibrate?.(12);
      playCard("player", gesture.cardId);
      return;
    }

    if (gesture.mode === "invalid-play") {
      const message = getIllegalPlayReason(gesture.cardId);
      await animateGhostBack(gesture);
      cleanupHandGesture();
      showToast(`<strong>No puedes jugar esa carta.</strong> ${message}`);
      playSound("error");
      return;
    }

    if (gesture.mode === "reorder") {
      const round = state.round;
      const fromIndex = round.hands.player.findIndex(card => card.id === gesture.cardId);
      const insertIndex = Math.max(0, Math.min(round.hands.player.length - 1, gesture.insertIndex));
      cleanupHandGesture();
      const previousRects = capturePlayerHandRects();
      const [movedCard] = round.hands.player.splice(fromIndex, 1);
      round.hands.player.splice(Math.min(insertIndex, round.hands.player.length), 0, movedCard);
      round.pendingHandFlip = previousRects;
      playSound("card");
      navigator.vibrate?.(7);
      render();
      if (state.tutorial.active && currentTutorialStep().action === "reorder" && fromIndex !== insertIndex) {
        notifyTutorialAction("reorder");
      }
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
      { transform: "translate(-50%, -88%) rotate(-3deg) scale(1.08)", opacity: .98 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-88% + ${dy}px)) rotate(0deg) scale(.96)`, opacity: .35 }
    ], { duration: 220, easing: "cubic-bezier(.22,.78,.18,1)", fill: "forwards" });
    try { await animation.finished; } catch (_) {}
  }

  function getIllegalPlayReason(cardId) {
    const round = state.round;
    if (state.tutorial.active && currentTutorialStep().allowedCardId && cardId !== currentTutorialStep().allowedCardId) {
      return "En esta lección debes usar la carta resaltada.";
    }
    if (!round || round.phase !== "playing") return "Ahora no está activa la fase de juego.";
    if (round.currentTurn !== "player") return "Ahora debe jugar la IA.";
    const card = round.hands.player.find(item => item.id === cardId);
    if (!card) return "La carta ya no está en tu mano.";
    const legal = getLegalCards("player");
    if (legal.some(item => item.id === cardId)) return "Suelta la carta sobre el tapete para jugarla.";
    if (round.trick.length === 1) {
      const lead = round.trick[0].card;
      if (legal.every(item => item.suit === lead.suit)) {
        const canMount = legal.some(item => item.strength > lead.strength);
        return canMount ? `Debes asistir a ${SUIT_LABELS[lead.suit]} y montar.` : `Debes asistir a ${SUIT_LABELS[lead.suit]}.`;
      }
      if (legal.every(item => item.suit === round.trumpSuit)) return `No tienes ${SUIT_LABELS[lead.suit]}: debes jugar triunfo.`;
    }
    return "Las reglas de la baza obligan a jugar otra carta.";
  }

  function cleanupHandGesture() {
    if (!handGesture) return;
    handGesture.element?.classList.remove("card-pressed", "gesture-source");
    handGesture.ghost?.remove();
    handGesture.slot?.remove();
    document.removeEventListener("pointermove", moveHandGesture);
    document.removeEventListener("pointerup", endHandGesture);
    document.removeEventListener("pointercancel", cancelHandGesture);
    document.body.classList.remove("reordering-hand", "dragging-to-table");
    UI.playerHand.classList.remove("showing-drop-slot");
    UI.trickArea.classList.remove("play-drop-active", "play-drop-valid", "play-drop-invalid");
    handGesture = null;
  }

  function renderTrick() {
    const playerPlay = state.round.trick.find(play => play.actor === "player") || null;
    const aiPlay = state.round.trick.find(play => play.actor === "ai") || null;
    patchTrickSlot(UI.playerTrickSlot, playerPlay, "TÚ");
    patchTrickSlot(UI.aiTrickSlot, aiPlay, "IA");
  }

  function patchTrickSlot(slot, play, label) {
    const desiredKey = play ? play.card.id : `empty:${label}`;
    if (slot.dataset.renderKey !== desiredKey) {
      slot.dataset.renderKey = desiredKey;
      slot.replaceChildren();
      if (play) {
        const cardElement = createCardElement(play.card);
        cardElement.dataset.cardId = play.card.id;
        slot.appendChild(cardElement);
      } else {
        const empty = document.createElement("span");
        empty.className = "slot-label";
        empty.textContent = label;
        slot.appendChild(empty);
      }
    }

    if (play) {
      const cardElement = slot.querySelector(".playing-card");
      cardElement?.style.setProperty("--play-rotation", `${play.rotation ?? (play.actor === "player" ? -4 : 4)}deg`);
      cardElement?.style.setProperty("--play-x", `${play.offsetX ?? 0}px`);
      cardElement?.style.setProperty("--play-y", `${play.offsetY ?? 0}px`);
    }
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

    const desiredKey = round.trumpCard
      ? `card:${round.trumpCard.id}`
      : round.phase === "dealing"
        ? "label:undiscovered"
        : "label:exhausted";

    if (UI.trumpCard.dataset.renderKey !== desiredKey) {
      UI.trumpCard.dataset.renderKey = desiredKey;
      UI.trumpCard.replaceChildren();
      if (round.trumpCard) {
        const cardElement = createCardElement(round.trumpCard);
        cardElement.dataset.cardId = round.trumpCard.id;
        UI.trumpCard.appendChild(cardElement);
      } else {
        const label = document.createElement("span");
        label.className = "slot-label";
        label.textContent = round.phase === "dealing" ? "POR DESCUBRIR" : "AGOTADO";
        UI.trumpCard.appendChild(label);
      }
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

    if (state.tutorial.active) {
      const step = currentTutorialStep();
      UI.phaseBadge.textContent = ["mount", "trump-fail"].includes(step.id) ? "JUEGO OBLIGADO" : "TUTORIAL CLÁSICO";
      UI.phaseBadge.classList.toggle("strict", ["mount", "trump-fail"].includes(step.id));
      UI.ruleStateTitle.textContent = step.title;
      UI.ruleStateText.textContent = step.tip || "Sigue la indicación de la maestra.";
      UI.statusText.textContent = step.action === "reorder"
        ? "Reordena una carta de tu mano."
        : step.action === "play"
          ? "Juega la carta resaltada."
          : step.action === "draw"
            ? "Pulsa la baceta para robar."
            : step.action === "song"
              ? "Realiza el cante disponible."
              : step.action === "finish"
                ? "Tutorial terminado."
                : "Lee la explicación y continúa.";
      UI.playerTurnPill.classList.toggle("visible", ["play", "draw", "reorder"].includes(step.action));
      UI.aiTurnPill.classList.remove("visible");
    }

    const unseen = round.hands.ai.length + drawPileCount();
    UI.unknownCards.textContent = unseen;
  }

  function renderScores() {
    const round = state.round;
    const playerTotal = round.cardPoints.player + round.songPoints.player;
    const aiTotal = round.cardPoints.ai + round.songPoints.ai;

    UI.roundNumber.textContent = state.tutorial.active
      ? `LECCIÓN ${state.tutorial.stepIndex + 1}`
      : `MANO ${state.match.round}`;
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
    const pipCount = state.tutorial.active ? TUTORIAL_STEPS.length : state.settings.targetRounds;
    UI.targetRounds.textContent = state.tutorial.active
      ? `${state.tutorial.stepIndex + 1} de ${TUTORIAL_STEPS.length}`
      : `${state.settings.targetRounds} ${state.settings.targetRounds === 1 ? "mano" : "manos"}`;

    UI.roundPips.style.setProperty("--pip-count", pipCount);
    UI.roundPips.innerHTML = "";
    for (let i = 0; i < pipCount; i += 1) {
      const pip = document.createElement("span");
      pip.className = "round-pip";
      if (state.tutorial.active) {
        if (i < state.tutorial.stepIndex) pip.classList.add("player");
        else if (i === state.tutorial.stepIndex) pip.classList.add("tutorial-current-pip");
      } else if (i < state.match.playerRounds) pip.classList.add("player");
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
    if (!isStrictPhase()) return "Baceta abierta. Toca una carta para jugarla, arrástrala al tapete o muévela entre tus cartas.";
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
    if (state.tutorial.active) {
      await handleTutorialCardPlay(actor, cardId);
      return;
    }
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

    if (state.tutorial.active && actor === "player") {
      const allowedCardId = currentTutorialStep().allowedCardId;
      if (allowedCardId) {
        const allowed = hand.find(card => card.id === allowedCardId);
        return allowed ? [allowed] : [];
      }
    }

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
    if (state.tutorial.active && handleTutorialCante(option)) return;
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
    if (state.tutorial.active) {
      handleTutorialDraw();
      return;
    }
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
    if (state.tutorial.active) return;
    const round = state.round;
    if (!round || round.currentTurn !== "ai" || round.phase !== "playing" || round.pendingCante) return;

    render();
    const delay = state.settings.difficulty === "hard" ? 760 : 620;
    later(() => {
      const current = state.round;
      if (!current || current.currentTurn !== "ai" || current.phase !== "playing") return;
      if (handGesture) {
        later(scheduleAiTurn, 240);
        return;
      }
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
