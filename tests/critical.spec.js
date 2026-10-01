import {test,expect,primary,layout,home} from './fixtures.js';
async function fast(page){
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(()=>{
    const nativeTimeout=window.setTimeout.bind(window);
    window.setTimeout=(fn,delay,...args)=>nativeTimeout(fn,Math.min(Number(delay)||0,35),...args);
    let seed=27001;Math.random=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
  });
}
test('Tute: mano completa hasta resultado, robo y bazas reales',async({page},info)=>{
  primary(info);test.setTimeout(120000);await fast(page);await page.goto('/tute.html');
  await page.locator('#classicModeButton').click();await page.locator('#variantGrid [data-variant-id="house"]').click();await page.locator('#startButton').click();
  await expect(page.locator('#playerHand .playing-card')).toHaveCount(8,{timeout:15000});
  let played=0,draws=0;
  for(let step=0;step<450;step++){
    if(await page.locator('#resultModal').isVisible())break;
    if(await page.locator('#canteActions .pass-button').isVisible())await page.locator('#canteActions .pass-button').press('Enter');
    else if(await page.locator('#drawButton').isVisible()){await page.locator('#drawButton').press('Enter');draws++;}
    else if(await page.locator('#playerHand [data-playable="true"]').count()){await page.locator('#playerHand [data-playable="true"]').first().press('Enter');played++;}
    await page.waitForTimeout(100);
  }
  await expect(page.locator('#resultModal')).toBeVisible();expect(played).toBeGreaterThanOrEqual(20);expect(draws).toBeGreaterThan(0);
  const scores=await page.locator('#resultPlayerScore,#resultAiScore').allTextContents();expect(scores.map(Number).reduce((a,b)=>a+b,0)).toBeGreaterThanOrEqual(130);
  await page.keyboard.press('Escape');await layout(page);await home(page);
});
test('Brisca: 40 cartas, 20 bazas y exactamente 120 puntos',async({page},info)=>{
  primary(info);test.setTimeout(60000);await fast(page);await page.goto('/brisca.html');await page.locator('#brDifficulty').selectOption('hard');await page.locator('#brSetupForm').evaluate(form=>form.requestSubmit());
  for(let i=0;i<200;i++){
    const s=await page.evaluate(()=>({active:window.SalaCeroBriscaDebug.state.active,current:window.SalaCeroBriscaDebug.state.current,resolving:window.SalaCeroBriscaDebug.state.resolving}));
    if(!s.active)break;if(s.current===0&&!s.resolving)await page.locator('#brHand button').first().press('Enter');await page.waitForTimeout(60);
  }
  await expect(page.locator('#brResultDialog')).toBeVisible();const s=await page.evaluate(()=>window.SalaCeroBriscaDebug.state);
  expect(s.played).toHaveLength(40);expect(s.scores.reduce((a,b)=>a+b,0)).toBe(120);expect(s.hands.flat()).toHaveLength(0);expect(s.stock).toHaveLength(0);
  await page.keyboard.press('Escape');await layout(page);await home(page);
});
test('Cinquillo: desde el cinco de oros hasta una mano vacía, sin jugadas ilegales',async({page},info)=>{
  primary(info);test.setTimeout(60000);await fast(page);await page.goto('/cinquillo.html');await page.locator('#cqSetupForm').evaluate(form=>form.requestSubmit());
  for(let i=0;i<200;i++){
    const s=await page.evaluate(()=>{const d=window.SalaCeroCinquilloDebug;return{active:d.state.active,human:!d.state.players[d.state.current].ai,legal:d.legalIndexes()};});
    if(!s.active)break;
    if(s.human){if(s.legal.length)await page.locator(`#cqHand [data-card-index="${s.legal[0]}"]`).press('Enter');else await page.locator('#cqPass').press('Enter');}
    await page.waitForTimeout(60);
  }
  await expect(page.locator('#cqResult')).toBeVisible();const s=await page.evaluate(()=>window.SalaCeroCinquilloDebug.state);expect(s.hands.some(h=>!h.length)).toBe(true);
  for(const values of Object.values(s.board)){const positions=values.map(n=>[1,2,3,4,5,6,7,10,11,12].indexOf(n));if(positions.length){expect(values).toContain(5);expect(Math.max(...positions)-Math.min(...positions)+1).toBe(positions.length);}}
  expect(Object.values(s.board).flat().length+s.hands.flat().length).toBe(40);await page.keyboard.press('Escape');await layout(page);await home(page);
});
test('Cinquillo con dos: las 20 cartas caben en cada ancho',async({page})=>{
  await page.goto('/cinquillo.html');await page.locator('#cqPlayers').selectOption('2');await page.locator('#cqSetupForm').evaluate(form=>form.requestSubmit());await expect(page.locator('#cqHand .sc-card')).toHaveCount(20);
  const cards=await page.locator('#cqHand .sc-card').evaluateAll(items=>items.map(el=>({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right})));const width=page.viewportSize().width;
  for(const c of cards){expect(c.left).toBeGreaterThanOrEqual(-4);expect(c.right).toBeLessThanOrEqual(width+4);}await layout(page);
});
test('Pocha completa: apuestas válidas, asistencia, puntuación y clasificación',async({page},info)=>{
  primary(info);test.setTimeout(120000);await fast(page);await page.goto('/pocha.html');await page.locator('#poSetupForm').evaluate(form=>form.requestSubmit());
  let rounds=0,plays=0;let scores=[0,0,0,0];
  for(let i=0;i<900;i++){
    const s=await page.evaluate(()=>{const d=window.SalaCeroPochaDebug;return{active:d.state.active,human:!d.state.players[d.state.current].ai,revealed:d.state.revealed,phase:d.state.phase,trick:d.state.trick.length,bids:d.validBids(),legal:d.legalIndexes(),players:d.state.players,roundCards:d.state.roundCards};});
    if(!s.active)break;
    if(await page.locator('#poRoundDialog').isVisible()){
      expect(s.players.reduce((a,p)=>a+p.tricks,0)).toBe(s.roundCards);
      s.players.forEach((p,n)=>{const expected=p.bid===p.tricks?10+5*p.tricks:-5*Math.abs(p.bid-p.tricks);expect(p.score-scores[n]).toBe(expected);});scores=s.players.map(p=>p.score);rounds++;
      await page.locator('#poNextRound').click();
    }else if(s.human&&s.revealed){
      if(s.phase==='bid')await page.locator(`#poBidOptions [data-bid="${s.bids[0]}"]`).press('Enter');
      else if(s.legal.length){await page.locator(`#poHand [data-card-index="${s.legal[0]}"]`).press('Enter');plays++;}
    }
    await page.waitForTimeout(50);
  }
  await expect(page.locator('#poResult')).toBeVisible();expect(rounds).toBe(19);expect(plays).toBe(100);await page.keyboard.press('Escape');await layout(page);await home(page);
});
test('Blackjack: repartir, plantarse, banca y saldo liquidado',async({page},info)=>{
  primary(info);await fast(page);await page.goto('/blackjack.html');await page.locator('[data-bj-mode="solo"]').click();await page.locator('#bjStart').click();await page.locator('#bjDeal').click();
  if(await page.locator('#bjStand').isEnabled())await page.locator('#bjStand').click();await expect(page.locator('#bjResultDialog')).toBeVisible();
  const s=await page.evaluate(()=>JSON.parse(localStorage.getItem('salaCeroBlackjackV213')));
  const value=cards=>{let v=0,aces=0;cards.forEach(c=>{v+=c.rank===14?11:Math.min(c.rank,10);if(c.rank===14)aces++;});while(v>21&&aces-- >0)v-=10;return v;};
  const dealer=value(s.dealer.cards);expect(dealer).toBeGreaterThanOrEqual(17);
  let expected=1000;for(const h of s.players[0].hands){const v=value(h.cards);expected-=h.bet;if(v>21)continue;if(h.natural&&!s.dealer.natural)expected+=Math.floor(h.bet*2.5);else if(s.dealer.natural&&!h.natural)continue;else if(dealer>21||v>dealer)expected+=h.bet*2;else if(v===dealer)expected+=h.bet;}
  expect(s.players[0].stack).toBe(expected);await page.keyboard.press('Escape');await layout(page);await home(page);
});
test('Póker: acción real y orientación ida y vuelta',async({page},info)=>{
  primary(info);await page.goto('/poker.html');await page.locator('#pkSolo').click();await page.locator('#pkSpeed').selectOption('fast');await page.locator('#pkSetupForm').evaluate(form=>form.requestSubmit());
  await expect(page.locator('#pkCheckCall')).toBeEnabled({timeout:15000});await page.locator('#pkCheckCall').click();
  for(const viewport of [{width:844,height:390},{width:390,height:844}]){await page.setViewportSize(viewport);await layout(page);await expect(page.locator('#pkPrivateHand')).toBeVisible();}
  await home(page);
});
test('Generala y Chinchón: primera acción y regreso al catálogo',async({page},info)=>{
  primary(info);await page.goto('/generala.html');await page.locator('#gSoloMode').click();await page.locator('#gSetupForm').evaluate(form=>form.requestSubmit());await page.locator('#gRollButton').click();await expect(page.locator('#gRollCounter')).toHaveText('1 / 3');await layout(page);await home(page);
  await page.goto('/chinchon.html');await page.locator('#cSolo').click();await page.locator('#cSetupForm').evaluate(form=>form.requestSubmit());await expect(page.locator('#cStock')).toBeEnabled({timeout:15000});await page.locator('#cStock').click();await expect(page.locator('#cHand .sg-card')).toHaveCount(8,{timeout:15000});await page.locator('#cSort').click();await layout(page);await home(page);
});
test('Dibuja: Pointer Events, dibujo conservado al rotar y deshacer',async({page},info)=>{
  primary(info);await page.goto('/pictionary.html');await page.locator('#piSetupForm').evaluate(form=>form.requestSubmit());await page.locator('#piReveal').click();await page.locator('#piReveal').click();
  // Entrada real del navegador: genera Pointer Events, sin pintar por la API canvas.
  const rect=await page.locator('#piCanvas').boundingBox();
  await page.mouse.move(rect.x+rect.width*.2,rect.y+rect.height*.2);await page.mouse.down();
  await page.mouse.move(rect.x+rect.width*.5,rect.y+rect.height*.5,{steps:10});await page.mouse.move(rect.x+rect.width*.8,rect.y+rect.height*.3,{steps:10});await page.mouse.up();
  const ink=()=>page.locator('#piCanvas').evaluate(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i]<150)n++;return n;});
  expect(await ink()).toBeGreaterThan(100);
  for(const v of [{width:844,height:390},{width:390,height:844}]){await page.setViewportSize(v);await page.waitForTimeout(200);expect(await ink()).toBeGreaterThan(100);await layout(page);}
  await page.locator('#piUndo').click();await expect.poll(ink).toBe(0);await page.locator('#piCorrect').click();await expect(page.locator('#piScore')).toHaveText('1');await page.keyboard.press('Escape');await home(page);
});
