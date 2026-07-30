(() => {
  'use strict';
  const Core = window.PokerCore;
  const SAVE_KEY = 'salaCeroPokerSaveV204';
  const PREF_KEY = 'salaCeroPokerPrefsV204';
  const VERSION = 20.4;
  const AI_PROFILES = [
    {name:'Don Prudencio',avatar:'DP',style:'conservative',label:'Conservador · protege sus fichas'},
    {name:'Lola Relámpago',avatar:'LR',style:'aggressive',label:'Agresiva · presiona la mesa'},
    {name:'El Tahúr',avatar:'ET',style:'wild',label:'Imprevisible · mezcla cálculo y farol'}
  ];
  const SPEEDS = {fast:330,normal:650,slow:1050};
  const PHASE_LABEL = {preflop:'PRE-FLOP',flop:'FLOP',turn:'TURN',river:'RIVER',showdown:'SHOWDOWN',handOver:'MANO TERMINADA',gameOver:'PARTIDA TERMINADA'};
  const RANK_TEXT = {14:'As',13:'Rey',12:'Reina',11:'Jota',10:'Diez',9:'Nueve',8:'Ocho',7:'Siete',6:'Seis',5:'Cinco',4:'Cuatro',3:'Tres',2:'Dos'};
  let state = null;
  let aiTimer = null;
  let toastTimer = null;
  let dealing = false;

  const $ = id => document.getElementById(id);
  const UI = {};
  const ids = ['pkWelcome','pkGame','pkSolo','pkLocal','pkContinue','pkContinueTitle','pkContinueMeta','pkSetup','pkSetupForm','pkSetupClose','pkSetupTitle','pkMode','pkPlayerName','pkStartingStack','pkBlinds','pkSpeed','pkAiSetup','pkAiCount','pkAiPreview','pkLocalSetup','pkLocalCount','pkLocalNames','pkAutoBlinds','pkRules','pkRulesModal','pkRulesClose','pkRulesOk','pkMusic','backgroundMusic','pkPhaseKicker','pkPhaseLabel','pkBlindLabel','pkDealerMessage','pkPot','pkSidePot','pkBoard','pkMessage','pkSeats','pkPrivateHand','pkHandKicker','pkHandName','pkHandDetail','pkActions','pkFold','pkCheckCall','pkCallAmount','pkRaiseSlider','pkRaiseValue','pkRaise','pkExit','pkLogToggle','pkLogClose','pkLogPanel','pkLog','pkHandoff','pkHandoffToken','pkHandoffName','pkReveal','pkHandResult','pkResultKicker','pkResultTitle','pkResultText','pkResultList','pkNextHand','pkGameResult','pkGameResultTitle','pkGameResultText','pkFinalRanking','pkRematch','pkToast'];
  ids.forEach(id => UI[id] = $(id));

  function boot(){
    bindUi();
    populateAiPreview();
    populateLocalNames(2);
    hydrateProfile();
    refreshContinue();
    applyDealerAsset();
  }

  function bindUi(){
    UI.pkSolo.addEventListener('click',()=>openSetup('ai'));
    UI.pkLocal.addEventListener('click',()=>openSetup('local'));
    UI.pkContinue.addEventListener('click',resumeGame);
    UI.pkSetupClose.addEventListener('click',()=>UI.pkSetup.close());
    UI.pkSetupForm.addEventListener('submit',event=>{event.preventDefault();createGameFromForm();});
    UI.pkAiCount.addEventListener('change',populateAiPreview);
    UI.pkLocalCount.addEventListener('change',()=>populateLocalNames(Number(UI.pkLocalCount.value)));
    UI.pkRules.addEventListener('click',()=>UI.pkRulesModal.showModal());
    UI.pkRulesClose.addEventListener('click',()=>UI.pkRulesModal.close());
    UI.pkRulesOk.addEventListener('click',()=>UI.pkRulesModal.close());
    UI.pkFold.addEventListener('click',()=>humanAction('fold'));
    UI.pkCheckCall.addEventListener('click',()=>humanAction(legalFor(currentPlayer()).callAmount ? 'call' : 'check'));
    UI.pkRaise.addEventListener('click',()=>humanAction('raise',Number(UI.pkRaiseSlider.value)));
    UI.pkRaiseSlider.addEventListener('input',()=>UI.pkRaiseValue.textContent=formatChips(Number(UI.pkRaiseSlider.value)));
    document.querySelectorAll('[data-raise-preset]').forEach(button=>button.addEventListener('click',()=>setRaisePreset(button.dataset.raisePreset)));
    UI.pkReveal.addEventListener('click',revealLocalTurn);
    UI.pkExit.addEventListener('click',exitToMenu);
    UI.pkLogToggle.addEventListener('click',()=>UI.pkLogPanel.classList.add('open'));
    UI.pkLogClose.addEventListener('click',()=>UI.pkLogPanel.classList.remove('open'));
    UI.pkNextHand.addEventListener('click',nextHandFromResult);
    UI.pkRematch.addEventListener('click',()=>{UI.pkGameResult.close();clearSave();showWelcome();});
    UI.pkMusic.addEventListener('click',toggleMusic);
    window.addEventListener('beforeunload',()=>{if(state?.active)saveGame();});
  }

  function hydrateProfile(){
    const club=window.SalaCeroClub?.getData?.();
    const profile=window.SalaCeroAuth?.getActiveProfile?.();
    UI.pkPlayerName.value=club?.profile?.name||profile?.name||'Jugador';
  }

  function applyDealerAsset(){
    const assets=window.SalaCeroPokerAssets||{};
    const source=assets.customDealer?assets.dealer:assets.dealerFallback;
    ['pkWelcomeDealer','pkDealerImage'].forEach(id=>{const image=$(id);if(image&&source)image.src=source;});
  }

  function populateAiPreview(){
    const count=Number(UI.pkAiCount.value||2);
    UI.pkAiPreview.innerHTML=AI_PROFILES.slice(0,count).map(ai=>`<article class="pk-ai-card"><b>${escapeHtml(ai.name)}</b><small>${escapeHtml(ai.label)}</small></article>`).join('');
  }

  function populateLocalNames(count){
    const existing=[...UI.pkLocalNames.querySelectorAll('input')].map(input=>input.value);
    const profile=window.SalaCeroClub?.getData?.().profile?.name||'Jugador 1';
    UI.pkLocalNames.innerHTML=Array.from({length:count},(_,index)=>`<input maxlength="18" data-local-name="${index}" value="${escapeHtml(existing[index]|| (index===0?profile:`Jugador ${index+1}`))}" aria-label="Nombre del jugador ${index+1}">`).join('');
  }

  function openSetup(mode){
    UI.pkMode.value=mode;
    UI.pkSetupTitle.textContent=mode==='ai'?'Partida contra IA':'Multijugador local';
    UI.pkAiSetup.classList.toggle('hidden',mode!=='ai');
    UI.pkLocalSetup.classList.toggle('hidden',mode!=='local');
    hydrateProfile();
    UI.pkSetup.showModal();
  }

  function createGameFromForm(){
    const mode=UI.pkMode.value;
    const stack=Math.max(200,Number(UI.pkStartingStack.value)||1000);
    const [sb,bb]=UI.pkBlinds.value.split(',').map(Number);
    const speed=UI.pkSpeed.value;
    const baseName=cleanName(UI.pkPlayerName.value,'Jugador');
    let players=[];
    if(mode==='ai'){
      const count=Math.max(1,Math.min(3,Number(UI.pkAiCount.value)||2));
      players=[makePlayer(0,baseName,false,'♠'),...AI_PROFILES.slice(0,count).map((ai,index)=>makePlayer(index+1,ai.name,true,ai.avatar,ai.style))];
    }else{
      const count=Math.max(2,Math.min(4,Number(UI.pkLocalCount.value)||2));
      players=[...UI.pkLocalNames.querySelectorAll('input')].slice(0,count).map((input,index)=>makePlayer(index,cleanName(input.value,`Jugador ${index+1}`),false,index===0?'♠':String(index+1)));
    }
    state={version:VERSION,active:true,finished:false,recorded:false,mode,players,dealer:-1,sbSeat:-1,bbSeat:-1,smallBlind:sb,bigBlind:bb,initialSmallBlind:sb,initialBigBlind:bb,startingStack:stack,autoBlinds:UI.pkAutoBlinds.checked,speed,handNumber:0,phase:'idle',deck:[],board:[],burn:[],current:-1,currentBet:0,minRaise:bb,noReopen:[],busy:false,showdown:false,revealedSeat:null,awaitingReveal:false,log:[],lastResult:null,createdAt:new Date().toISOString()};
    UI.pkSetup.close();
    UI.pkWelcome.classList.add('hidden');
    UI.pkGame.classList.remove('hidden');
    savePrefs();
    startHand(true);
  }

  function makePlayer(seat,name,isAI,avatar,style='human'){
    return {seat,name,isAI,avatar,style,stack:Number(UI.pkStartingStack?.value)||1000,hand:[],folded:false,allIn:false,bet:0,totalBet:0,acted:false,lastAction:'',finish:null};
  }

  async function startHand(animate=true){
    clearTimeout(aiTimer);
    const contenders=state.players.filter(player=>player.stack>0);
    if(contenders.length<=1){finishTournament();return;}
    if(state.autoBlinds&&state.handNumber>0&&state.handNumber%8===0){state.smallBlind*=2;state.bigBlind*=2;addLog(`Las ciegas suben a <strong>${state.smallBlind} / ${state.bigBlind}</strong>.`);}
    state.handNumber+=1;
    state.phase='preflop';state.board=[];state.burn=[];state.deck=Core.shuffle(Core.createDeck());state.currentBet=0;state.minRaise=state.bigBlind;state.noReopen=[];state.busy=true;state.showdown=false;state.revealedSeat=null;state.awaitingReveal=false;state.lastResult=null;
    state.players.forEach(player=>{player.hand=[];player.folded=player.stack<=0;player.allIn=false;player.bet=0;player.totalBet=0;player.acted=false;player.lastAction=player.stack<=0?'ELIMINADO':'';});
    state.dealer=nextSeat(state.dealer,player=>player.stack>0);
    const live=state.players.filter(player=>player.stack>0).length;
    if(live===2){state.sbSeat=state.dealer;state.bbSeat=nextSeat(state.sbSeat,player=>player.stack>0);}else{state.sbSeat=nextSeat(state.dealer,player=>player.stack>0);state.bbSeat=nextSeat(state.sbSeat,player=>player.stack>0);}
    postBlind(state.sbSeat,state.smallBlind,'CIEGA PEQUEÑA');
    postBlind(state.bbSeat,state.bigBlind,'CIEGA GRANDE');
    state.currentBet=Math.max(...state.players.map(player=>player.bet));
    const sequence=[];
    for(let round=0;round<2;round++){
      let seat=nextSeat(state.dealer,player=>player.stack>0);
      for(let i=0;i<live;i++){
        const player=state.players[seat];
        player.hand.push(state.deck.pop());sequence.push(seat);
        seat=nextSeat(seat,p=>p.stack>0);
      }
    }
    state.current=live===2?state.dealer:nextSeat(state.bbSeat,player=>canAct(player));
    addLog(`<strong>Anton</strong> reparte la mano ${state.handNumber}.`);
    render();
    if(animate)await animateDeal(sequence);
    state.busy=false;
    saveGame();render();beginTurn();
  }

  function postBlind(seat,amount,label){
    const player=state.players[seat];
    const paid=commitChips(player,amount);player.lastAction=`${label} · ${formatChips(paid)}`;
  }

  function commitChips(player,amount){
    const paid=Math.max(0,Math.min(player.stack,Math.round(amount)));
    player.stack-=paid;player.bet+=paid;player.totalBet+=paid;if(player.stack===0)player.allIn=true;return paid;
  }

  function beginTurn(){
    clearTimeout(aiTimer);
    if(!state||state.busy||['handOver','gameOver'].includes(state.phase))return;
    if(nonFolded().length===1){awardUncontested();return;}
    if(bettingComplete()){advanceStreet();return;}
    if(!needsAction(state.players[state.current]))state.current=findNextAction(state.current);
    if(state.current<0){advanceStreet();return;}
    const player=currentPlayer();
    state.revealedSeat=state.mode==='ai'&&!player.isAI?player.seat:null;
    state.awaitingReveal=state.mode==='local'&&!player.isAI;
    render();saveGame();
    if(player.isAI){const delay=SPEEDS[state.speed]||650;aiTimer=setTimeout(()=>takeAiTurn(player.seat),delay);}
    else if(state.awaitingReveal)showHandoff(player);
  }

  function showHandoff(player){
    UI.pkHandoffName.textContent=player.name;UI.pkHandoffToken.textContent=player.avatar||'♠';UI.pkHandoff.classList.remove('hidden');
  }
  function revealLocalTurn(){
    if(!state||state.mode!=='local')return;
    state.awaitingReveal=false;state.revealedSeat=state.current;UI.pkHandoff.classList.add('hidden');render();
  }

  function currentPlayer(){return state.players[state.current];}
  function canAct(player){return player&&!player.folded&&!player.allIn&&player.stack>=0;}
  function needsAction(player){return canAct(player)&&(!player.acted||player.bet<state.currentBet);}
  function nonFolded(){return state.players.filter(player=>!player.folded&&player.hand.length===2);}
  function bettingComplete(){const actors=nonFolded().filter(player=>!player.allIn);return actors.length===0||actors.every(player=>player.acted&&player.bet===state.currentBet);}
  function nextSeat(from,predicate){
    const total=state.players.length;
    for(let step=1;step<=total;step++){const seat=(from+step+total)%total;if(predicate(state.players[seat]))return seat;}
    return -1;
  }
  function findNextAction(from){return nextSeat(from,needsAction);}

  function legalFor(player){
    if(!player)return {callAmount:0,canCheck:false,canCall:false,canRaise:false,minRaiseTo:0,maxTo:0};
    const callAmount=Math.max(0,state.currentBet-player.bet);
    const maxTo=player.bet+player.stack;
    const minFull=state.currentBet+state.minRaise;
    const canRaise=maxTo>state.currentBet&&!state.noReopen.includes(player.seat);
    return {callAmount,canCheck:callAmount===0,canCall:callAmount>0&&player.stack>0,canRaise,minRaiseTo:canRaise?Math.min(maxTo,minFull):maxTo,maxTo};
  }

  function humanAction(type,target){
    if(!state||state.busy)return;
    const player=currentPlayer();
    if(!player||player.isAI)return;
    if(state.mode==='local'&&(state.awaitingReveal||state.revealedSeat!==player.seat))return;
    applyAction(player.seat,type,target);
  }

  function applyAction(seat,type,target){
    if(state.busy||seat!==state.current)return;
    const player=state.players[seat];const legal=legalFor(player);const previousActed=state.players.filter(p=>p.acted&&!p.folded&&!p.allIn).map(p=>p.seat);
    let label='';let paid=0;
    if(type==='fold'){
      player.folded=true;player.acted=true;label='SE RETIRA';
    }else if(type==='check'&&legal.canCheck){
      player.acted=true;label='PASA';
    }else if(type==='call'&&legal.callAmount>0){
      paid=commitChips(player,legal.callAmount);player.acted=true;label=paid<legal.callAmount?`ALL-IN · ${formatChips(paid)}`:`IGUALA · ${formatChips(paid)}`;
    }else if((type==='raise'||type==='allin')&&legal.canRaise){
      const desired=type==='allin'?legal.maxTo:Number(target);
      const raiseTo=Math.max(state.currentBet+1,Math.min(legal.maxTo,Math.round(desired||legal.minRaiseTo)));
      const isFull=raiseTo>=state.currentBet+state.minRaise;
      paid=commitChips(player,raiseTo-player.bet);
      const oldBet=state.currentBet;state.currentBet=player.bet;
      if(isFull){
        state.minRaise=Math.max(state.bigBlind,state.currentBet-oldBet);state.noReopen=[];
        state.players.forEach(other=>{if(other.seat!==seat&&canAct(other))other.acted=false;});
      }else{
        state.noReopen=[...new Set([...state.noReopen,...previousActed.filter(other=>other!==seat)])];
      }
      player.acted=true;label=player.allIn?`ALL-IN · ${formatChips(player.bet)}`:`SUBE A ${formatChips(player.bet)}`;
    }else return;
    player.lastAction=label;state.revealedSeat=null;state.awaitingReveal=false;
    animateBet(seat,paid||Math.min(legal.callAmount,player.totalBet));
    addLog(`<strong>${escapeHtml(player.name)}</strong> ${label.toLowerCase()}.`);
    if(nonFolded().length===1){render();saveGame();setTimeout(awardUncontested,350);return;}
    if(bettingComplete()){render();saveGame();setTimeout(advanceStreet,420);return;}
    state.current=findNextAction(seat);render();saveGame();setTimeout(beginTurn,120);
  }

  async function advanceStreet(){
    if(state.busy)return;
    state.busy=true;state.revealedSeat=null;state.awaitingReveal=false;
    if(state.phase==='river'){await showdown();return;}
    state.players.forEach(player=>{player.bet=0;player.acted=false;});state.currentBet=0;state.minRaise=state.bigBlind;state.noReopen=[];
    if(state.phase==='preflop'){state.phase='flop';state.burn.push(state.deck.pop());for(let i=0;i<3;i++)state.board.push(state.deck.pop());}
    else if(state.phase==='flop'){state.phase='turn';state.burn.push(state.deck.pop());state.board.push(state.deck.pop());}
    else if(state.phase==='turn'){state.phase='river';state.burn.push(state.deck.pop());state.board.push(state.deck.pop());}
    UI.pkDealerMessage.textContent=state.phase==='flop'?'Descubriendo el flop':state.phase==='turn'?'Carta del turn':'Carta del river';
    addLog(`<strong>Anton</strong> descubre el ${PHASE_LABEL[state.phase].toLowerCase()}.`);
    render();await wait(reducedMotion()?20:430);
    const actors=nonFolded().filter(player=>!player.allIn);
    if(actors.length<=1){
      while(state.board.length<5){state.burn.push(state.deck.pop());state.board.push(state.deck.pop());render();await wait(reducedMotion()?20:360);}
      await showdown();return;
    }
    state.current=nextSeat(state.dealer,player=>canAct(player));state.busy=false;saveGame();render();beginTurn();
  }

  async function showdown(){
    state.busy=true;state.phase='showdown';state.showdown=true;state.revealedSeat=null;render();
    await wait(reducedMotion()?20:650);
    const result=Core.settleShowdown(state.players,state.board,state.dealer);
    Object.entries(result.payouts).forEach(([seat,amount])=>{state.players[Number(seat)].stack+=amount;});
    const paidSeats=Object.entries(result.payouts).filter(([,amount])=>amount>0).map(([seat])=>Number(seat));
    const descriptions=paidSeats.map(seat=>{
      const player=state.players[seat],evaluation=result.evaluations[seat];return `${player.name} gana ${formatChips(result.payouts[seat])} con ${evaluation?.name||'la mejor mano'}`;
    });
    const topWinners=[...paidSeats].sort((a,b)=>result.payouts[b]-result.payouts[a]);
    state.lastResult={type:'showdown',title:topWinners.length>1?'Botes adjudicados':`${state.players[topWinners[0]]?.name||'Jugador'} gana la mano`,text:descriptions.join('. '),payouts:result.payouts,evaluations:serializeEvaluations(result.evaluations)};
    addLog(descriptions.map(text=>`<strong>${escapeHtml(text)}</strong>`).join('<br>'));
    state.phase='handOver';state.busy=false;saveGame();render();openHandResult();
  }

  function serializeEvaluations(evaluations){const out={};Object.entries(evaluations).forEach(([seat,item])=>out[seat]={score:item.score,category:item.category,name:item.name});return out;}

  function awardUncontested(){
    if(!state||state.phase==='handOver')return;
    const winner=nonFolded()[0];if(!winner)return;
    const pot=potTotal();winner.stack+=pot;
    state.lastResult={type:'uncontested',title:`${winner.name} se lleva el bote`,text:`El resto de la mesa se retiró. Anton entrega ${formatChips(pot)} fichas.`,payouts:{[winner.seat]:pot},evaluations:{}};
    addLog(`<strong>${escapeHtml(winner.name)}</strong> gana ${formatChips(pot)} sin mostrar sus cartas.`);
    state.phase='handOver';state.showdown=false;state.busy=false;saveGame();render();openHandResult();
  }

  function openHandResult(){
    const result=state.lastResult||{};UI.pkResultTitle.textContent=result.title||'Mano terminada';UI.pkResultText.textContent=result.text||'';
    const rows=state.players.filter(player=>player.hand.length).map(player=>{const amount=Number(result.payouts?.[player.seat])||0;const evalName=result.evaluations?.[player.seat]?.name||'';return `<div class="pk-result-row ${amount>0?'winner':''}"><span>${escapeHtml(player.name)}${evalName?` · ${escapeHtml(evalName)}`:''}</span><strong>${amount>0?`+${formatChips(amount)}`:formatChips(player.stack)}</strong></div>`;}).join('');
    UI.pkResultList.innerHTML=rows;
    const alive=state.players.filter(player=>player.stack>0);UI.pkNextHand.textContent=alive.length<=1?'Ver campeón':'Siguiente mano';
    if(!UI.pkHandResult.open)UI.pkHandResult.showModal();
  }

  function nextHandFromResult(){
    UI.pkHandResult.close();
    if(state.players.filter(player=>player.stack>0).length<=1){finishTournament();return;}
    startHand(true);
  }

  function finishTournament(){
    if(!state)return;
    state.phase='gameOver';state.finished=true;state.active=false;state.busy=false;
    const ranking=state.players.slice().sort((a,b)=>b.stack-a.stack);const champion=ranking[0];
    UI.pkGameResultTitle.textContent=`${champion.name}, campeón de la mesa`;
    UI.pkGameResultText.textContent=`Anton cierra el casino después de ${state.handNumber} manos. ${champion.name} reúne ${formatChips(champion.stack)} fichas.`;
    UI.pkFinalRanking.innerHTML=ranking.map((player,index)=>`<div class="pk-result-row ${index===0?'winner':''}"><span>${index+1}. ${escapeHtml(player.name)}</span><strong>${formatChips(player.stack)}</strong></div>`).join('');
    if(!state.recorded){
      const human=state.players[0];window.SalaCeroClub?.recordMatch?.({game:'poker',won:state.mode==='ai'&&champion.seat===human.seat,local:state.mode==='local',mode:state.mode,score:human?.stack||0,special:champion.seat===human?.seat?'champion':''});state.recorded=true;
    }
    clearSave();render();if(!UI.pkGameResult.open)UI.pkGameResult.showModal();
  }

  function takeAiTurn(seat){
    if(!state||state.busy||state.current!==seat)return;
    const player=state.players[seat];const legal=legalFor(player);const strength=estimateStrength(player);const pot=potTotal();
    const personality={conservative:-.12,aggressive:.13,wild:(Math.random()-.5)*.3}[player.style]||0;
    const adjusted=Math.max(0,Math.min(1,strength+personality));
    let action='check',target=0;
    if(legal.callAmount===0){
      const bluff=player.style==='wild'&&Math.random()<.2;
      if(legal.canRaise&&(adjusted>.63||bluff||player.style==='aggressive'&&Math.random()<.22)){
        action='raise';target=aiRaiseTarget(player,legal,pot,adjusted);
      }
    }else{
      const potOdds=legal.callAmount/Math.max(1,pot+legal.callAmount);
      const pressure=legal.callAmount/Math.max(1,player.stack+legal.callAmount);
      const bluffCall=player.style==='wild'&&Math.random()<.18;
      if(adjusted+(.12-pressure*.18)<potOdds+.15&&!bluffCall)action='fold';
      else if(legal.canRaise&&adjusted>.76-(player.style==='aggressive'?.1:0)&&Math.random()<.62){action='raise';target=aiRaiseTarget(player,legal,pot,adjusted);}
      else action='call';
    }
    applyAction(seat,action,target);
  }

  function aiRaiseTarget(player,legal,pot,strength){
    const fraction=strength>.88?1:strength>.7?.66:.45;
    const desired=state.currentBet+Math.max(state.minRaise,Math.round(pot*fraction/state.bigBlind)*state.bigBlind);
    return Math.max(legal.minRaiseTo,Math.min(legal.maxTo,desired));
  }

  function estimateStrength(player){
    if(state.board.length<3)return Core.preflopStrength(player.hand);
    const evaluation=Core.evaluate([...player.hand,...state.board]);
    let value=evaluation.category/8*.78+(evaluation.score[1]||0)/14*.18;
    const suits={};[...player.hand,...state.board].forEach(card=>suits[card.suit]=(suits[card.suit]||0)+1);if(Math.max(...Object.values(suits))===4)value+=.07;
    return Math.max(.06,Math.min(.98,value));
  }

  function setRaisePreset(type){
    if(!state)return;const player=currentPlayer();if(!player)return;const legal=legalFor(player);let target=legal.minRaiseTo;
    if(type==='half')target=state.currentBet+Math.max(state.minRaise,Math.round(potTotal()/2/state.bigBlind)*state.bigBlind);
    if(type==='pot')target=state.currentBet+Math.max(state.minRaise,Math.round(potTotal()/state.bigBlind)*state.bigBlind);
    if(type==='allin')target=legal.maxTo;
    target=Math.max(legal.minRaiseTo,Math.min(legal.maxTo,target));UI.pkRaiseSlider.value=String(target);UI.pkRaiseValue.textContent=formatChips(target);
  }

  function render(){
    if(!state)return;
    document.body.dataset.pokerMode=state.mode;
    UI.pkWelcome.classList.add('hidden');UI.pkGame.classList.remove('hidden');
    UI.pkPhaseKicker.textContent=`MANO ${state.handNumber}`;UI.pkPhaseLabel.textContent=PHASE_LABEL[state.phase]||state.phase.toUpperCase();UI.pkBlindLabel.textContent=`${formatChips(state.smallBlind)} / ${formatChips(state.bigBlind)}`;
    UI.pkPot.textContent=formatChips(potTotal());
    const pots=Core.buildSidePots(state.players);UI.pkSidePot.textContent=pots.length>1?`${pots.length-1} bote${pots.length>2?'s':''} lateral${pots.length>2?'es':''}`:'';
    UI.pkDealerMessage.textContent=dealerMessage();UI.pkMessage.textContent=tableMessage();
    renderBoard();renderSeats();renderHero();renderActions();renderLog();
  }

  function renderBoard(){
    const cards=state.board.map(card=>cardHtml(card,true)).join('');
    const blanks=Array.from({length:Math.max(0,5-state.board.length)},()=>'<div class="pk-card pk-card-slot" aria-hidden="true"></div>').join('');
    UI.pkBoard.innerHTML=cards+blanks;
  }

  function visualPosition(seat){const count=state.players.length;if(count===2)return seat===0?0:2;if(count===3)return [0,1,3][seat];return seat;}
  function renderSeats(){
    UI.pkSeats.innerHTML=state.players.map(player=>{
      const visible=shouldRevealSeat(player);const cardMarkup=player.hand.length?player.hand.map(card=>visible?cardHtml(card):cardBackHtml()).join(''):'';
      const markers=[player.seat===state.dealer?'<span class="pk-marker">D</span>':'',player.seat===state.sbSeat?'<span class="pk-marker sb">SB</span>':'',player.seat===state.bbSeat?'<span class="pk-marker bb">BB</span>':''].join('');
      return `<article class="pk-seat seat-${visualPosition(player.seat)} ${state.current===player.seat&&!state.busy?'active':''} ${player.folded?'folded':''} ${player.stack<=0?'eliminated':''}" data-seat="${player.seat}"><div class="pk-markers">${markers}</div><div class="pk-seat-head"><span class="pk-avatar">${escapeHtml(player.avatar||String(player.seat+1))}</span><div class="pk-seat-name"><strong>${escapeHtml(player.name)}</strong><small>${player.isAI?styleLabel(player.style):state.mode==='local'?'JUGADOR LOCAL':'TÚ'}</small></div><div class="pk-stack"><b>${formatChips(player.stack)}</b><small>FICHAS</small></div></div><div class="pk-seat-cards">${cardMarkup}</div><div class="pk-seat-action">${escapeHtml(player.lastAction||'')}</div>${player.bet>0?`<div class="pk-seat-bet">${formatChips(player.bet)}</div>`:''}</article>`;
    }).join('');
  }

  function shouldRevealSeat(player){
    if(state.showdown&&!player.folded)return true;
    if(state.mode==='ai'&&player.seat===0)return true;
    if(state.mode==='local'&&state.revealedSeat===player.seat)return true;
    return false;
  }

  function renderHero(){
    let player=null;
    if(state.mode==='ai')player=state.players[0];
    else if(state.revealedSeat!==null)player=state.players[state.revealedSeat];
    else if(state.showdown)player=state.players[state.current]||state.players[0];
    if(!player){UI.pkPrivateHand.innerHTML=cardBackHtml()+cardBackHtml();UI.pkHandKicker.textContent='MANO PRIVADA';UI.pkHandName.textContent='Cartas protegidas';UI.pkHandDetail.textContent='Confirma el turno para mostrar la mano.';return;}
    const reveal=shouldRevealSeat(player)||state.mode==='ai';UI.pkPrivateHand.innerHTML=player.hand.map(card=>reveal?cardHtml(card):cardBackHtml()).join('');UI.pkHandKicker.textContent=state.mode==='local'?player.name.toUpperCase():'TU MANO';
    const info=describeHand(player);UI.pkHandName.textContent=info.name;UI.pkHandDetail.textContent=info.detail;
  }

  function describeHand(player){
    if(player.hand.length<2)return {name:'Esperando reparto',detail:'Anton baraja las cartas.'};
    if(state.board.length>=3){const evaluation=Core.evaluate([...player.hand,...state.board]);return {name:evaluation.name,detail:`Mejor combinación disponible con las cartas conocidas.`};}
    const [a,b]=player.hand;const pair=a.rank===b.rank;const suited=a.suit===b.suit;
    return {name:pair?`Pareja de ${RANK_TEXT[a.rank]}`:`${Core.cardLabel(a)} · ${Core.cardLabel(b)}`,detail:pair?'Pareja de mano antes del flop.':`${suited?'Cartas del mismo palo.':'Cartas de distinto palo.'}`};
  }

  function renderActions(){
    const player=currentPlayer();const humanTurn=player&&!player.isAI&&!state.busy&&!['handOver','gameOver','showdown'].includes(state.phase)&&(state.mode!=='local'||(!state.awaitingReveal&&state.revealedSeat===player.seat));
    const legal=legalFor(player);UI.pkFold.disabled=!humanTurn;UI.pkCheckCall.disabled=!humanTurn||(!legal.canCheck&&!legal.canCall);UI.pkCheckCall.querySelector('strong').textContent=legal.callAmount?'Igualar':'Pasar';UI.pkCallAmount.textContent=legal.callAmount?formatChips(Math.min(legal.callAmount,player?.stack||0)):'Check';
    UI.pkRaise.disabled=!humanTurn||!legal.canRaise;UI.pkRaiseSlider.disabled=!humanTurn||!legal.canRaise;document.querySelectorAll('[data-raise-preset]').forEach(button=>button.disabled=!humanTurn||!legal.canRaise);
    if(player&&legal.canRaise){const min=Math.max(player.bet+1,legal.minRaiseTo);const max=Math.max(min,legal.maxTo);UI.pkRaiseSlider.min=String(min);UI.pkRaiseSlider.max=String(max);UI.pkRaiseSlider.step=String(Math.max(1,state.bigBlind));let value=Number(UI.pkRaiseSlider.value);if(value<min||value>max)value=min;UI.pkRaiseSlider.value=String(value);UI.pkRaiseValue.textContent=formatChips(value);}
  }

  function renderLog(){UI.pkLog.innerHTML=state.log.slice().reverse().map(entry=>`<p>${entry}</p>`).join('')||'<p>Anton todavía no ha repartido ninguna mano.</p>';}

  function dealerMessage(){
    if(state.phase==='handOver')return 'Preparando el resultado';if(state.phase==='gameOver')return 'La mesa tiene campeón';if(state.busy)return 'Anton mueve las cartas';const player=currentPlayer();return player?`Turno de ${player.name}`:'Esperando la mesa';
  }
  function tableMessage(){
    if(state.phase==='handOver')return state.lastResult?.title||'Mano terminada';if(state.phase==='gameOver')return 'La partida ha terminado';if(state.busy)return 'Anton está repartiendo.';const player=currentPlayer();if(!player)return 'Esperando siguiente fase.';const call=legalFor(player).callAmount;return `${player.name}: ${call?`debe igualar ${formatChips(Math.min(call,player.stack))}`:'puede pasar o apostar'}.`;
  }

  function cardHtml(card,animated=false){
    const assets=window.SalaCeroPokerAssets||{};
    if(assets.customCards){const src=assets.cardPath(card);return `<div class="pk-card ${animated?'dealt':''}"><img src="${src}" alt="${escapeHtml(Core.cardLabel(card))}"></div>`;}
    const red=card.suit==='h'||card.suit==='d';const rank=Core.RANK_LABEL[card.rank]||card.rank;const suit=Core.SUIT_LABEL[card.suit];return `<div class="pk-card ${red?'red':''} ${animated?'dealt':''}" data-card="${card.id}"><span class="corner">${rank}<i>${suit}</i></span><span class="suit-large">${suit}</span><span class="corner bottom">${rank}<i>${suit}</i></span></div>`;
  }
  function cardBackHtml(){const assets=window.SalaCeroPokerAssets||{};return assets.customCards?`<div class="pk-card"><img src="${assets.back}" alt="Carta boca abajo"></div>`:'<div class="pk-card back" aria-label="Carta boca abajo"></div>';}

  async function animateDeal(sequence){
    if(reducedMotion())return;
    dealing=true;
    for(const seat of sequence){
      const target=document.querySelector(`[data-seat="${seat}"]`);const dealer=$('pkDealerImage');if(!target||!dealer)continue;
      const from=dealer.getBoundingClientRect(),to=target.getBoundingClientRect();const card=document.createElement('div');card.className='pk-card back pk-chip-flight';card.style.left=`${from.left+from.width/2-15}px`;card.style.top=`${from.top+from.height*.55}px`;card.style.width='30px';card.style.height='42px';document.body.appendChild(card);
      const animation=card.animate([{transform:'translate(0,0) rotate(-8deg) scale(.75)',opacity:.4},{transform:`translate(${to.left+to.width/2-(from.left+from.width/2)}px,${to.top+to.height/2-(from.top+from.height*.55)}px) rotate(8deg) scale(1)`,opacity:1}],{duration:220,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'});await Promise.race([animation.finished,wait(240)]);card.remove();await wait(35);
    }
    dealing=false;
  }

  function animateBet(seat,amount){
    if(!amount||reducedMotion())return;const source=document.querySelector(`[data-seat="${seat}"]`),pot=UI.pkPot;if(!source||!pot)return;const a=source.getBoundingClientRect(),b=pot.getBoundingClientRect();const chip=document.createElement('span');chip.className='pk-chip-flight';chip.style.left=`${a.left+a.width/2}px`;chip.style.top=`${a.top+a.height/2}px`;document.body.appendChild(chip);chip.animate([{transform:'translate(0,0) scale(.8)'},{transform:`translate(${b.left+b.width/2-(a.left+a.width/2)}px,${b.top+b.height/2-(a.top+a.height/2)}px) scale(1)`}],{duration:360,easing:'cubic-bezier(.2,.8,.2,1)'}).finished.finally(()=>chip.remove());
  }

  function potTotal(){return state?state.players.reduce((sum,player)=>sum+(Number(player.totalBet)||0),0):0;}
  function addLog(html){state.log.push(html);if(state.log.length>80)state.log.shift();}
  function formatChips(value){return new Intl.NumberFormat('es-ES').format(Math.max(0,Math.round(Number(value)||0)));}
  function styleLabel(style){return ({conservative:'CONSERVADOR',aggressive:'AGRESIVA',wild:'IMPREVISIBLE'}[style]||'RIVAL IA');}
  function cleanName(value,fallback){return String(value||'').trim().replace(/\s+/g,' ').slice(0,18)||fallback;}
  function escapeHtml(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));}
  function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
  function reducedMotion(){return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;}

  function savePrefs(){try{localStorage.setItem(PREF_KEY,JSON.stringify({stack:UI.pkStartingStack.value,blinds:UI.pkBlinds.value,speed:UI.pkSpeed.value,aiCount:UI.pkAiCount.value,autoBlinds:UI.pkAutoBlinds.checked}));}catch(_){} }
  function saveGame(){if(!state)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));}catch(_){}refreshContinue();}
  function clearSave(){try{localStorage.removeItem(SAVE_KEY);}catch(_){}refreshContinue();}
  function loadSave(){try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch(_){return null;}}
  function refreshContinue(){const saved=loadSave();const valid=saved?.players?.length>=2&&!saved.finished;if(!UI.pkContinue)return;UI.pkContinue.disabled=!valid;if(valid){UI.pkContinueTitle.textContent=`Mano ${saved.handNumber} · ${saved.players.length} jugadores`;UI.pkContinueMeta.textContent=`${saved.mode==='local'?'Partida local':'Contra IA'} · ciegas ${saved.smallBlind}/${saved.bigBlind}`;}else{UI.pkContinueTitle.textContent='Sin partida pendiente';UI.pkContinueMeta.textContent='La mesa se guarda después de cada decisión.';}}
  function resumeGame(){const saved=loadSave();if(!saved)return;state={...saved,version:VERSION,busy:false,revealedSeat:null,awaitingReveal:false,noReopen:Array.isArray(saved.noReopen)?saved.noReopen:[]};UI.pkWelcome.classList.add('hidden');UI.pkGame.classList.remove('hidden');render();if(state.phase==='handOver')openHandResult();else if(state.phase==='gameOver')finishTournament();else beginTurn();}
  function exitToMenu(){if(state?.active)saveGame();clearTimeout(aiTimer);showWelcome();}
  function showWelcome(){state=null;UI.pkHandoff.classList.add('hidden');UI.pkGame.classList.add('hidden');UI.pkWelcome.classList.remove('hidden');UI.pkLogPanel.classList.remove('open');refreshContinue();window.scrollTo({top:0,behavior:'instant'});}

  async function toggleMusic(){const audio=UI.backgroundMusic;if(!audio)return;if(audio.paused){try{await audio.play();localStorage.setItem('tuteIaMusicEnabled','true');UI.pkMusic.textContent='♫';}catch(_){showToast('Pulsa de nuevo para activar la música.');}}else{audio.pause();localStorage.setItem('tuteIaMusicEnabled','false');UI.pkMusic.textContent='♩';}}
  function showToast(text){clearTimeout(toastTimer);UI.pkToast.textContent=text;UI.pkToast.classList.add('visible');toastTimer=setTimeout(()=>UI.pkToast.classList.remove('visible'),1900);}

  document.addEventListener('DOMContentLoaded',boot);
})();
