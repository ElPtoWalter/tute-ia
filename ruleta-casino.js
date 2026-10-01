(() => {
  "use strict";
  const R=window.SalaCeroRouletteCore, P=window.SalaCeroPrefs, G=window.SalaCeroGame;
  const $=id=>document.getElementById(id), escape=G.escapeHtml;
  const KEY="salaCeroRuletaV27";
  const labels={red:"rojo",black:"negro",green:"verde"};
  // Exclusivamente automatización en loopback. En Pages ni una variable inyectada cambia el azar.
  const testing=location.hostname==="127.0.0.1" && navigator.webdriver===true ? window.__SC_ROULETTE_TEST__ : null;
  const rng=()=>testing?.results?.length ? testing.results.shift() : R.randomNumber();
  let saved=null;
  try { saved=R.Session.restore(JSON.parse(localStorage.getItem(KEY)||"null"),rng); } catch (_) {}
  let session=saved, chip=5, preview=null, animation=null, wheelAngle=0, ballAngle=0, noticeTimer;
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(session.serialize()));}catch(_){}};
  const notice=message=>{clearTimeout(noticeTimer);$("rouletteNotice").textContent=message;$("rouletteNotice").hidden=false;noticeTimer=setTimeout(()=>$("rouletteNotice").hidden=true,3500);};
  function action(fn) {
    try { fn(); preview=null;persist();render();P.haptic(14); }
    catch(error){notice(error.message);}
  }
  function names() {
    const count=Number($("playerCount").value);
    $("playerNames").innerHTML=Array.from({length:count},(_,i)=>`<label>Nombre ${count===1?"":i+1}<input data-name maxlength="18" autocomplete="off" value="${escape(i===0?P.get().name:`Jugador ${i+1}`)}" required></label>`).join("");
  }
  function start() {
    $("setup").hidden=true;$("table").hidden=false;document.body.classList.add("game-in-progress");
    // Al reanudar, la bola también representa el resultado ya liquidado, sin volver a girar.
    wheelAngle=0;ballAngle=session.lastRound?R.order.indexOf(session.lastRound.number)*360/37:0;
    $("wheelRotor").style.transform="rotate(0deg)";$("ballRotor").style.transform=`rotate(${ballAngle}deg)`;
    if(session.lastRound)$("wheel").dataset.winner=String(session.lastRound.number);else delete $("wheel").dataset.winner;
    $("wheelDetails").open=innerWidth>950;preview=null;persist();render();
    $("spin").focus({preventScroll:true});
  }
  names();$("resumeSession").hidden=!saved;
  $("playerCount").addEventListener("change",names);
  $("initialBalance").addEventListener("change",()=>{const custom=$("initialBalance").value==="custom";$("customLabel").hidden=!custom;$("customBalance").required=custom;});
  $("sessionForm").addEventListener("submit",event=>{
    event.preventDefault();
    try{const balance=Number($("initialBalance").value==="custom"?$("customBalance").value:$("initialBalance").value);session=new R.Session({balance,names:[...document.querySelectorAll("[data-name]")].map(input=>input.value),rng});start();}catch(error){notice(error.message);}
  });
  $("resumeSession").addEventListener("click",()=>{session=saved;start();});
  $("rulesOpen").addEventListener("click",()=>$("rulesDialog").showModal());
  ["rulesClose","rulesDone"].forEach(id=>$(id).addEventListener("click",()=>$("rulesDialog").close()));
  $("newSession").addEventListener("click",()=>{if(session.state!=="SPINNING")$("resetDialog").showModal();});
  $("resetDialog").addEventListener("close",()=>{if($("resetDialog").returnValue!=="reset")return;saved=null;session=null;try{localStorage.removeItem(KEY);}catch(_){}$("table").hidden=true;$("setup").hidden=false;$("resumeSession").hidden=true;document.body.classList.remove("game-in-progress");names();$("startSession").focus();});
  function preferences() {
    const prefs=P.get();for(const [id,key,title] of [["soundToggle","sound","Sonido"],["hapticsToggle","haptics","Vibración"]]){$(id).setAttribute("aria-pressed",String(prefs[key]));$(id).textContent=`${title}: ${prefs[key]?"sí":"no"}`;}
  }
  [["soundToggle","sound"],["hapticsToggle","haptics"]].forEach(([id,key])=>$(id).addEventListener("click",()=>{P.save({[key]:!P.get()[key]});preferences();}));
  addEventListener("sala-cero:preferences",preferences);preferences();
  function polar(angle,radius){const radians=angle*Math.PI/180;return [180+radius*Math.sin(radians),180-radius*Math.cos(radians)];}
  const step=360/37;
  $("wheelRotor").innerHTML=R.order.map((n,i)=>{
    const a=polar(i*step-step/2,168),b=polar(i*step+step/2,168),c=polar(i*step+step/2,110),d=polar(i*step-step/2,110),p=polar(i*step,151);
    const fill={red:"#ad273b",black:"#101c16",green:"#287a4f"}[R.color(n)];
    return `<g data-pocket="${n}"><path d="M ${a.join(" ")} A 168 168 0 0 1 ${b.join(" ")} L ${c.join(" ")} A 110 110 0 0 0 ${d.join(" ")} Z" fill="${fill}" stroke="#ceb786" stroke-width=".7"/><text x="${p[0]}" y="${p[1]}" text-anchor="middle" dominant-baseline="central" transform="rotate(${i*step} ${p[0]} ${p[1]})" fill="#fff5e3" font-size="12" font-weight="700">${n}</text></g>`;
  }).join("");
  function zone(id,text,extra="",style="") {
    const bet=R.bets[id];return `<button type="button" class="${extra}" data-bet="${id}" style="${style}" aria-label="${bet.label}, premio ${bet.odds} a 1">${text}<span class="zone-stack" hidden></span></button>`;
  }
  $("numberGrid").innerHTML=Array.from({length:37},(_,n)=>{
    const col=Math.ceil(n/3)+1,row=4-((n-1)%3+1);
    return zone(`straight:${n}`,n,`number-zone ${R.color(n)} ${n===0?"zero":""}`,n?`--column:${col};--row:${row};--mobile-column:${(n-1)%3+1};--mobile-row:${Math.ceil(n/3)+1}`:"").replace('data-bet=',`data-number="${n}" data-bet=`);
  }).join("")+[3,2,1].map((n,i)=>zone(`column:${n}`,`Col. ${n}<br>2:1`,"number-zone column",`grid-column:14;grid-row:${i+1};--mobile-column:${n}`)).join("");
  $("dozens").innerHTML=[1,2,3].map(n=>zone(`dozen:${n}`,`${n}ª docena · 2:1`,"outside-zone")).join("");
  $("outside").innerHTML=["low","even","red","black","odd","high"].map(id=>zone(id,R.bets[id].label,`outside-zone ${id==="red"||id==="black"?id:""}`)).join("");
  // Columna móvil: no conservar el grid-column de la mesa horizontal.
  const mobileColumns=()=>document.querySelectorAll(".number-zone.column").forEach(el=>{el.style.gridColumn=innerWidth<=600?el.style.getPropertyValue("--mobile-column"):"14";});
  mobileColumns();addEventListener("resize",mobileColumns,{passive:true});
  $("chips").innerHTML=R.chips.map(value=>`<button type="button" class="chip-button" data-chip="${value}" aria-label="Ficha de ${value}" aria-pressed="${value===chip}"><img src="assets/poker/chips/chip-${value}.webp" alt="" width="58" height="58"><span>${value}</span></button>`).join("");
  $("chips").addEventListener("click",event=>{const button=event.target.closest("[data-chip]");if(button&&session.state!=="SPINNING"){chip=Number(button.dataset.chip);render();}});
  function previewBet(id) {preview=id;renderPreview();}
  function renderPreview(){
    const mode=$("betMode").value;
    $("betPreview").hidden=!preview;
    document.querySelectorAll("[data-number]").forEach(el=>el.classList.toggle("previewed",Boolean(preview&&R.bets[preview].numbers.includes(Number(el.dataset.number)))));
    if(!preview)return;
    const b=R.bets[preview];$("previewTitle").textContent=b.label;$("previewCopy").textContent=`Cubre ${b.numbers.join(", ")}. Premio ${b.odds}:1 + devolución. Colocarás ${chip} fichas.`;
    $("combinations").innerHTML=Object.values(R.bets).filter(other=>other.type===mode&&other.numbers.includes(b.numbers[0])).map(other=>`<button type="button" data-combination="${other.id}" aria-pressed="${other.id===preview}">${other.numbers.join(" · ")}</button>`).join("");
  }
  let anchor=0;
  function selectNumber(n){
    const mode=$("betMode").value;if(mode==="straight"){action(()=>session.place(`straight:${n}`,chip));return;}
    const choices=Object.values(R.bets).filter(b=>b.type===mode&&b.numbers.includes(n));
    if(!choices.length){notice("No hay combinaciones de este tipo con ese número");return;}
    anchor=n;previewBet(choices[0].id);
    // Mantener la selección original como ancla para todos los candidatos.
    renderCombinations();$("betPreview").scrollIntoView({block:"nearest",behavior:"auto"});
  }
  function renderCombinations(){if(!preview)return;$("combinations").innerHTML=Object.values(R.bets).filter(b=>b.type===$("betMode").value&&b.numbers.includes(anchor)).map(b=>`<button type="button" data-combination="${b.id}" aria-pressed="${b.id===preview}">${b.numbers.join(" · ")}</button>`).join("");}
  $("combinations").addEventListener("click",event=>{const button=event.target.closest("[data-combination]");if(button){previewBet(button.dataset.combination);renderCombinations();}});
  $("confirmBet").addEventListener("click",()=>{if(preview)action(()=>session.place(preview,chip));});
  $("cancelBet").addEventListener("click",()=>{preview=null;renderPreview();});
  $("betMode").addEventListener("change",()=>{preview=null;renderPreview();$("betHint").textContent=$("betMode").value==="straight"?"Toca un número para colocar la ficha seleccionada.":"Toca un número, elige la combinación y confirma la ficha. No hay que acertar en una línea pequeña.";});
  document.querySelector(".roulette-felt").addEventListener("click",event=>{
    const button=event.target.closest("[data-bet]");if(!button||session.state==="SPINNING")return;
    if(button.dataset.number!==undefined)selectNumber(Number(button.dataset.number));else action(()=>session.place(button.dataset.bet,chip));
  });
  for(const [id,method] of [["clearBets","clear"],["undoBet","undoLast"],["repeatBets","repeat"],["doubleBets","double"]])$(id).addEventListener("click",()=>action(()=>session[method]()));
  function handoff(){
    const next=session.player.name;$("table").inert=true;
    G.passScreen(next,"Tu saldo y tus apuestas se mostrarán al revelar la mesa.",()=>{$("table").inert=false;render();$("spin").focus({preventScroll:true});});
    $("passScreen").querySelector("[data-pass-reveal]").focus();
  }
  $("players").addEventListener("click",event=>{const button=event.target.closest("[data-player]");if(button)action(()=>{session.select(Number(button.dataset.player));handoff();});});
  function render(){
    if(!session)return;const spinning=session.state==="SPINNING";
    $("currentName").textContent=session.player.name;$("balance").textContent=session.player.balance.toLocaleString("es-ES");$("stake").textContent=session.stake.toLocaleString("es-ES");$("selectedChip").textContent=chip;
    $("table").dataset.state=session.state;$("players").hidden=session.players.length===1;
    $("players").innerHTML=session.players.map((p,i)=>`<button type="button" data-player="${i}" aria-pressed="${i===session.current}" ${spinning?"disabled":""}>${escape(p.name)} ${session.ready[i]?"✓":""}</button>`).join("");
    document.querySelectorAll("[data-chip]").forEach(el=>{el.setAttribute("aria-pressed",String(Number(el.dataset.chip)===chip));el.disabled=spinning;});
    document.querySelectorAll("[data-bet]").forEach(el=>{
      el.disabled=spinning;const id=el.dataset.bet;let amount=session.player.bets[id]||0;
      if(el.dataset.number!==undefined){const n=Number(el.dataset.number);amount+=Object.entries(session.player.bets).filter(([other])=>R.bets[other].type!=="straight"&&R.bets[other].type!=="outside"&&R.bets[other].numbers[0]===n).reduce((total,[,v])=>total+v,0);}
      const stack=el.querySelector(".zone-stack");stack.hidden=!amount;stack.textContent=amount;
      const b=R.bets[id];el.setAttribute("aria-label",`${b.label}, premio ${b.odds} a 1${amount?`, ${amount} fichas en esta zona`:""}`);
    });
    ["betMode","newSession","clearBets","undoBet","repeatBets","doubleBets","confirmBet","cancelBet"].forEach(id=>$(id).disabled=spinning);
    $("undoBet").disabled=spinning||!session.undo[session.current].length;
    const entries=Object.entries(session.player.bets);$("wagerCount").textContent=`${entries.length} zonas`;
    $("wagerList").innerHTML=entries.length?entries.map(([id,value])=>`<li><span>${R.bets[id].label} · ${R.bets[id].odds}:1</span><strong>${value} fichas</strong></li>`).join(""):"<li>No has colocado fichas.</li>";
    $("history").innerHTML=session.history.map(n=>`<span class="${R.color(n)}" aria-label="${n}, ${labels[R.color(n)]}">${n}</span>`).join("");
    const allReady=session.players.length===1||session.ready.every(Boolean);
    $("spin").disabled=spinning||(allReady&&!session.canSpin());$("spin").textContent=spinning?"Girando…":allReady?"Girar la ruleta":"Confirmar mi turno →";
    $("turnStatus").textContent=spinning?"No va más":allReady?"Hagan sus apuestas":`Apuesta ${session.player.name}`;
    $("dockBalance").textContent=`${session.stake} apostadas · ${session.player.balance} disponibles`;
    if(spinning){$("roundResult").innerHTML="<strong>No va más.</strong><span>La bola está girando. Las apuestas están cerradas.</span>";}
    else if(session.lastRound){
      const r=session.lastRound;$("roundResult").innerHTML=`<span class="result-number ${R.color(r.number)}">${r.number}</span><div class="result-copy"><strong>${r.number} · ${labels[R.color(r.number)]}</strong>${r.results.map(p=>`<span>${escape(p.name)}: ${p.net>=0?"+":""}${p.net} netas · devolución ${p.returned} · saldo ${p.balance}</span>`).join("")}</div>`;
    }else{$("roundResult").innerHTML="<strong>Hagan sus apuestas.</strong><span>Toca una zona del tapete. Solo fichas virtuales.</span>";}
    renderPreview();renderCombinations();
  }
  function completeSpin(){
    if(!animation)return;const run=animation;animation=null;clearTimeout(run.timer);run.animations.forEach(a=>a.cancel());
    $("wheelRotor").style.transform=`rotate(${run.wheel}deg)`;$("ballRotor").style.transform=`rotate(${run.ball}deg)`;
    wheelAngle=((run.wheel%360)+360)%360;ballAngle=((run.ball%360)+360)%360;
    $("wheel").dataset.winner=run.number;
    session.finish();persist();render();$("dealerMessage").textContent=`${run.number}, ${labels[R.color(run.number)]}. La siguiente bola empieza de cero.`;
    if(!document.hidden){P.beep(660,.09);P.haptic([30,40,30]);}
  }
  function spin(){
    if(session.state==="SPINNING")return;
    if(session.players.length>1&&!session.ready.every(Boolean)){
      action(()=>{const next=session.confirm();if(next>=0)handoff();});return;
    }
    try{
      const number=session.spin();preview=null;persist();render();P.beep(420,.06);
      const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
      const duration=testing?.duration??(reduced?120:3800);
      const finalWheel=wheelAngle+(reduced?20:1460), target=(finalWheel+R.order.indexOf(number)*step)%360;
      const finalBall=ballAngle-(reduced?0:1800)-((ballAngle-target+360)%360);
      const animations=[];
      if(typeof $("wheelRotor").animate==="function"){
        for(const [id,from,to] of [["wheelRotor",wheelAngle,finalWheel],["ballRotor",ballAngle,finalBall]])animations.push($(id).animate([{transform:`rotate(${from}deg)`},{transform:`rotate(${to}deg)`}],{duration,easing:"cubic-bezier(.15,.6,.2,1)",fill:"forwards"}));
      }
      animation={number,wheel:finalWheel,ball:finalBall,animations,timer:setTimeout(completeSpin,duration+80)};
      if(animations.length)Promise.all(animations.map(a=>a.finished)).then(completeSpin).catch(()=>{});
    }catch(error){notice(error.message);}
  }
  $("spin").addEventListener("click",spin);
  // Ahorra recursos al ocultar la pestaña; el resultado ya está fijado y se liquida una sola vez.
  document.addEventListener("visibilitychange",()=>{if(document.hidden)completeSpin();});
  addEventListener("pagehide",()=>{completeSpin();if(session)persist();});
})();
