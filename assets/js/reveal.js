/* =========================================================
   LuminSDK — abertura do catálogo (animação)
   A "revelação" que toca quando Shift+D — ou o crédito do rodapé dos
   estudos — abre o LuminSDK: aurora, raios girando, portal de anéis,
   faíscas subindo, varredura de luz, flash e título com brilho. É a
   mesma ideia das aberturas do Sols RNG: a raridade saltando na tela.

   Como funciona:
   · show() recebe o destino ('lumin' ou 'estudo') e o motivo ('roll' =
     atalho/crédito, 'first' = primeira entrada, '' = troca de aba comum)
   · a rolagem só acontece quando o catálogo é aberto por 'roll' — o
     atalho Shift+D, o crédito do rodapé e os links de rota — no máximo uma
     vez a cada 10 s; a primeira entrada do site (o portal de estudos) só
     anima se for ligada em LuminApp.revealOnFirst(true)
   · ~2,4 s de animação; clique, qualquer tecla ou Esc pula na hora
   · ?anim=0 desliga; preferência "menos movimento" cai para um fade
   · quem move a tela por conta própria (troca de aba) continua igual —
     a rolagem entra por cima e sai sozinha

   Sem bibliotecas, sem build.
   Autor: Ryan Smith · Licença MIT
   ========================================================= */
