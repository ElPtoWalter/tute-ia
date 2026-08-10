(() => {
  'use strict';
  const KEY = 'salaCeroDeviceModeV220';
  const LEGACY_KEYS = ['salaCeroDeviceModeV212'];
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="viewport"]');
  const mobileHardware = (() => {
    try {
      return window.matchMedia('(max-width: 820px)').matches ||
        (window.matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) <= 1024);
    } catch (_) { return window.innerWidth <= 820; }
  })();
  let stored = null;
  try {
    let value = localStorage.getItem(KEY);
    if (value !== 'mobile' && value !== 'desktop') {
      for (const legacyKey of LEGACY_KEYS) {
        const legacy = localStorage.getItem(legacyKey);
        if (legacy === 'mobile' || legacy === 'desktop') { value = legacy; localStorage.setItem(KEY, legacy); break; }
      }
    }
    if (value === 'mobile' || value === 'desktop') stored = value;
  } catch (_) {}
  const recommended = mobileHardware ? 'mobile' : 'desktop';
  const mode = stored || recommended;
  root.dataset.deviceMode = mode;
  root.dataset.deviceRecommended = recommended;
  root.dataset.deviceModeSaved = stored ? 'true' : 'false';
  if (meta) {
    const desktopOnPhone = mode === 'desktop' && mobileHardware;
    const compactLandscape = mode === 'mobile' && mobileHardware && window.innerWidth > 760;
    meta.setAttribute('content', desktopOnPhone
      ? 'width=1180,initial-scale=0.32,minimum-scale=0.25,maximum-scale=2,user-scalable=yes,viewport-fit=cover'
      : compactLandscape
        ? 'width=430,initial-scale=1,maximum-scale=1,viewport-fit=cover'
        : 'width=device-width,initial-scale=1,viewport-fit=cover');
  }
})();
