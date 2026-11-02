/* =========================================================
   App "Perfil" do LuminOS — o hub do jogador
   Nível/XP, conquistas, estatísticas, favoritos, wishlist, backlog,
   coleções, notas, avaliações, desafios do dia e retrospectiva.
   Tudo lê e escreve no LuminPlayer (assets/js/player.js).
   Autor: Ryan Smith · Licença MIT
   ========================================================= */
(function () {
  'use strict';

  const P = window.LuminPlayer;
  const OS = window.LuminOS;
  if (!P || !OS || typeof OS.register !== 'function') return;

  const el = OS.ui.el;
  const esc = OS.ui.esc;
  const toast = OS.ui.toast;

  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8.4" r="3.6"/><path d="M4.6 20c.6-3.6 3.6-6 7.4-6s6.8 2.4 7.4 6"/></svg>';

  const TABS = [
    { id: 'home', name: 'Resumo' },
    { id: 'games', name: 'Jogos' },
    { id: 'collections', name: 'Coleções' },
    { id: 'awards', name: 'Conquistas' },
    { id: 'stats', name: 'Números' },
    { id: 'retro', name: 'Retro' }
  ];

  const STATUS = [
    { id: 'jogando', name: 'Jogando' },
    { id: 'backlog', name: 'Quero jogar' },
    { id: 'zerado', name: 'Zerei' }
  ];

  const view = { tab: 'home', filter: 'all', query: '', detail: '', collection: '' };
  let catalog = null;
  let catalogPromise = null;

  /* ---------- utilidades ---------- */
  function initials(name) {
    const parts = String(name || 'J').trim().split(/\s+/).slice(0, 2);
    const text = parts.map(function (word) { return word.charAt(0); }).join('').toUpperCase();
    return text || 'J';
  }

  function hours(minutes) {
    const m = Math.max(0, Math.round(minutes || 0));
    if (m < 60) return m + ' min';
    const h = Math.floor(m / 60);
    const rest = m % 60;
    return h + 'h' + (rest ? ' ' + rest + 'min' : '');
  }

  function when(ts) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    if (diff < 60000) return 'agora';
    if (diff < 3600000) return Math.round(diff / 60000) + ' min atrás';
    if (diff < 86400000) return Math.round(diff / 3600000) + ' h atrás';
    const days = Math.round(diff / 86400000);
    return days === 1 ? 'ontem' : days + ' dias atrás';
  }

  function timerText(seconds) {
    const s = Math.max(0, Math.round(seconds || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : String(m)) + ':' + String(r).padStart(2, '0');
  }

  function catalogLoad() {
    if (catalog) return Promise.resolve(catalog);
    if (catalogPromise) return catalogPromise;
    catalogPromise = OS.data.games().then(function (games) {
      const map = {};
      (games || []).forEach(function (game) { map[String(game.id)] = game; });
      catalog = map;
      return map;
    }, function () {
      catalogPromise = null;
      catalog = {};
      return catalog;
    });
    return catalogPromise;
  }

  function meta(id) {
    return (catalog && catalog[String(id)]) || null;
  }

  function coverFor(id, game) {
    const item = meta(id);
    const file = item && item.c;
    const src = file && OS.data.covers ? OS.data.covers[0] + file : '';
    return { src: src, mono: String((game && game.name) || (item && item.n) || '?').slice(0, 2).toUpperCase() };
  }

  function gameName(id, entry) {
    const item = meta(id);
    return (entry && entry.name) || (item && item.n) || 'Jogo';
  }

  function avatarMarkup(name, art, size) {
    const index = ((Number(art) || 0) % 8 + 8) % 8;
    return '<span class="pf__avatar" data-art="' + index + '" data-size="' + (size || 'lg') + '">' +
      '<span class="pf__avatar-ini">' + esc(initials(name)) + '</span></span>';
  }

  /* ---------- linhas de jogo ---------- */
  function gameRow(id, entry, options) {
    const opts = options || {};
    const cover = coverFor(id, entry);
    const mine = P.read();
    const fav = mine.favorites.indexOf(String(id)) >= 0;
    const row = el('div', 'pfr');
    row.innerHTML = [
      '<span class="pfr__art">' + (cover.src ? '<img alt="" loading="lazy" decoding="async" data-cover src="' + esc(cover.src) + '">' : '') +
      '<span class="pfr__mono">' + esc(cover.mono) + '</span></span>',
      '<span class="pfr__info"><b>' + esc(gameName(id, entry)) + '</b><small>' + esc(opts.sub || '') + '</small></span>',
      opts.play ? '<button class="pfr__btn pfr__btn--play" type="button" data-play="' + esc(id) + '" title="Jogar agora">▶</button>' : '',
      opts.remove ? '<button class="pfr__btn" type="button" data-forget="' + esc(id) + '" title="Tirar da lista">✕</button>' : '',
      '<button class="pfr__btn pfr__star' + (fav ? ' is-on' : '') + '" type="button" data-star="' + esc(id) + '" title="' + (fav ? 'Tirar dos favoritos' : 'Favoritar') + '" aria-pressed="' + (fav ? 'true' : 'false') + '">★</button>'
    ].join('');
    row.dataset.row = String(id);
    row.tabIndex = 0;
    row.setAttribute('role', 'button');
    return row;
  }

  function wireCovers(scope) {
    scope.querySelectorAll('img[data-cover]').forEach(function (img) {
      img.addEventListener('error', function () { img.remove(); });
    });
  }

  function wireRows(scope, repaint) {
    wireCovers(scope);
    scope.querySelectorAll('[data-play]').forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        OS.play(button.dataset.play);
      });
    });
    scope.querySelectorAll('[data-star]').forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        const id = button.dataset.star;
        const entry = P.read().games[id];
        P.toggleFavorite({ id: id, n: entry ? entry.name : '' });
        button.classList.toggle('is-on', P.read().favorites.indexOf(String(id)) >= 0);
        if (repaint) repaint();
      });
    });
    scope.querySelectorAll('[data-forget]').forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        const id = button.dataset.forget;
        if (view.filter === 'favorites') P.toggleFavorite({ id: id });
        else if (view.filter === 'wishlist') P.toggleWishlist({ id: id });
        else if (view.filter === 'backlog') P.toggleBacklog({ id: id });
        if (view.collection) P.toggleCollectionGame(view.collection, { id: id });
        if (repaint) repaint();
      });
    });
    scope.querySelectorAll('[data-row]').forEach(function (row) {
      const open = function () {
        view.detail = row.dataset.row;
        if (repaint) repaint();
      };
      row.addEventListener('click', open);
      row.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
      });
    });
  }

  /* ---------- cabeçalho ---------- */
  let sessionTimer = 0;

  function paintHeader(body) {
    const tick = function () {
      const node = body.querySelector('[data-session]');
      if (!node) return;
      const session = P.currentSession();
      node.textContent = session ? '⏱ ' + timerText(session.seconds) + ' jogando ' + session.name : '';
      node.hidden = !session;
    };
    tick();
    clearInterval(sessionTimer);
    sessionTimer = setInterval(function () {
      if (!body.isConnected) { clearInterval(sessionTimer); sessionTimer = 0; return; }
      tick();
    }, 1000);
  }

  function headerMarkup(info) {
    return [
      '<div class="pf__top">',
      '  <button class="pf__art" type="button" data-avatar title="Trocar o avatar">' + avatarMarkup(info.name, info.art) + '</button>',
      '  <div class="pf__id">',
      '    <p class="pf__name"><span data-name>' + esc(info.name) + '</span>',
      '      <button class="pf__edit" type="button" data-rename aria-label="Mudar o nome" title="Mudar o nome">✎</button>',
      '    </p>',
      '    <div class="pf__xp"><span class="pf__xp-fill" style="width:' + info.pct + '%"></span></div>',
      '    <p class="pf__xp-text">Nível <b>' + info.level + '</b> · ' + info.into + '/' + info.need + ' XP <span>' + info.xp + ' XP no total</span></p>',
      '  </div>',
      '  <div class="pf__flags">',
      '    <span class="pf__flag" title="Dias seguidos">' + (info.streak || 0) + (info.streak === 1 ? ' dia' : ' dias') + '</span>',
      '    <span class="pf__flag" title="Conquistas">' + info.achievements + '/' + info.achievementsTotal + ' conquistas</span>',
      '  </div>',
      '</div>',
      '<p class="pf__session" data-session hidden></p>'
    ].join('');
  }

  /* ---------- aba: resumo ---------- */
  function paintHome(box) {
    const info = P.summary();
    const recent = P.recent(4);
    const challenges = P.challenges();
    const awards = P.achievements().filter(function (item) { return item.done; }).sort(function (a, b) { return b.at - a.at; }).slice(0, 3);

    const html = [
      '<div class="pf__tiles">',
      '  <div class="pf__tile"><b>' + info.games + '</b><span>jogos</span></div>',
      '  <div class="pf__tile"><b>' + info.plays + '</b><span>partidas</span></div>',
      '  <div class="pf__tile"><b>' + hours(info.minutes) + '</b><span>jogando</span></div>',
      '  <div class="pf__tile"><b>' + info.favorites + '</b><span>favoritos</span></div>',
      '</div>',

      '<section class="pf__block">',
      '  <header class="pf__block-head"><h3>Continuar jogando</h3>',
      '    <button class="pf__link" type="button" data-tab="games">ver tudo</button></header>',
      '  <div class="pf__rows" data-recent></div>',
      '</section>',

      '<section class="pf__block">',
      '  <header class="pf__block-head"><h3>Desafios de hoje</h3><span class="pf__hint">' + challenges.filter(function (c) { return c.claimed; }).length + '/' + challenges.length + '</span></header>',
      '  <div class="pf__challenges">',
      challenges.map(function (item) {
        return '<div class="pf__challenge' + (item.done ? ' is-done' : '') + '">' +
          '<span class="pf__challenge-text">' + esc(item.text) + '</span>' +
          '<span class="pf__challenge-bar"><i style="width:' + Math.round((item.progress / item.target) * 100) + '%"></i></span>' +
          '<span class="pf__challenge-num">' + item.progress + '/' + item.target + '</span>' +
          '<span class="pf__challenge-xp">' + (item.claimed ? '✓ ganho' : '+' + item.reward + ' XP') + '</span>' +
          '</div>';
      }).join(''),
      '  </div>',
      '  <button class="pf__claim" type="button" data-claim' + (challenges.some(function (c) { return c.done && !c.claimed; }) ? '' : ' disabled') + '>Resgatar recompensas</button>',
      '</section>',

      '<section class="pf__block">',
      '  <header class="pf__block-head"><h3>Conquistas recentes</h3>',
      '    <button class="pf__link" type="button" data-tab="awards">todas</button></header>',
      '  <div class="pf__award-line">',
      awards.length
        ? awards.map(function (item) { return '<span class="pf__award-chip" title="' + esc(item.desc) + '">' + esc(item.name) + '</span>'; }).join('')
        : '<span class="pf__empty">Nada ainda — abra um jogo para começar.</span>',
      '  </div>',
      '</section>'
    ].join('');

    box.innerHTML = html;
    const rows = box.querySelector('[data-recent]');
    if (!recent.length) rows.innerHTML = '<p class="pf__empty">Você ainda não abriu nenhum jogo. O acervo está no dock, em <b>Jogos</b>.</p>';
    recent.forEach(function (entry) {
      const sub = [entry.plays + (entry.plays === 1 ? ' partida' : ' partidas'), hours(entry.minutes), when(entry.last)].filter(Boolean).join(' · ');
      rows.append(gameRow(entry.id, entry, { sub: sub, play: true }));
    });

    wireRows(box, paint);
    box.querySelectorAll('[data-tab]').forEach(function (button) {
      button.addEventListener('click', function () { setTab(button.dataset.tab); });
    });
    box.querySelector('[data-claim]').addEventListener('click', function () {
      const gained = P.claimChallenges();
      if (!gained.length) return;
      const xp = gained.reduce(function (sum, item) { return sum + item.reward; }, 0);
      toast('+' + xp + ' XP · desafio' + (gained.length > 1 ? 's' : '') + ' concluído' + (gained.length > 1 ? 's' : ''));
      paint();
    });
  }

  /* ---------- aba: jogos ---------- */
  function paintGames(box) {
    const mine = P.read();
    const filters = [
      { id: 'all', name: 'Todos' },
      { id: 'favorites', name: 'Favoritos' },
      { id: 'wishlist', name: 'Wishlist' },
      { id: 'backlog', name: 'Backlog' },
      { id: 'done', name: 'Zerados' }
    ];

    if (view.detail) return paintDetail(box);

    box.innerHTML = [
      '<div class="pf__filters">',
      filters.map(function (item) {
        return '<button class="pf__chip' + (view.filter === item.id ? ' is-on' : '') + '" type="button" data-filter="' + item.id + '">' + item.name + '</button>';
      }).join(''),
      '</div>',
      '<label class="pf__search"><input type="search" placeholder="Buscar no seu histórico ou no acervo…" aria-label="Buscar jogo" value="' + esc(view.query) + '"></label>',
      '<div class="pf__rows" data-list></div>'
    ].join('');

    const list = box.querySelector('[data-list]');
    const input = box.querySelector('input');
    const ids = [];
    const push = function (id) { if (ids.indexOf(String(id)) < 0) ids.push(String(id)); };

    if (view.filter === 'favorites') mine.favorites.forEach(push);
    else if (view.filter === 'wishlist') mine.wishlist.forEach(push);
    else if (view.filter === 'backlog') mine.backlog.forEach(push);
    else if (view.filter === 'done') Object.keys(mine.games).forEach(function (id) { if (mine.games[id].status === 'zerado') push(id); });
    else {
      Object.keys(mine.games).sort(function (a, b) { return (mine.games[b].last || 0) - (mine.games[a].last || 0); }).forEach(push);
      if (catalog) Object.keys(catalog).forEach(push);
    }

    const query = view.query.trim().toLowerCase();
    let shown = ids.filter(function (id) {
      if (!query) return true;
      const name = gameName(id, mine.games[id]).toLowerCase();
      const studio = ((meta(id) || {}).a || '').toLowerCase();
      return name.indexOf(query) >= 0 || studio.indexOf(query) >= 0;
    });
    const capped = shown.length > 60 ? shown.slice(0, 60) : shown;

    if (!capped.length) {
      list.innerHTML = '<p class="pf__empty">' + (query ? 'Nada com “' + esc(view.query) + '”.' : 'Lista vazia por enquanto.') + '</p>';
    }
    capped.forEach(function (id) {
      const entry = mine.games[id] || null;
      const bits = [];
      if (entry && entry.plays) bits.push(entry.plays + (entry.plays === 1 ? ' partida' : ' partidas'));
      if (entry && entry.minutes) bits.push(hours(entry.minutes));
      if (entry && entry.status) bits.push(STATUS.filter(function (s) { return s.id === entry.status; }).map(function (s) { return s.name; })[0] || '');
      const sub = bits.filter(Boolean).join(' · ') || ((meta(id) || {}).a || 'no acervo');
      list.append(gameRow(id, entry, { sub: sub, play: true, remove: view.filter !== 'all' }));
    });
    if (shown.length > capped.length) {
      list.append(el('p', 'pf__empty', 'Mostrando ' + capped.length + ' de ' + shown.length + ' — refine a busca.'));
    }

    wireRows(box, paint);
    box.querySelectorAll('[data-filter]').forEach(function (button) {
      button.addEventListener('click', function () {
        view.filter = button.dataset.filter;
        view.detail = '';
        paint();
      });
    });
    let searchTimer = 0;
    input.addEventListener('input', function () {
      const caret = input.selectionStart;
      const value = input.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        view.query = value;
        catalogLoad().then(function () {
          paintGames(box);
          const again = box.querySelector('input');
          if (again) { again.focus(); try { again.setSelectionRange(caret, caret); } catch (error) {} }
        });
      }, 140);
    });
  }

  /* ---------- detalhe de um jogo ---------- */
  function paintDetail(box) {
    const id = view.detail;
    const mine = P.read();
    const entry = mine.games[id] || { name: gameName(id, null), plays: 0, minutes: 0 };
    const rating = mine.ratings[id] || { stars: 0, review: '' };
    const note = mine.notes[id] || '';
    const fav = mine.favorites.indexOf(String(id)) >= 0;
    const wish = mine.wishlist.indexOf(String(id)) >= 0;
    const cover = coverFor(id, entry);

    box.innerHTML = [
      '<div class="pfd">',
      '  <div class="pfd__head">',
      '    <button class="pf__back" type="button" data-back>← voltar</button>',
      '    <button class="pfd__play" type="button" data-playnow>▶ Jogar agora</button>',
      '  </div>',
      '  <div class="pfd__id">',
      '    <span class="pfd__art">' + (cover.src ? '<img alt="" data-cover src="' + esc(cover.src) + '">' : '') + '<span>' + esc(cover.mono) + '</span></span>',
      '    <div class="pfd__meta">',
      '      <h3>' + esc(gameName(id, entry)) + '</h3>',
      '      <p>' + esc((meta(id) || {}).a || entry.studio || 'acervo GN-Math') + '</p>',
      '      <p class="pfd__stats">' + (entry.plays || 0) + (entry.plays === 1 ? ' partida' : ' partidas') + ' · ' + hours(entry.minutes) + (entry.last ? ' · ' + when(entry.last) : '') + '</p>',
      '    </div>',
      '  </div>',
      '  <div class="pfd__flags">',
      '    <button class="pf__chip' + (fav ? ' is-on' : '') + '" type="button" data-fav>★ Favorito</button>',
      '    <button class="pf__chip' + (wish ? ' is-on' : '') + '" type="button" data-wish>Desejo</button>',
      STATUS.map(function (item) {
        return '<button class="pf__chip' + ((entry.status || '') === item.id ? ' is-on' : '') + '" type="button" data-status="' + item.id + '">' + item.name + '</button>';
      }).join(''),
      '  </div>',
      '  <form class="pfd__form" data-form>',
      '    <label class="pfd__label">Nota <span data-stars-text>' + (rating.stars || '—') + '</span></label>',
      '    <div class="pfd__stars">',
      [1, 2, 3, 4, 5].map(function (n) {
        return '<button class="pfd__star' + (n <= (rating.stars || 0) ? ' is-on' : '') + '" type="button" data-stars="' + n + '">★</button>';
      }).join(''),
      '    </div>',
      '    <label class="pfd__label" for="pf-review">Sua avaliação</label>',
      '    <textarea id="pf-review" rows="3" data-review placeholder="O que você achou?">' + esc(rating.review || '') + '</textarea>',
      '    <label class="pfd__label" for="pf-note">Anotações</label>',
      '    <textarea id="pf-note" rows="3" data-note placeholder="Dicas, códigos, onde parou…">' + esc(note) + '</textarea>',
      '    <div class="pfd__collections" data-cols></div>',
      '    <p class="pf__hint" data-saved hidden>salvo</p>',
      '  </form>',
      '</div>'
    ].join('');

    wireCovers(box);
    const form = box.querySelector('[data-form]');
    const review = box.querySelector('[data-review]');
    const noteArea = box.querySelector('[data-note]');
    const saved = box.querySelector('[data-saved]');
    let stars = rating.stars || 0;

    const flash = function () {
      saved.hidden = false;
      clearTimeout(flash.timer);
      flash.timer = setTimeout(function () { saved.hidden = true; }, 1200);
    };

    box.querySelector('[data-back]').addEventListener('click', function () {
      view.detail = '';
      paint();
    });
    box.querySelector('[data-playnow]').addEventListener('click', function () { OS.play(id); });
    box.querySelector('[data-fav]').addEventListener('click', function (event) {
      P.toggleFavorite({ id: id, n: entry.name });
      event.currentTarget.classList.toggle('is-on');
      paint();
    });
    box.querySelector('[data-wish]').addEventListener('click', function (event) {
      P.toggleWishlist({ id: id, n: entry.name });
      event.currentTarget.classList.toggle('is-on');
    });
    box.querySelectorAll('[data-status]').forEach(function (button) {
      button.addEventListener('click', function () {
        P.setStatus(id, button.dataset.status);
        box.querySelectorAll('[data-status]').forEach(function (item) { item.classList.toggle('is-on', item === button); });
      });
    });
    box.querySelectorAll('[data-stars]').forEach(function (button) {
      button.addEventListener('click', function () {
        stars = Number(button.dataset.stars);
        box.querySelectorAll('[data-stars]').forEach(function (item) {
          item.classList.toggle('is-on', Number(item.dataset.stars) <= stars);
        });
        box.querySelector('[data-stars-text]').textContent = stars;
        P.setRating(id, stars, review.value, entry.name);
        flash();
      });
    });
    let timer = null;
    const save = function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        P.setRating(id, stars, review.value, entry.name);
        P.setNote(id, noteArea.value);
        flash();
      }, 500);
    };
    review.addEventListener('input', save);
    noteArea.addEventListener('input', save);
    form.addEventListener('submit', function (event) { event.preventDefault(); });

    /* coleções: marca/desmarca */
    const cols = box.querySelector('[data-cols]');
    const mineNow = P.read();
    if (!mineNow.collections.length) {
      cols.innerHTML = '<button class="pf__link" type="button" data-newcol>Criar uma coleção</button>';
      cols.querySelector('[data-newcol]').addEventListener('click', function () {
        const name = window.prompt('Nome da coleção', 'Meus favoritos');
        if (!name) return;
        const created = P.createCollection(name);
        /* o jogo que está aberto já entra na coleção nova */
        if (created && created.collection) P.toggleCollectionGame(created.collection.id, { id: id, n: entry.name });
        paintDetail(box);
      });
    } else {
      cols.innerHTML = '<span class="pfd__cols-label">Coleções</span>' + mineNow.collections.map(function (item) {
        const on = item.games.indexOf(String(id)) >= 0;
        return '<button class="pf__chip' + (on ? ' is-on' : '') + '" type="button" data-col="' + esc(item.id) + '">' + esc(item.name) + '</button>';
      }).join('');
      cols.querySelectorAll('[data-col]').forEach(function (button) {
        button.addEventListener('click', function () {
          P.toggleCollectionGame(button.dataset.col, { id: id, n: entry.name });
          button.classList.toggle('is-on');
        });
      });
    }
  }

  /* ---------- aba: coleções ---------- */
  function paintCollections(box) {
    const mine = P.read();

    if (view.collection) {
      const collection = mine.collections.filter(function (item) { return item.id === view.collection; })[0];
      if (!collection) { view.collection = ''; return paintCollections(box); }
      box.innerHTML = [
        '<div class="pf__filters"><button class="pf__back" type="button" data-back>← coleções</button>',
        '<span class="pf__hint">' + collection.games.length + (collection.games.length === 1 ? ' jogo' : ' jogos') + '</span></div>',
        '<div class="pf__rows" data-list></div>'
      ].join('');
      const list = box.querySelector('[data-list]');
      if (!collection.games.length) list.innerHTML = '<p class="pf__empty">Coleção vazia — abra um jogo e marque esta coleção.</p>';
      collection.games.forEach(function (id) {
        list.append(gameRow(id, mine.games[id] || null, { sub: when((mine.games[id] || {}).last), play: true, remove: true }));
      });
      wireRows(box, paint);
      box.querySelector('[data-back]').addEventListener('click', function () { view.collection = ''; paint(); });
      return;
    }

    box.innerHTML = [
      '<form class="pf__newcol" data-new><input type="text" maxlength="40" placeholder="Nome da coleção (ex.: joguinhos de 5 min)" aria-label="Nome da coleção">',
      '<button class="pf__claim" type="submit">Criar</button></form>',
      '<div class="pf__cols" data-cols></div>'
    ].join('');

    const cols = box.querySelector('[data-cols]');
    if (!mine.collections.length) {
      cols.innerHTML = '<p class="pf__empty">Nenhuma coleção ainda. Dá para juntar jogos por humor, por tempo ou por estúdio.</p>';
    }
    mine.collections.forEach(function (item) {
      const card = el('div', 'pf__col');
      card.innerHTML = '<b>' + esc(item.name) + '</b><span>' + item.games.length + (item.games.length === 1 ? ' jogo' : ' jogos') + '</span>' +
        '<button class="pfr__btn" type="button" data-del title="Apagar coleção">✕</button>';
      card.addEventListener('click', function (event) {
        if (event.target.closest('[data-del]')) return;
        view.collection = item.id;
        paint();
      });
      card.querySelector('[data-del]').addEventListener('click', function (event) {
        event.stopPropagation();
        P.removeCollection(item.id);
        paint();
      });
      cols.append(card);
    });

    box.querySelector('[data-new]').addEventListener('submit', function (event) {
      event.preventDefault();
      const input = box.querySelector('input');
      if (!P.createCollection(input.value)) { input.focus(); return; }
      input.value = '';
      paint();
    });
  }

  /* ---------- aba: conquistas ---------- */
  function paintAwards(box) {
    const items = P.achievements();
    const done = items.filter(function (item) { return item.done; });
    box.innerHTML = [
      '<div class="pf__filters"><span class="pf__hint">' + done.length + ' de ' + items.length + ' desbloqueadas</span></div>',
      '<div class="pf__awards">',
      items.map(function (item) {
        const hidden = item.hidden && !item.done;
        const pct = item.target ? Math.min(100, Math.round((item.progress / item.target) * 100)) : 0;
        return '<div class="pf__award' + (item.done ? ' is-done' : '') + '">' +
          '<span class="pf__award-mark" aria-hidden="true">' + (item.done ? '✓' : '·') + '</span>' +
          '<div class="pf__award-info">' +
          '<b>' + (hidden ? '???' : esc(item.name)) + '</b>' +
          '<small>' + (hidden ? 'conquista oculta' : esc(item.desc)) + '</small>' +
          (item.done ? '<em>' + when(item.at) + (item.xp ? ' · +' + item.xp + ' XP' : '') + '</em>' : '<span class="pf__award-bar"><i style="width:' + pct + '%"></i></span>') +
          '</div></div>';
      }).join(''),
      '</div>'
    ].join('');
  }

  /* ---------- aba: números ---------- */
  function paintStats(box) {
    const info = P.summary();
    const top = P.topGames(6);
    const maxMinutes = top.length ? Math.max.apply(null, top.map(function (item) { return item.minutes || 1; })) : 1;
    const mine = P.read();
    const rated = Object.keys(mine.ratings).length;

    box.innerHTML = [
      '<div class="pf__tiles">',
      '  <div class="pf__tile"><b>' + hours(info.minutes) + '</b><span>tempo total</span></div>',
      '  <div class="pf__tile"><b>' + info.plays + '</b><span>partidas</span></div>',
      '  <div class="pf__tile"><b>' + info.games + '</b><span>jogos diferentes</span></div>',
      '  <div class="pf__tile"><b>' + (info.rating || '—') + '</b><span>média das notas</span></div>',
      '</div>',
      '<section class="pf__block">',
      '  <header class="pf__block-head"><h3>Onde o tempo foi</h3><span class="pf__hint">' + rated + ' avaliados</span></header>',
      '  <div class="pf__bars">',
      top.length ? top.map(function (item) {
        return '<div class="pf__bar"><span>' + esc(item.name) + '</span>' +
          '<i style="width:' + Math.max(4, Math.round(((item.minutes || 0) / maxMinutes) * 100)) + '%"></i>' +
          '<em>' + hours(item.minutes) + '</em></div>';
      }).join('') : '<p class="pf__empty">Sem partidas registradas ainda.</p>',
      '  </div>',
      '</section>',
      '<section class="pf__block">',
      '  <header class="pf__block-head"><h3>Listas</h3></header>',
      '  <div class="pf__tiles">',
      '    <div class="pf__tile"><b>' + info.favorites + '</b><span>favoritos</span></div>',
      '    <div class="pf__tile"><b>' + info.wishlist + '</b><span>wishlist</span></div>',
      '    <div class="pf__tile"><b>' + info.backlog + '</b><span>backlog</span></div>',
      '    <div class="pf__tile"><b>' + info.collections + '</b><span>coleções</span></div>',
      '  </div>',
      '</section>'
    ].join('');
  }

  /* ---------- aba: retrospectiva ---------- */
  function paintRetro(box) {
    P.markWrapped();
    const info = P.summary();
    const top = P.topGames(3);
    const mine = P.read();
    const best = mine.sessions.slice().sort(function (a, b) { return b.mins - a.mins; })[0];
    const initial = String(info.name || 'J').charAt(0).toUpperCase();

    box.innerHTML = [
      '<article class="pf__retro">',
      '  <header class="pf__retro-top">',
      '    <span class="pf__retro-mark">' + esc(initial) + '</span>',
      '    <div><p class="pf__retro-kicker">Retrospectiva</p><h3>' + esc(info.name) + '</h3></div>',
      '    <span class="pf__retro-level">Nv ' + info.level + '</span>',
      '  </header>',
      '  <div class="pf__retro-grid">',
      '    <div><b>' + hours(info.minutes) + '</b><span>de jogo</span></div>',
      '    <div><b>' + info.games + '</b><span>jogos</span></div>',
      '    <div><b>' + info.achievements + '</b><span>conquistas</span></div>',
      '    <div><b>' + (info.streak || 0) + '</b><span>dias seguidos</span></div>',
      '  </div>',
      '  <div class="pf__retro-list">',
      top.length ? top.map(function (item, index) {
        return '<div class="pf__retro-item"><span>' + (index + 1) + '</span><b>' + esc(item.name) + '</b><em>' + hours(item.minutes) + '</em></div>';
      }).join('') : '<p class="pf__empty">Jogue alguma coisa para montar a sua retrospectiva.</p>',
      '  </div>',
      best ? '  <p class="pf__retro-foot">Maior sessão: ' + esc(best.name) + ' · ' + hours(best.mins) + '</p>' : '',
      '</article>',
      '<button class="pf__claim" type="button" data-copy>Copiar resumo</button>'
    ].join('');

    box.querySelector('[data-copy]').addEventListener('click', function () {
      const text = 'LuminSDK · ' + info.name + ' — Nv ' + info.level + ', ' + hours(info.minutes) + ' jogados, ' +
        info.games + ' jogos, ' + info.achievements + '/' + info.achievementsTotal + ' conquistas' +
        (top.length ? '. Top: ' + top.map(function (item) { return item.name; }).join(', ') : '');
      const done = function () { toast('Resumo copiado.'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done);
      else {
        const area = document.createElement('textarea');
        area.value = text;
        document.body.append(area);
        area.select();
        try { document.execCommand('copy'); } catch (error) {}
        area.remove();
        done();
      }
    });
  }

  /* ---------- pintura geral ---------- */
  let bodyRef = null;
  let shell = null;

  function paint() {
    if (!bodyRef || !shell) return;
    const info = P.summary();
    shell.querySelector('[data-head]').innerHTML = headerMarkup(info);
    shell.querySelector('[data-avatar]').addEventListener('click', function () {
      P.cycleArt();
      paint();
    });
    shell.querySelector('[data-rename]').addEventListener('click', rename);
    paintHeader(bodyRef);

    shell.querySelectorAll('[data-tab]').forEach(function (button) {
      button.classList.toggle('is-on', button.dataset.tabId === view.tab);
    });

    const box = shell.querySelector('[data-view]');
    box.scrollTop = 0;
    if (view.tab === 'home') paintHome(box);
    else if (view.tab === 'games') paintGames(box);
    else if (view.tab === 'collections') paintCollections(box);
    else if (view.tab === 'awards') paintAwards(box);
    else if (view.tab === 'stats') paintStats(box);
    else paintRetro(box);
  }

  function setTab(id) {
    if (view.tab === id) return;
    view.tab = id;
    view.detail = '';
    view.collection = '';
    P.markTab(id);
    paint();
  }

  function rename() {
    const current = P.summary().name;
    const name = window.prompt('Como você quer ser chamado?', current);
    if (name === null) return;
    P.setName(name);
    paint();
  }

  function render(body) {
    bodyRef = body;
    body.innerHTML = [
      '<div class="pf">',
      '  <div data-head></div>',
      '  <nav class="pf__tabs" aria-label="Seções do perfil">',
      TABS.map(function (item) {
        return '<button class="pf__tab" type="button" data-tab data-tab-id="' + item.id + '">' + item.name + '</button>';
      }).join(''),
      '  </nav>',
      '  <div class="pf__view" data-view></div>',
      '</div>'
    ].join('');
    shell = body.querySelector('.pf');

    shell.querySelectorAll('[data-tab]').forEach(function (button) {
      button.addEventListener('click', function () { setTab(button.dataset.tabId); });
    });
    shell.querySelector('[data-view]').addEventListener('scroll', function () {}, { passive: true });

    const news = P.markOpen();
    if (news && news.length) OS.notify(news);
    paint();

    const off = P.on(function () {
      if (!body.isConnected) { off(); return; }
      const active = document.activeElement;
      if (active && body.contains(active) && /INPUT|TEXTAREA/.test(active.tagName)) return;
      if (!['home', 'awards', 'stats', 'retro'].includes(view.tab)) return;
      if (view.detail) return;
      paint();
    });
  }

  OS.register({
    id: 'player',
    name: 'Perfil',
    short: 'Perfil',
    w: 780,
    h: 600,
    at: 0,
    icon: ICON,
    render: function (body) {
      catalogLoad().then(function () {
        if (body.isConnected && view.tab === 'games') paint();
      });
      render(body);
    }
  });
})();
