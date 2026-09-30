(() => {
  "use strict";
  const G = window.SalaCeroGame;
  const ids = ["poSetup","poSetupForm","poMode","poPlayers","poNames","poGame","poScore","poStatus","poTrumpCard","poTrumpSuit","poTrick","poBidPanel","poBidOptions","poRoundLabel","poCardsLabel","poPlayerName","poPlayerInfo","poHand","poRulesButton","poRules","poRoundDialog","poRoundTitle","poRoundRows","poNextRound","poResult","poResultTitle","poResultRows","poAgain"];
  const ui = Object.fromEntries(ids.map(id => [id,document.getElementById(id)]));
  const aiNames = ["Doña Virtud","Don Prudencio","Lola","Señor Azar","Clara"];
  const state = { active:false,mode:"solo",players:[],hands:[],roundPlan:[],roundIndex:0,roundCards:1,trump:null,trumpSuit:"",phase:"bid",current:0,leader:0,trick:[],bidsMade:0,revealed:false };

  function renderNames(){
    const count=Number(ui.poPlayers.value),local=ui.poMode.value==="local";
    ui.poNames.innerHTML=Array.from({length:local?count:1},(_,i)=>`<label class="field"><span>${local?`Jugador ${i+1}`:"Tu nombre"}</span><input id="poName${i}" maxlength="18" value="${G.escapeHtml(i?`Jugador ${i+1}`:window.SalaCeroPrefs.getName())}"></label>`).join("");
  }
  function start(){
    const count=Number(ui.poPlayers.value),local=ui.poMode.value==="local";
    const players=Array.from({length:count},(_,i)=>({name:local?(document.getElementById(`poName${i}`)?.value.trim()||`Jugador ${i+1}`):(i===0?(document.getElementById("poName0")?.value.trim()||window.SalaCeroPrefs.getName()):aiNames[i-1]),ai:!local&&i>0,score:0,bid:null,tricks:0}));
    const max=Math.min(10,Math.floor(40/count));
    Object.assign(state,{active:true,mode:local?"local":"solo",players,roundPlan:[...Array.from({length:max},(_,i)=>i+1),...Array.from({length:max-1},(_,i)=>max-1-i)],roundIndex:0});
    ui.poSetup.classList.add("hidden");ui.poGame.classList.remove("hidden");startRound();
  }
  function startRound(){
    state.roundCards=state.roundPlan[state.roundIndex];
    state.players.forEach(p=>{p.bid=null;p.tricks=0});
    const deck=G.deck(),hands=Array.from({length:state.players.length},()=>[]);
    for(let r=0;r<state.roundCards;r++)for(let p=0;p<state.players.length;p++)hands[p].push(deck.pop());
    const trump=deck.pop()||null;
    state.hands=hands;state.trump=trump;state.trumpSuit=trump?.suit||G.suits[state.roundIndex%G.suits.length];
    state.phase="bid";state.bidsMade=0;state.trick=[];state.leader=(state.roundIndex+1)%state.players.length;state.current=state.leader;state.revealed=state.mode==="solo";
    render();schedule();
  }
  function validBids(){
    const values=Array.from({length:state.roundCards+1},(_,i)=>i);
    if(state.bidsMade!==state.players.length-1)return values;
    const sum=state.players.reduce((total,p)=>total+(p.bid??0),0);
    return values.filter(value=>sum+value!==state.roundCards);
  }
  function bid(value){
    if(!state.active||state.phase!=="bid"||!state.revealed||state.players[state.current].ai||!validBids().includes(value))return;
    commitBid(value);
  }
  function commitBid(value){
    state.players[state.current].bid=value;state.bidsMade+=1;
    if(state.bidsMade===state.players.length){state.phase="play";state.current=state.leader;state.revealed=state.mode==="solo";G.toast("Empiezan las bazas");render();schedule();return}
    state.current=(state.current+1)%state.players.length;state.revealed=state.mode==="solo";render();schedule();
  }
  function legalIndexes(player=state.current){
    const hand=state.hands[player];if(!state.trick.length)return hand.map((_,i)=>i);
    const lead=state.trick[0].card.suit,matching=hand.map((c,i)=>c.suit===lead?i:-1).filter(i=>i>=0);
    return matching.length?matching:hand.map((_,i)=>i);
  }
  function play(index){
    if(!state.active||state.phase!=="play"||!state.revealed||state.players[state.current].ai||!legalIndexes().includes(index))return;
    commitCard(index);
  }
  function commitCard(index){
    const player=state.current,[card]=state.hands[player].splice(index,1);if(!card)return;
    state.trick.push({player,card});state.revealed=false;window.SalaCeroPrefs.haptic(18);
    if(state.trick.length===state.players.length){render();setTimeout(resolveTrick,520);return}
    state.current=(state.current+1)%state.players.length;state.revealed=state.mode==="solo";render();schedule();
  }
  function resolveTrick(){
    const winner=G.trickWinner(state.trick,state.trumpSuit);state.players[winner].tricks+=1;state.leader=winner;state.current=winner;
    G.toast(`${state.players[winner].name} gana la baza`);state.trick=[];
    if(state.hands.every(hand=>hand.length===0)){finishRound();return}
    state.revealed=state.mode==="solo";render();schedule();
  }
  function schedule(){
    if(!state.active)return;const player=state.players[state.current];
    if(player.ai){ui.poStatus.textContent=`${player.name} piensa…`;setTimeout(state.phase==="bid"?aiBid:aiPlay,420)}
    else if(state.mode==="local"&&!state.revealed)G.passScreen(`Turno de ${player.name}`,state.phase==="bid"?"Mira tu mano y anuncia tu apuesta.":"Juega una carta sin enseñar tu mano.",()=>{state.revealed=true;render()});
  }
  function aiBid(){
    if(state.phase!=="bid"||!state.players[state.current].ai)return;
    const hand=state.hands[state.current];
    const estimate=hand.reduce((sum,c)=>sum+(c.suit===state.trumpSuit ? .55 : 0)+(G.cardPower(c)>=9 ? .7 : G.cardPower(c)>=7 ? .3 : 0),0);
    const wanted=Math.max(0,Math.min(state.roundCards,Math.round(estimate)));
    const valid=validBids();commitBid(valid.includes(wanted)?wanted:valid.reduce((best,value)=>Math.abs(value-wanted)<Math.abs(best-wanted)?value:best,valid[0]));
  }
  function aiPlay(){
    if(state.phase!=="play"||!state.players[state.current].ai)return;
    const player=state.current,legal=legalIndexes(player),needs=state.players[player].tricks<state.players[player].bid;
    const options=legal.map(index=>{const card=state.hands[player][index],wins=!state.trick.length?false:G.trickWinner([...state.trick,{player,card}],state.trumpSuit)===player;return{index,card,wins,cost:G.cardPower(card)+(card.suit===state.trumpSuit?8:0)}});let choice;
    if(needs){const winners=options.filter(o=>o.wins);choice=(winners.length?winners:options).sort((a,b)=>a.cost-b.cost)[0]}else{const losers=options.filter(o=>!o.wins);choice=(losers.length?losers:options).sort((a,b)=>a.cost-b.cost)[0]}
    commitCard(choice.index);
  }
  function finishRound(){
    const rows=state.players.map(player=>{const diff=Math.abs(player.bid-player.tricks),delta=diff===0?10+5*player.tricks:-5*diff;player.score+=delta;return{player,delta}});
    ui.poRoundTitle.textContent=`Ronda ${state.roundIndex+1} completada`;
    ui.poRoundRows.innerHTML=rows.map(({player,delta})=>`<div class="po-result-row"><strong>${G.escapeHtml(player.name)}</strong><small>${player.bid} pedidas · ${player.tricks} ganadas</small><b>${delta>0?"+":""}${delta}</b></div>`).join("");
    state.roundIndex+=1;
    if(state.roundIndex>=state.roundPlan.length){ui.poNextRound.textContent="Ver resultado final"}else ui.poNextRound.textContent=`Siguiente: ${state.roundPlan[state.roundIndex]} ${state.roundPlan[state.roundIndex]===1?"carta":"cartas"}`;
    ui.poRoundDialog.showModal();
  }
  function nextRound(){
    ui.poRoundDialog.close();if(state.roundIndex>=state.roundPlan.length){finishMatch();return}startRound();
  }
  function finishMatch(){
    state.active=false;const ranking=[...state.players].sort((a,b)=>b.score-a.score);
    ui.poResultTitle.textContent=`${ranking[0].name} gana la Pocha`;
    ui.poResultRows.innerHTML=ranking.map((player,index)=>`<div class="po-result-row"><strong>${index+1}. ${G.escapeHtml(player.name)}</strong><small>Puntuación final</small><b>${player.score}</b></div>`).join("");
    ui.poResult.showModal();window.SalaCeroPrefs.noteResult({game:"pocha"});window.SalaCeroPrefs.haptic([70,40,100]);
  }
  function render(){
    if(!state.players.length)return;const player=state.players[state.current],owner=state.mode==="solo"?0:state.current,canUse=state.revealed&&owner===state.current&&!player.ai;
    ui.poScore.innerHTML=state.players.map((p,i)=>`<div class="score-chip ${i===state.current?"active":""}"><strong>${G.escapeHtml(p.name)}</strong><b>${p.score}</b><small>${p.bid===null?"sin apuesta":`${p.bid} pedidas · ${p.tricks} ganadas`}</small></div>`).join("");
    ui.poRoundLabel.textContent=`RONDA ${state.roundIndex+1} / ${state.roundPlan.length}`;ui.poCardsLabel.textContent=`${state.roundCards} ${state.roundCards===1?"carta":"cartas"}`;
    ui.poStatus.textContent=state.phase==="bid"?`Apuesta de ${player.name}`:`Turno de ${player.name}`;
    ui.poTrumpSuit.textContent=state.trumpSuit;ui.poTrumpCard.src=state.trump?G.cardSrc(state.trump):`assets/cards/${state.trumpSuit}-5.webp`;ui.poTrumpCard.alt=`Triunfo: ${state.trumpSuit}`;
    ui.poTrick.innerHTML=state.trick.map(entry=>`<figure class="po-played"><img src="${G.cardSrc(entry.card)}" alt="${G.escapeHtml(G.cardName(entry.card))}"><figcaption>${G.escapeHtml(state.players[entry.player].name)}</figcaption></figure>`).join("");
    ui.poPlayerName.textContent=state.players[owner].name;ui.poPlayerInfo.textContent=state.players[owner].bid===null?"Apuesta pendiente":`${state.players[owner].bid} pedidas · ${state.players[owner].tricks} ganadas`;
    G.renderHand(ui.poHand,state.hands[owner],{legal:card=>state.phase==="bid"||legalIndexes(owner).some(i=>state.hands[owner][i]===card),disabled:()=>!canUse||state.phase!=="play",onPlay:play});
    const showBid=canUse&&state.phase==="bid";ui.poBidPanel.hidden=!showBid;
    if(showBid)ui.poBidOptions.innerHTML=Array.from({length:state.roundCards+1},(_,value)=>`<button type="button" data-bid="${value}" ${validBids().includes(value)?"":"disabled"}>${value}</button>`).join("");
    ui.poBidOptions.querySelectorAll("[data-bid]").forEach(button=>button.addEventListener("click",()=>bid(Number(button.dataset.bid))));
  }
  ui.poMode.addEventListener("change",renderNames);ui.poPlayers.addEventListener("change",renderNames);ui.poSetupForm.addEventListener("submit",e=>{e.preventDefault();start()});
  ui.poRulesButton.addEventListener("click",()=>ui.poRules.showModal());ui.poRules.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>ui.poRules.close()));
  ui.poNextRound.addEventListener("click",nextRound);ui.poAgain.addEventListener("click",()=>location.reload());renderNames();
  window.SalaCeroPochaDebug=Object.freeze({state,validBids,legalIndexes});
})();
