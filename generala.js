(() => {
  "use strict";

  const CATEGORIES = [
    { key: "ones", label: "Unos", short: "1" },
    { key: "twos", label: "Doses", short: "2" },
    { key: "threes", label: "Treses", short: "3" },
    { key: "fours", label: "Cuatros", short: "4" },
    { key: "fives", label: "Cincos", short: "5" },
    { key: "sixes", label: "Seises", short: "6" },
    { key: "straight", label: "Escalera", short: "E" },
    { key: "full", label: "Full", short: "F" },
    { key: "poker", label: "Póker", short: "P" },
    { key: "generala", label: "Generala", short: "G" },
    { key: "double", label: "Doble Generala", short: "DG" }
  ];
  const NUMBER_KEYS = ["ones", "twos", "threes", "fours", "fives", "sixes"];
  const SAVE_KEY = "salaCeroGeneralaSaveV17";
  const PREF_KEY = "salaCeroGeneralaPrefsV17";
  const UI = {};
  let rollTimer = null;
  let toastTimer = null;

  const state = {
    active: false,
    mode: "solo",
    difficulty: "normal",
    options: { servedWin: true, servedBonus: true, doubleGenerala: true },
    players: [],
    current: 0,
    dice: [1, 2, 3, 4, 5],
    held: [false, false, false, false, false],
    rollCount: 0,
    rolling: false,
    revealed: true,
    log: [],
    instantWinner: null
  };

  function careerAiConfig() {
    return window.SalaCeroCareer?.getAiConfig?.("generala") || null;
  }

  function aiDisplayName() {
    return careerAiConfig()?.name || "Doña Fortuna";
  }

  function aiPersonality() {
    return careerAiConfig()?.personality || "balanced";
  }

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheUI();
    bindUI();
    loadPreferences();
    const clubName = window.SalaCeroClub?.getData()?.profile?.name;
    if (clubName) UI.gPlayerName.value = clubName;
    refreshContinue();
    renderSetupNames();
    window.TuteMusicContinuity?.sync();
    applyCareerLaunch();
  }

  function cacheUI() {
    ["gWelcome","gGame","gSoloMode","gLocalMode","gContinueMode","gContinueTitle","gContinueMeta","gMusicButton","gRulesButton","gScoreCollapse","gScorePanel","gScoreTable","gRoundLabel","gActiveAvatar","gTurnKicker","gActiveName","gRollCounter","gRollStage","gCupButton","gDiceTray","gTableMessage","gRollButton","gCategoryGrid","gBestPlay","gAdvice","gLog","gExitGame","gPrivacy","gHandoffKicker","gHandoffAvatar","gHandoffName","gRevealTurn","gSetupModal","gSetupForm","gCloseSetup","gSetupKicker","gSetupTitle","gModeInput","gPlayerName","gLocalOptions","gPlayerCount","gNameGrid","gDifficultyGroup","gServedWin","gServedBonus","gDoubleGenerala","gRulesModal","gCloseRules","gRulesOk","gResultModal","gResultSeal","gResultTitle","gResultText","gFinalRanking","gRematch","gResultHome","gToast","backgroundMusic"].forEach(id => UI[id] = document.getElementById(id));
    UI.dice = [...document.querySelectorAll(".g-die")];
  }

  function bindUI() {
    UI.gSoloMode.addEventListener("click", () => openSetup("solo"));
    UI.gLocalMode.addEventListener("click", () => openSetup("local"));
    UI.gContinueMode.addEventListener("click", continueSavedGame);
    UI.gMusicButton.addEventListener("click", toggleMusic);
    UI.gRulesButton.addEventListener("click", () => UI.gRulesModal.showModal());
    UI.gCloseRules.addEventListener("click", () => UI.gRulesModal.close());
    UI.gRulesOk.addEventListener("click", () => UI.gRulesModal.close());
    UI.gCloseSetup.addEventListener("click", () => UI.gSetupModal.close());
    UI.gPlayerCount.addEventListener("change", renderSetupNames);
    UI.gSetupForm.addEventListener("submit", event => { event.preventDefault(); startFromSetup(); });
    UI.gRollButton.addEventListener("click", rollDice);
    UI.gCupButton.addEventListener("click", rollDice);
    UI.dice.forEach((die, index) => die.addEventListener("click", () => toggleHold(index)));
    UI.gScoreCollapse.addEventListener("click", () => {
      UI.gScorePanel.classList.toggle("expanded");
      UI.gScoreCollapse.textContent = UI.gScorePanel.classList.contains("expanded") ? "−" : "+";
    });
    UI.gExitGame.addEventListener("click", exitToWelcome);
    UI.gRevealTurn.addEventListener("click", revealLocalTurn);
    UI.gRematch.addEventListener("click", rematch);
    UI.gResultHome.addEventListener("click", () => { UI.gResultModal.close(); exitToWelcome(true); });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && state.active && state.mode === "local") lockPrivacy();
    });
  }

  function openSetup(mode) {
    UI.gModeInput.value = mode;
    UI.gSetupKicker.textContent = mode === "solo" ? "PARTIDA CONTRA IA" : "MULTIJUGADOR LOCAL";
    UI.gSetupTitle.textContent = mode === "solo" ? `Configura a ${aiDisplayName()}` : "Prepara la mesa";
    UI.gLocalOptions.classList.toggle("hidden", mode !== "local");
    UI.gDifficultyGroup.classList.toggle("hidden", mode !== "solo");
    renderSetupNames();
    UI.gSetupModal.showModal();
  }

  function applyCareerLaunch() {
    const config = careerAiConfig();
    if (!config || !new URLSearchParams(location.search).has("career")) return;
    const radio = document.querySelector(`input[name="gDifficulty"][value="${config.difficulty || "normal"}"]`);
    if (radio) radio.checked = true;
    const soloTitle = UI.gSoloMode?.querySelector("strong");
    if (soloTitle) soloTitle.textContent = `Contra ${config.name}`;
    setTimeout(() => {
      openSetup("solo");
      UI.gSetupKicker.textContent = config.competitionTitle?.toUpperCase() || "ENCUENTRO DE CARRERA";
      UI.gSetupTitle.textContent = `${config.matchLabel} · ${config.name}`;
    }, 180);
  }

  function renderSetupNames() {
    const count = Number(UI.gPlayerCount?.value || 2);
    UI.gNameGrid.innerHTML = "";
    for (let index = 0; index < count; index += 1) {
      const input = document.createElement("input");
      input.id = `gLocalName${index}`;
      input.maxLength = 18;
      input.placeholder = `Jugador ${index + 1}`;
      input.value = index === 0 ? (UI.gPlayerName?.value || "Jugador") : `Jugador ${index + 1}`;
      UI.gNameGrid.appendChild(input);
    }
  }

  function startFromSetup() {
    const mode = UI.gModeInput.value;
    const options = {
      servedWin: UI.gServedWin.checked,
      servedBonus: UI.gServedBonus.checked,
      doubleGenerala: UI.gDoubleGenerala.checked
    };
    let players;
    if (mode === "solo") {
      const difficulty = document.querySelector('input[name="gDifficulty"]:checked')?.value || "normal";
      players = [
        createPlayer(UI.gPlayerName.value.trim() || "Jugador", false),
        createPlayer(aiDisplayName(), true)
      ];
      state.difficulty = difficulty;
    } else {
      const count = Number(UI.gPlayerCount.value || 2);
      players = Array.from({ length: count }, (_, index) => createPlayer(document.getElementById(`gLocalName${index}`)?.value.trim() || `Jugador ${index + 1}`, false));
      state.difficulty = "normal";
    }
    Object.assign(state, {
      active: true,
      mode,
      options,
      players,
      current: 0,
      dice: [1, 2, 3, 4, 5],
      held: [false, false, false, false, false],
      rollCount: 0,
      rolling: false,
      revealed: mode !== "local",
      log: [],
      instantWinner: null
    });
    savePreferences();
    UI.gSetupModal.close();
    UI.gWelcome.classList.add("hidden");
    UI.gGame.classList.remove("hidden");
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    addLog(`<strong>${players[0].name}</strong> abre la partida.`);
    render();
    saveGame();
    if (mode === "local") showHandoff();
  }

  function createPlayer(name, isAI) {
    return { name, isAI, scores: Object.fromEntries(CATEGORIES.map(category => [category.key, null])) };
  }

  function rollDice() {
    if (!state.active || state.rolling || state.rollCount >= 3 || !state.revealed || currentPlayer().isAI) return;
    performRoll().then(() => {
      if (detectServedGeneralaWin()) return;
      render();
      saveGame();
    });
  }

  async function performRoll() {
    const firstRoll = state.rollCount === 0;
    const movingIndexes = state.dice.map((_, index) => index).filter(index => !state.held[index]);
    state.rolling = true;
    state.rollCount += 1;
    UI.gRollStage?.classList.remove("waiting", "first-roll", "reroll");
    UI.gRollStage?.classList.add("rolling", firstRoll ? "first-roll" : "reroll");
    UI.gRollStage?.setAttribute("aria-busy", "true");
    UI.gCupButton?.classList.add("disabled");

    movingIndexes.forEach((index, order) => {
      const die = UI.dice[index];
      die.classList.remove("revealing", "rolling", "to-cup");
      die.style.setProperty("--cup-tilt", `${-14 + order * 7}deg`);
      die.style.setProperty("--reveal-delay", `${order * 42}ms`);
    });

    playDiceSound();
    await wait(40);
    movingIndexes.forEach(index => UI.dice[index].classList.add("to-cup"));
    await wait(190);

    state.dice = state.dice.map((value, index) => state.held[index] ? value : randomDie());
    paintDice();

    movingIndexes.forEach(index => {
      const die = UI.dice[index];
      die.classList.remove("to-cup");
      void die.offsetWidth;
      die.classList.add("revealing");
    });

    await wait(740 + Math.max(0, movingIndexes.length - 1) * 42);

    UI.dice.forEach(die => {
      die.classList.remove("rolling", "revealing", "to-cup");
      die.style.removeProperty("--cup-tilt");
      die.style.removeProperty("--reveal-delay");
    });
    UI.gRollStage?.classList.remove("rolling", "first-roll", "reroll");
    UI.gRollStage?.setAttribute("aria-busy", "false");
    UI.gCupButton?.classList.remove("disabled");
    state.rolling = false;
    addLog(`<strong>${currentPlayer().name}</strong> realiza la tirada ${state.rollCount}: ${state.dice.join(" · ")}.`);
  }

  function toggleHold(index) {
    if (!state.active || state.rolling || state.rollCount === 0 || state.rollCount >= 3 || currentPlayer().isAI || !state.revealed) return;
    state.held[index] = !state.held[index];
    renderDice();
    saveGame();
    navigator.vibrate?.(7);
  }

  function scoreFor(categoryKey, dice = state.dice, rollCount = state.rollCount, player = currentPlayer()) {
    const counts = Array(7).fill(0);
    dice.forEach(value => counts[value] += 1);
    const groups = counts.slice(1).filter(Boolean).sort((a, b) => b - a);
    const unique = [...new Set(dice)].sort((a, b) => a - b).join("");
    const served = rollCount === 1;
    const bonus = state.options.servedBonus && served ? 5 : 0;
    if (NUMBER_KEYS.includes(categoryKey)) {
      const face = NUMBER_KEYS.indexOf(categoryKey) + 1;
      return counts[face] * face;
    }
    if (categoryKey === "straight") return (unique === "12345" || unique === "23456") ? 20 + bonus : 0;
    if (categoryKey === "full") return groups[0] === 3 && groups[1] === 2 ? 30 + bonus : 0;
    if (categoryKey === "poker") return groups[0] === 4 ? 40 + bonus : 0;
    if (categoryKey === "generala") return groups[0] === 5 ? 50 : 0;
    if (categoryKey === "double") {
      const hasGenerala = Number(player.scores.generala) > 0;
      return state.options.doubleGenerala && hasGenerala && groups[0] === 5 ? 100 : 0;
    }
    return 0;
  }

  function scoreCategory(categoryKey) {
    if (!state.active || state.rolling || state.rollCount === 0 || currentPlayer().isAI || !state.revealed) return;
    const player = currentPlayer();
    if (player.scores[categoryKey] !== null) return;
    const score = scoreFor(categoryKey);
    commitScore(categoryKey, score);
  }

  function commitScore(categoryKey, score) {
    const player = currentPlayer();
    player.scores[categoryKey] = score;
    const category = CATEGORIES.find(item => item.key === categoryKey);
    addLog(`<strong>${player.name}</strong> anota ${score} en ${category.label}.`);
    showToast(`${category.label}: ${score} puntos`);
    UI.dice.forEach(die => die.classList.add("scoring"));
    setTimeout(() => UI.dice.forEach(die => die.classList.remove("scoring")), 720);
    if (allScoresComplete()) {
      saveGame();
      setTimeout(endGame, 760);
      return;
    }
    state.current = (state.current + 1) % state.players.length;
    resetTurn();
    saveGame();
    render();
    if (state.mode === "local") showHandoff();
    else if (currentPlayer().isAI) setTimeout(playAiTurn, 820);
  }

  function resetTurn() {
    state.dice = [1, 2, 3, 4, 5];
    state.held = [false, false, false, false, false];
    state.rollCount = 0;
    state.rolling = false;
    state.revealed = state.mode !== "local";
  }

  async function playAiTurn() {
    if (!state.active || !currentPlayer().isAI) return;
    state.revealed = true;
    render();
    for (let roll = 1; roll <= 3; roll += 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await performRoll();
      if (detectServedGeneralaWin()) return;
      const choice = chooseAiCategory(false);
      if (roll < 3 && shouldAiStop(choice)) break;
      if (roll < 3) state.held = chooseAiHolds();
      render();
    }
    await new Promise(resolve => setTimeout(resolve, 650));
    const choice = chooseAiCategory(true);
    commitScore(choice.key, choice.score);
  }

  function chooseAiHolds() {
    const player = currentPlayer();
    const open = openCategories(player);
    const personality = aiPersonality();
    const unique = [...new Set(state.dice)].sort((a, b) => a - b);
    const straightOpen = open.includes("straight");
    const straightSet = bestStraightSubset(unique);

    if (personality === "unpredictable" && Math.random() < .35) {
      return state.dice.map(() => Math.random() < .48);
    }

    if (straightOpen && straightSet.length >= (personality === "aggressive" ? 3 : 4)) {
      const used = new Set();
      return state.dice.map(value => {
        if (!straightSet.includes(value) || used.has(value)) return false;
        used.add(value); return true;
      });
    }

    const counts = countDice(state.dice);
    const values = [1,2,3,4,5,6].sort((a,b) => counts[b]-counts[a] || b-a);
    let target = values[0];
    if (personality === "conservative" && counts[target] < 2) {
      const bestNumber = values.find(value => open.includes(NUMBER_KEYS[value-1]));
      target = bestNumber || target;
    }
    if (personality === "aggressive" || personality === "master") {
      target = values.sort((a,b) => counts[b]-counts[a] || b-a)[0];
    }
    return state.dice.map(value => value === target);
  }

  function chooseAiCategory(finalChoice) {
    const player = currentPlayer();
    const open = openCategories(player);
    const weights = { ones: 1, twos: 2, threes: 3, fours: 4, fives: 5, sixes: 6, straight: 21, full: 31, poker: 42, generala: 58, double: 92 };
    const options = open.map(key => {
      const score = scoreFor(key, state.dice, state.rollCount, player);
      let utility = score;
      if (NUMBER_KEYS.includes(key)) {
        const face = NUMBER_KEYS.indexOf(key)+1;
        utility = score - (face >= 4 ? face * 1.2 : face * .4);
      } else if (score === 0) utility = -weights[key];
      if (key === "double" && !state.options.doubleGenerala) utility = -999;
      const personality = aiPersonality();
      if (personality === "conservative") {
        if (NUMBER_KEYS.includes(key) && score > 0) utility += 7;
        if (["poker","generala","double"].includes(key) && score === 0) utility -= 8;
      } else if (personality === "aggressive") {
        if (["poker","generala","double"].includes(key)) utility += score > 0 ? 18 : 7;
        if (NUMBER_KEYS.includes(key) && score < 15) utility -= 5;
      } else if (personality === "unpredictable") {
        utility += Math.random() * 34 - 17;
      } else if (personality === "master") {
        utility += score > 0 ? weights[key] * .14 : -weights[key] * .34;
      }
      if (state.difficulty === "easy") utility += Math.random() * 18 - 9;
      if (state.difficulty === "hard") utility += score > 0 ? weights[key] * .08 : -weights[key] * .25;
      return { key, score, utility };
    }).sort((a,b) => b.utility-a.utility);
    if (!finalChoice && options[0]?.score === 0) return options[0];
    return options[0] || { key: open[0], score: 0, utility: -999 };
  }

  function shouldAiStop(choice) {
    if (!choice) return false;
    const personality = aiPersonality();
    if (["generala","double"].includes(choice.key) && choice.score > 0) return true;
    if (personality === "conservative" && state.rollCount >= 2 && choice.score >= 14) return true;
    if (personality === "aggressive" && state.rollCount < 3 && choice.score < 35) return false;
    if (personality === "unpredictable" && Math.random() < .22) return true;
    if (["poker","full","straight"].includes(choice.key) && choice.score > 0 && state.rollCount >= 2) return true;
    return state.rollCount >= 2 && choice.score >= (personality === "master" ? 26 : 24);
  }

  function detectServedGeneralaWin() {
    if (!state.options.servedWin || state.rollCount !== 1) return false;
    if (!state.dice.every(value => value === state.dice[0])) return false;
    state.instantWinner = state.current;
    addLog(`<strong>${currentPlayer().name}</strong> consigue Generala servida y gana la partida.`);
    saveGame();
    celebrateGenerala();
    setTimeout(endGame, 1300);
    return true;
  }

  function render() {
    if (!state.active) return;
    const player = currentPlayer();
    UI.gActiveAvatar.textContent = player.isAI ? "IA" : initials(player.name);
    UI.gTurnKicker.textContent = player.isAI ? "TURNO DE LA IA" : state.mode === "local" ? "TURNO LOCAL" : "TU TURNO";
    UI.gActiveName.textContent = player.name;
    UI.gRollCounter.textContent = `${state.rollCount} / 3`;
    const categoryTotal = state.options.doubleGenerala ? 11 : 10;
    UI.gRoundLabel.textContent = `${Math.min(categoryTotal, Math.floor(totalFilled() / state.players.length) + 1)} / ${categoryTotal}`;
    const canRoll = !(state.rolling || state.rollCount >= 3 || player.isAI || !state.revealed);
    UI.gRollStage?.classList.toggle("waiting", !state.rolling && state.rollCount === 0 && state.revealed);
    UI.gRollButton.disabled = !canRoll;
    UI.gCupButton.disabled = !canRoll;
    UI.gCupButton.classList.toggle("disabled", !canRoll);
    UI.gRollButton.querySelector("b").textContent = state.rollCount === 0 ? "Tirar los dados" : "Volver a tirar";
    UI.gRollButton.querySelector("small").textContent = state.rollCount >= 3 ? "Elige una categoría" : `Quedan ${3-state.rollCount} tiradas`;
    const cupLabel = UI.gCupButton?.querySelector('.g-cup-label');
    if (cupLabel) cupLabel.textContent = canRoll ? (state.rollCount === 0 ? 'Agitar cubilete' : 'Sacudir y revelar') : (player.isAI ? 'Turno de la IA' : state.rollCount >= 3 ? 'Tirada completa' : 'Turno oculto');
    UI.gTableMessage.textContent = tableMessage();
    renderDice();
    renderCategories();
    renderScores();
    renderAdvice();
    renderLog();
  }

  function renderDice() {
    UI.dice.forEach((die,index) => {
      die.dataset.value = String(state.dice[index]);
      die.classList.toggle("held", state.held[index]);
      die.disabled = state.rollCount === 0 || state.rollCount >= 3 || currentPlayer().isAI || !state.revealed;
      die.setAttribute("aria-label", `Dado ${index+1}: ${state.dice[index]}${state.held[index] ? ", guardado" : ""}`);
    });
  }

  function paintDice() {
    UI.dice.forEach((die,index) => die.dataset.value = String(state.dice[index]));
  }

  function renderCategories() {
    const player = currentPlayer();
    UI.gCategoryGrid.innerHTML = "";
    const available = state.rollCount > 0 && !player.isAI && state.revealed;
    const openOptions = CATEGORIES.filter(category => player.scores[category.key] === null).map(category => ({ ...category, score: scoreFor(category.key) }));
    const bestScore = Math.max(0, ...openOptions.map(option => option.score));
    CATEGORIES.forEach(category => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "g-category-button";
      const used = player.scores[category.key] !== null;
      const score = used ? player.scores[category.key] : state.rollCount ? scoreFor(category.key) : "—";
      button.innerHTML = `<span>${category.label}</span><strong>${score}</strong>`;
      button.disabled = used || !available || (category.key === "double" && !state.options.doubleGenerala);
      button.classList.toggle("zero", score === 0);
      button.classList.toggle("best", !used && Number(score) > 0 && Number(score) === bestScore);
      button.addEventListener("click", () => scoreCategory(category.key));
      UI.gCategoryGrid.appendChild(button);
    });
  }

  function renderScores() {
    const header = `<thead><tr><th>Jugada</th>${state.players.map((player,index) => `<th class="${index===state.current?'active-player-col':''}">${escapeHtml(shortName(player.name))}</th>`).join("")}</tr></thead>`;
    const bodyRows = CATEGORIES.map(category => `<tr><td>${category.label}</td>${state.players.map((player,index) => `<td class="${index===state.current?'active-player-col':''}">${player.scores[category.key] ?? "·"}</td>`).join("")}</tr>`).join("");
    const totals = `<tr class="total-row"><td>TOTAL</td>${state.players.map(player => `<td>${totalScore(player)}</td>`).join("")}</tr>`;
    UI.gScoreTable.innerHTML = `${header}<tbody>${bodyRows}${totals}</tbody>`;
  }

  function renderAdvice() {
    if (state.rollCount === 0) {
      UI.gBestPlay.textContent = "Sin tirar";
      UI.gAdvice.textContent = currentPlayer().isAI ? `${aiDisplayName()} prepara su cubilete.` : "La estrategia empieza después de la primera tirada.";
      return;
    }
    const player = currentPlayer();
    const options = openCategories(player).map(key => ({ key, score: scoreFor(key) })).sort((a,b) => b.score-a.score);
    const best = options[0];
    const category = CATEGORIES.find(item => item.key === best?.key);
    UI.gBestPlay.textContent = best?.score > 0 ? `${category.label} · ${best.score}` : "Sin jugada mayor";
    const counts = countDice(state.dice);
    const mode = [1,2,3,4,5,6].sort((a,b) => counts[b]-counts[a])[0];
    UI.gAdvice.textContent = best?.score > 0 ? `Puedes asegurar ${best.score} puntos o volver a tirar los dados no guardados.` : `El valor más repetido es ${mode}. Guardarlo puede acercarte a Full, Póker o Generala.`;
  }

  function renderLog() {
    UI.gLog.innerHTML = state.log.slice(-16).reverse().map(entry => `<div class="g-log-entry">${entry}</div>`).join("");
  }

  function tableMessage() {
    if (!state.revealed) return "Turno oculto.";
    if (currentPlayer().isAI) return `${aiDisplayName()} está valorando sus dados.`;
    if (state.rollCount === 0) return "Tira los cinco dados para comenzar el turno.";
    if (state.rollCount < 3) return "Pulsa los dados que quieras guardar. Después vuelve a tirar o anota una categoría.";
    return "Has utilizado las tres tiradas. Elige una categoría, incluso con cero puntos.";
  }

  function showHandoff() {
    state.revealed = false;
    const player = currentPlayer();
    UI.gHandoffKicker.textContent = "PASAD EL MÓVIL";
    UI.gHandoffAvatar.textContent = initials(player.name);
    UI.gHandoffName.textContent = player.name;
    UI.gRevealTurn.textContent = `Soy ${player.name} · empezar turno`;
    UI.gPrivacy.classList.remove("hidden");
    render();
  }

  function revealLocalTurn() {
    state.revealed = true;
    UI.gPrivacy.classList.add("hidden");
    render();
    saveGame();
  }

  function lockPrivacy() {
    if (!state.active || state.mode !== "local" || !state.revealed) return;
    showHandoff();
  }

  function endGame() {
    state.active = false;
    localStorage.removeItem(SAVE_KEY);
    const ranking = state.players.map((player,index) => ({ index, name:player.name, score:totalScore(player) })).sort((a,b) => b.score-a.score);
    const winnerIndex = state.instantWinner !== null ? state.instantWinner : ranking[0].index;
    const winner = state.players[winnerIndex];
    const profileScore = totalScore(state.players[0]);
    window.SalaCeroClub?.recordMatch({
      game: "generala",
      mode: state.mode,
      local: state.mode === "local",
      won: state.mode === "solo" && winnerIndex === 0,
      score: profileScore,
      opponentScore: state.mode === "solo" ? totalScore(state.players[1]) : 0,
      servedGenerala: state.instantWinner === 0
    });
    UI.gResultSeal.textContent = initials(winner.name);
    UI.gResultTitle.textContent = `${winner.name} gana la partida`;
    UI.gResultText.textContent = state.instantWinner !== null ? "La Generala servida ha cerrado la partida inmediatamente." : `La mejor planilla termina con ${ranking[0].score} puntos.`;
    UI.gFinalRanking.innerHTML = ranking.map((entry,index) => `<div class="g-ranking-row"><span>${index+1}. ${escapeHtml(entry.name)}</span><strong>${entry.score}</strong></div>`).join("");
    UI.gResultModal.showModal();
    refreshContinue();
  }

  function rematch() {
    UI.gResultModal.close();
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const players = state.players.map(player => createPlayer(player.name, player.isAI));
    Object.assign(state,{active:true,players,current:0,dice:[1,2,3,4,5],held:[false,false,false,false,false],rollCount:0,rolling:false,revealed:state.mode!=="local",log:[],instantWinner:null});
    addLog(`<strong>${players[0].name}</strong> abre la revancha.`);
    render(); saveGame();
    if (state.mode === "local") showHandoff();
  }

  function exitToWelcome(discard = false) {
    if (state.active && !discard) saveGame();
    UI.gGame.classList.add("hidden");
    UI.gWelcome.classList.remove("hidden");
    UI.gPrivacy.classList.add("hidden");
    refreshContinue();
  }

  function saveGame() {
    if (!state.active) return;
    const serializable = JSON.parse(JSON.stringify(state));
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(serializable)); } catch (_) {}
  }

  function continueSavedGame() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      if (!saved?.players?.length) return;
      Object.assign(state,saved,{rolling:false,revealed:saved.mode!=="local"});
      UI.gWelcome.classList.add("hidden");
      UI.gGame.classList.remove("hidden");
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      render();
      if (state.mode === "local") showHandoff();
      else if (currentPlayer().isAI) setTimeout(playAiTurn,700);
    } catch (_) { localStorage.removeItem(SAVE_KEY); refreshContinue(); }
  }

  function refreshContinue() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      const valid = Boolean(saved?.active && saved.players?.length);
      UI.gContinueMode.disabled = !valid;
      UI.gContinueTitle.textContent = valid ? `${saved.players.length} jugadores · turno de ${saved.players[saved.current].name}` : "Sin partida pendiente";
      const categoryTotal = saved?.options?.doubleGenerala === false ? 10 : 11;
      UI.gContinueMeta.textContent = valid ? `Ronda ${Math.min(categoryTotal,Math.floor(totalFilled(saved)/saved.players.length)+1)} de ${categoryTotal} · guardada en este dispositivo.` : "La partida se guarda automáticamente después de cada tirada y anotación.";
    } catch (_) { UI.gContinueMode.disabled = true; }
  }

  function savePreferences() {
    try { localStorage.setItem(PREF_KEY,JSON.stringify({name:UI.gPlayerName.value,options:state.options,difficulty:state.difficulty})); } catch (_) {}
  }

  function loadPreferences() {
    try {
      const pref=JSON.parse(localStorage.getItem(PREF_KEY)||"{}");
      if(pref.name) UI.gPlayerName.value=pref.name;
      if(pref.options){UI.gServedWin.checked=pref.options.servedWin!==false;UI.gServedBonus.checked=pref.options.servedBonus!==false;UI.gDoubleGenerala.checked=pref.options.doubleGenerala!==false;}
      if(pref.difficulty){const radio=document.querySelector(`input[name="gDifficulty"][value="${pref.difficulty}"]`);if(radio)radio.checked=true;}
    } catch(_){}
  }

  async function toggleMusic() {
    const audio=UI.backgroundMusic;
    if(!audio)return;
    if(audio.paused){try{await audio.play();localStorage.setItem("tuteIaMusicEnabled","true");UI.gMusicButton.textContent="♫";}catch(_){}}
    else{audio.pause();localStorage.setItem("tuteIaMusicEnabled","false");UI.gMusicButton.textContent="♩";}
    window.TuteMusicContinuity?.savePosition();
  }

  function playDiceSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.value = 0.42;
      master.connect(ctx.destination);

      // Roce corto del cubilete.
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * .5), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const noise = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const noiseGain = ctx.createGain();
      noise.buffer = buffer;
      filter.type = "bandpass";
      filter.frequency.value = 720;
      filter.Q.value = .8;
      noiseGain.gain.setValueAtTime(.0001, now);
      noiseGain.gain.exponentialRampToValueAtTime(.055, now + .025);
      noiseGain.gain.exponentialRampToValueAtTime(.0001, now + .46);
      noise.connect(filter).connect(noiseGain).connect(master);
      noise.start(now);

      // Golpes irregulares de los dados dentro y al caer.
      const impacts = [0.03,0.10,0.17,0.25,0.34,0.48,0.58,0.69,0.78];
      impacts.forEach((offset,index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = index < 5 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(145 + Math.random() * 210, now + offset);
        osc.frequency.exponentialRampToValueAtTime(80 + Math.random() * 70, now + offset + .055);
        gain.gain.setValueAtTime(.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(index < 5 ? .045 : .075, now + offset + .004);
        gain.gain.exponentialRampToValueAtTime(.0001, now + offset + .075);
        osc.connect(gain).connect(master);
        osc.start(now + offset);
        osc.stop(now + offset + .09);
      });
      setTimeout(() => ctx.close(), 1200);
    } catch (_) {}
  }

  function celebrateGenerala() {
    document.body.classList.add("generala-celebration");
    navigator.vibrate?.([80,45,120,45,180]);
    showToast("¡GENERALA SERVIDA!");
    for(let i=0;i<28;i+=1){const particle=document.createElement("span");particle.style.cssText=`position:fixed;z-index:4900;left:${Math.random()*100}vw;top:-20px;width:8px;height:14px;background:${i%2?'#ffd98b':'#8f69d4'};transform:rotate(${Math.random()*180}deg);pointer-events:none;`;document.body.appendChild(particle);particle.animate([{translate:"0 0",rotate:"0deg"},{translate:`${(Math.random()-.5)*160}px 105vh`,rotate:"720deg"}],{duration:1100+Math.random()*900,easing:"cubic-bezier(.2,.7,.2,1)"}).finished.finally(()=>particle.remove());}
    setTimeout(()=>document.body.classList.remove("generala-celebration"),1800);
  }

  function addLog(html){state.log.push(html);if(state.log.length>50)state.log.shift();}
  function showToast(text){clearTimeout(toastTimer);UI.gToast.textContent=text;UI.gToast.classList.add("visible");toastTimer=setTimeout(()=>UI.gToast.classList.remove("visible"),1800);}
  function currentPlayer(){return state.players[state.current];}
  function openCategories(player){return CATEGORIES.map(c=>c.key).filter(key=>player.scores[key]===null && (key!=="double"||state.options.doubleGenerala));}
  function totalScore(player){return Object.values(player.scores).reduce((sum,value)=>sum+(Number(value)||0),0);}
  function totalFilled(source=state){return source.players.reduce((sum,player)=>sum+Object.values(player.scores).filter(value=>value!==null).length,0);}
  function allScoresComplete(){return state.players.every(player=>CATEGORIES.every(category=>category.key==="double"&&!state.options.doubleGenerala?true:player.scores[category.key]!==null));}
  function randomDie(){return Math.floor(Math.random()*6)+1;}
  function wait(ms){return new Promise(resolve => setTimeout(resolve, ms));}
  function countDice(dice){const counts=Array(7).fill(0);dice.forEach(value=>counts[value]+=1);return counts;}
  function bestStraightSubset(unique){const a=[1,2,3,4,5].filter(v=>unique.includes(v));const b=[2,3,4,5,6].filter(v=>unique.includes(v));return a.length>=b.length?a:b;}
  function initials(name){return name.split(/\s+/).map(part=>part[0]).join("").slice(0,2).toUpperCase();}
  function shortName(name){return name.length>8?`${name.slice(0,7)}…`:name;}
  function escapeHtml(value){return String(value).replace(/[&<>"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]));}
})();
