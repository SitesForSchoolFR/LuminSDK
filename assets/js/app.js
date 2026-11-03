/* =========================================================
   LuminSDK — aplicativo de URL única
   Tudo vive em UMA página: …/LuminSDK/  (nada depois da barra).

   · as "abas" (Lumin, GN-Math, Sites, Estudos) são trocadas aqui dentro,
     sem mexer no endereço — nada de /gn, /sites, #/gn, ?cat=…
   · o site ABRE SEMPRE nos estudos, mesmo com histórico, preferências ou
     última aba salvos: nada de restaurar a aba anterior
   · o catálogo aparece quando a pessoa clica em "Ryan Smith" no rodapé do
     portal de estudos (ou Shift + D, e só ele)
   · não existe mais trava de troca de janela: sair do app (Alt+Tab, trocar
     de aba, bloquear o celular) não muda a tela nem desliga o crédito — no
     celular era isso que sumia com o botão "Ryan Smith"
   · toda troca de aba toca uma animação curta (~200 ms) daquela aba,
     feita em assets/js/anim.js (tempo / relógio / espaço-tempo)
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
      /* só o script; o CSS da animação é global (index.html) para não ser
         desligado quando a rota muda */
      css: [],
      scripts: [
        'assets/js/anim.js?v=49',
        { src: 'https://cdn.jsdelivr.net/gh/luminsdk/script@latest/lumin.min.js', attrs: { 'data-lumin-sdk': '' } },
        'assets/js/library.js?v=49',
        'assets/js/settings.js?v=49',
        'assets/js/site.js?v=49',
        'assets/js/atmosphere.js?v=49',
        'assets/js/progress.js?v=49',
        'assets/js/bonus.js?v=49'
      ]
    },
    gn: {
      title: 'GN-Math — mais de 840 jogos | LuminSDK',
      css: ['assets/css/gnmath.css?v=49'],
      scripts: ['assets/js/gnmath.js?v=49'],
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
      css: ['assets/css/provider.css?v=49'],
      scripts: ['assets/js/provider.js?v=49', 'assets/js/atmosphere.js?v=49']
    },
    sites: {
      title: 'Sites — coleções que abrem aqui dentro | LuminSDK',
      css: ['assets/css/sites.css?v=49'],
      scripts: ['assets/js/sites.js?v=49', 'assets/js/atmosphere.js?v=49']
    },
    browser: {
      title: 'Navegador — abrir sites aqui dentro | LuminSDK',
      css: ['assets/css/browser.css?v=49'],
      scripts: ['assets/js/browser.js?v=49', 'assets/js/atmosphere.js?v=49']
    },
    os: {
      title: 'LuminOS — área de trabalho | LuminSDK',
      css: [],
      scripts: [
        'assets/js/player.js?v=49',
        'assets/js/os.js?v=49',
        'assets/js/profile.js?v=49',
        'assets/js/lab.js?v=49',
        'assets/js/studio.js?v=49',
        'assets/js/arcade.js?v=49',
        'assets/js/vault.js?v=49',
        'assets/js/community.js?v=49',
        'assets/js/central.js?v=49',
        'assets/js/atmosphere.js?v=49'
      ]
    },
    hub: {
      title: 'Hub — perfil, laboratório, estúdio, arcade, cofre e comunidade | LuminSDK',
      css: ['assets/css/os.css?v=49', 'assets/css/hub.css?v=49'],
      scripts: [
        'assets/js/player.js?v=49',
        'assets/js/os.js?v=49',
        'assets/js/profile.js?v=49',
        'assets/js/lab.js?v=49',
        'assets/js/studio.js?v=49',
        'assets/js/arcade.js?v=49',
        'assets/js/vault.js?v=49',
        'assets/js/community.js?v=49',
        'assets/js/central.js?v=49',
        'assets/js/hub.js?v=49'
      ]
    },
    boot: {
      title: 'LuminSDK — escolha como entrar',
      css: [],
      scripts: ['assets/js/atmosphere.js?v=49']
    },
    estudo: {
      title: 'StudyHub | Estudos e Quiz',
      css: ['assets/css/study.css?v=49'],
      scripts: ['assets/js/study-questions.js?v=49', 'assets/js/anim.js?v=49', 'assets/js/study.js?v=49']
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

     Aqui NÃO existe mais trava de troca de janela: trocar de aba, dar
     Alt+Tab ou sair do app não muda a tela nem mexe no crédito "Ryan Smith".
     No celular a troca de app dispara visibilidade o tempo todo, e era isso
     que deixava o crédito do rodapé apagado e sem ação.

     Ctrl+AltGr+H (o AltGr do Windows chega como Ctrl+Alt) mostra o título e o
     ícone reais e abre o catálogo — é só o disfarce saindo, opcional. */
  const SHIELD_TITLE = 'StudyHub | Estudos e Quiz';
  const SHIELD_ICON = 'assets/img/studyhub.svg';

  const shield = { disguise: true, observer: null };

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
    document.documentElement.classList.toggle('is-shield', shield.disguise);
  }

  /* Ctrl+AltGr+H: título e ícone reais voltam e o catálogo abre */
  function shieldRelease() {
    shield.disguise = false;
    paintShield();
    go('lumin', { reveal: true, force: true });
  }

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

  /* ---------- animação de troca de aba ----------
     Cada aba tem a sua animação curta (tempo/relógio/espaço-tempo), de
     ~200 ms, em assets/js/anim.js. Toca em TODA troca de aba — nada de
     "só na primeira vez". O script é global (defer no index.html); a cópia
     por rota em ROUTES serve só para furar cache. */
  function roll(route) {
    if (!route || route === 'boot') return;
    const open = function () {
      if (!window.LuminAnim) return false;
      return window.LuminAnim.play(route);
    };
    if (open()) return;

    let tries = 20;
    const wait = function () {
      if (open() || tries-- <= 0) return;
      window.setTimeout(wait, 100);
    };
    window.setTimeout(wait, 50);
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

    /* a animação da aba entra por cima, já com a view pronta embaixo */
    roll(route);

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

  /* ---------- teclado: Shift+D alterna · Ctrl+AltGr+H libera o disfarce ---------- */
  document.addEventListener('keydown', function (event) {
    const tag = (event.target && event.target.tagName) || '';
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || (event.target && event.target.isContentEditable);
    const altGraph = typeof event.getModifierState === 'function' && event.getModifierState('AltGraph');
    const letterH = event.code === 'KeyH' || event.key === 'h' || event.key === 'H';

    /* Ctrl+AltGr+H: sai do disfarce (título e ícone reais) e abre o catálogo */
    if (letterH && !event.shiftKey && !event.metaKey && ((event.ctrlKey && event.altKey) || altGraph)) {
      event.preventDefault();
      shieldRelease();
      return;
    }

    /* Shift + D: a única combinação que troca estudos ⇄ site */
    const combo = event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey &&
      (event.code === 'KeyD' || event.key === 'D' || event.key === 'd');
    if (!combo || typing) return;
    event.preventDefault();
    if (current === 'os' || current === 'boot') {
      go('estudo');
      return;
    }
    go(current === 'estudo' ? 'lumin' : 'estudo', { reveal: current === 'estudo', roll: true });
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
      go(route, { reveal: route === 'lumin', roll: !provider });
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
      go(map[legacy[1]], { reveal: map[legacy[1]] === 'lumin', roll: true });
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
    /* leitura do disfarce (útil para diagnóstico) */
    shieldState: function () { return { disguised: shield.disguise }; }
  };

  function boot() {
    /* chave da antiga trava de troca de janela: não existe mais, não deve
       ficar sobrando na sessão de quem já usou o site */
    try { sessionStorage.removeItem('luminsdk:v1:shield'); } catch (error) { /* sem storage */ }

    /* rede de segurança: a classe da animação (versão antiga) travava o
       body com overflow:hidden; se sobrou de uma sessão velha, sai agora */
    document.documentElement.classList.remove('is-revealing');

    /* bundle novo publicado? recarrega UMA vez — assim o JS antigo nunca
       fica preso na aba em branco (era o que fazia a animação continuar em
       200 ms depois de uma atualização) */
    try {
      const stamp = document.querySelector('script[src*="app.js?v="]');
      const version = stamp ? (stamp.getAttribute('src') || '').split('v=')[1] : '';
      const KEY = 'luminsdk:v1:bundle';
      const seen = sessionStorage.getItem(KEY);
      if (version && seen && seen !== version) {
        sessionStorage.setItem(KEY, version);
        window.location.reload();
        return;
      }
      if (version && !seen) sessionStorage.setItem(KEY, version);
    } catch (error) { /* storage indisponível: segue sem recarregar */ }

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
