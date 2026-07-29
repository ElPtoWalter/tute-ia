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
  const MODES = {
    arrastrado3: {
      id: "arrastrado3",
      kicker: "3 JUGADORES · INDIVIDUAL",
      title: "Tute arrastrado",
      description: "Tú contra dos inteligencias artificiales. Trece cartas por jugador, una carta apartada y sin triunfo inicial: el primer cante fija el pinte.",
      players: 3,
      handSize: 13,
      teams: false,
      names: ["Eduardo", "Don Cálculo", "Doña Virtud"],
      facts: ["13 cartas por jugador", "Sin triunfo inicial", "El primer cante fija el pinte", "Obligaciones completas", "Puntuación individual"],
      rules: [
        ["01", "Asistir", "Siempre debes jugar el palo de salida cuando lo conserves."],
        ["02", "Montar", "Si la baza todavía se decide en el palo de salida y puedes superarla, estás obligado a hacerlo."],
        ["03", "Baza fallada", "Si ya gana un triunfo pero conservas el palo de salida, solo debes asistir; no necesitas superar la primera carta."],
        ["04", "Fallar y pisar", "Sin el palo de salida debes jugar triunfo. Si ya hay triunfo, debes superarlo cuando puedas; si no puedes, el descarte es libre."],
        ["05", "Primer cante", "No hay triunfo al repartir. El primer rey y caballo que se canten fijan ese palo como triunfo y valen 40; después, los demás palos valen 20."],
        ["06", "Final", "La última baza suma 10. Gana quien reúna más tantos." ]
      ]
    },
    pairs4: {
      id: "pairs4",
      kicker: "4 JUGADORES · PAREJAS",
      title: "Clásico por parejas",
      description: "Tú formas pareja con Doña Virtud. Don Cálculo y El Notario son la pareja rival. Diez cartas cada uno y puntuación conjunta por equipos.",
      players: 4,
      handSize: 10,
      teams: true,
      names: ["Eduardo", "Don Cálculo", "Doña Virtud", "El Notario"],
      facts: ["10 cartas por jugador", "Tú + Doña Virtud", "Juego obligado", "Marcador por parejas", "Sin información oculta"],
      rules: [
        ["01", "Parejas", "Tú y el jugador situado enfrente formáis equipo. Los puntos y cantes se suman."],
        ["02", "Asistir", "El palo de salida tiene prioridad, incluso cuando otro jugador ya ha fallado con triunfo."],
        ["03", "Montar", "Debes superar la carta que va ganando dentro del palo de salida, salvo que la baza ya esté ganada por triunfo."],
        ["04", "Fallar y pisar", "Sin el palo de salida fallas. Si ya hay triunfo, debes pisarlo si dispones de uno superior."],
        ["05", "Compañero", "No necesitas superar a tu compañero si la regla de la baza no te obliga; protege tantos y triunfos."],
        ["06", "Final", "Las cartas, cantes y diez de últimas se suman por pareja." ]
      ]
    },
    individual4: {
      id: "individual4",
      kicker: "4 JUGADORES · INDIVIDUAL",
      title: "Tute individual a cuatro",
      description: "Cuatro jugadores compiten por separado. Diez cartas cada uno, sin baceta y con una baza formada por cuatro cartas.",
      players: 4,
      handSize: 10,
      teams: false,
      names: ["Eduardo", "Don Cálculo", "Doña Virtud", "El Notario"],
      facts: ["10 cartas por jugador", "Todos contra todos", "Juego obligado", "Lectura de 4 cartas", "Cantes individuales"],
      rules: [
        ["01", "Palo de salida", "Debes asistir siempre que puedas, aunque la baza haya sido fallada."],
        ["02", "Montar", "Si el palo de salida continúa ganando, debes superarlo cuando tengas una carta suficiente."],
        ["03", "Triunfo ganador", "Cuando un triunfo ya gana la baza, asistir al palo de salida no exige superar la carta inicial."],
        ["04", "Pisar", "Si fallas y existe un triunfo ganador, debes jugar uno superior si puedes. Si no, el descarte es libre."],
        ["05", "Cantes", "Los cantes pertenecen únicamente al jugador que los declara."],
        ["06", "Final", "Gana el jugador con mayor puntuación total." ]
      ]
    }
  };

  const params = new URLSearchParams(location.search);
  const mode = MODES[params.get("mode")] || MODES.arrastrado3;
  const tutorialRequested = params.get("tutorial") === "1";
  const UI = {};
  let multiAutosaveTimer = null;
  let multiSaveRecord = null;
  let multiGesture = null;
  let suppressHumanClickUntil = 0;
  const state = {
    difficulty: "normal",
    players: [],
    deck: [],
    trumpCard: null,
    trumpSuit: null,
    trick: [],
    leader: 0,
    current: 0,
    trickNumber: 1,
    phase: "setup",
    log: [],
    pendingDeclaration: null,
    asideCard: null,
    busy: false,
    tutorialIndex: 0
  };

  const tutorialSteps = [
    { title: "La mesa y el orden de turno", text: mode.players === 3 ? "En el arrastrado juegas contra dos rivales. Cada baza tendrá tres cartas, no hay triunfo inicial y el primer cante fijará el pinte." : "La baza recorre la mesa en sentido horario. Cada jugador aporta una carta y el ganador de las cuatro vuelve a salir." },
    { title: "El palo de salida manda", text: "Si conservas el palo de la primera carta, debes jugarlo. Esta obligación tiene prioridad incluso si otro jugador ya ha echado triunfo." },
    { title: "Cuándo debes montar", text: "Si la baza continúa ganada por una carta del palo de salida y puedes superarla, debes hacerlo. Si ya gana un triunfo, solo tienes que asistir con cualquier carta del palo." },
    { title: "Fallar y pisar", text: "Sin el palo de salida debes fallar. Si ya hay un triunfo en la mesa, debes superarlo cuando puedas. Si no puedes pisarlo, puedes descartarte con cualquier carta." },
    { title: mode.teams ? "Jugar con tu compañero" : "Controlar a varios rivales", text: mode.teams ? "Doña Virtud está enfrente y forma pareja contigo. Sus puntos cuentan para vuestro equipo; evita gastar una carta alta cuando ella ya controla la baza." : "Observa quién va ganando antes de decidir. Una carta que supera la salida puede seguir perdiendo si otro jugador ya ha fallado." },
    { title: "Preparado para jugar", text: "Pulsa «Sentarse y repartir». Las cartas legales quedarán resaltadas y la lectura de mesa explicará cada obligación." }
  ];

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheUI();
    const clubName = window.SalaCeroClub?.getData()?.profile?.name;
    if (clubName) mode.names[0] = clubName;
    configureMode();
    bindUI();
    renderRules();
    renderTutorial();
    UI.multiSetup.showModal();
    refreshMultiSaveCard();
  }

  function cacheUI() {
    ["modeKicker","modeTitle","multiMusicButton","multiRulesButton","multiTable","multiTutorial","multiTutorialKicker","multiTutorialTitle","multiTutorialText","multiTutorialDots","multiTutorialNext","multiTutorialExit","multiPhase","multiStatus","multiTrump","multiTrumpSuit","multiTrickRing","multiDropCore","multiCanteActions","multiHint","scoreTitle","trickCounter","multiScoreList","multiRuleTitle","multiRuleText","playerCardsLeft","tricksPlayed","currentLeader","multiLog","multiSetup","multiSetupForm","setupModeKicker","setupModeTitle","setupModeDescription","setupFacts","multiRulesModal","closeMultiRules","multiRulesTitle","multiRulesGrid","understandMultiRules","multiResult","multiResultSeal","multiResultTitle","multiResultText","multiFinalRanking","multiRematch","multiMusic","multiResumeCard","multiResumeTitle","multiResumeMeta","multiResumeSave","multiDiscardSave"].forEach(id => UI[id] = document.getElementById(id));
    for (let i=0;i<4;i+=1) {
      UI[`seat${i}`] = document.getElementById(`seat${i}`);
      UI[`hand${i}`] = document.getElementById(`hand${i}`);
      UI[`slot${i}`] = document.getElementById(`slot${i}`);
      UI[`turn${i}`] = document.getElementById(`turn${i}`);
      UI[`name${i}`] = document.getElementById(`name${i}`);
    }
  }

  function configureMode() {
    document.title = `Tute IA — ${mode.title}`;
    UI.modeKicker.textContent = mode.kicker;
    UI.modeTitle.textContent = mode.title;
    UI.setupModeKicker.textContent = mode.kicker;
    UI.setupModeTitle.textContent = mode.title;
    UI.setupModeDescription.textContent = mode.description;
    UI.setupFacts.innerHTML = mode.facts.map(fact => `<span>${fact}</span>`).join("");
    UI.multiRulesTitle.textContent = mode.title;
    UI.scoreTitle.textContent = mode.teams ? "Marcador por parejas" : "Puntuación individual";
    mode.names.forEach((name,index) => { if (UI[`name${index}`]) UI[`name${index}`].textContent = name; });
    if (mode.players === 3) {
      UI.seat3.classList.add("hidden-seat");
      UI.slot3.classList.add("hidden-slot");
    }
    if (mode.teams) {
      UI.seat2.classList.add("partner");
      document.getElementById("role3").textContent = "RIVAL";
      document.querySelector("#seat2 small").textContent = "COMPAÑERA";
    }
    const savedVolume = Number(localStorage.getItem("tuteIaMusicVolume"));
    UI.multiMusic.volume = Number.isFinite(savedVolume) ? savedVolume : .28;
  }

  function bindUI() {
    UI.multiSetupForm.addEventListener("submit", event => {
      event.preventDefault();
      state.difficulty = document.querySelector('input[name="multiDifficulty"]:checked')?.value || "normal";
      UI.multiSetup.close();
      startMusic();
      startGame();
    });
    UI.multiRulesButton.addEventListener("click", () => UI.multiRulesModal.showModal());
    UI.closeMultiRules.addEventListener("click", () => UI.multiRulesModal.close());
    UI.understandMultiRules.addEventListener("click", () => UI.multiRulesModal.close());
    UI.multiMusicButton.addEventListener("click", toggleMusic);
    UI.multiResumeSave?.addEventListener("click", resumeMultiGame);
    UI.multiDiscardSave?.addEventListener("click", discardMultiSave);
    UI.multiRematch.addEventListener("click", () => { UI.multiResult.close(); startGame(); });
    UI.multiTrickRing.addEventListener("dragover", event => { event.preventDefault(); UI.multiTrickRing.classList.add("drag-active"); });
    UI.multiTrickRing.addEventListener("dragleave", () => UI.multiTrickRing.classList.remove("drag-active"));
    UI.multiTrickRing.addEventListener("drop", event => {
      event.preventDefault();
      UI.multiTrickRing.classList.remove("drag-active");
      const cardId = event.dataTransfer.getData("text/plain");
      if (cardId) humanPlay(cardId);
    });
    UI.multiTutorialNext.addEventListener("click", nextTutorial);
    UI.multiTutorialExit.addEventListener("click", () => UI.multiTutorial.classList.add("hidden"));
  }

  function renderRules() {
    UI.multiRulesGrid.innerHTML = mode.rules.map(([number,title,text]) => `<article><span>${number}</span><h3>${title}</h3><p>${text}</p></article>`).join("");
  }

  function renderTutorial() {
    UI.multiTutorial.classList.toggle("hidden", !tutorialRequested);
    if (!tutorialRequested) return;
    const step = tutorialSteps[state.tutorialIndex];
    UI.multiTutorialKicker.textContent = `LECCIÓN ${state.tutorialIndex + 1} DE ${tutorialSteps.length}`;
    UI.multiTutorialTitle.textContent = step.title;
    UI.multiTutorialText.textContent = step.text;
    UI.multiTutorialDots.innerHTML = tutorialSteps.map((_,i) => `<i class="${i===state.tutorialIndex ? "active" : ""}"></i>`).join("");
    UI.multiTutorialNext.textContent = state.tutorialIndex === tutorialSteps.length-1 ? "Cerrar tutorial" : "Continuar →";
  }

  function nextTutorial() {
    if (state.tutorialIndex >= tutorialSteps.length-1) {
      try { localStorage.setItem(`tuteTutorialComplete:${mode.id}`, "true"); } catch (_) {}
      UI.multiTutorial.classList.add("hidden");
      toast("Tutorial completado");
      return;
    }
    state.tutorialIndex += 1;
    renderTutorial();
  }

  async function startMusic() {
    const enabled = localStorage.getItem("tuteIaMusicEnabled") !== "false";
    if (!enabled) return;
    try { await UI.multiMusic.play(); UI.multiMusicButton.textContent = "♫"; window.TuteMusicContinuity?.sync(); } catch (_) {}
  }

  async function toggleMusic() {
    if (UI.multiMusic.paused) {
      try { await UI.multiMusic.play(); localStorage.setItem("tuteIaMusicEnabled","true"); UI.multiMusicButton.textContent="♫"; } catch (_) {}
    } else {
      window.TuteMusicContinuity?.savePosition(); UI.multiMusic.pause(); localStorage.setItem("tuteIaMusicEnabled","false"); UI.multiMusicButton.textContent="♩";
    }
  }

  function buildDeck() {
    return SUITS.flatMap(suit => RANKS.map(data => ({ id:`${suit}-${data.rank}`, suit, ...data })));
  }

  function shuffle(cards) {
    const deck=[...cards];
    for (let i=deck.length-1;i>0;i-=1) { const j=Math.floor(Math.random()*(i+1)); [deck[i],deck[j]]=[deck[j],deck[i]]; }
    return deck;
  }

  function sortHand(hand) {
    const order=Object.fromEntries(SUITS.map((s,i)=>[s,i]));
    return hand.sort((a,b)=>a.suit===b.suit ? b.strength-a.strength : order[a.suit]-order[b.suit]);
  }

  function startGame() {
    window.TutePWA?.setPlaying(true);
    state.deck=shuffle(buildDeck());
    state.players=Array.from({length:mode.players},(_,id)=>({ id, name:mode.names[id], human:id===0, hand:[], cardPoints:0, songPoints:0, tricks:0, captured:[], sung:new Set() }));
    state.trick=[];
    state.leader=0;
    state.current=0;
    state.trickNumber=1;
    state.phase="dealing";
    state.log=[];
    state.pendingDeclaration=null;
    state.asideCard=null;
    state.busy=false;
    clearTable();
    addLog(`<strong>${mode.title}.</strong> Barajando y repartiendo.`);
    render();
    dealAll();
  }

  async function dealAll() {
    let lastDealt=null;
    for (let r=0;r<mode.handSize;r+=1) {
      for (let p=0;p<mode.players;p+=1) {
        const card=state.deck.pop();
        lastDealt=card;
        state.players[p].hand.push(card);
        renderHands();
        await wait(55);
      }
    }
    if (mode.players===3) {
      state.asideCard=state.deck.pop();
      state.trumpCard=null;
      state.trumpSuit=null;
    } else {
      state.trumpCard=lastDealt;
      state.trumpSuit=state.trumpCard.suit;
    }
    state.players.slice(1).forEach(player=>sortHand(player.hand));
    state.phase="playing";
    state.current=state.leader;
    if (mode.players===3) addLog("No hay triunfo inicial: <strong>el primer cante fijará el pinte</strong>.");
    else addLog(`Pinta <strong>${cardName(state.trumpCard)}</strong>.`);
    addLog("Sales tú en la primera baza.");
    render();
    if (state.current!==0) scheduleAi();
  }

  function clearTable() {
    for (let i=0;i<4;i+=1) {
      UI[`hand${i}`].replaceChildren();
      UI[`slot${i}`].innerHTML=`<span>${i===0?"TÚ":`IA ${i}`}</span>`;
    }
  }

  function wait(ms) { return new Promise(resolve=>setTimeout(resolve,ms)); }

  function createCard(card, back=false) {
    const button=document.createElement("button");
    button.className="multi-card";
    button.dataset.cardId=card?.id||"back";
    const img=document.createElement("img");
    img.src=back ? "assets/cards/back.svg" : `assets/cards/${card.suit}-${card.rank}.webp`;
    img.alt=back ? "Carta boca abajo" : cardName(card);
    img.draggable=false;
    button.appendChild(img);
    return button;
  }

  function render() {
    renderHands();
    renderTrick();
    renderTrump();
    renderStatus();
    renderScores();
    renderLog();
    renderDeclarations();
    renderTurns();
    queueMultiAutosave();
  }

  function renderHands() {
    state.players.forEach((player,index)=>{
      const handEl=UI[`hand${index}`];
      if (!handEl) return;
      if (index===0) {
        const legalIds=new Set(state.phase==="playing"&&state.current===0&&!state.pendingDeclaration ? getLegalCards(0).map(c=>c.id):[]);
        const existing=new Map([...handEl.querySelectorAll("[data-card-id]")].map(el=>[el.dataset.cardId,el]));
        player.hand.forEach((card,i)=>{
          let el=existing.get(card.id);
          if (!el) {
            el=createCard(card,false);
            el.draggable=true;
            el.addEventListener("click",()=>{ if (Date.now() >= suppressHumanClickUntil) humanPlay(card.id); });
            el.addEventListener("pointerdown", event => beginMultiGesture(event, card.id, el));
            el.addEventListener("dragstart",event=>{ event.dataTransfer.setData("text/plain",card.id); el.classList.add("dragging"); });
            el.addEventListener("dragend",()=>{ el.classList.remove("dragging"); UI.multiTrickRing.classList.remove("drag-active"); });
            el.addEventListener("dragover",event=>event.preventDefault());
            el.addEventListener("drop",event=>reorderHuman(event,card.id));
          }
          el.classList.toggle("legal",legalIds.has(card.id));
          el.classList.toggle("illegal",state.current===0&&state.phase==="playing"&&!legalIds.has(card.id));
          el.style.zIndex=String(i+1);
          el.style.setProperty("--fan-r",`${(i-(player.hand.length-1)/2)*2.7}deg`);
          el.style.setProperty("--fan-y",`${Math.abs(i-(player.hand.length-1)/2)*2.5}px`);
          handEl.appendChild(el);
          existing.delete(card.id);
        });
        existing.forEach(el=>el.remove());
      } else {
        if (handEl.children.length!==player.hand.length) {
          handEl.replaceChildren();
          player.hand.forEach((_,i)=>{ const el=createCard(null,true); el.style.zIndex=String(i+1); handEl.appendChild(el); });
        }
      }
    });
    UI.playerCardsLeft.textContent=state.players[0]?.hand.length||0;
  }

  function reorderHuman(event,targetId) {
    event.preventDefault();
    event.stopPropagation();
    const sourceId=event.dataTransfer.getData("text/plain");
    if (!sourceId||sourceId===targetId) return;
    const hand=state.players[0].hand;
    const from=hand.findIndex(c=>c.id===sourceId);
    let to=hand.findIndex(c=>c.id===targetId);
    if (from<0||to<0) return;
    const rect=event.currentTarget.getBoundingClientRect();
    const before=event.clientX<rect.left+rect.width/2;
    const [card]=hand.splice(from,1);
    if (from<to) to-=1;
    hand.splice(to+(before?0:1),0,card);
    renderHands();
  }

  function beginMultiGesture(event, cardId, element) {
    if (state.phase !== "playing" || state.current !== 0 || state.busy || state.pendingDeclaration || event.button > 0 || event.isPrimary === false) return;
    event.preventDefault();
    const legal = getLegalCards(0).some(card => card.id === cardId);
    element.setPointerCapture?.(event.pointerId);
    multiGesture = {
      pointerId: event.pointerId,
      cardId,
      element,
      playable: legal,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      mode: "tap",
      insertIndex: state.players[0].hand.findIndex(card => card.id === cardId),
      ghost: null,
      slot: null,
      sourceRect: null
    };
    document.addEventListener("pointermove", moveMultiGesture, { passive: false });
    document.addEventListener("pointerup", endMultiGesture, { once: true });
    document.addEventListener("pointercancel", cancelMultiGesture, { once: true });
  }

  function moveMultiGesture(event) {
    if (!multiGesture || event.pointerId !== multiGesture.pointerId) return;
    const dx = event.clientX - multiGesture.startX;
    const dy = event.clientY - multiGesture.startY;
    if (!multiGesture.moved && Math.hypot(dx, dy) < 9) return;
    if (!multiGesture.moved) startMultiDrag(event);
    event.preventDefault();
    multiGesture.ghost.style.left = `${event.clientX}px`;
    multiGesture.ghost.style.top = `${event.clientY}px`;
    if (pointInsideMultiTable(event.clientX, event.clientY)) {
      setMultiGestureMode(multiGesture.playable ? "play" : "invalid");
      return;
    }
    if (pointNearMultiHand(event.clientX, event.clientY)) {
      setMultiGestureMode("reorder");
      updateMultiDropIndex(event.clientX);
      autoScrollMultiHand(event.clientX);
      return;
    }
    setMultiGestureMode("cancel");
  }

  function startMultiDrag(event) {
    multiGesture.moved = true;
    suppressHumanClickUntil = Date.now() + 500;
    const rect = multiGesture.element.getBoundingClientRect();
    multiGesture.sourceRect = rect;
    multiGesture.element.classList.add("gesture-source");
    const ghost = multiGesture.element.cloneNode(true);
    ghost.classList.remove("legal", "illegal", "dragging", "gesture-source");
    ghost.classList.add("hand-drag-ghost", "multi-drag-ghost");
    Object.assign(ghost.style, { width: `${rect.width}px`, height: `${rect.height}px`, left: `${event.clientX}px`, top: `${event.clientY}px` });
    document.body.appendChild(ghost);
    multiGesture.ghost = ghost;
    const slot = document.createElement("span");
    slot.className = "hand-drop-slot multi-drop-slot";
    slot.innerHTML = "<b>AQUÍ</b>";
    multiGesture.slot = slot;
    setMultiGestureMode("reorder");
    updateMultiDropIndex(event.clientX, true);
  }

  function pointInsideMultiTable(x, y) {
    const rect = UI.multiTrickRing.getBoundingClientRect();
    return x >= rect.left - 65 && x <= rect.right + 65 && y >= rect.top - 65 && y <= rect.bottom + 65;
  }

  function pointNearMultiHand(x, y) {
    const rect = UI.hand0.getBoundingClientRect();
    return x >= rect.left - 70 && x <= rect.right + 70 && y >= rect.top - 90 && y <= rect.bottom + 100;
  }

  function setMultiGestureMode(modeName) {
    if (!multiGesture || multiGesture.mode === modeName) return;
    multiGesture.mode = modeName;
    UI.multiTrickRing.classList.toggle("play-drop-active", modeName === "play" || modeName === "invalid");
    UI.multiTrickRing.classList.toggle("play-drop-valid", modeName === "play");
    UI.multiTrickRing.classList.toggle("play-drop-invalid", modeName === "invalid");
    UI.multiDropCore.querySelector("span").textContent = modeName === "invalid" ? "JUGADA NO VÁLIDA" : "SUELTA PARA JUGAR";
    if (modeName === "reorder") {
      if (multiGesture.slot && !multiGesture.slot.isConnected) UI.hand0.appendChild(multiGesture.slot);
    } else multiGesture.slot?.remove();
  }

  function updateMultiDropIndex(clientX, force = false) {
    if (!multiGesture || multiGesture.mode !== "reorder") return;
    const cards = [...UI.hand0.querySelectorAll("[data-card-id]")].filter(element => element.dataset.cardId !== multiGesture.cardId);
    const sorted = cards.map(element => ({ element, rect: element.getBoundingClientRect() })).sort((a, b) => a.rect.left - b.rect.left);
    const index = sorted.filter(item => clientX > item.rect.left + item.rect.width / 2).length;
    if (!force && index === multiGesture.insertIndex && multiGesture.slot?.isConnected) return;
    const before = new Map(cards.map(element => [element.dataset.cardId, element.getBoundingClientRect()]));
    multiGesture.insertIndex = index;
    UI.hand0.insertBefore(multiGesture.slot, sorted[index]?.element || null);
    requestAnimationFrame(() => {
      cards.forEach(element => {
        const oldRect = before.get(element.dataset.cardId);
        if (!oldRect) return;
        const next = element.getBoundingClientRect();
        const moveX = oldRect.left - next.left;
        const moveY = oldRect.top - next.top;
        if (Math.abs(moveX) > 1 || Math.abs(moveY) > 1) {
          element.animate([{ translate: `${moveX}px ${moveY}px` }, { translate: "0 0" }], { duration: 170, easing: "cubic-bezier(.2,.8,.2,1)" });
        }
      });
    });
  }

  function autoScrollMultiHand(clientX) {
    const rect = UI.hand0.getBoundingClientRect();
    const edge = 46;
    if (clientX < rect.left + edge) UI.hand0.scrollLeft -= 10;
    if (clientX > rect.right - edge) UI.hand0.scrollLeft += 10;
  }

  async function endMultiGesture(event) {
    if (!multiGesture || event.pointerId !== multiGesture.pointerId) return;
    const gesture = multiGesture;
    if (!gesture.moved) {
      cleanupMultiGesture();
      if (gesture.playable) humanPlay(gesture.cardId);
      return;
    }
    if (gesture.mode === "play") {
      cleanupMultiGesture();
      navigator.vibrate?.(10);
      humanPlay(gesture.cardId);
      return;
    }
    if (gesture.mode === "invalid") {
      await animateMultiGhostBack(gesture);
      cleanupMultiGesture();
      toast(getRuleReading().text);
      return;
    }
    if (gesture.mode === "reorder") {
      const hand = state.players[0].hand;
      const from = hand.findIndex(card => card.id === gesture.cardId);
      const insert = Math.max(0, Math.min(hand.length - 1, gesture.insertIndex));
      cleanupMultiGesture();
      if (from >= 0) {
        const [card] = hand.splice(from, 1);
        hand.splice(Math.min(insert, hand.length), 0, card);
        navigator.vibrate?.(6);
        renderHands();
        queueMultiAutosave();
      }
      return;
    }
    await animateMultiGhostBack(gesture);
    cleanupMultiGesture();
  }

  async function cancelMultiGesture() {
    const gesture = multiGesture;
    if (gesture?.moved) await animateMultiGhostBack(gesture);
    cleanupMultiGesture();
  }

  async function animateMultiGhostBack(gesture) {
    if (!gesture?.ghost || !gesture.element?.isConnected) return;
    const ghostRect = gesture.ghost.getBoundingClientRect();
    const sourceRect = gesture.sourceRect || gesture.element.getBoundingClientRect();
    const dx = sourceRect.left + sourceRect.width / 2 - (ghostRect.left + ghostRect.width / 2);
    const dy = sourceRect.top + sourceRect.height / 2 - (ghostRect.top + ghostRect.height / 2);
    const animation = gesture.ghost.animate([
      { transform: "translate(-50%,-88%) rotate(-3deg) scale(1.06)", opacity: .98 },
      { transform: `translate(calc(-50% + ${dx}px),calc(-88% + ${dy}px)) rotate(0deg) scale(.96)`, opacity: .25 }
    ], { duration: 210, easing: "cubic-bezier(.22,.78,.18,1)", fill: "forwards" });
    try { await animation.finished; } catch (_) {}
  }

  function cleanupMultiGesture() {
    if (!multiGesture) return;
    multiGesture.element?.classList.remove("gesture-source");
    multiGesture.ghost?.remove();
    multiGesture.slot?.remove();
    document.removeEventListener("pointermove", moveMultiGesture);
    document.removeEventListener("pointerup", endMultiGesture);
    document.removeEventListener("pointercancel", cancelMultiGesture);
    UI.multiTrickRing.classList.remove("play-drop-active", "play-drop-valid", "play-drop-invalid", "drag-active");
    multiGesture = null;
  }

  function renderTrick() {
    for (let i=0;i<4;i+=1) {
      const play=state.trick.find(item=>item.player===i);
      const slot=UI[`slot${i}`];
      if (!slot) continue;
      const key=play?.card.id||"empty";
      if (slot.dataset.key===key) continue;
      slot.dataset.key=key;
      slot.replaceChildren();
      if (play) slot.appendChild(createCard(play.card,false));
      else { const span=document.createElement("span"); span.textContent=i===0?"TÚ":`IA ${i}`; slot.appendChild(span); }
    }
  }

  function renderTrump() {
    if (!state.trumpSuit) {
      UI.multiTrump.dataset.key="pending-song";
      UI.multiTrump.innerHTML='<span class="trump-pending"><b>?</b><small>PRIMER CANTE</small></span>';
      UI.multiTrumpSuit.textContent="POR DECIDIR";
      return;
    }
    if (!state.trumpCard) {
      const key=`suit:${state.trumpSuit}`;
      if (UI.multiTrump.dataset.key!==key) {
        UI.multiTrump.dataset.key=key;
        UI.multiTrump.innerHTML=`<span class="trump-suit-seal"><b>${SUIT_LABELS[state.trumpSuit][0].toUpperCase()}</b><small>${SUIT_LABELS[state.trumpSuit]}</small></span>`;
      }
      UI.multiTrumpSuit.textContent=SUIT_LABELS[state.trumpSuit].toUpperCase();
      return;
    }
    if (UI.multiTrump.dataset.key!==state.trumpCard.id) {
      UI.multiTrump.dataset.key=state.trumpCard.id;
      UI.multiTrump.replaceChildren(createCard(state.trumpCard,false));
    }
    UI.multiTrumpSuit.textContent=SUIT_LABELS[state.trumpSuit].toUpperCase();
  }

  function renderTurns() {
    for (let i=0;i<mode.players;i+=1) UI[`seat${i}`].classList.toggle("active",state.phase==="playing"&&state.current===i);
  }

  function renderStatus() {
    UI.multiPhase.textContent=state.phase==="dealing"?"REPARTIENDO":state.phase==="playing"?"JUEGO OBLIGADO":"PARTIDA TERMINADA";
    if (state.phase==="dealing") UI.multiStatus.textContent=`Repartiendo ${state.players[0]?.hand.length||0}/${mode.handSize} cartas…`;
    else if (state.phase==="playing") UI.multiStatus.textContent=state.current===0?"Tu turno. Juega una carta legal.":`${state.players[state.current].name} está pensando…`;
    else UI.multiStatus.textContent="La partida ha terminado.";
    UI.trickCounter.textContent=`BAZA ${state.trickNumber}`;
    UI.currentLeader.textContent=state.players[state.leader]?.name.split(" ")[0].toUpperCase()||"TÚ";
    const reading=getRuleReading();
    UI.multiRuleTitle.textContent=reading.title;
    UI.multiRuleText.textContent=reading.text;
    UI.multiHint.textContent=state.current===0?reading.hint:"Espera al resto de la mesa.";
    UI.tricksPlayed.textContent=Math.max(0,state.trickNumber-1);
  }

  function getRuleReading() {
    if (!state.trick.length) return {title:"Abres la baza",text:"Puedes salir con cualquier carta.",hint:"Pulsa una carta o arrástrala al centro."};
    const lead=state.trick[0].card;
    const winner=currentWinningPlay()?.card;
    const hand=state.players[0].hand;
    const leadCards=hand.filter(c=>c.suit===lead.suit);
    if (state.current!==0) return {title:`Palo de salida: ${SUIT_LABELS[lead.suit]}`,text:`La baza la gana provisionalmente ${cardName(winner)}.`,hint:"Espera tu turno."};
    if (leadCards.length) {
      if (winner.suit===state.trumpSuit&&lead.suit!==state.trumpSuit) return {title:"La baza ya está fallada",text:`Debes asistir a ${SUIT_LABELS[lead.suit]}, pero no tienes que montar la carta inicial.`,hint:`Juega cualquier ${SUIT_LABELS[lead.suit]}.`};
      const higher=leadCards.filter(c=>c.strength>winner.strength);
      return higher.length?{title:"Debes montar",text:`Tienes ${SUIT_LABELS[lead.suit]} capaces de superar la carta ganadora.`,hint:"Las cartas legales están iluminadas."}:{title:"Debes asistir",text:`Tienes ${SUIT_LABELS[lead.suit]}, pero no puedes superar.`,hint:`Juega cualquier ${SUIT_LABELS[lead.suit]}.`};
    }
    if (winner.suit===state.trumpSuit) {
      const higher=hand.filter(c=>c.suit===state.trumpSuit&&c.strength>winner.strength);
      return higher.length?{title:"Debes pisar",text:"No tienes el palo de salida y puedes superar el triunfo ganador.",hint:"Juega uno de los triunfos superiores."}:{title:"Descarte libre",text:"No puedes asistir ni superar el triunfo ganador.",hint:"Puedes jugar cualquier carta."};
    }
    if (!state.trumpSuit) return {title:"Aún no existe triunfo",text:`No tienes ${SUIT_LABELS[lead.suit]} y el pinte todavía no se ha fijado.`,hint:"Puedes descartarte con cualquier carta."};
    const trumps=hand.filter(c=>c.suit===state.trumpSuit);
    return trumps.length?{title:"Debes fallar",text:`No tienes ${SUIT_LABELS[lead.suit]}; debes jugar triunfo.`,hint:"Juega una carta del palo de triunfo."}:{title:"Descarte libre",text:"No tienes el palo de salida ni triunfo.",hint:"Puedes jugar cualquier carta."};
  }

  function renderScores() {
    if (!state.players.length) return;
    if (mode.teams) {
      const teamA=totalPlayer(0)+totalPlayer(2);
      const teamB=totalPlayer(1)+totalPlayer(3);
      UI.multiScoreList.innerHTML=`<div class="score-entry player"><span>TÚ + DOÑA VIRTUD</span><strong>${teamA}</strong></div><div class="score-entry"><span>DON CÁLCULO + EL NOTARIO</span><strong>${teamB}</strong></div>`;
    } else {
      UI.multiScoreList.innerHTML=state.players.map((p,i)=>`<div class="score-entry ${i===0?"player":""}"><span>${p.name.toUpperCase()}</span><strong>${totalPlayer(i)}</strong></div>`).join("");
    }
  }

  function renderLog() {
    UI.multiLog.innerHTML=state.log.slice(-10).reverse().map(line=>`<div class="log-line">${line}</div>`).join("");
  }

  function renderDeclarations() {
    UI.multiCanteActions.querySelectorAll("button").forEach(button=>button.remove());
    if (!state.pendingDeclaration||state.pendingDeclaration.player!==0) return;
    const hint=UI.multiHint;
    hint.textContent="Has ganado la baza. Puedes declarar un cante.";
    state.pendingDeclaration.options.forEach(option=>{
      const button=document.createElement("button");
      button.className="cante-action";
      button.textContent=option.type==="tute"?option.label:option.setsTrump?`Cantar 40 y fijar ${SUIT_LABELS[option.suit]} como triunfo`:`Cantar ${option.points} en ${SUIT_LABELS[option.suit]}`;
      button.addEventListener("click",()=>resolveDeclaration(option));
      UI.multiCanteActions.insertBefore(button,hint);
    });
    const pass=document.createElement("button");
    pass.className="cante-action";
    pass.textContent="No cantar";
    pass.addEventListener("click",()=>resolveDeclaration(null));
    UI.multiCanteActions.insertBefore(pass,hint);
  }

  function addLog(html) { state.log.push(html); if (state.log.length>80) state.log.shift(); renderLog(); }
  function cardName(card) { return `${RANK_MAP[card.rank].label} de ${SUIT_LABELS[card.suit]}`; }

  function currentWinningPlay() {
    if (!state.trick.length) return null;
    const leadSuit=state.trick[0].card.suit;
    return state.trick.slice(1).reduce((winner,play)=>beats(play.card,winner.card,leadSuit,state.trumpSuit)?play:winner,state.trick[0]);
  }

  function beats(challenger,current,leadSuit,trumpSuit) {
    if (challenger.suit===current.suit) return challenger.strength>current.strength;
    if (challenger.suit===trumpSuit&&current.suit!==trumpSuit) return true;
    if (current.suit===trumpSuit) return false;
    return challenger.suit===leadSuit&&current.suit!==leadSuit;
  }

  function getLegalCards(playerId) {
    const hand=state.players[playerId].hand;
    if (!state.trick.length) return [...hand];
    const lead=state.trick[0].card;
    const winner=currentWinningPlay().card;
    const leadCards=hand.filter(card=>card.suit===lead.suit);
    if (leadCards.length) {
      const alreadyTrumped=winner.suit===state.trumpSuit&&lead.suit!==state.trumpSuit;
      if (!alreadyTrumped) {
        const higher=leadCards.filter(card=>card.strength>winner.strength);
        if (higher.length) return higher;
      }
      return leadCards;
    }
    const trumps=hand.filter(card=>card.suit===state.trumpSuit);
    if (winner.suit!==state.trumpSuit) return trumps.length?trumps:[...hand];
    const higherTrumps=trumps.filter(card=>card.strength>winner.strength);
    if (higherTrumps.length) return higherTrumps;
    return [...hand];
  }

  function humanPlay(cardId) {
    if (state.phase!=="playing"||state.current!==0||state.busy||state.pendingDeclaration) return;
    const legal=getLegalCards(0);
    if (!legal.some(card=>card.id===cardId)) {
      const reading=getRuleReading();
      toast(reading.text);
      return;
    }
    playCard(0,cardId);
  }

  async function playCard(playerId,cardId) {
    if (state.busy||state.current!==playerId) return;
    const player=state.players[playerId];
    const index=player.hand.findIndex(card=>card.id===cardId);
    if (index<0) return;
    const legal=getLegalCards(playerId);
    if (!legal.some(card=>card.id===cardId)) return;
    state.busy=true;
    const source=playerId===0?UI.hand0.querySelector(`[data-card-id="${cardId}"]`):UI[`hand${playerId}`].querySelector(".multi-card");
    const target=UI[`slot${playerId}`];
    const card=player.hand[index];
    if (source) await animateFlight(source,target,card,playerId!==0);
    player.hand.splice(index,1);
    state.trick.push({player:playerId,card});
    addLog(`<strong>${player.name}</strong> juega ${cardName(card)}.`);
    state.busy=false;
    render();
    if (state.trick.length===mode.players) {
      state.current=-1;
      renderTurns();
      await wait(620);
      resolveTrick();
    } else {
      state.current=(playerId+1)%mode.players;
      render();
      if (state.current!==0) scheduleAi();
    }
  }

  async function animateFlight(source,target,card,backFirst) {
    const sr=source.getBoundingClientRect(),tr=target.getBoundingClientRect();
    const clone=createCard(card,backFirst);
    clone.classList.add("flight-multi");
    clone.style.left=`${sr.left}px`;clone.style.top=`${sr.top}px`;clone.style.width=`${sr.width}px`;clone.style.height=`${sr.height}px`;
    document.body.appendChild(clone);
    const dx=tr.left+tr.width/2-(sr.left+sr.width/2),dy=tr.top+tr.height/2-(sr.top+sr.height/2);
    if (backFirst) setTimeout(()=>{clone.querySelector("img").src=`assets/cards/${card.suit}-${card.rank}.webp`;},220);
    const anim=clone.animate([{transform:"translate3d(0,0,0) rotate(0deg) scale(1)"},{transform:`translate3d(${dx*.55}px,${dy*.35-40}px,0) rotate(${backFirst?12:-12}deg) scale(1.05)`,offset:.58},{transform:`translate3d(${dx}px,${dy}px,0) rotate(${backFirst?4:-4}deg) scale(.86)`}],{duration:480,easing:"cubic-bezier(.18,.82,.18,1)",fill:"forwards"});
    try{await anim.finished;}catch(_){} clone.remove();
  }

  function scheduleAi() {
    if (state.phase!=="playing"||state.current===0||state.current<0||state.busy) return;
    const delay=state.difficulty==="hard"?720:state.difficulty==="easy"?460:590;
    setTimeout(()=>{
      if (state.phase!=="playing"||state.current===0||state.busy) return;
      const playerId=state.current;
      const card=chooseAiCard(playerId);
      playCard(playerId,card.id);
    },delay);
  }

  function chooseAiCard(playerId) {
    const legal=getLegalCards(playerId);
    if (legal.length===1) return legal[0];
    const winner=currentWinningPlay();
    const leadSuit=state.trick[0]?.card.suit;
    const trickPoints=state.trick.reduce((sum,play)=>sum+play.card.points,0);
    const scored=legal.map(card=>{
      let score=0;
      if (winner) {
        const wins=beats(card,winner.card,leadSuit,state.trumpSuit);
        score+=wins?(trickPoints*5+26):0;
        score-=card.points*(wins?1.1:4);
        score-=card.strength*(wins?.25:.65);
        if (card.suit===state.trumpSuit) score-=wins?5:14;
        if (!wins&&card.points===0) score+=12;
        if (mode.teams) {
          const winnerIsPartner=(winner.player%2)===(playerId%2);
          if (winnerIsPartner&&wins) score-=32;
          if (winnerIsPartner&&!wins&&card.points>0) score+=7;
        }
      } else {
        score-=card.points*2.3+card.strength*.65;
        if (card.suit===state.trumpSuit) score-=10;
        if (card.points===0) score+=8;
      }
      if (state.difficulty==="easy") score+=Math.random()*28;
      else score+=Math.random()*2;
      return {card,score};
    });
    scored.sort((a,b)=>b.score-a.score);
    return scored[0].card;
  }

  async function resolveTrick() {
    const winnerPlay=currentWinningPlay();
    const winner=winnerPlay.player;
    const points=state.trick.reduce((sum,play)=>sum+play.card.points,0);
    const cards=state.trick.map(play=>play.card);
    state.players[winner].cardPoints+=points;
    state.players[winner].tricks+=1;
    state.players[winner].captured.push(...cards);
    addLog(`<strong>${state.players[winner].name}</strong> gana la baza${points?` y suma ${points}`:""}.`);
    await collectTrick(winner);
    state.trick=[];
    state.leader=winner;
    state.current=winner;
    render();
    const declarations=getDeclarations(winner);
    if (declarations.length) {
      state.pendingDeclaration={player:winner,options:declarations};
      render();
      if (winner!==0) setTimeout(()=>void resolveDeclaration(declarations[0]),500);
      return;
    }
    continueAfterTrick();
  }

  async function collectTrick(winner) {
    const target=UI[`seat${winner}`].querySelector(".seat-badge").getBoundingClientRect();
    const clones=[];
    state.trick.forEach(play=>{
      const el=UI[`slot${play.player}`].querySelector(".multi-card");
      if (!el) return;
      const r=el.getBoundingClientRect();
      const clone=el.cloneNode(true);clone.classList.add("capture-clone");
      Object.assign(clone.style,{left:`${r.left}px`,top:`${r.top}px`,width:`${r.width}px`,height:`${r.height}px`});document.body.appendChild(clone);
      const dx=target.left+target.width/2-(r.left+r.width/2),dy=target.top+target.height/2-(r.top+r.height/2);
      clones.push(clone.animate([{transform:"translate3d(0,0,0) scale(1)",opacity:1},{transform:`translate3d(${dx}px,${dy}px,0) rotate(20deg) scale(.2)`,opacity:.1}],{duration:460,easing:"cubic-bezier(.2,.8,.2,1)",fill:"forwards"}).finished.catch(()=>{}).then(()=>clone.remove()));
    });
    await Promise.all(clones);
  }

  function getDeclarations(playerId) {
    const player=state.players[playerId];
    const kings=player.hand.filter(c=>c.rank===12);
    const knights=player.hand.filter(c=>c.rank===11);
    if (kings.length===4) return [{type:"tute",label:"Tute de reyes"}];
    if (knights.length===4) return [{type:"tute",label:"Tute de caballos"}];
    const options=[];
    SUITS.forEach(suit=>{
      if (player.sung.has(suit)) return;
      if (player.hand.some(c=>c.suit===suit&&c.rank===12)&&player.hand.some(c=>c.suit===suit&&c.rank===11)) {
        const setsTrump=mode.players===3&&!state.trumpSuit;
        options.push({type:"song",suit,points:setsTrump?40:(suit===state.trumpSuit?40:20),setsTrump});
      }
    });
    options.sort((a,b)=>(b.points||999)-(a.points||999));
    return options;
  }

  async function resolveDeclaration(option) {
    const pending=state.pendingDeclaration;
    if (!pending) return;
    const player=state.players[pending.player];
    state.pendingDeclaration=null;
    if (!option) { addLog(`${player.name} renuncia al cante.`); continueAfterTrick(); return; }
    if (option.type==="tute") {
      addLog(`<strong>${player.name} declara ${option.label}.</strong>`);
      finishGame(pending.player,option.label);
      return;
    }
    if (option.setsTrump&&!state.trumpSuit) {
      state.trumpSuit=option.suit;
      state.trumpCard=null;
      addLog(`<strong>${player.name} canta 40 y fija ${SUIT_LABELS[option.suit]} como triunfo.</strong>`);
    } else {
      addLog(`<strong>${player.name} canta ${option.points} en ${SUIT_LABELS[option.suit]}.</strong>`);
    }
    player.songPoints+=option.points;
    player.sung.add(option.suit);
    render();
    if (window.TuteCanteFX) await window.TuteCanteFX.play({ points: option.points, suit: option.suit, actorName: player.name, setsTrump: Boolean(option.setsTrump) });
    continueAfterTrick();
  }

  function continueAfterTrick() {
    if (state.players.every(player=>player.hand.length===0)) {
      state.players[state.leader].cardPoints+=10;
      addLog(`<strong>Diez de últimas</strong> para ${state.players[state.leader].name}.`);
      finishGame();
      return;
    }
    state.trickNumber+=1;
    state.current=state.leader;
    render();
    if (state.current!==0) scheduleAi();
  }

  function totalPlayer(id) { const player=state.players[id]; return (player?.cardPoints||0)+(player?.songPoints||0); }

  function finishGame(specialWinner=null,reason="puntos") {
    state.phase="finished";
    window.TuteDB?.remove(`multi-${mode.id}`).catch(() => {});
    multiSaveRecord = null;
    window.TutePWA?.setPlaying(false);
    state.current=-1;
    render();
    let winnerText="",humanWon=false,ranking=[];
    if (specialWinner!==null) {
      if (mode.teams) {
        const team=specialWinner%2;
        humanWon=team===0;
        winnerText=team===0?"Tu pareja gana por tute":"La pareja rival gana por tute";
      } else {
        humanWon=specialWinner===0;
        winnerText=`${state.players[specialWinner].name} gana por ${reason.toLowerCase()}`;
      }
    } else if (mode.teams) {
      const a=totalPlayer(0)+totalPlayer(2),b=totalPlayer(1)+totalPlayer(3);
      humanWon=a>=b;winnerText=humanWon?"Tu pareja conquista la mesa":"La pareja rival gana la partida";
      ranking=[{name:"TÚ + DOÑA VIRTUD",score:a},{name:"DON CÁLCULO + EL NOTARIO",score:b}].sort((x,y)=>y.score-x.score);
    } else {
      ranking=state.players.map((p,i)=>({name:p.name,score:totalPlayer(i),id:i})).sort((a,b)=>b.score-a.score);
      humanWon=ranking[0].id===0;winnerText=humanWon?"Has conquistado la mesa":`${ranking[0].name} gana la partida`;
    }
    if (!ranking.length) ranking=mode.teams?[{name:"TU PAREJA",score:totalPlayer(0)+totalPlayer(2)},{name:"RIVALES",score:totalPlayer(1)+totalPlayer(3)}]:state.players.map((p,i)=>({name:p.name,score:totalPlayer(i)})).sort((a,b)=>b.score-a.score);
    UI.multiResultSeal.textContent=humanWon?"V":"D";
    UI.multiResultTitle.textContent=winnerText;
    UI.multiResultText.textContent=`${mode.title} completado en ${state.trickNumber} bazas. La IA solo ha utilizado sus cartas y la información visible.`;
    UI.multiFinalRanking.innerHTML=ranking.map((entry,i)=>`<div class="final-row"><span>${i+1}. ${entry.name}</span><strong>${entry.score}</strong></div>`).join("");
    updateStats(humanWon);
    setTimeout(()=>UI.multiResult.showModal(),450);
  }

  function normalizeMultiState(snapshot) {
    snapshot.players ||= [];
    snapshot.players.forEach(player => {
      if (!(player.sung instanceof Set)) player.sung = new Set(player.sung || []);
    });
    snapshot.busy = false;
    return snapshot;
  }

  function queueMultiAutosave() {
    if (!window.TuteDB || !state.players.length || ["setup", "dealing", "finished"].includes(state.phase) || state.busy) return;
    clearTimeout(multiAutosaveTimer);
    multiAutosaveTimer = setTimeout(async () => {
      try {
        const snapshot = normalizeMultiState(structuredClone(state));
        multiSaveRecord = await window.TuteDB.save(`multi-${mode.id}`, snapshot, {
          title: mode.title,
          detail: `Baza ${state.trickNumber} · ${state.players[0]?.hand.length || 0} cartas en tu mano`,
          href: `multi.html?mode=${mode.id}`
        });
        refreshMultiSaveCard();
      } catch (_) {}
    }, 600);
  }

  async function refreshMultiSaveCard() {
    if (!UI.multiResumeCard || !window.TuteDB) return;
    try {
      multiSaveRecord = await window.TuteDB.load(`multi-${mode.id}`);
      const valid = Boolean(multiSaveRecord?.value?.players?.length && multiSaveRecord.value.phase !== "finished");
      UI.multiResumeCard.classList.toggle("hidden", !valid);
      if (!valid) return;
      UI.multiResumeTitle.textContent = multiSaveRecord.meta?.title || mode.title;
      const age = Math.max(0, Math.round((Date.now() - multiSaveRecord.updatedAt) / 60000));
      UI.multiResumeMeta.textContent = `${multiSaveRecord.meta?.detail || "Partida guardada"} · ${age < 1 ? "ahora" : `hace ${age} min`}`;
    } catch (_) { UI.multiResumeCard.classList.add("hidden"); }
  }

  async function discardMultiSave() {
    await window.TuteDB?.remove(`multi-${mode.id}`).catch(() => {});
    multiSaveRecord = null;
    UI.multiResumeCard?.classList.add("hidden");
    window.TutePWA?.toast("Partida guardada descartada.");
  }

  async function resumeMultiGame() {
    try {
      const record = multiSaveRecord || await window.TuteDB.load(`multi-${mode.id}`);
      if (!record?.value?.players?.length) throw new Error("invalid-save");
      Object.assign(state, normalizeMultiState(record.value));
      UI.multiSetup.close();
      clearTable();
      render();
      startMusic();
      window.TutePWA?.setPlaying(true);
      if (state.phase === "playing" && state.current !== 0) setTimeout(scheduleAi, 450);
      window.TutePWA?.toast("Partida recuperada.");
    } catch (_) {
      discardMultiSave();
      window.TutePWA?.toast("La partida guardada no se pudo recuperar.");
    }
  }

  function updateStats(humanWon) {
    try {
      const stats=JSON.parse(localStorage.getItem("tuteIaStats")||"{}");
      stats.matchesPlayed=(stats.matchesPlayed||0)+1;
      if (humanWon) stats.matchesWon=(stats.matchesWon||0)+1;
      stats.variantPlays||={};stats.variantPlays[mode.id]=(stats.variantPlays[mode.id]||0)+1;
      localStorage.setItem("tuteIaStats",JSON.stringify(stats));
      window.SalaCeroClub?.recordMatch({ game:"tute", mode:"multi", won:Boolean(humanWon), variant:mode.id, score:totalPlayer(0) });
    } catch(_) {}
  }

  function toast(text) {
    const el=document.createElement("div");el.textContent=text;Object.assign(el.style,{position:"fixed",left:"50%",bottom:"24px",transform:"translateX(-50%)",zIndex:"1200",padding:"12px 16px",borderRadius:"12px",background:"#f0cf83",color:"#142018",fontSize:"10px",fontWeight:"900",boxShadow:"0 15px 40px rgba(0,0,0,.4)"});document.body.appendChild(el);setTimeout(()=>el.remove(),2200);
  }
})();
