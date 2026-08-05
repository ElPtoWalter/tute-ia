(() => {
  'use strict';
  const root = document.documentElement;
  const body = document.body;
  const page = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/i, '') || 'index';
  root.dataset.page = page;
  body?.setAttribute('data-page', page);

  const updateViewport = () => {
    const h = Math.round(window.visualViewport?.height || window.innerHeight || root.clientHeight || 0);
    if (h) root.style.setProperty('--sc-vh', `${h}px`);
  };
  updateViewport();
  addEventListener('resize', updateViewport, { passive: true });
  addEventListener('orientationchange', updateViewport, { passive: true });
  window.visualViewport?.addEventListener('resize', updateViewport, { passive: true });

  if (!document.querySelector('.sc-skip-link')) {
    const main = document.querySelector('main');
    if (main) {
      if (!main.id) main.id = 'contenido-principal';
      const skip = document.createElement('a');
      skip.className = 'sc-skip-link';
      skip.href = `#${main.id}`;
      skip.textContent = 'Saltar al contenido';
      body.prepend(skip);
    }
  }

  document.querySelectorAll('img').forEach((img, index) => {
    img.draggable = false;
    img.decoding = 'async';
    if (page === 'index' && index > 2 && !img.hasAttribute('loading')) img.loading = 'lazy';
    if (!img.hasAttribute('alt')) img.alt = '';
  });

  const liveSelectors = [
    '.toast','.sg-toast','.pk-toast','.bj-toast','.im-toast','.table-message','.g-table-message',
    '.sg-message','.pk-table-message','.bj-message','.im-message','.ten-status','[class*="status"]'
  ];
  document.querySelectorAll(liveSelectors.join(',')).forEach(node => {
    if (!node.hasAttribute('aria-live')) node.setAttribute('aria-live', 'polite');
    if (!node.hasAttribute('aria-atomic')) node.setAttribute('aria-atomic', 'true');
  });

  document.querySelectorAll('button').forEach(button => {
    const text = (button.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text && !button.getAttribute('aria-label')) {
      const title = button.getAttribute('title') || button.dataset.action || button.id || 'Acción';
      button.setAttribute('aria-label', title.replace(/[-_]/g, ' '));
    }
    button.addEventListener('pointerdown', () => button.classList.add('sc-touching'), { passive: true });
    ['pointerup','pointercancel','pointerleave'].forEach(type => button.addEventListener(type, () => button.classList.remove('sc-touching'), { passive: true }));
  });

  document.querySelectorAll('a[href]').forEach(link => {
    link.addEventListener('pointerdown', () => link.classList.add('sc-touching'), { passive: true });
    ['pointerup','pointercancel','pointerleave'].forEach(type => link.addEventListener(type, () => link.classList.remove('sc-touching'), { passive: true }));
  });

  document.querySelectorAll('input,select,textarea,button').forEach(control => {
    control.addEventListener('focus', () => {
      if (matchMedia('(max-width:820px)').matches) {
        setTimeout(() => control.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }), 120);
      }
    });
  });

  const switcherIdle = () => {
    const switcher = document.getElementById('scDeviceSwitch');
    if (!switcher) return;
    let timer;
    const wake = () => {
      switcher.classList.remove('sc-device-idle');
      clearTimeout(timer);
      timer = setTimeout(() => switcher.classList.add('sc-device-idle'), 2800);
    };
    ['pointerdown','focus','mouseenter'].forEach(type => switcher.addEventListener(type, wake, { passive: type !== 'focus' }));
    wake();
  };
  setTimeout(switcherIdle, 400);

  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('close', () => body.classList.remove('sc-dialog-open'));
    const observer = new MutationObserver(() => body.classList.toggle('sc-dialog-open', Boolean(document.querySelector('dialog[open]'))));
    observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
  });

  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) root.classList.add('sc-touch-device');
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) root.classList.add('sc-ios');
  requestAnimationFrame(() => body?.classList.add('sc-ready'));
})();
