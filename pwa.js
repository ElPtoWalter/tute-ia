(() => {
  "use strict";
  let playing=false;
  function register(){ if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}),{once:true}); } }
  function toast(message){ const host=document.querySelector('#toastRegion,.g-toast,.sg-toast,.pk-toast,.toast,.im-toast'); if(!host)return; host.textContent=message; host.classList.add('show'); setTimeout(()=>host.classList.remove('show'),1800); }
  function setPlaying(value){ playing=Boolean(value); document.body.classList.toggle('game-in-progress',playing); }
  window.TutePWA={openPanel(){toast('Sala Cero queda disponible offline tras la primera carga.');},toast,setPlaying,isPlaying:()=>playing};
  register();
})();
