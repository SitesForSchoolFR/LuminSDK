/* =========================================================
   LuminOS — a área de trabalho do LuminSDK
   Janelas que arrastam, apps de verdade (jogos, navegador, sites,
   notas, calculadora, ajustes, chat, sobre) e tudo sem build.
   O contador de pessoas e o chat ficam em assets/js/social.js.
   Autor: Ryan Smith · Licença MIT
   ========================================================= */
(function () {
  'use strict';

  const DATA_GAMES = 'assets/data/gnmath-games.json';
  const DATA_SITES = 'assets/data/sites.json';
  const HTML_MIRRORS = [
    'https://cdn.jsdelivr.net/gh/freebuisness/html@main/',
    'https://raw.githubusercontent.com/freebuisness/html/main/',
    'https://raw.githack.com/freebuisness/html/main/',
    'https://cdn.statically.io/gh/freebuisness/html/main/'
  ];
  const COVER_MIRRORS = [
    'https://cdn.jsdelivr.net/gh/freebuisness/covers@main/',
    'https://raw.githubusercontent.com/freebuisness/covers/main/',
    'https://cdn.statically.io/gh/freebuisness/covers/main/'
  ];
  const STORE = 'luminsdk:v1:os';
  const PAGE = 48;

  const ICONS = {
    games: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10a5 5 0 0 1 4.9 4l.6 4.2A2.6 2.6 0 0 1 18.7 18l-1.6-1.7H6.9L5.3 18a2.6 2.6 0 0 1-3.8-2.8L2.1 11A5 5 0 0 1 7 7Z"/><path d="M7.5 10.4v2.4M6.3 11.6h2.4M15.6 10.9h.01M17.6 12.6h.01"/></svg>',
    browser: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3.5 9h17M3.5 15h17M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>',
    sites: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.5h7A1.5 1.5 0 0 1 19 10v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 3 18V7.5Z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8.4 8.4 0 0 1-9 8.4 9.6 9.6 0 0 1-3.2-.6L4 21l1.3-3.7A8.2 8.2 0 0 1 3 12a8.4 8.4 0 0 1 9-8.4A8.4 8.4 0 0 1 21 12Z"/></svg>',
    notes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v14H6z"/><path d="M14.5 3v4.5H19M9 12h7M9 16h5"/></svg>',
    calc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2.4"/><path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 15.5h.01M12 15.5h.01M15.5 15.5h.01M8.5 19h.01M12 19h.01M15.5 19h.01"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.1"/><path d="M19.3 14.9a1.6 1.6 0 0 0 .3 1.8l.1.1a1.9 1.9 0 1 1-2.7 2.7l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a1.9 1.9 0 1 1-3.8 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a1.9 1.9 0 1 1-2.7-2.7l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a1.9 1.9 0 1 1 0-3.8h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a1.9 1.9 0 1 1 2.7-2.7l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a1.9 1.9 0 1 1 3.8 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a1.9 1.9 0 1 1 2.7 2.7l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a1.9 1.9 0 1 1 0 3.8h-.1a1.6 1.6 0 0 0-1.6 1.1Z"/></svg>',
    movies: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.2"/><path d="M7.5 5v14M16.5 5v14M3 9.5h4.5M3 14.5h4.5M16.5 9.5H21M16.5 14.5H21"/></svg>',
    about: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6h.01"/></svg>'
  };

  const WALLS = ['aurora', 'meia-noite', 'floresta', 'papel'];

  const state = {
    windows: {},
    order: [],
    z: 10,
    games: null,
    sites: null,
    playing: {},
    booted: false
  };

  let root, desk, layer, dock, crumb;

  /* ---------- preferências ---------- */
  function prefs() {
    try {
      return JSON.parse(localStorage.getItem(STORE) || '{}') || {};
    } catch (error) {
      return {};
    }
  }

  function savePrefs(patch) {
    const next = Object.assign(prefs(), patch);
    try { localStorage.setItem(STORE, JSON.stringify(next)); } catch (error) {}
    applyPrefs();
  }

  function applyPrefs() {
    const p = prefs();
    if (!root) return;
    root.dataset.wall = WALLS.indexOf(p.wall) >= 0 ? p.wall : 'aurora';
    root.dataset.accent = p.accent || 'violeta';
  }

  /* ---------- utilidades ---------- */
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function esc(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function zoneBase(url) {
    return url.replace(/[^/]*$/, '');
  }

  function injectBase(html, url) {
    const tag = '<base href="' + zoneBase(url) + '">';
    if (/<base\s/i.test(html)) return html.replace(/<base[^>]*>/i, tag);
    if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, function (m) { return m + tag; });
    return tag + html;
  }

  function toast(text) {
    const box = document.getElementById('os-toast');
    if (!box) return;
    box.textContent = text;
    box.hidden = false;
    box.classList.add('is-on');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () {
      box.classList.remove('is-on');
      setTimeout(function () { box.hidden = true; }, 220);
    }, 2600);
  }

  /* ---------- dados ---------- */
  async function loadGames() {
    if (state.games) return state.games;
    const response = await fetch(DATA_GAMES, { cache: 'force-cache' });
    const data = await response.json();
    state.games = (data.games || []).filter(function (game) {
      return game && game.n && game.f && game.n.indexOf('[!]') !== 0;
    });
    return state.games;
  }

  async function loadSites() {
    if (state.sites) return state.sites;
    const response = await fetch(DATA_SITES, { cache: 'force-cache' });
    const data = await response.json();
    state.sites = data.families || [];
    return state.sites;
  }

  /* ---------- janelas ---------- */
  function deskBox() {
    const box = desk && desk.getBoundingClientRect ? desk.getBoundingClientRect() : null;
    return {
      w: (box && box.width) || window.innerWidth || 360,
      h: (box && box.height) || window.innerHeight || 640
    };
  }

  /* tamanho pedido, mas nunca maior que a área de trabalho */
  function fitSize(app) {
    const area = deskBox();
    return {
      w: Math.round(Math.min(app.w, Math.max(280, area.w - 20))),
      h: Math.round(Math.min(app.h, Math.max(240, area.h - 20)))
    };
  }

  /* centraliza a janela e mantém tudo dentro da tela (nada de nascer fora) */
  function placeWin(win, offset, anchorTop) {
    const area = deskBox();
    const rect = win.getBoundingClientRect();
    const w = rect.width || parseFloat(win.style.getPropertyValue('--w')) || 320;
    const h = rect.height || parseFloat(win.style.getPropertyValue('--h')) || 320;
    const pad = 10;
    const shift = offset || 0;

    let left = (area.w - w) / 2 + shift;
    left = Math.max(pad, Math.min(left, area.w - w - pad));

    let top = typeof anchorTop === 'number'
      ? anchorTop
      : (area.h - h) / 2 - 8 + shift;
    top = Math.max(6, Math.min(top, area.h - h - pad));

    win.style.left = Math.round(left) + 'px';
    win.style.top = Math.round(top) + 'px';
  }

  function resizeWin(win, w, h) {
    win.style.setProperty('--w', Math.round(w) + 'px');
    win.style.setProperty('--h', Math.round(h) + 'px');
  }

  function focusWin(id) {
    const win = state.windows[id];
    if (!win) return;
    state.z += 1;
    win.el.style.zIndex = String(state.z);
    win.el.classList.remove('is-min');
    Object.keys(state.windows).forEach(function (key) {
      state.windows[key].el.classList.toggle('is-focus', key === id);
    });
    if (crumb) crumb.textContent = win.app.name;
  }

  function openApp(id) {
    if (id === 'chat') {
      if (window.LuminSocial) window.LuminSocial.open();
      return;
    }
    const app = APPS.filter(function (item) { return item.id === id; })[0];
    if (!app) return;

    const existing = state.windows[id];
    if (existing) {
      focusWin(id);
      if (existing.el.classList.contains('is-min')) existing.el.classList.remove('is-min');
      return;
    }

    const win = el('section', 'win is-focus');
    win.dataset.app = id;

    const size = fitSize(app);
    win.style.setProperty('--w', size.w + 'px');
    win.style.setProperty('--h', size.h + 'px');

    win.innerHTML = [
      '<header class="win__bar" data-drag>',
      '  <span class="win__icon">' + ICONS[app.id] + '</span>',
      '  <span class="win__title">' + esc(app.name) + '</span>',
      '  <span class="win__actions">',
      '    <button class="win__btn" type="button" data-win="min" aria-label="Minimizar" title="Minimizar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg></button>',
      '    <button class="win__btn" type="button" data-win="max" aria-label="Maximizar" title="Maximizar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="5" y="5" width="14" height="14" rx="2"/></svg></button>',
      '    <button class="win__btn win__btn--close" type="button" data-win="close" aria-label="Fechar" title="Fechar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>',
      '  </span>',
      '</header>',
      '<div class="win__body" data-body></div>'
    ].join('');

    layer.append(win);
    state.windows[id] = {
      el: win,
      app: app,
      base: { w: size.w, h: size.h }
    };
    state.order.push(id);
    focusWin(id);

    const count = Object.keys(state.windows).length - 1;
    placeWin(win, (count % 5) * 26);

    win.addEventListener('pointerdown', function () { focusWin(id); }, true);

    win.querySelectorAll('[data-win]').forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        const action = button.dataset.win;
        if (action === 'close') closeWin(id);
        else if (action === 'min') { win.classList.add('is-min'); }
        else if (action === 'max') { win.classList.toggle('is-max'); }
      });
    });

    drag(win);
    grip(win);

    /* duplo clique na barra de título maximiza/restaura */
    const bar = win.querySelector('[data-drag]');
    if (bar) {
      bar.addEventListener('dblclick', function (event) {
        if (event.target.closest('button')) return;
        win.classList.toggle('is-max');
      });
    }

    const body = win.querySelector('[data-body]');
    app.render(body, win);
    renderDock();
    updateHint();
  }

  function closeWin(id) {
    const win = state.windows[id];
    if (!win) return;
    if (state.playing[id]) stopPlaying(id);
    win.el.classList.remove('is-play');
    win.el.remove();
    delete state.windows[id];
    state.order = state.order.filter(function (key) { return key !== id; });
    if (crumb) crumb.textContent = 'Área de trabalho';
    renderDock();
    updateHint();
  }

  /* alça no canto: dá para ajustar a proporção da janela à mão */
  function grip(win) {
    const handle = el('span', 'win__grip');
    handle.setAttribute('aria-hidden', 'true');
    win.append(handle);

    let start = null;

    handle.addEventListener('pointerdown', function (event) {
      if (win.classList.contains('is-max')) return;
      event.preventDefault();
      event.stopPropagation();
      const rect = win.getBoundingClientRect();
      start = {
        x: event.clientX,
        y: event.clientY,
        w: rect.width || parseFloat(win.style.getPropertyValue('--w')) || 320,
        h: rect.height || parseFloat(win.style.getPropertyValue('--h')) || 240
      };
      win.classList.add('is-resizing');
      try { handle.setPointerCapture(event.pointerId); } catch (error) {}
    });

    handle.addEventListener('pointermove', function (event) {
      if (!start) return;
      const area = deskBox();
      const left = parseFloat(win.style.left) || 0;
      const top = parseFloat(win.style.top) || 0;
      const maxW = Math.max(300, area.w - left - 10);
      const maxH = Math.max(220, area.h - top - 10);
      const w = Math.max(300, Math.min(start.w + (event.clientX - start.x), maxW));
      const h = Math.max(220, Math.min(start.h + (event.clientY - start.y), maxH));
      resizeWin(win, w, h);
    });

    const stop = function (event) {
      if (!start) return;
      start = null;
      win.classList.remove('is-resizing');
      try { handle.releasePointerCapture(event.pointerId); } catch (error) {}
    };
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
  }

  function drag(win) {
    const bar = win.querySelector('[data-drag]');
    if (!bar) return;
    let start = null;

    bar.addEventListener('pointerdown', function (event) {
      if (event.target.closest('button')) return;
      if (win.classList.contains('is-max')) return;
      if (window.innerWidth < 720) return;
      const rect = win.getBoundingClientRect();
      start = {
        x: event.clientX,
        y: event.clientY,
        left: rect.width ? rect.left : (parseFloat(win.style.left) || 0),
        top: rect.height ? rect.top : (parseFloat(win.style.top) || 0)
      };
      win.classList.add('is-dragging');
      bar.setPointerCapture(event.pointerId);
    });

    bar.addEventListener('pointermove', function (event) {
      if (!start) return;
      const bounds = desk.getBoundingClientRect();
      const rect = win.getBoundingClientRect();
      let left = start.left + (event.clientX - start.x) - bounds.left;
      let top = start.top + (event.clientY - start.y) - bounds.top;
      left = Math.max(8, Math.min(left, bounds.width - rect.width - 8));
      top = Math.max(4, Math.min(top, bounds.height - 60));
      win.style.left = left + 'px';
      win.style.top = top + 'px';
    });

    const stop = function (event) {
      if (!start) return;
      start = null;
      win.classList.remove('is-dragging');
      try { bar.releasePointerCapture(event.pointerId); } catch (error) {}
    };
    bar.addEventListener('pointerup', stop);
    bar.addEventListener('pointercancel', stop);
  }

  function updateHint() {
    const hint = document.getElementById('os-hint');
    if (hint) hint.hidden = Object.keys(state.windows).length > 0;
  }

  /* ---------- dock + atalhos ---------- */
  function renderDock() {
    if (!dock) return;
    dock.textContent = '';
    APPS.forEach(function (app) {
      const button = el('button', 'dock__app');
      button.type = 'button';
      button.dataset.app = app.id;
      button.title = app.name;
      button.setAttribute('aria-label', 'Abrir ' + app.name);
      button.innerHTML = ICONS[app.id] + '<span>' + esc(app.short || app.name) + '</span>';
      if (state.windows[app.id]) button.classList.add('is-open');
      dock.append(button);
    });
  }

  function renderIcons() {
    const box = document.getElementById('os-icons');
    if (!box) return;
    box.textContent = '';
    APPS.forEach(function (app) {
      if (app.dockOnly) return;
      const button = el('button', 'desk-icon');
      button.type = 'button';
      button.dataset.app = app.id;
      button.innerHTML = '<span class="desk-icon__art">' + ICONS[app.id] + '</span><span>' + esc(app.name) + '</span>';
      box.append(button);
    });
  }

  /* ---------- app: jogos ---------- */
  /* ---------- app de jogos: escolha da fonte ----------
     três entradas, como no site normal: GN-Math (acervo local),
     DuckMath (lista de sites da família) e LuminSDK (catálogo do SDK). */
  const GAME_SOURCES = [
    { id: 'gn', name: 'GN-Math', text: 'acervo de jogos do GN-Math' },
    { id: 'duck', name: 'DuckMath', text: 'matemática que vira jogo', logo: 'assets/img/duckmath.jpg' },
    { id: 'lumin', name: 'LuminSDK', text: 'catálogo com mais de 1.100 jogos', logo: 'assets/img/favicon.svg' }
  ];

  function sourceBack(body, win, label) {
    return '<button class="games__back" type="button" data-src-back>← ' + esc(label) + '</button>';
  }

  async function renderGames(body, win) {
    body.innerHTML = [
      '<div class="gsrc">',
      '  <p class="gsrc__lead">De onde vêm os jogos?</p>',
      '  <div class="gsrc__grid">',
      GAME_SOURCES.map(function (src) {
        const art = src.logo
          ? '<img src="' + src.logo + '" alt="" width="44" height="44" decoding="async">'
          : '<span class="gsrc__mono" aria-hidden="true">GN</span>';
        return '<button class="gsrc__card" type="button" data-src="' + src.id + '">' + art +
          '<b>' + esc(src.name) + '</b><small>' + esc(src.text) + '</small></button>';
      }).join(''),
      '  </div>',
      '</div>'
    ].join('');

    body.querySelectorAll('[data-src]').forEach(function (card) {
      card.addEventListener('click', function () {
        const id = card.dataset.src;
        if (id === 'gn') renderGnGames(body, win);
        else if (id === 'duck') renderSiteFamily(body, win, 'duck-math', 'DuckMath');
        else renderLuminSource(body, win);
      });
    });
  }

  /* lista de sites de uma família (DuckMath): cada item abre em outra aba */
  async function renderSiteFamily(body, win, familyId, title) {
    body.innerHTML = '<div class="gsrc gsrc--list">' +
      '<div class="games__head">' + sourceBack(body, win, 'Fontes') +
      '<span class="games__count" data-count>carregando…</span></div>' +
      '<div class="gsrc__items" data-grid></div></div>';
    body.querySelector('[data-src-back]').addEventListener('click', function () { renderGames(body, win); });
    const grid = body.querySelector('[data-grid]');
    const counter = body.querySelector('[data-count]');

    let families = [];
    try {
      families = await loadSites();
    } catch (error) {
      grid.append(el('p', 'games__error', 'Não foi possível abrir a lista agora. Confira a conexão.'));
      counter.textContent = 'offline';
      return;
    }

    const family = families.find(function (item) { return item.id === familyId; });
    const sites = (family && family.sites) || [];
    counter.textContent = sites.length + (sites.length === 1 ? ' link' : ' links') + ' · ' + title;
    sites.forEach(function (site) {
      const row = el('button', 'gsrc__item', site.name || site.url);
      row.type = 'button';
      row.title = site.url;
      row.addEventListener('click', function () {
        window.open(site.url, '_blank', 'noopener');
      });
      grid.append(row);
    });
  }

  /* LuminSDK: o catálogo mora na aba LuminSDK do site (carregado pelo SDK) */
  function renderLuminSource(body, win) {
    body.innerHTML = '<div class="gsrc gsrc--list">' +
      '<div class="games__head">' + sourceBack(body, win, 'Fontes') + '</div>' +
      '<div class="gsrc__panel">' +
      '  <p class="gsrc__title">Catálogo LuminSDK</p>' +
      '  <p class="gsrc__text">Os jogos do LuminSDK abrem no catálogo principal, com busca, favoritos e o player próprio.</p>' +
      '  <button class="gsrc__go" type="button" data-open-lumin>Abrir o catálogo LuminSDK</button>' +
      '</div></div>';
    body.querySelector('[data-src-back]').addEventListener('click', function () { renderGames(body, win); });
    body.querySelector('[data-open-lumin]').addEventListener('click', function () {
      if (window.LuminApp) window.LuminApp.go('lumin', { force: true });
    });
  }

  async function renderGnGames(body, win) {
    body.innerHTML = [
      '<div class="games">',
      '  <div class="games__head">',
      '    <button class="games__back" type="button" data-src-back>← Fontes</button>',
      '    <label class="games__search">',
      '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="6.4"/><path d="m16 16 4.4 4.4"/></svg>',
      '      <input type="search" placeholder="Buscar jogo…" aria-label="Buscar jogo">',
      '    </label>',
      '    <span class="games__count" data-count>carregando…</span>',
      '  </div>',
      '  <div class="games__grid" data-grid></div>',
      '</div>'
    ].join('');

    const grid = body.querySelector('[data-grid]');
    const input = body.querySelector('input');
    const counter = body.querySelector('[data-count]');
    body.querySelector('[data-src-back]').addEventListener('click', function () { renderGames(body, win); });

    let games = [];
    try {
      games = await loadGames();
    } catch (error) {
      grid.append(el('p', 'games__error', 'Não foi possível abrir a lista de jogos agora. Confira a conexão e reabra o app.'));
      counter.textContent = 'offline';
      return;
    }

    let query = '';
    let shown = PAGE;

    function paint(keepScroll) {
      const list = games.filter(function (game) {
        if (!query) return true;
        return (game.n || '').toLowerCase().indexOf(query) >= 0 ||
          (game.a || '').toLowerCase().indexOf(query) >= 0;
      });
      const scrollTop = keepScroll ? grid.scrollTop : 0;
      counter.textContent = list.length + (list.length === 1 ? ' jogo' : ' jogos');
      grid.textContent = '';

      const slice = list.slice(0, shown);
      const fragment = document.createDocumentFragment();
      slice.forEach(function (game) {
        /* <div role="button"> em vez de <button>: no Chromium o <button>
           não aceita conteúdo em grid e o cartão virava uma tira fina */
        const card = el('div', 'gcard');
        card.setAttribute('role', 'button');
        card.tabIndex = 0;
        card.innerHTML = [
          '<span class="gcard__art"><img alt="" loading="lazy" decoding="async"><span class="gcard__mono">' + esc(String(game.n).slice(0, 2).toUpperCase()) + '</span></span>',
          '<span class="gcard__name">' + esc(game.n) + '</span>',
          game.a ? '<span class="gcard__cat">' + esc(game.a) + '</span>' : ''
        ].join('');
        const img = card.querySelector('img');
        let mirror = 0;
        if (game.c) {
          img.src = COVER_MIRRORS[0] + game.c;
          img.addEventListener('error', function () {
            mirror += 1;
            if (mirror < COVER_MIRRORS.length) img.src = COVER_MIRRORS[mirror] + game.c;
            else img.remove();
          });
        } else {
          img.remove();
        }
        card.addEventListener('click', function () { playGame(win, game); });
        card.addEventListener('keydown', function (event) {
          if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return;
          event.preventDefault();
          playGame(win, game);
        });
        fragment.append(card);
      });
      grid.append(fragment);

      if (list.length > shown) {
        const more = el('button', 'games__more', 'Mostrar mais (' + (list.length - shown) + ')');
        more.type = 'button';
        more.addEventListener('click', function () { shown += PAGE; paint(true); });
        grid.append(more);
      }
      if (!list.length) grid.append(el('p', 'games__error', 'Nenhum jogo com “‘' + esc(query) + '’”.'));

      /* mantém a posição de leitura ao carregar mais cards */
      grid.scrollTop = scrollTop;
    }

    input.addEventListener('input', function () {
      query = input.value.trim().toLowerCase();
      shown = PAGE;
      paint();
    });

    paint();
  }

  /* mede o espaço e encaixa o jogo em 16:9 — o resto vira tarja preta.
     Feito em JS com medidas reais: nada de unidade de container, que
     encolhia o player em algumas telas. */
  function fitStage(stage) {
    if (!stage) return;
    const frame = stage.querySelector('.play__frame');
    if (!frame) return;

    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!w || !h) return;

    let fw = w;
    let fh = Math.round((w * 9) / 16);
    if (fh > h) {
      fh = h;
      fw = Math.round((h * 16) / 9);
    }

    frame.style.width = Math.max(1, Math.round(fw)) + 'px';
    frame.style.height = Math.max(1, Math.round(fh)) + 'px';
  }

  function watchStage(stage) {
    fitStage(stage);
    if (typeof ResizeObserver === 'function') {
      try {
        const observer = new ResizeObserver(function () { fitStage(stage); });
        observer.observe(stage);
        return;
      } catch (error) { /* segue para o plano B */ }
    }
    window.addEventListener('resize', function () { fitStage(stage); }, { passive: true });
  }

  /* abrir um jogo ocupa a área de trabalho inteira */
  function growForPlay(id) {
    const entry = state.windows[id];
    if (!entry) return;
    const win = entry.el;

    entry.wasMax = win.classList.contains('is-max');
    win.classList.add('is-max');
    win.classList.add('is-play');
  }

  function shrinkAfterPlay(id) {
    const entry = state.windows[id];
    if (!entry) return;
    entry.el.classList.remove('is-play');
    if (!entry.wasMax) entry.el.classList.remove('is-max');
    entry.wasMax = false;
    if (entry.base) resizeWin(entry.el, entry.base.w, entry.base.h);
    placeWin(entry.el, 0);
  }

  async function playGame(win, game) {
    const body = win.querySelector('[data-body]');
    const id = win.dataset.app;
    state.playing[id] = true;
    if (window.LuminSocial) window.LuminSocial.setPlaying(true);

    body.innerHTML = [
      '<div class="play">',
      '  <div class="play__bar">',
      '    <button class="play__back" type="button" data-back>← Acervo</button>',
      '    <span class="play__name">' + esc(game.n) + '</span>',
      '    <button class="play__btn" type="button" data-reload aria-label="Recarregar">↻</button>',
      '    <button class="play__btn" type="button" data-full aria-label="Tela cheia" title="Tela cheia">⛶</button>',
      '    <button class="play__btn" type="button" data-ext aria-label="Abrir em outra aba">↗</button>',
      '  </div>',
      '  <div class="play__stage"><div class="play__frame"><iframe title="' + esc(game.n) + '" allow="autoplay; fullscreen; gamepad; clipboard-write; encrypted-media; pointer-lock" allowfullscreen referrerpolicy="no-referrer"></iframe></div><p class="play__note" data-note hidden></p><span class="play__spin"></span></div>',
      '</div>'
    ].join('');

    const frame = body.querySelector('iframe');
    const note = body.querySelector('[data-note]');
    const spin = body.querySelector('.play__spin');
    const stage = body.querySelector('.play__stage');
    const sources = HTML_MIRRORS.map(function (base) { return base + game.f; });

    growForPlay(id);
    watchStage(stage);

    body.querySelector('[data-back]').addEventListener('click', function () {
      stopPlaying(id);
      shrinkAfterPlay(id);
      renderGnGames(body, win);
    });
    body.querySelector('[data-ext]').addEventListener('click', function () {
      window.open(sources[0], '_blank', 'noopener');
    });
    body.querySelector('[data-reload]').addEventListener('click', function () {
      playGame(win, game);
    });

    body.querySelector('[data-full]').addEventListener('click', function () {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen().catch(function () {});
        return;
      }
      if (stage && stage.requestFullscreen) stage.requestFullscreen().catch(function () {});
    });

    let html = '';
    let used = '';
    for (let i = 0; i < sources.length && !html; i += 1) {
      try {
        const response = await fetch(sources[i], { cache: 'force-cache' });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const text = await response.text();
        if (!text || text.length < 40) throw new Error('vazio');
        html = text;
        used = sources[i];
      } catch (error) { /* próximo espelho */ }
    }

    if (!html) {
      frame.src = sources[0];
      spin.remove();
      note.hidden = false;
      note.textContent = 'O acervo não respondeu ao download; o arquivo foi entregue direto ao player. Se ficar em branco, use ↗.';
      return;
    }

    if (/ytgame/i.test(html)) {
      spin.remove();
      note.hidden = false;
      note.textContent = 'Este título é YouTube Playables e não roda embutido. Use ↗ para abrir em outra aba.';
      return;
    }

    frame.srcdoc = injectBase(html, used);
  }

  function stopPlaying(id) {
    state.playing[id] = false;
    const any = Object.keys(state.playing).some(function (key) { return state.playing[key]; });
    if (!any && window.LuminSocial) window.LuminSocial.setPlaying(false);
  }

  /* ---------- app: navegador ---------- */
  function renderBrowser(body, win, initial) {
    body.innerHTML = [
      '<div class="browser">',
      '  <form class="browser__bar">',
      '    <button class="browser__btn" type="button" data-home aria-label="Início">⌂</button>',
      '    <input type="text" spellcheck="false" placeholder="cole um endereço (https://…)" aria-label="Endereço">',
      '    <button class="browser__go" type="submit">Ir</button>',
      '    <button class="browser__btn" type="button" data-ext aria-label="Abrir em outra aba">↗</button>',
      '  </form>',
      '  <div class="browser__stage"><iframe title="Navegador" allow="autoplay; fullscreen; gamepad; clipboard-write; encrypted-media; pointer-lock" allowfullscreen referrerpolicy="no-referrer"></iframe>',
      '  <div class="browser__note" data-note hidden><p data-note-text></p><button class="browser__go" type="button" data-note-open>Abrir em nova aba</button></div>',
      '  <div class="browser__home" data-home-view></div></div>',
      '</div>'
    ].join('');

    const input = body.querySelector('input');
    const frame = body.querySelector('iframe');
    const note = body.querySelector('[data-note]');
    const noteText = body.querySelector('[data-note-text]');
    const homeView = body.querySelector('[data-home-view]');
    let current = '';

    function go(url) {
      let clean = String(url || '').trim();
      if (!clean) return;
      if (!/^https?:\/\//i.test(clean)) clean = 'https://' + clean;
      current = clean;
      input.value = clean;
      homeView.hidden = true;
      note.hidden = true;
      frame.src = clean;
      state.playing[win.dataset.app] = true;
      if (window.LuminSocial) window.LuminSocial.setPlaying(true);
      /* se o site recusar o embed, o aviso aparece depois de 8 s */
      clearTimeout(go.timer);
      go.timer = setTimeout(function () {
        if (!homeView.hidden) return;
        note.hidden = false;
        noteText.textContent = 'Se a página continuar em branco, o site está recusando abrir dentro de outra página. Isso é decisão dele — use “Abrir em nova aba”.';
      }, 8000);
    }

    function home() {
      frame.removeAttribute('src');
      frame.src = 'about:blank';
      note.hidden = true;
      input.value = '';
      current = '';
      homeView.hidden = false;
      state.playing[win.dataset.app] = false;
      const any = Object.keys(state.playing).some(function (key) { return state.playing[key]; });
      if (!any && window.LuminSocial) window.LuminSocial.setPlaying(false);
      paintHome();
    }

    async function paintHome() {
      homeView.textContent = '';
      const head = el('div', 'home__head');
      head.innerHTML = '<h3>Comece por um endereço</h3><p>Digite acima ou escolha uma coleção.</p>';
      homeView.append(head);

      let families = [];
      try { families = await loadSites(); } catch (error) { families = []; }
      const pinned = ['lumin-sdk', 'duck-math', 'gn-math', 'astra', 'links', 'luminal-os', 'n7x'];
      const ordered = families.slice().sort(function (a, b) {
        const ia = pinned.indexOf(a.id);
        const ib = pinned.indexOf(b.id);
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      }).slice(0, 8);

      ordered.forEach(function (family) {
        const block = el('div', 'home__family');
        block.append(el('p', 'home__family-name', family.name));
        const links = el('div', 'home__links');
        family.sites.slice(0, 6).forEach(function (site) {
          const button = el('button', 'home__link', site.name);
          button.type = 'button';
          button.addEventListener('click', function () { go(site.url); });
          links.append(button);
        });
        block.append(links);
        homeView.append(block);
      });
    }

    body.querySelector('form').addEventListener('submit', function (event) {
      event.preventDefault();
      go(input.value);
    });
    body.querySelector('[data-home]').addEventListener('click', home);
    body.querySelector('[data-ext]').addEventListener('click', function () {
      if (current) window.open(current, '_blank', 'noopener');
      else toast('Abra um endereço primeiro.');
    });
    body.querySelector('[data-note-open]').addEventListener('click', function () {
      if (current) window.open(current, '_blank', 'noopener');
    });

    if (initial) go(initial);
    else home();

    win.navigate = go;
  }

  /* ---------- app: sites ---------- */
  function renderSites(body, win) {
    body.innerHTML = [
      '<div class="sites">',
      '  <div class="sites__head"><input type="search" placeholder="Buscar coleção ou endereço…" aria-label="Buscar"><span data-count></span></div>',
      '  <div class="sites__list" data-list></div>',
      '</div>'
    ].join('');

    const list = body.querySelector('[data-list]');
    const input = body.querySelector('input');
    const counter = body.querySelector('[data-count]');
    let families = [];
    let query = '';

    function paint() {
      list.textContent = '';
      const visible = families.filter(function (family) {
        if (!query) return true;
        if (family.name.toLowerCase().indexOf(query) >= 0) return true;
        return family.sites.some(function (site) { return site.url.toLowerCase().indexOf(query) >= 0; });
      });

      counter.textContent = visible.length + ' coleções · ' + visible.reduce(function (sum, f) { return sum + f.sites.length; }, 0) + ' links';

      visible.forEach(function (family) {
        const details = el('details', 'sfam');
        const summary = el('summary', 'sfam__head');
        summary.innerHTML = '<span class="sfam__name">' + esc(family.name) + '</span><span class="sfam__count">' + family.sites.length + '</span>';
        details.append(summary);

        const box = el('div', 'sfam__body');
        family.sites.forEach(function (site) {
          if (query && family.name.toLowerCase().indexOf(query) < 0 && site.url.toLowerCase().indexOf(query) < 0) return;
          const button = el('button', 'slink');
          button.type = 'button';
          button.innerHTML = '<span>' + esc(site.name) + '</span><small>' + esc(site.url.replace(/^https?:\/\//, '').replace(/\/$/, '')) + '</small>';
          button.addEventListener('click', function () { openUrl(site.url); });
          box.append(button);
        });
        details.append(box);
        list.append(details);
      });

      if (!visible.length) list.append(el('p', 'games__error', 'Nada encontrado.'));
    }

    loadSites().then(function (data) {
      families = data;
      paint();
    }, function () {
      list.append(el('p', 'games__error', 'Não foi possível abrir a lista de coleções agora.'));
    });

    input.addEventListener('input', function () {
      query = input.value.trim().toLowerCase();
      paint();
    });
  }

  function openUrl(url) {
    openApp('browser');
    const win = state.windows.browser;
    if (!win) return;
    if (typeof win.el.navigate === 'function') win.el.navigate(url);
    else renderBrowser(win.el.querySelector('[data-body]'), win.el, url);
  }

  /* ---------- app: filmes ---------- */
  /* Dois catálogos, cada um com seus espelhos. Tudo abre DENTRO do OS, no
     app Navegador — nada de mandar a pessoa para fora da área de trabalho. */
  const MOVIES = [
    {
      name: 'Cinera',
      mono: 'CI',
      hosts: [
        'cinera.zubex.net',
        'cinera.yowie.me',
        'cinera.zarins.eu',
        'cinera.xzolx.org'
      ]
    },
    {
      name: 'Triple T',
      mono: 'TT',
      hosts: [
        'triplet.zubex.net',
        'triplet.xzolx.org'
      ]
    }
  ];

  function renderMovies(body) {
    body.innerHTML = [
      '<div class="movies">',
      '  <header class="movies__head">',
      '    <h2 class="movies__title">Filmes e séries</h2>',
      '    <p class="movies__lead">Abre aqui dentro, no Navegador do OS. Se um espelho estiver fora do ar, use outro da lista.</p>',
      '  </header>',
      '  <div class="movies__list" data-list></div>',
      '  <p class="movies__foot">Espelhos mudam de endereço de tempos em tempos — a lista é só um atalho.</p>',
      '</div>'
    ].join('');

    const list = body.querySelector('[data-list]');

    MOVIES.forEach(function (movie) {
      const block = el('section', 'ffam');

      const head = el('header', 'ffam__head');
      head.innerHTML = [
        '<span class="ffam__art" aria-hidden="true">' + esc(movie.mono) + '</span>',
        '<span class="ffam__name">' + esc(movie.name) + '</span>',
        '<span class="ffam__count">' + movie.hosts.length + (movie.hosts.length === 1 ? ' endereço' : ' endereços') + '</span>'
      ].join('');
      block.append(head);

      const rows = el('div', 'ffam__rows');
      movie.hosts.forEach(function (host, index) {
        const url = 'https://' + host;
        const row = el('button', 'fmirror');
        row.type = 'button';
        row.title = 'Abrir ' + host + ' no navegador do OS';
        row.innerHTML = [
          '<span class="fmirror__dot" aria-hidden="true"></span>',
          '<span class="fmirror__name">' + esc(host) + '</span>',
          index === 0 ? '<span class="fmirror__tag">principal</span>' : '<span class="fmirror__tag fmirror__tag--alt">espelho</span>',
          '<span class="fmirror__go" aria-hidden="true">›</span>'
        ].join('');
        row.addEventListener('click', function (event) {
          /* o clique não pode devolver o foco para esta janela depois de
             abrir o Navegador */
          event.stopPropagation();
          openUrl(url);
        });
        rows.append(row);
      });
      block.append(rows);
      list.append(block);
    });
  }

  /* ---------- app: notas ---------- */
  function renderNotes(body) {
    body.innerHTML = '<div class="notes"><textarea placeholder="Suas anotações ficam salvas neste navegador…" aria-label="Notas"></textarea><p class="notes__hint">Salvo automaticamente.</p></div>';
    const area = body.querySelector('textarea');
    try { area.value = localStorage.getItem('luminsdk:v1:os:notes') || ''; } catch (error) {}
    let timer = null;
    area.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        try { localStorage.setItem('luminsdk:v1:os:notes', area.value); } catch (error) {}
      }, 400);
    });
  }

  /* ---------- app: calculadora ---------- */
  function renderCalc(body) {
    const keys = ['C', '(', ')', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '=', '='];
    body.innerHTML = [
      '<div class="calc">',
      '  <div class="calc__screen"><span data-expr></span><strong data-out>0</strong></div>',
      '  <div class="calc__keys"></div>',
      '</div>'
    ].join('');

    const expr = body.querySelector('[data-expr]');
    const out = body.querySelector('[data-out]');
    const box = body.querySelector('.calc__keys');
    let text = '';

    function paint() {
      expr.textContent = text;
      if (!text) {
        out.textContent = '0';
        return;
      }
      if (!/^[0-9+\-*/().\s]+$/.test(text)) {
        out.textContent = '—';
        return;
      }
      try {
        const value = Function('"use strict";return (' + text + ')')();
        out.textContent = Number.isFinite(value) ? String(Math.round(value * 1e10) / 1e10) : '—';
      } catch (error) {
        out.textContent = '…';
      }
    }

    keys.forEach(function (key) {
      const button = el('button', 'calc__key', key);
      button.type = 'button';
      if (key === '=') button.classList.add('calc__key--eq');
      button.addEventListener('click', function () {
        if (key === 'C') text = '';
        else if (key === '=') {
          const value = out.textContent;
          text = value === '—' || value === '…' ? '' : value;
        } else text += key;
        paint();
      });
      box.append(button);
    });

    body.addEventListener('keydown', function (event) {
      if (/^[0-9+\-*/().]$/.test(event.key)) { text += event.key; paint(); }
      else if (event.key === 'Enter') { text = out.textContent === '—' ? '' : out.textContent; paint(); }
      else if (event.key === 'Backspace') { text = text.slice(0, -1); paint(); }
    });
    body.tabIndex = 0;
    paint();
  }

  /* ---------- app: ajustes ---------- */
  function renderSettings(body) {
    const p = prefs();
    body.innerHTML = [
      '<div class="settings">',
      '  <section class="settings__block">',
      '    <h3>Papel de parede</h3>',
      '    <div class="settings__walls">',
      WALLS.map(function (wall) {
        return '<button class="wall" type="button" data-wall="' + wall + '"><span class="wall__swatch wall__swatch--' + wall + '"></span><span>' + wall.replace('-', ' ') + '</span></button>';
      }).join(''),
      '    </div>',
      '  </section>',
      '  <section class="settings__block">',
      '    <h3>Cor de destaque</h3>',
      '    <div class="settings__accents">',
      ['violeta', 'ciano', 'rosa', 'lima', 'ambar'].map(function (accent) {
        return '<button class="accent" type="button" data-accent="' + accent + '" style="--sw:' + accent + '" aria-label="' + accent + '"></button>';
      }).join(''),
      '    </div>',
      '  </section>',
      '  <section class="settings__block">',
      '    <h3>Experiência</h3>',
      '    <div class="settings__row">',
      '      <button class="settings__btn" type="button" data-go="normal">Modo normal (site)</button>',
      '      <button class="settings__btn" type="button" data-go="boot">Tela de entrada</button>',
      '    </div>',
      '    <p class="settings__hint">A escolha do modo fica nesta sessão do navegador — a URL continua a mesma.</p>',
      '  </section>',
      '</div>'
    ].join('');

    body.querySelectorAll('[data-wall]').forEach(function (button) {
      button.classList.toggle('is-on', (p.wall || 'aurora') === button.dataset.wall);
      button.addEventListener('click', function () {
        savePrefs({ wall: button.dataset.wall });
        body.querySelectorAll('[data-wall]').forEach(function (item) {
          item.classList.toggle('is-on', item === button);
        });
      });
    });

    body.querySelectorAll('[data-accent]').forEach(function (button) {
      button.classList.toggle('is-on', (p.accent || 'violeta') === button.dataset.accent);
      button.addEventListener('click', function () {
        savePrefs({ accent: button.dataset.accent });
        body.querySelectorAll('[data-accent]').forEach(function (item) {
          item.classList.toggle('is-on', item === button);
        });
      });
    });

    body.querySelectorAll('[data-go]').forEach(function (button) {
      button.addEventListener('click', function () {
        if (button.dataset.go === 'boot') enterBoot();
        else setMode('normal');
      });
    });
  }

  /* ---------- app: sobre ---------- */
  function renderAbout(body) {
    body.innerHTML = [
      '<div class="about">',
      '  <p class="about__logo">Lumin<b>OS</b></p>',
      '  <p class="about__text">A área de trabalho do LuminSDK: janelas arrastáveis, jogos do acervo público, navegador, sites, notas, calculadora e chat — tudo em uma URL só, sem build e sem cadastro.</p>',
      '  <ul class="about__list">',
      '    <li><span>Jogos</span><strong>' + (state.games ? state.games.length : '848') + ' no acervo GN-Math</strong></li>',
      '    <li><span>Sites</span><strong>' + (state.sites ? state.sites.length : '65') + ' coleções</strong></li>',
      '    <li><span>Chat</span><strong>100 mensagens, sem conta</strong></li>',
      '    <li><span>Autor</span><strong>Ryan Smith</strong></li>',
      '  </ul>',
      '  <p class="about__credit">Acervo do GN-Math e links do ByePassHub, citados no site.</p>',
      '</div>'
    ].join('');
  }

  /* ---------- catálogo de apps ---------- */
  const APPS = [
    { id: 'games', name: 'Jogos', short: 'Jogos', w: 860, h: 580, render: renderGames },
    { id: 'movies', name: 'Filmes', short: 'Filmes', w: 660, h: 436, render: renderMovies },
    { id: 'browser', name: 'Navegador', short: 'Navegador', w: 900, h: 600, render: renderBrowser },
    { id: 'sites', name: 'Sites', short: 'Sites', w: 720, h: 560, render: renderSites },
    { id: 'chat', name: 'Chat', short: 'Chat', dockOnly: true, w: 0, h: 0, render: function () {} },
    { id: 'notes', name: 'Notas', short: 'Notas', w: 560, h: 460, render: renderNotes },
    { id: 'calc', name: 'Calculadora', short: 'Calculadora', w: 330, h: 470, render: renderCalc },
    { id: 'settings', name: 'Ajustes', short: 'Ajustes', w: 620, h: 452, render: renderSettings },
    { id: 'about', name: 'Sobre', short: 'Sobre', w: 460, h: 520, render: renderAbout }
  ];

  /* ---------- modo / entrada ---------- */
  function setMode(mode) {
    try { sessionStorage.setItem('luminsdk:v1:mode', mode); } catch (error) {}
    if (window.LuminApp) window.LuminApp.go(mode === 'os' ? 'os' : 'estudo', { force: true });
  }

  function enterBoot() {
    try { sessionStorage.removeItem('luminsdk:v1:mode'); } catch (error) {}
    if (window.LuminApp) window.LuminApp.go('boot', { force: true });
  }

  /* ---------- relógio ---------- */
  function tick() {
    const node = document.getElementById('os-clock-time');
    if (!node) return;
    const now = new Date();
    node.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  }

  /* ---------- início ---------- */
  function boot() {
    if (state.booted) return;
    root = document.getElementById('os');
    if (!root) return;
    desk = document.getElementById('os-desk');
    layer = document.getElementById('os-windows');
    dock = document.getElementById('os-dock');
    crumb = document.getElementById('os-crumb');
    state.booted = true;

    applyPrefs();
    renderDock();
    renderIcons();
    updateHint();
    tick();
    setInterval(tick, 15000);

    /* dados em segundo plano para o app "Sobre" já mostrar os números */
    loadGames().catch(function () {});
    loadSites().catch(function () {});

    document.addEventListener('click', function (event) {
      const appBtn = event.target.closest('[data-app]');
      if (appBtn && root.contains(appBtn)) {
        openApp(appBtn.dataset.app);
        return;
      }
      const powerBtn = event.target.closest('#os-power');
      if (powerBtn) {
        const menu = document.getElementById('os-power-menu');
        if (menu) menu.hidden = !menu.hidden;
        return;
      }
      const modeBtn = event.target.closest('[data-os]');
      if (modeBtn) {
        const menu = document.getElementById('os-power-menu');
        if (menu) menu.hidden = true;
        const action = modeBtn.dataset.os;
        if (action === 'normal') setMode('normal');
        else if (action === 'boot') enterBoot();
        else if (action === 'reload') { try { sessionStorage.setItem('luminsdk:v1:mode', 'os'); } catch (e) {} window.location.reload(); }
      }
    });

    /* ao redimensionar, cada janela volta para dentro da área de trabalho */
    let resizeTimer = 0;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (window.matchMedia && window.matchMedia('(max-width: 760px)').matches) return;
        Object.keys(state.windows).forEach(function (key) {
          const win = state.windows[key];
          if (win.el.classList.contains('is-max')) return;
          placeWin(win.el, 0);
        });
      }, 120);
    });
  }

  window.LuminOS = {
    open: openApp,
    setMode: setMode,
    boot: boot,
    state: state
  };

  /* o app.js chama boot() quando a rota "os" abre; aqui cobrimos o caso
     de a marca já estar na sessão no primeiro carregamento */
  function ready() {
    if (document.getElementById('os')) boot();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
