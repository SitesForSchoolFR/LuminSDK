/* =========================================================
   LuminSDK — aplicativo de URL única
   Tudo vive em UMA página: …/LuminSDK/  (nada depois da barra).

   · as "abas" (Lumin, GN-Math, Sites, Estudos) são trocadas aqui dentro,
     sem mexer no endereço — nada de /gn, /sites, #/gn, ?cat=…
   · o site ABRE SEMPRE nos estudos, mesmo com histórico, preferências ou
     última aba salvos: nada de restaurar a aba anterior
   · o catálogo aparece quando a pessoa clica em "Ryan Smith" no rodapé do
     portal de estudos (ou Shift + D / Alt + S)
   · endereços antigos (/gn/, /sites/, /study/) continuam funcionando pelo
     ?view=…, e a barra de endereço é limpa logo depois
   · cada aba carrega o seu CSS e os seus scripts só na primeira visita

   Sem bibliotecas, sem build.
   Autor: Ryan Smith · Licença MIT
   ========================================================= */
(function () {
  'use strict';

  const ROUTES = {
    lumin: {
      title: 'LuminSDK — mais de 1.100 jogos no seu navegador',
      css: [],
      scripts: [
        { src: 'https://cdn.jsdelivr.net/gh/luminsdk/script@latest/lumin.min.js', attrs: { 'data-lumin-sdk': '' } },
        'assets/js/library.js?v=41',
        'assets/js/settings.js?v=41',
        'assets/js/site.js?v=41',
        'assets/js/atmosphere.js?v=41',
        'assets/js/progress.js?v=41',
        'assets/js/bonus.js?v=41'
      ]
    },
    gn: {
      title: 'GN-Math — mais de 840 jogos | LuminSDK',
      css: ['assets/css/gnmath.css?v=41'],
      scripts: ['assets/js/gnmath.js?v=41'],
      html: {
        'data-gn-accent': 'grafite',
        'data-gn-bg': 'lisa',
        'data-gn-cursor': 'personalizado',
        'data-gn-density': 'confortavel',
        'data-gn-fx': 'off',
        'data-gn-motion': 'auto'
      }
    },
    provider: {
      title: 'Catálogo — aqui dentro | LuminSDK',
      css: ['assets/css/provider.css?v=41'],
      scripts: ['assets/js/provider.js?v=41', 'assets/js/atmosphere.js?v=41']
    },
    sites: {
      title: 'Sites — coleções que abrem aqui dentro | LuminSDK',
      css: ['assets/css/sites.css?v=41'],
      scripts: ['assets/js/sites.js?v=41', 'assets/js/atmosphere.js?v=41']
    },
    browser: {
      title: 'Navegador — abrir sites aqui dentro | LuminSDK',
      css: ['assets/css/browser.css?v=41'],
      scripts: ['assets/js/browser.js?v=41', 'assets/js/atmosphere.js?v=41']
    },
    os: {
      title: 'LuminOS — área de trabalho | LuminSDK',
      css: [],
      scripts: [
        'assets/js/player.js?v=41',
        'assets/js/os.js?v=41',
        'assets/js/profile.js?v=41',
        'assets/js/lab.js?v=41',
        'assets/js/studio.js?v=41',
        'assets/js/arcade.js?v=41',
        'assets/js/vault.js?v=41',
        'assets/js/community.js?v=41',
        'assets/js/central.js?v=41',
        'assets/js/atmosphere.js?v=41'
      ]
    },
    hub: {
      title: 'Hub — perfil, laboratório, estúdio, arcade, cofre e comunidade | LuminSDK',
      css: ['assets/css/os.css?v=41', 'assets/css/hub.css?v=41'],
      scripts: [
        'assets/js/player.js?v=41',
        'assets/js/os.js?v=41',
        'assets/js/profile.js?v=41',
        'assets/js/lab.js?v=41',
        'assets/js/studio.js?v=41',
        'assets/js/arcade.js?v=41',
        'assets/js/vault.js?v=41',
        'assets/js/community.js?v=41',
        'assets/js/central.js?v=41',
        'assets/js/hub.js?v=41'
      ]
    },
    boot: {
      title: 'LuminSDK — escolha como entrar',
      css: [],
      scripts: ['assets/js/atmosphere.js?v=41']
    },
    estudo: {
      title: 'StudyHub | Estudos e Quiz',
      css: ['assets/css/study.css?v=41'],
      scripts: ['assets/js/study-questions.js?v=41', 'assets/js/study.js?v=41']
    }
  };

  const GN_ATTRS = ['data-gn-accent', 'data-gn-bg', 'data-gn-cursor', 'data-gn-density', 'data-gn-fx', 'data-gn-motion'];
  const REVEAL = 'luminsdk:v1:reveal';
  const START = 'luminsdk:v1:start';
  const MODE = 'luminsdk:v1:mode';

  /* no arquivo único tudo já vem embutido: sem rail e sem carregar nada */
  const SINGLE = !!window.__LUMIN_SINGLE__;

  const loadedCss = {};
  const loadedScripts = {};
  let current = '';

  function readMode() {
    try { return sessionStorage.getItem(MODE) || ''; } catch (error) { return ''; }
  }

  function writeMode(mode) {
    try {
      if (mode) sessionStorage.setItem(MODE, mode);
      else sessionStorage.removeItem(MODE);
    } catch (error) { /* modo privado sem storage */ }
  }

  /* endereços antigos (/gn/, /sites/, /study/) chegam com ?view= — só aí a
     aba pedida é respeitada; abrir o site normalmente cai sempre nos estudos */
  function routeFromUrl() {
    try {
      const view = new URLSearchParams(window.location.search).get('view');
      return view && ROUTES[view] ? view : '';
    } catch (error) {
      return '';
    }
  }

  function initialRoute() {
    if (SINGLE) return 'lumin';

    /* com a trava armada o site reabre nos estudos, sem herdar modo nem aba */
    if (shield.locked) {
      try {
        sessionStorage.removeItem(MODE);
        sessionStorage.removeItem(START);
      } catch (error) { /* modo privado sem storage */ }
      return 'estudo';
    }

    const asked = routeFromUrl();
    if (asked) return asked;

    /* o disfarce vem SEMPRE primeiro, mesmo com histórico ou preferências
       salvas: nada de reabrir na última aba usada */
    const mode = readMode();
    if (mode === 'os') return 'os';

    try {
      sessionStorage.removeItem(START);
      sessionStorage.removeItem(REVEAL);
    } catch (error) { /* modo privado sem storage */ }
    return 'estudo';
  }

  /* ---------- carregamento sob demanda ---------- */
  function loadCss(route, href) {
    if (loadedCss[href]) return loadedCss[href];
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.route = route;
    link.disabled = route !== current;  /* liga só quando a aba abre */
    document.head.append(link);
    loadedCss[href] = link;
    return link;
  }

  /* só a folha da aba atual fica ativa (a dos estudos é clara e vazaria) */
  function syncCss(route) {
    Object.keys(loadedCss).forEach(function (href) {
      const link = loadedCss[href];
      if (link && link.dataset) link.disabled = link.dataset.route !== route;
    });
  }

  function loadScript(entry) {
    const src = typeof entry === 'string' ? entry : entry.src;
    const attrs = typeof entry === 'string' ? {} : entry.attrs || {};
    if (loadedScripts[src]) return loadedScripts[src];

    loadedScripts[src] = new Promise(function (resolve) {
      const script = document.createElement('script');
      script.src = src;
      script.defer = true;
      script.async = false;             /* mantém a ordem da fila */
      Object.keys(attrs).forEach(function (key) {
        script.setAttribute(key, attrs[key]);
      });
      script.addEventListener('load', function () { resolve(true); });
      script.addEventListener('error', function () {
        console.warn('[LuminSDK] não carregou:', src);
        resolve(false);
      });
      document.body.append(script);
    });
    return loadedScripts[src];
  }

  function loadRoute(route) {
    const config = ROUTES[route];
    if (SINGLE) {
      /* CSS e JS já estão embutidos: só o SDK (CDN) continua sendo buscado */
      (config && config.scripts ? config.scripts : []).forEach(function (entry) {
        const src = typeof entry === 'string' ? entry : entry.src;
        if (/^https?:/i.test(src)) loadScript(entry);
      });
      return;
    }
    if (!config) return;
    (config.css || []).forEach(function (href) { loadCss(route, href); });
    (config.scripts || []).reduce(function (chain, entry) {
      return chain.then(function () { return loadScript(entry); });
    }, Promise.resolve());
  }

  /* ícone da aba: a página de estudos sempre usa o próprio logotipo */
  function syncIcon(route) {
    const link = document.querySelector('link[rel="icon"]');
    if (!link) return;
    const want = (shield.disguise || route === 'estudo') ? SHIELD_ICON : 'assets/img/favicon.svg';
    if (link.getAttribute('href') !== want) link.setAttribute('href', want);
  }

  /* ---------- disfarce permanente (SUTS) ----------------------------------
     Enquanto o disfarce está ligado — e ele nasce ligado — TODA aba do site
     se chama "StudyHub | Estudos e Quiz" e usa o logotipo do StudyHub: o
     título real não aparece no LuminSDK, no GN-Math, nos catálogos, nos
     sites, no navegador, no Hub nem no LuminOS.

     A trava entra quando a pessoa troca de janela ou de aba (Alt+Tab,
     Windows+Tab, clique fora): a página volta para os estudos, o crédito
     "Ryan Smith" fica desligado e Shift+D / Alt+S param de responder.

     Ctrl+AltGr+H (o AltGr do Windows chega como Ctrl+Alt) desarma tudo:
     título e ícone reais, crédito liberado e catálogo aberto.

     O navegador não deixa a página capturar Alt+Tab / Windows+Tab — o que
     dá para fazer, e é o que este bloco faz, é reagir no instante em que a
     janela perde o foco e voltar para os estudos. */
  const SHIELD_TITLE = 'StudyHub | Estudos e Quiz';
  const SHIELD_ICON = 'assets/img/studyhub.svg';
  const SHIELD_KEY = 'luminsdk:v1:shield';

  /* a trava sobrevive ao recarregar dentro da mesma sessão do navegador:
     recarregar não devolve o crédito para quem esbarrou no Alt+Tab */
  function readLock() {
    try { return sessionStorage.getItem(SHIELD_KEY) === '1'; } catch (error) { return false; }
  }

  function writeLock(on) {
    try {
      if (on) sessionStorage.setItem(SHIELD_KEY, '1');
      else sessionStorage.removeItem(SHIELD_KEY);
    } catch (error) { /* modo privado sem storage */ }
  }

  const shield = { disguise: true, locked: readLock(), observer: null, timer: 0, beat: 0, bye: false };

  /* título à prova de reescrita: qualquer módulo que tente trocar o título
     (navegador interno, chamadas do app) é corrigido na hora */
  function holdShieldTitle() {
    if (shield.observer || !window.MutationObserver) return;
    const node = document.querySelector('title');
    if (!node) return;
    shield.observer = new MutationObserver(function () {
      if (shield.disguise && document.title !== SHIELD_TITLE) document.title = SHIELD_TITLE;
    });
    shield.observer.observe(node, { childList: true, characterData: true, subtree: true });
  }

  function releaseShieldTitle() {
    if (!shield.observer) return;
    shield.observer.disconnect();
    shield.observer = null;
  }

  /* crédito "Ryan Smith": é a saída para o catálogo, então fica desligado
     enquanto a trava estiver armada */
  function paintCredit() {
    const autor = document.getElementById('autor');
    if (!autor) return;
    if (shield.locked) {
      if (!autor.disabled) autor.disabled = true;
      autor.setAttribute('aria-disabled', 'true');
      autor.dataset.shield = 'on';
    } else {
      if (autor.disabled) autor.disabled = false;
      autor.removeAttribute('aria-disabled');
      delete autor.dataset.shield;
    }
  }

  function paintShield() {
    const config = ROUTES[current];
    if (shield.disguise) {
      if (document.title !== SHIELD_TITLE) document.title = SHIELD_TITLE;
      holdShieldTitle();
    } else {
      releaseShieldTitle();
      if (config && document.title !== config.title) document.title = config.title;
    }
    syncIcon(current);
    paintCredit();
    document.documentElement.classList.toggle('is-shield', shield.disguise);
  }

  /* troca de janela/aba: volta para os estudos e liga a trava */
  function shieldPanic() {
    if (shield.bye) return;                /* recarregar/fechar não conta como Alt+Tab */
    if (shield.locked && current === 'estudo') return;   /* já está no lugar certo */
    shield.disguise = true;
    shield.locked = true;
    writeLock(true);
    if (current && current !== 'estudo') go('estudo', { force: true });
    paintShield();
  }

  /* Ctrl+AltGr+H: tudo volta ao normal e o catálogo abre */
  function shieldRelease() {
    shield.disguise = false;
    shield.locked = false;
    shield.bye = false;
    writeLock(false);
    paintShield();
    go('lumin', { reveal: true, force: true });
  }

  /* a checagem não olha para o iframe de propósito: com um jogo em foco
     document.hasFocus() continua true (o foco está nesta janela), então
     jogar não dispara a trava — mas Alt+Tab dispara */
  function shieldCheck() {
    window.clearTimeout(shield.timer);
    shield.timer = window.setTimeout(function () {
      const hidden = document.visibilityState === 'hidden';
      const unfocused = typeof document.hasFocus === 'function' && !document.hasFocus();
      if (hidden || unfocused) shieldPanic();
    }, 200);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') shieldPanic();
    else shieldCheck();
  });
  window.addEventListener('blur', shieldCheck);

  /* sair da página (recarregar, fechar, ir para outro endereço) não é
     Alt+Tab: o disfarce não pode se armar sozinho no meio da saída */
  window.addEventListener('pagehide', function () { shield.bye = true; });
  window.addEventListener('beforeunload', function () { shield.bye = true; });
  window.addEventListener('pageshow', function () { shield.bye = false; });

  /* ---- batida do disfarce ------------------------------------------------
     Nem todo navegador entrega blur/visibilitychange do mesmo jeito (e um
     Alt+Tab atrás do outro pode não gerar evento nenhum). Em vez de confiar
     num evento só, a página confere o foco de tempo em tempo: se a janela
     perdeu o foco — de novo, quantas vezes for — ela volta para os estudos. */
  let sawFocus = typeof document.hasFocus === 'function' ? document.hasFocus() : true;

  function noteFocus() {
    sawFocus = true;
    shield.bye = false;
  }

  function startHeartbeat() {
    if (shield.beat) return;
    shield.beat = window.setInterval(function () {
      if (shield.bye) return;
      if (document.visibilityState === 'hidden') { shieldPanic(); return; }
      if (!sawFocus) return;                       /* aba aberta em segundo plano */
      if (typeof document.hasFocus === 'function' && !document.hasFocus()) shieldPanic();
    }, 800);
  }

  window.addEventListener('focus', noteFocus);
  document.addEventListener('pointerdown', noteFocus, true);
  document.addEventListener('keydown', noteFocus, true);
  startHeartbeat();

  /* ---------- troca de aba ---------- */
  function paintRail(route) {
    document.querySelectorAll('.tabrail__tab').forEach(function (item) {
      let active = item.dataset.route === route;

      /* DuckMath e Astra dividem a rota "provider": a aba acesa é a do
         catálogo que está aberto */
      if (item.dataset.provider) {
        const openKey = (window.LuminProvider && window.LuminProvider.current)
          ? window.LuminProvider.current() : '';
        active = route === 'provider' && openKey === item.dataset.provider;
      }

      const lit = active && route !== 'boot';
      item.classList.toggle('is-active', lit);
      if (lit) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
  }

  function show(route) {
    if (!ROUTES[route]) route = 'lumin';
    if (route === current) return;
    const first = !current;
    current = route;
    const config = ROUTES[route];

    document.body.classList.toggle('gn', route === 'gn');
    document.documentElement.setAttribute('data-view', route);
    document.documentElement.setAttribute('data-theme', 'dark');

    GN_ATTRS.forEach(function (name) {
      if (route === 'gn' && config.html && config.html[name]) {
        document.documentElement.setAttribute(name, config.html[name]);
      } else {
        document.documentElement.removeAttribute(name);
      }
    });

    const boot = document.getElementById('boot');
    if (boot) boot.hidden = route !== 'boot';
    document.body.style.overflow = route === 'boot' || route === 'os' ? 'hidden' : '';

    document.querySelectorAll('.app-view').forEach(function (view) {
      const own = view.dataset.view;
      const active = own === route;
      view.classList.toggle('is-active', active);
      if (active) view.removeAttribute('hidden');
      else view.setAttribute('hidden', '');
    });

    document.title = config.title;
    syncIcon(route);
    paintShield();
    paintRail(route);
    loadRoute(route);
    syncCss(route);                 /* liga o CSS da aba recém-criada */

    if (route === 'provider' && !(window.LuminProvider && window.LuminProvider.current && window.LuminProvider.current())) {
      openProvider(lastProvider());
    }

    if (first) {
      document.documentElement.classList.add('is-ready');
    }
    if (route !== 'boot' && route !== 'os') window.scrollTo(0, 0);

    try {
      window.dispatchEvent(new CustomEvent('lumin:view', { detail: { route: route } }));
    } catch (error) { /* navegador antigo sem CustomEvent */ }
  }

  /* troca de aba sem tocar na URL */
  function go(route, options) {
    const opts = options || {};
    if (!ROUTES[route]) return;
    if (route === current && !opts.force) return;

    if (route === 'os') writeMode('os');
    else if (route === 'boot') writeMode('');
    else writeMode('normal');

    try {
      if (route !== 'os' && route !== 'boot') sessionStorage.setItem(START, route);
    } catch (error) {}
    if (route === 'lumin' && opts.reveal) {
      try { sessionStorage.setItem(REVEAL, '1'); } catch (error) {}
    }
    show(route);
  }

  /* ---------- teclado: Shift+D ou Alt+S (livres) · Ctrl+AltGr+H (libera) ---------- */
  document.addEventListener('keydown', function (event) {
    const tag = (event.target && event.target.tagName) || '';
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || (event.target && event.target.isContentEditable);
    const altGraph = typeof event.getModifierState === 'function' && event.getModifierState('AltGraph');
    const letterH = event.code === 'KeyH' || event.key === 'h' || event.key === 'H';

    /* Ctrl+AltGr+H: sai do disfarce, libera o crédito e abre o catálogo */
    if (letterH && !event.shiftKey && !event.metaKey && ((event.ctrlKey && event.altKey) || altGraph)) {
      event.preventDefault();
      shieldRelease();
      return;
    }

    const combo = (event.shiftKey && (event.key === 'D' || event.key === 'd')) ||
      (event.altKey && (event.key === 's' || event.key === 'S'));
    if (!combo || typing) return;
    event.preventDefault();
    /* com a trava armada, os atalhos não levam ao catálogo */
    if (shield.locked) return;
    if (current === 'os' || current === 'boot') {
      go('estudo');
      return;
    }
    go(current === 'estudo' ? 'lumin' : 'estudo', { reveal: current === 'estudo' });
  });

  /* ---------- cliques ---------- */
  document.addEventListener('click', function (event) {
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;

    const modeEl = event.target.closest('[data-mode]');
    if (modeEl) {
      event.preventDefault();
      const mode = modeEl.dataset.mode;
      go(mode === 'os' ? 'os' : 'estudo', { force: true });
      return;
    }

    const routeEl = event.target.closest('[data-route]');
    if (routeEl) {
      event.preventDefault();
      const route = routeEl.dataset.route;
      const provider = routeEl.dataset.provider || '';
      go(route, { reveal: route === 'lumin' });
      if (provider) openProvider(provider);
      return;
    }

    const link = event.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href') || '';

    /* "#" sozinho: volta ao topo sem gravar o "#" na barra de endereço */
    if (href === '#') {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    /* âncora dentro da própria aba (ex.: #faq): rola, sem mexer na URL */
    if (href.charAt(0) === '#' && href.length > 1) {
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    /* endereços antigos (gn/index.html, ../sites/index.html…) viram aba */
    const legacy = href.match(/(?:^|\/)(gn|sites|study|single)\/(?:index\.html)?$/);
    if (legacy) {
      event.preventDefault();
      const map = { gn: 'gn', sites: 'sites', study: 'estudo', single: 'lumin' };
      go(map[legacy[1]], { reveal: map[legacy[1]] === 'lumin' });
      return;
    }
    if (!/^https?:/i.test(href) && /(^|\/)index\.html$/.test(href)) {
      event.preventDefault();
      go('lumin', { reveal: true });
    }
  });

  /* ---------- catálogos de provedor (DuckMath / Astra) ---------- */
  /* ao recarregar dentro de um catálogo, volta no mesmo catálogo */
  const PROVIDER_KEYS = ['duckmath', 'astra'];
  const PROVIDER_LAST = 'luminsdk:v1:provider';

  function lastProvider() {
    try {
      const saved = sessionStorage.getItem(PROVIDER_LAST);
      if (PROVIDER_KEYS.indexOf(saved) >= 0) return saved;
    } catch (error) { /* modo privado sem storage */ }
    return PROVIDER_KEYS[0];
  }

  function openProvider(key) {
    /* o catálogo demora o tempo do fetch para ficar pronto; a aba dele só
       acende quando o provedor aberto é de fato esse */
    const lit = function () {
      if (current === 'provider') paintRail(current);
    };
    const tryOpen = function (tries) {
      if (window.LuminProvider) {
        Promise.resolve(window.LuminProvider.open(key)).then(lit, lit);
        return;
      }
      if (tries <= 0) return;
      setTimeout(function () { tryOpen(tries - 1); }, 120);
    };
    setTimeout(function () { tryOpen(16); }, 60);
  }

  /* abre o navegador já num endereço */
  function openInBrowser(url) {
    window.__luminBrowserOpen = url;
    const tryOpen = function (tries) {
      if (window.LuminBrowser) {
        window.__luminBrowserOpen = '';
        window.LuminBrowser.open(url);
        return;
      }
      if (tries <= 0) return;
      setTimeout(function () { tryOpen(tries - 1); }, 120);
    };
    setTimeout(function () { tryOpen(14); }, 60);
  }

  /* quando o navegador troca de endereço, a barra lateral se ajusta */
  window.addEventListener('lumin:browser', function () { paintRail(current); });

  window.LuminApp = {
    go: go,
    current: function () { return current; },
    openInBrowser: openInBrowser,
    openProvider: openProvider,
    setTitle: function (text) { document.title = shield.disguise ? SHIELD_TITLE : text; },
    /* leitura do disfarce (útil para diagnóstico; sem atalho de fuga) */
    shieldState: function () { return { disguised: shield.disguise, locked: shield.locked }; }
  };

  function boot() {
    const legacy = routeFromUrl();
    show(initialRoute());
    /* endereço antigo (?view=gn…): limpa a barra para que reabrir o site
       caia, como sempre, na aba de estudos */
    if (legacy) {
      try { history.replaceState(null, '', window.location.pathname); } catch (error) {}
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
