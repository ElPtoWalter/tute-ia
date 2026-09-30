(() => {
  "use strict";
  const words={
    peliculas:["Titanic","Toy Story","El Rey León","Harry Potter","Jurassic Park","Frozen","Shrek","Rocky","Avatar","Coco","Tiburón","Regreso al futuro"],
    personajes:["Batman","Sherlock Holmes","Don Quijote","Mickey Mouse","Indiana Jones","Darth Vader","Superman","Pikachu","Cenicienta","Robin Hood","Mario Bros","Hércules"],
    animales:["Pingüino","Canguro","Pulpo","Jirafa","Delfín","Camaleón","Flamenco","Cocodrilo","Perezoso","Avestruz","Gorila","Cangrejo"],
    objetos:["Paraguas","Sacacorchos","Aspiradora","Telescopio","Tostadora","Brújula","Martillo","Semáforo","Ventilador","Mochila","Despertador","Extintor"],
    deportes:["Baloncesto","Esquí","Boxeo","Surf","Tiro con arco","Natación","Tenis","Gimnasia","Ciclismo","Voleibol","Golf","Patinaje"],
    profesiones:["Bombero","Cirujano","Profesor","Astronauta","Peluquero","Fotógrafo","Cocinero","Detective","Carpintero","Dentista","Piloto","Músico"],
    lugares:["Aeropuerto","Biblioteca","Desierto","Parque de atracciones","Hospital","Castillo","Supermercado","Playa","Museo","Estación de tren","Teatro","Cámping"]
  };
  words.general=Object.values(words).flat();
  const labels={general:"Mezcla general",peliculas:"Películas",personajes:"Personajes",animales:"Animales",objetos:"Objetos",deportes:"Deportes",profesiones:"Profesiones",lugares:"Lugares"};
  const ids=["chSetup","chSetupForm","chCategory","chMotionButton","chMotionStatus","chGame","chScore","chTimer","chPasses","chCategoryLabel","chWord","chPass","chCorrect","chHint","chRulesButton","chRules","chResult","chResultTitle","chResultCopy","chAgain"];
  const ui=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
  const state={active:false,score:0,passes:0,time:60,deck:[],index:0,timer:0,motion:false,baseline:null,ready:true,lastMotion:0};
  function shuffled(items){return [...items].sort(()=>Math.random()-.5)}
  function next(){if(state.index>=state.deck.length){state.deck=shuffled(state.deck);state.index=0}ui.chWord.textContent=state.deck[state.index++];window.SalaCeroPrefs.haptic(18)}
  function start(){
    const category=ui.chCategory.value;state.active=true;state.score=0;state.passes=0;state.time=Number(document.querySelector('input[name="chTime"]:checked').value);state.deck=shuffled(words[category]);state.index=0;state.baseline=null;state.ready=true;
    ui.chCategoryLabel.textContent=labels[category].toUpperCase();ui.chSetup.classList.add("hidden");ui.chGame.classList.remove("hidden");next();render();
    clearInterval(state.timer);state.timer=setInterval(()=>{state.time-=1;render();if(state.time<=0)finish()},1000);
  }
  function correct(){if(!state.active)return;state.score+=1;window.SalaCeroPrefs.haptic([25,30,45]);window.SalaCeroPrefs.beep(720,.07);next();render()}
  function pass(){if(!state.active)return;state.passes+=1;window.SalaCeroPrefs.haptic(24);next();render()}
  function finish(){if(!state.active)return;state.active=false;clearInterval(state.timer);ui.chResultTitle.textContent=`${state.score} ${state.score===1?"acierto":"aciertos"}`;ui.chResultCopy.textContent=`Has pasado ${state.passes} ${state.passes===1?"palabra":"palabras"}. ¿Otra ronda?`;ui.chResult.showModal();window.SalaCeroPrefs.noteResult({game:"charadas"})}
  function render(){ui.chScore.textContent=state.score;ui.chPasses.textContent=state.passes;ui.chTimer.textContent=Math.max(0,state.time)}
  async function enableMotion(){
    try{
      if(typeof DeviceOrientationEvent==="undefined")throw new Error("Este dispositivo no ofrece inclinación.");
      if(typeof DeviceOrientationEvent.requestPermission==="function"){const answer=await DeviceOrientationEvent.requestPermission();if(answer!=="granted")throw new Error("Permiso no concedido.")}
      addEventListener("deviceorientation",onMotion,{passive:true});state.motion=true;ui.chMotionStatus.textContent="Inclinación activa. Inclina hacia delante para acertar y hacia atrás para pasar.";ui.chMotionButton.textContent="Inclinación activada";ui.chMotionButton.disabled=true;
    }catch(error){ui.chMotionStatus.textContent=`${error.message||"No se pudo activar"}. Usa los botones de pantalla.`}
  }
  function onMotion(event){
    if(!state.active||typeof event.beta!=="number")return;if(state.baseline===null){state.baseline=event.beta;return}
    const delta=event.beta-state.baseline,now=Date.now();if(Math.abs(delta)<10){state.ready=true;return}if(!state.ready||now-state.lastMotion<900)return;
    if(delta>28){state.ready=false;state.lastMotion=now;correct()}else if(delta<-28){state.ready=false;state.lastMotion=now;pass()}
  }
  ui.chSetupForm.addEventListener("submit",e=>{e.preventDefault();start()});ui.chCorrect.addEventListener("click",correct);ui.chPass.addEventListener("click",pass);ui.chMotionButton.addEventListener("click",enableMotion);
  ui.chRulesButton.addEventListener("click",()=>ui.chRules.showModal());ui.chRules.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>ui.chRules.close()));ui.chAgain.addEventListener("click",()=>{ui.chResult.close();ui.chGame.classList.add("hidden");ui.chSetup.classList.remove("hidden")});
  window.SalaCeroCharadasDebug=Object.freeze({state,words});
})();
