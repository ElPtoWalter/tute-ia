(() => {
  const root = document.documentElement;
  const update = () => {
    const viewport = window.visualViewport;
    const height = Math.round(viewport?.height || window.innerHeight || root.clientHeight);
    root.style.setProperty('--mobile-vh', `${height}px`);
    root.dataset.mobileLayout = window.matchMedia('(max-width: 760px)').matches ? 'compact' : 'desktop';
  };
  update();
  window.addEventListener('resize', update, { passive: true });
  window.addEventListener('orientationchange', update, { passive: true });
  window.visualViewport?.addEventListener('resize', update, { passive: true });
})();
