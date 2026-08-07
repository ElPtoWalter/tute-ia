(()=>{
'use strict';

const SAVE='salaCeroBlackjackV214';
const LEGACY_SAVE='salaCeroBlackjackV213';
const SUITS=['s','h','d','c'];
const RANKS=[2,3,4,5,6,7,8,9,10,11,12,13,14];
const SYM={s:'♠',h:'♥',d:'♦',c:'♣'};
const RL={11:'J',12:'Q',13:'K',14:'A'};
const FACE={11:'J',12:'Q',13:'K'};
const BETS=[10,25,50,100,250,500];
let state=null;
let toastTimer=null;
let dealerTimer=null;
const $=id=>document.getElementById(id);
const U={};
[
  'bjWelcome','bjSetup','bjSetupTitle','bjCountField','bjPlayerCount','bjNames','bjStartStack','bjDefaultBet','bjStart','bjSetupClose',
  'bjGame','bjRound','bjTurnLabel','bjDealerScore','bjDealerState','bjDealerHand','bjMessage','bjPlayers','bjHit','bjStand','bjDouble','bjSplit',
  'bjExit','bjContinue','bjBetDialog','bjBetRows','bjDeal','bjBetExit','bjResultDialog','bjResultTitle','bjResults','bjNextRound','bjResultExit',
  'bjRulesBtn','bjRules','bjRulesClose','bjToast'
].forEach(id=>U[id]=$(id));

function boot(){
  document.querySelectorAll('[data-bj-mode]').forEach(b=>b.onclick=()=>setup(b.dataset.bjMode));
  U.bjPlayerCount.onchange=()=>names(+U.bjPlayerCount.value);
  U.bjStart.onclick=create;
  U.bjSetupClose.onclick=welcome;
  U.bjHit.onclick=hit;
  U.bjStand.onclick=stand;
  U.bjDouble.onclick=dbl;
  U.bjSplit.onclick=split;
  U.bjExit.onclick=exit;
  U.bjContinue.onclick=resume;
  U.bjDeal.onclick=deal;
  U.bjBetExit.onclick=()=>{safeClose(U.bjBetDialog);exit()};
  U.bjNextRound.onclick=()=>{safeClose(U.bjResultDialog);bets()};
  U.bjResultExit.onclick=()=>{safeClose(U.bjResultDialog);exit()};
  U.bjRulesBtn.onclick=()=>U.bjRules.showModal();
  U.bjRulesClose.onclick=()=>U.bjRules.close();
  addEventListener('beforeunload',save);
  refresh();
}

function setup(mode){
  U.bjWelcome.classList.add('hidden');
  U.bjSetup.classList.remove('hidden');
  U.bjSetup.dataset.mode=mode;
  U.bjSetupTitle.textContent=mode==='solo'?'Tú contra Anton':'Mesa local contra Anton';
  U.bjCountField.classList.toggle('hidden',mode==='solo');
  names(mode==='solo'?1:+U.bjPlayerCount.value);
  scrollTo(0,0);
}

function names(n){
  const old=[...U.bjNames.querySelectorAll('input')].map(x=>x.value);
  let defaultName='Jugador 1';
  U.bjNames.innerHTML=Array.from({length:n},(_,i)=>`<input maxlength="18" value="${esc(old[i]||(i?`Jugador ${i+1}`:defaultName))}" aria-label="Nombre del jugador ${i+1}">`).join('');
}

function create(){
  const mode=U.bjSetup.dataset.mode||'solo';
  const n=mode==='solo'?1:Math.max(2,Math.min(6,+U.bjPlayerCount.value||2));
  const stack=+U.bjStartStack.value||1000;
  const ns=[...U.bjNames.querySelectorAll('input')].slice(0,n).map((x,i)=>clean(x.value,`Jugador ${i+1}`));
  state={
    version:21.4,
    mode,
    round:0,
    defaultBet:+U.bjDefaultBet.value||25,
    startStack:stack,
    players:ns.map((name,id)=>({id,name,stack,hands:[],bet:0,lastBet:0})),
    dealer:{cards:[],hidden:true,natural:false},
    shoe:shuffle(deck(4)),
    shoeSerial:1,
    phase:'betting',
    pi:0,
    hi:0,
    active:true
  };
  U.bjSetup.classList.add('hidden');
  U.bjGame.classList.remove('hidden');
  bets();
  save();
}

function bets(){
  clearDealerTimer();
  if(!state)return;
  state.phase='betting';
  state.players.forEach(p=>{p.hands=[];p.bet=0});
  if(!state.players.some(p=>p.stack>=10)){
    const refill=state.startStack||1000;
    state.players.forEach(p=>p.stack=refill);
    toast(`Nueva caja: ${fmt(refill)} fichas por jugador.`);
  }
  U.bjBetRows.innerHTML=state.players.map((p,i)=>betRow(p,i)).join('');
  U.bjBetRows.querySelectorAll('[data-bet-pick]').forEach(btn=>btn.onclick=()=>pickBet(btn));
  U.bjBetDialog.showModal();
  render();
}

function betRow(p,i){
  const fallback=Math.min(p.lastBet||state.defaultBet||25,p.stack);
  const initial=p.stack>=10?bestBet(fallback,p.stack):0;
  const buttons=BETS.filter(v=>v<=p.stack).map(v=>`<button type="button" class="bet-pick ${v===initial?'selected':''}" data-bet-pick="${i}" data-value="${v}">${chip(v)}<span>${fmt(v)}</span></button>`).join('');
  const allIn=p.stack>=10&&!BETS.includes(p.stack)?`<button type="button" class="bet-pick allin ${p.stack===initial?'selected':''}" data-bet-pick="${i}" data-value="${p.stack}"><span>ALL-IN</span><b>${fmt(p.stack)}</b></button>`:'';
  return `<article class="bet-row ${p.stack<10?'disabled':''}" data-bet-row="${i}">
    <div class="bet-player"><span><strong>${esc(p.name)}</strong><small>${fmt(p.stack)} fichas disponibles</small></span><output data-bet-output="${i}">${p.stack?fmt(initial):'—'}</output></div>
    <input type="hidden" data-bet-value="${i}" value="${p.stack?initial:0}">
    <div class="bet-picks">${buttons}${allIn||''}</div>
    ${p.stack<10?'<p class="bet-empty">Sin fichas suficientes para la apuesta mínima.</p>':''}
  </article>`;
}

function pickBet(btn){
  const i=+btn.dataset.betPick;
  const value=+btn.dataset.value||0;
  const row=U.bjBetRows.querySelector(`[data-bet-row="${i}"]`);
  if(!row)return;
  row.querySelectorAll('.bet-pick').forEach(b=>b.classList.toggle('selected',b===btn));
  row.querySelector(`[data-bet-value="${i}"]`).value=value;
  row.querySelector(`[data-bet-output="${i}"]`).textContent=fmt(value);
  navigator.vibrate?.(12);
}

function bestBet(preferred,stack){
  if(stack<=0)return 0;
  if(preferred>0&&preferred<=stack)return preferred;
  const valid=BETS.filter(v=>v<=stack);
  return valid.length?valid[valid.length-1]:stack;
}

function deal(){
  if(!state)return;
  const betsForRound=state.players.map((p,i)=>Math.min(p.stack,+U.bjBetRows.querySelector(`[data-bet-value="${i}"]`)?.value||0));
  if(!betsForRound.some(Boolean)){toast('No hay ninguna apuesta activa.');return;}
  safeClose(U.bjBetDialog);
  state.round++;
  state.phase='playing';
  if(!Array.isArray(state.shoe)||state.shoe.length<60){
    state.shoe=shuffle(deck(4));
    state.shoeSerial=(state.shoeSerial||0)+1;
    toast('Anton ha cambiado y barajado el sabot.');
  }
  state.dealer={cards:[],hidden:true,natural:false};
  state.pi=state.hi=0;
  state.players.forEach((p,i)=>{
    const bet=betsForRound[i];
    p.bet=bet;
    p.lastBet=bet||p.lastBet||state.defaultBet;
    p.stack-=bet;
    p.hands=bet?[newHand(bet)]:[];
  });
  const active=state.players.filter(p=>p.hands.length);
  for(let pass=0;pass<2;pass++){
    active.forEach(p=>p.hands[0].cards.push(draw()));
    state.dealer.cards.push(draw());
  }
  active.forEach(p=>{
    const h=p.hands[0];
    h.natural=blackjack(h);
    if(h.natural)h.status='done';
  });
  state.dealer.natural=blackjack({cards:state.dealer.cards,split:false});
  render();
  save();
  if(state.dealer.natural){
    U.bjMessage.textContent='Anton comprueba su mano… Blackjack de la banca.';
    dealerTimer=setTimeout(dealer,520);
    return;
  }
  const nx=next(0,0);
  if(nx){state.pi=nx.p;state.hi=nx.h}else dealerTimer=setTimeout(dealer,360);
  render();
}

function newHand(bet){return{cards:[],bet,status:'playing',natural:false,split:false,splitAces:false,result:''}}
function deck(n=1){const a=[];for(let d=0;d<n;d++)for(const s of SUITS)for(const r of RANKS)a.push({rank:r,suit:s});return a}
function shuffle(a){a=a.slice();for(let i=a.length-1;i;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function draw(){if(!state.shoe.length){state.shoe=shuffle(deck(4));state.shoeSerial=(state.shoeSerial||0)+1}return state.shoe.pop()}
function cardPoint(c){return c.rank===14?11:Math.min(10,c.rank)}
function value(cards){let total=0,aces=0;cards.forEach(c=>{if(c.rank===14){total+=11;aces++}else total+=Math.min(10,c.rank)});while(total>21&&aces){total-=10;aces--}return{total,soft:aces>0}}
function blackjack(h){return h.cards.length===2&&value(h.cards).total===21&&!h.split}
function sameSplitValue(a,b){return cardPoint(a)===cardPoint(b)}

function cur(){const p=state?.players[state.pi];return{p,h:p?.hands[state.hi]}}
function next(sp,sh){for(let p=sp;p<state.players.length;p++)for(let h=p===sp?sh:0;h<state.players[p].hands.length;h++)if(state.players[p].hands[h].status==='playing')return{p,h};return null}
function advance(){const n=next(state.pi,state.hi+1)||next(state.pi+1,0);if(n){state.pi=n.p;state.hi=n.h}else dealer()}

function hit(){
  const {h}=cur();
  if(!h||h.status!=='playing'||h.splitAces)return;
  h.cards.push(draw());
  const v=value(h.cards).total;
  if(v>21){h.status='bust';advance()}else if(v===21){h.status='done';advance()}
  render();save();navigator.vibrate?.(12);
}
function stand(){const {h}=cur();if(!h||h.status!=='playing')return;h.status='done';advance();render();save()}
function canDouble(p,h){return p&&h&&h.status==='playing'&&!h.splitAces&&h.cards.length===2&&p.stack>=h.bet}
function dbl(){
  const {p,h}=cur();if(!canDouble(p,h))return;
  p.stack-=h.bet;h.bet*=2;h.cards.push(draw());h.status=value(h.cards).total>21?'bust':'done';advance();render();save();navigator.vibrate?.(18);
}
function canSplit(p,h){return p&&h&&h.status==='playing'&&h.cards.length===2&&sameSplitValue(h.cards[0],h.cards[1])&&p.stack>=h.bet&&p.hands.length<2}
function split(){
  const {p,h}=cur();if(!canSplit(p,h))return;
  p.stack-=h.bet;
  const splitAces=h.cards[0].rank===14&&h.cards[1].rank===14;
  const moved=h.cards.pop();
  const h2={cards:[moved,draw()],bet:h.bet,status:'playing',natural:false,split:true,splitAces,result:''};
  h.cards.push(draw());
  h.split=true;h.splitAces=splitAces;h.natural=false;
  p.hands.splice(state.hi+1,0,h2);
  if(splitAces){h.status=h2.status='done';advance()}
  else if(value(h.cards).total===21){h.status='done';advance()}
  render();save();navigator.vibrate?.([20,20,20]);
}

function dealer(){
  clearDealerTimer();
  if(!state||state.phase==='result')return;
  state.phase='dealer';
  state.dealer.hidden=false;
  render();
  dealerTimer=setTimeout(function step(){
    const v=value(state.dealer.cards);
    if(v.total<17){state.dealer.cards.push(draw());render();dealerTimer=setTimeout(step,300)}
    else settle();
  },350);
}

function settle(){
  clearDealerTimer();
  state.phase='result';
  const dv=value(state.dealer.cards).total;
  const dealerBust=dv>21;
  const dealerBj=!!state.dealer.natural;
  const rows=[];
  state.players.forEach(p=>p.hands.forEach((h,i)=>{
    const v=value(h.cards).total;
    let pay=0,label='Pierde';
    if(h.status==='bust')label='Pierde · se pasó';
    else if(h.natural&&!dealerBj){pay=h.bet*2.5;label='Blackjack · paga 3:2'}
    else if(dealerBj&&!h.natural)label='Pierde · Blackjack de Anton';
    else if(dealerBj&&h.natural){pay=h.bet;label='Empate · doble Blackjack'}
    else if(dealerBust){pay=h.bet*2;label='Gana · Anton se pasó'}
    else if(v>dv){pay=h.bet*2;label='Gana'}
    else if(v===dv){pay=h.bet;label='Empate'}
    p.stack+=pay;
    h.result=label;
    rows.push({name:p.name+(p.hands.length>1?` · mano ${i+1}`:''),value:v,pay,bet:h.bet,label});
  }));
  save();render();
  U.bjResultTitle.textContent=dealerBj?'Blackjack de Anton':dealerBust?'Anton se ha pasado':`Anton termina con ${dv}`;
  U.bjResults.innerHTML=rows.map(r=>{
    const net=r.pay-r.bet;
    const money=net>0?`+${fmt(net)}`:net<0?`−${fmt(Math.abs(net))}`:'0';
    return `<div class="result-row ${net>0?'win':net<0?'lose':'push'}"><span><strong>${esc(r.name)}</strong><small>${esc(r.label)} · ${r.value} puntos</small></span><strong>${money}</strong></div>`;
  }).join('');
  U.bjResultDialog.showModal();
  try{
    const first=rows.find(r=>r.name.startsWith(state.players[0]?.name||''))||rows[0];
    
  }catch{}
}

function render(){
  if(!state)return;
  document.body.dataset.bjPlayers=String(state.players.length);
  U.bjRound.textContent=state.round;
  const c=cur();
  U.bjTurnLabel.textContent=state.phase==='playing'&&c.p?`${c.p.name}${c.p.hands.length>1?` · mano ${state.hi+1}`:''}`:state.phase==='dealer'?'Anton':state.phase==='betting'?'Apuestas':'Resultado';
  const show=!state.dealer.hidden||state.phase!=='playing';
  U.bjDealerHand.innerHTML=state.dealer.cards.map((x,i)=>i===1&&!show?back():card(x)).join('');
  const dv=show?value(state.dealer.cards).total:'?';
  U.bjDealerScore.textContent=dv;
  U.bjDealerState.textContent=show?(state.dealer.natural?'Blackjack':dv>21?'Se ha pasado':dv===21?'Veintiuno':'Banca'):'Carta oculta';
  U.bjPlayers.innerHTML=state.players.map((p,pi)=>playerCard(p,pi)).join('');
  const play=state.phase==='playing'&&c.h?.status==='playing';
  U.bjHit.disabled=U.bjStand.disabled=!play;
  U.bjDouble.disabled=!play||!canDouble(c.p,c.h);
  U.bjSplit.disabled=!play||!canSplit(c.p,c.h);
  if(state.phase==='playing'&&c.p){
    const score=value(c.h.cards).total;
    U.bjMessage.textContent=`${c.p.name}: ${score} puntos. ${score===21?'Veintiuno. La mano se cierra.':'Decide tu jugada.'}`;
  }else if(state.phase==='dealer')U.bjMessage.textContent='Anton juega la banca.';
  else if(state.phase==='result')U.bjMessage.textContent='Ronda terminada.';
  else U.bjMessage.textContent='Preparando apuestas.';
}

function playerCard(p,pi){
  const activePlayer=state.phase==='playing'&&pi===state.pi;
  const hands=p.hands.length?p.hands:[null];
  const handsHtml=hands.map((h,hi)=>{
    if(!h)return '<div class="hand-slot empty">Esperando reparto</div>';
    const active=activePlayer&&hi===state.hi;
    const v=value(h.cards).total;
    const status=h.status==='bust'?'Se pasó':h.status==='done'?'Cerrada':'En juego';
    return `<div class="hand-slot ${active?'active-hand':''} ${h.status==='bust'?'bust-hand':''}">
      ${p.hands.length>1?`<div class="hand-label"><span>Mano ${hi+1}</span><b>${v}</b></div>`:''}
      <div class="hand">${h.cards.map(card).join('')}</div>
      <div class="hand-meta"><span>${chip(h.bet)}${fmt(h.bet)} fichas</span><small>${status}</small></div>
    </div>`;
  }).join('');
  return `<article class="player ${activePlayer?'active':''}">
    <div class="player-head"><div class="player-copy"><small>${activePlayer?'TURNO ACTUAL':'JUGADOR'}</small><strong>${esc(p.name)}</strong></div><div class="stack"><strong>${fmt(p.stack)}</strong><small>FICHAS</small></div></div>
    <div class="player-hands">${handsHtml}</div>
  </article>`;
}

function card(c){
  const f=FACE[c.rank];
  if(f)return`<div class="card"><img src="assets/poker/cards/${f}-${c.suit}.webp" alt="${label(c)}"></div>`;
  const red=c.suit==='h'||c.suit==='d',r=RL[c.rank]||c.rank,s=SYM[c.suit];
  return`<div class="card ${red?'red':''}"><span class="corner">${r}<i>${s}</i></span><span class="big-suit">${s}</span><span class="corner bottom">${r}<i>${s}</i></span></div>`;
}
function back(){return'<div class="card"><img src="assets/poker/card-back.svg" alt="Carta oculta"></div>'}
function chip(v){let n=1;[1,5,10,25,50,100,500].forEach(x=>{if(v>=x)n=x});return`<img src="assets/poker/chips/chip-${n}.webp" alt="" loading="eager">`}
function label(c){return`${RL[c.rank]||c.rank}${SYM[c.suit]}`}

function save(){if(!state)return;try{localStorage.setItem(SAVE,JSON.stringify(state))}catch{}refresh()}
function load(){
  try{
    let raw=localStorage.getItem(SAVE);
    if(!raw){raw=localStorage.getItem(LEGACY_SAVE);if(raw)localStorage.setItem(SAVE,raw)}
    const s=JSON.parse(raw||'null');
    if(s){s.version=21.4;s.startStack=s.startStack||1000;s.shoe=Array.isArray(s.shoe)&&s.shoe.length?s.shoe:shuffle(deck(4));s.players?.forEach(p=>{p.lastBet=p.lastBet||p.bet||s.defaultBet||25})}
    return s;
  }catch{return null}
}
function refresh(){
  const s=load(),ok=s?.active&&s.players?.length;
  U.bjContinue.disabled=!ok;
  const b=U.bjContinue.querySelector('strong'),p=U.bjContinue.querySelector('p');
  if(ok){b.textContent=`Ronda ${s.round||0} · ${s.players.length} jugador${s.players.length>1?'es':''}`;p.textContent=`${s.mode==='local'?'Mesa local':'Tú contra Anton'} · ${fmt(s.players[0].stack)} fichas`}
  else{b.textContent='Sin mesa pendiente';p.textContent='La mesa se guarda después de cada ronda.'}
}
function resume(){
  state=load();if(!state)return;
  U.bjWelcome.classList.add('hidden');U.bjSetup.classList.add('hidden');U.bjGame.classList.remove('hidden');
  if(state.phase==='playing')render();
  else if(state.phase==='dealer')dealer();
  else if(state.phase==='result'){state.phase='betting';bets()}
  else bets();
}
function exit(){clearDealerTimer();safeClose(U.bjBetDialog);safeClose(U.bjResultDialog);save();U.bjGame.classList.add('hidden');welcome()}
function welcome(){clearDealerTimer();U.bjSetup.classList.add('hidden');U.bjGame.classList.add('hidden');U.bjWelcome.classList.remove('hidden');refresh();scrollTo(0,0)}
function safeClose(d){try{if(d?.open)d.close()}catch{}}
function clearDealerTimer(){if(dealerTimer){clearTimeout(dealerTimer);dealerTimer=null}}
function toast(t){clearTimeout(toastTimer);U.bjToast.textContent=t;U.bjToast.classList.add('show');toastTimer=setTimeout(()=>U.bjToast.classList.remove('show'),1900)}
function fmt(v){return new Intl.NumberFormat('es-ES',{maximumFractionDigits:1}).format(+v||0)}
function clean(v,f){return String(v||'').trim().replace(/\s+/g,' ').slice(0,18)||f}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}

document.addEventListener('DOMContentLoaded',boot);
})();
