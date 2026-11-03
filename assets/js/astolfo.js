/* =========================================================
   LuminSDK — tema Astolfo (femboy knight) · SFW
   PERSONALIZAÇÃO COMPLETA OPCIONAL do site inteiro.

   · liga/desliga com Ctrl + AltGr + Y (AltGr = Ctrl + Alt no Windows;
     no Mac, Control + Option + Y) e também pelo botão no fim do
     painel Personalizar
   · a escolha fica salva neste navegador; nada muda até o tema existir
   · quando liga, o body recebe a classe is-astolfo: as folhas das abas
     carregadas por rota continuam aplicando os tokens rosa/preto (o CSS
     do tema mora em assets/css/astolfo.css)
   · tudo SFW: cores, tipografia, laço, estrela e listras — zero NSFW
   · API: window.LuminAstolfo.{toggle,on,off,state}

   Autor: Ryan Smith · Licença MIT
   ========================================================= */
(function () {
  'use strict';

  const KEY = 'luminsdk:astolfo';          /* 'on' | 'off' */
  const root = document.documentElement;
  const THEME_COLOR = { dark: '#ff5fa8', light: '#f7b6d6' };
  let enabled = false;

  /* ---------- leitura/gravação ---------- */
  function stored() {
    try {
      const value = localStorage.getItem(KEY);
      if (value === 'on') return true;
      if (value === 'off') return false;
    } catch (error) { /* navegador sem armazenamento */ }
    return null;
  }

  function persist(on) {
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (error) { /* só nesta sessão */ }
  }

  /* ---------- efeitos no documento ---------- */
  function applyDocument(on) {
    if (on) root.setAttribute('data-skin', 'astolfo');
    else root.removeAttribute('data-skin');
    /* só controla a própria classe: se outra coisa mexeu, não apagamos */
    if (document.body) document.body.classList.toggle('is-astolfo', on);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', on ? (root.getAttribute('data-theme') === 'light' ? THEME_COLOR.light : THEME_COLOR.dark) : '#07070c');

    /* título da aba: só o prefixo, sem atropelar o título de cada aba */
    const title = document.title || '';
    const decorated = /^♡\s/.test(title);
    if (on && !decorated) document.title = '♡ ' + title;
    else if (!on && decorated) document.title = title.replace(/^♡\s/, '');
  }

  /* garante a folha do tema mesmo quando o <link> do index.html não existe
     (arquivo único, página antiga em cache, teste) */
  function ensureCss() {
    if (document.getElementById('astolfo-css')) return;
    const link = document.createElement('link');
    link.id = 'astolfo-css';
    link.rel = 'stylesheet';
    link.href = 'assets/css/astolfo.css?v=52';
    link.addEventListener('error', function () { link.remove(); });
    document.head.appendChild(link);
  }

  /* ---------- aviso rápido de ligar/desligar ---------- */
  function sparkle(on) {
    if (!document.body) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    /* efeito é enfeite: se falhar, a troca de tema continua */
    try {
      sparkleNow(on);
    } catch (error) { /* segue sem comemoração */ }
  }

  function sparkleNow(on) {
    const fx = document.createElement('div');
    fx.className = 'ast-fx';
    fx.setAttribute('aria-hidden', 'true');
    const ring = document.createElement('div');
    ring.className = 'ast-fx__ribbon';
    const label = document.createElement('span');
    label.className = 'ast-fx__label';
    label.textContent = on ? 'Astolfo on' : 'minimalista';
    fx.append(ring, label);
    document.body.append(fx);
    window.setTimeout(function () { if (fx.parentNode) fx.parentNode.removeChild(fx); }, 1000);
  }

  /* ---------- painel: botão, estado e atalho de teclado ---------- */
  function renderCard() {
    const card = document.getElementById('astolfo-card');
    if (!card) return;
    const state = document.getElementById('astolfo-state');
    const knob = document.getElementById('astolfo-toggle');
    if (state) {
      state.textContent = enabled ? 'Ligado' : 'Desligado';
      state.classList.toggle('is-on', enabled);
    }
    if (knob) knob.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    /* uma única arte (Doki Theme, MIT): o "ligado" aparece no brilho do avatar */
    card.classList.toggle('is-on', enabled);
  }

  let previousFocus = null;
  function openPreview() {
    const dialog = document.getElementById('astolfo-preview');
    if (!dialog) return;
    previousFocus = document.activeElement;
    try {
      if (typeof dialog.showModal === 'function') { if (!dialog.open) dialog.showModal(); }
      else dialog.setAttribute('open', '');
    } catch (error) {
      dialog.setAttribute('open', '');
    }
  }
  function closePreview() {
    const dialog = document.getElementById('astolfo-preview');
    if (!dialog) return;
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
    if (previousFocus && previousFocus.focus) { try { previousFocus.focus(); } catch (error) { /* nada */ } }
  }

  function toast(text) {
    if (window.LuminLibrary && typeof window.LuminLibrary.toast === 'function') {
      window.LuminLibrary.toast(text);
      return;
    }
    /* sem o toast da biblioteca (aba ainda carregando): um aviso nosso */
    let tip = document.getElementById('astolfo-tip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'astolfo-tip';
      tip.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:9998;' +
        'padding:9px 14px;border-radius:999px;font:600 12px/1.3 system-ui,sans-serif;color:#2a0b1b;' +
        'background:linear-gradient(120deg,#ff9ecb,#ff5fa8);pointer-events:none;white-space:nowrap';
      document.body.append(tip);
    }
    tip.textContent = text;
    window.clearTimeout(tip.__timer);
    tip.__timer = window.setTimeout(function () { if (tip.parentNode) tip.parentNode.removeChild(tip); }, 2600);
  }

  /* ---------- ligar/desligar ---------- */
  function set(on, options) {
    const opts = options || {};
    const next = !!on;
    if (next === enabled && !opts.force) {
      if (!opts.silent) toast(enabled ? 'Astolfo já está ligado ♡' : 'O estilo minimalista já está ativo');
      renderCard();
      return enabled;
    }
    enabled = next;
    ensureCss();
    applyDocument(enabled);
    persist(enabled);
    renderCard();
    if (!opts.silent) sparkle(enabled);
    if (!opts.silent) {
      toast(enabled ? 'Tema Astolfo ligado ♡ (Ctrl + AltGr + Y volta ao minimalista)' : 'De volta ao minimalista');
    }

    /* as folhas das abas são carregadas por rota: as já carregadas precisam
       ser reavaliadas para os tokens do tema entrarem na hora */
    Array.prototype.forEach.call(document.querySelectorAll('link[rel="stylesheet"]'), function (link) {
      if (!link.href || link.href.indexOf('astolfo.css') >= 0) return;
      const href = link.href.split('?')[0];
      if (href.indexOf('/assets/css/') < 0) return;
      try {
        const was = link.disabled;      /* regra do app.js: só a aba atual fica ligada */
        link.disabled = true;
        /* reflow força o navegador a recalcular com o tema já aplicado */
        void link.offsetHeight;
        link.disabled = was;
      } catch (error) { /* folha sem suporte a disabled: já está aplicada */ }
    });

    /* quem quiser reagir (o app.js reaplica a rota atual) */
    try {
      window.dispatchEvent(new CustomEvent('lumin:astolfo', { detail: { on: enabled } }));
    } catch (error) { /* navegador antigo sem CustomEvent */ }
    return enabled;
  }

  function toggle() { return set(!enabled); }

  /* ---------- atalho: Ctrl + AltGr + Y ----------
     AltGr chega como Ctrl+Alt (Windows/Linux). No Mac o equivalente é
     Control+Option+Y, então cobrimos as duas formas. Shift não entra
     (Ctrl+Shift+Alt+Y é outro atalho, o de trocar de aba). */
  function isShortcut(event) {
    if (!event) return false;
    const key = String(event.key || '').toLowerCase();
    const code = event.code || '';
    if (key !== 'y' && code !== 'KeyY') return false;
    if (!event.ctrlKey || !event.altKey || event.shiftKey || event.metaKey) return false;
    return true;
  }

  function press(event) {
    if (!isShortcut(event)) return;
    if (event.repeat) return;
    event.preventDefault();
    event.stopPropagation();
    toggle();
  }

  function initUI() {
    const card = document.getElementById('astolfo-card');
    if (card) {
      card.addEventListener('click', function (event) {
        const action = event.target && event.target.closest ? event.target.closest('[data-astolfo]') : null;
        if (!action) return;
        const what = action.getAttribute('data-astolfo');
        if (what === 'toggle') toggle();
        else if (what === 'preview') openPreview();
        else if (what === 'css') {
          /* abre a folha do tema numa aba nova: útil para copiar as cores */
          window.open('assets/css/astolfo.css', '_blank', 'noopener');
        }
      });
    }

    document.querySelectorAll('[data-astolfo="toggle"]').forEach(function (button) {
      if (card && card.contains(button)) return;
      button.addEventListener('click', function () { toggle(); });
    });

    const preview = document.getElementById('astolfo-preview');
    if (preview) {
      preview.addEventListener('click', function (event) {
        if (event.target === preview) closePreview();
        const closer = event.target.closest ? event.target.closest('[data-astolfo="close"]') : null;
        if (closer) closePreview();
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && preview.open) closePreview();
      });
    }

    renderCard();
  }

  /* ---------- inicialização ---------- */
  document.addEventListener('keydown', press, true);
  window.addEventListener('keydown', press, true);   /* reforço: algumas telas só ouvem window */

  /* o tema do site pode mudar de claro/escuro: a barra do navegador acompanha */
  window.addEventListener('lumin:theme', function () {
    if (!enabled) return;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', root.getAttribute('data-theme') === 'light' ? THEME_COLOR.light : THEME_COLOR.dark);
  });

  /* outra aba do site trocou o tema */
  window.addEventListener('storage', function (event) {
    if (event.key !== KEY) return;
    set(event.newValue === 'on', { silent: true, force: true });
  });

  const saved = stored();
  if (saved) {
    ensureCss();
    enabled = saved;
    applyDocument(enabled);
    if (document.body) document.body.classList.toggle('is-astolfo', enabled);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUI);
  else initUI();

  window.LuminAstolfo = {
    on: function () { return set(true); },
    off: function () { return set(false); },
    toggle: toggle,
    state: function () { return { on: enabled, saved: stored(), css: !!document.getElementById('astolfo-css') }; },
    preview: openPreview,
    close: closePreview,
    key: 'Ctrl + AltGr + Y'
  };
})();
