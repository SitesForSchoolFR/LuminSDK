/* =========================================================
   App "Central" do LuminOS — pesquisa, ferramentas e diagnóstico
   Junta o que estava espalhado: busca global (apps, jogos, sites,
   notas e ajuda), lançador de aplicativos, gerenciador de janelas,
   diagnóstico de recursos do navegador, desempenho medido de verdade,
   mapa de armazenamento/cache, ajuda interna e informações da versão.
   Nada aqui inventa dado: quando a API não existe, a Central diz
   "não testado" ou "indisponível" em vez de fingir.
   Autor: Ryan Smith · Licença MIT
   ========================================================= */
(function () {
  'use strict';

  const OS = window.LuminOS;
  if (!OS || typeof OS.register !== 'function') return;

  const el = OS.ui.el;
  const esc = OS.ui.esc;
  const toast = OS.ui.toast;

  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6.4"/><path d="M15.6 15.6 20 20M11 9.4v3.2M9.4 11h3.2"/></svg>';
  const VERSION = 'v40';

  const HIST_KEY = 'luminsdk:v1:central:hist';
  const PIN_KEY = 'luminsdk:v1:central:pins';
  const OPEN_KEY = 'luminsdk:v1:central:open';
  const GEO_KEY = 'luminsdk:v1:os:geo';

  const TABS = [
    { id: 'search', name: 'Busca' },
    { id: 'apps', name: 'Aplicativos' },
    { id: 'windows', name: 'Janelas' },
    { id: 'diag', name: 'Diagnóstico' },
    { id: 'perf', name: 'Desempenho' },
    { id: 'data', name: 'Dados' },
    { id: 'help', name: 'Ajuda' },
    { id: 'about', name: 'Sobre' }
  ];

  /* uma categoria por app — é curadoria nossa, não sugestão automática */
  const CATEGORY = {
    player: 'Jogador',
    games: 'Jogos',
    arcade: 'Jogos',
    central: 'Sistema',
    vault: 'Sistema',
    settings: 'Sistema',
    about: 'Sistema',
    lab: 'Ferramentas',
    notes: 'Ferramentas',
    calc: 'Ferramentas',
    studio: 'Aparência',
    browser: 'Rede',
    sites: 'Rede',
    movies: 'Mídia',
    community: 'Social',
    chat: 'Social'
  };

  const CHANGELOG = [
    { v: 'v43', items: [
      'Correção: a animação de abertura volta a tocar no Shift+D — o script e a folha agora são globais e não dependem mais da rota carregada.',
      'Correção: a página não fica mais travada (a classe que zerava a rolagem saiu; se sobrar de sessão antiga, é limpa no boot).',
      'Animação editável: tudo em CONFIG no topo de assets/js/reveal.js (duração, cooldown, cores, textos, raridades).'
    ] },
    { v: 'v42', items: [
      'Animação de abertura no estilo Sols RNG quando Shift+D (ou o crédito do rodapé) abre o catálogo: aurora, raios, anéis, faíscas, flash e raridade sorteada.',
      'A animação dura ~2,4 s, pula com clique/tecla/Esc, espera 10 s entre uma e outra e ?anim=0 desliga.',
      'Quem usa “menos movimento” vê só o fade e o título.'
    ] },
    { v: 'v41', items: [
      'Abertura em about:blank: o portal passa a viver numa aba em branco (aba original vira google.com) — ?cloak=0 desliga.',
      'Trava de troca de janela removida: Alt+Tab, troca de aba ou sair do app não mexem mais na tela nem no crédito “Ryan Smith”.',
      'No celular o botão “Ryan Smith” do rodapé volta a aparecer e a funcionar; Shift+D é o único atalho de troca.',
      'Alt+S saiu: só Shift+D alterna estudos ⇄ site (Ctrl+AltGr+H continua mostrando o título real).'
    ] },
    { v: 'v40', items: [
      'Alt+Tab / Windows+Tab voltam aos estudos em toda troca de janela, não só na primeira: a página confere o foco a cada 0,8 s.',
      'A única saída com a trava armada continua sendo Ctrl+AltGr+H; Shift+D e o crédito “Ryan Smith” ficam desligados.',
      'Undertale abre sempre no iframe do site do Toby, nunca no GN-Math — inclusive se o catálogo entregar o endereço antigo.'
    ] },
    { v: 'v39', items: [
      'Disfarce total: qualquer aba do site usa o nome e o logotipo do StudyHub — inclusive LuminSDK, GN-Math, Sites e LuminOS.',
      'Alt+Tab / Windows+Tab devolve a página para os estudos e desliga o crédito “Ryan Smith” e os atalhos Shift+D / Alt+S.',
      'Ctrl+AltGr+H libera tudo de novo: título real, ícone real, crédito ativo e catálogo aberto.'
    ] },
    { v: 'v38', items: [
      'Quatro áreas de trabalho (Alt+1…4), alternador de janelas com Alt+` e atalhos remapeáveis.',
      'Dock editável: ordem, apps fora do dock e auto-hide, com opção de restaurar o padrão.',
      'Diagnóstico da Central mostra a área de cada janela e permite movê-la de área.'
    ] },
    { v: 'v37', items: [
      'Central: busca global, lançador de apps, gerenciador de janelas, diagnóstico, desempenho, dados, ajuda e versão.',
      'Janelas: encaixar nas laterais, centralizar, fechar todas e lembrar posição e tamanho de cada app.',
      'Direcional do controle move o foco no desktop, A ativa e B fecha a janela (fora do player).',
      'Diagnóstico classifica cada recurso como compatível, limitado, indisponível ou não testado.'
    ] },
    { v: 'v36', items: [
      'Aba Hub no site normal, com Perfil, Laboratório, Estúdio, Arcade, Cofre e Comunidade.',
      'Paleta Ctrl+K também no site e rail do celular corrigido.'
    ] },
    { v: 'v35', items: [
      'Laboratório, Estúdio, Arcade, Cofre e Comunidade dentro do LuminOS.',
      'Backup .json, códigos LUM-… e central de avisos.'
    ] },
    { v: 'v34', items: ['Perfil com XP, conquistas, desafios, coleções e retrospectiva.'] }
  ];

  const HELP = [
    {
      t: 'Como entrar no LuminOS',
      tags: 'os entrada normal boot',
      body: 'Na tela de entrada, embaixo de “Ryan Smith”, escolha <b>OS</b>. O site normal continua disponível: no menu de energia (canto direito da barra) há “Modo normal (site)”. Também existe a aba <b>Hub</b>, que abre as ferramentas sem o desktop.'
    },
    {
      t: 'Como abrir e organizar janelas',
      tags: 'janela arrastar maximizar encaixar',
      body: 'Clique num app do dock. Arraste pela barra de título, redimensione pelo canto inferior direito e use os botões de minimizar/maximizar/fechar. Na <b>Central → Janelas</b> dá para encaixar lado a lado, centralizar e fechar todas. Posição e tamanho de cada app ficam salvos.'
    },
    {
      t: 'Áreas de trabalho',
      tags: 'área workspace desktop alt 1 2 3 4 janelas',
      body: 'O desktop tem <b>quatro áreas</b> independentes: cada janela pertence a uma delas e só aparece lá. Troque com <kbd>Alt</kbd>+<kbd>1</kbd>…<kbd>4</kbd> ou pelo botão <b>Área N</b> na barra do topo — o menu mostra quantas janelas há em cada área e permite mover a janela ativa. As áreas ficam salvas no navegador.'
    },
    {
      t: 'Dock do seu jeito',
      tags: 'dock ordem esconder auto-hide ajustar',
      body: 'No fim do dock há o botão <b>Ajustar</b>: nele você muda a ordem dos apps, tira um app do dock (ele continua abrindo pela Central e pelos atalhos da mesa, e pode voltar em “Fora do dock”) e liga o <b>auto-hide</b>, que esconde o dock até o mouse chegar perto. “Restaurar padrão” desfaz tudo.'
    },
    {
      t: 'Atalhos do sistema',
      tags: 'atalho teclado remapear combinação conflito',
      body: 'Em <b>Ajustes → Atalhos internos</b> estão as ações com combinação própria (áreas, alternar janelas, fechar a janela ativa, abrir a Central). Clique em <b>mudar</b>, aperte a combinação nova e pronto; <kbd>Esc</kbd> cancela. Combinação repetida é recusada com aviso, e o ↺ volta ao padrão. Nada é capturado dentro de campos de texto.'
    },
    {
      t: 'Avisos por categoria',
      tags: 'avisos notificações categoria conquistas sistema',
      body: 'O <b>Estúdio → Avisos</b> guarda o que o sistema avisou. Dá para desligar <b>Conquistas e XP</b> ou <b>Sistema</b> separadamente: categoria desligada não é gravada — nada de fingir que o aviso existiu. O histórico tem limite de 40 itens e o botão “Limpar avisos” apaga tudo.'
    },
    {
      t: 'Navegar com controle e teclado',
      tags: 'controle gamepad teclado foco xbox acessibilidade direcional',
      body: 'Com um controle conectado no desktop, o <b>direcional</b> move o foco pelos botões da janela ativa, <b>A</b> ativa o botão focado e <b>B</b> fecha a janela. No teclado, <kbd>Tab</kbd> e <kbd>Shift+Tab</kbd> percorrem os controles e <kbd>Enter</kbd>/<kbd>Espaço</kbd> ativam. Dentro do player a navegação fica desligada: lá o controle é do jogo.'
    },
    {
      t: 'Como usar o player',
      tags: 'jogo player tela cheia recarregar',
      body: 'Abra <b>Jogos</b> e escolha um título. A barra do player tem voltar ao acervo, recarregar, abrir em outra aba e tela cheia. Se o jogo não carregar, o aviso mostra o motivo (rede bloqueada, site que recusa iframe) e oferece tentar de novo.'
    },
    {
      t: 'Como criar coleções',
      tags: 'coleção favoritos lista',
      body: 'No <b>Perfil → Jogos</b> você favorita, avalia e monta coleções. Coleções também podem ser criadas por pacotes prontos em <b>Comunidade</b>. Cada coleção gera um código <code>LUM-COLL-…</code> que outra pessoa pode importar.'
    },
    {
      t: 'Como fazer backup',
      tags: 'backup exportar importar cofre',
      body: 'Abra o <b>Cofre → Backup</b> e use “Baixar backup .json”. O arquivo leva perfil, XP, preferências, notas, pet e avisos. Para voltar, cole o JSON ou escolha o arquivo e confirme. Só chaves <code>luminsdk*</code> são aceitas.'
    },
    {
      t: 'Como personalizar o ambiente',
      tags: 'tema cor papel de parede fonte',
      body: 'O <b>Estúdio</b> muda papel de parede, cor de destaque (inclusive hex), densidade, tipografia e os modos Lite/Imersivo/sem animação/alto contraste. No site normal, a cor, a densidade e a tipografia também aparecem na aba Hub.'
    },
    {
      t: 'Testador de controle',
      tags: 'gamepad controle analógico gatilho',
      body: 'Abra <b>Laboratório → Controle</b> e aperte um botão do controle. A tela mostra eixos, gatilhos, botões e o layout escolhido. A vibração só funciona onde o navegador suporta. O teste não altera nada nos jogos.'
    },
    {
      t: 'Teclado e atalhos',
      tags: 'teclado atalho ctrl k paleta',
      body: 'A paleta abre com <b>Ctrl/⌘ + K</b> e executa comandos como abrir apps e trocar o fundo. O mapa de teclado fica em <b>Laboratório → Teclado e mouse</b> e só escuta enquanto a ferramenta está aberta.'
    },
    {
      t: 'Problemas comuns',
      tags: 'erro não abre limpar cache',
      body: 'Se algo parar de responder: recarregue com Ctrl/Cmd + Shift + R (troca o service worker). Se o catálogo não aparecer, confira a conexão — os jogos vêm de CDN externa. Em último caso, <b>Central → Dados</b> mostra o que está salvo e permite limpar só um item.'
    },
    {
      t: 'Limitações honestas',
      tags: 'limitação xbox github pages íframe',
      body: 'O site é estático (GitHub Pages): não existe conta, servidor próprio nem sincronização em nuvem. Tudo fica no seu navegador. Alguns sites recusam abrir dentro de iframe e nós avisamos em vez de fingir. No navegador do Xbox faltam APIs (compartilhar, Clipboard antigo) e o foco é navegar por controle.'
    }
  ];

  const FEATURES = [
    { id: 'js', name: 'JavaScript moderno', kind: 'read', test: function () { return typeof Promise === 'function' && typeof fetch === 'function'; } },
    { id: 'storage', name: 'localStorage', kind: 'write' },
    { id: 'idb', name: 'IndexedDB', kind: 'read' },
    { id: 'cache', name: 'Cache API', kind: 'read' },
    { id: 'sw', name: 'Service worker', kind: 'read' },
    { id: 'full', name: 'Tela cheia', kind: 'read' },
    { id: 'pad', name: 'Gamepad API', kind: 'read' },
    { id: 'clip', name: 'Clipboard', kind: 'read' },
    { id: 'share', name: 'Web Share', kind: 'read' },
    { id: 'audio', name: 'WebAudio', kind: 'read' },
    { id: 'wasm', name: 'WebAssembly', kind: 'read' },
    { id: 'css', name: 'CSS :has() + container queries', kind: 'read' }
  ];

  const view = { tab: 'search', query: '', hits: [], cursor: -1, appsQuery: '', sort: 'az', cat: '', helpQuery: '', helpOpen: '' };
  let body = null;
  let games = null;
  let sites = null;
  let longTasks = [];
  let observer = null;

  /* ---------- utilidades ---------- */
  function load(key, fallback) {
    try {
      const raw = JSON.parse(localStorage.getItem(key) || 'null');
      return raw == null ? fallback : raw;
    } catch (error) { return fallback; }
  }

  function store(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) {}
  }

  function bytes(n) {
    const value = Number(n) || 0;
    if (value < 1024) return value + ' B';
    if (value < 1048576) return (value / 1024).toFixed(1) + ' KB';
    if (value < 1073741824) return (value / 1048576).toFixed(1) + ' MB';
    return (value / 1073741824).toFixed(2) + ' GB';
  }

  function norm(text) {
    return String(text || '').toLowerCase()
      .normalize ? String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : String(text || '').toLowerCase();
  }

  function bytesOfKeys() {
    let total = 0;
    let count = 0;
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key) || '';
        total += key.length + value.length;
        count += 1;
      }
    } catch (error) {}
    return { total: total, count: count };
  }

  /* ---------- busca global ---------- */
  function history() {
    const list = load(HIST_KEY, []);
    return Array.isArray(list) ? list.filter(function (item) { return typeof item === 'string'; }).slice(0, 8) : [];
  }

  function remember(query) {
    const clean = String(query || '').trim().slice(0, 60);
    if (clean.length < 2) return;
    const list = history().filter(function (item) { return norm(item) !== norm(clean); });
    list.unshift(clean);
    store(HIST_KEY, list.slice(0, 8));
  }

  async function preload() {
    if (!games) {
      try { games = await OS.data.games(); } catch (error) { games = []; }
    }
    if (!sites) {
      try { sites = await OS.data.sites(); } catch (error) { sites = []; }
    }
    if (body && view.tab === 'search') {
      const input = body.querySelector('[data-q]');
      if (input && input.value.trim()) runSearch(input.value);
    }
  }

  function appList() {
    return (OS.listApps ? OS.listApps() : []).map(function (app) {
      return { kind: 'app', label: app.name, sub: 'Aplicativo', id: app.id };
    });
  }

  function siteList() {
    const out = [];
    (sites || []).forEach(function (family) {
      (family.sites || []).forEach(function (site) {
        out.push({ kind: 'site', label: site.name || family.name, sub: family.name + ' · site', url: site.url });
      });
    });
    return out;
  }

  function noteList() {
    let text = '';
    try { text = localStorage.getItem('luminsdk:v1:os:notes') || ''; } catch (error) {}
    if (!text.trim()) return [];
    return [{ kind: 'note', label: 'Suas notas', sub: text.replace(/\s+/g, ' ').slice(0, 70) + '…', text: text.slice(0, 200) }];
  }

  function runSearch(raw) {
    const query = String(raw || '').trim();
    view.query = query;
    const box = body.querySelector('[data-results]');
    if (!box) return;
    if (query.length < 2) {
      view.hits = [];
      paintResults();
      return;
    }
    const needle = norm(query);
    const hits = [];

    appList().forEach(function (item) {
      if (norm(item.label).indexOf(needle) >= 0) hits.push(item);
    });

    (games || []).forEach(function (game) {
      if (norm(game.n).indexOf(needle) >= 0) hits.push({ kind: 'game', label: game.n, sub: 'Jogo · ' + (game.a || 'GN-Math'), id: game.id });
    });

    siteList().forEach(function (item) {
      if (norm(item.label).indexOf(needle) >= 0 || norm(item.sub).indexOf(needle) >= 0) hits.push(item);
    });

    noteList().forEach(function (item) {
      if (norm(item.text).indexOf(needle) >= 0) hits.push(item);
    });

    HELP.forEach(function (article) {
      if (norm(article.t + ' ' + article.tags + ' ' + article.body).indexOf(needle) >= 0) {
        hits.push({ kind: 'help', label: article.t, sub: 'Ajuda', article: article });
      }
    });

    const order = { app: 0, game: 1, site: 2, note: 3, help: 4 };
    hits.sort(function (a, b) {
      const byKind = (order[a.kind] || 9) - (order[b.kind] || 9);
      if (byKind !== 0) return byKind;
      return norm(a.label).indexOf(needle) - norm(b.label).indexOf(needle) || a.label.localeCompare(b.label);
    });

    view.hits = hits.slice(0, 24);
    view.cursor = -1;
    paintResults();
  }

  function openHit(hit) {
    if (!hit) return;
    if (hit.kind === 'app') OS.open(hit.id);
    else if (hit.kind === 'game') OS.play(hit.id);
    else if (hit.kind === 'site') OS.ui.openUrl(hit.url);
    else if (hit.kind === 'note') OS.open('notes');
    else if (hit.kind === 'help') {
      view.tab = 'help';
      view.helpQuery = '';
      view.helpOpen = hit.article.t;
      paint();
      return;
    }
    if (view.query) remember(view.query);
  }

  function paintResults() {
    const box = body.querySelector('[data-results]');
    if (!box) return;
    const hist = history();
    if (view.query.trim().length < 2) {
      box.innerHTML = [
        hist.length ? '<div class="kp-card"><h3>Buscas recentes</h3><div class="kp-row">' +
          hist.map(function (item) { return '<button class="kp-btn" type="button" data-hist="' + esc(item) + '">' + esc(item) + '</button>'; }).join('') +
          '<button class="kp-btn kp-danger" type="button" data-hist-clear>limpar</button></div></div>' : '',
        '<div class="kp-card"><h3>Atalhos rápidos</h3><div class="kp-list">',
        appList().slice(0, 6).map(function (item) {
          return '<button class="kp-item" type="button" data-quick="' + esc(item.id) + '" style="cursor:pointer;text-align:left">' +
            '<span class="kp-grow">' + esc(item.label) + '</span><small>aplicativo</small></button>';
        }).join(''),
        '</div><p class="kp-note">Digite pelo menos duas letras para buscar em aplicativos, jogos, sites, suas notas e a ajuda.</p></div>'
      ].join('');

      box.querySelectorAll('[data-quick]').forEach(function (button) {
        button.addEventListener('click', function () { OS.open(button.dataset.quick); });
      });

      box.querySelectorAll('[data-hist]').forEach(function (button) {
        button.addEventListener('click', function () {
          const input = body.querySelector('[data-q]');
          if (input) { input.value = button.dataset.hist; runSearch(button.dataset.hist); }
        });
      });
      const clear = box.querySelector('[data-hist-clear]');
      if (clear) clear.addEventListener('click', function () {
        store(HIST_KEY, []);
        paintResults();
        toast('Histórico de busca limpo.');
      });
      return;
    }

    if (!view.hits.length) {
      box.innerHTML = '<div class="kp-card"><h3>Sem resultados</h3><p class="kp-note">Nada encontrado para “' + esc(view.query) + '”. Tente outro termo ou confira a <b>Ajuda</b>.</p></div>';
      return;
    }

    const groups = {};
    view.hits.forEach(function (hit) { (groups[hit.kind] = groups[hit.kind] || []).push(hit); });
    const titles = { app: 'Aplicativos', game: 'Jogos', site: 'Sites', note: 'Notas', help: 'Ajuda' };

    box.innerHTML = Object.keys(groups).map(function (kind) {
      return '<div class="kp-card"><h3>' + titles[kind] + ' · ' + groups[kind].length + '</h3><div class="kp-list">' +
        groups[kind].map(function (hit) {
          const position = view.hits.indexOf(hit);
          return '<button class="kp-item" type="button" data-hit="' + position + '" style="cursor:pointer;text-align:left">' +
            '<span class="kp-grow">' + esc(hit.label) + '</span><small>' + esc(hit.sub) + '</small></button>';
        }).join('') + '</div></div>';
    }).join('');

    box.querySelectorAll('[data-hit]').forEach(function (button) {
      button.addEventListener('click', function () { openHit(view.hits[Number(button.dataset.hit)]); });
    });
  }

  function paintSearch(box) {
    const hist = history();
    box.innerHTML = [
      '<section class="kp-card"><h3>Busca global</h3>',
      '<input class="kp-field" type="search" data-q placeholder="jogo, app, site, nota, ajuda…" aria-label="Buscar em tudo" value="' + esc(view.query) + '">',
      '<div class="kp-row"><span class="kp-note">↑ ↓ para navegar · Enter abre · Esc limpa</span></div>',
      '</section>',
      '<div data-results></div>',
      hist.length ? '' : ''
    ].join('');

    const input = box.querySelector('[data-q]');
    input.addEventListener('input', function () { runSearch(input.value); });
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { input.value = ''; runSearch(''); return; }
      if (!view.hits.length) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const last = view.hits.length - 1;
        view.cursor = event.key === 'ArrowDown'
          ? (view.cursor >= last ? 0 : view.cursor + 1)
          : (view.cursor <= 0 ? last : view.cursor - 1);
        const active = box.querySelector('[data-hit="' + view.cursor + '"]');
        if (active) active.focus();
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        openHit(view.hits[view.cursor]);
      }
    });

    /* com o foco já num resultado, as setas continuam navegando e Esc volta pra busca */
    const results = box.querySelector('[data-results]');
    if (results) results.addEventListener('keydown', function (event) {
      const hit = event.target && event.target.closest ? event.target.closest('[data-hit]') : null;
      if (!hit) return;
      const index = Number(hit.dataset.hit);
      if (event.key === 'Escape') {
        event.preventDefault();
        input.focus();
        input.value = '';
        runSearch('');
        return;
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const last = view.hits.length - 1;
        const next = event.key === 'ArrowDown' ? (index >= last ? 0 : index + 1) : (index <= 0 ? last : index - 1);
        view.cursor = next;
        const target = box.querySelector('[data-hit="' + next + '"]');
        if (target) target.focus();
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        openHit(view.hits[index]);
      }
    });
    paintResults();
    preload();
    if (view.query) setTimeout(function () { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }, 30);
  }

  /* ---------- aplicativos ---------- */
  function openedCounts() {
    const data = load(OPEN_KEY, {});
    return data && typeof data === 'object' ? data : {};
  }

  function bumpOpen(id) {
    const data = openedCounts();
    data[id] = (Number(data[id]) || 0) + 1;
    store(OPEN_KEY, data);
  }

  function paintApps(box) {
    const pins = load(PIN_KEY, []);
    const counts = openedCounts();
    const query = norm(view.appsQuery);
    let list = (OS.listApps ? OS.listApps() : []).filter(function (app) {
      if (view.cat && CATEGORY[app.id] !== view.cat) return false;
      return !query || norm(app.name + ' ' + app.id).indexOf(query) >= 0;
    });

    if (view.sort === 'az') list.sort(function (a, b) { return a.name.localeCompare(b.name); });
    else if (view.sort === 'uso') list.sort(function (a, b) { return (counts[b.id] || 0) - (counts[a.id] || 0) || a.name.localeCompare(b.name); });
    else list.sort(function (a, b) { return (pins.indexOf(b.id) >= 0 ? 1 : 0) - (pins.indexOf(a.id) >= 0 ? 1 : 0) || a.name.localeCompare(b.name); });

    box.innerHTML = [
      '<section class="kp-card"><h3>Aplicativos</h3>',
      '<input class="kp-field" type="search" data-apps-q placeholder="filtrar aplicativos…" aria-label="Filtrar aplicativos" value="' + esc(view.appsQuery) + '">',
      '<div class="kp-row">',
      ['', 'Jogos', 'Ferramentas', 'Rede', 'Social', 'Sistema'].map(function (cat) {
        return '<button class="kp-btn' + (view.cat === cat ? ' is-on' : '') + '" type="button" data-cat="' + esc(cat) + '">' +
          (cat || 'Todas') + '</button>';
      }).join(''),
      '</div>',
      '<div class="kp-row">',
      ['az', 'uso', 'fixados'].map(function (mode) {
        const names = { az: 'A–Z', uso: 'Mais usados', fixados: 'Fixados' };
        return '<button class="kp-btn' + (view.sort === mode ? ' is-on' : '') + '" type="button" data-sort="' + mode + '">' + names[mode] + '</button>';
      }).join(''),
      '</div></section>',
      '<section class="kp-card"><h3>Grade</h3><div class="kp-list" data-apps>',
      list.length ? list.map(function (app) {
        const pinned = pins.indexOf(app.id) >= 0;
        const open = !!(OS.state && OS.state.windows && OS.state.windows[app.id]);
        return '<div class="kp-item ct-app"><span class="kp-grow" style="display:flex;align-items:center;gap:8px;min-width:0">' +
          (OS.icon ? OS.icon(app.id) : '') +
          '<b style="font-weight:600;overflow:hidden;text-overflow:ellipsis">' + esc(app.name) + '</b>' +
          (open ? '<small style="color:#4ade80">aberto</small>' : '') +
          '</span>' +
          '<small>' + (counts[app.id] || 0) + '×</small>' +
          '<button class="kp-btn" type="button" data-pin="' + esc(app.id) + '">' + (pinned ? 'desafixar' : 'fixar') + '</button>' +
          '<button class="kp-btn kp-btn--primary" type="button" data-open="' + esc(app.id) + '">abrir</button></div>';
      }).join('') : '<p class="kp-empty">Nada com esse filtro.</p>',
      '</div></section>',
      '<p class="kp-note">Fixar marca o app no topo quando a ordem é “Fixados”. A contagem é de aberturas feitas <b>por aqui</b>.</p>'
    ].join('');

    box.querySelector('[data-apps-q]').addEventListener('input', function (event) {
      view.appsQuery = event.target.value;
      paintApps(box);
      const input = box.querySelector('[data-apps-q]');
      if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
    });

    box.querySelectorAll('[data-sort]').forEach(function (button) {
      button.addEventListener('click', function () { view.sort = button.dataset.sort; paint(); });
    });

    box.querySelectorAll('[data-cat]').forEach(function (button) {
      button.addEventListener('click', function () {
        view.cat = view.cat === button.dataset.cat ? '' : button.dataset.cat;
        paint();
      });
    });

    box.querySelectorAll('[data-open]').forEach(function (button) {
      button.addEventListener('click', function () {
        bumpOpen(button.dataset.open);
        OS.open(button.dataset.open);
        paint();
      });
    });

    box.querySelectorAll('[data-pin]').forEach(function (button) {
      button.addEventListener('click', function () {
        const id = button.dataset.pin;
        const current = load(PIN_KEY, []);
        const index = current.indexOf(id);
        if (index >= 0) current.splice(index, 1);
        else current.push(id);
        store(PIN_KEY, current.slice(0, 24));
        paint();
      });
    });
  }

  /* ---------- janelas ---------- */
  function paintWindows(box) {
    const list = OS.listWindows ? OS.listWindows() : [];
    const geo = load(GEO_KEY, {});
    const ws = OS.workspaces || null;
    const current = ws ? ws.current() : 1;
    const total = ws ? ws.total : 1;
    const areas = [];
    for (let n = 1; n <= total; n += 1) {
      const count = ws ? ws.list(n).length : 0;
      areas.push('<button class="kp-btn' + (n === current ? ' is-on' : '') + '" type="button" data-ws-go="' + n + '">' +
        'Área ' + n + (count ? ' · ' + count : '') + '</button>');
    }
    box.innerHTML = [
      '<section class="kp-card"><h3>Áreas de trabalho</h3><div class="kp-row">' + areas.join('') + '</div>',
      '<p class="kp-note">Cada área tem as suas janelas. O app abre na área em que você está; o botão “área N” na lista move a janela para a próxima.</p></section>',
      '<section class="kp-card"><h3>Janelas abertas · ' + list.length + '</h3>',
      list.length ? '<div class="kp-list">' + list.map(function (item) {
        return '<div class="kp-item' + (item.away ? ' is-away' : '') + '"><b class="kp-grow" style="min-width:0;overflow:hidden;text-overflow:ellipsis">' + esc(item.name) + '</b>' +
          (item.focused ? '<small style="color:#4ade80">em foco</small>' : '') +
          (ws ? '<button class="kp-btn" type="button" data-ws-cycle="' + esc(item.id) + '" title="Mover para a próxima área">área ' + item.ws + '</button>' : '') +
          (item.min ? '<small>minimizada</small>' : '') +
          (item.max ? '<small>maximizada</small>' : '') +
          '<button class="kp-btn" type="button" data-focus="' + esc(item.id) + '">focar</button>' +
          '<button class="kp-btn" type="button" data-snap="' + esc(item.id) + '" data-where="left">esquerda</button>' +
          '<button class="kp-btn" type="button" data-snap="' + esc(item.id) + '" data-where="right">direita</button>' +
          '<button class="kp-btn" type="button" data-center="' + esc(item.id) + '">centro</button>' +
          '<button class="kp-btn kp-danger" type="button" data-close="' + esc(item.id) + '">fechar</button></div>';
      }).join('') + '</div>' : '<p class="kp-empty">Nenhuma janela aberta. Abra um app no dock ou na aba Aplicativos.</p>',
      '<div class="kp-row">',
      '<button class="kp-btn" type="button" data-all-close>Fechar todas</button>',
      '<button class="kp-btn" type="button" data-cascade>Cascata</button>',
      '<button class="kp-btn" type="button" data-save-geo>Salvar posições</button>',
      '<button class="kp-btn" type="button" data-reset-geo>Esquecer posições</button>',
      '</div></section>',
      '<section class="kp-card"><h3>Posições salvas</h3>',
      Object.keys(geo).length ? '<div class="kp-list">' + Object.keys(geo).sort().map(function (id) {
        const item = geo[id] || {};
        return '<div class="kp-item"><span class="kp-grow">' + esc(id) + '</span><small>' +
          Math.round(item.w || 0) + '×' + Math.round(item.h || 0) + '</small></div>';
      }).join('') + '</div>' : '<p class="kp-empty">Ainda nada salvo. Ao fechar uma janela, posição e tamanho são guardados automaticamente.</p>',
      '</section>'
    ].join('');

    const after = function (message) {
      if (message) toast(message);
      paint();
    };

    box.querySelectorAll('[data-ws-go]').forEach(function (button) {
      button.addEventListener('click', function () {
        if (OS.workspaces) OS.workspaces.set(Number(button.dataset.wsGo));
        after();
      });
    });

    box.querySelectorAll('[data-ws-cycle]').forEach(function (button) {
      button.addEventListener('click', function () {
        const found = list.find(function (item) { return item.id === button.dataset.wsCycle; });
        if (!found) return;
        const next = (found.ws % (ws ? ws.total : 1)) + 1;
        if (OS.workspaces) OS.workspaces.move(found.id, next);
        after();
      });
    });

    box.querySelectorAll('[data-focus]').forEach(function (button) {
      button.addEventListener('click', function () { OS.focusWindow(button.dataset.focus); after(); });
    });
    box.querySelectorAll('[data-snap]').forEach(function (button) {
      button.addEventListener('click', function () { OS.snapWindow(button.dataset.snap, button.dataset.where); after(); });
    });
    box.querySelectorAll('[data-center]').forEach(function (button) {
      button.addEventListener('click', function () { OS.centerWindow(button.dataset.center); after(); });
    });
    box.querySelectorAll('[data-close]').forEach(function (button) {
      button.addEventListener('click', function () { OS.closeWindow(button.dataset.close); after(); });
    });
    box.querySelector('[data-all-close]').addEventListener('click', function () {
      if (OS.listWindows().length && !window.confirm('Fechar todas as janelas abertas?')) return;
      if (OS.closeAllWindows) OS.closeAllWindows();
      after('Janelas fechadas.');
    });
    box.querySelector('[data-cascade]').addEventListener('click', function () {
      if (OS.cascadeWindows) OS.cascadeWindows();
      after('Janelas reorganizadas.');
    });
    box.querySelector('[data-save-geo]').addEventListener('click', function () {
      if (OS.saveAllGeometry) OS.saveAllGeometry();
      after('Posições salvas.');
    });
    box.querySelector('[data-reset-geo]').addEventListener('click', function () {
      if (!window.confirm('Esquecer as posições salvas das janelas?')) return;
      try { localStorage.removeItem(GEO_KEY); } catch (error) {}
      after('Posições esquecidas.');
    });
  }

  /* ---------- diagnóstico ---------- */
  const status = {};

  function runFeature(feature) {
    try {
      if (feature.id === 'storage') {
        const probe = '__lum_probe__';
        localStorage.setItem(probe, '1');
        localStorage.removeItem(probe);
        return { state: 'ok', note: bytesOfKeys().count + ' chaves em uso' };
      }
      if (feature.id === 'idb') {
        if (!window.indexedDB) return { state: 'indisponivel' };
        return { state: 'ok', note: 'API presente' };
      }
      if (feature.id === 'cache') {
        if (!window.caches) return { state: 'indisponivel' };
        return { state: 'ok', note: 'API presente' };
      }
      if (feature.id === 'sw') {
        if (!navigator.serviceWorker) return { state: 'indisponivel' };
        return { state: navigator.serviceWorker.controller ? 'ok' : 'limitado', note: navigator.serviceWorker.controller ? 'casca em cache' : 'sem controller ativo' };
      }
      if (feature.id === 'full') {
        if (!document.fullscreenEnabled) return { state: 'indisponivel' };
        return { state: 'ok', note: 'document.fullscreenEnabled' };
      }
      if (feature.id === 'pad') {
        if (!navigator.getGamepads) return { state: 'indisponivel' };
        const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
        return { state: 'ok', note: pads.length ? pads.length + ' controle(s) conectado(s)' : 'nenhum controle agora' };
      }
      if (feature.id === 'clip') {
        if (!navigator.clipboard) return { state: 'indisponivel' };
        return { state: 'ok', note: 'writeText disponível' };
      }
      if (feature.id === 'share') {
        if (!navigator.share) return { state: 'indisponivel', note: 'comum no Xbox' };
        return { state: 'ok' };
      }
      if (feature.id === 'audio') {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        return Ctor ? { state: 'ok' } : { state: 'indisponivel' };
      }
      if (feature.id === 'wasm') {
        return typeof WebAssembly === 'object' ? { state: 'ok' } : { state: 'indisponivel' };
      }
      if (feature.id === 'css') {
        if (!window.CSS || !CSS.supports) return { state: 'indisponivel' };
        const has = CSS.supports('selector(:has(*))');
        const container = CSS.supports('container-type: inline-size');
        if (has && container) return { state: 'ok' };
        if (has || container) return { state: 'limitado', note: (has ? ':has() ' : '') + (container ? 'container queries' : '') };
        return { state: 'indisponivel' };
      }
      if (typeof feature.test === 'function') {
        return feature.test() ? { state: 'ok' } : { state: 'indisponivel' };
      }
    } catch (error) {
      return { state: 'indisponivel', note: error.message.slice(0, 40) };
    }
    return { state: 'nao-testado' };
  }

  function paintDiag(box) {
    let conn = null;
    try { conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection; } catch (error) {}
    const info = [
      ['Navegador', navigator.userAgent.replace(/\s+/g, ' ').slice(0, 110)],
      ['Plataforma', navigator.platform || 'não informado'],
      ['Idioma', navigator.language || '—'],
      ['Fuso', (function () { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (error) { return '—'; } })()],
      ['Janela', window.innerWidth + '×' + window.innerHeight + ' @' + (window.devicePixelRatio || 1) + 'x'],
      ['Tela', screen.width + '×' + screen.height],
      ['Conexão', navigator.onLine ? 'online' : 'offline'],
      ['Rede estimada', conn ? (conn.effectiveType || '—') + (conn.downlink ? ' · ~' + conn.downlink + ' Mb/s' : '') + (conn.rtt ? ' · ' + conn.rtt + ' ms' : '') : 'API não exposta'],
      ['Núcleos', navigator.hardwareConcurrency ? navigator.hardwareConcurrency + ' thread(s)' : 'não informado'],
      ['Memória (aprox.)', navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'não informado']
    ];

    box.innerHTML = [
      '<section class="kp-card"><h3>Recursos do navegador</h3>',
      '<p class="kp-note">Cada item é testado na sua máquina. “Não testado” é diferente de “indisponível”.</p>',
      '<div class="kp-row"><button class="kp-btn kp-btn--primary" type="button" data-test-all>Testar tudo</button></div>',
      '<div class="kp-list ct-list">' + FEATURES.map(function (feature) {
        const result = status[feature.id] || { state: 'nao-testado' };
        const map = { ok: 'compatível', limitado: 'limitado', indisponivel: 'indisponível', 'nao-testado': 'não testado' };
        const color = { ok: '#4ade80', limitado: '#fbbf24', indisponivel: '#f87171', 'nao-testado': '#7f7f96' };
        return '<div class="kp-item ct-diag"><span style="color:' + color[result.state] + '">●</span>' +
          '<span class="kp-grow">' + esc(feature.name) + '</span>' +
          (result.note ? '<small class="ct-note">' + esc(result.note) + '</small>' : '') +
          '<small class="ct-state" style="min-width:74px;text-align:right">' + map[result.state] + '</small></div>';
      }).join('') + '</div></section>',

      '<section class="kp-card"><h3>Ambiente</h3><div class="kp-list">' + info.map(function (pair) {
        return '<div class="kp-item"><b style="min-width:112px">' + esc(pair[0]) + '</b><span class="kp-grow" style="word-break:break-word">' + esc(pair[1]) + '</span></div>';
      }).join('') + '</div></section>',

      '<section class="kp-card"><h3>Armazenamento estimado</h3><div class="kp-stats">',
      '<div class="kp-stat"><b data-usage>—</b><span>usado</span></div>',
      '<div class="kp-stat"><b data-quota>—</b><span>cota</span></div>',
      '<div class="kp-stat"><b data-persist>—</b><span>persistente</span></div>',
      '</div><p class="kp-note">Estimativas do navegador; podem variar bastante entre aparelhos.</p></section>'
    ].join('');

    const paintStorage = function () {
      if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then(function (info2) {
          const usage = box.querySelector('[data-usage]');
          const quota = box.querySelector('[data-quota]');
          if (usage) usage.textContent = bytes(info2.usage || 0);
          if (quota) quota.textContent = bytes(info2.quota || 0);
        }, function () {});
      }
      if (navigator.storage && navigator.storage.persisted) {
        navigator.storage.persisted().then(function (value) {
          const node = box.querySelector('[data-persist]');
          if (node) node.textContent = value ? 'sim' : 'não';
        }, function () {
          const node = box.querySelector('[data-persist]');
          if (node) node.textContent = 'n/d';
        });
      } else {
        const node = box.querySelector('[data-persist]');
        if (node) node.textContent = 'n/d';
      }
    };
    paintStorage();

    box.querySelector('[data-test-all]').addEventListener('click', function () {
      FEATURES.forEach(function (feature) { status[feature.id] = runFeature(feature); });
      paint();
      toast('Testes concluídos.');
    });
  }

  /* ---------- desempenho ---------- */
  function paintPerf(box) {
    const nav = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || null;
    const resources = (performance.getEntriesByType && performance.getEntriesByType('resource')) || [];
    const transferred = resources.reduce(function (sum, item) { return sum + (item.transferSize || 0); }, 0);
    const decoded = resources.reduce(function (sum, item) { return sum + (item.decodedBodySize || 0); }, 0);
    const byType = {};
    resources.forEach(function (item) {
      const type = item.initiatorType || 'outro';
      byType[type] = (byType[type] || 0) + 1;
    });
    const memory = performance.memory || null;

    box.innerHTML = [
      '<section class="kp-card"><h3>Carregamento desta página</h3>',
      nav ? '<div class="kp-stats">' +
        '<div class="kp-stat"><b>' + Math.round(nav.domContentLoadedEventEnd || 0) + ' ms</b><span>DOM pronto</span></div>' +
        '<div class="kp-stat"><b>' + Math.round(nav.loadEventEnd || 0) + ' ms</b><span>load</span></div>' +
        '<div class="kp-stat"><b>' + Math.round(nav.responseEnd || 0) + ' ms</b><span>resposta</span></div>' +
        '<div class="kp-stat"><b>' + bytes(nav.transferSize || 0) + '</b><span>HTML</span></div>' +
        '</div>' : '<p class="kp-note">O navegador não expôs a Navigation Timing API.</p>',
      '<p class="kp-note">Medido desde o início da navegação; varia com rede, cache e aparelho.</p></section>',

      '<section class="kp-card"><h3>Recursos</h3><div class="kp-stats">',
      '<div class="kp-stat"><b>' + resources.length + '</b><span>requisições</span></div>',
      '<div class="kp-stat"><b>' + bytes(transferred) + '</b><span>transferido</span></div>',
      '<div class="kp-stat"><b>' + bytes(decoded) + '</b><span>descomprimido</span></div>',
      '<div class="kp-stat"><b>' + document.getElementsByTagName('*').length + '</b><span>nós no DOM</span></div>',
      '</div>',
      '<div class="kp-list">' + Object.keys(byType).sort(function (a, b) { return byType[b] - byType[a]; }).map(function (type) {
        return '<div class="kp-item"><span class="kp-grow">' + esc(type) + '</span><small>' + byType[type] + '</small></div>';
      }).join('') + '</div></section>',

      '<section class="kp-card"><h3>Animação</h3>',
      '<p class="kp-note">Mede 2 segundos de quadros com requestAnimationFrame. Navegador em segundo plano congela a medição — mantenha esta aba visível.</p>',
      '<p class="kp-note">Dica real: partículas e parallax do fundo são o que mais pesa. No site normal, <b>Configurações → Efeitos</b> tem os interruptores “Partículas”, “Fundo animado” e “Modo leve”; medir de novo depois mostra a diferença.</p>',
      '<div class="kp-row"><button class="kp-btn kp-btn--primary" type="button" data-fps>Medir FPS</button><span class="kp-grow" data-fps-out>—</span></div></section>',

      '<section class="kp-card"><h3>Tarefas longas</h3>',
      '<p class="kp-note">PerformanceObserver “longtask” registra bloqueios acima de 50 ms enquanto esta aba está aberta. Não é suportado em todos os navegadores.</p>',
      '<div class="kp-row"><button class="kp-btn" type="button" data-long>Observar por 5 s</button><button class="kp-btn" type="button" data-long-clear>Limpar</button></div>',
      '<div class="kp-list" data-long-out><p class="kp-empty">Nada coletado ainda.</p></div></section>',

      '<section class="kp-card"><h3>Memória (quando exposta)</h3>',
      memory ? '<div class="kp-stats"><div class="kp-stat"><b>' + bytes(memory.usedJSHeapSize) + '</b><span>heap JS</span></div>' +
        '<div class="kp-stat"><b>' + bytes(memory.jsHeapSizeLimit) + '</b><span>limite</span></div></div>' :
        '<p class="kp-note">Este navegador não expõe <code>performance.memory</code> (comum fora do Chromium). Não inventamos números.</p></section>'
    ].join('');

    box.querySelector('[data-fps]').addEventListener('click', function () {
      const out = box.querySelector('[data-fps-out]');
      out.textContent = 'medindo…';
      let frames = 0;
      let worst = 0;
      let last = performance.now();
      const start = last;
      const step = function (now) {
        frames += 1;
        const delta = now - last;
        if (delta > worst) worst = delta;
        last = now;
        if (now - start < 2000) { requestAnimationFrame(step); return; }
        const fps = frames / ((now - start) / 1000);
        out.textContent = fps.toFixed(1) + ' fps · pior quadro ' + Math.round(worst) + ' ms';
      };
      requestAnimationFrame(step);
    });

    box.querySelector('[data-long]').addEventListener('click', function () {
      const out = box.querySelector('[data-long-out]');
      longTasks = [];
      if (!window.PerformanceObserver) {
        out.innerHTML = '<p class="kp-empty">PerformanceObserver não existe neste navegador.</p>';
        return;
      }
      try {
        if (observer) observer.disconnect();
        observer = new PerformanceObserver(function (list) {
          list.getEntries().forEach(function (entry) { longTasks.push(Math.round(entry.duration)); });
          if (out) {
            out.innerHTML = longTasks.length
              ? longTasks.slice(-8).reverse().map(function (value) { return '<div class="kp-item"><span class="kp-grow">bloqueio de ' + value + ' ms</span></div>'; }).join('')
              : '<p class="kp-empty">Nenhuma tarefa longa nos últimos segundos.</p>';
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
        out.innerHTML = '<p class="kp-empty">observando…</p>';
        setTimeout(function () {
          if (observer) observer.disconnect();
          observer = null;
          if (out && !longTasks.length) out.innerHTML = '<p class="kp-empty">Nenhuma tarefa longa em 5 s.</p>';
        }, 5000);
      } catch (error) {
        out.innerHTML = '<p class="kp-empty">Este navegador recusou observar longtask.</p>';
      }
    });

    box.querySelector('[data-long-clear]').addEventListener('click', function () {
      longTasks = [];
      const out = box.querySelector('[data-long-out]');
      if (out) out.innerHTML = '<p class="kp-empty">Nada coletado ainda.</p>';
    });
  }

  /* ---------- dados ---------- */
  function paintData(box) {
    const rows = [];
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key) || '';
        rows.push({ key: key, size: key.length + value.length, mine: key.indexOf('luminsdk') === 0 });
      }
    } catch (error) {}
    rows.sort(function (a, b) { return b.size - a.size; });
    const total = rows.reduce(function (sum, row) { return sum + row.size; }, 0);

    box.innerHTML = [
      '<section class="kp-card"><h3>O que está salvo · ' + bytes(total) + '</h3>',
      '<p class="kp-note">Chaves com o prefixo <code>luminsdk</code> são nossas; as outras são de scripts do site. Apagar exige confirmação.</p>',
      '<div class="kp-list">' + (rows.length ? rows.map(function (row) {
        return '<div class="kp-item"><span class="kp-grow" style="word-break:break-all">' + esc(row.key) + (row.mine ? '' : ' <small>(do site)</small>') + '</span>' +
          '<small>' + bytes(row.size) + '</small>' +
          '<button class="kp-btn" type="button" data-del="' + esc(row.key) + '">apagar</button></div>';
      }).join('') : '<p class="kp-empty">Nada salvo ainda.</p>') + '</div></section>',

      '<section class="kp-card"><h3>Cache do aplicativo</h3>',
      '<p class="kp-note">Caches criados pelo service worker. Limpar força baixar a casca de novo na próxima visita.</p>',
      '<div class="kp-row"><button class="kp-btn" type="button" data-cache-clear>Limpar cache</button>' +
      '<button class="kp-btn" type="button" data-cache-list>Listar caches</button></div>',
      '<div class="kp-list" data-cache-out><p class="kp-empty">—</p></div></section>',

      '<section class="kp-card"><h3>Restaurar</h3>',
      '<p class="kp-note">Antes de apagar tudo, exporte um backup no <b>Cofre</b>. Estas ações não têm desfazer.</p>',
      '<div class="kp-row"><button class="kp-btn" type="button" data-reset-prefs>Voltar aparência ao padrão</button>' +
      '<button class="kp-btn kp-danger" type="button" data-wipe>Apagar dados do LuminSDK</button></div></section>'
    ].join('');

    box.querySelectorAll('[data-del]').forEach(function (button) {
      button.addEventListener('click', function () {
        const key = button.dataset.del;
        if (!window.confirm('Apagar “' + key + '”? Isso não tem desfazer.')) return;
        try { localStorage.removeItem(key); } catch (error) {}
        toast('Item apagado.');
        paint();
      });
    });

    box.querySelector('[data-cache-list]').addEventListener('click', function () {
      const out = box.querySelector('[data-cache-out]');
      if (!window.caches) { out.innerHTML = '<p class="kp-empty">Cache API indisponível.</p>'; return; }
      caches.keys().then(function (keys) {
        out.innerHTML = keys.length ? keys.map(function (key) { return '<div class="kp-item"><span class="kp-grow">' + esc(key) + '</span></div>'; }).join('') : '<p class="kp-empty">Nenhum cache criado.</p>';
      }, function () { out.innerHTML = '<p class="kp-empty">Não deu para listar.</p>'; });
    });

    box.querySelector('[data-cache-clear]').addEventListener('click', function () {
      if (!window.caches) { toast('Cache API indisponível.'); return; }
      if (!window.confirm('Limpar os caches do site? O próximo acesso baixa tudo de novo.')) return;
      caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (key) { return caches.delete(key); }));
      }).then(function () {
        toast('Cache limpo.');
      }, function () {
        toast('Não deu para limpar o cache.');
      });
    });

    box.querySelector('[data-reset-prefs]').addEventListener('click', function () {
      if (!window.confirm('Voltar papel de parede, cor, densidade e efeitos ao padrão?')) return;
      OS.ui.savePrefs({ wall: 'aurora', accent: 'violeta', accentHex: '', density: 'confortavel', font: 'padrao', lite: false, immersive: false, motion: true, contrast: false });
      toast('Aparência restaurada.');
      paint();
    });

    box.querySelector('[data-wipe]').addEventListener('click', function () {
      if (!window.confirm('Apagar todos os dados do LuminSDK neste navegador?')) return;
      const keys = [];
      try {
        for (let i = 0; i < localStorage.length; i += 1) {
          const key = localStorage.key(i);
          if (key && key.indexOf('luminsdk') === 0) keys.push(key);
        }
      } catch (error) {}
      keys.forEach(function (key) { try { localStorage.removeItem(key); } catch (error) {} });
      toast('Dados apagados. Recarregando…');
      setTimeout(function () { window.location.reload(); }, 700);
    });
  }

  /* ---------- ajuda ---------- */
  function paintHelp(box) {
    const query = norm(view.helpQuery);
    const list = HELP.filter(function (article) {
      return !query || norm(article.t + ' ' + article.tags + ' ' + article.body).indexOf(query) >= 0;
    });

    box.innerHTML = [
      '<section class="kp-card"><h3>Ajuda</h3>',
      '<input class="kp-field" type="search" data-help-q placeholder="buscar na documentação…" aria-label="Buscar na ajuda" value="' + esc(view.helpQuery) + '">',
      '<p class="kp-note">' + list.length + ' de ' + HELP.length + ' artigos. Texto curto e direto, sem promessa que o site não cumpre.</p></section>',
      list.length ? list.map(function (article) {
        const open = view.helpOpen === article.t;
        return '<details class="kp-card" data-article="' + esc(article.t) + '"' + (open ? ' open' : '') + '>' +
          '<summary style="cursor:pointer;font-weight:600;font-size:.8rem">' + esc(article.t) + '</summary>' +
          '<p style="margin-top:8px">' + article.body + '</p></details>';
      }).join('') : '<section class="kp-card"><h3>Sem resultados</h3><p class="kp-note">Nada encontrado para “' + esc(view.helpQuery) + '”. Tente “janela”, “backup” ou “controle”.</p></section>'
    ].join('');

    box.querySelector('[data-help-q]').addEventListener('input', function (event) {
      view.helpQuery = event.target.value;
      paintHelp(box);
      const input = box.querySelector('[data-help-q]');
      if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
    });

    box.querySelectorAll('[data-article]').forEach(function (node) {
      node.addEventListener('toggle', function () {
        if (node.open) view.helpOpen = node.dataset.article;
        else if (view.helpOpen === node.dataset.article) view.helpOpen = '';
      });
    });
  }

  /* ---------- sobre ---------- */
  function paintAbout(box) {
    const totals = bytesOfKeys();
    box.innerHTML = [
      '<section class="kp-card"><h3>LuminSDK · ' + VERSION + '</h3>',
      '<p class="kp-note">Site de jogos, portal de estudos e uma área de trabalho que roda inteira no navegador. Sem conta, sem servidor próprio, sem rastreamento.</p>',
      '<div class="kp-stats">',
      '<div class="kp-stat"><b>' + totals.count + '</b><span>chaves locais</span></div>',
      '<div class="kp-stat"><b>' + bytes(totals.total) + '</b><span>dados salvos</span></div>',
      '<div class="kp-stat"><b>' + (OS.listApps ? OS.listApps().length : 0) + '</b><span>apps no OS</span></div>',
      '<div class="kp-stat"><b>' + HELP.length + '</b><span>artigos de ajuda</span></div>',
      '</div></section>',

      '<section class="kp-card"><h3>Novidades</h3><div class="kp-list">' + CHANGELOG.map(function (entry) {
        return '<div class="kp-item" style="align-items:flex-start"><b style="min-width:42px">' + entry.v + '</b>' +
          '<span class="kp-grow">' + entry.items.map(function (item) { return '• ' + esc(item); }).join('<br>') + '</span></div>';
      }).join('') + '</div></section>',

      '<section class="kp-card"><h3>Tecnologia</h3><div class="kp-list">',
      '<div class="kp-item"><b style="min-width:96px">HTML/CSS/JS</b><span class="kp-grow">sem framework e sem build</span></div>',
      '<div class="kp-item"><b style="min-width:96px">Armazenamento</b><span class="kp-grow">localStorage, Cache API e service worker</span></div>',
      '<div class="kp-item"><b style="min-width:96px">Jogos</b><span class="kp-grow">catálogo GN-Math e o player do LuminSDK (CDN)</span></div>',
      '<div class="kp-item"><b style="min-width:96px">Hospedagem</b><span class="kp-grow">GitHub Pages (estático)</span></div>',
      '</div></section>',

      '<section class="kp-card"><h3>Limitações conhecidas</h3><div class="kp-list">',
      '<div class="kp-item"><span class="kp-grow">Não existe conta nem sincronização: cada navegador tem os seus dados.</span></div>',
      '<div class="kp-item"><span class="kp-grow">Sites externos podem recusar iframe; avisamos em vez de forçar.</span></div>',
      '<div class="kp-item"><span class="kp-grow">Sem backend, chat e presença dependem de um relay público (ntfy) quando disponível.</span></div>',
      '<div class="kp-item"><span class="kp-grow">No navegador do Xbox algumas APIs faltam (compartilhar, clipboard antigo).</span></div>',
      '</div></section>',

      '<section class="kp-card"><h3>Créditos e licença</h3>',
      '<p class="kp-note">Criado por <b>Ryan Smith</b>. Código sob licença MIT. Catálogo de jogos servido pelo LuminSDK; GN-Math é um acervo externo usado como fonte dos títulos. Fontes do Google apenas para tipografia.</p></section>'
    ].join('');
  }

  /* ---------- pintura ---------- */
  let tabsHost = null;

  function paintTabs() {
    if (!tabsHost) return;
    tabsHost.querySelectorAll('[data-tab]').forEach(function (item) {
      const on = item.dataset.tab === view.tab;
      item.classList.toggle('is-on', on);
      item.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function paint() {
    if (!body) return;
    paintTabs();
    const box = body.querySelector('[data-box]');
    if (!box) return;
    box.scrollTop = 0;
    if (view.tab === 'search') paintSearch(box);
    else if (view.tab === 'apps') paintApps(box);
    else if (view.tab === 'windows') paintWindows(box);
    else if (view.tab === 'diag') paintDiag(box);
    else if (view.tab === 'perf') paintPerf(box);
    else if (view.tab === 'data') paintData(box);
    else if (view.tab === 'help') paintHelp(box);
    else paintAbout(box);
  }

  function render(host) {
    body = host;
    host.innerHTML = [
      '<div class="kp">',
      '  <nav class="kp-tabs" aria-label="Seções da Central">',
      TABS.map(function (tab) {
        return '<button class="kp-tab' + (view.tab === tab.id ? ' is-on' : '') + '" type="button" data-tab="' + tab.id +
          '" aria-pressed="' + (view.tab === tab.id ? 'true' : 'false') + '">' + tab.name + '</button>';
      }).join(''),
      '  </nav>',
      '  <div class="kp-body" data-box></div>',
      '</div>'
    ].join('');

    tabsHost = host;
    host.querySelectorAll('[data-tab]').forEach(function (button) {
      button.addEventListener('click', function () {
        view.tab = button.dataset.tab;
        paint();
      });
    });

    paint();
  }

  OS.register({
    id: 'central',
    name: 'Central',
    short: 'Central',
    w: 820,
    h: 600,
    at: 2,
    icon: ICON,
    render: render
  });

  /* a Central também responde a buscas vindas de fora (paleta do Estúdio) */
  window.LuminCentral = {
    search: function (query) {
      view.tab = 'search';
      view.query = String(query || '');
      view.hits = [];
      if (!body) return;
      paint();
      const input = body.querySelector('[data-q]');
      if (input) {
        input.value = view.query;
        if (view.query) runSearch(view.query);
      }
    }
  };
})();
