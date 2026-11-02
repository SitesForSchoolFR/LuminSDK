/* =========================================================
   App "Comunidade" do LuminOS — compartilhar sem servidor
   Coleções por código, pacotes prontos, recomendações que rodam
   na sua máquina e a wishlist para mandar para um amigo.
   Nada aqui inventa login, nuvem ou "perfil público": tudo é
   arquivo/código que você copia e cola.
   Autor: Ryan Smith · Licença MIT
   ========================================================= */
(function () {
  'use strict';

  const OS = window.LuminOS;
  if (!OS || typeof OS.register !== 'function') return;
  const el = OS.ui.el;
  const esc = OS.ui.esc;
  const toast = OS.ui.toast;

  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.6-2.9 2.8-4.6 5.5-4.6s4.9 1.7 5.5 4.6"/><circle cx="17.5" cy="9.5" r="2.2"/><path d="M15.6 19c.4-2.2 1.6-3.6 3.4-3.9 1.5-.2 2.6.7 3.1 2"/></svg>';

  const TABS = [
    { id: 'collections', name: 'Coleções' },
    { id: 'picks', name: 'Recomendados' },
    { id: 'wishlist', name: 'Wishlist' },
    { id: 'about', name: 'Como funciona' }
  ];

  const PACKS = [
    { id: 'curtos', name: 'Sessões de 5 minutos', desc: 'Casuais para abrir e fechar rápido' },
    { id: 'classicos', name: 'Clássicos do acervo', desc: 'Nomes que todo mundo conhece' },
    { id: 'acao', name: 'Ação e tiro', desc: 'Para quem quer adrenalina' },
    { id: 'quebra', name: 'Quebra-cabeça', desc: 'Para pensar com calma' },
    { id: 'multi', name: 'Para duas pessoas', desc: 'Jogos de disputa local' }
  ];

  /* regras escritas em cima dos nomes que existem no acervo do GN-Math:
     testadas contra os 848 títulos, cada pacote acha entre 29 e 68 jogos */
  const PACK_RULES = {
    curtos: /(vex|dodo|jump|stack|dash|run|hop|tap|flap|sort|match|2048|slice|hook|climb)/i,
    classicos: /(pac.?man|mario|sonic|tetris|pong|galaga|digger|kirby|zelda|duck hunt|space invaders|street fighter|metal slug|frogger|doom)/i,
    acao: /(hit|fight|shoot|gun|strike|war|combat|zombie|five nights|fnaf|hunt|fury|battle|sniper)/i,
    quebra: /(sort|match|puzzle|sudoku|mahjong|solitaire|chess|2048|block|bridge|amaze|line|maze|riddle|quiz)/i,
    multi: /(1v1|2 player|two player|multiplayer|versus|smash|battle|party|pong|basket|soccer|football|duel)/i
  };

  const view = { tab: 'collections', flash: '' };
  let body = null;
  let games = null;
  let pickSeed = 0;

  function allGames() {
    if (games) return games;
    games = (OS.state && OS.state.games) || [];
    return games;
  }

  async function ensureGames() {
    if (!games || !games.length) {
      try { games = await OS.data.games(); } catch (error) { games = []; }
    }
    return games;
  }

  function findGame(id) {
    return allGames().filter(function (game) { return String(game.id) === String(id); })[0] || null;
  }

  /* determinístico: mesmo histórico gera a mesma lista */
  function recommend(count) {
    const list = allGames();
    if (!list.length) return [];
    const data = window.LuminPlayer ? window.LuminPlayer.read() : { games: {}, favorites: [] };
    const seen = data.games || {};
    const studios = {};
    Object.keys(seen).forEach(function (id) {
      const entry = seen[id] || {};
      const game = findGame(id);
      const studio = (entry.studio || (game && game.a) || '').split(',')[0].trim();
      if (studio) studios[studio] = (studios[studio] || 0) + 1;
    });
    const order = Object.keys(studios).sort(function (a, b) { return studios[b] - studios[a]; });
    const noise = function (game) {
      let h = 5381;
      const text = String(game.id) + (window.LuminPlayer ? window.LuminPlayer.summary().level : 1) + pickSeed;
      for (let i = 0; i < text.length; i += 1) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
      return h % 1000;
    };
    return list.slice().sort(function (a, b) {
      const aStudio = (a.a || '').split(',')[0].trim();
      const bStudio = (b.a || '').split(',')[0].trim();
      const aBoost = order.indexOf(aStudio) >= 0 ? (order.length - order.indexOf(aStudio)) * 12 : 0;
      const bBoost = order.indexOf(bStudio) >= 0 ? (order.length - order.indexOf(bStudio)) * 12 : 0;
      const aSeen = seen[String(a.id)] ? -18 : 0;
      const bSeen = seen[String(b.id)] ? -18 : 0;
      return (bBoost + bSeen + noise(b)) - (aBoost + aSeen + noise(a));
    }).slice(0, count || 6);
  }

  function packGames(packId, limit) {
    const rule = PACK_RULES[packId];
    const list = allGames();
    if (!rule || !list.length) return [];
    const hits = list.filter(function (game) { return rule.test(String(game.n || '')); });
    /* se o acervo mudar e a regra não achar nada, o pacote ainda entrega
       uma seleção honesta em vez de falhar na cara do usuário */
    if (!hits.length) return list.slice(0, limit || 10);
    return hits.slice(0, limit || 10);
  }

  /* ---------- coleções ---------- */
  function paintCollections(box) {
    const data = window.LuminPlayer ? window.LuminPlayer.read() : { collections: [] };
    const collections = data.collections || [];

    box.innerHTML = [
      '<section class="kp-card"><h3>Suas coleções</h3>',
      collections.length ? '<div class="kp-list">' + collections.map(function (collection) {
        return '<div class="kp-item"><b class="kp-grow" style="min-width:0;overflow:hidden;text-overflow:ellipsis">' + esc(collection.name) + '</b>' +
          '<small>' + collection.games.length + ' jogos</small>' +
          '<button class="kp-btn" type="button" data-code="' + esc(collection.id) + '">código</button></div>';
      }).join('') + '</div>' : '<p class="kp-empty">Nenhuma coleção ainda. Crie no Perfil ou use um pacote abaixo.</p>',
      '<input class="kp-field" data-code-out readonly placeholder="o código da coleção aparece aqui" aria-label="Código da coleção" style="margin-top:8px">',
      '</section>',

      '<section class="kp-card"><h3>Receber coleção</h3>',
      '<textarea class="kp-field" data-code-in rows="2" placeholder="LUM-COLL-…" aria-label="Código de coleção"></textarea>',
      '<div class="kp-row"><button class="kp-btn kp-btn--primary" type="button" data-receive>Adicionar à minha lista</button></div>',
      '<p class="kp-note" data-msg>' + esc(view.flash || 'Cada código carrega no máximo 12 jogos do acervo desta instalação.') + '</p></section>',

      '<section class="kp-card"><h3>Pacotes prontos</h3>',
      '<p class="kp-note">Monta uma coleção aqui mesmo, com jogos que existem no acervo atual.</p>',
      '<div class="kp-grid2">',
      PACKS.map(function (pack) {
        return '<button class="kp-btn" type="button" style="display:grid;gap:2px;text-align:left;padding:10px" data-pack="' + pack.id + '">' +
          '<b style="font-size:.8rem">' + esc(pack.name) + '</b><small style="font-size:.64rem;color:#7f7f96">' + esc(pack.desc) + '</small></button>';
      }).join(''),
      '</div></section>'
    ].join('');

    const out = box.querySelector('[data-code-out]');
    const msg = box.querySelector('[data-msg]');

    box.querySelectorAll('[data-code]').forEach(function (button) {
      button.addEventListener('click', function () {
        const collection = collections.filter(function (item) { return item.id === button.dataset.code; })[0];
        if (!collection) return;
        const ids = collection.games.slice(0, 12).map(Number).filter(function (id) { return !isNaN(id); });
        if (!ids.length) { out.value = ''; msg.textContent = 'Essa coleção está vazia — adicione jogos no Perfil.'; return; }
        out.value = window.LuminVault.makeCode('COLL', { n: collection.name.slice(0, 28), g: ids });
        out.select();
      });
    });

    box.querySelector('[data-receive]').addEventListener('click', function () {
      const parsed = window.LuminVault.readCode(box.querySelector('[data-code-in]').value);
      if (!parsed) { msg.textContent = 'Isso não parece um código LUM-COLL-…'; return; }
      if (parsed.error) { msg.textContent = 'Código inválido (' + parsed.error + '). Confira se copiou inteiro.'; return; }
      if (parsed.kind !== 'COLL') { msg.textContent = 'Esse código é ' + parsed.kind + ', não COLL.'; return; }
      const payload = parsed.payload || {};
      const ids = (payload.g || []).map(Number).filter(function (id) { return !!findGame(id); }).slice(0, 12);
      if (!ids.length) { msg.textContent = 'Nenhum jogo desse código está no acervo daqui.'; return; }
      if (!window.LuminPlayer) { msg.textContent = 'O player não carregou.'; return; }
      /* não cria duas coleções com o mesmo nome: vira "Nome (2)" */
      let title = String(payload.n || 'Coleção recebida').slice(0, 30);
      const taken = window.LuminPlayer.read().collections.map(function (item) { return item.name; });
      let attempt = 2;
      const base = title;
      while (taken.indexOf(title) >= 0 && attempt < 20) { title = base + ' (' + attempt + ')'; attempt += 1; }
      const created = window.LuminPlayer.createCollection(title);
      if (!created) { msg.textContent = 'Não deu para criar a coleção.'; return; }
      ids.forEach(function (id) {
        const game = findGame(id);
        window.LuminPlayer.toggleCollectionGame(created.collection.id, { id: game.id, n: game.n });
      });
      view.flash = 'Coleção "' + created.collection.name + '" criada com ' + ids.length + ' jogos.';
      toast('Coleção recebida.');
      paint();
    });

    box.querySelectorAll('[data-pack]').forEach(function (button) {
      button.addEventListener('click', function () {
        const pack = PACKS.filter(function (item) { return item.id === button.dataset.pack; })[0];
        const picks = packGames(pack.id, 10);
        if (!picks.length) { toast('Esse pacote não achou jogos no acervo.'); return; }
        if (!window.LuminPlayer) return;
        const created = window.LuminPlayer.createCollection(pack.name);
        if (!created) return;
        picks.forEach(function (game) {
          window.LuminPlayer.toggleCollectionGame(created.collection.id, { id: game.id, n: game.n });
        });
        toast('Pacote "' + pack.name + '" com ' + picks.length + ' jogos.');
        paint();
      });
    });
  }

  /* ---------- recomendados ---------- */
  function paintPicks(box) {
    const picks = recommend(6);
    const data = window.LuminPlayer ? window.LuminPlayer.read() : { favorites: [] };
    const level = window.LuminPlayer ? window.LuminPlayer.summary().level : 1;

    box.innerHTML = [
      '<section class="kp-card"><h3>Escolhidos para você</h3>',
      '<p class="kp-note">A conta roda aqui: estúdios que você já jogou pesam mais, jogos repetidos pesam menos. Nível atual: ' + level + '.</p>',
      '<div class="kp-list" data-picks>',
      picks.length ? picks.map(function (game) {
        return '<div class="kp-item"><span class="kp-grow" style="min-width:0;overflow:hidden;text-overflow:ellipsis">' + esc(game.n) + '</span>' +
          '<small style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc((game.a || 'sem estúdio').split(',')[0]) + '</small>' +
          '<button class="kp-btn" type="button" data-play="' + esc(game.id) + '">jogar</button></div>';
      }).join('') : '<p class="kp-empty">Abra o app Jogos uma vez para carregar o acervo.</p>',
      '</div>',
      '<div class="kp-row"><button class="kp-btn" type="button" data-shuffle>Rever</button>' +
      '<button class="kp-btn" type="button" data-collection>Salvar como coleção</button></div></section>',

      '<section class="kp-card"><h3>Seus estúdios</h3>',
      '<div class="kp-list">',
      (function () {
        const studios = {};
        Object.keys(data.games || {}).forEach(function (id) {
          const game = findGame(id);
          const studio = (game && game.a || '').split(',')[0].trim();
          if (studio) studios[studio] = (studios[studio] || 0) + 1;
        });
        const top = Object.keys(studios).sort(function (a, b) { return studios[b] - studios[a]; }).slice(0, 6);
        return top.length ? top.map(function (studio) {
          return '<div class="kp-item"><span class="kp-grow">' + esc(studio) + '</span><small>' + studios[studio] + ' jogos</small></div>';
        }).join('') : '<p class="kp-empty">Jogue algo e os estúdios aparecem aqui.</p>';
      })(),
      '</div></section>'
    ].join('');

    box.querySelectorAll('[data-play]').forEach(function (button) {
      button.addEventListener('click', function () {
        OS.play(Number(button.dataset.play));
      });
    });

    box.querySelector('[data-shuffle]').addEventListener('click', function () {
      pickSeed += 1;
      paint();
    });

    box.querySelector('[data-collection]').addEventListener('click', function () {
      if (!picks.length || !window.LuminPlayer) return;
      const created = window.LuminPlayer.createCollection('Para mim ' + new Date().getDate() + '/' + (new Date().getMonth() + 1));
      if (!created) return;
      picks.forEach(function (game) { window.LuminPlayer.toggleCollectionGame(created.collection.id, { id: game.id, n: game.n }); });
      toast('Coleção criada com ' + picks.length + ' jogos.');
    });
  }

  /* ---------- wishlist ---------- */
  function paintWishlist(box) {
    const data = window.LuminPlayer ? window.LuminPlayer.read() : { wishlist: [] };
    const list = (data.wishlist || []).map(function (id) {
      const game = findGame(id);
      return { id: id, name: (game && game.n) || (data.games && data.games[id] && data.games[id].name) || 'Jogo ' + id };
    });

    box.innerHTML = [
      '<section class="kp-card"><h3>Sua wishlist</h3>',
      list.length ? '<div class="kp-list">' + list.slice(0, 14).map(function (item) {
        return '<div class="kp-item"><span class="kp-grow" style="min-width:0;overflow:hidden;text-overflow:ellipsis">' + esc(item.name) + '</span>' +
          '<button class="kp-btn" type="button" data-remove="' + esc(item.id) + '">tirar</button></div>';
      }).join('') + '</div>' : '<p class="kp-empty">Nada na wishlist. Marque jogos no acervo.</p>',
      '<div class="kp-row"><button class="kp-btn kp-btn--primary" type="button" data-share>Gerar código da wishlist</button></div>',
      '<input class="kp-field" data-share-out readonly placeholder="o código aparece aqui" aria-label="Código da wishlist">',
      '<p class="kp-note">O código leva só os nomes e ids — serve para um amigo adicionar os mesmos itens na lista dele.</p></section>',

      '<section class="kp-card"><h3>Receber wishlist</h3>',
      '<textarea class="kp-field" data-share-in rows="2" placeholder="LUM-WISH-…" aria-label="Código da wishlist"></textarea>',
      '<div class="kp-row"><button class="kp-btn" type="button" data-merge>Adicionar na minha</button></div>',
      '<p class="kp-note" data-msg>' + esc(view.flash || 'Itens que já existem não são duplicados.') + '</p></section>'
    ].join('');

    box.querySelectorAll('[data-remove]').forEach(function (button) {
      button.addEventListener('click', function () {
        if (!window.LuminPlayer) return;
        const game = findGame(button.dataset.remove);
        window.LuminPlayer.toggleWishlist(game || { id: button.dataset.remove });
        paint();
      });
    });

    box.querySelector('[data-share]').addEventListener('click', function () {
      if (!list.length) { toast('A wishlist está vazia.'); return; }
      const out = box.querySelector('[data-share-out]');
      out.value = window.LuminVault.makeCode('WISH', { g: list.slice(0, 14).map(function (item) { return Number(item.id); }) });
      out.select();
      toast('Código da wishlist gerado.');
    });

    box.querySelector('[data-merge]').addEventListener('click', function () {
      const msg = box.querySelector('[data-msg]');
      const parsed = window.LuminVault.readCode(box.querySelector('[data-share-in]').value);
      if (!parsed) { msg.textContent = 'Isso não parece um código LUM-WISH-…'; return; }
      if (parsed.error) { msg.textContent = 'Código inválido (' + parsed.error + ').'; return; }
      if (parsed.kind !== 'WISH') { msg.textContent = 'Esse código é ' + parsed.kind + ', não WISH.'; return; }
      const ids = (parsed.payload && parsed.payload.g) || [];
      const current = (window.LuminPlayer.read().wishlist || []).map(String);
      let added = 0;
      ids.forEach(function (id) {
        if (id === undefined || id === null) return;
        if (current.indexOf(String(id)) >= 0) return;
        const game = findGame(id);
        if (!game) return;
        window.LuminPlayer.toggleWishlist({ id: game.id, n: game.n });
        added += 1;
      });
      view.flash = added ? added + ' jogos adicionados.' : 'Nada novo para adicionar.';
      toast(added ? 'Wishlist atualizada.' : 'Já estava tudo aí.');
      paint();
    });
  }

  /* ---------- sobre ---------- */
  function paintAbout(box) {
    box.innerHTML = [
      '<section class="kp-card"><h3>Comunidade sem servidor</h3>',
      '<p>O LuminSDK não tem cadastro, servidor de perfis nem banco de dados. O que existe aqui é honesto:</p>',
      '<div class="kp-list">',
      '<div class="kp-item"><b style="min-width:76px">Códigos</b><span class="kp-grow">coleções e wishlists viram texto que você envia por onde quiser</span></div>',
      '<div class="kp-item"><b style="min-width:76px">Chat</b><span class="kp-grow">o chat do site usa o ntfy (tópico público) — é o único canal em tempo real</span></div>',
      '<div class="kp-item"><b style="min-width:76px">Backup</b><span class="kp-grow">arquivo .json no Cofre para levar o progresso a outro navegador</span></div>',
      '</div>',
      '<p class="kp-note">Nada é enviado automaticamente. Se um código não funciona, provavelmente veio cortado: o checksum no fim avisa.</p></section>',

      '<section class="kp-card"><h3>Boas maneiras</h3><div class="kp-list">',
      '<div class="kp-item"><span class="kp-grow">Não publique código de coleção como se fosse "perfil oficial".</span></div>',
      '<div class="kp-item"><span class="kp-grow">Ao compartilhar um backup completo, saiba que ele leva seu XP e suas notas.</span></div>',
      '<div class="kp-item"><span class="kp-grow">Wishlist é só uma lista — não existe "comprar" nem "presentear" no OS.</span></div>',
      '</div></section>'
    ].join('');
  }

  /* ---------- pintura ---------- */
  function paint() {
    if (!body) return;
    const box = body.querySelector('[data-box]');
    box.scrollTop = 0;
    if (view.tab === 'collections') paintCollections(box);
    else if (view.tab === 'picks') paintPicks(box);
    else if (view.tab === 'wishlist') paintWishlist(box);
    else paintAbout(box);
  }

  function render(host) {
    body = host;
    host.innerHTML = [
      '<div class="kp">',
      '  <nav class="kp-tabs">',
      TABS.map(function (tab) {
        return '<button class="kp-tab" type="button" data-tab="' + tab.id + '">' + tab.name + '</button>';
      }).join(''),
      '  </nav>',
      '  <div class="kp-body" data-box><p class="kp-empty">carregando acervo…</p></div>',
      '</div>'
    ].join('');
    host.querySelectorAll('[data-tab]').forEach(function (button) {
      button.addEventListener('click', function () {
        if (view.tab !== button.dataset.tab) view.flash = '';
        view.tab = button.dataset.tab;
        host.querySelectorAll('[data-tab]').forEach(function (item) { item.classList.toggle('is-on', item === button); });
        paint();
      });
    });
    host.querySelector('[data-tab]').classList.add('is-on');
    ensureGames().then(function () { paint(); });
  }

  OS.register({
    id: 'community',
    name: 'Comunidade',
    short: 'Comunidade',
    w: 720,
    h: 570,
    at: 6,
    icon: ICON,
    render: render
  });
})();
