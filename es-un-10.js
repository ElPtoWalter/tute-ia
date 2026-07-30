(() => {
  'use strict';

  const SUITS = ['oros', 'copas', 'espadas', 'bastos'];
  const RANKS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
  const FULL_DECK = SUITS.flatMap(suit => RANKS.map(rank => ({ suit, rank, src: `assets/cards/${suit}-${rank}.webp` })));

  const deckWrap = document.getElementById('tenDeckWrap');
  const cardButton = document.getElementById('tenCard');
  const frontImage = document.getElementById('tenFrontImage');
  const actionButton = document.getElementById('tenAction');
  const actionText = document.getElementById('tenActionText');
  const actionIcon = document.getElementById('tenActionIcon');
  const status = document.getElementById('tenStatus');
  const roundLabel = document.getElementById('tenRound');
  const hint = document.getElementById('tenHint');

  let round = 1;
  let mode = 'shuffling';
  let shuffledDeck = [];
  let previousCardId = '';
  let busy = false;

  function randomIndex(max) {
    if (window.crypto?.getRandomValues) {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return values[0] % max;
    }
    return Math.floor(Math.random() * max);
  }

  function shuffle(cards) {
    const copy = cards.map(card => ({ ...card }));
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = randomIndex(i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function cardId(card) {
    return `${card.suit}-${card.rank}`;
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function preload(src) {
    const image = new Image();
    image.src = src;
    try { await image.decode(); } catch (_) {}
  }

  function setAction(text, icon, disabled = false) {
    actionText.textContent = text;
    actionIcon.textContent = icon;
    actionButton.disabled = disabled;
  }

  function playShuffleSound() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      const now = context.currentTime;
      const master = context.createGain();
      master.gain.value = 0.16;
      master.connect(context.destination);
      [0, .09, .18, .27, .36, .49, .62].forEach((offset, index) => {
        const buffer = context.createBuffer(1, Math.floor(context.sampleRate * .07), context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        const source = context.createBufferSource();
        const filter = context.createBiquadFilter();
        const gain = context.createGain();
        source.buffer = buffer;
        filter.type = 'bandpass';
        filter.frequency.value = 900 + index * 80;
        gain.gain.setValueAtTime(.001, now + offset);
        gain.gain.exponentialRampToValueAtTime(.12, now + offset + .005);
        gain.gain.exponentialRampToValueAtTime(.001, now + offset + .065);
        source.connect(filter).connect(gain).connect(master);
        source.start(now + offset);
      });
      setTimeout(() => context.close(), 1100);
    } catch (_) {}
  }

  async function prepareRound({ increment = false } = {}) {
    if (busy) return;
    busy = true;
    mode = 'shuffling';
    cardButton.disabled = true;
    deckWrap.classList.remove('revealed');
    setAction('Barajando...', '↻', true);
    status.textContent = 'Barajando las 40 cartas de Anton...';
    hint.textContent = 'Preparando una carta nueva.';
    playShuffleSound();
    await wait(180);
    deckWrap.classList.add('shuffling');

    let candidate = shuffle(FULL_DECK);
    if (candidate.length > 1 && cardId(candidate[0]) === previousCardId) {
      [candidate[0], candidate[1]] = [candidate[1], candidate[0]];
    }
    shuffledDeck = candidate;
    await preload(shuffledDeck[0].src);
    await wait(830);
    deckWrap.classList.remove('shuffling');

    if (increment) round += 1;
    roundLabel.textContent = String(round);
    mode = 'ready';
    busy = false;
    cardButton.disabled = false;
    setAction('Mostrar carta', '✦');
    status.textContent = 'La baraja está lista.';
    hint.textContent = 'Toca la carta o el botón para descubrirla.';
  }

  async function revealCard() {
    if (busy || mode !== 'ready' || !shuffledDeck.length) return;
    busy = true;
    const selected = shuffledDeck[0];
    frontImage.src = selected.src;
    frontImage.alt = `Carta elegida: ${selected.rank} de ${selected.suit}`;
    await preload(selected.src);
    previousCardId = cardId(selected);
    deckWrap.classList.add('revealed');
    navigator.vibrate?.(18);
    mode = 'revealed';
    busy = false;
    setAction('Terminar ronda y barajar', '↻');
    status.textContent = 'Carta revelada.';
    hint.textContent = 'Al terminar la ronda, la baraja se mezclará de nuevo.';
  }

  async function handleAction() {
    if (mode === 'ready') await revealCard();
    else if (mode === 'revealed') await prepareRound({ increment: true });
  }

  actionButton.addEventListener('click', handleAction);
  cardButton.addEventListener('click', handleAction);
  document.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target === document.body) {
      event.preventDefault();
      handleAction();
    }
  });

  prepareRound();
})();
