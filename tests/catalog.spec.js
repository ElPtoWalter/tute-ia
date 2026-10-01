import { expect, test } from "./fixtures.js";

const gamePages = [
  "tute.html", "brisca.html", "generala.html", "chinchon.html", "escoba.html", "culo.html",
  "cinquillo.html", "pocha.html", "burro.html", "poker.html", "blackjack.html", "siete-media.html",
  "es-un-10.html", "impostor.html", "chao-pescao.html", "mentiroso-dados.html", "la-bomba.html",
  "quien-mas-probable.html", "mentiroso-cartas.html", "presidente.html", "piramide.html", "tabu.html",
  "password.html", "ruleta-caos.html", "juicio-anton.html", "charadas.html", "pictionary.html", "ruleta-casino.html"
];

async function openWithoutRuntimeErrors(page, path) {
  const errors = [];
  const onPageError = error => errors.push(`pageerror: ${error.message}`);
  const onConsole = message => { if (message.type() === "error") errors.push(`console: ${message.text()}`); };
  const onFailed = request => {
    const reason = request.failure()?.errorText || "unknown";
    if (/ERR_ABORTED|NS_BINDING_ABORTED|cancelled/i.test(reason) && (request.resourceType() === "media" || /casino-jazz-(?:lite|background)\.mp3/.test(request.url()))) return;
    errors.push(`requestfailed: ${request.url()} · ${reason}`);
  };
  const onResponse = response => {
    if (response.url().startsWith("http://127.0.0.1:4173") && response.status() >= 400) errors.push(`response: ${response.status()} ${response.url()}`);
  };
  page.on("pageerror", onPageError);
  page.on("console", onConsole);
  page.on("requestfailed", onFailed);
  page.on("response", onResponse);
  const response = await page.goto(`/${path}`, { waitUntil: "domcontentloaded" });
  expect(response?.status(), `${path} must load`).toBeLessThan(400);
  await page.waitForTimeout(280);
  page.off("pageerror", onPageError);
  page.off("console", onConsole);
  page.off("requestfailed", onFailed);
  page.off("response", onResponse);
  expect(errors, `${path} emitted runtime or resource errors`).toEqual([]);
}

async function expectResponsiveLayout(page, path) {
  const result = await page.evaluate(() => {
    const root = document.documentElement;
    const overflow = Math.max(root.scrollWidth, document.body?.scrollWidth || 0) - innerWidth;
    const badControls = [...document.querySelectorAll("a,button,input,select,textarea")].flatMap(element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0 || rect.width < 1 || rect.height < 1) return [];
      if (rect.bottom <= 0 || rect.top >= innerHeight) return [];
      const horizontal = rect.left < -4 || rect.right > innerWidth + 4;
      const fixedVertical = ["fixed", "sticky"].includes(style.position) && (rect.top < -4 || rect.bottom > innerHeight + 4);
      return horizontal || fixedVertical ? [{ label: element.id || element.textContent?.trim().slice(0, 45) || element.tagName, rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom } }] : [];
    });
    const brokenImages = [...document.images].filter(image => image.complete && image.naturalWidth === 0).map(image => image.getAttribute("src"));
    return { overflow, badControls, brokenImages };
  });
  if (result.overflow > 4) console.log('LAYOUT DIAGNOSTIC', path, await page.evaluate(() => [...document.querySelectorAll('body *')].flatMap(el => { const r=el.getBoundingClientRect(),s=getComputedStyle(el); return s.display!=='none' && r.width>0 && (r.right>innerWidth+4 || r.left < -4) ? [{tag:el.tagName,id:el.id,class:el.className,left:r.left,right:r.right,width:r.width}] : []; }).slice(0,30)));
  expect(result.overflow, `${path} has horizontal document overflow`).toBeLessThanOrEqual(4);
  expect(result.badControls, `${path} has visible controls outside the viewport`).toEqual([]);
  expect(result.brokenImages, `${path} has broken images`).toEqual([]);
}

