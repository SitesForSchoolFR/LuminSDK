/* =========================================================
   LuminSDK — biblioteca de jogos
   Interface própria construída sobre a API headless do LuminSDK.

   Recursos:
   · busca com debounce, categorias, ordenação e jogo aleatório
   · favoritos e histórico ("continuar jogando") no localStorage
   · o endereço do site é único: busca, filtro, página e favoritos
     ficam só no estado da memória (nada de ?q=, ?cat=, ?page=)
   · player próprio em tela cheia, foco de teclado e retry
   · se a API do LuminSDK não responder, o catálogo local (GN-Math)
     assume com capa, busca, favoritos, histórico e recomendações

   Autor: Ryan Smith · Licença MIT
   ========================================================= */
(function () {
  'use strict';

  const CONFIG = {
    maxGamesPerPage: 96,     // teto de jogos por página
    containerWidth: 1240,    // precisa bater com --container do CSS
    minCols: 2,
    maxCols: 12,
    minRows: 2,
    maxRows: 8,
    cardSizes: { sm: 92, md: 122, lg: 162 },
    defaultSize: 'md',
    maxCategories: 18,
    maxFavorites: 200,
    /* Jogos que abrem em outro endereço em vez do player do LuminSDK.
       Casa pelo "id" do catálogo e, se o id mudar, pelo nome exato
       (por isso "Undertale Yellow" continua no player normal). */
    customSources: [
      {
        id: 'selenite/undertale',
        name: 'undertale',
        url: 'https://toby.booksforschool.online/index.html#z4x',
        label: 'Toby Web'
      }
    ],
    maxRecents: 10,
    bootTimeout: 18000,
    requestTimeout: 25000,
    playerTimeout: 20000,
    searchDebounce: 360,
    retryAttempts: 2,
    retryDelay: 1400,
    storageKey: 'luminsdk:v1',
    /* catálogo de emergência: se o SDK do LuminSDK não responder, os mesmos
       jogos do acervo GN-Math (que a aba GN-Math usa) entram no lugar, com
       capa, nome, busca, favoritos, histórico e recomendações. */
    localCatalog: 'assets/data/gnmath-games.json',
    localCover: 'https://cdn.jsdelivr.net/gh/freebuisness/covers@main/',
    localGame: 'https://cdn.jsdelivr.net/gh/freebuisness/html@main/'
  };

  /* Paleta usada nos placeholders dos cards (enquanto a capa carrega) */
  const PALETTE = [
    ['#4c1d95', '#0f172a'],
    ['#0e7490', '#0b1120'],
    ['#831843', '#111827'],
    ['#1e3a8a', '#0b1120'],
    ['#365314', '#0b1120'],
    ['#7c2d12', '#111827'],
    ['#312e81', '#0b1120'],
    ['#155e75', '#111827']
  ];

  /* Preferência de grade escolhida pelo usuário (null = automático) */
  const gridPrefs = (function () {
    const saved = loadStore('grid', null);
    if (saved && typeof saved === 'object') {
      const size = ['sm', 'md', 'lg'].indexOf(saved.size) >= 0 ? saved.size : null;
      return {
        cols: Number(saved.cols) || null,
        rows: Number(saved.rows) || null,
        size: size || (saved.cols ? null : CONFIG.defaultSize)
      };
    }
    return { cols: null, rows: null, size: CONFIG.defaultSize };
  })();

  const state = {
    connected: false,
    source: 'sdk',           // sdk | local
    localGames: [],
    mode: 'boot',            // boot | custom | demo | error
    loading: false,
    view: 'catalog',         // catalog | favorites | random
    page: 1,
    pages: 1,
    total: 0,
    limit: gamesPerPageForViewport(),
    query: '',
    category: '',
    sort: 'default',
    games: [],
    categories: [],
    favorites: loadStore('favorites', []),
    recents: loadStore('recents', []),
    colors: loadStore('colors', {}),
    plays: loadStore('plays', {}),
    currentUrl: '',
    deepGame: '',
    thumbs: new Map(),
    currentGame: null
  };

  const dom = {};
  let searchTimer = null;
  let imageObserver = null;
  let booted = false;
  let expectedFrameSrc = '';
  let playerTimer = null;
  let lastFocusedCard = null;

  /* ---------- armazenamento local (tolerante a falhas) ---------- */
  function loadStore(key, fallback) {
    try {
      const raw = localStorage.getItem(CONFIG.storageKey + ':' + key);
      if (!raw && raw !== '0') return fallback;
      const parsed = JSON.parse(raw);
      if (parsed === null || parsed === undefined) return fallback;
      /* o tipo guardado precisa combinar com o esperado: listas voltam como
         listas, objetos (cores, contagem de partidas, grade) como objetos */
      if (Array.isArray(fallback)) return Array.isArray(parsed) ? parsed : fallback;
      if (fallback && typeof fallback === 'object') {
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback;
      }
      if (fallback === null) {
        return parsed && typeof parsed === 'object' ? parsed : fallback;
      }
      return parsed;
    } catch (error) {
      return fallback;
    }
  }

  function saveStore(key, value) {
    try {
      localStorage.setItem(CONFIG.storageKey + ':' + key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function slimGame(game) {
    return {
      id: String(game.id),
      name: String(game.name || 'Jogo'),
      category: typeof game.category === 'string' ? game.category : '',
      image_token: game.image_token || ''
    };
  }

  /* ---------- utilidades ---------- */
  const $ = (selector, root) => (root || document).querySelector(selector);
  const nf = new Intl.NumberFormat('pt-BR');

  function el(tag, props, children) {
    const node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach((key) => {
        const value = props[key];
        if (value === undefined || value === null) return;
        if (key === 'class') node.className = value;
        else if (key === 'text') node.textContent = value;
        else if (key === 'dataset') Object.assign(node.dataset, value);
        else if (key === 'style') node.setAttribute('style', value);
        else if (key in node) node[key] = value;
        else node.setAttribute(key, value);
      });
    }
    (children || []).forEach((child) => {
      if (child === null || child === undefined) return;
      node.append(child);
    });
    return node;
  }

  function withTimeout(promise, ms, message) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(message || 'Tempo esgotado')), ms);
      Promise.resolve(promise).then(
        (value) => { clearTimeout(timer); resolve(value); },
        (error) => { clearTimeout(timer); reject(error); }
      );
    });
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function initials(name) {
    return String(name || '?')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join('');
  }

  function paletteFor(seed) {
    let hash = 0;
    const text = String(seed || '');
    for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    return PALETTE[hash % PALETTE.length];
  }

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function toast(message) {
    if (!dom.toast) return;
    dom.toast.textContent = message;
    dom.toast.hidden = false;
    requestAnimationFrame(() => dom.toast.classList.add('is-visible'));
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      dom.toast.classList.remove('is-visible');
      setTimeout(() => { dom.toast.hidden = true; }, 240);
    }, 3200);
  }

  /* Marca o trecho buscado dentro do nome, montando nós (sem innerHTML) */
  function highlightedName(name, term) {
    const fragment = document.createDocumentFragment();
    const text = String(name || '');
    const needle = String(term || '').trim();
    if (!needle) {
      fragment.append(document.createTextNode(text));
      return fragment;
    }
    const lower = text.toLowerCase();
    const target = needle.toLowerCase();
    let cursor = 0;
    let found = lower.indexOf(target);
    while (found !== -1) {
      if (found > cursor) fragment.append(document.createTextNode(text.slice(cursor, found)));
      fragment.append(el('mark', { class: 'hl', text: text.slice(found, found + target.length) }));
      cursor = found + target.length;
      found = lower.indexOf(target, cursor);
    }
    fragment.append(document.createTextNode(text.slice(cursor)));
    return fragment;
  }

  /* ---------- layout ---------- */
  /* Quantos jogos por página: replica a conta da grade (colunas x linhas),
     para que a última linha nunca fique pela metade. */
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function autoLayout() {
    const width = window.innerWidth || 1280;
    const compact = width <= 640;
    const padding = Math.min(34, Math.max(18, width * 0.04));
    const content = Math.min(CONFIG.containerWidth, width) - padding * 2;
    const minCard = compact ? 100 : 120;
    const gap = compact ? 8 : 10;
    const columns = Math.max(2, Math.floor((content + gap) / (minCard + gap)));
    const rows = width >= 1024 ? 4 : 6;
    return { columns: columns, rows: rows };
  }

  function columnsForSize(size) {
    const width = window.innerWidth || 1280;
    const compact = width <= 640;
    const padding = Math.min(34, Math.max(18, width * 0.04));
    const content = Math.min(CONFIG.containerWidth, width) - padding * 2;
    const gap = compact ? 8 : 10;
    const base = CONFIG.cardSizes[size] || CONFIG.cardSizes.md;
    /* em telas pequenas o card encolhe junto para manter 3–4 colunas confortáveis */
    const target = compact ? Math.round(base * 0.82) : base;
    return clamp(Math.floor((content + gap) / (target + gap)), CONFIG.minCols, CONFIG.maxCols);
  }

  function layoutInfo() {
    const auto = autoLayout();
    let columns = auto.columns;

    if (gridPrefs.cols) columns = clamp(gridPrefs.cols, CONFIG.minCols, CONFIG.maxCols);
    else if (gridPrefs.size) columns = columnsForSize(gridPrefs.size);

    return {
      columns: columns,
      rows: gridPrefs.rows ? clamp(gridPrefs.rows, CONFIG.minRows, CONFIG.maxRows) : auto.rows,
      auto: !gridPrefs.cols,
      size: gridPrefs.size || null,
      manual: !!gridPrefs.cols
    };
  }

  /* Quantas colunas cabem de verdade na tela (limite do CSS) */
  function effectiveColumns() {
    const layout = layoutInfo();
    const width = window.innerWidth || 1280;
    const cap = width <= 420 ? 3 : width <= 640 ? 4 : width <= 900 ? 6 : CONFIG.maxCols;
    return Math.min(layout.columns, cap);
  }

  function applyGridVars() {
    const layout = layoutInfo();
    const root = document.documentElement;
    root.style.setProperty('--grid-cols', String(layout.columns));
    root.style.setProperty('--grid-gap', window.innerWidth <= 640 ? '8px' : '10px');
  }

  function gamesPerPageForViewport() {
    const layout = layoutInfo();
    const perPage = effectiveColumns() * layout.rows;
    return clamp(perPage, 12, CONFIG.maxGamesPerPage);
  }

  /* ---------- estado na URL ---------- */
  function readStateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    state.query = (params.get('q') || '').trim();
    state.category = (params.get('cat') || '').trim();
    const page = Number(params.get('page'));
    state.page = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const sort = params.get('sort');
    state.sort = ['az', 'za', 'plays', 'recent'].indexOf(sort) >= 0 ? sort : 'default';
    state.view = params.get('favoritos') === '1' ? 'favorites' : 'catalog';
    state.deepGame = (params.get('jogo') || '').trim();
  }

  /* A URL do site é única (…/LuminSDK/) e não muda nunca: busca, filtros,
     página e jogo ficam só no estado da memória. O antigo syncUrl() mexia
     em?q= / ?cat= / ?jogo= e sujava o endereço — foi removido. */
  function syncUrl() {}

  /* ---------- cache de elementos ---------- */
  function cacheDom() {
    dom.grid = $('#games');
    dom.search = $('#game-search');
    dom.clear = $('#search-clear');
    dom.sort = $('#game-sort');
    dom.randomBtn = $('#random-btn');
    dom.chips = $('#categories');
    dom.summary = $('#results-summary');
    dom.pagination = $('#pagination');
    dom.pages = $('#pagination-pages');
    dom.prev = $('#page-prev');
    dom.next = $('#page-next');
    dom.empty = $('#empty-state');
    dom.emptyTitle = $('#empty-title');
    dom.emptyText = $('#empty-text');
    dom.emptyReset = $('#empty-reset');
    dom.error = $('#error-state');
    dom.errorText = $('#error-text');
    dom.errorRetry = $('#error-retry');
    dom.errorDemo = $('#error-demo');
    dom.reco = $('#reco');
    dom.recoRow = $('#reco-row');
    dom.recoWhy = $('#reco-why');
    dom.recoShuffle = $('#reco-shuffle');
    dom.recoClose = $('#reco-close');
    dom.randomBar = $('#random-bar');
    dom.randomReset = $('#random-reset');
    dom.toolbar = $('.toolbar');
    dom.status = $('#sdk-status');
    dom.statusText = $('#sdk-status-text');
    dom.statCategories = $('#stat-categories');
    dom.toast = $('#toast');
    dom.recents = $('#recents');
    dom.recentsTrack = $('#recents-track');
    dom.recentsClear = $('#recents-clear');
    dom.banner = $('#net-banner');
    dom.netRetry = $('#net-retry');
    dom.player = $('#player');
    dom.playerFrame = $('#player-frame');
    dom.playerTitle = $('#player-title');
    dom.playerMeta = $('#player-meta');
    dom.playerTag = $('#player-tag');
    dom.playerLoading = $('#player-loading');
    dom.playerLoadingText = $('#player-loading-text');
    dom.playerSpinner = $('#player-spinner');
    dom.playerRetry = $('#player-retry');
    dom.playerFallback = $('#player-fallback');
    dom.playerExternal = $('#player-external');
    dom.playerClose = $('#player-close');
    dom.playerFullscreen = $('#player-fullscreen');
    dom.playerRestart = $('#player-restart');
    dom.playerNext = $('#player-next');
    dom.playerColor = $('#player-color');
    dom.playerColorDot = $('#player-color-dot');
    dom.playerBar = $('.player__bar');
    dom.playerStage = $('.player__stage');
    dom.playerHint = $('#player-hint');
    dom.playerShare = $('#player-share');
    dom.playerNewTab = $('#player-newtab');


    dom.dataStats = $('#data-stats');
  }

  /* ---------- status ---------- */
  function setStatus(kind, text) {
    if (!dom.status) return;
    dom.status.dataset.state = kind;
    if (dom.statusText) dom.statusText.textContent = text;
  }

  /* ---------- esqueletos e estados ---------- */
  function renderSkeletons(count) {
    if (!dom.grid) return;
    hideState();
    dom.grid.hidden = false;
    dom.grid.setAttribute('aria-busy', 'true');
    dom.grid.replaceChildren();
    const total = Math.min(count || 12, 48);
    for (let i = 0; i < total; i++) {
      dom.grid.append(
        el('div', { class: 'game-skeleton', 'aria-hidden': 'true' }, [
          el('div', { class: 'game-skeleton__media' }),
          el('div', { class: 'game-skeleton__line' }),
          el('div', { class: 'game-skeleton__line game-skeleton__line--short' })
        ])
      );
    }
  }

  function hideState() {
    if (dom.empty) dom.empty.hidden = true;
    if (dom.error) dom.error.hidden = true;
  }

  function showError(error) {
    if (!dom.grid) return;
    state.mode = 'error';
    dom.grid.replaceChildren();
    dom.grid.hidden = true;
    dom.grid.setAttribute('aria-busy', 'false');
    dom.pagination.hidden = true;
    dom.randomBar.hidden = true;
    dom.summary.textContent = '';
    dom.empty.hidden = true;
    if (dom.errorText) {
      dom.errorText.textContent =
        (error && error.message ? error.message + ' ' : '') +
        'Verifique sua conexão, desative bloqueadores de script e tente novamente.';
    }
    dom.error.hidden = false;
    setStatus('error', 'Indisponível');
  }

  /* ---------- categorias ---------- */
  function favoriteCount() {
    return state.favorites.length;
  }

  function renderChips() {
    if (!dom.chips) return;
    dom.chips.replaceChildren();

    const allPressed = !state.category && state.view === 'catalog';
    dom.chips.append(
      el('button', {
        class: 'chip' + (allPressed ? ' is-active' : ''),
        type: 'button',
        dataset: { category: '' },
        'aria-pressed': allPressed ? 'true' : 'false',
        text: 'Todos'
      })
    );

    /* Favoritos */
    const favActive = state.view === 'favorites';
    const favChip = el('button', {
      class: 'chip chip--fav' + (favActive ? ' is-active' : ''),
      type: 'button',
      dataset: { view: 'favorites' },
      'aria-pressed': favActive ? 'true' : 'false'
    }, [
      el('span', { class: 'chip__heart', 'aria-hidden': 'true', text: '♥' }),
      el('span', { text: 'Favoritos' })
    ]);
    if (favoriteCount()) {
      favChip.append(el('span', { class: 'chip__count', text: String(favoriteCount()) }));
    }
    dom.chips.append(favChip);

    state.categories.slice(0, CONFIG.maxCategories).forEach((category) => {
      const active = state.view === 'catalog' && state.category === category;
      dom.chips.append(
        el('button', {
          class: 'chip' + (active ? ' is-active' : ''),
          type: 'button',
          dataset: { category: category },
          'aria-pressed': active ? 'true' : 'false',
          text: category
        })
      );
    });
  }

  async function loadCategories() {
    if (!hasSdk()) return;
    try {
      const result = await withTimeout(
        Lumin.getCategories(),
        CONFIG.requestTimeout,
        'Não foi possível carregar as categorias.'
      );
      const list = Array.isArray(result) ? result : result && result.categories;
      if (Array.isArray(list) && list.length) {
        state.categories = [...new Set(list.filter((c) => typeof c === 'string' && c.trim()))].sort((a, b) =>
          a.localeCompare(b, 'pt-BR')
        );
        renderChips();
        if (dom.statCategories) {
          dom.statCategories.textContent = nf.format(state.categories.length);
          dom.statCategories.removeAttribute('data-count');
        }
      }
    } catch (error) {
      /* categorias são um extra: falha aqui não quebra a biblioteca */
      console.warn('[LuminSDK] categorias indisponíveis:', error);
    }
  }

  /* ---------- recomendações pessoais ---------- */

  let recoPool = [];
  let recoCats = [];
  let recoOffset = 0;

  function dayStamp() {
    const now = new Date();
    return now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
  }

  function recoHidden() {
    const saved = loadStore('reco-hidden', []);
    return Array.isArray(saved) && saved[0] === dayStamp();
  }

  /* categorias que a pessoa mais joga: histórico local + favoritos */
  function preferredCategories() {
    const weights = new Map();
    let progress = null;
    try {
      progress = window.LuminProgress ? window.LuminProgress.stats() : null;
    } catch (error) {
      progress = null;
    }
    if (progress && progress.category) {
      Object.keys(progress.category).forEach((name) => {
        const entry = progress.category[name] || {};
        const minutes = (Number(entry.ms) || 0) / 60000;
        const sessions = Number(entry.sessions) || 0;
        weights.set(name, (weights.get(name) || 0) + minutes + sessions * 2);
      });
    }
    state.favorites.forEach((game) => {
      if (!game || !game.category) return;
      weights.set(game.category, (weights.get(game.category) || 0) + 6);
    });
    return Array.from(weights.entries())
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0])
      .slice(0, 2);
  }

  /* o módulo de progresso pode terminar de carregar depois deste script:
     espera um instante para não recomendar "no escuro" */
  function waitForProgress(timeout) {
    return new Promise((resolve) => {
      const started = Date.now();
      (function tick() {
        if (window.LuminProgress || Date.now() - started > timeout) return resolve();
        setTimeout(tick, 80);
      })();
    });
  }

  async function buildRecommendations() {
    if (!dom.reco || state.mode !== 'custom' || recoHidden()) return;
    await waitForProgress(1500);
    const cats = preferredCategories();
    const skip = new Set(state.recents.map((game) => String(game.id)));
    let pool = [];

    if (state.source === 'local') {
      /* sem API: sorteia do próprio catálogo local, evitando o que já está na tela */
      const shown = new Set(state.games.map((game) => String(game.id)));
      const list = state.localGames.filter((game) => !skip.has(String(game.id)) && !shown.has(String(game.id)));
      const bag = list.slice();
      while (pool.length < Math.min(18, bag.length)) {
        pool.push(bag.splice(Math.floor(Math.random() * bag.length), 1)[0]);
      }
      recoPool = pool;
      recoCats = [];
      recoOffset = 0;
      renderRecommendations();
      return;
    }

    try {
      if (cats.length) {
        const results = await Promise.all(
          cats.map((cat) =>
            withTimeout(Lumin.getGames({ page: 1, limit: 18, q: cat }), CONFIG.requestTimeout).catch(() => null)
          )
        );
        /* intercala as categorias para o trilho não ficar monótono */
        const lists = results.map((res) => (res && Array.isArray(res.games) ? res.games : []));
        const longest = lists.reduce((size, list) => Math.max(size, list.length), 0);
        for (let i = 0; i < longest; i++) {
          lists.forEach((list) => {
            if (list[i]) pool.push(list[i]);
          });
        }
      }
      if (pool.length < 8 && typeof Lumin.getRandomGames === 'function') {
        const extra = await withTimeout(Lumin.getRandomGames(18), CONFIG.requestTimeout).catch(() => null);
        const list = extra && Array.isArray(extra.games) ? extra.games : Array.isArray(extra) ? extra : [];
        pool = pool.concat(list);
      }
    } catch (error) {
      return;
    }

    const unique = new Map();
    pool.forEach((game) => {
      if (!game || !game.id) return;
      const id = String(game.id);
      if (skip.has(id) || unique.has(id) || isFavorite(id)) return;
      unique.set(id, game);
    });

    recoPool = Array.from(unique.values());
    recoCats = cats;
    recoOffset = 0;
    renderRecommendations();
  }

  function renderRecommendations() {
    if (!dom.reco || !dom.recoRow) return;
    if (!recoPool.length) {
      dom.reco.hidden = true;
      return;
    }
    const total = Math.min(6, recoPool.length);
    const cards = [];
    for (let i = 0; i < total; i++) {
      cards.push(createCard(recoPool[(recoOffset + i) % recoPool.length], i));
    }
    dom.recoRow.replaceChildren(...cards);
    if (dom.recoWhy) {
      dom.recoWhy.textContent = recoCats.length
        ? 'porque você joga ' + recoCats.join(' e ')
        : 'uma seleção para começar';
    }
    dom.reco.hidden = false;
  }

  function shuffleRecommendations() {
    if (recoPool.length <= 6) {
      recoOffset = (recoOffset + 1) % Math.max(1, recoPool.length);
    } else {
      recoOffset = (recoOffset + 6) % recoPool.length;
    }
    renderRecommendations();
  }

  function hideRecommendations() {
    saveStore('reco-hidden', [dayStamp()]);
    if (dom.reco) dom.reco.hidden = true;
  }

  /* ---------- carregamento de jogos ---------- */
  function activeQuery() {
    return (state.query || state.category || '').trim();
  }

  function sortGames(list) {
    const games = list.slice();

    if (state.sort === 'az') {
      games.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR'));
    } else if (state.sort === 'za') {
      games.sort((a, b) => String(b.name || '').localeCompare(String(a.name || ''), 'pt-BR'));
    } else if (state.sort === 'plays') {
      games.sort((a, b) => (state.plays[String(b.id)] || 0) - (state.plays[String(a.id)] || 0));
    } else if (state.sort === 'recent') {
      const order = new Map(state.recents.map((item, index) => [item.id, index]));
      games.sort((a, b) => {
        const ia = order.has(String(a.id)) ? order.get(String(a.id)) : Infinity;
        const ib = order.has(String(b.id)) ? order.get(String(b.id)) : Infinity;
        return ia - ib;
      });
    }
    return games;
  }

  function hasSdk() {
    return typeof window.Lumin !== 'undefined' && !!window.Lumin &&
      typeof window.Lumin.getGames === 'function';
  }

  /* ---------- catálogo local (quando o SDK não responde) ---------- */
  let localCatalog = null;

  function localPage(page) {
    const query = activeQuery().toLowerCase();
    let list = state.localGames.filter(function (game) {
      if (!query) return true;
      return (
        String(game.name || '').toLowerCase().indexOf(query) >= 0 ||
        String(game.category || '').toLowerCase().indexOf(query) >= 0
      );
    });

    list = sortGames(list);
    const per = Math.max(1, state.limit);
    const pages = Math.max(1, Math.ceil(list.length / per));
    const current = Math.min(Math.max(1, Number(page) || 1), pages);

    return {
      games: list.slice((current - 1) * per, current * per),
      total: list.length,
      page: current,
      pages: pages
    };
  }

  async function applyLocalCatalog() {
    state.source = 'local';
    state.localGames = localCatalog;
    state.connected = true;
    state.mode = 'custom';
    state.categories = [];
    setStatus('local', 'Catálogo local');
    if (dom.statCategories) dom.statCategories.textContent = '—';
    renderChips();
    if (dom.banner) {
      dom.banner.hidden = false;
      const text = dom.banner.querySelector('span');
      if (text) text.textContent = 'Servidor do LuminSDK fora do ar — mostrando o catálogo local (GN-Math).';
    }
    if (state.view === 'favorites') renderFavoritesView();
    else await loadPage(state.page || 1);
  }

  async function loadLocalCatalog() {
    if (localCatalog) {
      await applyLocalCatalog();
      return true;
    }
    try {
      const response = await fetch(CONFIG.localCatalog, { cache: 'force-cache' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      const raw = Array.isArray(data.games) ? data.games : [];

      localCatalog = raw
        .filter(function (game) {
          return game && game.n && game.f &&
            String(game.n).indexOf('[!]') !== 0 &&
            (String(game.n).match(/[A-Za-zÀ-ÿ]/g) || []).length >= 2;
        })
        .map(function (game) {
          return {
            id: 'gn-' + game.id,
            name: String(game.n),
            category: game.a ? String(game.a) : '',
            cover: game.c ? CONFIG.localCover + game.c : '',
            url: CONFIG.localGame + game.f,
            local: true
          };
        });

      if (!localCatalog.length) return false;

      toast('Catálogo local carregado: ' + localCatalog.length + ' jogos.');
      await applyLocalCatalog();
      return true;
    } catch (error) {
      console.warn('[LuminSDK] catálogo local indisponível:', error);
      return false;
    }
  }

  async function fetchGames(page) {
    if (state.source === 'local') return localPage(page);
    const query = activeQuery();
    let result = await withTimeout(
      Lumin.getGames({ page: page, limit: state.limit, q: query }),
      CONFIG.requestTimeout,
      'O catálogo demorou demais para responder.'
    );

    let games = result && Array.isArray(result.games) ? result.games : [];

    /* Se a busca não retornou nada, tentamos a busca por nome antes de
       mostrar o estado vazio. Nunca fazemos isso por categoria, para não
       exibir jogos fora do filtro escolhido. */
    if (!games.length && state.query) {
      try {
        const fallback = await withTimeout(Lumin.search(state.query), CONFIG.requestTimeout);
        const altGames = Array.isArray(fallback) ? fallback : fallback && fallback.games;
        if (Array.isArray(altGames) && altGames.length) {
          result = {
            games: altGames.slice(0, state.limit),
            total: (fallback && fallback.total) || altGames.length,
            page: 1,
            pages: 1
          };
        }
      } catch (error) {
        /* silencioso: seguimos para o estado vazio */
      }
    }

    return result || { games: [], total: 0, page: page, pages: 1 };
  }

  async function loadPage(page) {
    if (!state.connected || state.loading) return;

    if (state.view === 'favorites') {
      renderFavoritesView();
      return;
    }

    state.loading = true;
    state.view = 'catalog';
    state.mode = 'custom';
    dom.randomBar.hidden = true;
    renderSkeletons(state.limit);

    try {
      let result = null;
      let lastError = null;

      for (let attempt = 0; attempt <= CONFIG.retryAttempts; attempt++) {
        try {
          if (attempt > 0) {
            setStatus('loading', 'Reconectando…');
            await wait(CONFIG.retryDelay * attempt);
          }
          result = await fetchGames(page);
          lastError = null;
          break;
        } catch (error) {
          lastError = error;
          console.warn('[LuminSDK] tentativa ' + (attempt + 1) + ' falhou:', error);
        }
      }

      if (!result) throw lastError || new Error('O catálogo não respondeu.');

      const games = Array.isArray(result.games) ? result.games : [];
      state.games = games;
      state.page = Number(result.page) || page;
      state.pages = Math.max(
        1,
        Number(result.pages) || Math.ceil((Number(result.total) || games.length) / state.limit) || 1
      );
      state.total = Number(result.total) || games.length;

      if (!games.length) showEmpty();
      else renderGames();

      if (state.page === 1 && !state.query && !state.category && state.view === 'catalog') {
        buildRecommendations();
      }

      updateSummary();
      renderPagination();
      renderRecents();
      syncUrl();
      setStatus(state.source === 'local' ? 'local' : 'online', state.source === 'local' ? 'Catálogo local' : 'Online');
    } catch (error) {
      console.error('[LuminSDK] erro ao carregar jogos:', error);
      if (!state.games.length) showError(error);
      else toast('Não foi possível carregar mais jogos.');
    } finally {
      state.loading = false;
      ensureConnectedUi();
    }
  }

  async function loadRandom() {
    if (!state.connected || state.loading) return;
    if (state.source === 'local') {
      const pool = state.localGames.slice();
      const picks = [];
      while (picks.length < Math.min(state.limit, pool.length)) {
        picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      }
      state.loading = true;
      state.view = 'random';
      state.mode = 'custom';
      state.games = picks;
      state.total = picks.length;
      state.pages = 1;
      state.page = 1;
      try {
        if (!picks.length) showEmpty();
        else {
          renderGames();
          dom.randomBar.hidden = false;
          dom.summary.textContent = 'Seleção aleatória com ' + nf.format(picks.length) + ' jogos.';
        }
      } finally {
        state.loading = false;
        ensureConnectedUi();
      }
      return;
    }
    if (!hasSdk() || typeof Lumin.getRandomGames !== 'function') {
      return loadPage(state.page);
    }

    state.loading = true;
    state.view = 'random';
    state.mode = 'custom';
    renderSkeletons(Math.min(state.limit, 24));
    dom.randomBar.hidden = true;
    dom.pagination.hidden = true;

    try {
      const result = await withTimeout(
        Lumin.getRandomGames(state.limit),
        CONFIG.requestTimeout,
        'Não foi possível sortear jogos.'
      );
      const games = result && Array.isArray(result.games) ? result.games : Array.isArray(result) ? result : [];
      state.games = games;
      state.total = games.length;
      state.pages = 1;
      state.page = 1;

      if (!games.length) {
        showEmpty();
      } else {
        renderGames();
        dom.randomBar.hidden = false;
      }
      dom.summary.textContent = games.length
        ? 'Seleção aleatória com ' + nf.format(games.length) + ' jogos.'
        : '';
      syncUrl();
      setStatus('online', 'Online');
    } catch (error) {
      console.error('[LuminSDK] erro no sorteio:', error);
      showError(error);
    } finally {
      state.loading = false;
      ensureConnectedUi();
    }
  }

  function ensureConnectedUi() {
    if (!dom.grid) return;
    dom.grid.setAttribute('aria-busy', 'false');
  }

  function updateSummary() {
    if (!dom.summary) return;
    if (state.view === 'random') return;

    const showing = state.games.length;
    if (!showing) {
      dom.summary.textContent = '';
      return;
    }

    const parts = [];
    if (state.query) parts.push('Busca por “' + state.query + '”');
    if (state.category) parts.push('Categoria: ' + state.category);
    const scope = parts.length ? parts.join(' · ') + ' — ' : '';

    dom.summary.textContent =
      scope +
      'Mostrando ' + nf.format(showing) +
      ' de ' + nf.format(state.total) + ' jogos' +
      (state.pages > 1 ? ' · página ' + state.page + ' de ' + nf.format(state.pages) : '');
  }

  /* ---------- favoritos ---------- */
  /* ---------- cor por jogo ---------- */
  function colorOf(id) {
    return state.colors[String(id)] || '';
  }

  function setGameColor(id, hex) {
    const key = String(id || '');
    if (!key) return;

    if (hex) state.colors[key] = hex;
    else delete state.colors[key];

    const keys = Object.keys(state.colors);
    if (keys.length > 300) delete state.colors[keys[0]];
    saveStore('colors', state.colors);

    if (dom.grid) {
      dom.grid.querySelectorAll('.game-card').forEach((card) => {
        if (card.dataset.gameId !== key) return;
        if (hex) {
          card.dataset.color = hex;
          card.style.setProperty('--game-color', hex);
        } else {
          delete card.dataset.color;
          card.style.removeProperty('--game-color');
        }
      });
    }
  }

  /* ---------- jogos com endereço próprio ---------- */
  function normalizeName(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* "Undertale" · "Undertale (PC)" · "UNDERTALE [Steam]" → "undertale"
     "Undertale Yellow" e "FNF vs Undertale" continuam de fora. */
  function baseName(value) {
    return normalizeName(value)
      .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
      .replace(/\b(pc|steam|deluxe|remake|edition|edicao|jogo|game)\b/g, ' ')
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function customSource(game) {
    if (!game) return null;
    const id = String(game.id || '');
    const name = normalizeName(game.name || game.n);
    const sources = CONFIG.customSources;

    const byId = sources.find((entry) => entry.id && entry.id === id);
    if (byId) return byId;

    /* só o nome exato: "Undertale" ≠ "Undertale Yellow" */
    const exact = sources.find((entry) => entry.name && entry.name === name);
    if (exact) return exact;

    /* o mesmo jogo com sufixo entre parênteses/colchetes */
    const base = baseName(game.name || game.n);
    return sources.find((entry) => entry.name && entry.name === base) || null;
  }

  /* O catálogo pode entregar um endereço do GN-Math para o Undertale (o
     player ficava mostrando "GN-Math.github.io"). Aqui esse endereço é
     trocado pelo do Toby, que roda dentro do nosso iframe. */
  const GN_MATH_HOST = /^(https?:)?\/\/([a-z0-9-]+\.)*gn-math\.github\.io\//i;

  function tobyFor(game, url) {
    const source = customSource(game);
    if (source) return source.url;
    if (!url || !GN_MATH_HOST.test(url)) return '';
    return baseName(game && (game.name || game.n)) === 'undertale' ? CONFIG.customSources[0].url : '';
  }

  function isFavorite(id) {
    return state.favorites.some((item) => item.id === String(id));
  }

  function toggleFavorite(game) {
    if (!game || !game.id) return;
    const id = String(game.id);
    const exists = isFavorite(id);

    if (exists) {
      state.favorites = state.favorites.filter((item) => item.id !== id);
    } else {
      state.favorites = [slimGame(game)].concat(state.favorites).slice(0, CONFIG.maxFavorites);
    }

    saveStore('favorites', state.favorites);
    renderChips();
    updateFavoriteButtons(id);

    toast(
      exists
        ? 'Removido dos favoritos.'
        : 'Adicionado aos favoritos. Veja em “Favoritos”.'
    );

    if (state.view === 'favorites') renderFavoritesView();
    if (window.LuminProgress && typeof window.LuminProgress.check === 'function') {
      window.LuminProgress.check();
    }
  }

  function updateFavoriteButtons(id) {
    document.querySelectorAll('#games .game-card, #reco .game-card').forEach((card) => {
      if (card.dataset.gameId !== String(id)) return;
      const button = card.querySelector('.game-card__fav');
      if (!button) return;
      const active = isFavorite(id);
      card.classList.toggle('is-favorite', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.setAttribute(
        'aria-label',
        (active ? 'Remover ' : 'Adicionar ') + (card.dataset.gameName || 'jogo') + (active ? ' dos favoritos' : ' aos favoritos')
      );
    });
  }

  function renderFavoritesView() {
    state.view = 'favorites';
    state.random = false;
    dom.randomBar.hidden = true;
    hideState();

    const term = state.query.toLowerCase();
    const list = state.favorites.filter((game) => {
      if (!term) return true;
      return (
        String(game.name || '').toLowerCase().includes(term) ||
        String(game.category || '').toLowerCase().includes(term)
      );
    });

    state.games = list;
    state.total = list.length;
    state.pages = 1;
    state.page = 1;

    if (!list.length) {
      showEmpty();
    } else {
      renderGames({ animate: false });
    }

    dom.pagination.hidden = true;
    dom.summary.textContent = list.length
      ? 'Seus favoritos — ' + nf.format(list.length) + ' jogo' + (list.length > 1 ? 's' : '') + ' salvo' + (list.length > 1 ? 's' : '')
      : '';
    renderChips();
    syncUrl();
  }

  /* ---------- histórico ---------- */
  /* Contador de partidas — usado apenas pela ordenação "Mais jogados" */
  function recordPlay(game) {
    if (!game || !game.id) return;
    const id = String(game.id);
    state.plays[id] = (state.plays[id] || 0) + 1;
    saveStore('plays', state.plays);
  }

  function recordRecent(game) {
    if (!game || !game.id) return;
    const id = String(game.id);
    state.recents = [slimGame(game)]
      .concat(state.recents.filter((item) => item.id !== id))
      .slice(0, CONFIG.maxRecents);
    saveStore('recents', state.recents);
    renderRecents();
  }

  function renderRecents() {
    if (!dom.recents || !dom.recentsTrack) return;

    if (!state.recents.length) {
      dom.recents.hidden = true;
      dom.recentsTrack.replaceChildren();
      return;
    }

    dom.recents.hidden = false;
    dom.recentsTrack.replaceChildren();

    state.recents.forEach((game) => {
      const palette = paletteFor(game.id);
      const thumb = el('span', { class: 'recent-card__thumb', style: '--g1:' + palette[0] + ';--g2:' + palette[1] }, [
        el('span', { class: 'recent-card__mono', 'aria-hidden': 'true', text: initials(game.name) })
      ]);

      if (game.image_token && state.thumbs.get(game.id)) {
        const img = el('img', { alt: '', src: state.thumbs.get(game.id) });
        thumb.prepend(img);
      } else if (game.cover) {
        const img = el('img', { alt: '', src: game.cover });
        img.addEventListener('load', () => img.classList.add('is-loaded'));
        thumb.prepend(img);
      } else if (game.image_token && hasSdk() && typeof window.Lumin.getImageUrl === 'function') {
        window.Lumin.getImageUrl(game.image_token)
          .then((url) => {
            if (!url) return;
            if (state.thumbs.size > 400) state.thumbs.clear();
            state.thumbs.set(game.id, url);
            const img = el('img', { alt: '', src: url });
            img.addEventListener('load', () => img.classList.add('is-loaded'));
            thumb.prepend(img);
          })
          .catch(() => {});
      }

      dom.recentsTrack.append(
        el('button', {
          class: 'recent-card',
          type: 'button',
          'aria-label': 'Continuar ' + game.name,
          dataset: { gameId: game.id }
        }, [
          thumb,
          el('span', { class: 'recent-card__name', text: game.name })
        ])
      );
    });
  }

  /* ---------- renderização dos cards ---------- */
  function createCard(game, index) {
    const name = game && game.name ? String(game.name) : 'Jogo ' + (index + 1);
    const category = game && typeof game.category === 'string' ? game.category : '';
    const palette = paletteFor((game && game.id) || name);
    const id = game && game.id ? String(game.id) : '';
    const favorite = isFavorite(id);

    const img = el('img', { alt: '', loading: 'lazy', decoding: 'async' });
    img.addEventListener('load', () => img.classList.add('is-loaded'));

    const media = el('span', {
      class: 'game-card__media',
      style: '--g1:' + palette[0] + ';--g2:' + palette[1]
    }, [
      img,
      el('span', { class: 'game-card__monogram', 'aria-hidden': 'true', text: initials(name) }),
      el('span', { class: 'game-card__play', 'aria-hidden': 'true' }, [
        el('span', { class: 'game-card__play-icon', text: '▶' }),
        el('span', { text: 'Jogar' })
      ])
    ]);

    const body = el('span', { class: 'game-card__body' }, [
      el('span', { class: 'game-card__name' }, [highlightedName(name, state.query)]),
      category ? el('span', { class: 'game-card__cat', text: category }) : null
    ]);

    const hit = el('button', {
      class: 'game-card__hit',
      type: 'button',
      'aria-label': 'Jogar ' + name
    });
    hit.addEventListener('click', () => openGame(game, name));

    const fav = el('button', {
      class: 'game-card__fav',
      type: 'button',
      'aria-pressed': favorite ? 'true' : 'false',
      'aria-label': (favorite ? 'Remover ' : 'Adicionar ') + name + (favorite ? ' dos favoritos' : ' aos favoritos'),
      title: favorite ? 'Remover dos favoritos' : 'Favoritar'
    }, [
      el('span', { 'aria-hidden': 'true', text: '♥' })
    ]);
    fav.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleFavorite(game);
    });

    const gameColor = colorOf(id);
    const card = el('article', {
      class: 'game-card' + (favorite ? ' is-favorite' : ''),
      dataset: Object.assign({ gameId: id, gameName: name }, gameColor ? { color: gameColor } : {}),
      style:
        '--i:' + Math.min(index, 12) +
        (gameColor ? ';--game-color:' + gameColor + ';--g1:' + gameColor : '')
    }, [media, body, hit, fav]);

    const thumbToken = game && game.image_token;
    const thumbCover = game && game.cover;
    if (!state.mode.startsWith('demo') && (thumbToken || thumbCover) && state.mode !== 'favorites') {
      if (thumbToken) card.dataset.token = thumbToken;
      if (thumbCover) card.dataset.cover = thumbCover;
      observeThumb(card);
    }

    return card;
  }

  function observeThumb(card) {
    if (!('IntersectionObserver' in window)) {
      loadThumb(card);
      return;
    }
    if (!imageObserver) {
      imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          imageObserver.unobserve(entry.target);
          loadThumb(entry.target);
        });
      }, { rootMargin: '300px 0px' });
    }
    imageObserver.observe(card);
  }

  async function loadThumb(card) {
    const id = card.dataset.gameId;
    const token = card.dataset.token;
    const cover = card.dataset.cover;
    const img = card.querySelector('img');
    if (!img) return;
    if (!token && !cover) return;

    const cached = state.thumbs.get(id);
    if (cached) {
      img.src = cached;
      return;
    }

    /* catálogo local: a capa já é uma URL pronta */
    if (cover) {
      if (state.thumbs.size > 400) state.thumbs.clear();
      state.thumbs.set(id, cover);
      img.src = cover;
      return;
    }

    if (!hasSdk() || typeof window.Lumin.getImageUrl !== 'function') return;

    try {
      const url = await Lumin.getImageUrl(token);
      if (typeof url === 'string' && url) {
        if (state.thumbs.size > 400) state.thumbs.clear();
        state.thumbs.set(id, url);
        img.src = url;
      }
    } catch (error) {
      /* mantém o placeholder com as iniciais */
    }
  }

  /* Troca só o que mudou.
     Antes cada busca/paginação reconstruía as 28–96 células (e cada célula
     buscava de novo a própria capa). Agora os cards existentes são
     reaproveitados quando o jogo é o mesmo: menos DOM, menos requisições,
     menos "piscadas" — o visual é idêntico. */
  const cardSignature = (game) =>
    [game.id, game.name || '', game.category || '', colorOf(game.id) || '', isFavorite(game.id) ? 1 : 0].join('|');

  function renderGames(options) {
    if (!dom.grid) return;
    hideState();
    dom.grid.hidden = false;

    const games = sortGames(state.games);
    const animate = !(options && options.animate === false);
    const previous = new Map();

    for (const node of dom.grid.children) {
      if (node.dataset && node.dataset.signature) previous.set(node.dataset.signature, node);
    }

    /* o container fica oculto enquanto a lista é montada: um único reflow */
    dom.grid.hidden = true;

    const fragment = document.createDocumentFragment();
    const used = [];

    games.forEach((game, index) => {
      const signature = cardSignature(game);
      const reused = previous.get(signature);

      if (reused) {
        previous.delete(signature);
        /* só a posição na animação de entrada muda */
        reused.style.setProperty('--i', String(animate ? Math.min(index, 12) : 0));
        used.push(reused);
        return;
      }

      const card = createCard(game, index);
      card.dataset.signature = signature;
      if (!animate) card.style.setProperty('--i', '0');
      used.push(card);
    });

    /* um card reaproveitado pode ter saído de outro lugar da lista */
    used.forEach((card) => fragment.append(card));

    dom.grid.replaceChildren(fragment);
    dom.grid.hidden = false;

    dom.grid.classList.remove('is-entering');
    if (animate) {
      void dom.grid.offsetWidth;
      dom.grid.classList.add('is-entering');
    }
    dom.grid.setAttribute('aria-busy', 'false');
  }

  function showEmpty() {
    if (!dom.empty) return;
    dom.grid.replaceChildren();
    dom.grid.hidden = true;
    dom.grid.setAttribute('aria-busy', 'false');
    dom.pagination.hidden = true;
    dom.randomBar.hidden = true;

    if (state.view === 'favorites') {
      dom.emptyTitle.textContent = state.query
        ? 'Nenhum favorito com “' + state.query + '”'
        : 'Você ainda não tem favoritos';
      dom.emptyText.textContent = state.query
        ? 'Tente outra palavra ou volte para todos os favoritos.'
        : 'Toque no coração de qualquer jogo para guardá-lo aqui e encontrá-lo depois.';
      dom.emptyReset.textContent = 'Ver todos os jogos';
    } else {
      const term = state.query || state.category;
      dom.emptyTitle.textContent = term ? 'Nada encontrado para “' + term + '”' : 'Nenhum jogo encontrado';
      dom.emptyText.textContent = term
        ? 'Tente outra palavra, verifique a escrita ou explore todas as categorias.'
        : 'O catálogo não retornou jogos agora. Tente novamente em instantes.';
      dom.emptyReset.textContent = 'Limpar filtros';
    }

    dom.empty.hidden = false;
    if (state.view !== 'favorites') dom.summary.textContent = '';
  }

  /* ---------- paginação ---------- */
  function renderPagination() {
    if (!dom.pagination) return;

    if (state.view !== 'catalog' || state.pages <= 1) {
      dom.pagination.hidden = true;
      return;
    }

    dom.pagination.hidden = false;
    dom.prev.disabled = state.page <= 1;
    dom.next.disabled = state.page >= state.pages;
    dom.pages.replaceChildren();

    pageWindow(state.page, state.pages).forEach((value) => {
      if (value === '…') {
        dom.pages.append(el('span', { class: 'page-ellipsis', text: '…' }));
        return;
      }
      const button = el('button', {
        class: 'page-btn',
        type: 'button',
        text: String(value),
        'aria-label': 'Página ' + value,
        'aria-current': value === state.page ? 'page' : null
      });
      button.addEventListener('click', () => goToPage(value));
      dom.pages.append(button);
    });
  }

  function pageWindow(current, total) {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages = new Set([1, total, current, current - 1, current + 1]);
    if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
    if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => pages.add(p));

    const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
    const output = [];
    sorted.forEach((page, index) => {
      if (index > 0 && page - sorted[index - 1] > 1) output.push('…');
      output.push(page);
    });
    return output;
  }

  function goToPage(page) {
    if (state.loading) return;
    if (page < 1 || page > state.pages || page === state.page) return;
    const isUserAction = !!lastFocusedCard;

    loadPage(page).then(() => {
      const library = document.getElementById('biblioteca');
      if (library) {
        const top = library.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
      if (isUserAction) focusFirstCard();
    });
  }

  function focusFirstCard() {
    if (!dom.grid) return;
    const hit = dom.grid.querySelector('.game-card__hit');
    if (hit) hit.focus({ preventScroll: true });
  }

  /* ---------- player ---------- */
  function setPlayerLoading(isLoading, message) {
    if (dom.playerLoading) dom.playerLoading.hidden = !isLoading;
    if (dom.playerLoadingText && message) dom.playerLoadingText.textContent = message;
    if (dom.playerSpinner) dom.playerSpinner.hidden = false;
    if (dom.playerFallback) dom.playerFallback.hidden = true;
    if (dom.playerExternal) dom.playerExternal.hidden = !(state.currentUrl);
  }

  function setPlayerError(message) {
    if (dom.playerLoading) dom.playerLoading.hidden = false;
    if (dom.playerSpinner) dom.playerSpinner.hidden = true;
    if (dom.playerLoadingText) dom.playerLoadingText.textContent = message;
    if (dom.playerFallback) dom.playerFallback.hidden = false;
    if (dom.playerRetry) dom.playerRetry.hidden = false;
    /* sem URL resolvida não há o que abrir em outra aba */
    if (dom.playerExternal) dom.playerExternal.hidden = !state.currentUrl;
  }

  /* O jogo roda num iframe: para WASD/setas/Enter funcionarem, o foco do
     teclado precisa estar DENTRO dele. Sem isso, as teclas vão para a página.
     O player NÃO usa <dialog> modal: em vários navegadores (Firefox, Safari e
     alguns Chromium) o iframe dentro de um diálogo modal recebe clique do
     mouse mas nunca ganha foco de teclado. Um overlay normal evita isso. */
  function setHint(visible, message) {
    if (!dom.playerHint) return;
    if (message) dom.playerHint.textContent = message;
    dom.playerHint.hidden = !visible;
  }

  function playerIsOpen() {
    return !!(dom.player && dom.player.hasAttribute('open'));
  }

  function toolbarHasFocus() {
    const active = document.activeElement;
    if (!active || active === document.body || active === document.documentElement) return false;
    if (active === dom.playerFrame) return false;
    return !!(dom.playerBar && dom.playerBar.contains(active));
  }

  function focusGameFrame() {
    if (!dom.playerFrame) return false;
    try {
      dom.playerFrame.focus({ preventScroll: true });
    } catch (error) {
      try { dom.playerFrame.focus(); } catch (error2) { /* ignora */ }
    }
    /* frames cross-origin também precisam deste segundo empurrão:
       sem ele o foco fica só no elemento <iframe> e as teclas não entram. */
    try {
      if (dom.playerFrame.contentWindow) dom.playerFrame.contentWindow.focus();
    } catch (error) {
      /* cross-origin: focar o elemento já resolve */
    }
    return document.activeElement === dom.playerFrame;
  }

  function ensureGameFocus(options) {
    if (!playerIsOpen() || !dom.playerFrame) return false;
    /* não rouba o foco enquanto o usuário mexe nos botões/cor do player —
       a menos que a ação tenha acabado de abrir/reiniciar o jogo (force). */
    if (toolbarHasFocus() && !(options && options.force)) return false;
    const ok = focusGameFrame();
    const forceHint = !!(options && options.hint);
    setHint(!ok && (forceHint || document.activeElement !== dom.playerFrame));
    return ok;
  }

  /* Alguns navegadores só entregam o foco do iframe depois que o documento
     interno termina de montar. Tentamos algumas vezes, sem pressa. */
  let focusTimers = [];
  function scheduleGameFocus() {
    clearFocusTimers();
    [0, 120, 350, 800, 1600, 2800].forEach((delay) => {
      focusTimers.push(setTimeout(() => ensureGameFocus({ force: true }), delay));
    });
  }

  function clearFocusTimers() {
    focusTimers.forEach((timer) => clearTimeout(timer));
    focusTimers = [];
  }

  /* Enquanto o player está aberto, o resto da página fica inerte: o Tab não
     escapa para links escondidos atrás do overlay e leitores de tela não leem
     o catálogo por baixo do jogo. (O iframe do jogo não é afetado.) */
  function setBackgroundInert(on) {
    Array.from(document.body.children).forEach((node) => {
      if (node === dom.player || node === dom.toast) return;
      if (on) node.setAttribute('inert', '');
      else node.removeAttribute('inert');
    });
  }

  function openPlayerDialog() {
    if (!dom.player) return;
    lastFocusedCard = document.activeElement;
    dom.player.removeAttribute('hidden');
    dom.player.setAttribute('open', '');
    document.documentElement.classList.add('is-playing');
    document.body.classList.add('is-playing');
    setBackgroundInert(true);
    setHint(false);
    scheduleGameFocus();
  }

  function closePlayerDialog() {
    if (!dom.player) return;
    clearFocusTimers();
    dom.player.removeAttribute('open');
    dom.player.setAttribute('hidden', '');
    document.documentElement.classList.remove('is-playing');
    document.body.classList.remove('is-playing');
    setBackgroundInert(false);
    setHint(false);
    /* devolve o foco para o card que abriu o jogo */
    if (lastFocusedCard && typeof lastFocusedCard.focus === 'function') {
      try { lastFocusedCard.focus({ preventScroll: true }); } catch (error) { /* ignora */ }
    }
  }

  function setPlayerSource(source) {
    if (!dom.playerTag) return;
    if (!source) {
      dom.playerTag.hidden = true;
      dom.playerTag.textContent = '';
      dom.playerTag.removeAttribute('title');
      return;
    }
    dom.playerTag.textContent = source.label || 'externo';
    let host = '';
    try {
      host = new URL(source.url).hostname;
    } catch (error) {
      host = '';
    }
    dom.playerTag.title = host
      ? 'Este jogo abre no site ' + host + ' — se a tela ficar em branco, use “Abrir em outra aba”.'
      : 'Este jogo abre em outro site.';
    dom.playerTag.hidden = false;
  }

  function startPlayerTimer() {
    clearTimeout(playerTimer);
    playerTimer = setTimeout(() => {
      setPlayerError(
        'O jogo não respondeu. Isso costuma ser bloqueio do site do jogo ou conexão lenta — ' +
        'use “Abrir em nova aba” ou tente de novo.'
      );
    }, CONFIG.playerTimeout);
  }

  /* último recurso: abre o endereço do jogo fora da página, sem referrer */
  function openGameInNewTab() {
    if (!state.currentUrl) return;
    const win = window.open('about:blank', '_blank');
    if (!win) {
      window.open(state.currentUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    try { win.opener = null; } catch (error) {}
    setTimeout(function () {
      try { win.location.replace(state.currentUrl); } catch (error) {
        try { win.location.href = state.currentUrl; } catch (error2) {}
      }
    }, 60);
  }

  async function startGameInFrame(game, name) {
    clearTimeout(playerTimer);
    expectedFrameSrc = '';
    setPlayerLoading(true, 'Carregando jogo…');
    if (dom.playerFrame) dom.playerFrame.src = 'about:blank';
    if (dom.playerTitle) dom.playerTitle.textContent = name;
    if (dom.playerColor) dom.playerColor.value = colorOf(game.id) || '#8b5cf6';
    if (dom.playerColorDot) {
      dom.playerColorDot.style.setProperty('--game-color', colorOf(game.id) || 'var(--accent)');
    }
    if (dom.playerMeta) {
      const category = game && typeof game.category === 'string' ? game.category : '';
      dom.playerMeta.textContent = category;
      dom.playerMeta.hidden = !category;
    }
    setPlayerSource(null);

    const custom = customSource(game);
    const own = game && game.url ? { label: 'GN-Math', url: game.url } : null;
    let url = custom ? custom.url : own ? own.url : '';

    if (!url) {
      if (!hasSdk() || typeof window.Lumin.getGameUrl !== 'function') {
        throw new Error('URL do jogo indisponível.');
      }
      const result = await withTimeout(
        window.Lumin.getGameUrl(game.id),
        CONFIG.requestTimeout,
        'O jogo demorou demais para carregar.'
      );
      url = typeof result === 'string' ? result : result && result.url;
    }
    if (!url) throw new Error('URL do jogo indisponível.');

    /* Undertale nunca abre pelo GN-Math: vai para o Toby, no nosso player */
    const toby = tobyFor(game, url);
    if (toby) url = toby;

    state.currentUrl = url;
    setPlayerSource(custom || (toby ? { label: 'Toby Web', url: toby } : own));
    expectedFrameSrc = url;
    if (dom.playerFrame) dom.playerFrame.src = url;
    state.currentGame = game;
    startPlayerTimer();
    if (window.LuminProgress) window.LuminProgress.start(game);
  }

  async function openGame(game, name) {
    if (!game || !game.id) {
      toast('Este jogo não tem identificador válido.');
      return;
    }

    if (state.mode === 'demo') {
      toast('Modo demonstração: os jogos reais aparecem quando o catálogo carregar.');
      return;
    }

    recordRecent(game);
    recordPlay(game);

    const ownPlayer =
      dom.player &&
      (game.url || customSource(game) || (hasSdk() && typeof window.Lumin.getGameUrl === 'function'));

    if (!ownPlayer) {
      if (!hasSdk() || typeof window.Lumin.loadGame !== 'function') {
        toast('Não foi possível abrir este jogo agora.');
        return;
      }
      try {
        await window.Lumin.loadGame(game.id);
      } catch (error) {
        toast('Não foi possível abrir este jogo agora.');
      }
      return;
    }

    openPlayerDialog();
    /* enquanto o jogo roda, o contador de pessoas e o chat somem */
    if (window.LuminSocial) window.LuminSocial.setPlaying(true);

    try {
      await startGameInFrame(game, name);
    } catch (error) {
      console.warn('[LuminSDK] player próprio falhou:', error);
      closePlayerDialog();
      if (!hasSdk() || typeof window.Lumin.loadGame !== 'function') {
        toast('Não foi possível abrir este jogo agora.');
        return;
      }
      try {
        await window.Lumin.loadGame(game.id);
      } catch (sdkError) {
        toast('Não foi possível abrir este jogo agora.');
      }
    }
  }

  function closeGame() {
    if (window.LuminProgress) window.LuminProgress.stop();
    if (window.LuminSocial) window.LuminSocial.setPlaying(false);
    closePlayerDialog();
    clearTimeout(playerTimer);
    expectedFrameSrc = '';
    if (dom.playerFrame) dom.playerFrame.src = 'about:blank';
    setPlayerLoading(true, 'Carregando jogo…');
    state.currentGame = null;
    state.currentUrl = '';
  }

  async function restartGame() {
    if (!state.currentGame) return;
    try {
      await startGameInFrame(state.currentGame, dom.playerTitle.textContent);
    } catch (error) {
      setPlayerError('Não foi possível reiniciar este jogo.');
    }
  }

  async function playAnother() {
    let next = null;

    const pool = (state.games || []).filter(
      (game) => game && game.id && (!state.currentGame || game.id !== state.currentGame.id)
    );

    if (pool.length) {
      next = pool[Math.floor(Math.random() * pool.length)];
    } else if (hasSdk() && typeof window.Lumin.getRandomGames === 'function') {
      try {
        const result = await withTimeout(window.Lumin.getRandomGames(1), CONFIG.requestTimeout);
        const games = result && Array.isArray(result.games) ? result.games : Array.isArray(result) ? result : [];
        next = games[0];
      } catch (error) {
        /* sem próximo jogo */
      }
    }

    if (!next) {
      toast('Nenhum outro jogo disponível agora.');
      return;
    }

    recordRecent(next);
    try {
      await startGameInFrame(next, next.name);
    } catch (error) {
      setPlayerError('Não foi possível carregar outro jogo.');
    }
  }

  function toggleFullscreen() {
    const target = dom.playerFrame;
    if (!target) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (target.requestFullscreen) {
      target.requestFullscreen().catch(() => toast('Tela cheia indisponível neste navegador.'));
    } else {
      toast('Tela cheia indisponível neste navegador.');
    }
    /* em tela cheia o foco do teclado costuma ficar no botão: devolve ao jogo */
    setTimeout(() => ensureGameFocus({ force: true }), 120);
  }

  /* Alguns jogos (os que rodam dentro de outro iframe e bloqueiam o foco no
     clique) só aceitam teclado quando abertos como página principal. */
  function openGameInNewTab() {
    const game = state.currentGame;
    if (!game || !game.id) {
      toast('Nenhum jogo aberto.');
      return;
    }

    const win = window.open('', '_blank');
    if (!win) {
      toast('Permita pop-ups para abrir o jogo em outra aba.');
      return;
    }
    try { win.opener = null; } catch (error) { /* ignora */ }

    const reuse = expectedFrameSrc && expectedFrameSrc !== 'about:blank' ? expectedFrameSrc : '';

    const useUrl = (url) => {
      if (url) {
        win.location.replace(url);
        return;
      }
      if (reuse) {
        win.location.replace(reuse);
        return;
      }
      try { win.close(); } catch (error) { /* ignora */ }
      toast('Não foi possível abrir o jogo em outra aba.');
    };

    if (game && game.url) {
      useUrl(game.url);
      return;
    }

    if (!hasSdk() || typeof window.Lumin.getGameUrl !== 'function') {
      useUrl('');
      return;
    }

    /* pede uma URL nova: as URLs do SDK podem ser de uso único */
    withTimeout(window.Lumin.getGameUrl(game.id), CONFIG.requestTimeout, 'Tempo esgotado')
      .then((result) => useUrl(typeof result === 'string' ? result : result && result.url))
      .catch(() => useUrl(''));
  }

  async function shareGame(game) {
    if (!game || !game.id) return;
    const url = gameLink(game.id);

    if (navigator.share && /mobile/i.test(navigator.userAgent)) {
      try {
        await navigator.share({ title: game.name || 'Jogo no LuminSDK', text: 'Jogue ' + (game.name || 'este jogo') + ' no LuminSDK', url: url });
        recordRecent(game);
        return;
      } catch (error) {
        /* usuário cancelou — segue para o clipboard */
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast('Link do jogo copiado.');
    } catch (error) {
      toast(url);
    }
  }

  /* ---------- backup dos dados ---------- */
  function updateDataStats() {
    if (!dom.dataStats) return;
    dom.dataStats.textContent =
      state.favorites.length + ' favorito' + (state.favorites.length === 1 ? '' : 's') +
      ' · ' + state.recents.length + ' no histórico' +
      ' · ' + Object.keys(state.colors).length + ' cor' + (Object.keys(state.colors).length === 1 ? '' : 'es') + ' por jogo';
  }

  function exportData() {
    const payload = {
      app: 'LuminSDK',
      version: 1,
      exportedAt: new Date().toISOString(),
      favorites: state.favorites,
      recents: state.recents,
      colors: state.colors,
      grid: { cols: gridPrefs.cols, rows: gridPrefs.rows, size: gridPrefs.size },
      theme: document.documentElement.getAttribute('data-theme'),
      accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = el('a', { href: url, download: 'luminsdk-backup-' + new Date().toISOString().slice(0, 10) + '.json' });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Backup exportado.');
  }

  async function importData(file) {
    if (!file) return false;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data || typeof data !== 'object') throw new Error('Arquivo inválido');

      if (Array.isArray(data.favorites)) {
        state.favorites = data.favorites.filter((item) => item && item.id).slice(0, CONFIG.maxFavorites);
        saveStore('favorites', state.favorites);
      }
      if (Array.isArray(data.recents)) {
        state.recents = data.recents.filter((item) => item && item.id).slice(0, CONFIG.maxRecents);
        saveStore('recents', state.recents);
      }
      if (data.colors && typeof data.colors === 'object') {
        state.colors = data.colors;
        saveStore('colors', state.colors);
      }
      if (data.grid && typeof data.grid === 'object') {
        gridPrefs.cols = data.grid.cols || null;
        gridPrefs.rows = data.grid.rows || null;
        gridPrefs.size = ['sm', 'md', 'lg'].indexOf(data.grid.size) >= 0 ? data.grid.size : CONFIG.defaultSize;
        saveStore('grid', data.grid);
        applyGridVars();
        state.limit = gamesPerPageForViewport();
        emitGrid();
      }

      renderChips();
      renderRecents();
      updateDataStats();
      if (state.games.length) renderGames({ animate: false });
      if (state.view === 'favorites') renderFavoritesView();
      toast('Backup importado.');
      return true;
    } catch (error) {
      console.error('[LuminSDK] falha ao importar:', error);
      toast('Não foi possível ler esse arquivo de backup.');
      return false;
    }
  }

  function clearData() {
    state.favorites = [];
    state.recents = [];
    state.colors = {};
    state.plays = {};

    ['favorites', 'recents', 'colors', 'plays', 'grid'].forEach((key) => {
      try {
        localStorage.removeItem(CONFIG.storageKey + ':' + key);
      } catch (error) {
        /* ignora */
      }
    });

    gridPrefs.cols = null;
    gridPrefs.rows = null;
    gridPrefs.size = CONFIG.defaultSize;

    applyGridVars();
    state.limit = gamesPerPageForViewport();
    renderChips();
    renderRecents();
    updateDataStats();
    emitGrid();
    if (state.view === 'favorites') renderFavoritesView();
    else if (state.connected) loadPage(1);
  }

  /* ---------- abrir jogo por id (usado pela API interna) ---------- */
  async function openGameById(id) {
    if (!id) return;
    const key = String(id);
    const known =
      state.recents.find((item) => item.id === key) ||
      state.favorites.find((item) => item.id === key) ||
      state.games.find((item) => String(item.id) === key);

    if (known && known.name) {
      openGame(known, known.name);
      return;
    }

    if (!hasSdk()) {
      openGame({ id: key, name: key }, 'Jogo compartilhado');
      return;
    }

    try {
      const result = await withTimeout(window.Lumin.getGames({ page: 1, limit: 50, q: key }), CONFIG.requestTimeout);
      const games = (result && result.games) || [];
      const match = games.find((item) => String(item.id) === key) || null;
      openGame(match || { id: key, name: key }, (match && match.name) || 'Jogo compartilhado');
    } catch (error) {
      toast('Não foi possível abrir o jogo compartilhado.');
    }
  }

  /* ---------- rede ---------- */
  function watchNetwork() {
    const update = () => {
      const offline = navigator.onLine === false;
      if (dom.banner) dom.banner.hidden = !offline;
      if (dom.status && offline) setStatus('error', 'Offline');
    };
    window.addEventListener('online', () => {
      update();
      toast('Conexão restabelecida.');
      if (state.connected && !state.games.length) loadPage(1);
    });
    window.addEventListener('offline', update);
    if (dom.netRetry) {
      dom.netRetry.addEventListener('click', () => {
        if (navigator.onLine === false) {
          toast('Ainda sem conexão. Verifique sua rede.');
          return;
        }
        /* no catálogo local, "Tentar agora" volta a procurar o SDK */
        if (state.source === 'local') {
          reconnect();
          return;
        }
        if (state.mode === 'error') window.location.reload();
        else loadPage(state.page);
      });
    }
    update();
  }

  /* Se o SDK não responde, NADA da nossa interface é escondido: o catálogo
     local (GN-Math) assume a lista, a busca, os favoritos e as recomendações.
     Antes, a interface padrão do SDK era montada e escondia busca, chips,
     histórico e recomendações — era isso que deixava a aba "vazia". */
  async function reconnect() {
    if (!hasSdk()) {
      toast('O servidor do LuminSDK ainda não respondeu.');
      return;
    }
    toast('Tentando o servidor do LuminSDK…');
    await connect();
  }

  async function handleFatal(error) {
    console.error('[LuminSDK] falha ao inicializar:', error);
    const ok = await loadLocalCatalog();
    if (!ok) showError(error);
  }

  /* ---------- modo demonstração ---------- */
  const DEMO_GAMES = [
    { id: 'demo-1', name: 'Neon Drift', category: 'Corrida' },
    { id: 'demo-2', name: 'Pixel Quest', category: 'Aventura' },
    { id: 'demo-3', name: 'Space Invaders', category: 'Arcade' },
    { id: 'demo-4', name: 'Block Puzzle', category: 'Puzzle' },
    { id: 'demo-5', name: 'Snake Classic', category: 'Clássicos' },
    { id: 'demo-6', name: 'Sky Hopper', category: 'Plataforma' },
    { id: 'demo-7', name: 'Bubble Pop', category: 'Casual' },
    { id: 'demo-8', name: 'Tower Defense', category: 'Estratégia' },
    { id: 'demo-9', name: 'Basket Duel', category: 'Esporte' },
    { id: 'demo-10', name: 'Zombie Run', category: 'Ação' },
    { id: 'demo-11', name: 'Card Master', category: 'Cartas' },
    { id: 'demo-12', name: 'Mine Sweeper', category: 'Lógica' }
  ];

  function renderDemo() {
    state.mode = 'demo';
    state.view = 'catalog';
    state.games = DEMO_GAMES;
    state.total = DEMO_GAMES.length;
    state.pages = 1;
    showDemoGrid();
    setStatus('fallback', 'Demonstração');
    dom.summary.textContent = 'Demonstração visual — conecte-se à internet para liberar os 1.100+ jogos reais.';
    dom.pagination.hidden = true;
    dom.randomBar.hidden = true;
  }

  function showDemoGrid() {
    if (!dom.grid) return;
    hideState();
    dom.grid.hidden = false;
    dom.grid.replaceChildren();
    const fragment = document.createDocumentFragment();
    DEMO_GAMES.forEach((game, index) => fragment.append(createCard(game, index)));
    dom.grid.append(fragment);
    dom.grid.setAttribute('aria-busy', 'false');
  }

  /* ---------- eventos ---------- */
  function applySearch(value, immediate) {
    const term = String(value || '').trim();
    state.query = term;
    clearTimeout(searchTimer);

    const run = () => {
      if (state.mode === 'demo') {
        showDemoGrid();
        return;
      }
      if (state.view === 'favorites') {
        renderFavoritesView();
        return;
      }
      state.category = '';
      renderChips();
      loadPage(1);
    };

    if (immediate) run();
    else searchTimer = setTimeout(run, CONFIG.searchDebounce);
  }

  function bindEvents() {
    if (dom.search) {
      dom.search.addEventListener('input', () => {
        const value = dom.search.value;
        if (dom.clear) dom.clear.hidden = !value;
        applySearch(value, false);
      });

      dom.search.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          applySearch(dom.search.value, true);
        }
        if (event.key === 'Escape' && dom.search.value) {
          dom.search.value = '';
          dom.clear.hidden = true;
          applySearch('', true);
        }
      });
    }

    if (dom.clear) {
      dom.clear.addEventListener('click', () => {
        dom.search.value = '';
        dom.clear.hidden = true;
        dom.search.focus();
        applySearch('', true);
      });
    }

    if (dom.sort) {
      dom.sort.addEventListener('change', () => {
        state.sort = dom.sort.value;
        if (state.mode === 'demo') showDemoGrid();
        else if (state.games.length) {
          renderGames({ animate: false });
          syncUrl();
        }
      });
    }

    if (dom.recoShuffle) dom.recoShuffle.addEventListener('click', shuffleRecommendations);
    if (dom.recoClose) dom.recoClose.addEventListener('click', hideRecommendations);

    if (dom.chips) {
      dom.chips.addEventListener('click', (event) => {
        const chip = event.target.closest('.chip');
        if (!chip) return;

        if (chip.dataset.view === 'favorites') {
          state.category = '';
          state.query = '';
          if (dom.search) dom.search.value = '';
          if (dom.clear) dom.clear.hidden = true;
          renderFavoritesView();
          return;
        }

        state.view = 'catalog';
        state.category = chip.dataset.category || '';
        state.query = '';
        if (dom.search) dom.search.value = '';
        if (dom.clear) dom.clear.hidden = true;
        renderChips();

        if (state.mode === 'demo') {
          toast('Modo demonstração: filtros completos só com o catálogo conectado.');
          return;
        }
        loadPage(1);
      });
    }

    if (dom.randomBtn) {
      dom.randomBtn.addEventListener('click', () => {
        if (state.mode === 'demo') {
          toast('Modo demonstração: os jogos reais aparecem quando o catálogo carregar.');
          return;
        }
        loadRandom();
      });
    }

    if (dom.randomReset) {
      dom.randomReset.addEventListener('click', () => {
        dom.randomBar.hidden = true;
        loadPage(1);
      });
    }

    if (dom.prev) dom.prev.addEventListener('click', () => goToPage(state.page - 1));
    if (dom.next) dom.next.addEventListener('click', () => goToPage(state.page + 1));

    if (dom.emptyReset) {
      dom.emptyReset.addEventListener('click', () => {
        state.query = '';
        state.category = '';
        if (dom.search) dom.search.value = '';
        if (dom.clear) dom.clear.hidden = true;

        if (state.view === 'favorites') {
          state.view = 'catalog';
          renderChips();
          loadPage(1);
          return;
        }

        renderChips();
        loadPage(1);
      });
    }

    if (dom.errorRetry) dom.errorRetry.addEventListener('click', () => window.location.reload());
    if (dom.errorDemo) dom.errorDemo.addEventListener('click', renderDemo);

    if (dom.playerClose) dom.playerClose.addEventListener('click', closeGame);
    if (dom.playerRestart) dom.playerRestart.addEventListener('click', restartGame);
    if (dom.playerFullscreen) dom.playerFullscreen.addEventListener('click', toggleFullscreen);
    if (dom.playerNext) dom.playerNext.addEventListener('click', playAnother);
    if (dom.playerExternal) {
      dom.playerExternal.addEventListener('click', openGameInNewTab);
    }

    if (dom.playerRetry) {
      dom.playerRetry.addEventListener('click', () => {
        if (state.currentGame) startGameInFrame(state.currentGame, dom.playerTitle.textContent).catch(() => {
          setPlayerError('Não foi possível carregar o jogo. Tente novamente.');
        });
      });
    }

    if (dom.player) {
      dom.player.addEventListener('click', (event) => {
        if (event.target === dom.player) closeGame();
      });
    }

    if (dom.playerFrame) {
      dom.playerFrame.addEventListener('load', () => {
        if (dom.playerFrame.getAttribute('src') === 'about:blank') return;
        clearTimeout(playerTimer);
        setPlayerLoading(false);
        scheduleGameFocus();
      });
    }

    if (dom.playerStage) {
      dom.playerStage.addEventListener('pointerdown', (event) => {
        if (event.target === dom.playerFrame) return;
        ensureGameFocus();
      });
    }

    if (dom.playerHint) {
      dom.playerHint.addEventListener('click', () => ensureGameFocus({ hint: true }));
    }

    /* Recupera o foco do jogo quando a janela/aba volta a ficar ativa ou
       quando a tela cheia muda — situações em que o iframe perde o teclado. */
    window.addEventListener('focus', () => ensureGameFocus());
    /* quando a janela "perde" o foco com o player aberto, é porque o teclado
       entrou no iframe do jogo: a dica já cumpriu o papel dela. */
    window.addEventListener('blur', () => {
      if (playerIsOpen()) setHint(false);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') ensureGameFocus();
    });
    document.addEventListener('fullscreenchange', () => {
      setTimeout(() => ensureGameFocus(), 60);
    });

    if (dom.playerColor) {
      dom.playerColor.addEventListener('input', () => {
        const id = state.currentGame && state.currentGame.id;
        if (!id) return;
        setGameColor(id, dom.playerColor.value);
        if (dom.playerColorDot) dom.playerColorDot.style.setProperty('--game-color', dom.playerColor.value);
        if (state.view === 'favorites') renderFavoritesView();
      });
      dom.playerColor.addEventListener('change', () => {
        if (state.currentGame) toast('Cor deste jogo salva.');
      });
    }

    if (dom.playerShare) dom.playerShare.addEventListener('click', () => shareGame(state.currentGame));
    if (dom.playerNewTab) dom.playerNewTab.addEventListener('click', openGameInNewTab);

    if (dom.recentsClear) {
      dom.recentsClear.addEventListener('click', () => {
        state.recents = [];
        saveStore('recents', state.recents);
        renderRecents();
        toast('Histórico limpo.');
      });
    }

    if (dom.recentsTrack) {
      dom.recentsTrack.addEventListener('click', (event) => {
        const button = event.target.closest('.recent-card');
        if (!button) return;
        const id = button.dataset.gameId;
        const game = state.recents.find((item) => item.id === id);
        if (game) openGame(game, game.name);
      });
    }

    /* Nenhum atalho de teclado do site existe enquanto um jogo está aberto:
       WASD, setas, espaço, Enter, F, R, N, números… tudo pertence ao jogo.
       Este listener não bloqueia nada (não chama preventDefault): se uma tecla
       chegou até a página, é sinal de que o iframe perdeu o foco — então
       devolvemos o foco para ele. */
    document.addEventListener('keydown', (event) => {
      if (!playerIsOpen()) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) return;
      if (toolbarHasFocus()) return;
      focusGameFrame();
    });

    window.addEventListener('popstate', () => {
      readStateFromUrl();
      if (dom.search) dom.search.value = state.query;
      if (dom.sort) dom.sort.value = state.sort;
      renderChips();
      if (state.mode === 'demo') {
        showDemoGrid();
        return;
      }
      if (state.view === 'favorites') renderFavoritesView();
      else loadPage(state.page);
    });
  }

  /* ---------- inicialização ---------- */
  function waitForGlobal(timeout) {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      (function tick() {
        if (typeof window.Lumin !== 'undefined' && window.Lumin) return resolve(window.Lumin);
        if (Date.now() - started > timeout) {
          return reject(new Error('O LuminSDK não pôde ser carregado.'));
        }
        setTimeout(tick, 120);
      })();
    });
  }

  async function bootSdk() {
    await waitForGlobal(6000);
    /* um init anterior pode ter deixado o worker pendurado */
    try {
      if (window.Lumin && typeof window.Lumin.destroy === 'function') window.Lumin.destroy();
    } catch (error) {
      /* sem instância para destruir */
    }
    await withTimeout(
      window.Lumin.init({
        headless: true,
        onError: (error) => console.warn('[LuminSDK] aviso:', error)
      }),
      CONFIG.bootTimeout,
      'O LuminSDK demorou demais para responder.'
    );
  }

  async function connect() {
    setStatus('loading', 'Conectando…');

    let lastError = null;
    /* se o SDK nem chegou a carregar, insistir não adianta: o catálogo local
       entra mais rápido (antes a pessoa ficava ~20s numa tela sem jogos) */
    const attempts = hasSdk() ? 3 : 1;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        if (attempt > 0) {
          setStatus('loading', 'Tentando de novo…');
          await wait(1200 * attempt);
        }
        await bootSdk();
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        console.warn('[LuminSDK] tentativa ' + (attempt + 1) + ' de conexão falhou:', error);
      }
    }

    if (lastError) {
      await handleFatal(lastError);
      return;
    }

    if (localCatalog) {
      /* voltou a falar com o SDK: sai do catálogo local */
      state.localGames = [];
      if (dom.banner) dom.banner.hidden = true;
    }
    state.source = 'sdk';
    state.connected = true;
    state.mode = 'custom';
    setStatus('online', 'Online');

    loadCategories();

    if (state.view === 'favorites') renderFavoritesView();
    else await loadPage(state.page || 1);

    if (state.deepGame) {
      openGameById(state.deepGame);
      state.deepGame = '';
      syncUrl();
    }
  }

  function watchLayout() {
    let current = gamesPerPageForViewport();
    let timer = null;
    window.addEventListener('resize', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        applyGridVars();
        const next = gamesPerPageForViewport();
        if (next === current) return;
        current = next;
        state.limit = next;   // vale a partir da próxima página/busca
      }, 220);
    }, { passive: true });
  }

  /* ---------- grade sob medida (sliders de colunas e linhas) ---------- */
  function emitGrid(auto) {
    const layout = layoutInfo();
    window.dispatchEvent(
      new CustomEvent('lumin:grid', {
        detail: {
          cols: layout.columns,
          rows: layout.rows,
          auto: auto === undefined ? layout.auto : auto,
          perPage: state.limit
        }
      })
    );
  }

  function setGrid(cols, rows) {
    const auto = !cols || !rows;

    if (auto) {
      gridPrefs.cols = null;
      gridPrefs.rows = null;
      gridPrefs.size = CONFIG.defaultSize;
      saveStore('grid', null);
    } else {
      gridPrefs.cols = clamp(Math.round(cols), CONFIG.minCols, CONFIG.maxCols);
      gridPrefs.rows = clamp(Math.round(rows), CONFIG.minRows, CONFIG.maxRows);
      gridPrefs.size = null;   /* colunas manuais substituem o tamanho */
      saveStore('grid', { cols: gridPrefs.cols, rows: gridPrefs.rows });
    }

    applyGridVars();
    state.limit = gamesPerPageForViewport();
    state.pages = 1;
    emitGrid(auto);

    if (state.mode === 'demo') {
      showDemoGrid();
      return;
    }
    if (state.view === 'favorites') {
      renderFavoritesView();
      return;
    }
    if (state.connected) loadPage(1);
  }

  function setCardSize(size) {
    if (['sm', 'md', 'lg'].indexOf(size) < 0) return;

    gridPrefs.size = size;
    gridPrefs.cols = null;    /* o tamanho manda nas colunas */

    saveStore('grid', { size: size, rows: gridPrefs.rows });

    applyGridVars();
    state.limit = gamesPerPageForViewport();
    state.pages = 1;
    emitGrid();

    if (state.mode === 'demo') {
      showDemoGrid();
      return;
    }
    if (state.view === 'favorites') {
      renderFavoritesView();
      return;
    }
    if (state.connected) loadPage(1);
  }

  function previewGrid(cols, rows) {
    document.documentElement.style.setProperty('--grid-cols', String(cols));
    document.documentElement.style.setProperty('--grid-rows', String(rows));
  }

  function getGrid() {
    const layout = layoutInfo();
    return {
      cols: layout.columns,
      rows: layout.rows,
      auto: layout.auto,
      manual: layout.manual,
      size: layout.size,
      autoCols: autoLayout().columns,
      autoRows: autoLayout().rows,
      perPage: state.limit
    };
  }

  function boot() {
    if (booted) return;
    booted = true;
    cacheDom();
    if (!dom.grid) return;
    bindEvents();
    watchNetwork();
    renderRecents();

    const isDemo = /[?&]demo(=|&|$)/.test(window.location.search);
    if (isDemo) {
      renderDemo();
      return;
    }

    readStateFromUrl();
    updateDataStats();
    if (dom.search && state.query) {
      dom.search.value = state.query;
      if (dom.clear) dom.clear.hidden = false;
    }
    if (dom.sort && state.sort !== 'default') dom.sort.value = state.sort;
    renderChips();
    updateSummary();

    applyGridVars();
    emitGrid();
    watchLayout();
    renderSkeletons(state.limit);
    connect();
  }

  /* API pública usada pelo site.js */
  window.LuminLibrary = {
    boot: boot,
    random: () => {
      if (state.mode === 'demo') return toast('Modo demonstração ativo.');
      loadRandom();
    },
    focusSearch: () => {
      if (!dom.search) return;
      const target = document.getElementById('biblioteca');
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        if (window.scrollY < top - 40) window.scrollTo({ top: top, behavior: 'smooth' });
      }
      dom.search.focus({ preventScroll: true });
      dom.search.select();
    },
    closeGame: closeGame,
    toast: toast,
    favorites: () => {
      renderFavoritesView();
      const library = document.getElementById('biblioteca');
      if (library) {
        const top = library.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    },
    retry: () => {
      if (state.mode === 'error') window.location.reload();
      else if (state.connected) loadPage(state.page || 1);
    },
    getGrid: getGrid,
    setGrid: setGrid,
    setCardSize: setCardSize,
    setGameColor: setGameColor,
    colorOf: colorOf,
    shareCurrent: () => shareGame(state.currentGame),
    exportData: exportData,
    importData: importData,
    clearData: clearData,
    dataStats: () => ({
      favorites: state.favorites.length,
      recents: state.recents.length,
      colors: Object.keys(state.colors).length
    }),
    openGameById: openGameById,
    previewGrid: previewGrid,
    gridDefaults: () => ({
      minCols: CONFIG.minCols,
      maxCols: CONFIG.maxCols,
      minRows: CONFIG.minRows,
      maxRows: CONFIG.maxRows
    }),
    refreshTheme: () => {}
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
