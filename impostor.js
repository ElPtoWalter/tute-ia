(()=>{
'use strict';

const SAVE='salaCeroImpostorV214Config';
const WORDS={
  'Mezcla':['Volcán','Helado','Ascensor','Pirata','Hospital','Guitarra','Castillo','Tiburón','Avión','Biblioteca','Robot','Desierto','Detective','Cumpleaños','Cine','Tormenta','Museo','Camping','Semáforo','Submarino','Paraguas','Faro','Globo','Tren','Espejo','Reloj','Taxi','Circo','Cueva','Satélite'],
  'Amigos':['Grupo de WhatsApp','Cena','Viaje','Cumpleaños','Foto de grupo','Piso compartido','Mote','Broma interna','Plan improvisado','Barbacoa','Resaca','Favor','Discusión','Reencuentro','Secreto','Coche','Vacaciones','After','Casa rural','Anécdota','Selfie','Reto','Playlist','Tardeo','Cena de Navidad'],
  'Discoteca':['Segurata','Lista VIP','Pulsera','DJ','Pista de baile','Guardarropa','Reservado','Entrada','Sello','Altavoz','Cabina','Cola','Fotomatón','Láser','Humo','After','Portero','Copa','Ticket','Baño','Terraza','Bouncer','Cierre','Fiesta temática','Chupito'],
  'Fútbol':['Portero','Penalti','Córner','Árbitro','Estadio','Delantero','Champions','Derbi','Banquillo','Tarjeta roja','Fuera de juego','Regate','Prórroga','Capitán','Mundial','VAR','Césped','Camiseta','Gol en propia','Tanda de penaltis','Mercado de fichajes','Entrenador','Ultras','Pichichi','Lesión'],
  'Universidad':['Biblioteca','Examen','Apuntes','Cafetería','Laboratorio','Profesor','Matrícula','Campus','Trabajo en grupo','Presentación','Prácticas','Convocatoria','Aula','Calculadora','Copistería','Erasmus','TFG','Tutoría','Suspenso','Sobresaliente','Orla','Selectividad','Campus virtual','Recuperación','Beca'],
  'Despedida':['Novio','Disfraz','Casa rural','Autobús','Prueba','Reto','Cena','Discoteca','Camiseta','Pulsera','Sorpresa','Foto grupal','Novatada','Juego','Premio','Castigo','Madrugada','Desayuno','Maleta','Playlist','Reserva','Plan secreto','Código QR','After','Resaca'],
  'Sala Cero':['Anton','Tute','Generala','Chinchón','Escoba','Póker','Blackjack','Cubilete','Baraja','Crupier','All-in','Ciega grande','Triunfo','Baza','Casino','Presidente','Fichas','Ronda','Impostor','Mesa local','Pasa el móvil','Cartas','Dados','Veintiuno'],
  'Antonverse':['Peseta','Il Consigliere','Andresete','Nil','Ace','Negri','Walter','Macoy','Dulce','Dynamic Gamer','Ojos de pollo','El gran figure','Meadito','Bocaditos','El pensador','Bigote Arrocet','Pocoyó','El vasco','DDT Boy','Cartón cartón cartón','Ha!','Ou shit','Se come el bote','Nomeduele','El gitanico'],
  'Comida':['Paella','Croqueta','Tortilla','Sushi','Hamburguesa','Pizza','Gazpacho','Churros','Kebab','Helado','Pulpo','Tacos','Lasaña','Bocadillo','Chocolate','Fabada','Jamón','Ramen','Cachopo','Ensaladilla','Patatas bravas','Canelones','Café','Tarta','Empanada'],
  'Viajes':['Maleta','Pasaporte','Hotel','Playa','Montaña','Crucero','Mapa','Tren','Aeropuerto','Camping','Excursión','Souvenir','Frontera','Hostal','Autocaravana','Check-in','Turista','Guía','Mirador','Alquiler de coche','Mochila','Escala','Billete','Apartamento','Carretera'],
  'España':['Madrid','Toledo','Valencia','Sevilla','Barcelona','Paella','Flamenco','Quijote','Sagrada Familia','Alhambra','Camino de Santiago','Ibiza','Fallas','San Fermín','Teide','Tortilla','AVE','Costa del Sol','Picos de Europa','Museo del Prado','Mezquita de Córdoba','Santiago','La Liga','Chiringuito','Plaza Mayor'],
  'Adulto 18+':['Ligue','Cita','Ex','Mensaje a las tres','Tinder','Beso','Hotel','Resaca','After','Crush','Cita a ciegas','Despecho','Celos','Soltería','Tentación','Confesión','Match','Número de teléfono','Primera cita','Ghosting','Fiesta privada','Secreto','Amor de verano','Striptease','Despedida']
};

let config=null;
let round=null;
let index=0;
let voteIndex=0;
let timer=null;
let left=0;
let last='';
let toastTimer=null;
const $=id=>document.getElementById(id);
const U={};
[
  'imWelcome','imConfigure','imSetup','imSetupClose','imCount','imImpostors','imCategory','imTime','imVoting','imCustomToggle','imCustomWord','imNames','imStart',
  'imGame','imProgressText','imProgressBar','imHandoff','imHandoffName','imReveal','imRole','imRoleCard','imRoleIcon','imRoleKicker','imRoleTitle','imRoleText','imHideNext',
  'imDiscussion','imStarter','imTimer','imTimerText','imTimerBar','imTimerToggle','imVoteStart','imRevealResult','imVote','imVoteName','imVoteInstruction','imVoteChoices','imVoteNext',
  'imResult','imResultTitle','imImpostorList','imVoteSummary','imWordReveal','imNextRound','imNewSetup','imToast'
].forEach(id=>U[id]=$(id));

function boot(){
  U.imCount.innerHTML=Array.from({length:10},(_,i)=>`<option value="${i+3}" ${i===3?'selected':''}>${i+3} jugadores</option>`).join('');
  U.imCategory.innerHTML=Object.keys(WORDS).map(x=>`<option>${esc(x)}</option>`).join('');
  restoreConfig();
  U.imConfigure.onclick=setup;
  U.imSetupClose.onclick=welcome;
  U.imCount.onchange=()=>{names();limit()};
  U.imCustomToggle.onchange=()=>U.imCustomWord.classList.toggle('hidden',!U.imCustomToggle.checked);
  U.imStart.onclick=start;
  U.imReveal.onclick=reveal;
  U.imHideNext.onclick=next;
  U.imTimerToggle.onclick=toggle;
  U.imVoteStart.onclick=startVote;
  U.imRevealResult.onclick=()=>result(false);
  U.imVoteNext.onclick=confirmVote;
  U.imNextRound.onclick=()=>{U.imResult.close();newRound()};
  U.imNewSetup.onclick=()=>{U.imResult.close();setup()};
  names();limit();
}

function restoreConfig(){
  try{
    const s=JSON.parse(localStorage.getItem(SAVE)||'null');
    if(!s)return;
    if(s.count>=3&&s.count<=12)U.imCount.value=String(s.count);
    if(s.impostors===1||s.impostors===2)U.imImpostors.value=String(s.impostors);
    if(WORDS[s.category])U.imCategory.value=s.category;
    if([0,120,180,300].includes(s.time))U.imTime.value=String(s.time);
    U.imVoting.checked=s.voting!==false;
    U.imCustomToggle.checked=!!s.customEnabled;
    U.imCustomWord.classList.toggle('hidden',!s.customEnabled);
    U.imCustomWord.value=s.custom||'';
  }catch{}
}
function saveConfig(){
  try{localStorage.setItem(SAVE,JSON.stringify({count:config.names.length,impostors:config.impostors,category:config.category,time:config.time,voting:config.voting,customEnabled:!!config.custom,custom:config.custom||''}))}catch{}
}

function setup(){
  stop();
  U.imWelcome.classList.add('hidden');U.imGame.classList.add('hidden');U.imSetup.classList.remove('hidden');
  names();limit();scrollTo(0,0);
}
function welcome(){stop();U.imSetup.classList.add('hidden');U.imGame.classList.add('hidden');U.imWelcome.classList.remove('hidden');scrollTo(0,0)}
function names(){
  const n=+U.imCount.value||6;
  const old=[...U.imNames.querySelectorAll('input')].map(x=>x.value);
  U.imNames.innerHTML=Array.from({length:n},(_,i)=>`<input maxlength="18" value="${esc(old[i]||`Jugador ${i+1}`)}" aria-label="Nombre del jugador ${i+1}">`).join('');
}
function limit(){const opt=U.imImpostors.querySelector('option[value="2"]');opt.disabled=(+U.imCount.value||6)<7;if(opt.disabled)U.imImpostors.value='1'}

function start(){
  const ns=[...U.imNames.querySelectorAll('input')].map((x,i)=>clean(x.value,`Jugador ${i+1}`));
  const custom=U.imCustomToggle.checked?clean(U.imCustomWord.value,''):'';
  if(U.imCustomToggle.checked&&!custom){toast('Escribe una palabra personalizada.');return}
  config={
    names:ns,
    impostors:Math.min(+U.imImpostors.value||1,ns.length-1),
    category:U.imCategory.value,
    time:+U.imTime.value||0,
    voting:U.imVoting.checked,
    custom
  };
  saveConfig();
  U.imSetup.classList.add('hidden');U.imGame.classList.remove('hidden');newRound();
}

function newRound(){
  stop();index=0;voteIndex=0;
  const word=config.custom||pick(config.category);
  const ids=shuffle(config.names.map((_,i)=>i)).slice(0,config.impostors);
  const innocents=config.names.map((_,i)=>i).filter(i=>!ids.includes(i));
  const starter=innocents.length?innocents[Math.floor(Math.random()*innocents.length)]:Math.floor(Math.random()*config.names.length);
  round={word,impostors:ids,starter,votes:Array(config.names.length).fill(null)};
  ['imDiscussion','imRole','imVote'].forEach(k=>U[k].classList.add('hidden'));
  U.imHandoff.classList.remove('hidden');handoff();scrollTo(0,0);
}
function pick(cat){const a=WORDS[cat]||WORDS.Mezcla;let w=a[Math.floor(Math.random()*a.length)];if(a.length>1&&w===last)w=a[(a.indexOf(w)+1)%a.length];last=w;return w}
function handoff(){
  U.imHandoffName.textContent=config.names[index];
  U.imProgressText.textContent=`Jugador ${index+1} de ${config.names.length}`;
  U.imProgressBar.style.width=`${index/config.names.length*100}%`;
  U.imRole.classList.add('hidden');U.imHandoff.classList.remove('hidden');
}
function reveal(){
  const imp=round.impostors.includes(index);
  U.imHandoff.classList.add('hidden');U.imRole.classList.remove('hidden');
  U.imRoleCard.classList.toggle('impostor',imp);
  U.imRoleIcon.textContent=imp?'?':'◆';
  U.imRoleKicker.textContent=imp?'TU PAPEL ES':'LA PALABRA ES';
  U.imRoleTitle.textContent=imp?'IMPOSTOR':round.word;
  U.imRoleText.textContent=imp?'No conoces la palabra. Escucha las pistas, disimula e intenta deducirla.':'Piensa una pista que demuestre que conoces la palabra sin regalarla.';
  U.imHideNext.textContent=index===config.names.length-1?'Ocultar y empezar el debate →':'Ocultar y pasar al siguiente →';
  U.imProgressBar.style.width=`${(index+1)/config.names.length*100}%`;
  navigator.vibrate?.(25);
}
function next(){index++;index>=config.names.length?discussion():handoff()}

function discussion(){
  U.imRole.classList.add('hidden');U.imHandoff.classList.add('hidden');U.imVote.classList.add('hidden');U.imDiscussion.classList.remove('hidden');
  U.imProgressText.textContent='Debate y acusación';U.imProgressBar.style.width='100%';
  U.imStarter.textContent=config.names[round.starter];
  left=config.time;drawTimer();U.imTimer.classList.toggle('hidden',!config.time);
  U.imTimerToggle.textContent=config.time?'Iniciar tiempo':'Sin temporizador';U.imTimerToggle.disabled=!config.time;
  U.imVoteStart.classList.toggle('hidden',!config.voting);
  U.imRevealResult.textContent=config.voting?'Revelar sin votar':'Revelar al impostor';
}
function toggle(){
  if(timer){stop();U.imTimerToggle.textContent='Continuar tiempo';return}
  if(left<=0)left=config.time;
  U.imTimerToggle.textContent='Pausar tiempo';
  timer=setInterval(()=>{left--;drawTimer();if(left<=0){stop();U.imTimerToggle.textContent='Tiempo terminado';navigator.vibrate?.([120,70,120]);toast('Tiempo terminado. Votad ahora.')}},1000);
}
function stop(){if(timer){clearInterval(timer);timer=null}}
function drawTimer(){const m=Math.floor(left/60),s=left%60;U.imTimerText.textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;U.imTimerBar.style.width=config?.time?`${Math.max(0,left/config.time*100)}%`:'0%'}

function startVote(){
  stop();voteIndex=0;round.votes=Array(config.names.length).fill(null);
  U.imDiscussion.classList.add('hidden');U.imVote.classList.remove('hidden');
  voteHandoff();scrollTo(0,0);
}
function voteHandoff(){
  const voter=config.names[voteIndex];
  U.imProgressText.textContent=`Votación · ${voteIndex+1} de ${config.names.length}`;
  U.imProgressBar.style.width=`${voteIndex/config.names.length*100}%`;
  U.imVoteName.textContent=voter;
  U.imVoteInstruction.textContent='Pasa el dispositivo. Que nadie mire mientras esta persona prepara su voto.';
  U.imVoteChoices.innerHTML='<div class="vote-privacy"><span>◉</span><strong>Turno privado</strong><small>Solo debe mirar la persona indicada.</small></div>';
  U.imVoteNext.dataset.stage='revealvote';
  U.imVoteNext.disabled=false;
  U.imVoteNext.textContent=`Soy ${voter} · ver candidatos`;
}
function renderVote(){
  const voter=config.names[voteIndex];
  U.imProgressText.textContent=`Votación · ${voteIndex+1} de ${config.names.length}`;
  U.imProgressBar.style.width=`${voteIndex/config.names.length*100}%`;
  U.imVoteName.textContent=voter;
  U.imVoteInstruction.textContent='Elige en secreto a la persona que crees que es el impostor.';
  U.imVoteChoices.innerHTML=config.names.map((name,i)=>i===voteIndex?'':`<button type="button" class="vote-choice" data-suspect="${i}"><span>${esc(name)}</span><small>Acusar</small></button>`).join('');
  U.imVoteNext.dataset.stage='confirm';
  U.imVoteNext.disabled=true;U.imVoteNext.textContent=voteIndex===config.names.length-1?'Confirmar voto y ver resultado →':'Confirmar voto y ocultar →';
  U.imVoteChoices.querySelectorAll('[data-suspect]').forEach(btn=>btn.onclick=()=>{
    U.imVoteChoices.querySelectorAll('.vote-choice').forEach(b=>b.classList.remove('selected'));
    btn.classList.add('selected');round.votes[voteIndex]=+btn.dataset.suspect;U.imVoteNext.disabled=false;navigator.vibrate?.(15);
  });
}
function confirmVote(){
  if(U.imVoteNext.dataset.stage==='revealvote'){renderVote();return}
  if(round.votes[voteIndex]==null)return;
  voteIndex++;
  if(voteIndex>=config.names.length){U.imProgressBar.style.width='100%';result(true);return}
  voteHandoff();
}

function tallyVotes(){
  const counts=config.names.map((_,i)=>({i,count:0}));
  round.votes.forEach(v=>{if(v!=null&&counts[v])counts[v].count++});
  counts.sort((a,b)=>b.count-a.count||a.i-b.i);
  return counts;
}
function result(fromVote){
  stop();U.imVote.classList.add('hidden');
  U.imResultTitle.textContent=round.impostors.length>1?'Los impostores eran...':'El impostor era...';
  U.imImpostorList.innerHTML=round.impostors.map(i=>`<span>${esc(config.names[i])}</span>`).join('');
  U.imWordReveal.textContent=round.word;
  if(fromVote){
    const tally=tallyVotes();const max=tally[0]?.count||0;const leaders=tally.filter(x=>x.count===max&&max>0).map(x=>x.i);const caught=leaders.some(i=>round.impostors.includes(i));
    U.imVoteSummary.innerHTML=`<div class="vote-verdict ${caught?'caught':'escaped'}"><strong>${caught?'El grupo ha señalado a un impostor':'El impostor ha sobrevivido a la votación'}</strong><small>${max?`${max} voto${max===1?'':'s'} para ${leaders.map(i=>esc(config.names[i])).join(', ')}`:'Sin votos registrados'}</small></div><div class="vote-ranking">${tally.filter(x=>x.count>0).map(x=>`<div><span>${esc(config.names[x.i])}</span><b>${x.count}</b></div>`).join('')}</div>`;
  }else{
    U.imVoteSummary.innerHTML='<div class="vote-verdict neutral"><strong>Revelación directa</strong><small>Esta ronda terminó sin votación en el dispositivo.</small></div>';
  }
  U.imResult.showModal();navigator.vibrate?.([60,45,100]);
}

function shuffle(a){a=a.slice();for(let i=a.length-1;i;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function toast(t){clearTimeout(toastTimer);U.imToast.textContent=t;U.imToast.classList.add('show');toastTimer=setTimeout(()=>U.imToast.classList.remove('show'),1900)}
function clean(v,f){return String(v||'').trim().replace(/\s+/g,' ').slice(0,32)||f}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}

document.addEventListener('DOMContentLoaded',boot);
})();
