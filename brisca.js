(() => {
  "use strict";

  const SUITS = ["oros", "copas", "espadas", "bastos"];
  const RANKS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
  const POINTS = { 1: 11, 3: 10, 12: 4, 11: 3, 10: 2 };
  const POWER = { 1: 10, 3: 9, 12: 8, 11: 7, 10: 6, 7: 5, 6: 4, 5: 3, 4: 2, 2: 1 };
  const NAMES = { 1: "As", 2: "Dos", 3: "Tres", 4: "Cuatro", 5: "Cinco", 6: "Seis", 7: "Siete", 10: "Sota", 11: "Caballo", 12: "Rey" };
  const UI = Object.fromEntries([
    "brSetup", "brSetupForm", "brMode", "brCountField", "brPlayerCount", "brNameFields", "brGame", "brScoreboard", "brOpponents",
    "brStockCount", "brTrumpCard", "brTrumpName", "brTrick", "brRoundLabel", "brStatus", "brCurrentBadge", "brCurrentName", "brCurrentScore",
    "brHand", "brPass", "brPassTitle", "brReveal", "brResultDialog", "brResultTitle", "brResultRows", "brAgain", "brRulesDialog",
    "brRulesButton", "brRulesClose", "brRulesAccept", "brToast"
  ].map(id => [id, document.getElementById(id)]));

  const state = {
    active: false,
    mode: "solo",
    players: [],
    hands: [],
    scores: [],
    stock: [],
    trump: null,
    trumpSuit: "",
    leader: 0,
    current: 0,
    trick: [],
    trickNo: 1,
    resolving: false,
    revealed: false,
    recorded: false
  };
  let toastTimer = 0;

  function deckFor(count) {
    const deck = SUITS.flatMap(suit => RANKS.map(rank => ({ id: `${suit}-${rank}`, suit, rank })));
    if (count === 3) deck.splice(deck.findIndex(card => card.suit === "copas" && card.rank === 2), 1);
    return shuffle(deck);
  }

  function shuffle(cards) {
    for (let index = cards.length - 1; index > 0; index -= 1) {
      const other = Math.floor(Math.random() * (index + 1));
      [cards[index], cards[other]] = [cards[other], cards[index]];
    }
    return cards;
  }

  function startMatch() {
    const mode = UI.brMode.value;
    const count = mode === "solo" ? 2 : Number(UI.brPlayerCount.value);
    const profile = window.SalaCeroClub?.getData?.().profile?.name || "Jugador";
    const names = mode === "solo"
      ? [document.getElementById("brName0")?.value.trim() || profile, "Doña Virtud"]
      : Array.from({ length: count }, (_, index) => document.getElementById(`brName${index}`)?.value.trim() || `Jugador ${index + 1}`);
    const deck = deckFor(count);
    const trump = deck.pop();
    const hands = Array.from({ length: count }, () => []);
    for (let round = 0; round < 3; round += 1) {
      for (let player = 0; player < count; player += 1) hands[player].push(deck.pop());
    }

    Object.assign(state, {
      active: true,
      mode,
      players: names.map((name, index) => ({ name, ai: mode === "solo" && index === 1 })),
      hands,
      scores: Array(count).fill(0),
      stock: [trump, ...deck],
      trump,
      trumpSuit: trump.suit,
      leader: 0,
      current: 0,
      trick: [],
      trickNo: 1,
      resolving: false,
      revealed: mode === "solo",
      recorded: false
    });
    UI.brSetup.classList.add("hidden");
    UI.brGame.classList.remove("hidden");
    window.SalaCeroStats?.markStarted?.();
    render();
    scheduleTurn();
  }

  function cardPoints(card) { return POINTS[card.rank] || 0; }
  function cardPower(card) { return POWER[card.rank] || 0; }
  function cardName(card) { return `${NAMES[card.rank]} de ${card.suit}`; }
  function cardSrc(card) { return `assets/cards/${card.suit}-${card.rank}.webp`; }

  function beats(challenger, incumbent, leadSuit, trumpSuit = state.trumpSuit) {
    const challengerTrump = challenger.suit === trumpSuit;
    const incumbentTrump = incumbent.suit === trumpSuit;
    if (challengerTrump !== incumbentTrump) return challengerTrump;
    if (challenger.suit === incumbent.suit) return cardPower(challenger) > cardPower(incumbent);
    if (incumbentTrump) return false;
    return challenger.suit === leadSuit && incumbent.suit !== leadSuit;
  }

  function trickWinner(entries = state.trick) {
    const leadSuit = entries[0].card.suit;
    let best = entries[0];
    for (let index = 1; index < entries.length; index += 1) {
      if (beats(entries[index].card, best.card, leadSuit)) best = entries[index];
    }
    return best.player;
  }

  function playCard(index) {
    if (!state.active || state.resolving || (state.mode === "local" && !state.revealed)) return;
    const player = state.current;
    if (state.players[player].ai) return;
    commitCard(player, index);
  }

  function commitCard(player, index) {
    const [card] = state.hands[player].splice(index, 1);
    if (!card) return;
    state.trick.push({ player, card });
    state.revealed = false;
    beep(520 + cardPower(card) * 24, .06);
    if (state.trick.length === state.players.length) {
      state.resolving = true;
      UI.brStatus.textContent = "Resolviendo baza";
      render();
      window.setTimeout(resolveTrick, 620);
      return;
    }
    state.current = (player + 1) % state.players.length;
    render();
    scheduleTurn();
  }

  function resolveTrick() {
    const winner = trickWinner();
    const points = state.trick.reduce((sum, entry) => sum + cardPoints(entry.card), 0);
    state.scores[winner] += points;
    const winnerName = state.players[winner].name;
    state.leader = winner;
    state.current = winner;

    for (let offset = 0; offset < state.players.length && state.stock.length; offset += 1) {
      const player = (winner + offset) % state.players.length;
      const card = state.stock.pop();
      if (card) state.hands[player].push(card);
    }

    state.trick = [];
    state.trickNo += 1;
    state.resolving = false;
    toast(`${winnerName} gana la baza${points ? ` · ${points} puntos` : ""}`);
    haptic(points ? 55 : 25);
    if (!state.stock.length && state.hands.every(hand => hand.length === 0)) {
      finishMatch();
      return;
    }
    render();
    scheduleTurn();
  }

  function scheduleTurn() {
    if (!state.active || state.resolving) return;
    const player = state.current;
    if (state.players[player].ai) {
      UI.brStatus.textContent = "Doña Virtud piensa…";
      window.setTimeout(aiTurn, 520);
      return;
    }
    if (state.mode === "local") {
      UI.brPassTitle.textContent = `Turno de ${state.players[player].name}`;
      UI.brPass.classList.remove("hidden");
      return;
    }
    state.revealed = true;
    render();
  }

  function aiTurn() {
    if (!state.active || state.current !== 1 || state.resolving) return;
    const hand = state.hands[1];
    const ranked = hand.map((card, index) => ({ card, index, cost: cardPoints(card) * 20 + cardPower(card) + (card.suit === state.trumpSuit ? 6 : 0) }));
    let choice;
    if (!state.trick.length) {
      choice = ranked.sort((a, b) => a.cost - b.cost)[0];
    } else {
      const winners = ranked.filter(candidate => trickWinner([...state.trick, { player: 1, card: candidate.card }]) === 1);
      choice = (winners.length ? winners : ranked).sort((a, b) => a.cost - b.cost)[0];
    }
    commitCard(1, choice.index);
  }

  function finishMatch() {
    state.active = false;
    const ranking = state.players.map((player, index) => ({ index, name: player.name, score: state.scores[index] })).sort((a, b) => b.score - a.score);
    const best = ranking[0].score;
    const winners = ranking.filter(item => item.score === best);
    UI.brResultTitle.textContent = winners.length > 1 ? "Empate en la mesa" : `${winners[0].name} gana la Brisca`;
    UI.brResultRows.innerHTML = ranking.map((item, index) => `<div class="br-result-row"><span>${index + 1}. ${escapeHtml(item.name)}</span><strong>${item.score} puntos</strong></div>`).join("");
    UI.brResultDialog.showModal();
    haptic([80, 50, 110]);

    if (!state.recorded) {
      const won = state.mode === "solo" && winners.length === 1 && winners[0].index === 0;
      const event = {
        game: "brisca",
        mode: state.mode,
        local: state.mode === "local",
        won,
        score: state.scores[0],
        opponentScore: Math.max(...state.scores.slice(1)),
        special: won && state.scores[0] >= 101 ? "paliza" : "",
        players: state.players.map((player, index) => ({ name: player.name, won: winners.some(winner => winner.index === index) }))
      };
      if (window.SalaCeroClub?.recordMatch) window.SalaCeroClub.recordMatch(event);
      else window.SalaCeroStats?.recordResult?.(event);
      state.recorded = true;
    }
  }

  function render() {
    if (!state.active && UI.brGame.classList.contains("hidden")) return;
    UI.brStockCount.textContent = String(state.stock.length);
    UI.brTrumpCard.src = cardSrc(state.trump);
    UI.brTrumpCard.alt = cardName(state.trump);
    UI.brTrumpName.textContent = state.trumpSuit;
    UI.brRoundLabel.textContent = `BAZA ${state.trickNo}`;
    UI.brStatus.textContent = state.resolving ? "Resolviendo baza" : state.players[state.current].ai ? "Doña Virtud piensa…" : `Turno de ${state.players[state.current].name}`;
    UI.brScoreboard.innerHTML = state.players.map((player, index) => `<div class="br-score ${index === state.current ? "active" : ""}"><span>${escapeHtml(player.name)}</span><b>${state.scores[index]}</b></div>`).join("");
    UI.brOpponents.innerHTML = state.players.map((player, index) => index === state.current ? "" : `<div class="br-opponent"><span>${index + 1}</span><div><strong>${escapeHtml(player.name)}</strong><small>${state.hands[index].length} cartas · ${state.scores[index]} puntos</small></div></div>`).join("");

    UI.brTrick.innerHTML = state.trick.length
      ? state.trick.map(entry => `<figure class="br-played"><img src="${cardSrc(entry.card)}" alt="${escapeHtml(cardName(entry.card))}"/><figcaption>${escapeHtml(state.players[entry.player].name)}</figcaption></figure>`).join("")
      : `<p>${state.trickNo === 1 ? "Abre la primera baza." : `${escapeHtml(state.players[state.leader].name)} abre la baza.`}</p>`;

    const current = state.current;
    const handOwner = state.mode === "solo" ? 0 : current;
    UI.brCurrentBadge.textContent = state.mode === "solo" ? "TÚ" : `J${handOwner + 1}`;
    UI.brCurrentName.textContent = state.players[handOwner].name;
    UI.brCurrentScore.textContent = `${state.scores[handOwner]} puntos`;
    UI.brHand.innerHTML = state.hands[handOwner].map((card, index) => `<button class="br-card" type="button" data-card-index="${index}" aria-label="Jugar ${escapeHtml(cardName(card))}" ${current !== handOwner || state.resolving || (state.mode === "local" && !state.revealed) ? "disabled" : ""}><img src="${cardSrc(card)}" alt="${escapeHtml(cardName(card))}"/></button>`).join("");
    UI.brHand.querySelectorAll("[data-card-index]").forEach(button => button.addEventListener("click", () => playCard(Number(button.dataset.cardIndex))));
  }

  function renderNameFields() {
    const mode = UI.brMode.value;
    const count = mode === "solo" ? 1 : Number(UI.brPlayerCount.value);
    const profile = window.SalaCeroClub?.getData?.().profile?.name || "Jugador";
    UI.brCountField.hidden = mode !== "local";
    UI.brNameFields.innerHTML = Array.from({ length: count }, (_, index) => `<label><span>${mode === "solo" ? "Tu nombre" : `Jugador ${index + 1}`}</span><input id="brName${index}" maxlength="18" autocomplete="off" value="${escapeHtml(index === 0 ? profile : `Jugador ${index + 1}`)}"/></label>`).join("");
  }

  function toast(message) {
    clearTimeout(toastTimer);
    UI.brToast.textContent = message;
    UI.brToast.classList.add("visible");
    toastTimer = window.setTimeout(() => UI.brToast.classList.remove("visible"), 2200);
  }

  function beep(frequency = 520, duration = .06) {
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      const context = new Context();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.025, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + duration);
      oscillator.addEventListener("ended", () => context.close());
    } catch (_) {}
  }

  function haptic(pattern) { try { navigator.vibrate?.(pattern); } catch (_) {} }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char])); }

  UI.brMode.addEventListener("change", renderNameFields);
  UI.brPlayerCount.addEventListener("change", renderNameFields);
  UI.brSetupForm.addEventListener("submit", event => { event.preventDefault(); startMatch(); });
  UI.brReveal.addEventListener("click", () => { state.revealed = true; UI.brPass.classList.add("hidden"); render(); });
  UI.brAgain.addEventListener("click", () => location.reload());
  UI.brRulesButton.addEventListener("click", () => UI.brRulesDialog.showModal());
  UI.brRulesClose.addEventListener("click", () => UI.brRulesDialog.close());
  UI.brRulesAccept.addEventListener("click", () => UI.brRulesDialog.close());
  renderNameFields();

  window.SalaCeroBriscaDebug = Object.freeze({
    points: rank => POINTS[rank] || 0,
    power: rank => POWER[rank] || 0,
    beats: (challenger, incumbent, lead, trump) => beats(challenger, incumbent, lead, trump),
    winner: entries => trickWinner(entries),
    deckFor: count => deckFor(count).map(card => ({ ...card })),
    state
  });
})();
