import {chromium,expect} from '@playwright/test';
const base='https://elptowalter.github.io/tute-ia/';
for(let i=0;i<24;i++){
  const response=await fetch(base+'casual.js?release='+process.env.GITHUB_SHA,{cache:'no-store'});
  if(response.ok&&(await response.text()).includes('version: "27.0.0"'))break;
  if(i===23)throw new Error('Pages todavía no sirve v27');await new Promise(resolve=>setTimeout(resolve,5000));
}
const browser=await chromium.launch();
try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.goto(base);await expect(page.locator('[data-game-card]')).toHaveCount(28);
  await page.locator('[data-game-card="ruleta-casino"]').click();await page.locator('#startSession').click();await page.locator('[data-bet="red"]').click();await page.locator('#spin').click();
  await expect(page.locator('#table')).toHaveAttribute('data-state','RESULT');
  const data=await page.evaluate(()=>({version:window.TutePWA.version,number:Number(document.getElementById('wheel').dataset.winner),saved:JSON.parse(localStorage.getItem('salaCeroRuletaV27'))}));
  expect(data.version).toBe('27.0.0');expect(data.number).toBeGreaterThanOrEqual(0);expect(data.number).toBeLessThanOrEqual(36);expect([495,505]).toContain(data.saved.players[0].balance);
  await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller)),{timeout:60000}).toBe(true);
  await expect.poll(()=>page.evaluate(async()=> (await (await caches.open('tute-ia-shell-27.0.0')).keys()).length),{timeout:60000}).toBe(191);
  await page.screenshot({path:'test-results/ruleta-publicada.png',fullPage:true});
  await context.setOffline(true);await page.reload();await page.locator('#resumeSession').click();await expect(page.locator('#balance')).toHaveText(String(data.saved.players[0].balance));
  expect(errors).toEqual([]);console.log(JSON.stringify({published:true,version:data.version,games:28,offline:true,number:data.number,balance:data.saved.players[0].balance}));
}finally{await browser.close();}
