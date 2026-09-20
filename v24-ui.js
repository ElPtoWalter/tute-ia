(() => {
  "use strict";

  const fileName = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const isHome = fileName === "" || fileName === "index.html";
  document.body.dataset.page = fileName.replace(/\.html$/, "") || "index";

  const fold = value => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  function mountDiscovery() {
    const firstCatalog = document.querySelector("#clasicos");
    const games = [...document.querySelectorAll("a.hub-game")];
    if (!firstCatalog || !games.length || document.querySelector(".v24-discovery")) return;

    const categories = {
      todos: games.map(game => game.getAttribute("href")),
      cartas: ["tute.html", "chinchon.html", "escoba.html", "culo.html", "poker.html", "blackjack.html", "siete-media.html", "mentiroso-cartas.html", "presidente.html", "piramide.html"],
      party: ["es-un-10.html", "impostor.html", "chao-pescao.html", "la-bomba.html", "quien-mas-probable.html", "ruleta-caos.html", "juicio-anton.html"],
      palabras: ["tabu.html", "password.html"],
      dados: ["generala.html", "mentiroso-dados.html"]
    };

    const discovery = document.createElement("section");
    discovery.className = "v24-discovery";
    discovery.setAttribute("aria-label", "Buscar y filtrar juegos");
    discovery.innerHTML = `
      <div class="v24-search">
        <span aria-hidden="true">⌕</span>
        <label for="v24GameSearch">Buscar un juego</label>
        <input id="v24GameSearch" type="search" inputmode="search" autocomplete="off" placeholder="Tute, dados, palabras…">
        <output aria-live="polite" for="v24GameSearch">${games.length} juegos</output>
      </div>
      <div class="v24-filters" role="group" aria-label="Filtrar por tipo">
        ${Object.keys(categories).map((key, index) => `<button type="button" data-game-filter="${key}" aria-pressed="${index === 0}">${key[0].toUpperCase()}${key.slice(1)}</button>`).join("")}
      </div>`;
    firstCatalog.before(discovery);

    const search = discovery.querySelector("input");
    const output = discovery.querySelector("output");
    const buttons = [...discovery.querySelectorAll("[data-game-filter]")];
    let activeFilter = "todos";

    games.forEach(game => {
      game.dataset.search = fold(game.textContent);
      game.dataset.href = game.getAttribute("href") || "";
    });

    const update = () => {
      const query = fold(search.value.trim());
      const allowed = new Set(categories[activeFilter]);
      let visible = 0;
      games.forEach(game => {
        const matchesFilter = activeFilter === "todos" || allowed.has(game.dataset.href);
        const matchesQuery = !query || game.dataset.search.includes(query);
        game.hidden = !(matchesFilter && matchesQuery);
        if (!game.hidden) visible += 1;
      });
      output.textContent = `${visible} ${visible === 1 ? "juego" : "juegos"}`;
      document.querySelector(".hub-v23-section")?.classList.toggle("v24-empty-section", !games.some(game => !game.hidden && game.closest(".hub-v23-section")));
      document.querySelector("#clasicos")?.classList.toggle("v24-empty-section", !games.some(game => !game.hidden && game.closest("#clasicos")));
    };

    search.addEventListener("input", update);
    buttons.forEach(button => button.addEventListener("click", () => {
      activeFilter = button.dataset.gameFilter;
      buttons.forEach(item => item.setAttribute("aria-pressed", String(item === button)));
      update();
    }));
  }

  function mountDock() {
    if (!isHome || document.querySelector(".v24-dock")) return;
    const dock = document.createElement("nav");
    dock.className = "v24-dock";
    dock.setAttribute("aria-label", "Accesos rápidos");
    dock.innerHTML = `
      <a href="#main-content" data-v24-dock="top"><span>⌂</span><b>Inicio</b></a>
      <a href="#clasicos" data-v24-dock="games"><span>♣</span><b>Juegos</b></a>
      <a href="career.html"><span>♛</span><b>Carrera</b></a>
      <button type="button" data-v24-profile><span>♠</span><b>Perfil</b></button>`;
    document.body.prepend(dock);
    dock.querySelector("[data-v24-profile]")?.addEventListener("click", () => {
      const trigger = document.querySelector("[data-club-open]");
      if (trigger) trigger.click();
      else location.hash = "personalizacion";
    });
  }

  function enhanceLandmarks() {
    const main = document.querySelector("main");
    if (main && !main.id) main.id = "main-content";
    document.querySelectorAll('a[href="#"]').forEach(link => link.addEventListener("click", event => event.preventDefault()));
  }

  document.addEventListener("DOMContentLoaded", () => {
    enhanceLandmarks();
    if (isHome) {
      mountDiscovery();
      mountDock();
    }
  });
})();
