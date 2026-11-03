/* =========================================================
   LuminSDK — animação de troca de aba  ·  ARQUIVO EDITÁVEL
   Uma animação curta (2,5 s, editável abaixo) e DIFERENTE para cada
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
   · DURATION  duração em ms (2500 = 2,5 s; use 2000 para 2 s)
   · THEMES    uma entrada por aba: c1/c2 (cores), label, stamp, hint
   ========================================================= */
(function () {
  'use strict';

  const CONFIG = {
    DURATION: 2500,

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
    },

    /* Tema Astolfo ligado (html[data-skin="astolfo"]): rosa e lilás em
       todas as abas, com o carimbo do relógio continuando por aba. O
       astolfo.css completa o visual (brilho, laço e textura). */
    ASTOLFO: {
      c1: '#ff8fc4',
      c2: '#d7c1ff'
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
  let born = 0;
  let tick = 0;
  let lastRoute = '';

  function themed() {
    return document.documentElement.getAttribute('data-skin') === 'astolfo';
  }

  function theme(route) {
    const base = CONFIG.THEMES[route] || FALLBACK;
    if (!themed()) return base;
    return Object.assign({}, base, {
      c1: CONFIG.ASTOLFO.c1,
      c2: CONFIG.ASTOLFO.c2,
      label: base.label,
      hint: base.hint + ' · ♡'
    });
  }

  function make(tag, className, parent) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (parent) parent.append(node);
    return node;
  }

  function drop() {
    window.clearTimeout(dropTimer);
    if (tick) { window.clearInterval(tick); tick = 0; }
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
    /* o CSS foi coreografado para 200 ms; multiplicamos os tempos pelo
       fator da duração para a animação continuar bonita em 2,5 s */
    node.style.setProperty('--la-scale', (CONFIG.DURATION / 200).toFixed(3));

    if (!REDUCED) {
      make('div', 'la-warp', node);
      const rings = [ '', 'la-ring--2', 'la-ring--3' ];
      rings.forEach(function (extra) {
        paint(make('div', 'la-ring' + (extra ? ' ' + extra : ''), node));
      });
      paint(make('div', 'la-face', node));
      paint(make('div', 'la-hand', node));
      paint(make('div', 'la-grid', node));
      paint(make('div', 'la-flash', node));
    }

    /* o mostrador é o que sobra em qualquer cenário: se algo falhar acima,
       ele ainda aparece (nunca mais "troquei de aba e nada aconteceu") */
    const stage = make('div', 'la-stage', node);
    const clock = make('b', 'la-time', stage);
    clock.textContent = t.stamp;
    /* dataset é só leitura em alguns navegadores: escrever nele lançava
       TypeError, a camada morria e a animação NUNCA aparecia */
    clock.setAttribute('data-stamp', t.stamp);
    make('span', 'la-label', stage).textContent = t.label + ' · ' + t.hint;

    /* os dois textos também acompanham a duração */
    Array.prototype.forEach.call(stage.children, paint);

    return node;
  }

  /* duração no próprio elemento (o CSS já usa --la-scale como rede) */
  function paint(el) {
    try { el.style.animationDuration = CONFIG.DURATION + 'ms'; } catch (error) {}
    return el;
  }

  /* roda a animação daquela aba; nunca lança, nunca deixa sobra */
  function play(route) {
    route = typeof route === 'string' && route ? route : 'lumin';
    lastRoute = route;
    try {
      drop();                                  /* troca rápida: troca a camada */
      layer = build(route);
      /* body pode não existir (script adiantado, aba em branco recém-criada) */
      (document.body || document.documentElement).append(layer);
      born = Date.now();
      dropTimer = window.setTimeout(drop, CONFIG.DURATION + 120);
      runClock(layer);
      return true;
    } catch (error) {
      console.warn('[LuminSDK] animação não montou:', error);
      drop();
      /* última rede: pelo menos o texto da aba, sem coreografia nenhuma */
      try {
        const t = theme(route);
        const simple = document.createElement('div');
        simple.id = ROOT_ID;
        simple.setAttribute('aria-hidden', 'true');
        simple.style.setProperty('--la-1', t.c1);
        simple.style.setProperty('--la-2', t.c2);
        simple.style.setProperty('--la-dur', CONFIG.DURATION + 'ms');
        simple.style.setProperty('--la-scale', '1');
        simple.className = 'la-simple';
        simple.textContent = t.stamp + ' · ' + t.label;
        (document.body || document.documentElement).append(simple);
        layer = simple;
        born = Date.now();
        dropTimer = window.setTimeout(drop, CONFIG.DURATION + 120);
        return true;
      } catch (fatal) {
        drop();
        return false;
      }
    }
  }

  /* rede de segurança: nunca deixar uma camada presa — mas só recolhe a que
     já passou do próprio tempo de vida (load/pageshow chegam logo depois do
     boot e apagavam a primeira animação antes de ela aparecer) */
  function sweep() {
    if (layer && Date.now() - born > CONFIG.DURATION + 200) drop();
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') sweep();
  });
  window.addEventListener('pageshow', sweep);

  /* o relógio do mostrador avança enquanto a animação roda */
  function runClock(node) {
    if (typeof window.setInterval !== 'function') return;
    const clock = node.querySelector ? node.querySelector('.la-time') : null;
    const stamp = clock ? (clock.getAttribute('data-stamp') || '') : '';
    const parts = /^(\d{1,2}):(\d{2})$/.exec(stamp || '');
    if (!parts) return;
    let minutes = (parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10)) % 1440;
    const step = Math.max(220, Math.round(CONFIG.DURATION / 5));
    tick = window.setInterval(function () {
      if (!layer) { window.clearInterval(tick); tick = 0; return; }
      minutes = (minutes + 1) % 1440;
      clock.textContent = String(Math.floor(minutes / 60)).padStart(2, '0') + ':' +
        String(minutes % 60).padStart(2, '0');
    }, step);
  }

  window.LuminAnim = {
    config: CONFIG,
    play: play,
    hide: drop,
    /* o tema Astolfo chama isto ao ligar/desligar para a próxima animação
       já sair nas cores certas (as camadas em voo são recolhidas) */
    refresh: function () {
      drop();
      return themed();
    },
    state: function () {
      return { running: !!layer, duration: CONFIG.DURATION, reduced: REDUCED,
        last: lastRoute, themes: Object.keys(CONFIG.THEMES) };
    }
  };
})();
