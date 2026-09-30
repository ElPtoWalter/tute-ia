(() => {
  "use strict";
  const G = window.SalaCeroGame;
  const order = G.ranks;
  const ui = Object.fromEntries(["cqSetup","cqSetupForm","cqMode","cqPlayers","cqNames","cqGame","cqScore","cqBoard","cqStatus","cqPlayerName","cqHandCount","cqHand","cqPass","cqRulesButton","cqRules","cqResult","cqResultTitle","cqResultCopy","cqAgain"].map(id => [id, document.getElementById(id)]));
  const aiNames = ["Doña Virtud","Don Prudencio","Lola","Señor Azar","Clara"];
  const state = { active:false, mode:"solo", players:[], hands:[], board:{}, current:0, revealed:false, turns:0 };

  function renderNames() {
    const count = Number(ui.cqPlayers.value);
    const local = ui.cqMode.value === "local";
    ui.cqNames.innerHTML = Array.from({ length: local ? count : 1 }, (_, index) => `<label class="field"><span>${local ? `Jugador ${index + 1}` : "Tu nombre"}</span><input id="cqName${index}" maxlength="18" value="${G.escapeHtml(index ? `Jugador ${index + 1}` : window.SalaCeroPrefs.getName())}"></label>`).join("");
  }

  function start() {
    const count = Number(ui.cqPlayers.value);
    const local = ui.cqMode.value === "local";
    const players = Array.from({ length: count }, (_, index) => ({
      name: local ? (document.getElementById(`cqName${index}`)?.value.trim() || `Jugador ${index + 1}`) : (index === 0 ? (document.getElementById("cqName0")?.value.trim() || window.SalaCeroPrefs.getName()) : aiNames[index - 1]),
      ai: !local && index > 0
    }));
    const deck = G.deck();
    const hands = Array.from({ length: count }, () => []);
    deck.forEach((card, index) => hands[index % count].push(card));
    hands.forEach(hand => hand.sort((a,b) => G.suits.indexOf(a.suit) - G.suits.indexOf(b.suit) || order.indexOf(a.rank) - order.indexOf(b.rank)));
    const current = hands.findIndex(hand => hand.some(card => card.id === "oros-5"));
    Object.assign(state, { active:true, mode:local ? "local" : "solo", players, hands, board:Object.fromEntries(G.suits.map(suit => [suit, []])), current, revealed:!local, turns:0 });
    ui.cqSetup.classList.add("hidden"); ui.cqGame.classList.remove("hidden");
    render(); schedule();
  }

  function isLegal(card) {
    const total = Object.values(state.board).reduce((sum, cards) => sum + cards.length, 0);
    if (!total) return card.id === "oros-5";
    const played = state.board[card.suit];
    if (!played.length) return card.rank === 5;
    const indexes = played.map(rank => order.indexOf(rank));
    const index = order.indexOf(card.rank);
    return index === Math.min(...indexes) - 1 || index === Math.max(...indexes) + 1;
  }
  function legalIndexes(player = state.current) { return state.hands[player].map((card,index) => isLegal(card) ? index : -1).filter(index => index >= 0); }

  function play(index) {
    if (!state.active || !state.revealed || state.players[state.current].ai || !legalIndexes().includes(index)) return;
    commit(index);
  }
  function commit(index) {
    const player = state.current;
    const [card] = state.hands[player].splice(index,1);
    if (!card || !isLegal(card)) return;
    state.board[card.suit].push(card.rank);
    state.board[card.suit].sort((a,b) => order.indexOf(a) - order.indexOf(b));
    G.toast(`${state.players[player].name} coloca ${G.cardName(card)}`);
    window.SalaCeroPrefs.haptic(24);
    if (!state.hands[player].length) { finish(player); return; }
    next();
  }
  function pass() {
    if (!state.active || !state.revealed || legalIndexes().length) return;
    G.toast(`${state.players[state.current].name} pasa`);
    next();
  }
  function next() {
    state.turns += 1;
    state.current = (state.current + 1) % state.players.length;
    state.revealed = state.mode === "solo";
    render(); schedule();
  }
  function schedule() {
    if (!state.active) return;
    const player = state.players[state.current];
    if (player.ai) {
      ui.cqStatus.textContent = `${player.name} piensa…`;
      setTimeout(aiTurn, 430);
    } else if (state.mode === "local" && !state.revealed) {
      G.passScreen(`Turno de ${player.name}`, "La mano permanece oculta hasta que pulses el botón.", () => { state.revealed = true; render(); });
    }
  }
  function aiTurn() {
    if (!state.active || !state.players[state.current].ai) return;
    const legal = legalIndexes();
    if (!legal.length) { next(); return; }
    const scored = legal.map(index => {
      const card = state.hands[state.current][index];
      const sameSuit = state.hands[state.current].filter(item => item.suit === card.suit).length;
      return { index, score:(card.rank === 5 ? 30 : 0) + sameSuit * 3 - Math.abs(order.indexOf(card.rank) - order.indexOf(5)) };
    }).sort((a,b) => b.score - a.score);
    commit(scored[0].index);
  }
  function finish(winner) {
    state.active = false;
    ui.cqResultTitle.textContent = `${state.players[winner].name} gana el Cinquillo`;
    const remaining = state.players.map((player,index) => `${player.name}: ${state.hands[index].length} cartas`).join(" · ");
    ui.cqResultCopy.textContent = `Primera mano vacía. ${remaining}.`;
    ui.cqResult.showModal();
    window.SalaCeroPrefs.noteResult({ game:"cinquillo" });
    window.SalaCeroPrefs.haptic([70,40,100]);
  }
  function renderBoard() {
    ui.cqBoard.innerHTML = G.suits.map(suit => `<div class="cq-suit-row"><span class="cq-suit-name">${suit}</span>${order.map(rank => state.board[suit].includes(rank) ? `<span class="cq-slot played"><img src="assets/cards/${suit}-${rank}.webp" alt="${G.escapeHtml(G.cardName({suit,rank}))}"></span>` : `<span class="cq-slot" aria-label="Hueco para ${G.escapeHtml(G.cardName({suit,rank}))}">${rank}</span>`).join("")}</div>`).join("");
  }
  function render() {
    if (!state.players.length) return;
    const player = state.players[state.current];
    ui.cqScore.innerHTML = state.players.map((item,index) => `<div class="score-chip ${index === state.current ? "active" : ""}"><strong>${G.escapeHtml(item.name)}</strong><b>${state.hands[index].length}</b><small>cartas restantes</small></div>`).join("");
    renderBoard();
    ui.cqStatus.textContent = `Turno de ${player.name}`;
    const owner = state.mode === "solo" ? 0 : state.current;
    ui.cqPlayerName.textContent = state.players[owner].name;
    ui.cqHandCount.textContent = `${state.hands[owner].length} cartas`;
    const canUse = state.revealed && owner === state.current && !player.ai;
    G.renderHand(ui.cqHand, state.hands[owner], { legal:isLegal, disabled:() => !canUse, onPlay:play });
    ui.cqPass.disabled = !canUse || legalIndexes(owner).length > 0;
  }

  ui.cqMode.addEventListener("change", renderNames); ui.cqPlayers.addEventListener("change", renderNames);
  ui.cqSetupForm.addEventListener("submit", event => { event.preventDefault(); start(); });
  ui.cqPass.addEventListener("click", pass);
  ui.cqRulesButton.addEventListener("click", () => ui.cqRules.showModal());
  ui.cqRules.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", () => ui.cqRules.close()));
  ui.cqAgain.addEventListener("click", () => location.reload());
  renderNames();
  window.SalaCeroCinquilloDebug = Object.freeze({ state, isLegal, legalIndexes });
})();
