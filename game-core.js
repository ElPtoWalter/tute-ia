(() => {
  "use strict";

  const suits = ["oros", "copas", "espadas", "bastos"];
  const ranks = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
  const rankNames = { 1: "As", 2: "Dos", 3: "Tres", 4: "Cuatro", 5: "Cinco", 6: "Seis", 7: "Siete", 10: "Sota", 11: "Caballo", 12: "Rey" };
  const points = { 1: 11, 3: 10, 12: 4, 11: 3, 10: 2 };
  const power = { 1: 10, 3: 9, 12: 8, 11: 7, 10: 6, 7: 5, 6: 4, 5: 3, 4: 2, 2: 1 };

  function shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const other = Math.floor(Math.random() * (index + 1));
      [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
  }

  function deck() {
    return shuffle(suits.flatMap(suit => ranks.map(rank => ({ id: `${suit}-${rank}`, suit, rank }))));
  }

  function cardName(card) { return `${rankNames[card.rank]} de ${card.suit}`; }
  function cardSrc(card) { return `assets/cards/${card.suit}-${card.rank}.webp`; }
  function cardPoints(card) { return points[card.rank] || 0; }
  function cardPower(card) { return power[card.rank] || 0; }

  function beats(challenger, incumbent, leadSuit, trumpSuit = "") {
    const challengerTrump = challenger.suit === trumpSuit;
    const incumbentTrump = incumbent.suit === trumpSuit;
    if (challengerTrump !== incumbentTrump) return challengerTrump;
    if (challenger.suit === incumbent.suit) return cardPower(challenger) > cardPower(incumbent);
    if (incumbentTrump) return false;
    return challenger.suit === leadSuit && incumbent.suit !== leadSuit;
  }

  function trickWinner(entries, trumpSuit = "") {
    const leadSuit = entries[0].card.suit;
    let best = entries[0];
    entries.slice(1).forEach(entry => { if (beats(entry.card, best.card, leadSuit, trumpSuit)) best = entry; });
    return best.player;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function fitHand(container, selector = ".sc-card") {
    if (!container) return;
    const cards = [...container.querySelectorAll(selector)];
    if (!cards.length) return;
    const available = Math.max(180, container.clientWidth - 12);
    const width = Math.max(42, Math.min(82, available / Math.min(cards.length, 5)));
    const step = cards.length > 1 ? Math.max(18, Math.min(width, (available - width) / (cards.length - 1))) : width;
    container.style.setProperty("--card-width", `${width}px`);
    container.style.setProperty("--card-overlap", `${step - width}px`);
  }

  function renderHand(container, cards, options = {}) {
    const disabled = options.disabled || (() => false);
    const legal = options.legal || (() => true);
    container.innerHTML = cards.map((card, index) => `<button type="button" class="sc-card ${legal(card, index) ? "legal" : "illegal"}" data-card-index="${index}" aria-label="${escapeHtml(cardName(card))}" ${disabled(card, index) || !legal(card, index) ? "disabled" : ""}><img src="${cardSrc(card)}" alt="${escapeHtml(cardName(card))}" draggable="false"></button>`).join("");
    container.querySelectorAll("[data-card-index]").forEach(button => button.addEventListener("click", () => options.onPlay?.(Number(button.dataset.cardIndex))));
    requestAnimationFrame(() => fitHand(container));
  }

  function passScreen(title, subtitle, onReveal) {
    const screen = document.getElementById("passScreen");
    if (!screen) { onReveal?.(); return; }
    screen.querySelector("[data-pass-title]").textContent = title;
    screen.querySelector("[data-pass-copy]").textContent = subtitle || "Pasa el dispositivo sin enseñar la pantalla.";
    screen.hidden = false;
    const button = screen.querySelector("[data-pass-reveal]");
    const reveal = () => {
      button.removeEventListener("click", reveal);
      screen.hidden = true;
      onReveal?.();
    };
    button.addEventListener("click", reveal);
  }

  let toastTimer = 0;
  function toast(message) {
    let region = document.getElementById("gameToast");
    if (!region) {
      region = document.createElement("div");
      region.id = "gameToast";
      region.className = "game-toast";
      region.setAttribute("aria-live", "polite");
      document.body.append(region);
    }
    clearTimeout(toastTimer);
    region.textContent = message;
    region.classList.add("visible");
    toastTimer = setTimeout(() => region.classList.remove("visible"), 2200);
  }

  addEventListener("resize", () => document.querySelectorAll(".sc-hand").forEach(hand => fitHand(hand)), { passive: true });

  window.SalaCeroGame = Object.freeze({ suits, ranks, rankNames, points, power, shuffle, deck, cardName, cardSrc, cardPoints, cardPower, beats, trickWinner, escapeHtml, fitHand, renderHand, passScreen, toast });
})();
