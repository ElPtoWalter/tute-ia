(() => {
  "use strict";
  const words={animales:["Jirafa","Pulpo","Pingüino","Canguro","Delfín","Camaleón","Cocodrilo","Flamenco"],objetos:["Paraguas","Bicicleta","Tostadora","Telescopio","Guitarra","Mochila","Reloj","Tijeras"],lugares:["Faro","Castillo","Playa","Aeropuerto","Biblioteca","Montaña","Circo","Hospital"],acciones:["Bailar","Dormir","Saltar","Cocinar","Nadar","Estornudar","Escalar","Fotografiar"],comida:["Pizza","Paella","Helado","Sandía","Hamburguesa","Tarta","Espaguetis","Palomitas"]};words.general=Object.values(words).flat();
  const ids=["piSetup","piSetupForm","piCategory","piDrawer","piGame","piDrawerLabel","piWordButton","piWordLabel","piScore","piCanvasWrap","piCanvas","piPencil","piEraser","piWidth","piUndo","piClear","piSkip","piCorrect","piSecretDialog","piSecretTitle","piSecretWord","piReveal","piRulesButton","piRules"];
  const ui=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
  const canvas=ui.piCanvas,ctx=canvas.getContext("2d",{willReadFrequently:true});
  const state={active:false,drawer:"Jugador",deck:[],index:0,word:"",score:0,tool:"pencil",drawing:false,last:null,history:[],revealed:false};
  function shuffled(items){return [...items].sort(()=>Math.random()-.5)}
  function start(){
    state.drawer=ui.piDrawer.value.trim()||window.SalaCeroPrefs.getName();state.deck=shuffled(words[ui.piCategory.value]);state.index=0;state.score=0;state.active=true;
    ui.piDrawerLabel.textContent=state.drawer;ui.piScore.textContent="0";ui.piSetup.classList.add("hidden");ui.piGame.classList.remove("hidden");
    requestAnimationFrame(()=>{resizeCanvas(false);newWord()});
  }
  function newWord(){
    if(state.index>=state.deck.length){state.deck=shuffled(state.deck);state.index=0}
    state.word=state.deck[state.index++];state.revealed=false;ui.piSecretTitle.textContent=`Turno de ${state.drawer}`;ui.piSecretWord.textContent="Pulsa para revelar";ui.piReveal.textContent="Revelar palabra";ui.piWordLabel.textContent="Oculta";clearCanvas(false);ui.piSecretDialog.showModal();
  }
  function reveal(){
    if(!state.revealed){state.revealed=true;ui.piSecretWord.textContent=state.word;ui.piReveal.textContent="Ocultar y dibujar";return}
    ui.piSecretDialog.close();ui.piWordLabel.textContent=state.word;window.SalaCeroPrefs.haptic(18);
  }
  function correct(){if(!state.active)return;state.score+=1;ui.piScore.textContent=state.score;window.SalaCeroPrefs.haptic([25,30,50]);window.SalaCeroPrefs.beep(740,.08);window.SalaCeroPrefs.noteResult({game:"pictionary"});newWord()}
  function setTool(tool){state.tool=tool;ui.piPencil.classList.toggle("active",tool==="pencil");ui.piEraser.classList.toggle("active",tool==="eraser");ui.piPencil.setAttribute("aria-pressed",String(tool==="pencil"));ui.piEraser.setAttribute("aria-pressed",String(tool==="eraser"))}
  function snapshot(){try{state.history.push(canvas.toDataURL("image/png"));if(state.history.length>12)state.history.shift()}catch(_){}}
  function clearCanvas(save=true){if(save)snapshot();const rect=canvas.getBoundingClientRect();ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();ctx.setTransform(devicePixelRatio||1,0,0,devicePixelRatio||1,0,0);state.history=save?state.history:[]}
  function undo(){const data=state.history.pop();if(!data)return;const image=new Image();image.onload=()=>{const rect=canvas.getBoundingClientRect();ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);ctx.restore();ctx.setTransform(devicePixelRatio||1,0,0,devicePixelRatio||1,0,0)};image.src=data}
  function point(event){const rect=canvas.getBoundingClientRect();return{x:event.clientX-rect.left,y:event.clientY-rect.top}}
  function down(event){event.preventDefault();snapshot();state.drawing=true;state.last=point(event);canvas.setPointerCapture?.(event.pointerId);ctx.beginPath();ctx.moveTo(state.last.x,state.last.y)}
  function move(event){if(!state.drawing)return;event.preventDefault();const next=point(event);ctx.lineCap="round";ctx.lineJoin="round";ctx.lineWidth=Number(ui.piWidth.value);ctx.strokeStyle=state.tool==="eraser"?"#fff":"#13261f";ctx.beginPath();ctx.moveTo(state.last.x,state.last.y);ctx.lineTo(next.x,next.y);ctx.stroke();state.last=next}
  function up(event){if(!state.drawing)return;state.drawing=false;canvas.releasePointerCapture?.(event.pointerId)}
  function resizeCanvas(preserve=true){
    const old=preserve&&canvas.width?canvas.toDataURL("image/png"):null,rect=ui.piCanvasWrap.getBoundingClientRect(),ratio=Math.max(1,window.devicePixelRatio||1);
    canvas.width=Math.max(1,Math.round(rect.width*ratio));canvas.height=Math.max(1,Math.round(rect.height*ratio));ctx.setTransform(ratio,0,0,ratio,0,0);ctx.fillStyle="#fff";ctx.fillRect(0,0,rect.width,rect.height);
    if(old){const image=new Image();image.onload=()=>ctx.drawImage(image,0,0,rect.width,rect.height);image.src=old}
  }
  ui.piDrawer.value=window.SalaCeroPrefs.getName();ui.piSetupForm.addEventListener("submit",e=>{e.preventDefault();start()});ui.piReveal.addEventListener("click",reveal);ui.piWordButton.addEventListener("click",()=>{ui.piSecretWord.textContent=state.word;ui.piReveal.textContent="Ocultar y dibujar";state.revealed=true;ui.piSecretDialog.showModal()});
  ui.piPencil.addEventListener("click",()=>setTool("pencil"));ui.piEraser.addEventListener("click",()=>setTool("eraser"));ui.piUndo.addEventListener("click",undo);ui.piClear.addEventListener("click",()=>clearCanvas(true));ui.piSkip.addEventListener("click",newWord);ui.piCorrect.addEventListener("click",correct);
  canvas.addEventListener("pointerdown",down);canvas.addEventListener("pointermove",move);canvas.addEventListener("pointerup",up);canvas.addEventListener("pointercancel",up);addEventListener("resize",()=>state.active&&resizeCanvas(true),{passive:true});
  ui.piRulesButton.addEventListener("click",()=>ui.piRules.showModal());ui.piRules.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>ui.piRules.close()));
  window.SalaCeroPictionaryDebug=Object.freeze({state,clearCanvas,undo});
})();
