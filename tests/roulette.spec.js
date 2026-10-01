import {test,expect,layout,home} from './fixtures.js';
async function start(page,results=[1],duration=40,count=1,balance='500'){
  await page.addInitScript(({results,duration})=>{window.__SC_ROULETTE_TEST__={results,duration};}, {results,duration});
  await page.goto('/ruleta-casino.html');
  await page.locator('#playerCount').selectOption(String(count));
  await page.locator('#initialBalance').selectOption(balance);
  await page.locator('#startSession').click();
  await expect(page.locator('#table')).toBeVisible();
}
async function wager(page,id){
  if(id.startsWith('straight:'))await page.locator(`[data-bet="${id}"]`).click();
  else if(id.includes(':')&&!id.startsWith('dozen:')&&!id.startsWith('column:')){
    await page.locator('#betMode').selectOption(id.split(':')[0]);
    await page.locator(`[data-number="${id.split(':')[1].split(',')[0]}"]`).click();
    await page.locator(`[data-combination="${id}"]`).click();
    await page.locator('#confirmBet').click();
  }else await page.locator(`[data-bet="${id}"]`).click();
}
async function spin(page){await page.locator('#spin').click();await expect(page.locator('#table')).toHaveAttribute('data-state','RESULT');}
for(const [id,n,returned] of [['red',1,10],['black',2,10],['straight:36',36,180],['split:1,2',2,90],['street:1,2,3',3,60],['corner:1,2,4,5',5,45],['six:1,2,3,4,5,6',6,30],['dozen:2',13,15],['column:3',36,15],['even',2,10],['odd',3,10],['low',18,10],['high',19,10],['straight:0',0,180]]){
  test(`apuesta ${id}: liquidación exacta y bola en ${n}`,async({page})=>{
    await start(page,[n]);await wager(page,id);await expect(page.locator('#stake')).toHaveText('5');await expect(page.locator('#balance')).toHaveText('495');
    await spin(page);await expect(page.locator('#balance')).toHaveText(String(495+returned));await expect(page.locator('#roundResult')).toContainText(`devolución ${returned}`);
    await expect(page.locator('#wheel')).toHaveAttribute('data-winner',String(n));
    const difference=await page.evaluate(()=>{
      const degrees=el=>Number(/rotate\(([-\d.]+)deg\)/.exec(el.style.transform)[1]);
      const wheel=degrees(document.getElementById('wheelRotor')),ball=degrees(document.getElementById('ballRotor'));
      const index=window.SalaCeroRouletteCore.order.indexOf(Number(document.getElementById('wheel').dataset.winner));
      return Math.abs((((ball-wheel-index*360/37)%360)+540)%360-180);
    // Firefox serializa el ángulo CSS con menos decimales; 0.01° < 0.03 px de arco.
    });expect(difference).toBeLessThan(.01);await layout(page);
  });
}
test('cero: todas las apuestas externas pierden',async({page})=>{
  await start(page,[0]);for(const id of ['red','black','even','odd','low','high','dozen:1','dozen:2','dozen:3','column:1','column:2','column:3'])await wager(page,id);
  await spin(page);await expect(page.locator('#balance')).toHaveText('440');await expect(page.locator('#roundResult')).toContainText('-60 netas');
});
test('saldo insuficiente y doblar no dejan cambios parciales',async({page})=>{
  await start(page,[0],40,1,'100');await page.locator('[data-chip="100"]').click();await wager(page,'red');
  await page.locator('#doubleBets').click();await expect(page.locator('#rouletteNotice')).toContainText('Saldo insuficiente');await expect(page.locator('#stake')).toHaveText('100');
  await wager(page,'black');await expect(page.locator('#stake')).toHaveText('100');await expect(page.locator('#balance')).toHaveText('0');
  await spin(page);await expect(page.locator('#spin')).toBeDisabled();await page.locator('#repeatBets').click();await expect(page.locator('#stake')).toHaveText('0');
});
test('acumular, deshacer, doblar, borrar y repetir',async({page})=>{
  await start(page);await wager(page,'red');await wager(page,'red');await expect(page.locator('[data-bet="red"] .zone-stack')).toHaveText('10');
  await page.locator('#undoBet').click();await expect(page.locator('#stake')).toHaveText('5');await page.locator('#doubleBets').click();await expect(page.locator('#stake')).toHaveText('10');
  await page.locator('#clearBets').click();await expect(page.locator('#balance')).toHaveText('500');await page.locator('#undoBet').click();await expect(page.locator('#stake')).toHaveText('10');
  await spin(page);await page.locator('#repeatBets').click();await expect(page.locator('#stake')).toHaveText('10');await expect(page.locator('#balance')).toHaveText('500');
});
test('giro doble y bloqueo de apuestas durante SPINNING',async({page})=>{
  await start(page,[1,2],1400);await wager(page,'red');
  await page.locator('#spin').evaluate(button=>{button.click();button.click();});await expect(page.locator('#table')).toHaveAttribute('data-state','SPINNING');
  for(const id of ['spin','clearBets','repeatBets','doubleBets','undoBet','newSession','betMode'])await expect(page.locator(`#${id}`)).toBeDisabled();
  await expect(page.locator('[data-bet="red"]')).toBeDisabled();await expect(page.locator('#table')).toHaveAttribute('data-state','RESULT');
  await expect(page.locator('#history span')).toHaveCount(1);await expect(page.locator('#balance')).toHaveText('505');
});
test('historial, recarga de apuestas y recuperación de giro una sola vez',async({page})=>{
  await start(page,[1],5000);await wager(page,'red');await page.reload();await page.locator('#resumeSession').click();await expect(page.locator('#stake')).toHaveText('5');
  await page.locator('#spin').click();await page.reload();await page.locator('#resumeSession').click();
  await expect(page.locator('#balance')).toHaveText('505');await expect(page.locator('#history span')).toHaveCount(1);
  await page.reload();await page.locator('#resumeSession').click();await expect(page.locator('#balance')).toHaveText('505');
});
test('nueva sesión, reglas, teclado y preferencias accesibles',async({page})=>{
  await start(page);await page.locator('#repeatBets').press('Enter');await expect(page.locator('#rouletteNotice')).toContainText('no hay apuestas');
  await page.locator('[data-chip="10"]').press('Enter');await expect(page.locator('[data-chip="10"]')).toHaveAttribute('aria-pressed','true');
  await page.locator('[data-bet="red"]').press('Enter');await page.locator('#spin').press('Enter');await expect(page.locator('#table')).toHaveAttribute('data-state','RESULT');
  await page.locator('#repeatBets').press('Enter');await page.locator('#clearBets').press('Enter');await expect(page.locator('#stake')).toHaveText('0');
  await page.locator('#soundToggle').click();await expect(page.locator('#soundToggle')).toHaveAttribute('aria-pressed','false');await page.locator('#hapticsToggle').click();
  await page.locator('#rulesOpen').click();await expect(page.locator('#rulesDialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('#rulesDialog')).toBeHidden();
  await page.locator('#newSession').click();await page.locator('#resetConfirm').click();await expect(page.locator('#setup')).toBeVisible();await expect(page.locator('#resumeSession')).toBeHidden();await home(page);
});
test('local: pasar el móvil, apuestas privadas y saldos independientes',async({page})=>{
  await start(page,[1],40,2);await wager(page,'red');await page.locator('#spin').click();await expect(page.locator('#passScreen')).toBeVisible();await expect(page.locator('#table')).toHaveAttribute('inert','');
  await page.locator('[data-pass-reveal]').click();await wager(page,'black');await page.locator('#spin').click();await spin(page);
  const players=await page.evaluate(()=>JSON.parse(localStorage.getItem('salaCeroRuletaV27')).players);expect(players.map(p=>p.balance)).toEqual([505,495]);
});
test('tapete y fichas: 44 px, etiquetas y rueda completa',async({page},info)=>{
  await start(page);const controls=await page.locator('[data-bet],[data-chip],#spin,#clearBets,#repeatBets,#doubleBets,#undoBet,#betMode').evaluateAll(elements=>elements.map(el=>({label:el.getAttribute('aria-label')||el.textContent.trim(),width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})));
  for(const c of controls){expect(c.label).toBeTruthy();expect(c.width,c.label).toBeGreaterThanOrEqual(43.5);expect(c.height,c.label).toBeGreaterThanOrEqual(43.5);}
  await expect(page.locator('[data-pocket]')).toHaveCount(37);await layout(page);
  await page.screenshot({path:`test-results/ruleta-${info.project.name}.png`,fullPage:true});
});
test('orientación ida y vuelta conserva apuestas; movimiento reducido liquida',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await start(page,[36]);await wager(page,'straight:36');
  for(const viewport of [{width:390,height:844},{width:844,height:390},{width:390,height:844}]){await page.setViewportSize(viewport);await expect(page.locator('#stake')).toHaveText('5');await layout(page);}
  await spin(page);await expect(page.locator('#balance')).toHaveText('675');
});
test('catálogo: filtro casino, búsqueda, reciente y retorno',async({page})=>{
  await page.goto('/index.html');await page.locator('[data-filter="casino"]').click();await expect(page.locator('[data-game-card="ruleta-casino"]')).toBeVisible();
  await page.locator('#gameSearch').fill('Antón');await expect(page.locator('[data-game-card="ruleta-casino"]')).toBeVisible();
  await page.locator('[data-game-card="ruleta-casino"]').click();await home(page);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('salaCeroCasualV261')).recent.some(g=>g.id==='ruleta-casino'))).toBe(true);
  await page.locator('[data-random-game]').first().click();await expect(page.locator('body')).not.toHaveAttribute('data-game','inicio');await home(page);
});
test('el resultado inyectado se ignora fuera del host de automatización',async({page})=>{
  await page.addInitScript(()=>{
    window.__SC_ROULETTE_TEST__={results:[0],duration:10};
    crypto.getRandomValues=buffer=>{buffer[0]=36;return buffer;};
  });
  await page.goto('http://localhost:4173/ruleta-casino.html');await page.locator('#startSession').click();await page.locator('[data-bet="straight:36"]').click();await spin(page);
  await expect(page.locator('#wheel')).toHaveAttribute('data-winner','36');await expect(page.locator('#balance')).toHaveText('675');
});
