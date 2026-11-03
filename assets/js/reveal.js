/* =========================================================
   LuminSDK — abertura do catálogo (animação)  ·  ARQUIVO EDITÁVEL
   A "revelação" que toca quando Shift+D — ou o crédito do rodapé —
   abre o LuminSDK: aurora, raios girando, portal de anéis, faíscas,
   varredura de luz, flash e o título com brilho. Mesma ideia das
   aberturas do Sols RNG.

   CARREGADO GLOBALMENTE (defer no index.html): a animação nunca
   depende de rota, de aba carregada ou de script sob demanda.

   ---------------------------------------------------------
   EDITE AQUI (nada de caçar valor no meio do arquivo)
   ---------------------------------------------------------
   · DURATION      duração da animação em ms
   · COOLDOWN      intervalo mínimo entre duas animações (ms)
   · SPARKS        faíscas da maior raridade (as outras usam menos)
   · PALETTE       cores:  a/b/c = auroras, rays = raios, rings = anéis
   · TEXTS         textos fixos (tag, dica de pular)
   · TIERS         raridades: nome, chance mostrada, cor e faíscas
   · ON_FIRST      anima também na primeira entrada do dia?
   · LABEL         título grande por destino (aceita <b>)
   ========================================================= */
(function () {
  'use strict';

  const CONFIG = {
    DURATION: 2400,
    COOLDOWN: 10000,
    SPARKS: 40,
    ON_FIRST: false,

    PALETTE: {
      a: 'rgba(139, 92, 246, .85)',   /* aurora violeta */
      b: 'rgba(34, 211, 238, .70)',   /* aurora ciano */
      c: 'rgba(244, 114, 182, .55)',  /* aurora rosa */
      rays: 'rgba(167, 139, 250, .22)',
      rings: 'rgba(196, 181, 253, .38)'
    },

    TEXTS: {
      lumin: 'abertura do catálogo',
      estudo: 'de volta aos estudos',
      skip: 'toque ou aperte qualquer tecla para pular',
      label: 'Abrindo o LuminSDK'
    },

    LABEL: {
      lumin: 'Lumin<b>SDK</b>',
      estudo: 'Study<b>Hub</b>'
    },

    TIERS: [
      { chance: '1 / 1.100', name: 'Comum', accent: '#a5b4fc', sparks: 14 },
      { chance: '1 / 1.000.000', name: 'Raro', accent: '#22d3ee', sparks: 20 },
      { chance: '1 / 100.000.000', name: 'Épico', accent: '#a78bfa', sparks: 26 },
      { chance: '1 / 1.000.000.000', name: 'Lendário', accent: '#f472b6', sparks: 32 },
      { chance: '1 / 10.000.000.000', name: 'Mítico', accent: '#fde68a', sparks: 40 }
    ]
  };

  /* registro único: o app.js carrega este arquivo sob demanda também, então
     já pode existir uma instância na página */
  if (window.LuminReveal) return;

  /* ?anim=0 no endereço desliga tudo (e o arquivo único nem carrega isto) */
  const OFF = /(?:^|[?&])anim=0(?:&|$)/.test(window.location.search || '');

  const LAST = 'luminsdk:v1:reveal:last';
  const REDUCED = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  let layer = null;
  let timer = 0;
  let watchdog = 0;
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

  /* 1 em 1.100 → 1 em 10 bilhões, dependendo do destino */
  function pickTier(route) {
    const juice = route === 'lumin' ? 1 : 0.35;
    const lucky = Math.random();
    const tiers = CONFIG.TIERS;
    if (lucky < 0.28 * juice) return tiers[4];
    if (lucky < 0.48 * juice) return tiers[3];
    if (lucky < 0.66 * juice) return tiers[2];
    if (lucky < 0.82 * juice) return tiers[1];
    return tiers[0];
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

  /* monta a camada inteira; sai do DOM no fim */
  function build(route) {
    const tier = pickTier(route);
    const node = document.createElement('div');
    node.id = 'lumin-reveal';
    node.className = 'rv-layer';
    node.setAttribute('role', 'status');
    node.setAttribute('aria-live', 'polite');
    node.setAttribute('aria-label', CONFIG.TEXTS.label);

    /* cores e destaque da raridade viram variáveis CSS: dá para trocar
       tudo pelo CONFIG acima ou por CSS, sem tocar na estrutura */
    const p = CONFIG.PALETTE;
    node.style.setProperty('--rv-tier', tier.accent);
    node.style.setProperty('--rv-a', p.a);
    node.style.setProperty('--rv-b', p.b);
    node.style.setProperty('--rv-c', p.c);
    node.style.setProperty('--rv-rays', p.rays);
    node.style.setProperty('--rv-rings', p.rings);

    if (!REDUCED) {
      make('div', 'rv-aurora rv-aurora--a', node);
      make('div', 'rv-aurora rv-aurora--b', node);
      make('div', 'rv-aurora rv-aurora--c', node);
      make('div', 'rv-rays', node);

      const rings = make('div', 'rv-rings', node);
      for (let i = 0; i < 4; i++) make('div', 'rv-ring', rings);
      make('div', 'rv-ring rv-ring--tight', rings);
      make('div', 'rv-core', node);

      const sparks = make('div', 'rv-sparks', node);
      const total = Math.min(tier.sparks, CONFIG.SPARKS);
      for (let i = 0; i < total; i++) spark(sparks, tier);
      make('div', 'rv-sweep', node);
      make('div', 'rv-flash', node);
    }

    const stage = make('div', 'rv-stage', node);
    make('div', 'rv-tag', stage).textContent =
      CONFIG.TEXTS[route] || CONFIG.TEXTS.lumin;

    const title = document.createElement('p');
    title.className = 'rv-title';
    title.innerHTML = CONFIG.LABEL[route] || CONFIG.LABEL.lumin;
    stage.append(title);

    make('p', 'rv-sub', stage).textContent = tier.name + ' · ' + tier.chance;
    const bar = make('div', 'rv-bar', stage);
    make('i', '', bar);
    make('p', 'rv-skip', stage).textContent = CONFIG.TEXTS.skip;

    return node;
  }

  /* ---- limpeza: SEMPRE libera a página (mesmo se algo falhar) ---- */
  function cleanup() {
    window.clearTimeout(timer);
    window.clearTimeout(watchdog);
    timer = 0;
    watchdog = 0;
    running = false;

    /* a classe que existia na primeira versão travava o body: sai sempre */
    document.documentElement.classList.remove('is-revealing');

    if (!layer) return;
    const node = layer;
    layer = null;
    node.classList.add('is-out');
    window.setTimeout(function () {
      if (node.parentNode) node.parentNode.removeChild(node);
    }, 620);
  }

  /* pular: clique, tecla, rolagem ou toque */
  const SKIP_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'];

  function armSkip() {
    SKIP_EVENTS.forEach(function (type) {
      window.addEventListener(type, cleanup, true);
    });
  }

  function disarmSkip() {
    SKIP_EVENTS.forEach(function (type) {
      window.removeEventListener(type, cleanup, true);
    });
  }

  /* ---------- API ---------- */
  function show(route, reason) {
    if (OFF) return false;
    route = route === 'estudo' ? 'estudo' : 'lumin';
    reason = reason === undefined ? 'roll' : reason;

    if (running) return false;
    if (reason !== 'roll' && reason !== 'first') return false;
    if (reason === 'first' && !CONFIG.ON_FIRST && read('luminsdk:v1:reveal:first', '0') !== '1') return false;

    const now = Date.now();
    if (now - lastAt < CONFIG.COOLDOWN) return false;
    lastAt = now;

    running = true;
    try {
      disarmSkip();
      layer = build(route);
      document.body.append(layer);
      armSkip();
    } catch (error) {
      /* nunca deixa a página presa por causa da animação */
      console.warn('[LuminSDK] animação não montou:', error);
      cleanup();
      return false;
    }

    const total = REDUCED ? 900 : CONFIG.DURATION;
    timer = window.setTimeout(function () {
      disarmSkip();
      cleanup();
    }, total);

    /* rede de segurança: se algum navegador engasgar nos timers, a camada
       e a classe saem no limite de tempo de qualquer forma */
    watchdog = window.setTimeout(cleanup, total + 1500);
    return true;
  }

  /* se a aba volta do segundo plano com a camada presa, limpa na hora */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && layer) cleanup();
  });
  window.addEventListener('pageshow', function () {
    document.documentElement.classList.remove('is-revealing');
  });

  window.LuminReveal = {
    config: CONFIG,
    show: function (route, reason) { return show(route, reason); },
    blast: function (route) { lastAt = 0; return show(route || 'lumin', 'roll'); },
    hide: cleanup,
    state: function () {
      return {
        disabled: OFF, running: running, reduced: REDUCED, last: lastAt,
        duration: CONFIG.DURATION, cooldown: CONFIG.COOLDOWN,
        onFirst: CONFIG.ON_FIRST || read('luminsdk:v1:reveal:first', '0') === '1'
      };
    }
  };
})();
