import { test as base, expect } from '@playwright/test';
export { expect };
export const test=base.extend({
  runtimeGuard: [async ({page},use)=>{
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    page.on('response',r=>{if(r.url().includes('127.0.0.1:4173')&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
    await use(errors);
    expect(errors,'errores durante todo el flujo, no solo la carga').toEqual([]);
  },{auto:true}]
});
export function primary(info){test.skip(!['mobile-390x844','firefox-smoke','webkit-smoke'].includes(info.project.name),'Flujo profundo en el móvil de cada motor; catálogo y ruleta en todos los tamaños.');}
export async function layout(page){
  const overflow=await page.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth);
  expect(overflow,'sin desbordamiento horizontal del documento').toBeLessThanOrEqual(4);
}
export async function home(page){
  if (!await page.locator('a[href="index.html"]:visible').count() && await page.locator('#brandButton').isVisible()) await page.locator('#brandButton').click();
  await page.locator('a[href="index.html"]:visible').first().click();
  await expect(page.locator('[data-game-card]')).toHaveCount(28);
}
