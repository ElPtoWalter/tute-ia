import test from 'node:test';
import assert from 'node:assert/strict';
import '../../ruleta-core.js';
const R=globalThis.SalaCeroRouletteCore;
const session=(number=1,balance=500,names=['Edu'])=>new R.Session({balance,names,rng:()=>number});
test('rueda europea exacta: 37 números, un cero y colores correctos',()=>{
  assert.deepEqual(R.order,[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26]);
  assert.equal(new Set(R.order).size,37); assert.equal(R.order.filter(n=>R.color(n)==='red').length,18);
  assert.equal(R.color(0),'green'); assert.equal(R.color(36),'red'); assert.equal(R.color(26),'black');
});
for (const [id,number,odds] of [['red',1,1],['black',2,1],['straight:36',36,35],['split:1,2',2,17],['street:1,2,3',3,11],['corner:1,2,4,5',5,8],['six:1,2,3,4,5,6',6,5],['dozen:2',13,2],['column:3',36,2],['even',2,1],['odd',3,1],['low',18,1],['high',19,1],['straight:0',0,35]]) {
  test(`${id}: premio ${odds}:1 más devolución`,()=>{const s=session(number);s.place(id,5);assert.equal(s.player.balance,495);s.spin();const r=s.finish();assert.equal(r.results[0].returned,5*(odds+1));assert.equal(s.player.balance,495+5*(odds+1));assert.equal(s.finish(),null);});
}
test('cero pierde todas las externas, sin partage ni prison',()=>{
  for(const bet of Object.values(R.bets).filter(b=>b.type==='outside')) assert.equal(R.payout({[bet.id]:10},0),0);
});
test('todas las zonas tienen geometría válida y retorno total de 36/37',()=>{
  for(const b of Object.values(R.bets)) {
    assert.equal(new Set(b.numbers).size,b.numbers.length);
    assert(b.numbers.every(n=>Number.isInteger(n)&&n>=0&&n<=36));
    assert.equal(R.order.reduce((total,n)=>total+R.payout({[b.id]:1},n),0),36,b.id);
  }
  assert.equal(Object.values(R.bets).filter(b=>b.type==='six').length,11);
});
test('RNG rechaza el extremo módulo, acepta 0 y 36, y valida la fuente',()=>{
  const values=[4294967295,0]; assert.equal(R.randomNumber(()=>values.shift()),0);
  assert.equal(R.randomNumber(()=>36),36); assert.throws(()=>R.randomNumber(()=>-1));
});
test('muestra criptográfica de 74000 giros: rango, extremos y distribución sin sesgo grosero',()=>{
  const counts=Array(37).fill(0);for(let i=0;i<74000;i++)counts[R.randomNumber()]++;
  assert(counts.every(n=>n>1500 && n<2500));
  const chi=counts.reduce((a,n)=>a+(n-2000)**2/2000,0); assert(chi<120,`chi²=${chi}`);
});
test('saldo insuficiente, repetir y doblar son atómicos',()=>{
  const s=session(0,100);s.place('red',100);const before=s.serialize();
  assert.throws(()=>s.place('red',1));assert.throws(()=>s.double());assert.deepEqual(s.serialize(),before);
  s.spin();s.finish();const lost=s.serialize();assert.throws(()=>s.repeat());assert.deepEqual(s.serialize(),lost);
});
test('acumulación, borrar, deshacer y repetir la distribución completa',()=>{
  const s=session();s.place('red',5);s.place('red',10);s.place('straight:1',25);s.double();
  assert.equal(s.stake,80);s.undoLast();assert.equal(s.stake,40);s.clear();assert.equal(s.player.balance,500);s.undoLast();
  s.spin();s.finish();s.repeat();assert.deepEqual(s.player.bets,{'red':15,'straight:1':25});
  s.place('black',1);s.repeat();assert.deepEqual(s.player.bets,{'red':15,'straight:1':25});
});
test('giro único y bloqueo de toda edición',()=>{
  let calls=0;const s=new R.Session({rng:()=>{calls++;return 0;}});s.place('straight:0',5);s.spin();
  for(const action of [()=>s.spin(),()=>s.place('red',1),()=>s.clear(),()=>s.repeat(),()=>s.double(),()=>s.undoLast(),()=>s.select(0),()=>s.confirm()])assert.throws(action);
  assert.equal(calls,1);s.finish();assert.equal(s.player.balance,675);
});
test('historial máximo de 20, saldo cero seguro y sesión nueva limpia',()=>{
  const s=session(1);for(let i=0;i<25;i++){s.place('red',1);s.spin();s.finish();}assert.equal(s.history.length,20);
  const broke=session(0,1);broke.place('red',1);broke.spin();broke.finish();assert.equal(broke.player.balance,0);assert(!broke.canSpin());
  const fresh=session();assert.equal(fresh.history.length,0);assert.equal(fresh.stake,0);
});
test('recargar durante apuestas o giro: no pierde fichas ni duplica premios',()=>{
  const s=session(1);s.place('red',25);const betting=R.Session.restore(s.serialize());assert.equal(betting.stake,25);
  s.spin();const recovered=R.Session.restore(s.serialize());assert.equal(recovered.player.balance,525);assert.equal(recovered.state,'RESULT');
  const twice=R.Session.restore(recovered.serialize());assert.equal(twice.player.balance,525);assert.equal(twice.history.length,1);
  assert.equal(R.Session.restore({...s.serialize(),pending:{number:99}}),null);assert.equal(R.Session.restore({schema:1,players:[]}),null);
});
test('local 2–6: saldos independientes, confirmación y resultado común',()=>{
  for(let count=2;count<=6;count++){
    const s=session(1,100,Array.from({length:count},(_,i)=>`J${i}`));
    for(let i=0;i<count;i++){s.place(i%2?'black':'red',10);if(i<count-1)assert(!s.canSpin());s.confirm();}
    assert(s.canSpin());s.spin();s.finish();s.players.forEach((p,i)=>assert.equal(p.balance,i%2?90:110));
  }
});
