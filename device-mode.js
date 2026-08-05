(() => {
  'use strict';
  const KEY = 'salaCeroDeviceModeV212';
  const root = document.documentElement;
  const current = () => root.dataset.deviceMode === 'desktop' ? 'desktop' : 'mobile';
  const recommended = () => root.dataset.deviceRecommended === 'desktop' ? 'desktop' : 'mobile';
  const label = mode => mode === 'mobile' ? 'Móvil / iPhone' : 'Ordenador';
  const updateHeight = () => {
    const height = Math.round(window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight);
    root.style.setProperty('--mobile-vh', `${height}px`);
  };

  function save(mode) {
    try { localStorage.setItem(KEY, mode); } catch (_) {}
    const changed = current() !== mode;
    root.dataset.deviceMode = mode;
    root.dataset.deviceModeSaved = 'true';
    if (changed) location.reload();
    else closePicker();
  }

  function closePicker() {
    document.getElementById('scDevicePicker')?.classList.remove('open');
    document.body?.classList.remove('sc-device-picker-open');
  }

  function openPicker() {
    const picker = document.getElementById('scDevicePicker');
    if (!picker) return;
    picker.classList.add('open');
    document.body.classList.add('sc-device-picker-open');
    picker.querySelector(`[data-device-choice="${current()}"]`)?.focus();
  }

  function mount() {
    updateHeight();
    window.addEventListener('resize', updateHeight, { passive: true });
    window.addEventListener('orientationchange', updateHeight, { passive: true });
    window.visualViewport?.addEventListener('resize', updateHeight, { passive: true });
    if (!document.body || document.getElementById('scDevicePicker')) return;
    const picker = document.createElement('div');
    picker.id = 'scDevicePicker';
    picker.className = 'sc-device-picker';
    picker.setAttribute('role', 'dialog');
    picker.setAttribute('aria-modal', 'true');
    picker.setAttribute('aria-labelledby', 'scDeviceTitle');
    picker.innerHTML = `
      <div class="sc-device-card">
        <button class="sc-device-close" type="button" aria-label="Cerrar selector">×</button>
        <span class="sc-device-kicker">FORMATO DE JUEGO</span>
        <h2 id="scDeviceTitle">¿Dónde vas a jugar?</h2>
        <p>La interfaz cambia de verdad: no es la versión de ordenador encogida.</p>
        <div class="sc-device-options">
          <button type="button" data-device-choice="mobile">
            <span class="sc-device-icon">▯</span>
            <span><strong>Móvil / iPhone</strong><small>Carta y controles grandes, zonas seguras y vista vertical.</small></span>
            <b class="sc-device-recommended mobile">RECOMENDADO</b>
          </button>
          <button type="button" data-device-choice="desktop">
            <span class="sc-device-icon">▰</span>
            <span><strong>Ordenador</strong><small>Mesa completa, más información simultánea y diseño panorámico.</small></span>
            <b class="sc-device-recommended desktop">RECOMENDADO</b>
          </button>
        </div>
        <small class="sc-device-note">La elección queda guardada en este dispositivo y se puede cambiar en cualquier momento.</small>
      </div>`;
    document.body.appendChild(picker);

    const switcher = document.createElement('button');
    switcher.id = 'scDeviceSwitch';
    switcher.className = 'sc-device-switch';
    switcher.type = 'button';
    switcher.setAttribute('aria-label', 'Cambiar formato de juego');
    switcher.innerHTML = `<span>${current() === 'mobile' ? '▯' : '▰'}</span><span><small>FORMATO</small><strong>${label(current())}</strong></span>`;
    document.body.appendChild(switcher);

    picker.querySelectorAll('[data-device-choice]').forEach(button => {
      const mode = button.dataset.deviceChoice;
      button.classList.toggle('selected', mode === current());
      button.querySelector(`.sc-device-recommended.${recommended()}`)?.classList.add('show');
      button.addEventListener('click', () => save(mode));
    });
    picker.querySelector('.sc-device-close').addEventListener('click', closePicker);
    picker.addEventListener('click', event => { if (event.target === picker) closePicker(); });
    switcher.addEventListener('click', openPicker);
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closePicker(); });

    if (root.dataset.deviceModeSaved !== 'true') setTimeout(openPicker, 220);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