async function expectHandVisible(page, selector) {
  let result;
  // El nodo puede existir antes de que termine el cambio de pantalla/turno. Esperar
  // geometría visible y reutilizar esa misma muestra evita leer otra fase del render.
  await expect.poll(async () => {
    result = await page.locator(selector).evaluateAll(cards => cards.map(card => {
      const rect = card.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
    }));
    return result.length > 0 && result.every(rect => rect.width > 20 && rect.height > 30);
  }, { timeout: 8_000, message: `${selector} debe mostrar cartas con tamaño real` }).toBe(true);
  expect(result.length).toBeGreaterThan(0);
  for (const rect of result) {
    expect(rect.width).toBeGreaterThan(20);
    expect(rect.height).toBeGreaterThan(30);
    expect(rect.left).toBeGreaterThanOrEqual(-4);
    expect(rect.right).toBeLessThanOrEqual((await page.evaluate(() => innerWidth)) + 4);
    expect(rect.top).toBeGreaterThanOrEqual(-4);
    expect(rect.bottom).toBeLessThanOrEqual((await page.evaluate(() => innerHeight)) + 4);
  }
}

test.describe.parallel("catálogo responsive", () => {
  for (const path of gamePages) {
    test(`${path} carga, enlaza a inicio y no desborda`, async ({ page }) => {
      await openWithoutRuntimeErrors(page, path);
      await expect(page).toHaveTitle(/\S+/);
      await expect(page.locator('a[href^="index.html"]').first()).toBeAttached();
      await expectResponsiveLayout(page, path);
    });
  }
});

test("la portada tiene 28 juegos únicos, filtros múltiples y ajustes accesibles", async ({ page }) => {
  await openWithoutRuntimeErrors(page, "index.html");
  const cards = page.locator("[data-game-card]");
  await expect(cards).toHaveCount(28);
  expect(await cards.evaluateAll(items => new Set(items.map(item => item.getAttribute("href"))).size)).toBe(28);
  await page.locator('[data-filter="cartas"]').click();
  expect(await page.locator("[data-game-card]:visible").count()).toBeGreaterThan(10);
  await page.locator("#gameSearch").fill("charadas");
  await expect(page.locator('[data-game-card="charadas"]')).toBeVisible();
  await expect(page.locator('[data-game-card="tute"]')).toBeHidden();
  await page.locator("[data-open-settings]").first().click();
  await expect(page.locator("#settingsDialog")).toBeVisible();
  await page.locator("#playerName").fill("Edu");
  await page.locator("#settingsForm").evaluate(form => form.requestSubmit());
  await expect(page.locator("#settingsDialog")).toBeHidden();
  await expectResponsiveLayout(page, "index.html");
});

function onlyPrimaryMobile(testInfo) {
  test.skip(!["mobile-390x844", "firefox-smoke", "webkit-smoke"].includes(testInfo.project.name), "Los flujos se ejecutan una vez; la carga se prueba en los cinco viewports.");
}

test("@smoke Tute inicia y muestra la mano completa", async ({ page }, testInfo) => {
  onlyPrimaryMobile(testInfo); await openWithoutRuntimeErrors(page, "tute.html");
  await page.locator("#classicModeButton").click();
  await page.locator('#variantGrid [data-variant-id="house"]').click();
  await page.locator("#startButton").click();
  await expect(page.locator("#appShell")).toBeVisible();
  await expect(page.locator("#playerHand .playing-card")).toHaveCount(8, { timeout: 15_000 });
  await expectHandVisible(page, "#playerHand .playing-card");
});

test("@smoke Generala inicia una mesa", async ({ page }, testInfo) => {
  onlyPrimaryMobile(testInfo); await openWithoutRuntimeErrors(page, "generala.html");
  await page.locator("#gSoloMode").click(); await page.locator("#gSetupForm").evaluate(form => form.requestSubmit());
  await expect(page.locator("#gGame")).toBeVisible(); await expectResponsiveLayout(page, "generala:game");
});

