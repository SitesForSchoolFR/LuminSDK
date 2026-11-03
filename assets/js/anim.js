/* =========================================================
   LuminSDK — animação de troca de aba  ·  ARQUIVO EDITÁVEL
   Uma animação curta (200 ms, editável abaixo) e DIFERENTE para cada
   aba, no tema tempo / relógio / espaço-tempo: funil de espaço-tempo,
   anéis de relógio, ponteiro girando, grade em perspectiva e um
   mostrador digital com o "tempo" daquela aba.

   · carregado globalmente (defer no index.html): funciona em toda troca
     de aba, sempre — nada de "só na primeira vez"
   · cada aba tem cor, rótulo e um "carimbo de tempo" próprio (THEMES)
   · a camada é pointer-events:none e morre sozinha; nunca trava a página
   · ?anim=0 desliga; "menos movimento" cai para o fade + nome da aba

   ---------------------------------------------------------
   EDITE AQUI
   ---------------------------------------------------------
   · DURATION  duração em ms (200 = pedido)
   · THEMES    uma entrada por aba: c1/c2 (cores), label, stamp, hint
   ========================================================= */
(function () {
  'use strict';

  const CONFIG = {
    DURATION: 200,

    /* c1/c2 = cores do gradiente · label = nome da aba
       stamp = "tempo" mostrado · hint = marcações do mostrador */
    THEMES: {
      lumin:    { c1: '#a78bfa', c2: '#22d3ee', label: 'catálogo',       stamp: '11:00',    hint: '1.100 jogos' },
      estudo:   { c1: '#60a5fa', c2: '#f9a8d4', label: 'estudos',        stamp: '07:30',    hint: 'aula' },
      sites:    { c1: '#f472b6', c2: '#fde68a', label: 'sites',          stamp: '15:45',    hint: 'portais' },
      gn:       { c1: '#34d399', c2: '#22d3ee', label: 'gn-math',        stamp: '09:15',    hint: '840 jogos' },
      os:       { c1: '#818cf8', c2: '#c084fc', label: 'luminos',        stamp: '00:00',    hint: 'área de trabalho' },
      hub:      { c1: '#38bdf8', c2: '#a78bfa', label: 'hub',            stamp: '12:00',    hint: 'perfil' },
      browser:  { c1: '#22d3ee', c2: '#818cf8', label: 'navegador',      stamp: '16:20',    hint: 'endereço' },
      provider: { c1: '#fbbf24', c2: '#f472b6', label: 'catálogo',       stamp: '13:10',    hint: 'duckmath · astra' },
      boot:     { c1: '#a78bfa', c2: '#f9a8d4', label: 'entrada',        stamp: '23:59',    hint: 'escolha' }
    }
  };

  const ROOT_ID = 'lum-anim';
  const FALLBACK = { c1: '#a78bfa', c2: '#22d3ee', label: 'lumin', stamp: '00:00', hint: 'lumin sdk' };

  if (/(?:^|[?&])anim=0(?:&|$)/.test(window.location.search || '')) {
    window.LuminAnim = { play: function () { return false; }, state: function () { return { disabled: true }; } };
    return;
  }

  /* o app.js carrega este arquivo por rota (para furar cache): não duplica */
  if (window.LuminAnim) return;

  const REDUCED = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  let layer = null;
  let dropTimer = 0;
  let lastRoute = '';

  function theme(route) {
    return CONFIG.THEMES[route] || FALLBACK;
  }

  function make(tag, className, parent) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (parent) parent.append(node);
    return node;
  }

  function drop() {
    window.clearTimeout(dropTimer);
    dropTimer = 0;
    if (!layer) return;
    const node = layer;
    layer = null;
    if (node.parentNode) node.parentNode.removeChild(node);
  }

  function build(route) {
    const t = theme(route);
    const node = document.createElement('div');
    node.id = ROOT_ID;
    node.setAttribute('aria-hidden', 'true');
    node.style.setProperty('--la-1', t.c1);
    node.style.setProperty('--la-2', t.c2);
    node.style.setProperty('--la-dur', CONFIG.DURATION + 'ms');
    /* a duração do CONFIG vale para todas as animações da camada */
    node.style.animationDuration = CONFIG.DURATION + 'ms';

    if (!REDUCED) {
      make('div', 'la-warp', node);
      const rings = [ '', 'la-ring--2', 'la-ring--3' ];
      rings.forEach(function (extra) {
        const ring = make('div', 'la-ring' + (extra ? ' ' + extra : ''), node);
        ring.style.animationDuration = CONFIG.DURATION + 'ms';
      });
      const face = make('div', 'la-face', node);
      face.style.animationDuration = CONFIG.DURATION + 'ms';
      const hand = make('div', 'la-hand', node);
      hand.style.animationDuration = CONFIG.DURATION + 'ms';
      const grid = make('div', 'la-grid', node);
      grid.style.animationDuration = CONFIG.DURATION + 'ms';
      make('div', 'la-flash', node).style.animationDuration = CONFIG.DURATION + 'ms';
    }

    const stage = make('div', 'la-stage', node);
    make('b', 'la-time', stage).textContent = t.stamp;
    make('span', 'la-label', stage).textContent = t.label + ' · ' + t.hint;

    /* os dois textos também acompanham a duração */
    Array.prototype.forEach.call(stage.children, function (child) {
      child.style.animationDuration = CONFIG.DURATION + 'ms';
    });

    return node;
  }

  /* roda a animação daquela aba; nunca lança, nunca deixa sobra */
  function play(route) {
    route = typeof route === 'string' && route ? route : 'lumin';
    lastRoute = route;
    try {
      drop();                                  /* troca rápida: troca a camada */
      layer = build(route);
      document.body.append(layer);
      dropTimer = window.setTimeout(drop, CONFIG.DURATION + 120);
      return true;
    } catch (error) {
      console.warn('[LuminSDK] animação não montou:', error);
      drop();
      return false;
    }
  }

  /* redes de segurança: nunca deixar uma camada presa */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') drop();
  });
  window.addEventListener('pageshow', drop);

  window.LuminAnim = {
    config: CONFIG,
    play: play,
    hide: drop,
    state: function () {
      return { running: !!layer, duration: CONFIG.DURATION, reduced: REDUCED,
        last: lastRoute, themes: Object.keys(CONFIG.THEMES) };
    }
  };
})();
