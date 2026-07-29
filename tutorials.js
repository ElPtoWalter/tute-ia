(() => {
  "use strict";
  const DATA = {
    chinchon: [
      {title:"Tu objetivo",text:"Forma grupos del mismo número y escaleras consecutivas del mismo palo. Cuantas menos cartas sueltas dejes, menor será tu penalización.",cards:["oros-4","oros-5","oros-6"],chips:["Escalera","Grupo"]},
      {title:"Roba antes de descartar",text:"En cada turno eliges entre la carta superior del mazo y la carta visible del descarte. Después debes devolver una carta a la mesa.",cards:["back","copas-7"],chips:["1. Robar","2. Descartar"]},
      {title:"Reconoce una combinación",text:"Una escalera necesita al menos tres cartas consecutivas del mismo palo. Un grupo necesita tres o cuatro cartas del mismo número.",cards:["bastos-5","bastos-6","bastos-7"],quiz:{question:"¿Cuál es una combinación válida?",choices:["5, 6 y 7 de bastos","5 de bastos, 6 de copas y 7 de oros","Dos reyes solamente"],answer:0,ok:"Correcto: mismo palo y valores consecutivos."}},
      {title:"El momento de cerrar",text:"Después de descartar puedes cerrar cuando las cartas que quedan fuera de combinaciones suman cinco puntos o menos.",cards:["espadas-3","espadas-4","espadas-5","oros-2"],quiz:{question:"La mano deja solo un 2 suelto. ¿Puedes cerrar?",choices:["Sí, porque suma 2","No, hace falta cero exacto","Solo si el 2 es de oros"],answer:0,ok:"Exacto. Dos puntos sueltos permiten cerrar."}},
      {title:"Chinchón",text:"Una escalera de siete cartas del mismo palo es el golpe perfecto. En Sala Cero concede la victoria directa de la partida.",cards:["copas-1","copas-2","copas-3","copas-4","copas-5","copas-6","copas-7"],chips:["Victoria directa"]},
      {title:"Ya puedes sentarte",text:"Durante la partida, la lectura de la mano te muestra la penalización mínima y las combinaciones detectadas. Tú decides qué robar, qué conservar y cuándo cerrar.",chips:["Roba","Ordena","Descarta","Cierra"]}
    ],
    escoba: [
      {title:"Suma exactamente quince",text:"Juega una carta de tu mano y captura cartas del centro cuando el valor total sea exactamente 15.",cards:["oros-7","copas-5","espadas-3"],chips:["7 + 5 + 3 = 15"]},
      {title:"Valor de las figuras",text:"El as vale 1; del 2 al 7 valen su número; la sota vale 8, el caballo 9 y el rey 10.",cards:["bastos-10","bastos-11","bastos-12"],chips:["Sota 8","Caballo 9","Rey 10"]},
      {title:"Elige la captura",text:"Con un 7 en la mano, busca cartas de la mesa que sumen 8.",cards:["oros-7","copas-1","espadas-2","bastos-5","oros-6"],quiz:{question:"¿Qué combinación completa 15 con tu 7?",choices:["1 + 2 + 5","2 + 5","1 + 6 + 5"],answer:0,ok:"Correcto: 7 + 1 + 2 + 5 = 15."}},
      {title:"Hacer una escoba",text:"Si al capturar retiras todas las cartas del centro, consigues una escoba y sumas un punto adicional.",cards:["espadas-6","copas-4","oros-5"],quiz:{question:"Juegas un 6 y en la mesa hay 4 y 5. ¿Qué ocurre?",choices:["Escoba: 6 + 4 + 5 = 15 y limpias la mesa","No puedes capturar","Solo capturas el 5"],answer:0,ok:"Exacto. Has limpiado la mesa y marcado una escoba."}},
      {title:"Cómo se puntúa",text:"Al final de la mano cuentan las escobas, la mayoría de cartas, la mayoría de oros, la mayoría de sietes y el siete de oros.",cards:["oros-7"],chips:["Cartas","Oros","Sietes","7 de oros"]},
      {title:"Ya puedes jugar",text:"Sala Cero resalta las capturas posibles, pero la elección final es tuya. Prioriza escobas, oros, sietes y especialmente el siete de oros.",chips:["Selecciona","Suma 15","Captura","Barre"]}
    ],
    culo: [
      {title:"Deshazte de todas tus cartas",text:"El primero en quedarse sin cartas será Presidente. El último terminará como Culo y tendrá desventaja en la siguiente mano.",chips:["Presidente","Vice","Neutros","Viceculo","Culo"]},
      {title:"Supera la jugada",text:"La primera persona juega una o varias cartas iguales. La siguiente debe jugar el mismo número de cartas y de un valor superior, o pasar.",cards:["copas-5","oros-5","espadas-6","bastos-6"],chips:["Pareja de 5","Pareja de 6"]},
      {title:"Orden de fuerza",text:"En esta versión con baraja española el 3 es la carta más baja y el 2 la más alta.",chips:["3","4","5","6","7","Sota","Caballo","Rey","As","2"]},
      {title:"Comprueba una respuesta",text:"La mesa muestra una pareja de seises. Debes responder con otra pareja superior.",cards:["oros-6","copas-6","espadas-7","bastos-7"],quiz:{question:"¿Cuál es una respuesta legal?",choices:["Una pareja de sietes","Un solo rey","Tres cartas de valor 5"],answer:0,ok:"Correcto: misma cantidad y rango superior."}},
      {title:"Rangos e intercambio",text:"Al acabar la mano se asignan cargos. En la siguiente, el Culo entrega sus dos cartas más altas al Presidente y recibe las dos más bajas.",chips:["2 cartas","1 carta entre Vice y Viceculo"]},
      {title:"Variantes configurables",text:"Puedes activar que el 2 limpie la mesa, que el 8 salte al siguiente jugador y que cuatro iguales provoquen revolución e inviertan el orden.",chips:["2 limpia","8 salta","Revolución"]}
    ]
  };
  let game="",steps=[],index=0,answered=true;
  const q=s=>document.querySelector(s);
  function ensureDialog(){
    if(q("#tutorialDialog"))return;
    const d=document.createElement("dialog");d.id="tutorialDialog";d.className="tutorial-dialog";
    d.innerHTML=`<section class="tutorial-card"><button class="tutorial-close" type="button" aria-label="Cerrar">×</button><span class="tutorial-kicker">TUTORIAL INTERACTIVO</span><h2 id="tutorialTitle"></h2><p id="tutorialText"></p><div class="tutorial-progress"><i id="tutorialProgress"></i></div><div class="tutorial-scene" id="tutorialScene"></div><div class="tutorial-feedback" id="tutorialFeedback"></div><div class="tutorial-actions"><button class="tutorial-prev" type="button">← Anterior</button><button class="tutorial-next" type="button">Siguiente →</button></div></section>`;
    document.body.appendChild(d);
    d.querySelector(".tutorial-close").onclick=()=>d.close();
    d.querySelector(".tutorial-prev").onclick=()=>{if(index>0){index--;render();}};
    d.querySelector(".tutorial-next").onclick=()=>{if(!answered)return;if(index<steps.length-1){index++;render();}else d.close();};
  }
  function cardPath(id){return id==="back"?"assets/cards/back.svg":`assets/cards/${id}.webp`;}
  function render(){
    const step=steps[index],scene=q("#tutorialScene"),feedback=q("#tutorialFeedback"),next=q(".tutorial-next"),prev=q(".tutorial-prev");
    q("#tutorialTitle").textContent=step.title;q("#tutorialText").textContent=step.text;q("#tutorialProgress").style.width=`${((index+1)/steps.length)*100}%`;feedback.textContent="";answered=!step.quiz;next.disabled=!answered;prev.disabled=index===0;next.textContent=index===steps.length-1?"Terminar":"Siguiente →";
    const cards=(step.cards||[]).map(id=>`<img src="${cardPath(id)}" alt="">`).join("");
    const chips=(step.chips||[]).map(x=>`<span class="tutorial-chip">${x}</span>`).join("");
    const quiz=step.quiz?`<div class="tutorial-quiz"><strong>${step.quiz.question}</strong>${step.quiz.choices.map((c,i)=>`<button type="button" data-answer="${i}">${c}</button>`).join("")}</div>`:"";
    scene.innerHTML=`${cards?`<div class="tutorial-cards">${cards}</div>`:""}${chips?`<div class="tutorial-cards">${chips}</div>`:""}${quiz}`;
    scene.querySelectorAll("[data-answer]").forEach(btn=>btn.onclick=()=>{const ok=Number(btn.dataset.answer)===step.quiz.answer;scene.querySelectorAll("[data-answer]").forEach(b=>b.disabled=true);btn.classList.add(ok?"correct":"wrong");if(ok){answered=true;next.disabled=false;feedback.textContent=step.quiz.ok||"Correcto.";}else{feedback.textContent="Esa opción no es correcta. Pulsa Anterior y vuelve a intentarlo.";}});
  }
  function open(selected){ensureDialog();game=selected;steps=DATA[game]||[];index=0;if(!steps.length)return;render();q("#tutorialDialog").showModal();}
  document.addEventListener("DOMContentLoaded",()=>{ensureDialog();document.querySelectorAll("[data-tutorial-open]").forEach(btn=>btn.addEventListener("click",()=>open(btn.dataset.tutorialOpen)));});
  window.SalaCeroTutorials={open};
})();