test("@smoke Chinchón inicia y muestra cartas", async ({ page }, testInfo) => {
  onlyPrimaryMobile(testInfo); await openWithoutRuntimeErrors(page, "chinchon.html");
  await page.locator("#cSolo").click(); await page.locator("#cSetupForm").evaluate(form => form.requestSubmit());
  await expect(page.locator("#cGame")).toBeVisible(); await expectHandVisible(page, "#cHand .sg-card");
});

test("@smoke Escoba inicia una mesa", async ({ page }, testInfo) => {
  onlyPrimaryMobile(testInfo); await openWithoutRuntimeErrors(page, "escoba.html");
  await page.locator("#eSolo").click(); await page.locator("#eSetupForm").evaluate(form => form.requestSubmit());
  await expect(page.locator("#eGame")).toBeVisible(); await expect(page.locator("#eHand .sg-card")).toHaveCount(3);
});

test("@smoke Culo inicia y mantiene la mano dentro del móvil", async ({ page }, testInfo) => {
  onlyPrimaryMobile(testInfo); await openWithoutRuntimeErrors(page, "culo.html");
  await page.locator("#pSolo").click(); await page.locator("#pSetupForm").evaluate(form => form.requestSubmit());
  await expect(page.locator("#pGame")).toBeVisible(); await expectHandVisible(page, "#pHand .sg-card");
});

test("@smoke Póker inicia Texas Hold'em", async ({ page }, testInfo) => {
  onlyPrimaryMobile(testInfo); await openWithoutRuntimeErrors(page, "poker.html");
  await page.locator("#pkSolo").click(); await page.locator("#pkSetupForm").evaluate(form => form.requestSubmit());
  await expect(page.locator("#pkGame")).toBeVisible(); await expect(page.locator("#pkPrivateHand")).toBeVisible();
});

test("@smoke Blackjack abre la ronda de apuestas", async ({ page }, testInfo) => {
  onlyPrimaryMobile(testInfo); await openWithoutRuntimeErrors(page, "blackjack.html");
  await page.locator('[data-bj-mode="solo"]').click(); await page.locator("#bjStart").click();
  await expect(page.locator("#bjGame")).toBeVisible(); await expect(page.locator("#bjBetDialog")).toBeVisible();
});

test("@smoke Brisca difícil reparte tres cartas y abre reglas", async ({ page }, testInfo) => {
  onlyPrimaryMobile(testInfo); await openWithoutRuntimeErrors(page, "brisca.html");
  await page.locator("#brDifficulty").selectOption("hard"); await page.locator("#brSetupForm").evaluate(form => form.requestSubmit());
  await expect(page.locator("#brHand .br-card")).toHaveCount(3); await expectHandVisible(page, "#brHand .br-card");
  await page.locator("#brRulesButton").click(); await expect(page.locator("#brRulesDialog")).toBeVisible(); await page.locator("#brRulesClose").click();
});

