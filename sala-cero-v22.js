(() => {
  'use strict';
  const root=document.documentElement;
  const body=document.body;
  const page=(location.pathname.split('/').pop()||'index.html').replace(/\.html$/,'')||'index';
  body.dataset.scPage=page;
  root.classList.add('sc-v22');

  const setVh=()=>{
    const h=Math.round(window.visualViewport?.height||window.innerHeight||document.documentElement.clientHeight);
    root.style.setProperty('--sc-vh',`${h}px`);
    root.dataset.scViewport=window.matchMedia('(max-width:760px)').matches?'mobile':'desktop';
  };
  setVh();
  window.addEventListener('resize',setVh,{passive:true});
  window.addEventListener('orientationchange',setVh,{passive:true});
  window.visualViewport?.addEventListener('resize',setVh,{passive:true});

  // PWA remains invisible: no account/settings layer, just offline support.
  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}),{once:true});
  }

})();