(function () {
  'use strict';

  /* o arquivo único e o modo depuração ficam de fora */
  if (window.__LUMIN_SINGLE__) return;
  if (/(?:^|[?&])anim=0(?:&|$)/.test(window.location.search || '')) return;

  const DURATION = 2400;
  const COOLDOWN = 10000;
  const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MAX_SPARKS = 40;

  const TIERS = [
    { chance: '1 / 1.100', name: 'Comum', accent: '#a5b4fc', sparks: 14 },
    { chance: '1 / 1.000.000', name: 'Raro', accent: '#22d3ee', sparks: 20 },
    { chance: '1 / 100.000.000', name: 'Épico', accent: '#a78bfa', sparks: 26 },
    { chance: '1 / 1.000.000.000', name: 'Lendário', accent: '#f472b6', sparks: 32 },
    { chance: '1 / 10.000.000.000', name: 'Mítico', accent: '#fde68a', sparks: 40 }
  ];
  const LAST = 'luminsdk:v1:reveal:last';
  const ON_FIRST = 'luminsdk:v1:reveal:first';

  let layer = null;
  let timer = 0;
  let running = false;
  let lastAt = 0;

  function read(key, fallback) {
    try {
      const value = sessionStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    try { sessionStorage.setItem(key, String(value)); } catch (error) { /* modo privado */ }
  }

  /* 1 em 1.100 → 1 em 10 bilhões, dependendo do destino e do momento */
  function pickTier(route) {
    const juice = route === 'lumin' ? 1 : 0.35;
    const lucky = Math.random();
    let index = 0;
    if (lucky < 0.28 * juice) index = 4;
    else if (lucky < 0.48 * juice) index = 3;
    else if (lucky < 0.66 * juice) index = 2;
    else if (lucky < 0.82 * juice) index = 1;
    return TIERS[index];
  }

  function make(tag, className, parent) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (parent) parent.append(node);
    return node;
  }

  function spark(parent, tier) {
    const dot = document.createElement('span');
    dot.className = 'rv-spark';
    dot.style.setProperty('--x', (Math.random() * 100).toFixed(2) + '%');
    dot.style.setProperty('--s', (2 + Math.random() * 4).toFixed(1) + 'px');
    dot.style.setProperty('--dx', ((Math.random() - 0.5) * 26).toFixed(1) + 'vw');
    dot.style.setProperty('--d', (1.8 + Math.random() * 1.4).toFixed(2) + 's');
    dot.style.setProperty('--t', (Math.random() * 1.1).toFixed(2) + 's');
    dot.style.setProperty('--g', (8 + Math.random() * 14).toFixed(0) + 'px');
    dot.style.setProperty('--c', tier.accent);
    parent.append(dot);
  }

  /* monta a camada inteira (uma vez por chamada; sai do DOM no fim) */
  function build(route) {
    const tier = pickTier(route);
    const reduced = REDUCED;
    const node = document.createElement('div');
    node.id = 'lumin-reveal';
    node.setAttribute('role', 'status');
    node.setAttribute('aria-live', 'polite');
    node.setAttribute('aria-label', 'Abrindo o LuminSDK');

    const stageTag = route === 'lumin' ? 'abertura do catálogo' : 'de volta aos estudos';

    if (!reduced) {
      make('div', 'rv-aurora rv-aurora--a', node);
      make('div', 'rv-aurora rv-aurora--b', node);
      make('div', 'rv-aurora rv-aurora--c', node);
      make('div', 'rv-rays', node);

      const rings = make('div', 'rv-rings', node);
      for (let i = 0; i < 4; i++) make('div', 'rv-ring', rings);
      make('div', 'rv-ring rv-ring--tight', rings);
      make('div', 'rv-core', node);

      const sparks = make('div', 'rv-sparks', node);
      for (let i = 0; i < Math.min(tier.sparks, MAX_SPARKS); i++) spark(sparks, tier);
      make('div', 'rv-sweep', node);
      make('div', 'rv-flash', node);
    }

    const stage = make('div', 'rv-stage', node);
    const tag = make('div', 'rv-tag', stage);
    tag.textContent = stageTag;

    const title = document.createElement('p');
    title.className = 'rv-title';
    title.innerHTML = route === 'lumin' ? 'Lumin<b>SDK</b>' : 'Study<b>Hub</b>';
    stage.append(title);

    const sub = make('p', 'rv-sub', stage);
    sub.textContent = tier.name + ' · ' + tier.chance;

    const bar = make('div', 'rv-bar', stage);
    make('i', '', bar);
    make('p', 'rv-skip', stage).textContent = 'toque ou aperte qualquer tecla para pular';

    node.style.setProperty('--tier', tier.accent);
    return node;
  }

  function remove() {
    window.clearTimeout(timer);
    timer = 0;
    running = false;
    disarmSkip();
    document.documentElement.classList.remove('is-revealing');
    if (!layer) return;
    const node = layer;
    layer = null;
    node.classList.add('is-out');
    window.setTimeout(function () {
      if (node.parentNode) node.parentNode.removeChild(node);
    }, 620);
  }

  /* ---- pular: clique, tecla ou Esc ---- */
  const SKIP_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'];

  function armSkip() {
    SKIP_EVENTS.forEach(function (type) {
      window.addEventListener(type, remove, true);
    });
    window.clearTimeout(timer);
    timer = window.setTimeout(disarmSkip, 3400);
  }

  function disarmSkip() {
    SKIP_EVENTS.forEach(function (type) {
      window.removeEventListener(type, remove, true);
    });
  }

  /* ---------- API ---------- */
  function show(route, reason) {
    if (running) return false;
    if (reason !== 'roll' && reason !== 'first') return false;
    /* a primeira entrada do site é o portal de estudos: só anima se a
       pessoa ligar (LuminApp.revealOnFirst(true)) — a abertura barulhenta
       fica reservada para o atalho/crédito, que é quando o catálogo abre */
    if (reason === 'first' && read(ON_FIRST, '0') !== '1') return false;

    const now = Date.now();
    if (now - lastAt < COOLDOWN) return false;   /* nada de animação em série */
    lastAt = now;
    running = true;

    layer = build(route);
    document.body.append(layer);
    document.documentElement.classList.add('is-revealing');
    armSkip();

    timer = window.setTimeout(function () {
      disarmSkip();
      remove();
    }, REDUCED ? 900 : DURATION);

    return true;
  }

  /* diagnóstico (e para testar sem esperar o atalho) */
  window.LuminReveal = {
    show: function (route, reason) {
      return show(route || 'lumin', reason === undefined ? 'roll' : reason);
    },
    blast: function (route) { lastAt = 0; return show(route || 'lumin', 'roll'); },
    state: function () {
      return { running: running, reduced: REDUCED, last: lastAt, onFirst: read(ON_FIRST, '0') === '1' };
    }
  };
})();
