import { expect, test } from "@playwright/test";

const gamePages = [
  "tute.html", "brisca.html", "generala.html", "chinchon.html", "escoba.html", "culo.html",
  "poker.html", "es-un-10.html", "blackjack.html", "impostor.html", "chao-pescao.html",
  "mentiroso-dados.html", "siete-media.html", "la-bomba.html", "quien-mas-probable.html",
  "mentiroso-cartas.html", "presidente.html", "piramide.html", "tabu.html", "password.html",
  "ruleta-caos.html", "juicio-anton.html"
];

async function openWithoutRuntimeErrors(page, path) {
  const errors = [];
  page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
  page.on("console", message => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  const response = await page.goto(`/${path}`, { waitUntil: "domcontentloaded" });
  expect(response?.status(), `${path} must load`).toBeLessThan(400);
  await page.waitForTimeout(250);
  expect(errors, `${path} emitted JavaScript errors`).toEqual([]);
}

async function expectResponsiveLayout(page, path) {
  const result = await page.evaluate(() => {
    const root = document.documentElement;
    const overflow = Math.max(root.scrollWidth, document.body?.scrollWidth || 0) - innerWidth;
    const badControls = [...document.querySelectorAll("a,button,input,select,textarea")].flatMap(element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0 || rect.width < 1 || rect.height < 1) return [];
      const intersectsScreen = rect.bottom > 0 && rect.top < innerHeight;
      if (!intersectsScreen) return [];
      const horizontal = rect.left < -4 || rect.right > innerWidth + 4;
      const fixedVertical = ["fixed", "sticky"].includes(style.position) && (rect.top < -4 || rect.bottom > innerHeight + 4);
      return horizontal || fixedVertical ? [{ label: element.id || element.textContent?.trim().slice(0, 45) || element.tagName, rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom } }] : [];
    });
    const brokenImages = [...document.images]
      .filter(image => image.complete && image.naturalWidth === 0)
      .map(image => image.getAttribute("src"));
    return { overflow, badControls, brokenImages };
  });
  expect(result.overflow, `${path} has horizontal document overflow`).toBeLessThanOrEqual(4);
  expect(result.badControls, `${path} has controls outside the viewport`).toEqual([]);
  expect(result.brokenImages, `${path} has broken images`).toEqual([]);
}

test.describe.parallel("catálogo responsive", () => {
  for (const path of gamePages) {
    test(`${path} carga sin errores ni desbordes`, async ({ page }) => {
      await openWithoutRuntimeErrors(page, path);
      await expect(page).toHaveTitle(/Sala Cero|Tute|Generala|Brisca/i);
      await expectResponsiveLayout(page, path);
    });
  }
});

test("@smoke Brisca reparte tres cartas", async ({ page }) => {
  await openWithoutRuntimeErrors(page, "brisca.html");
  await page.locator("#brSetupForm").evaluate(form => form.requestSubmit());
  await expect(page.locator("#brGame")).toBeVisible();
  await expect(page.locator("#brHand .br-card")).toHaveCount(3);
  await expect(page.locator("#brTrumpCard")).toHaveAttribute("src", /assets\/cards\//);
  await expectResponsiveLayout(page, "brisca.html:partida");
});

test("@smoke los juegos principales inician una mesa", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390x844", "El flujo se cubre una vez; el catálogo prueba los cuatro viewports.");

  await openWithoutRuntimeErrors(page, "tute.html");
  await page.locator("#classicModeButton").click();
  await page.locator('#variantGrid [data-variant-id="house"]').click();
  await page.locator("#startButton").click();
  await expect(page.locator("#appShell")).toBeVisible();

  await openWithoutRuntimeErrors(page, "generala.html");
  await page.locator("#gSoloMode").click();
  await page.locator("#gSetupForm").evaluate(form => form.requestSubmit());
  await expect(page.locator("#gGame")).toBeVisible();

  await openWithoutRuntimeErrors(page, "chinchon.html");
  await page.locator("#cSolo").click();
  await page.locator("#cSetupForm").evaluate(form => form.requestSubmit());
  await expect(page.locator("#cGame")).toBeVisible();

  await openWithoutRuntimeErrors(page, "blackjack.html");
  await page.locator('[data-bj-mode="solo"]').click();
  await page.locator("#bjStart").click();
  await expect(page.locator("#bjGame")).toBeVisible();
  await expect(page.locator("#bjBetDialog")).toBeVisible();
});

test("@smoke reglas de Brisca y estadísticas globales", async ({ page }) => {
  await openWithoutRuntimeErrors(page, "brisca.html");
  const rules = await page.evaluate(() => ({
    points: Object.fromEntries([1, 3, 10, 11, 12].map(rank => [rank, window.SalaCeroBriscaDebug.points(rank)])),
    twoPlayers: window.SalaCeroBriscaDebug.deckFor(2).length,
    threePlayers: window.SalaCeroBriscaDebug.deckFor(3).length
  }));
  expect(rules.points).toEqual({ 1: 11, 3: 10, 10: 2, 11: 3, 12: 4 });
  expect(rules.twoPlayers).toBe(40);
  expect(rules.threePlayers).toBe(39);
  expect(await page.evaluate(() => window.SalaCeroStats.getSummary().catalogSize)).toBe(22);
});
