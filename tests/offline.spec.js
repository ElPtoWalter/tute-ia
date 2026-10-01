import {test,expect} from './fixtures.js';
import fs from 'node:fs';
test('copia PWA incluye saldo y preferencias Sala Cero sin incluir datos ajenos',async({page})=>{
  await page.goto('/ruleta-casino.html');await page.locator('#startSession').click();await page.locator('[data-bet="red"]').click();
  await page.evaluate(()=>localStorage.setItem('otraWebPrueba','no exportar'));
  await page.locator('#pwaControlButton').click();const download=page.waitForEvent('download');await page.locator('#pwaExportAction').click();
  const file=await download;const payload=JSON.parse(fs.readFileSync(await file.path(),'utf8'));
  expect(JSON.parse(payload.preferences.salaCeroRuletaV27).players[0].bets).toEqual({red:5});
  expect(payload.preferences.salaCeroCasualV261).toBeTruthy();expect(payload.preferences.otraWebPrueba).toBeUndefined();
});
test('28 juegos offline, todos los recursos de ruleta y una ronda',async({page,context})=>{
  test.setTimeout(120000);await page.goto('/index.html');
  await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller)),{timeout:45000}).toBe(true);
  await expect.poll(()=>page.evaluate(async()=> (await (await caches.open('tute-ia-shell-27.0.0')).keys()).length),{timeout:45000}).toBe(191);
  const links=await page.locator('[data-game-card]').evaluateAll(cards=>cards.map(c=>c.getAttribute('href')));expect(links).toHaveLength(28);
  await context.setOffline(true);await page.reload();await expect(page.locator('[data-game-card]')).toHaveCount(28);
  for(const href of links){await page.goto('/'+href);await expect(page.locator('body')).toHaveAttribute('data-game',href.replace('.html',''));expect(await page.evaluate(()=>typeof window.SalaCeroPrefs)).toBe('object');}
  await page.goto('/ruleta-casino.html');await page.locator('#startSession').click();await page.locator('[data-bet="red"]').click();await page.locator('#spin').click();await expect(page.locator('#table')).toHaveAttribute('data-state','RESULT');
  expect(await page.evaluate(()=>[...document.images].filter(i=>i.complete&&!i.naturalWidth).length)).toBe(0);
  const names=await page.evaluate(()=>caches.keys());expect(names.some(n=>n.includes('26.'))).toBe(false);
});
test('una actualización espera ACTUALIZAR, conserva apuestas y limpia cachés antiguos',async({page,context})=>{
  test.setTimeout(120000);let version='26.1.3';
  const source=fs.readFileSync('sw.js','utf8');
  await context.route('**/sw.js',route=>route.fulfill({contentType:'application/javascript',body:source.replace('const VERSION = "27.0.0"',`const VERSION = "${version}"`),headers:{'Cache-Control':'no-store'}}));
  await page.goto('/ruleta-casino.html');await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller)),{timeout:45000}).toBe(true);
  await page.locator('#startSession').click();await page.locator('[data-bet="red"]').click();version='27.0.0';
  await page.evaluate(async()=>{const registration=await navigator.serviceWorker.getRegistration();await registration.update();});
  await expect(page.locator('#pwaUpdateBanner')).toBeVisible({timeout:45000});await expect(page.locator('#stake')).toHaveText('5');
  const navigation=page.waitForEvent('load');await page.locator('#pwaUpdateBanner button').click();await navigation;
  await expect(page.locator('#resumeSession')).toBeVisible();await page.locator('#resumeSession').click();await expect(page.locator('#stake')).toHaveText('5');
  await expect.poll(()=>page.evaluate(()=>caches.keys())).toEqual(expect.arrayContaining(['tute-ia-shell-27.0.0']));
  expect((await page.evaluate(()=>caches.keys())).some(n=>n.includes('26.1.3'))).toBe(false);
});
