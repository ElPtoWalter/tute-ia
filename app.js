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

  const VARIANTS = {
    house: {
      id: "house",
      code: "REGLAS DE CASA",
      name: "Arrastre total",
      shortName: "Arrastre total",
      description: "Tu reglamento: obligaciones completas desde la primera baza. Cantes durante la baceta y una última oportunidad en la primera baza ganada de la fase final.",
      tutorialDescription: "Aprende el reglamento que utilizas habitualmente, con obligaciones completas incluso mientras queda baceta.",
      featured: true,
      rules: {
        stockDuty: "full",
        afterStockDuty: "full",
        mustBeat: true,
        mustTrump: true,
        mustOvertrump: true,
        freeDiscardIfCannotOvertrump: true,
        songs: true,
        songsStockOnly: false,
        songsAfterStockOnly: false,
        songsPostStockFirstWinOnly: true,
        exchange: true,
        exchangeFromStart: true,
        allowTute: true,
        capote: false,
        matchMode: "rounds",
        targetPoints: null
      }
    },
    habanero: {
      id: "habanero",
      code: "BACETA LIBRE",
      name: "Tute habanero",
      shortName: "Habanero",
      description: "Juego libre mientras queda baceta. Al agotarse el robo comienzan las obligaciones completas. Incluye capote opcional.",
      tutorialDescription: "Distingue con claridad la fase libre de la fase obligada y practica el capote final.",
      rules: {
        stockDuty: "free",
        afterStockDuty: "full",
        mustBeat: true,
        mustTrump: true,
        mustOvertrump: true,
        freeDiscardIfCannotOvertrump: false,
        songs: true,
        songsStockOnly: false,
        exchange: true,
        allowTute: true,
        capote: true,
        matchMode: "rounds",
        targetPoints: null
      }
    },
    fournier: {
      id: "fournier",
      code: "CLÁSICO FOURNIER",
      name: "Fournier a dos",
      shortName: "Fournier",
      description: "Con baceta solo se obliga cuando el palo de salida es triunfo. Sin baceta se asiste, se monta y se falla de forma completa.",
      tutorialDescription: "Aprende la obligación especial de asistir cuando se abre de triunfo durante la baceta.",
      rules: {
        stockDuty: "trumpOnly",
        afterStockDuty: "full",
        mustBeat: true,
        mustTrump: true,
        mustOvertrump: true,
        freeDiscardIfCannotOvertrump: false,
        songs: true,
        songsStockOnly: false,
        exchange: true,
        allowTute: true,
        capote: false,
        matchMode: "rounds",
        targetPoints: null
      }
    },
    americano: {
      id: "americano",
      code: "OBJETIVO 121",
      name: "Tute americano",
      shortName: "Americano",
      description: "Asistencia a triunfo durante la baceta, obligaciones completas al final, sin victoria automática por tute y marcador acumulado a 121.",
      tutorialDescription: "Practica las obligaciones Fournier y comprende el marcador acumulativo a 121 tantos.",
      rules: {
        stockDuty: "trumpOnly",
        afterStockDuty: "full",
        mustBeat: true,
        mustTrump: true,
        mustOvertrump: true,
        freeDiscardIfCannotOvertrump: false,
        songs: true,
        songsStockOnly: false,
        exchange: true,
        allowTute: false,
        capote: false,
        matchMode: "points",
        targetPoints: 121
      }
    },
    arrastrado3: {
      id: "arrastrado3",
      code: "3 JUGADORES",
      name: "Tute arrastrado",
      shortName: "Arrastrado",
      description: "Tú contra dos IA. Trece cartas por jugador, una carta apartada y sin triunfo inicial: el primer cante fija el pinte.",
      tutorialDescription: "Mesa guiada para aprender turnos de tres, asistencia, fallo, pisado y cómo el primer cante decide el triunfo.",
      engine: "multi",
      href: "multi.html?mode=arrastrado3",
      rules: { stockDuty: "full", afterStockDuty: "full", mustBeat: true, mustTrump: true, mustOvertrump: true, freeDiscardIfCannotOvertrump: true, songs: true, songsStockOnly: false, exchange: false, allowTute: true, capote: false, matchMode: "rounds", targetPoints: null }
    },
    pairs4: {
      id: "pairs4",
      code: "4 JUGADORES · PAREJAS",
      name: "Clásico por parejas",
      shortName: "Parejas",
      description: "Tú y tu compañero IA contra dos rivales. Diez cartas cada uno, juego obligado y marcador por equipos.",
      tutorialDescription: "Aprende a jugar por parejas, proteger al compañero y sumar los cantes del equipo.",
      engine: "multi",
      href: "multi.html?mode=pairs4",
      rules: { stockDuty: "full", afterStockDuty: "full", mustBeat: true, mustTrump: true, mustOvertrump: true, freeDiscardIfCannotOvertrump: true, songs: true, songsStockOnly: false, exchange: false, allowTute: true, capote: false, matchMode: "rounds", targetPoints: null }
    },
    individual4: {
      id: "individual4",
      code: "4 JUGADORES · INDIVIDUAL",
      name: "Tute individual a cuatro",
      shortName: "Individual 4",
      description: "Cuatro jugadores y puntuación individual. Cada decisión afecta a tres rivales diferentes.",
      tutorialDescription: "Practica la lectura de una baza con cuatro cartas y las prioridades cuando ya ha aparecido triunfo.",
      engine: "multi",
      href: "multi.html?mode=individual4",
      rules: { stockDuty: "full", afterStockDuty: "full", mustBeat: true, mustTrump: true, mustOvertrump: true, freeDiscardIfCannotOvertrump: true, songs: true, songsStockOnly: false, exchange: false, allowTute: true, capote: false, matchMode: "rounds", targetPoints: null }
    },
    custom: {
      id: "custom",
      code: "MESA A MEDIDA",
      name: "Mi mesa",
      shortName: "Mi mesa",
      description: "Reglamento creado por ti desde el configurador avanzado.",
      tutorialDescription: "Resumen práctico de las obligaciones elegidas en tu reglamento.",
      rules: null
    }
  };

  const DEFAULT_CUSTOM_RULES = {
    stockDuty: "full",
    afterStockDuty: "full",
    mustBeat: true,
    mustTrump: true,
    mustOvertrump: true,
    freeDiscardIfCannotOvertrump: true,
    songs: true,
    songsStockOnly: false,
    songsAfterStockOnly: false,
    songsPostStockFirstWinOnly: false,
    exchange: true,
    exchangeFromStart: false,
    allowTute: true,
    capote: false,
    matchMode: "rounds",
    targetPoints: null
  };

  const UI = {};
  let audioContext = null;
  let soundEnabled = true;
  let timers = [];
  let handGesture = null;
  let customRules = { ...DEFAULT_CUSTOM_RULES };
  let musicEnabled = false;
  let selectedVariantId = "house";
  let soloAutosaveTimer = null;
  let soloSaveRecord = null;
  let homeSaveRecord = null;

  const state = {
    mode: "home",
    settings: {
      difficulty: "normal",
      targetRounds: 3,
      allowTute: true,
      variantId: "house",
      rules: { ...VARIANTS.house.rules }
    },
    match: {
      playerRounds: 0,
      aiRounds: 0,
      playerPoints: 0,
      aiPoints: 0,
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

  function careerAiConfig() {
    return window.SalaCeroCareer?.getAiConfig?.("tute") || null;
  }

  function aiDisplayName() {
    return careerAiConfig()?.name || "Doña Virtud";
  }

  function aiPersonality() {
    return careerAiConfig()?.personality || "calculating";
  }

  const BASE_TUTORIAL_STEPS = [
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
      text: "Después de ganar una baza puedes cantar si conservas rey y caballo del mismo palo. En Arrastre total puedes hacerlo durante toda la baceta; al agotarse, tu primera baza ganada es la última oportunidad. En triunfo valen 40 puntos; en otro palo, 20.",
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

  let TUTORIAL_STEPS = BASE_TUTORIAL_STEPS.map(step => ({ ...step }));


  function cloneRules(rules) {
    return { ...(rules || DEFAULT_CUSTOM_RULES) };
  }

  function getVariant(id = state.settings.variantId) {
    if (id === "custom") return { ...VARIANTS.custom, rules: cloneRules(customRules) };
    return VARIANTS[id] || VARIANTS.house;
  }

  function loadPreferences() {
    try {
      const savedVariant = localStorage.getItem("tuteIaVariant");
      if (savedVariant && VARIANTS[savedVariant]) selectedVariantId = savedVariant;
      const savedRules = JSON.parse(localStorage.getItem("tuteIaCustomRules") || "null");
      if (savedRules) customRules = { ...DEFAULT_CUSTOM_RULES, ...savedRules };
      const savedVolume = Number(localStorage.getItem("tuteIaMusicVolume"));
      if (Number.isFinite(savedVolume) && UI.musicVolume) UI.musicVolume.value = String(Math.round(savedVolume * 100));
      musicEnabled = localStorage.getItem("tuteIaMusicEnabled") !== "false";
    } catch (_) {}
    const volume = Number(UI.musicVolume?.value || 28) / 100;
    if (UI.backgroundMusic) UI.backgroundMusic.volume = Math.max(0, Math.min(1, volume));
  }

  function saveSelectedVariant(id) {
    selectedVariantId = id;
    try { localStorage.setItem("tuteIaVariant", id); } catch (_) {}
  }

  function rulePillsFor(rules) {
    const stockLabel = rules.stockDuty === "full" ? "Obligaciones desde el inicio"
      : rules.stockDuty === "trumpOnly" ? "Asistir a triunfo con baceta"
      : "Baceta libre";
    const pills = [stockLabel];
    if (rules.mustBeat) pills.push("Montar");
    if (rules.mustTrump) pills.push("Fallar");
    if (rules.mustOvertrump) pills.push("Pisar");
    if (rules.songs) pills.push(
      rules.songsPostStockFirstWinOnly
        ? "Cantes libres + última oportunidad"
        : rules.songsAfterStockOnly
          ? "Cantes al agotarse la baceta"
          : "Cantes 20/40"
    );
    if (rules.capote) pills.push("Capote");
    if (rules.matchMode === "points") pills.push(`A ${rules.targetPoints} tantos`);
    return pills;
  }

  function variantCardMarkup(variant, tutorial = false) {
    const rules = variant.rules || customRules;
    const pills = rulePillsFor(rules).slice(0, 6).map(label => `<span>${label}</span>`).join("");
    return `<button class="variant-option${variant.featured ? " featured" : ""}" type="button" data-variant-id="${variant.id}">
      <span class="variant-top"><span class="variant-code">${variant.code}</span><span class="variant-status">${tutorial ? "TUTORIAL" : "JUGABLE"}</span></span>
      <h3>${variant.name}</h3>
      <p>${tutorial ? variant.tutorialDescription : variant.description}</p>
      <span class="variant-rule-pills">${pills}</span>
    </button>`;
  }

  function buildVariantSelectors() {
    const variants = [getVariant("house"), getVariant("habanero"), getVariant("fournier"), getVariant("americano"), getVariant("arrastrado3"), getVariant("pairs4"), getVariant("individual4"), getVariant("custom")];
    UI.variantGrid.innerHTML = variants.map(variant => variantCardMarkup(variant, false)).join("");
    UI.tutorialVariantGrid.innerHTML = variants.map(variant => variantCardMarkup(variant, true)).join("");
    UI.variantGrid.querySelectorAll("[data-variant-id]").forEach(button => {
      button.addEventListener("click", () => {
        const id = button.dataset.variantId;
        safeCloseDialog(UI.variantModal);
        const variant = getVariant(id);
        if (variant.engine === "multi") {
          saveSelectedVariant(id);
          window.location.href = variant.href;
        } else if (id === "custom") openCustomRules();
        else openSetupForVariant(id);
      });
    });
    UI.tutorialVariantGrid.querySelectorAll("[data-variant-id]").forEach(button => {
      button.addEventListener("click", () => {
        const id = button.dataset.variantId;
        safeCloseDialog(UI.tutorialSelectModal);
        const variant = getVariant(id);
        if (variant.engine === "multi") {
          saveSelectedVariant(id);
          window.location.href = `${variant.href}&tutorial=1`;
        } else if (id === "custom") {
          saveSelectedVariant("custom");
          startTutorial("custom");
        } else startTutorial(id);
      });
    });
  }

  function openVariantSelector() {
    clearTimers();
    cleanupHandGesture();
    setMobileInfoOpen(false);
    buildVariantSelectors();
    safeCloseDialog(UI.resultModal);
    if (!UI.variantModal.open) UI.variantModal.showModal();
    ensureMusicStarted();
  }

  function openTutorialSelector() {
    buildVariantSelectors();
    if (!UI.tutorialSelectModal.open) UI.tutorialSelectModal.showModal();
    ensureMusicStarted();
  }

  function openCustomRules() {
    UI.customStockDuty.value = customRules.stockDuty;
    UI.customMustBeat.checked = customRules.mustBeat;
    UI.customMustTrump.checked = customRules.mustTrump;
    UI.customMustOvertrump.checked = customRules.mustOvertrump;
    UI.customSongs.checked = customRules.songs;
    UI.customSongsStockOnly.checked = customRules.songsStockOnly;
    UI.customExchange.checked = customRules.exchange;
    UI.customTute.checked = customRules.allowTute;
    UI.customCapote.checked = customRules.capote;
    if (!UI.customRulesModal.open) UI.customRulesModal.showModal();
    ensureMusicStarted();
  }

  function saveCustomRulesFromForm() {
    customRules = {
      ...DEFAULT_CUSTOM_RULES,
      stockDuty: UI.customStockDuty.value,
      mustBeat: UI.customMustBeat.checked,
      mustTrump: UI.customMustTrump.checked,
      mustOvertrump: UI.customMustOvertrump.checked,
      freeDiscardIfCannotOvertrump: true,
      songs: UI.customSongs.checked,
      songsStockOnly: UI.customSongsStockOnly.checked,
      exchange: UI.customExchange.checked,
      allowTute: UI.customTute.checked,
      capote: UI.customCapote.checked
    };
    try { localStorage.setItem("tuteIaCustomRules", JSON.stringify(customRules)); } catch (_) {}
    buildVariantSelectors();
  }

  function openSetupForVariant(id) {
    const variant = getVariant(id);
    saveSelectedVariant(id);
    state.settings.variantId = id;
    state.settings.rules = cloneRules(variant.rules);
    state.settings.allowTute = state.settings.rules.allowTute;
    UI.tuteToggle.checked = state.settings.allowTute;
    UI.tuteToggle.disabled = !state.settings.rules.allowTute;
    UI.setupEyebrow.textContent = variant.code;
    UI.setupTitle.textContent = variant.name;
    UI.setupCopy.textContent = variant.description;
    UI.selectedVariantSummary.innerHTML = `<span class="summary-mark">${id === "house" ? "E" : id === "americano" ? "121" : "T"}</span><div><strong>${variant.name}</strong><p>${rulePillsFor(variant.rules).join(" · ")}</p></div>`;
    const pointMode = variant.rules.matchMode === "points";
    UI.targetSelect.innerHTML = pointMode
      ? `<option value="121" selected>Primero en 121 tantos</option><option value="201">Primero en 201 tantos</option>`
      : `<option value="1">Una mano</option><option value="3" selected>Al mejor de 5</option><option value="5">Al mejor de 9</option>`;
    state.tutorial.active = false;
    document.body.classList.remove("tutorial-mode");
    UI.tutorialCoach.classList.add("hidden");
    UI.aiName.textContent = aiDisplayName();
    UI.newMatchButton.textContent = variant.shortName;
    renderRulesModal();
    if (!UI.setupModal.open) UI.setupModal.showModal();
  }

  function buildRuleArticles(variant) {
    const rules = variant.rules;
    const stockText = rules.stockDuty === "full"
      ? "Desde la primera baza debes asistir. Si la baza sigue en el palo de salida, debes montar cuando puedas. Sin ese palo, fallas con triunfo."
      : rules.stockDuty === "trumpOnly"
        ? "Mientras quede baceta solo existe obligación cuando el palo de salida es triunfo. En los demás palos hay juego libre."
        : "Mientras quede baceta puedes jugar cualquier carta, sin obligación de asistir ni montar.";
    const afterText = "Cuando se agota la baceta se aplican las obligaciones completas: asistir, montar, fallar y pisar cuando corresponda.";
    const overtrumpText = rules.freeDiscardIfCannotOvertrump
      ? "Si no tienes el palo y ya se ha fallado, debes superar el triunfo ganador si puedes. Si no puedes pisarlo, el descarte es libre."
      : "Si no tienes el palo y ya se ha fallado, debes superar el triunfo ganador si puedes; en caso contrario debes jugar un triunfo disponible.";
    return [
      ["01", "Valor y fuerza", "As 11, tres 10, rey 4, caballo 3 y sota 2. La fuerza es as, tres, rey, caballo, sota, siete, seis, cinco, cuatro y dos."],
      ["02", "Durante la baceta", stockText, true],
      ["03", "Baza ya fallada", overtrumpText, variant.id === "house"],
      ["04", "Sin baceta", afterText],
      ["05", "Cantes", rules.songs ? `${rules.songsPostStockFirstWinOnly ? "Mientras queda baceta puedes cantar después de cualquier baza ganada. Al agotarse, cada jugador conserva una única oportunidad: su primera baza ganada de la fase final. " : rules.songsAfterStockOnly ? "No se puede cantar mientras queda baceta. Cuando se agota, el cante puede declararse después de ganar una baza. " : rules.songsStockOnly ? "Solo mientras queda baceta. " : ""}Rey y caballo de triunfo valen 40; los de otro palo, 20.` : "Los cantes están desactivados en este reglamento."],
      ["06", "Acciones especiales", `${rules.exchange ? `Cambio del pinte activado${rules.exchangeFromStart ? " desde el reparto inicial" : ""}. ` : "Sin cambio del pinte. "}${rules.allowTute ? "Tute de cuatro reyes o caballos permitido. " : "Sin victoria automática por tute. "}${rules.capote ? "Capote disponible al comenzar la fase final." : "Sin capote."}`]
    ];
  }

  function renderRulesModal() {
    const variant = getVariant();
    UI.rulesModalTitle.textContent = variant.name;
    UI.rulesModalCopy.textContent = variant.description;
    UI.dynamicRulesGrid.innerHTML = buildRuleArticles(variant).map(([number, title, text, emphasis]) => `<article class="${emphasis ? "rule-emphasis" : ""}"><span class="rule-number">${number}</span><h3>${title}</h3><p>${text}</p></article>`).join("");
  }

  function buildTutorialSteps(variantId) {
    const variant = getVariant(variantId);
    const steps = BASE_TUTORIAL_STEPS.map(step => ({ ...step }));
    steps[0].text = `Este recorrido utiliza la mesa real y el reglamento <strong>${variant.name}</strong>. Aprenderás jugando con manos preparadas.`;
    steps[4] = { ...steps[4], id: "stock-rule" };
    if (variant.rules.stockDuty === "free") {
      steps[4].title = "Con baceta, juego libre";
      steps[4].text = "Mientras queden cartas para robar no estás obligado a asistir. Para comprobarlo, abre la baza con el as de copas.";
      steps[4].tip = "Pulsa o arrastra el as de copas al tapete.";
      steps[4].allowedCardId = "copas-1";
    } else if (variant.rules.stockDuty === "trumpOnly") {
      steps[4].title = "Con baceta: el triunfo obliga";
      steps[4].text = "Durante la baceta hay juego libre salvo cuando la carta de salida es triunfo. La IA ha salido de bastos: debes asistir y montar con el tres.";
      steps[4].tip = "Juega el tres de bastos.";
      steps[4].allowedCardId = "bastos-3";
    } else {
      steps[4].title = "Arrastre desde la primera baza";
      steps[4].text = "Aunque quede baceta, debes asistir y superar cuando la baza continúa en el palo de salida. La IA juega siete de copas: debes montar con el tres.";
      steps[4].tip = "Juega el tres de copas; el cinco no supera al siete.";
      steps[4].allowedCardId = "copas-3";
    }
    steps[6].text = variant.rules.stockDuty === "full"
      ? "La obligación que ya has practicado continúa durante toda la mano. La IA sale con el siete de copas y debes montar con el tres."
      : "Al agotarse la baceta comienzan las obligaciones completas. La IA sale con el siete de copas y debes montar con el tres.";
    steps[9].title = `Ya sabes jugar a ${variant.name}`;
    steps[9].text = variant.rules.matchMode === "points"
      ? `En ${variant.name}, los tantos se acumulan entre manos hasta alcanzar el objetivo. La partida real utilizará 121 por defecto.`
      : `Ya conoces las obligaciones, el triunfo, el robo y los cantes de ${variant.name}.`;
    return steps;
  }

  function tutorialStorageKey(variantId) {
    return `tuteTutorialComplete:${variantId}`;
  }

  async function ensureMusicStarted() {
    if (!musicEnabled || !UI.backgroundMusic?.paused) return;
    try {
      await UI.backgroundMusic.play();
      window.TuteMusicContinuity?.savePosition();
      updateMusicUi();
    } catch (_) {}
  }

  async function toggleMusic() {
    if (!UI.backgroundMusic) return;
    musicEnabled = UI.backgroundMusic.paused;
    try { localStorage.setItem("tuteIaMusicEnabled", String(musicEnabled)); } catch (_) {}
    if (musicEnabled) {
      try { await UI.backgroundMusic.play(); } catch (_) { musicEnabled = false; }
    } else UI.backgroundMusic.pause();
    window.TuteMusicContinuity?.savePosition();
    updateMusicUi();
  }

  function updateMusicUi() {
    const playing = Boolean(UI.backgroundMusic && !UI.backgroundMusic.paused);
    document.body.classList.toggle("music-playing", playing);
    UI.musicIcon.textContent = playing ? "♫" : "♩";
    UI.musicStatus.textContent = playing ? "Reproduciendo · bucle offline" : "Música pausada";
    UI.homeMusicButton.textContent = playing ? "Pausar" : "Reproducir";
    document.querySelectorAll(".music-live-dot").forEach(dot => dot.classList.toggle("paused", !playing));
  }

  function renderHomeStats() {
    try {
      const stats = JSON.parse(localStorage.getItem("tuteIaStats") || "{}");
      const games = stats.matchesPlayed || 0;
      const wins = stats.matchesWon || 0;
      UI.statGames.textContent = games;
      UI.statWins.textContent = wins;
      UI.statWinRate.textContent = `${games ? Math.round(wins / games * 100) : 0} % de efectividad`;
      const counts = stats.variantPlays || {};
      const favoriteId = Object.keys(counts).sort((a, b) => (counts[b] || 0) - (counts[a] || 0))[0] || selectedVariantId;
      UI.statFavorite.textContent = getVariant(favoriteId).shortName;
    } catch (_) {}
  }

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheUI();
    loadPreferences();
    bindUI();
    buildVariantSelectors();
    renderEmptyState();
    updateTutorialCompletionBadge();
    renderHomeStats();
    updateMusicUi();
    window.TuteMusicContinuity?.sync();
    showHome();
    refreshSoloSaveCard();
    handleLaunchShortcut();
    applyCareerLaunch();
    window.addEventListener("resize", () => state.round && renderHands(), { passive: true });
  }

  function cacheUI() {
    [
      "aiName", "aiHand", "aiHandCount", "playerHand", "aiTrickSlot", "playerTrickSlot", "trickArea", "playDropIndicator",
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
      "homeScreen", "appShell", "classicModeButton", "tutorialModeButton", "customModeButton", "tutorialCompletionBadge",
      "tutorialCoach", "tutorialKicker", "tutorialProgress", "tutorialTitle", "tutorialText", "tutorialTip",
      "tutorialNextButton", "tutorialExitButton", "variantModal", "tutorialSelectModal", "customRulesModal",
      "variantGrid", "tutorialVariantGrid", "closeVariantButton", "closeTutorialSelectButton", "customRulesForm",
      "customStockDuty", "customMustBeat", "customMustTrump", "customMustOvertrump", "customSongs", "customSongsStockOnly",
      "customExchange", "customTute", "customCapote", "setupEyebrow", "setupTitle", "setupCopy", "selectedVariantSummary",
      "rulesModalTitle", "rulesModalCopy", "dynamicRulesGrid", "variantLiveBadge", "capoteButton",
      "backgroundMusic", "musicButton", "musicIcon", "musicPopover", "musicStatus", "musicVolume", "homeMusicButton",
      "statGames", "statWins", "statWinRate", "statFavorite", "closeSetupButton", "closeCustomRulesButton",
      "resumeGameCard", "resumeGameTitle", "resumeGameMeta", "resumeGameButton", "discardResumeButton", "openPwaPanelButton",
      "sidePanel", "mobileInfoButton", "mobileInfoCloseButton", "mobileInfoBackdrop", "mobileScoreMini"
    ].forEach(id => UI[id] = document.getElementById(id));
  }

  function bindUI() {
    document.querySelectorAll('input[name="difficulty"]').forEach(input => {
      input.addEventListener("change", () => {
        document.querySelectorAll(".choice-card").forEach(card => card.classList.remove("selected"));
        input.closest(".choice-card").classList.add("selected");
      });
    });

    UI.classicModeButton.addEventListener("click", openVariantSelector);
    UI.openPwaPanelButton?.addEventListener("click", () => window.TutePWA?.openPanel());
    UI.resumeGameButton?.addEventListener("click", resumeLatestSave);
    UI.discardResumeButton?.addEventListener("click", discardSoloSave);
    UI.tutorialModeButton.addEventListener("click", openTutorialSelector);
    UI.customModeButton.addEventListener("click", openCustomRules);
    UI.closeVariantButton.addEventListener("click", () => UI.variantModal.close());
    UI.closeTutorialSelectButton.addEventListener("click", () => UI.tutorialSelectModal.close());
    UI.closeSetupButton.addEventListener("click", () => UI.setupModal.close());
    UI.closeCustomRulesButton.addEventListener("click", () => UI.customRulesModal.close());
    UI.tutorialNextButton.addEventListener("click", handleTutorialNext);
    UI.tutorialExitButton.addEventListener("click", showHome);

    UI.customRulesForm.addEventListener("submit", event => {
      event.preventDefault();
      saveCustomRulesFromForm();
      saveSelectedVariant("custom");
      UI.customRulesModal.close();
      openSetupForVariant("custom");
    });

    UI.setupForm.addEventListener("submit", event => {
      event.preventDefault();
      const difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || "normal";
      const variant = getVariant(selectedVariantId);
      state.settings.difficulty = difficulty;
      state.settings.variantId = selectedVariantId;
      state.settings.rules = cloneRules(variant.rules);
      state.settings.allowTute = state.settings.rules.allowTute && UI.tuteToggle.checked;
      state.settings.rules.allowTute = state.settings.allowTute;
      if (state.settings.rules.matchMode === "points") {
        state.settings.rules.targetPoints = Number(UI.targetSelect.value) || 121;
        state.settings.targetRounds = 999;
      } else {
        state.settings.targetRounds = Number(UI.targetSelect.value) || 3;
      }
      state.mode = "game";
      state.tutorial.active = false;
      document.body.classList.remove("tutorial-mode");
      UI.setupModal.close();
      showGameTable();
      renderRulesModal();
      ensureMusicStarted();
      startMatch();
    });

    UI.setupModal.addEventListener("close", () => {
      if (state.mode === "home") renderHomeStats();
    });

    UI.newMatchButton.addEventListener("click", () => {
      if (state.mode === "tutorial") showHome();
      else openVariantSelector();
    });
    UI.brandButton.addEventListener("click", showHome);
    UI.rulesButton.addEventListener("click", () => {
      renderRulesModal();
      UI.rulesModal.showModal();
    });
    UI.closeRulesButton.addEventListener("click", () => UI.rulesModal.close());
    UI.rulesUnderstoodButton.addEventListener("click", () => UI.rulesModal.close());
    UI.soundButton.addEventListener("click", toggleSound);

    UI.musicButton.addEventListener("click", async event => {
      event.stopPropagation();
      const wasHidden = UI.musicPopover.classList.contains("hidden");
      UI.musicPopover.classList.toggle("hidden");
      if (wasHidden && UI.backgroundMusic.paused && musicEnabled) await ensureMusicStarted();
    });
    UI.homeMusicButton.addEventListener("click", toggleMusic);
    UI.mobileInfoButton?.addEventListener("click", () => {
      const open = !UI.sidePanel.classList.contains("mobile-open");
      setMobileInfoOpen(open);
    });
    UI.mobileInfoCloseButton?.addEventListener("click", () => setMobileInfoOpen(false));
    UI.mobileInfoBackdrop?.addEventListener("click", () => setMobileInfoOpen(false));
    UI.musicPopover.addEventListener("click", event => event.stopPropagation());
    UI.musicPopover.querySelector("strong")?.addEventListener("click", toggleMusic);
    UI.musicVolume.addEventListener("input", () => {
      const volume = Number(UI.musicVolume.value) / 100;
      UI.backgroundMusic.volume = volume;
      try { localStorage.setItem("tuteIaMusicVolume", String(volume)); } catch (_) {}
      if (volume > 0 && musicEnabled) ensureMusicStarted();
    });
    UI.backgroundMusic.addEventListener("play", updateMusicUi);
    UI.backgroundMusic.addEventListener("pause", updateMusicUi);
    document.addEventListener("click", () => UI.musicPopover.classList.add("hidden"));
    UI.musicButton.addEventListener("dblclick", toggleMusic);

    UI.drawButton.addEventListener("click", manualPlayerDraw);
    UI.deckStack.addEventListener("click", manualPlayerDraw);
    UI.deckStack.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        manualPlayerDraw();
      }
    });
    UI.exchangeButton.addEventListener("click", () => exchangeTrump("player"));
    UI.capoteButton.addEventListener("click", announceCapote);
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
    openSetupForVariant(selectedVariantId || "house");
  }

  function applyCareerLaunch() {
    const config = careerAiConfig();
    if (!config || !new URLSearchParams(location.search).has("career")) return;
    const variantId = VARIANTS[config.variant] ? config.variant : "house";
    selectedVariantId = variantId;
    saveSelectedVariant(variantId);
    const radio = document.querySelector(`input[name="difficulty"][value="${config.difficulty || "normal"}"]`);
    if (radio) {
      radio.checked = true;
      document.querySelectorAll(".choice-card").forEach(card => card.classList.toggle("selected", card.contains(radio)));
    }
    UI.aiName.textContent = aiDisplayName();
    setTimeout(() => {
      openSetupForVariant(variantId);
      UI.setupEyebrow.textContent = config.competitionTitle?.toUpperCase() || UI.setupEyebrow.textContent;
      UI.setupTitle.textContent = `${config.matchLabel} · ${config.name}`;
      UI.setupCopy.textContent = `${config.label || "Rival de carrera"}. ${config.motto || "Encuentro oficial de Sala Cero."}`;
    }, 180);
  }

  function setMobileInfoOpen(open) {
    if (!UI.sidePanel || !UI.mobileInfoButton || !UI.mobileInfoBackdrop) return;
    UI.sidePanel.classList.toggle("mobile-open", open);
    UI.mobileInfoBackdrop.classList.toggle("hidden", !open);
    UI.mobileInfoBackdrop.setAttribute("aria-hidden", open ? "false" : "true");
    UI.mobileInfoButton.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("mobile-info-open", open);
  }

  function showHome() {
    clearTimers();
    cleanupHandGesture();
    setMobileInfoOpen(false);
    [UI.setupModal, UI.rulesModal, UI.resultModal, UI.variantModal, UI.tutorialSelectModal, UI.customRulesModal].forEach(safeCloseDialog);
    state.mode = "home";
    state.tutorial.active = false;
    state.tutorial.busy = false;
    state.round = null;
    document.body.classList.remove("tutorial-mode");
    UI.tutorialCoach.classList.add("hidden");
    UI.appShell.classList.add("hidden");
    UI.homeScreen.classList.remove("hidden");
    UI.aiName.textContent = aiDisplayName();
    UI.newMatchButton.textContent = "Partida offline";
    clearTutorialFocus();
    renderEmptyState();
    updateTutorialCompletionBadge();
    renderHomeStats();
    updateMusicUi();
    window.TutePWA?.setPlaying(false);
    refreshSoloSaveCard();
  }

  function updateTutorialCompletionBadge() {
    let completed = 0;
    try {
      ["house", "habanero", "fournier", "americano", "arrastrado3", "pairs4", "individual4", "custom"].forEach(id => {
        if (localStorage.getItem(tutorialStorageKey(id)) === "true") completed += 1;
      });
    } catch (_) {}
    state.tutorial.completed = completed > 0;
    UI.tutorialCompletionBadge.textContent = completed ? `${completed} reglamento${completed === 1 ? "" : "s"} completado${completed === 1 ? "" : "s"}` : "8 tutoriales adaptados";
    UI.tutorialModeButton.classList.toggle("tutorial-complete", completed > 0);
  }

  function startTutorial(variantId = "house") {
    clearTimers();
    cleanupHandGesture();
    [UI.setupModal, UI.rulesModal, UI.resultModal, UI.variantModal, UI.tutorialSelectModal].forEach(safeCloseDialog);
    const variant = getVariant(variantId);
    saveSelectedVariant(variantId);
    state.settings.variantId = variantId;
    state.settings.rules = cloneRules(variant.rules);
    state.settings.allowTute = state.settings.rules.allowTute;
    TUTORIAL_STEPS = buildTutorialSteps(variantId);
    state.mode = "tutorial";
    state.tutorial.active = true;
    state.tutorial.busy = false;
    state.match.playerRounds = 0;
    state.match.aiRounds = 0;
    state.match.playerPoints = 0;
    state.match.aiPoints = 0;
    state.match.round = 1;
    state.settings.targetRounds = 1;
    document.body.classList.add("tutorial-mode");
    UI.aiName.textContent = "Maestra Virtud";
    UI.newMatchButton.textContent = "Salir";
    UI.variantLiveBadge.textContent = variant.shortName.toUpperCase();
    renderRulesModal();
    showGameTable();
    UI.tutorialCoach.classList.remove("hidden");
    ensureMusicStarted();
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
      postStockCanteChanceUsed: {
        player: Boolean(config.playerPostStockCanteChanceUsed),
        ai: Boolean(config.aiPostStockCanteChanceUsed)
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
      pendingHandFlip: null,
      capote: { active: false, actor: null, failed: false, announced: false }
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
      case 4: {
        const duty = state.settings.rules.stockDuty;
        if (duty === "free") {
          return makeTutorialRound({
            playerHand: [makeCard("copas", 1), makeCard("oros", 5), makeCard("espadas", 2), makeCard("bastos", 12)],
            aiHand: [makeCard("copas", 7), makeCard("oros", 4), makeCard("espadas", 6), makeCard("bastos", 3)],
            stock: stockOpen,
            trumpCard: commonTrump,
            currentTurn: "player",
            leader: "player",
            log: ["<strong>Baceta abierta.</strong> Puedes jugar cualquier carta."]
          });
        }
        if (duty === "trumpOnly") {
          const lead = makeCard("bastos", 7);
          return makeTutorialRound({
            playerHand: [makeCard("bastos", 3), makeCard("bastos", 5), makeCard("copas", 1), makeCard("oros", 2)],
            aiHand: [makeCard("copas", 7), makeCard("oros", 4), makeCard("espadas", 6)],
            stock: stockOpen,
            trumpCard: commonTrump,
            trick: [{ actor: "ai", card: lead, rotation: 4, offsetX: 0, offsetY: 0 }],
            currentTurn: "player",
            leader: "ai",
            log: ["La IA abre con <strong>Siete de bastos</strong>.", "Con baceta, el triunfo sí obliga."]
          });
        }
        const lead = makeCard("copas", 7);
        return makeTutorialRound({
          playerHand: [makeCard("copas", 3), makeCard("copas", 5), makeCard("oros", 1), makeCard("bastos", 2)],
          aiHand: [makeCard("oros", 4), makeCard("espadas", 6), makeCard("bastos", 3)],
          stock: stockOpen,
          trumpCard: commonTrump,
          trick: [{ actor: "ai", card: lead, rotation: 4, offsetX: 0, offsetY: 0 }],
          currentTurn: "player",
          leader: "ai",
          log: ["La IA abre con <strong>Siete de copas</strong>.", "Tu reglamento obliga desde la primera baza."]
        });
      }
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
    try { localStorage.setItem(tutorialStorageKey(state.settings.variantId), "true"); } catch (_) {}
    state.tutorial.completed = true;
    playSound("victory");
    showToast(`<strong>Tutorial de ${getVariant().name} completado.</strong> Ya puedes enfrentarte a la IA.`);
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

    if (step.id === "stock-rule") {
      const duty = state.settings.rules.stockDuty;
      if (duty === "free") {
        await sleep(300);
        await tutorialMoveCard("ai", "copas-7");
        state.round.cardPoints.player = 11;
        state.round.captured.player.push(makeCard("copas", 1), makeCard("copas", 7));
        addLog("<strong>Ganas la baza</strong> con el as de copas y sumas 11 puntos.");
      } else {
        const gained = state.round.trick.reduce((total, play) => total + play.card.points, 0);
        state.round.cardPoints.player += gained;
        state.round.captured.player.push(...state.round.trick.map(play => play.card));
        addLog(duty === "trumpOnly"
          ? "<strong>Correcto.</strong> Has asistido y montado el triunfo durante la baceta."
          : "<strong>Correcto.</strong> Has arrastrado y montado desde la primera baza.");
      }
      state.round.tricksWon.player = 1;
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
    window.TutePWA?.setPlaying(true);
    state.match.playerRounds = 0;
    state.match.aiRounds = 0;
    state.match.playerPoints = 0;
    state.match.aiPoints = 0;
    state.match.round = 0;
    UI.variantLiveBadge.textContent = getVariant().shortName.toUpperCase();
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
      postStockCanteChanceUsed: {
        player: false,
        ai: false
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

  function currentDutyMode() {
    const rules = state.settings.rules || VARIANTS.house.rules;
    return drawPileCount() > 0 ? rules.stockDuty : rules.afterStockDuty;
  }

  function isStrictPhase() {
    return currentDutyMode() === "full";
  }

  function isTrumpOnlyPhase() {
    return currentDutyMode() === "trumpOnly";
  }

  function renderEmptyState() {
    UI.playerHand.innerHTML = "";
    UI.aiHand.innerHTML = "";
    if (UI.aiHandCount) UI.aiHandCount.textContent = "0 CARTAS";
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
    queueSoloAutosave();
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
    updateResponsiveHandMetrics(playerCount);
  }

  function updateResponsiveHandMetrics(playerCount) {
    if (!UI.playerHand) return;
    if (window.innerWidth > 760) {
      UI.playerHand.style.removeProperty("--mobile-card-fit");
      UI.playerHand.style.removeProperty("--mobile-card-overlap");
      return;
    }
    const available = Math.max(280, Math.min(UI.playerHand.clientWidth || window.innerWidth, window.innerWidth) - 34);
    const cardWidth = Math.max(52, Math.min(67, available * .176));
    const step = playerCount > 1 ? Math.max(29, Math.min(cardWidth * .72, (available - cardWidth) / (playerCount - 1))) : cardWidth;
    UI.playerHand.style.setProperty("--mobile-card-fit", `${cardWidth.toFixed(2)}px`);
    UI.playerHand.style.setProperty("--mobile-card-overlap", `${(step - cardWidth).toFixed(2)}px`);
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
    const compactHand = window.innerWidth <= 760;
    element.dataset.cardId = card.id;
    element.dataset.playable = isPlayable ? "true" : "false";
    element.style.zIndex = index + 1;
    element.style.setProperty("--rest-rotate", `${normalized * (compactHand ? 4.2 : 10.5)}deg`);
    element.style.setProperty("--rest-y", `${Math.abs(normalized) * (compactHand ? 6 : 16)}px`);
    element.style.setProperty("--rest-x", `${normalized * (compactHand ? .55 : 3)}px`);
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

    const aiCount = round.hands.ai.length;
    const available = Math.max(220, Math.min(UI.aiHand.clientWidth || window.innerWidth * .52, 660));
    const cardWidth = UI.aiHand.firstElementChild?.getBoundingClientRect().width || 92;
    const maximumSpan = Math.max(cardWidth * .6, available - cardWidth * .74);
    const desiredSpacing = window.innerWidth <= 620 ? 22 : window.innerWidth <= 980 ? 30 : 39;
    const span = aiCount > 1 ? Math.min(maximumSpan, desiredSpacing * (aiCount - 1)) : 0;

    [...UI.aiHand.children].forEach((back, index) => {
      const normalized = aiCount > 1 ? (index - (aiCount - 1) / 2) / ((aiCount - 1) / 2) : 0;
      back.style.zIndex = index + 1;
      back.style.setProperty("--ai-fan-x", `${normalized * span / 2}px`);
      back.style.setProperty("--rest-rotate", `${normalized * -8.5}deg`);
      back.style.setProperty("--rest-y", `${Math.abs(normalized) * 9}px`);
    });

    if (UI.aiHandCount) {
      UI.aiHandCount.textContent = `${aiCount} ${aiCount === 1 ? "CARTA" : "CARTAS"}`;
      UI.aiHandCount.setAttribute("aria-label", `La inteligencia artificial tiene ${aiCount} ${aiCount === 1 ? "carta" : "cartas"}`);
    }
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

  function autoScrollActiveHand(clientX) {
    const hand = UI.playerHand;
    const rect = hand.getBoundingClientRect();
    const edge = 48;
    if (clientX < rect.left + edge) hand.scrollLeft -= 11;
    if (clientX > rect.right - edge) hand.scrollLeft += 11;
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
    if (!round.trick.length) return "Las reglas de la baza obligan a jugar otra carta.";

    const lead = round.trick[0].card;
    const winner = currentWinningPlay(round.trick)?.card;
    const hand = round.hands.player;
    const leadCards = hand.filter(item => item.suit === lead.suit);
    if (leadCards.length) {
      const alreadyTrumped = winner?.suit === round.trumpSuit && lead.suit !== round.trumpSuit;
      if (!alreadyTrumped && legal.every(item => item.suit === lead.suit)) {
        const canMount = legal.some(item => item.strength > winner.strength);
        return canMount ? `Debes asistir a ${SUIT_LABELS[lead.suit]} y superar la carta ganadora.` : `Debes asistir a ${SUIT_LABELS[lead.suit]}.`;
      }
      return `La baza está fallada, pero todavía debes asistir a ${SUIT_LABELS[lead.suit]}. No necesitas montar.`;
    }

    if (winner?.suit === round.trumpSuit) {
      const higherTrump = hand.some(item => item.suit === round.trumpSuit && item.strength > winner.strength);
      if (higherTrump) return `No tienes ${SUIT_LABELS[lead.suit]}: debes pisar el triunfo ganador.`;
    }
    if (legal.every(item => item.suit === round.trumpSuit)) return `No tienes ${SUIT_LABELS[lead.suit]}: debes fallar con triunfo.`;
    return "No puedes asistir ni superar el triunfo: puedes descartarte con cualquiera de las cartas habilitadas.";
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
    const duty = round.phase === "dealing" ? "free" : currentDutyMode();
    const strict = duty === "full";
    const trumpOnly = duty === "trumpOnly";
    const variant = getVariant();
    UI.variantLiveBadge.textContent = variant.shortName.toUpperCase();

    if (round.phase === "dealing") {
      UI.phaseBadge.textContent = "REPARTIENDO";
      UI.phaseBadge.classList.remove("strict");
      UI.ruleStateTitle.textContent = variant.name;
      UI.ruleStateText.textContent = "Las cartas salen de la baceta una a una. Tu mano conserva el orden de reparto.";
      UI.statusText.textContent = `Repartiendo… ${round.hands.player.length}/8 cartas para ti.`;
      UI.playerTurnPill.classList.remove("visible");
      UI.aiTurnPill.classList.remove("visible");
    } else if (round.phase === "awaitingDraw") {
      const actor = round.drawQueue[round.drawIndex];
      UI.phaseBadge.textContent = "FASE DE ROBO";
      UI.phaseBadge.classList.remove("strict");
      UI.ruleStateTitle.textContent = "Robo por orden de baza";
      UI.ruleStateText.textContent = "Quien gana roba primero. Tu carta debe recogerse tocando la baceta.";
      UI.statusText.textContent = round.drawing
        ? `${actor === "player" ? "Estás robando" : "La IA está robando"}…`
        : actor === "player" ? "Te toca robar. Pulsa la baceta." : "La IA roba primero.";
      UI.playerTurnPill.classList.toggle("visible", actor === "player" && !round.drawing);
      UI.aiTurnPill.classList.toggle("visible", actor === "ai");
    } else {
      UI.phaseBadge.textContent = strict ? "ARRASTRE ACTIVO" : trumpOnly ? "TRIUNFO OBLIGA" : "BACETA LIBRE";
      UI.phaseBadge.classList.toggle("strict", strict || trumpOnly);
      UI.ruleStateTitle.textContent = strict ? "Asistir, montar y fallar" : trumpOnly ? "Obligación especial de triunfo" : "Juego libre";
      UI.ruleStateText.textContent = strict
        ? "Debes asistir. Si la baza sigue en el palo de salida, monta cuando puedas; sin palo, falla o pisa el triunfo ganador."
        : trumpOnly
          ? "Con baceta solo estás obligado cuando la carta de salida es triunfo."
          : "Mientras quede baceta puedes jugar cualquier carta.";

      const isPlayerTurn = round.currentTurn === "player" && round.phase === "playing";
      const isAiTurn = round.currentTurn === "ai" && round.phase === "playing";
      UI.playerTurnPill.classList.toggle("visible", isPlayerTurn);
      UI.aiTurnPill.classList.toggle("visible", isAiTurn);

      if (round.capote?.active) {
        UI.statusText.textContent = round.capote.actor === "player" ? "Capote anunciado: debes ganar todas las bazas restantes." : "La IA ha anunciado capote.";
      } else if (round.pendingCante?.actor === "player") {
        UI.statusText.textContent = "Has ganado la baza. Puedes cantar.";
      } else if (round.pendingCante?.actor === "ai") {
        UI.statusText.textContent = "La IA está valorando un cante.";
      } else if (round.trick.length >= 1) {
        const opener = round.trick[0].actor;
        UI.statusText.textContent = opener === "player" ? "La IA debe responder." : "Te toca responder.";
      } else if (isPlayerTurn) {
        UI.statusText.textContent = round.leader === "player" ? "Abres la baza." : "Juega tu carta.";
      } else if (round.phase === "roundOver") {
        UI.statusText.textContent = "La mano ha terminado.";
      } else {
        UI.statusText.textContent = `${aiDisplayName()} está calculando.`;
      }
    }

    if (state.tutorial.active) {
      const step = currentTutorialStep();
      const forcedStep = ["stock-rule", "mount", "trump-fail"].includes(step.id) && state.settings.rules.stockDuty !== "free";
      UI.phaseBadge.textContent = forcedStep ? "OBLIGACIÓN GUIADA" : "TUTORIAL";
      UI.phaseBadge.classList.toggle("strict", forcedStep || ["mount", "trump-fail"].includes(step.id));
      UI.ruleStateTitle.textContent = step.title;
      UI.ruleStateText.textContent = step.tip || "Sigue la indicación de la maestra.";
      UI.statusText.textContent = step.action === "reorder"
        ? "Reordena una carta de tu mano."
        : step.action === "play" ? "Juega la carta resaltada."
        : step.action === "draw" ? "Pulsa la baceta para robar."
        : step.action === "song" ? "Realiza el cante disponible."
        : step.action === "finish" ? "Tutorial terminado."
        : "Lee la explicación y continúa.";
      UI.playerTurnPill.classList.toggle("visible", ["play", "draw", "reorder"].includes(step.action));
      UI.aiTurnPill.classList.remove("visible");
    }

    UI.unknownCards.textContent = round.hands.ai.length + drawPileCount();
  }

  function renderScores() {
    const round = state.round;
    const playerTotal = round.cardPoints.player + round.songPoints.player;
    const aiTotal = round.cardPoints.ai + round.songPoints.ai;
    const pointMode = !state.tutorial.active && state.settings.rules.matchMode === "points";

    UI.roundNumber.textContent = state.tutorial.active
      ? `LECCIÓN ${state.tutorial.stepIndex + 1}`
      : `MANO ${state.match.round}`;
    UI.playerRounds.textContent = pointMode ? state.match.playerPoints : state.match.playerRounds;
    UI.aiRounds.textContent = pointMode ? state.match.aiPoints : state.match.aiRounds;
    UI.playerCardPoints.textContent = round.cardPoints.player;
    UI.aiCardPoints.textContent = round.cardPoints.ai;
    UI.playerSongPoints.textContent = round.songPoints.player;
    UI.aiSongPoints.textContent = round.songPoints.ai;
    UI.playerTotal.textContent = playerTotal;
    UI.aiTotal.textContent = aiTotal;
    if (UI.mobileScoreMini) {
      const left = pointMode ? state.match.playerPoints : state.match.playerRounds;
      const right = pointMode ? state.match.aiPoints : state.match.aiRounds;
      UI.mobileScoreMini.textContent = `${left} · ${right}`;
    }
    UI.playerTricks.textContent = round.tricksWon.player;
    UI.aiTricks.textContent = round.tricksWon.ai;

    const pipCount = state.tutorial.active ? TUTORIAL_STEPS.length : pointMode ? 10 : state.settings.targetRounds;
    UI.targetRounds.textContent = state.tutorial.active
      ? `${state.tutorial.stepIndex + 1} de ${TUTORIAL_STEPS.length}`
      : pointMode
        ? `${state.settings.rules.targetPoints} tantos acumulados`
        : `${state.settings.targetRounds} ${state.settings.targetRounds === 1 ? "mano" : "manos"}`;

    UI.roundPips.style.setProperty("--pip-count", pipCount);
    UI.roundPips.innerHTML = "";
    for (let i = 0; i < pipCount; i += 1) {
      const pip = document.createElement("span");
      pip.className = "round-pip";
      if (state.tutorial.active) {
        if (i < state.tutorial.stepIndex) pip.classList.add("player");
        else if (i === state.tutorial.stepIndex) pip.classList.add("tutorial-current-pip");
      } else if (pointMode) {
        const playerProgress = Math.round(state.match.playerPoints / state.settings.rules.targetPoints * pipCount);
        const aiProgress = Math.round(state.match.aiPoints / state.settings.rules.targetPoints * pipCount);
        if (i < playerProgress) pip.classList.add("player");
        else if (i >= pipCount - aiProgress) pip.classList.add("ai");
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
        button.addEventListener("click", () => void resolveCanteChoice(option));
        UI.canteActions.appendChild(button);
      });

      const pass = document.createElement("button");
      pass.className = "pass-button";
      pass.textContent = "No cantar";
      pass.addEventListener("click", () => void resolveCanteChoice(null));
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

    const canAnnounceCapote = state.settings.rules.capote &&
      !round.capote?.announced &&
      drawPileCount() === 0 &&
      round.hands.player.length === 8 &&
      round.currentTurn === "player" &&
      round.leader === "player" &&
      round.trick.length === 0 &&
      round.phase === "playing" &&
      !round.pendingCante;
    UI.capoteButton.classList.toggle("hidden", !canAnnounceCapote);
  }

  function getHintText() {
    const round = state.round;
    if (round.phase === "dealing") return "Mira cómo se reparten las cartas una a una.";
    if (round.phase === "awaitingDraw") {
      const actor = round.drawQueue[round.drawIndex];
      if (round.drawing) return "La carta está viajando desde la baceta hasta la mano.";
      return actor === "player" ? "Toca la baceta o pulsa «Robar de la baceta»." : "La IA debe robar antes que tú.";
    }
    if (round.phase !== "playing") return "La mano ha terminado.";
    if (round.currentTurn === "ai") return "La IA calcula únicamente con sus cartas y la información visible.";
    if (round.trick.length === 0) return "Abre la baza con cualquier carta. También puedes ordenar la mano arrastrando entre cartas.";

    const legal = getLegalCards("player");
    if (legal.length === round.hands.player.length) return "Puedes jugar cualquier carta.";
    const lead = round.trick[0].card;
    const winner = currentWinningPlay(round.trick)?.card;
    const leadCards = round.hands.player.filter(card => card.suit === lead.suit);
    if (leadCards.length) {
      if (winner?.suit === round.trumpSuit && lead.suit !== round.trumpSuit) return `La baza está fallada: debes asistir a ${SUIT_LABELS[lead.suit]}, pero no necesitas montar.`;
      const canMount = legal.some(card => card.suit === lead.suit && card.strength > winner.strength);
      return canMount ? `Debes asistir a ${SUIT_LABELS[lead.suit]} y montar.` : `Debes asistir a ${SUIT_LABELS[lead.suit]}.`;
    }
    if (winner?.suit === round.trumpSuit && legal.some(card => card.suit === round.trumpSuit && card.strength > winner.strength)) {
      return `No tienes ${SUIT_LABELS[lead.suit]}: debes pisar el triunfo.`;
    }
    if (legal.every(card => card.suit === round.trumpSuit)) return `No tienes ${SUIT_LABELS[lead.suit]}: debes fallar con triunfo.`;
    return "No puedes asistir ni pisar: el descarte es libre.";
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

  function currentWinningPlay(trick = state.round?.trick || []) {
    if (!trick.length) return null;
    const leadSuit = trick[0].card.suit;
    const trumpSuit = state.round.trumpSuit;
    return trick.slice(1).reduce((winner, play) => beats(play.card, winner.card, leadSuit, trumpSuit) ? play : winner, trick[0]);
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

    if (round.trick.length === 0) return [...hand];
    const rules = state.settings.rules || VARIANTS.house.rules;
    const duty = currentDutyMode();
    const leadCard = round.trick[0].card;
    const leadSuit = leadCard.suit;
    const winnerPlay = currentWinningPlay(round.trick);
    const winningCard = winnerPlay.card;
    const trumpSuit = round.trumpSuit;

    if (duty === "free") return [...hand];
    if (duty === "trumpOnly" && leadSuit !== trumpSuit) return [...hand];

    const leadSuitCards = hand.filter(card => card.suit === leadSuit);
    if (leadSuitCards.length > 0) {
      // Si la baza ya está ganada por triunfo y el palo de salida no es triunfo,
      // se debe asistir, pero no montar la carta inicial: regla exacta de la mesa del usuario.
      const trickAlreadyTrumped = winningCard.suit === trumpSuit && leadSuit !== trumpSuit;
      if (rules.mustBeat && !trickAlreadyTrumped) {
        const higher = leadSuitCards.filter(card => card.strength > winningCard.strength);
        if (higher.length > 0) return higher;
      }
      return leadSuitCards;
    }

    if (!rules.mustTrump) return [...hand];
    const trumps = hand.filter(card => card.suit === trumpSuit);
    if (winningCard.suit !== trumpSuit) {
      return trumps.length > 0 ? trumps : [...hand];
    }

    if (rules.mustOvertrump) {
      const higherTrumps = trumps.filter(card => card.strength > winningCard.strength);
      if (higherTrumps.length > 0) return higherTrumps;
    }

    if (rules.freeDiscardIfCannotOvertrump) return [...hand];
    return trumps.length > 0 ? trumps : [...hand];
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

  function canOfferSongsNow(actor) {
    const rules = state.settings.rules;
    const round = state.round;
    if (!rules.songs || !round) return false;

    if (rules.songsPostStockFirstWinOnly) {
      if (drawPileCount() > 0) return true;
      return !round.postStockCanteChanceUsed?.[actor];
    }

    if (rules.songsAfterStockOnly) return drawPileCount() === 0;
    if (rules.songsStockOnly) return drawPileCount() > 0;
    return true;
  }

  function consumePostStockCanteChance(actor) {
    const rules = state.settings.rules;
    const round = state.round;
    if (!round || !rules.songsPostStockFirstWinOnly || drawPileCount() > 0) return;
    round.postStockCanteChanceUsed ||= { player: false, ai: false };
    round.postStockCanteChanceUsed[actor] = true;
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

    if (round.capote?.active && winner !== round.capote.actor) {
      round.capote.failed = true;
      const capoteWinner = other(round.capote.actor);
      addLog(`<strong>Capote fallido.</strong> ${capoteWinner === "player" ? "Ganas tú" : "Gana la IA"}.`);
      finishRound(capoteWinner, "capote fallido");
      return;
    }

    const options = getCanteOptions(winner);
    const canSingNow = canOfferSongsNow(winner);
    consumePostStockCanteChance(winner);
    if (options.length > 0 && canSingNow) {
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
    if (!state.settings.rules.songs && !state.settings.allowTute) return options;

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

    if (!state.settings.rules.songs) return options;

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
    void resolveCanteChoice(choice);
  }

  function chooseAiCante(options) {
    if (!options.length) return null;
    if (options[0].type === "tute") return options[0];
    if (state.settings.difficulty === "easy" && Math.random() < 0.22) return null;
    return [...options].sort((a, b) => b.points - a.points)[0];
  }

  async function resolveCanteChoice(option) {
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
    playSound(option.points === 40 ? "song40" : "song");
    render();
    if (window.TuteCanteFX) {
      await window.TuteCanteFX.play({ points: option.points, suit: option.suit, actorName: actor === "player" ? (window.SalaCeroClub?.getData()?.profile?.name || "Eduardo") : aiDisplayName() });
    }
    continueAfterTrick();
  }

  function continueAfterTrick() {
    const round = state.round;
    if (!round || round.phase !== "playing") return;

    if (round.hands.player.length === 0 && round.hands.ai.length === 0 && drawPileCount() === 0) {
      round.cardPoints[round.lastTrickWinner] += 10;
      addLog(`<strong>Diez de últimas</strong> para ${round.lastTrickWinner === "player" ? "ti" : "la IA"}.`);
      if (round.capote?.active && !round.capote.failed) {
        addLog(`<strong>Capote completado</strong> por ${round.capote.actor === "player" ? "ti" : "la IA"}.`);
        finishRound(round.capote.actor, "capote");
        return;
      }
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

  function announceCapote() {
    const round = state.round;
    if (!round || !state.settings.rules.capote || round.capote?.announced) return;
    if (drawPileCount() !== 0 || round.hands.player.length !== 8 || round.leader !== "player" || round.currentTurn !== "player" || round.trick.length) return;
    round.capote = { active: true, actor: "player", failed: false, announced: true };
    addLog("<strong>Anuncias capote.</strong> Debes ganar las ocho bazas finales.");
    showToast("<strong>Capote anunciado.</strong> No puedes perder ninguna baza final.");
    playSound("song");
    render();
  }

  function maybeAiAnnounceCapote() {
    const round = state.round;
    if (!state.settings.rules.capote || round.capote?.announced || drawPileCount() !== 0 || round.hands.ai.length !== 8 || round.leader !== "ai" || round.trick.length) return false;
    if (state.settings.difficulty !== "hard") return false;
    const trumps = round.hands.ai.filter(card => card.suit === round.trumpSuit).length;
    const dominant = round.hands.ai.filter(card => card.strength >= 8).length;
    if (trumps < 4 || dominant < 4) return false;
    round.capote = { active: true, actor: "ai", failed: false, announced: true };
    addLog("<strong>La IA anuncia capote.</strong>");
    showToast(`<strong>${aiDisplayName()} anuncia capote.</strong>`);
    playSound("song");
    render();
    later(scheduleAiTurn, 650);
    return true;
  }

  function beginNextTrick() {
    const round = state.round;
    round.currentTurn = round.leader;
    render();

    if (round.currentTurn === "ai") {
      if (maybeAiAnnounceCapote()) return;
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
    if (!state.settings.rules.exchange) return null;
    if (!round || !round.trumpCard) return null;
    const canExchangeNow = round.hasWonTrick[actor] || Boolean(state.settings.rules.exchangeFromStart && round.playedCards.length === 0);
    if (!canExchangeNow) return null;
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
    const delay = aiPersonality() === "aggressive" ? 520 : state.settings.difficulty === "hard" ? 760 : 620;
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

    const personality = aiPersonality();
    if (state.settings.difficulty === "easy" && (personality === "unpredictable" || Math.random() < 0.34)) {
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

      score += careerPersonalityAdjustment(card, opponentCard, wins, trickValue, personality);

      if (state.settings.difficulty === "hard") {
        score += expertAdjustment(card, opponentCard, wins);
      }

      score += Math.random() * (personality === "unpredictable" ? 18 : personality === "aggressive" ? 4.5 : 1.8);
      return { card, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].card;
  }

  function careerPersonalityAdjustment(card, opponentCard, wins, trickValue, personality) {
    const round = state.round;
    let score = 0;
    if (personality === "conservative") {
      score -= card.points * (wins ? 0.4 : 1.7);
      if (!opponentCard && card.points === 0) score += 7;
      if (card.suit === round.trumpSuit) score -= wins ? 3 : 8;
      if (wins && trickValue < 10) score -= 4;
    } else if (personality === "aggressive") {
      if (wins) score += 10 + trickValue * 0.55;
      if (!opponentCard && card.strength >= 8) score += 8;
      if (card.suit === round.trumpSuit && wins) score += 5;
      if (card.points >= 10 && !wins) score -= 5;
    } else if (personality === "unpredictable") {
      score += (Math.random() - 0.5) * 22;
    } else if (personality === "master") {
      score += expertAdjustment(card, opponentCard, wins) * 0.7;
      if (wins && trickValue >= 15) score += 8;
      if (!opponentCard && countUnknownHigher(card) === 0) score += 10;
    }
    return score;
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

    const playerScore = totalPoints("player");
    const aiScore = totalPoints("ai");
    const opponentName = aiDisplayName();
    const pointMode = state.settings.rules.matchMode === "points";

    if (pointMode) {
      state.match.playerPoints += playerScore;
      state.match.aiPoints += aiScore;
    } else if (winner === "player") state.match.playerRounds += 1;
    else state.match.aiRounds += 1;

    const matchOver = pointMode
      ? state.match.playerPoints >= state.settings.rules.targetPoints || state.match.aiPoints >= state.settings.rules.targetPoints
      : state.match.playerRounds >= state.settings.targetRounds || state.match.aiRounds >= state.settings.targetRounds;
    const matchWinner = pointMode
      ? (state.match.playerPoints === state.match.aiPoints ? winner : state.match.playerPoints > state.match.aiPoints ? "player" : "ai")
      : state.match.playerRounds > state.match.aiRounds ? "player" : "ai";

    render();
    updatePersistentStats(winner, matchOver ? matchWinner : null, reason);

    UI.resultPlayerScore.textContent = pointMode ? state.match.playerPoints : playerScore;
    UI.resultAiScore.textContent = pointMode ? state.match.aiPoints : aiScore;

    if (matchOver) {
      window.TuteDB?.remove("solo-current").catch(() => {});
      soloSaveRecord = null;
      window.TutePWA?.setPlaying(false);
      UI.resultKicker.textContent = pointMode ? `OBJETIVO ${state.settings.rules.targetPoints} ALCANZADO` : "PARTIDA TERMINADA";
      UI.resultEmblem.textContent = matchWinner === "player" ? "V" : "D";
      UI.resultTitle.textContent = matchWinner === "player" ? "Has conquistado la mesa" : `${opponentName} gana la partida`;
      UI.resultSummary.textContent = pointMode
        ? `Marcador acumulado: ${state.match.playerPoints} a ${state.match.aiPoints} en ${getVariant().name}.`
        : matchWinner === "player"
          ? `Victoria por ${state.match.playerRounds} a ${state.match.aiRounds} con ${getVariant().name}.`
          : `Resultado final: ${state.match.playerRounds} a ${state.match.aiRounds}. Puedes ajustar la dificultad o cambiar de reglamento.`;
      UI.resultActionButton.firstChild.textContent = " Revancha ";
      UI.resultActionButton.dataset.action = "rematch";
      playSound(matchWinner === "player" ? "victory" : "defeat");
    } else {
      UI.resultKicker.textContent = reason.includes?.("tute") ? "VICTORIA POR TUTE"
        : reason.includes?.("capote") ? "RESOLUCIÓN DE CAPOTE" : "MANO TERMINADA";
      UI.resultEmblem.textContent = winner === "player" ? "V" : "D";
      UI.resultTitle.textContent = winner === "player" ? "Has ganado la mano" : "La IA se lleva la mano";
      UI.resultSummary.textContent = pointMode
        ? `Esta mano termina ${playerScore} a ${aiScore}. Acumulado: ${state.match.playerPoints} a ${state.match.aiPoints}.`
        : reason === "puntos"
          ? `${winner === "player" ? "Te impones" : `${opponentName} se impone`} por ${Math.max(playerScore, aiScore)} a ${Math.min(playerScore, aiScore)} tantos.`
          : reason.includes?.("capote")
            ? `${winner === "player" ? "Has ganado" : "La IA gana"} por ${reason}.`
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
        song40: [[392, .07, .01], [494, .07, .08], [587, .08, .15], [784, .12, .23], [988, .16, .35]],
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

  function handleLaunchShortcut() {
    const mode = new URLSearchParams(location.search).get("mode");
    if (!mode) return;
    history.replaceState({}, "", location.pathname);
    setTimeout(() => {
      if (mode === "solo") openVariantSelector();
      if (mode === "tutorial") openTutorialSelector();
    }, 180);
  }

  function normalizeSoloRound(round) {
    if (!round) return null;
    round.sungSuits ||= { player: new Set(), ai: new Set() };
    if (!(round.sungSuits.player instanceof Set)) round.sungSuits.player = new Set(round.sungSuits.player || []);
    if (!(round.sungSuits.ai instanceof Set)) round.sungSuits.ai = new Set(round.sungSuits.ai || []);
    round.postStockCanteChanceUsed ||= { player: false, ai: false };
    round.postStockCanteChanceUsed.player = Boolean(round.postStockCanteChanceUsed.player);
    round.postStockCanteChanceUsed.ai = Boolean(round.postStockCanteChanceUsed.ai);
    round.pendingHandFlip = null;
    round.dragCardId = null;
    round.busyFlight = false;
    round.drawing = false;
    return round;
  }

  function soloSnapshot() {
    if (!state.round) return null;
    const round = structuredClone(state.round);
    normalizeSoloRound(round);
    return {
      settings: structuredClone(state.settings),
      match: structuredClone(state.match),
      round,
      savedMode: state.mode,
      variantName: getVariant(state.settings.variantId).name
    };
  }

  function queueSoloAutosave() {
    if (!window.TuteDB || state.mode !== "game" || !state.round) return;
    const round = state.round;
    if (["dealing", "roundOver"].includes(round.phase) || round.drawing || round.busyFlight) return;
    clearTimeout(soloAutosaveTimer);
    soloAutosaveTimer = setTimeout(async () => {
      try {
        const snapshot = soloSnapshot();
        if (!snapshot) return;
        soloSaveRecord = await window.TuteDB.save("solo-current", snapshot, {
          title: `${snapshot.variantName} contra IA`,
          detail: `Mano ${snapshot.match.round} · ${snapshot.round.hands.player.length} cartas en tu mano`,
          href: "index.html"
        });
        refreshSoloSaveCard();
      } catch (_) {}
    }, 650);
  }

  async function refreshSoloSaveCard() {
    if (!UI.resumeGameCard || !window.TuteDB) return;
    try {
      const records = await window.TuteDB.list();
      homeSaveRecord = records.find(record => {
        if (record.key === "solo-current") return Boolean(record.value?.round && record.value.round.phase !== "roundOver");
        if (record.key === "local-current") return Boolean(record.value?.players?.length && record.value.phase !== "finished");
        if (record.key.startsWith("multi-")) return Boolean(record.value?.players?.length && record.value.phase !== "finished");
        return false;
      }) || null;
      soloSaveRecord = homeSaveRecord?.key === "solo-current" ? homeSaveRecord : await window.TuteDB.load("solo-current");
      const valid = Boolean(homeSaveRecord);
      UI.resumeGameCard.classList.toggle("hidden", !valid);
      if (!valid) return;
      UI.resumeGameTitle.textContent = homeSaveRecord.meta?.title || "Continuar partida";
      const ageMinutes = Math.max(0, Math.round((Date.now() - homeSaveRecord.updatedAt) / 60000));
      UI.resumeGameMeta.textContent = `${homeSaveRecord.meta?.detail || "Partida guardada"} · ${ageMinutes < 1 ? "ahora" : `hace ${ageMinutes} min`}`;
    } catch (_) {
      homeSaveRecord = null;
      UI.resumeGameCard.classList.add("hidden");
    }
  }

  async function discardSoloSave() {
    const key = homeSaveRecord?.key || "solo-current";
    await window.TuteDB?.remove(key).catch(() => {});
    if (key === "solo-current") soloSaveRecord = null;
    homeSaveRecord = null;
    UI.resumeGameCard?.classList.add("hidden");
    window.TutePWA?.toast("Partida guardada descartada.");
    refreshSoloSaveCard();
  }

  async function resumeLatestSave() {
    if (!homeSaveRecord) await refreshSoloSaveCard();
    if (!homeSaveRecord) return;
    if (homeSaveRecord.key === "solo-current") {
      soloSaveRecord = homeSaveRecord;
      resumeSoloGame();
      return;
    }
    const href = homeSaveRecord.meta?.href;
    if (href) location.href = href;
  }

  async function resumeSoloGame() {
    try {
      const record = soloSaveRecord || await window.TuteDB.load("solo-current");
      const snapshot = record?.value;
      if (!snapshot?.round) throw new Error("save-invalid");
      clearTimers();
      cleanupHandGesture();
      Object.assign(state.settings, snapshot.settings || {});
      Object.assign(state.match, snapshot.match || {});
      state.round = normalizeSoloRound(snapshot.round);
      state.mode = "game";
      state.tutorial.active = false;
      selectedVariantId = state.settings.variantId || "house";
      UI.variantLiveBadge.textContent = getVariant(selectedVariantId).shortName.toUpperCase();
      showGameTable();
      renderRulesModal();
      render();
      ensureMusicStarted();
      window.TutePWA?.setPlaying(true);
      if (state.round.phase === "playing" && state.round.currentTurn === "ai") later(scheduleAiTurn, 480);
      if (state.round.phase === "awaitingDraw" && state.round.drawQueue?.[state.round.drawIndex] === "ai") later(advanceDrawQueue, 480);
      window.TutePWA?.toast("Partida recuperada.");
    } catch (_) {
      discardSoloSave();
      window.TutePWA?.toast("La partida guardada no se pudo recuperar.");
    }
  }

  function updatePersistentStats(roundWinner, matchWinner, reason = "puntos") {
    try {
      const current = JSON.parse(localStorage.getItem("tuteIaStats") || "{}");
      current.roundsPlayed = (current.roundsPlayed || 0) + 1;
      if (roundWinner === "player") current.roundsWon = (current.roundsWon || 0) + 1;
      if (matchWinner) {
        current.matchesPlayed = (current.matchesPlayed || 0) + 1;
        if (matchWinner === "player") current.matchesWon = (current.matchesWon || 0) + 1;
        current.variantPlays ||= {};
        current.variantPlays[state.settings.variantId] = (current.variantPlays[state.settings.variantId] || 0) + 1;
      }
      localStorage.setItem("tuteIaStats", JSON.stringify(current));
      if (matchWinner) {
        const pointMode = state.settings.rules.matchMode === "points";
        window.SalaCeroClub?.recordMatch({
          game: "tute",
          mode: "solo",
          variant: state.settings.variantId,
          won: matchWinner === "player",
          score: pointMode ? state.match.playerPoints : state.match.playerRounds,
          opponentScore: pointMode ? state.match.aiPoints : state.match.aiRounds,
          special: String(reason).includes("tute") ? "tute" : String(reason).includes("capote") ? "capote" : ""
        });
      }
      renderHomeStats();
    } catch (_) {}
  }

})();
