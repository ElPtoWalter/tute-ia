(() => {
  "use strict";
  const LABELS = { oros: "OROS", copas: "COPAS", espadas: "ESPADAS", bastos: "BASTOS" };
  let active = null;
  function particleMarkup(count) {
    return Array.from({ length: count }, (_, index) => {
      const angle = Math.round((360 / count) * index + (index % 3) * 5);
      const distance = 90 + (index % 7) * 14;
      const delay = (index % 9) * 45;
      const size = 4 + (index % 4) * 2;
      return `<i style="--angle:${angle}deg;--distance:${distance}px;--delay:${delay}ms;--size:${size}px"></i>`;
    }).join("");
  }
  function closeActive() {
    if (!active) return;
    active.remove();
    active = null;
    document.body.classList.remove("cante-fx-active", "cante-fx-legendary");
  }
  function play({ points = 20, suit = "oros", actorName = "Jugador", setsTrump = false } = {}) {
    closeActive();
    const legendary = Number(points) === 40;
    const overlay = document.createElement("div");
    overlay.className = `cante-fx ${legendary ? "cante-fx-40" : "cante-fx-20"}`;
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-live", "assertive");
    overlay.innerHTML = `<div class="cante-fx-backdrop"></div><div class="cante-fx-rays"></div><div class="cante-fx-particles">${particleMarkup(legendary ? 46 : 20)}</div><section class="cante-fx-stage"><span class="cante-fx-kicker">${legendary ? "CANTE MAYOR" : "CANTE"}</span><div class="cante-fx-cards" aria-hidden="true"><img class="cante-fx-card cante-fx-king" src="assets/cards/${suit}-12.webp" alt=""><span class="cante-fx-seal">${points}</span><img class="cante-fx-card cante-fx-knight" src="assets/cards/${suit}-11.webp" alt=""></div><h2>${legendary ? "¡LAS 40!" : `CANTE DE ${points}`}</h2><p><strong>${actorName}</strong> canta en ${LABELS[suit] || suit.toUpperCase()}</p>${setsTrump ? `<em>${LABELS[suit]} pasa a ser el triunfo</em>` : ""}</section>`;
    document.body.appendChild(overlay);
    active = overlay;
    document.body.classList.add("cante-fx-active");
    if (legendary) document.body.classList.add("cante-fx-legendary");
    navigator.vibrate?.(legendary ? [45,45,90,45,140] : [25,35,55]);
    const duration = legendary ? 2550 : 1550;
    return new Promise(resolve => {
      const finish = () => { if (active === overlay) closeActive(); resolve(); };
      const timer = window.setTimeout(finish, duration + 250);
      overlay.addEventListener("animationend", event => {
        if (event.target === overlay && event.animationName === "canteFxOut") { clearTimeout(timer); finish(); }
      });
      overlay.addEventListener("click", () => { clearTimeout(timer); finish(); }, { once: true });
    });
  }
  window.TuteCanteFX = { play, close: closeActive };
})();