test("@smoke Pocha inicia apuestas y muestra mano, triunfo y marcador", async ({ page }, testInfo) => {
  onlyPrimaryMobile(testInfo); await openWithoutRuntimeErrors(page, "pocha.html");
  await page.locator("#poSetupForm").evaluate(form => form.requestSubmit());
  await expect(page.locator("#poGame")).toBeVisible(); await expect(page.locator("#poTrumpCard")).toHaveAttribute("src", /assets\/cards\//);
  await expectHandVisible(page, "#poHand .sc-card"); await expect(page.locator("#poScore .score-chip")).toHaveCount(4);
});

test("@smoke Cinquillo inicia con secuencias legales", async ({ page }, testInfo) => {
  onlyPrimaryMobile(testInfo); await openWithoutRuntimeErrors(page, "cinquillo.html");
  await page.locator("#cqSetupForm").evaluate(form => form.requestSubmit());
  await expect(page.locator("#cqGame")).toBeVisible(); await expect(page.locator("#cqBoard .cq-suit-row")).toHaveCount(4);
  await expectHandVisible(page, "#cqHand .sc-card");
});

test("@smoke Burro, Charadas y Dibuja arrancan sus controles principales", async ({ page }, testInfo) => {
  onlyPrimaryMobile(testInfo);
  await openWithoutRuntimeErrors(page, "burro.html"); await page.locator("#buSetupForm").evaluate(form => form.requestSubmit()); await expect(page.locator("#passScreen")).toBeVisible();
  await openWithoutRuntimeErrors(page, "charadas.html"); await page.locator("#chSetupForm").evaluate(form => form.requestSubmit()); await expect(page.locator("#chCorrect")).toBeVisible(); await expect(page.locator("#chPass")).toBeVisible();
  await openWithoutRuntimeErrors(page, "pictionary.html"); await page.locator("#piSetupForm").evaluate(form => form.requestSubmit()); await expect(page.locator("#piSecretDialog")).toBeVisible(); await page.locator("#piReveal").click(); await page.locator("#piReveal").click(); await expect(page.locator("#piCanvas")).toBeVisible(); await expect(page.locator("#piWordLabel")).toHaveText("Oculta");
});

test("Brisca conserva las tres cartas al cambiar de orientación", async ({ page }, testInfo) => {
  onlyPrimaryMobile(testInfo); await page.setViewportSize({ width: 390, height: 844 }); await openWithoutRuntimeErrors(page, "brisca.html");
  await page.locator("#brSetupForm").evaluate(form => form.requestSubmit()); await expectHandVisible(page, "#brHand .br-card");
  await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(180); await expectHandVisible(page, "#brHand .br-card"); await expectResponsiveLayout(page, "brisca:landscape");
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(180); await expectHandVisible(page, "#brHand .br-card"); await expectResponsiveLayout(page, "brisca:portrait-restored");
});

test("las reglas numéricas de Brisca y los contratos de los juegos nuevos son correctos", async ({ page }, testInfo) => {
  onlyPrimaryMobile(testInfo); await openWithoutRuntimeErrors(page, "brisca.html");
  const brisca = await page.evaluate(() => ({ points: Object.fromEntries([1,3,10,11,12].map(rank => [rank, window.SalaCeroBriscaDebug.points(rank)])), two: window.SalaCeroBriscaDebug.deckFor(2).length, three: window.SalaCeroBriscaDebug.deckFor(3).length }));
  expect(brisca).toEqual({ points: { 1:11, 3:10, 10:2, 11:3, 12:4 }, two:40, three:39 });
  await openWithoutRuntimeErrors(page, "cinquillo.html"); expect(await page.evaluate(() => typeof window.SalaCeroCinquilloDebug.isLegal)).toBe("function");
  await openWithoutRuntimeErrors(page, "pocha.html"); expect(await page.evaluate(() => typeof window.SalaCeroPochaDebug.validBids)).toBe("function");
  for (const count of [3,4,5,6]) {
    await page.goto("/pocha.html");
    await page.locator("#poPlayers").selectOption(String(count));
    await page.locator("#poSetupForm").evaluate(form => form.requestSubmit());
    const plan = await page.evaluate(() => window.SalaCeroPochaDebug.state.roundPlan);
    const max = Math.floor(40/count);
    expect(plan).toEqual([...Array.from({ length:max }, (_,i) => i+1), ...Array.from({ length:max-1 }, (_,i) => max-1-i)]);
  }
});

test("Dibuja mantiene lienzo y herramientas completos en cada viewport", async ({ page }) => {
  await openWithoutRuntimeErrors(page, "pictionary.html");
  await page.locator("#piSetupForm").evaluate(form => form.requestSubmit());
  await page.locator("#piReveal").click();
  await page.locator("#piReveal").click();
  await expect(page.locator("#piWordLabel")).toHaveText("Oculta");
  const controls = await page.locator("#piCanvas,#piGame button,#piWidth").evaluateAll(items => items.map(item => {
    const rect = item.getBoundingClientRect();
    return { id: item.id, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
  }));
  const viewport = page.viewportSize();
  for (const control of controls) {
    expect(control.left, control.id).toBeGreaterThanOrEqual(0);
    expect(control.right, control.id).toBeLessThanOrEqual(viewport.width);
    expect(control.top, control.id).toBeGreaterThanOrEqual(0);
    expect(control.bottom, control.id).toBeLessThanOrEqual(viewport.height);
  }
});
