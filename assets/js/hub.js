/* =========================================================
   Hub — o LuminOS dentro do site normal
   A aba monta os apps que antes só existiam no desktop (Perfil,
   Laboratório, Estúdio, Arcade, Cofre e Comunidade) numa moldura
   escura, sem janelas. É o mesmo código: os apps continuam em
   assets/js/{profile,lab,studio,arcade,vault,community}.js.
   Autor: Ryan Smith · Licença MIT
   ========================================================= */
(function () {
  'use strict';

  const OS = window.LuminOS;
  if (!OS || typeof OS.getApp !== 'function') return;

  const KEY = 'luminsdk:v1:hub';
  const ORDER = ['player', 'central', 'lab', 'studio', 'arcade', 'vault', 'community'];
  const ACCENTS = {
    violeta: ['#a78bfa', '139, 92, 246'],
    ciano: ['#22d3ee', '34, 211, 238'],
    rosa: ['#f472b6', '244, 114, 182'],
    lima: ['#4ade80', '74, 222, 128'],
    ambar: ['#fbbf24', '251, 191, 36']
  };
  const DENSITY = ['compacto', 'confortavel', 'amplo'];

  let current = '';

  function read() {
    try { return localStorage.getItem(KEY) || ''; } catch (error) { return ''; }
  }

  function write(id) {
    try { localStorage.setItem(KEY, id); } catch (error) {}
  }

  function hexToRgb(hex) {
    const value = String(hex).replace('#', '');
    return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)].join(', ');
  }

  /* ---------- aparência: a cor e a densidade do Estúdio valem aqui ---------- */
  function applyLook() {
    const stage = document.getElementById('hub-stage');
    if (!stage) return;
    const prefs = OS.ui.prefs();
    const base = ACCENTS[prefs.accent] || ACCENTS.violeta;
    const custom = /^#[0-9a-f]{6}$/i.test(String(prefs.accentHex || '')) ? prefs.accentHex : '';
    stage.style.setProperty('--os-accent', custom || base[0]);
    stage.style.setProperty('--accent-rgb', custom ? hexToRgb(custom) : base[1]);
    stage.dataset.density = DENSITY.indexOf(prefs.density) >= 0 ? prefs.density : 'confortavel';
    stage.dataset.font = ['padrao', 'serifada', 'mono'].indexOf(prefs.font) >= 0 ? prefs.font : 'padrao';
  }

  /* ---------- chips ---------- */
  function paintChips() {
    const nav = document.getElementById('hub-tabs');
    if (!nav) return;
    nav.textContent = '';
    ORDER.forEach(function (id) {
      const app = OS.getApp(id);
      if (!app) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hub__tab' + (id === current ? ' is-on' : '');
      button.dataset.hub = id;
      button.setAttribute('aria-pressed', id === current ? 'true' : 'false');
      button.title = 'Abrir ' + app.name;
      button.innerHTML = (OS.icon ? OS.icon(id) : '') + '<span>' + app.name + '</span>';
      button.addEventListener('click', function () { mount(id); });
      nav.append(button);
    });
  }

  /* ---------- montagem ---------- */
  function mount(id, options) {
    const app = OS.getApp(id);
    const box = document.getElementById('hub-mount');
    if (!app || !box) return false;

    current = id;
    write(id);
    box.textContent = '';

    const host = document.createElement('div');
    host.className = 'hub__app';
    host.dataset.app = id;
    box.append(host);

    try {
      app.render(host);
    } catch (error) {
      host.innerHTML = '<p class="kp-empty" style="padding:18px">Não deu para abrir ' +
        app.name + ' agora. Recarregue a página e tente de novo.</p>';
    }

    paintChips();
    applyLook();

    if (!options || options.remember !== false) {
      const label = document.getElementById('hub-crumb');
      if (label) label.textContent = app.name;
    }
    return true;
  }

  /* chamado pelo os.js quando não existe desktop (é o hub que está na frente) */
  function open(id) {
    if (ORDER.indexOf(id) >= 0) {
      mount(id);
      return true;
    }
    if (window.LuminApp) {
      if (id === 'games') { window.LuminApp.go('lumin'); return true; }
      if (id === 'sites') { window.LuminApp.go('sites'); return true; }
      if (id === 'browser') { window.LuminApp.go('browser'); return true; }
      if (id === 'estudo') { window.LuminApp.go('estudo'); return true; }
    }
    return false;
  }

  /* "jogar" dentro do hub abre o jogo no player do site normal */
  function play(id) {
    if (window.LuminApp) window.LuminApp.go('lumin');
    let tries = 0;
    (function attempt() {
      if (window.LuminLibrary && typeof window.LuminLibrary.openGameById === 'function') {
        try { window.LuminLibrary.openGameById(String(id)); } catch (error) {}
        return;
      }
      if (tries >= 60) return;
      tries += 1;
      setTimeout(attempt, 100);
    })();
    return true;
  }

  window.LuminHub = {
    open: open,
    play: play,
    mount: mount,
    current: function () { return current; }
  };

  /* usa o mesmo toast do OS como aviso flutuante (o os.js cria o elemento) */
  function init() {
    const view = document.getElementById('view-hub');
    if (!view) return;
    const saved = read();
    mount(ORDER.indexOf(saved) >= 0 ? saved : 'player');
    /* Arcade, Perfil e Comunidade precisam do acervo: adianta a busca */
    try { OS.data.games().catch(function () {}); } catch (error) {}
    view.addEventListener('click', function () { setTimeout(applyLook, 0); });
    view.addEventListener('input', function () { setTimeout(applyLook, 0); });
    view.addEventListener('change', function () { setTimeout(applyLook, 0); });
  }

  window.addEventListener('lumin:view', function (event) {
    const route = event && event.detail && event.detail.route;
    if (route !== 'hub') return;
    /* ao voltar para o hub, remonta o app atual para os dados ficarem frescos */
    if (document.getElementById('hub-mount')) {
      if (current) mount(current);
      else init();
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
