(() => {
  "use strict";

  const MOBILE_QUERY = window.matchMedia("(max-width: 760px), (max-height: 520px) and (max-width: 960px)");
  const configurations = [
    { container: ".player-hand", cards: ".playing-card", max: 64, compact: 56, min: 48, edge: 64 },
    { container: ".private-hand", cards: ".local-card", max: 64, compact: 56, min: 48, edge: 64 },
    { container: ".player-multi-hand", cards: ".multi-card", max: 64, compact: 56, min: 48, edge: 64 },
    { container: ".sg-hand", cards: ".sg-card", max: 64, compact: 55, min: 46, edge: 28 },
    { container: ".v23-card-row", cards: ".v23-playing-card", max: 76, compact: 58, min: 46, edge: 28 },
    { container: ".bj-game .hand", cards: ".card", max: 50, compact: 44, min: 34, edge: 20 }
  ];

  let frame = 0;

  function visibleWidth(element) {
    const rect = element.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth || innerWidth;
    return Math.max(0, Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0));
  }

  function fitHand(element, config) {
    const cards = [...element.querySelectorAll(`:scope > ${config.cards}`)];
    if (!MOBILE_QUERY.matches || !cards.length || element.closest(".hidden")) {
      element.style.removeProperty("--v25-card-width");
      element.style.removeProperty("--v25-card-overlap");
      element.removeAttribute("data-v25-card-count");
      return;
    }

    const count = cards.length;
    const width = visibleWidth(element);
    if (width < 80) return;

    const sideSpace = config.edge + (width <= 380 ? 6 : 0);
    const usable = Math.max(62, width - sideSpace);
    let cardWidth = count >= 11 ? config.compact : config.max;
    if (innerHeight <= 520) cardWidth = Math.min(cardWidth, config.compact, 50);
    cardWidth = Math.max(config.min, Math.min(cardWidth, usable));

    const step = count > 1
      ? Math.max(18, Math.min(cardWidth, (usable - cardWidth) / (count - 1)))
      : cardWidth;
    const overlap = Math.min(0, step - cardWidth);

    element.style.setProperty("--v25-card-width", `${cardWidth.toFixed(2)}px`);
    element.style.setProperty("--v25-card-overlap", `${overlap.toFixed(2)}px`);
    element.dataset.v25CardCount = String(count);
  }

  function fitAllHands() {
    frame = 0;
    configurations.forEach(config => {
      document.querySelectorAll(config.container).forEach(element => fitHand(element, config));
    });
  }

  function scheduleFit() {
    if (frame) return;
    frame = window.setTimeout(fitAllHands, 16);
  }

  const observer = window.MutationObserver
    ? new window.MutationObserver(mutations => {
        if (mutations.some(mutation => mutation.type === "childList" || mutation.attributeName === "class")) scheduleFit();
      })
    : null;

  function start() {
    fitAllHands();
    if (observer) {
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    } else {
      window.setInterval(scheduleFit, 250);
    }
    addEventListener("resize", scheduleFit, { passive: true });
    addEventListener("orientationchange", scheduleFit, { passive: true });
    document.fonts?.ready.then(scheduleFit).catch(() => {});
    MOBILE_QUERY.addEventListener?.("change", scheduleFit);
  }

  window.SalaCeroMobile = Object.freeze({ version: "26.0.2", refresh: scheduleFit });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
