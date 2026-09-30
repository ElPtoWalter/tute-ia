(() => {
  "use strict";
  const G=window.SalaCeroGame;
  const ids=["buSetup","buSetupForm","buMode","buPlayers","buNames","buGame","buScore","buStatus","buProgress","buDots","buRound","buPlayerName","buHand","buRulesButton","buRules","buResult","buResultTitle","buResultCopy","buWinning","buAgain"];
  const ui=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
  const aiNames=["Doña Virtud","Don Prudencio","Lola","Señor Azar","Clara"];
  const state={active:false,mode:"local",players:[],hands:[],selected:[],current:0,revealed:false,round:1,startPlayer:0};
  function renderNames(){
    const count=Number(ui.buPlayers.value),local=ui.buMode.value==="local";
    ui.buNames.innerHTML=Array.from({length:local?count:1},(_,i)=>`<label class="field"><span>${local?`Jugador ${i+1}`:"Tu nombre"}</span><input id="buName${i}" maxlength="18" value="${G.escapeHtml(i?`Jugador ${i+1}`:window.SalaCeroPrefs.getName())}"></label>`).join("");
  }
  function start(){
    const count=Number(ui.buPlayers.value),local=ui.buMode.value==="local";
    const players=Array.from({length:count},(_,i)=>({name:local?(document.getElementById(`buName${i}`)?.value.trim()||`Jugador ${i+1}`):(i===0?(document.getElementById("buName0")?.value.trim()||window.SalaCeroPrefs.getName()):aiNames[i-1]),ai:!local&&i>0}));
    const chosen=G.shuffle(G.ranks).slice(0,count),deck=G.shuffle(chosen.flatMap(rank=>G.suits.map(suit=>({id:`${suit}-${rank}`,suit,rank}))));
    const hands=Array.from({length:count},()=>[]);deck.forEach((card,i)=>hands[i%count].push(card));
    Object.assign(state,{active:true,mode:local?"local":"solo",players,hands,selected:Array(count).fill(null),current:0,revealed:!local,round:1,startPlayer:0});
    ui.buSetup.classList.add("hidden");ui.buGame.classList.remove("hidden");
    const initial=winnerIndex();if(initial>=0){finish(initial);return}render();schedule();
  }
  function winnerIndex(){return state.hands.findIndex(hand=>hand.length===4&&hand.every(card=>card.rank===hand[0].rank))}
  function choose(index){
    if(!state.active||!state.revealed||state.players[state.current].ai||state.selected[state.current]||!state.hands[state.current][index])return;
    commit(index);
  }
  function commit(index){
    const player=state.current,[card]=state.hands[player].splice(index,1);if(!card)return;
    state.selected[player]=card;window.SalaCeroPrefs.haptic(18);
    const done=state.selected.filter(Boolean).length;
    if(done===state.players.length){render();setTimeout(exchange,500);return}
    state.current=(state.current+1)%state.players.length;state.revealed=state.mode==="solo";render();schedule();
  }
  function exchange(){
    state.selected.forEach((card,from)=>state.hands[(from+1)%state.players.length].push(card));
    state.selected=Array(state.players.length).fill(null);
    const winner=winnerIndex();if(winner>=0){finish(winner);return}
    state.round+=1;state.startPlayer=(state.startPlayer+1)%state.players.length;state.current=state.startPlayer;state.revealed=state.mode==="solo";
    G.toast("Cartas pasadas a la izquierda");render();schedule();
  }
  function schedule(){
    if(!state.active)return;const player=state.players[state.current];
    if(player.ai){ui.buStatus.textContent=`${player.name} elige…`;setTimeout(aiTurn,380)}
    else if(state.mode==="local"&&!state.revealed)G.passScreen(`Turno de ${player.name}`,"Elige en privado una carta para pasar a la izquierda.",()=>{state.revealed=true;render()});
  }
  function aiTurn(){
    if(!state.active||!state.players[state.current].ai)return;
    const hand=state.hands[state.current],counts=hand.reduce((map,c)=>(map[c.rank]=(map[c.rank]||0)+1,map),{});
    const min=Math.min(...Object.values(counts)),options=hand.map((card,index)=>({card,index})).filter(item=>counts[item.card.rank]===min);
    commit(options[Math.floor(Math.random()*options.length)].index);
  }
  function finish(winner){
    state.active=false;const hand=state.hands[winner],rank=G.rankNames[hand[0].rank];
    ui.buResultTitle.textContent=`${state.players[winner].name} grita ¡Burro!`;
    ui.buResultCopy.textContent=`Ha reunido cuatro ${rank.toLowerCase()}s en la ronda ${state.round}.`;
    ui.buWinning.innerHTML=hand.map(card=>`<img src="${G.cardSrc(card)}" alt="${G.escapeHtml(G.cardName(card))}">`).join("");
    ui.buResult.showModal();window.SalaCeroPrefs.noteResult({game:"burro"});window.SalaCeroPrefs.haptic([80,40,80,40,120]);
  }
  function render(){
    if(!state.players.length)return;const player=state.players[state.current],owner=state.mode==="solo"?0:state.current,canUse=state.revealed&&owner===state.current&&!player.ai&&!state.selected[state.current];
    ui.buScore.innerHTML=state.players.map((p,i)=>`<div class="score-chip ${i===state.current?"active":""}"><strong>${G.escapeHtml(p.name)}</strong><b>${state.hands[i].length+(state.selected[i]?1:0)}</b><small>${state.selected[i]?"carta elegida":"eligiendo"}</small></div>`).join("");
    const done=state.selected.filter(Boolean).length;ui.buProgress.textContent=`${done} / ${state.players.length}`;ui.buDots.innerHTML=state.players.map((_,i)=>`<span class="${state.selected[i]?"done":""}"></span>`).join("");ui.buRound.textContent=state.round;
    ui.buStatus.textContent=`Turno de ${player.name}: elige una carta`;ui.buPlayerName.textContent=state.players[owner].name;
    G.renderHand(ui.buHand,state.hands[owner],{disabled:()=>!canUse,onPlay:choose});
  }
  ui.buMode.addEventListener("change",renderNames);ui.buPlayers.addEventListener("change",renderNames);ui.buSetupForm.addEventListener("submit",e=>{e.preventDefault();start()});
  ui.buRulesButton.addEventListener("click",()=>ui.buRules.showModal());ui.buRules.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>ui.buRules.close()));ui.buAgain.addEventListener("click",()=>location.reload());renderNames();
  window.SalaCeroBurroDebug=Object.freeze({state,winnerIndex});
})();
