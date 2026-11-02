/* =========================================================
   App "Estúdio" do LuminOS — aparência, modos e comandos
   Junta as preferências de interface (tema, destaque, densidade,
   modo lite/imersivo, contraste), a central de avisos e a paleta de
   comandos (Ctrl/⌘ + K).
   Autor: Ryan Smith · Licença MIT
   ========================================================= */
(function () {
  'use strict';

  const OS = window.LuminOS;
  if (!OS || typeof OS.register !== 'function') return;
  const el = OS.ui.el;
  const esc = OS.ui.esc;
  const toast = OS.ui.toast;
  const prefs = OS.ui.prefs;
  const save = OS.ui.savePrefs;

  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16"/><path d="M7 20V9l5-5 5 5v11"/><path d="M10.5 20v-5h3v5"/></svg>';
  const NOTES_KEY = 'luminsdk:notify:v1';

  const ACCENTS = ['violeta', 'ciano', 'rosa', 'lima', 'ambar'];
  const DENSITY = [
    { id: 'compacto', name: 'Compacto' },
    { id: 'confortavel', name: 'Confortável' },
    { id: 'amplo', name: 'Amplo' }
  ];
  const FONTS = [
    { id: 'padrao', name: 'Padrão' },
    { id: 'serifada', name: 'Serifada' },
    { id: 'mono', name: 'Mono' }
  ];
  const PRESETS = [
    { id: 'padrao', name: 'Padrão', desc: 'Do jeito que veio', patch: { density: 'confortavel', lite: false, immersive: false, motion: true, contrast: false, font: 'padrao' } },
    { id: 'compacto', name: 'Compacto', desc: 'Mais coisa na tela', patch: { density: 'compacto', lite: false, immersive: true, motion: true, contrast: false, font: 'padrao' } },
    { id: 'lite', name: 'Lite', desc: 'Sem blur e sem sombra', patch: { density: 'confortavel', lite: true, immersive: false, motion: false, contrast: false, font: 'padrao' } },
    { id: 'foco', name: 'Foco', desc: 'Contraste alto, sem animação', patch: { density: 'amplo', lite: true, immersive: true, motion: false, contrast: true, font: 'mono' } }
  ];

  const TABS = [
    { id: 'look', name: 'Aparência' },
    { id: 'modes', name: 'Modos' },
    { id: 'cmds', name: 'Comandos' },
    { id: 'notes', name: 'Avisos' }
  ];

  const view = { tab: 'look' };
  let body = null;

  /* ---------- central de avisos ---------- */
  function notifyList() {
    try {
      const raw = JSON.parse(localStorage.getItem(NOTES_KEY) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch (error) { return []; }
  }

  window.LuminNotify = {
    push: function (text) {
      const clean = String(text || '').slice(0, 160);
      if (!clean) return;
      const list = notifyList();
      list.push({ t: clean, at: Date.now() });
      while (list.length > 40) list.shift();
      try { localStorage.setItem(NOTES_KEY, JSON.stringify(list)); } catch (error) {}
    },
    list: notifyList,
    clear: function () {
      try { localStorage.removeItem(NOTES_KEY); } catch (error) {}
    }
  };

  /* ---------- comandos ---------- */
  function commands() {
    const list = [
      { id: 'open:player', label: 'Abrir Perfil', run: function () { OS.open('player'); } },
      { id: 'open:central', label: 'Abrir Central', run: function () { OS.open('central'); } },
      { id: 'open:games', label: 'Abrir Jogos', run: function () { OS.open('games'); } },
      { id: 'open:movies', label: 'Abrir Filmes', run: function () { OS.open('movies'); } },
      { id: 'open:browser', label: 'Abrir Navegador', run: function () { OS.open('browser'); } },
      { id: 'open:sites', label: 'Abrir Sites', run: function () { OS.open('sites'); } },
      { id: 'open:lab', label: 'Abrir Laboratório', run: function () { OS.open('lab'); } },
      { id: 'open:studio', label: 'Abrir Estúdio', run: function () { OS.open('studio'); } },
      { id: 'open:arcade', label: 'Abrir Arcade', run: function () { OS.open('arcade'); } },
      { id: 'open:vault', label: 'Abrir Cofre', run: function () { OS.open('vault'); } },
      { id: 'open:notes', label: 'Abrir Notas', run: function () { OS.open('notes'); } },
      { id: 'open:calc', label: 'Abrir Calculadora', run: function () { OS.open('calc'); } },
      { id: 'open:settings', label: 'Abrir Ajustes', run: function () { OS.open('settings'); } },
      { id: 'wall:aurora', label: 'Fundo: Aurora', run: function () { save({ wall: 'aurora' }); } },
      { id: 'wall:meia-noite', label: 'Fundo: Meia Noite', run: function () { save({ wall: 'meia-noite' }); } },
      { id: 'wall:floresta', label: 'Fundo: Floresta', run: function () { save({ wall: 'floresta' }); } },
      { id: 'wall:papel', label: 'Fundo: Papel (claro)', run: function () { save({ wall: 'papel' }); } },
      { id: 'mode:lite', label: 'Alternar modo Lite', run: function () { save({ lite: !prefs().lite }); } },
      { id: 'mode:immersive', label: 'Alternar modo Imersivo', run: function () { save({ immersive: !prefs().immersive }); } },
      { id: 'mode:motion', label: 'Ligar/desligar animações', run: function () { save({ motion: prefs().motion === false }); } },
      { id: 'mode:contrast', label: 'Alternar alto contraste', run: function () { save({ contrast: !prefs().contrast }); } },
      { id: 'mode:boot', label: 'Voltar para a tela de entrada', run: function () { OS.setMode('boot'); } },
      { id: 'mode:site', label: 'Ir para o site normal', run: function () { OS.setMode('normal'); } }
    ];
    return list;
  }

  /* ---------- paleta ---------- */
  let palette = null;

  function closePalette() {
    if (!palette) return;
    palette.remove();
    palette = null;
  }

  function openPalette() {
    if (palette) { closePalette(); return; }
    const desk = OS.onDesk && OS.onDesk() ? document.getElementById('os') : null;
    const root = desk || document.body;
    palette = el('div', 'cmdk' + (desk ? '' : ' cmdk--solo'));
    palette.innerHTML = [
      '<div class="cmdk__box" role="dialog" aria-label="Paleta de comandos">',
      '  <input class="cmdk__input" type="text" placeholder="O que você quer fazer? (apps, temas, modos)" aria-label="Buscar comando">',
      '  <div class="cmdk__list"></div>',
      '</div>'
    ].join('');
    root.append(palette);

    const input = palette.querySelector('input');
    const list = palette.querySelector('.cmdk__list');
    let index = 0;
    let shown = commands();

    function paint() {
      const query = input.value.trim().toLowerCase();
      shown = commands().filter(function (item) { return !query || item.label.toLowerCase().indexOf(query) >= 0; }).slice(0, 9);
      if (index >= shown.length) index = Math.max(0, shown.length - 1);
      list.innerHTML = shown.length ? '' : '<p class="kp-empty" style="padding:10px">Nada com esse termo.</p>';
      shown.forEach(function (item, position) {
        const button = el('button', 'cmdk__item');
        button.type = 'button';
        button.innerHTML = '<span>' + esc(item.label) + '</span><small>' + esc(item.id.split(':')[0]) + '</small>';
        button.classList.toggle('is-on', position === index);
        button.addEventListener('click', function () { run(item); });
        list.append(button);
      });
    }

    function run(item) {
      closePalette();
      try { item.run(); } catch (error) { toast('Não deu para executar esse comando.'); }
    }

    input.addEventListener('input', function () { index = 0; paint(); });
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { event.preventDefault(); closePalette(); return; }
      if (event.key === 'ArrowDown') { event.preventDefault(); index = Math.min(shown.length - 1, index + 1); paint(); }
      if (event.key === 'ArrowUp') { event.preventDefault(); index = Math.max(0, index - 1); paint(); }
      if (event.key === 'Enter') {
        event.preventDefault();
        if (shown[index]) run(shown[index]);
      }
    });
    palette.addEventListener('pointerdown', function (event) {
      if (event.target === palette) closePalette();
    });
    paint();
    setTimeout(function () { input.focus(); }, 20);
  }

  window.addEventListener('keydown', function (event) {
    if (!(event.ctrlKey || event.metaKey) || String(event.key).toLowerCase() !== 'k') return;
    /* vale no desktop e na aba Hub (site normal) */
    if (!(OS.onDesk && OS.onDesk()) && !document.querySelector('#view-hub.is-active')) return;
    event.preventDefault();
    openPalette();
  });

  /* ---------- pintura das abas ---------- */
  function toggleRow(id, title, desc, on) {
    return '<div class="kp-toggle"><div style="flex:1;min-width:0"><b>' + esc(title) + '</b><small>' + esc(desc) + '</small></div>' +
      '<button class="kp-switch" type="button" role="switch" aria-pressed="' + (on ? 'true' : 'false') + '" data-toggle="' + id + '" aria-label="' + esc(title) + '"></button></div>';
  }

  function paintLook(box) {
    const p = prefs();
    box.innerHTML = [
      '<section class="kp-card"><h3>Papel de parede</h3><div class="kp-row" data-walls>',
      OS.ui.walls.map(function (wall) {
        return '<button class="kp-btn' + ((p.wall || 'aurora') === wall ? ' is-on' : '') + '" type="button" data-wall="' + wall + '">' + esc(wall.replace('-', ' ')) + '</button>';
      }).join(''),
      '</div></section>',

      '<section class="kp-card"><h3>Cor de destaque</h3><div class="kp-row" data-accents>',
      ACCENTS.map(function (accent) {
        return '<button class="kp-btn' + ((p.accent || 'violeta') === accent && !p.accentHex ? ' is-on' : '') + '" type="button" data-accent="' + accent + '">' + esc(accent) + '</button>';
      }).join(''),
      '</div><div class="kp-swatches"><input class="kp-color" type="color" data-color value="' + esc(p.accentHex || '#8b5cf6') + '" aria-label="Cor personalizada">',
      '<button class="kp-btn" type="button" data-color-clear>Voltar ao padrão</button></div>',
      '<p class="kp-note">A cor escolhida vale para brilhos, bordas, papel de parede e botões.</p></section>',

      '<section class="kp-card"><h3>Densidade</h3><div class="kp-row" data-density>',
      DENSITY.map(function (item) {
        return '<button class="kp-btn' + ((p.density || 'confortavel') === item.id ? ' is-on' : '') + '" type="button" data-density-id="' + item.id + '">' + item.name + '</button>';
      }).join(''),
      '</div></section>',

      '<section class="kp-card"><h3>Tipografia</h3><div class="kp-row" data-fonts>',
      FONTS.map(function (item) {
        return '<button class="kp-btn' + ((p.font || 'padrao') === item.id ? ' is-on' : '') + '" type="button" data-font="' + item.id + '">' + item.name + '</button>';
      }).join(''),
      '</div></section>',

      '<section class="kp-card"><h3>Efeitos</h3><div style="display:grid;gap:6px">',
      toggleRow('lite', 'Modo Lite', 'Sem desfoque, sem sombra: mais leve em máquina fraca', !!p.lite),
      toggleRow('immersive', 'Modo imersivo', 'Esconde os atalhos do desktop (fica só o dock)', !!p.immersive),
      toggleRow('motion', 'Animações', 'Movimento nas janelas e nos cards', p.motion !== false),
      toggleRow('contrast', 'Alto contraste', 'Texto e bordas mais fortes', !!p.contrast),
      '</div></section>'
    ].join('');

    box.querySelectorAll('[data-wall]').forEach(function (button) {
      button.addEventListener('click', function () {
        save({ wall: button.dataset.wall });
        paint();
      });
    });
    box.querySelectorAll('[data-accent]').forEach(function (button) {
      button.addEventListener('click', function () {
        save({ accent: button.dataset.accent, accentHex: '' });
        paint();
      });
    });
    box.querySelector('[data-color]').addEventListener('input', function (event) {
      save({ accentHex: event.target.value });
    });
    box.querySelector('[data-color-clear]').addEventListener('click', function () {
      save({ accentHex: '' });
      paint();
    });
    box.querySelectorAll('[data-density-id]').forEach(function (button) {
      button.addEventListener('click', function () {
        save({ density: button.dataset.densityId });
        paint();
      });
    });
    box.querySelectorAll('[data-font]').forEach(function (button) {
      button.addEventListener('click', function () {
        save({ font: button.dataset.font });
        paint();
      });
    });
    box.querySelectorAll('[data-toggle]').forEach(function (button) {
      button.addEventListener('click', function () {
        const key = button.dataset.toggle;
        const p2 = prefs();
        const value = key === 'motion' ? p2.motion === false : !p2[key];
        save({ [key]: value });
        paint();
      });
    });
  }

  function paintModes(box) {
    box.innerHTML = [
      '<section class="kp-card"><h3>Combinações prontas</h3>',
      '<div class="kp-grid2">',
      PRESETS.map(function (preset) {
        return '<button class="kp-btn" type="button" style="display:grid;gap:2px;text-align:left;padding:11px" data-preset="' + preset.id + '">' +
          '<b style="font-size:.82rem">' + esc(preset.name) + '</b>' +
          '<small style="font-size:.66rem;color:#7f7f96">' + esc(preset.desc) + '</small></button>';
      }).join(''),
      '</div><p class="kp-note">Cada modo combina densidade, efeitos e contraste. Dá para ajustar tudo depois em Aparência.</p></section>',

      '<section class="kp-card"><h3>Fluxo de trabalho</h3>',
      '<div class="kp-row"><button class="kp-btn kp-btn--primary" type="button" data-palette>Abrir paleta de comandos</button>',
      '<span class="kp-kbd">Ctrl/⌘ + K</span></div>',
      '<p class="kp-note">A paleta abre por cima de qualquer app e executa em um Enter.</p></section>',

      '<section class="kp-card"><h3>Atalhos</h3><div class="kp-list">',
      '<div class="kp-item"><span class="kp-kbd">Ctrl/⌘ K</span><span class="kp-grow">Paleta de comandos</span></div>',
      '<div class="kp-item"><span class="kp-kbd">Esc</span><span class="kp-grow">Fechar paleta / aviso</span></div>',
      '<div class="kp-item"><span class="kp-kbd">Tab</span><span class="kp-grow">Percorrer apps e abas</span></div>',
      '<div class="kp-item"><span class="kp-kbd">Enter</span><span class="kp-grow">Abrir o item focado</span></div>',
      '</div></section>'
    ].join('');

    box.querySelectorAll('[data-preset]').forEach(function (button) {
      button.addEventListener('click', function () {
        const preset = PRESETS.filter(function (item) { return item.id === button.dataset.preset; })[0];
        if (!preset) return;
        save(preset.patch);
        toast('Modo ' + preset.name + ' aplicado.');
        paint();
      });
    });
    box.querySelector('[data-palette]').addEventListener('click', openPalette);
  }

  function paintCmds(box) {
    const list = commands();
    box.innerHTML = [
      '<section class="kp-card"><h3>Todos os comandos</h3>',
      '<input class="kp-field" type="search" placeholder="filtrar…" data-filter aria-label="Filtrar comandos">',
      '<div class="kp-list" data-list></div></section>'
    ].join('');

    const listNode = box.querySelector('[data-list]');
    const input = box.querySelector('[data-filter]');

    function paint() {
      const query = input.value.trim().toLowerCase();
      listNode.innerHTML = '';
      list.filter(function (item) { return !query || item.label.toLowerCase().indexOf(query) >= 0; }).forEach(function (item) {
        const row = el('div', 'kp-item');
        row.innerHTML = '<span class="kp-grow">' + esc(item.label) + '</span><button class="kp-btn" type="button">executar</button>';
        row.querySelector('button').addEventListener('click', function () {
          try { item.run(); toast(item.label + ' ✓'); } catch (error) { toast('Não deu.'); }
        });
        listNode.append(row);
      });
      if (!listNode.children.length) listNode.innerHTML = '<p class="kp-empty">Nada com esse termo.</p>';
    }
    input.addEventListener('input', paint);
    paint();
  }

  function paintNotes(box) {
    const list = notifyList().slice().reverse();
    box.innerHTML = [
      '<section class="kp-card"><h3>Central de avisos</h3>',
      '<p class="kp-note">Tudo o que o OS avisou (XP, conquistas, backups) fica listado aqui.</p>',
      '<div class="kp-list" data-list></div>',
      '<div class="kp-row"><button class="kp-btn kp-danger" type="button" data-clear>Limpar avisos</button></div></section>'
    ].join('');

    const node = box.querySelector('[data-list]');
    if (!list.length) node.innerHTML = '<p class="kp-empty">Nada por aqui ainda.</p>';
    list.forEach(function (item) {
      const when = new Date(item.at);
      const row = el('div', 'kp-item');
      row.innerHTML = '<span class="kp-grow">' + esc(item.t) + '</span><small>' +
        String(when.getHours()).padStart(2, '0') + ':' + String(when.getMinutes()).padStart(2, '0') + '</small>';
      node.append(row);
    });
    box.querySelector('[data-clear]').addEventListener('click', function () {
      window.LuminNotify.clear();
      paint();
    });
  }

  function paint() {
    if (!body) return;
    const box = body.querySelector('[data-box]');
    box.scrollTop = 0;
    if (view.tab === 'look') paintLook(box);
    else if (view.tab === 'modes') paintModes(box);
    else if (view.tab === 'cmds') paintCmds(box);
    else paintNotes(box);
  }

  function render(host) {
    body = host;
    host.innerHTML = [
      '<div class="kp">',
      '  <nav class="kp-tabs">',
      TABS.map(function (item) {
        return '<button class="kp-tab" type="button" data-tab="' + item.id + '">' + item.name + '</button>';
      }).join(''),
      '  </nav>',
      '  <div class="kp-body" data-box></div>',
      '</div>'
    ].join('');
    host.querySelectorAll('[data-tab]').forEach(function (button) {
      button.addEventListener('click', function () {
        view.tab = button.dataset.tab;
        host.querySelectorAll('[data-tab]').forEach(function (item) { item.classList.toggle('is-on', item === button); });
        paint();
      });
    });
    host.querySelector('[data-tab]').classList.add('is-on');
    paint();
  }

  OS.register({
    id: 'studio',
    name: 'Estúdio',
    short: 'Estúdio',
    w: 700,
    h: 560,
    at: 3,
    icon: ICON,
    render: render
  });

  /* a paleta precisa existir mesmo com a janela fechada */
  window.LuminStudio = { palette: openPalette, commands: commands };
})();
