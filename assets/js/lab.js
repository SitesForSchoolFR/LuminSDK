/* =========================================================
   App "Laboratório" do LuminOS — controles e diagnóstico
   Gamepad (visualizador, vibração, layout), teclado, mouse,
   latência de entrada e uma bateria de diagnóstico do navegador.
   Autor: Ryan Smith · Licença MIT
   ========================================================= */
(function () {
  'use strict';

  const OS = window.LuminOS;
  if (!OS || typeof OS.register !== 'function') return;
  const el = OS.ui.el;
  const esc = OS.ui.esc;
  const toast = OS.ui.toast;

  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v5.5L5.6 17a3.2 3.2 0 0 0 2.9 4.6h7a3.2 3.2 0 0 0 2.9-4.6L14 8.5V3"/><path d="M7.4 14.5h9.2"/></svg>';

  const TABS = [
    { id: 'pad', name: 'Controle' },
    { id: 'input', name: 'Teclado e mouse' },
    { id: 'latency', name: 'Latência' },
    { id: 'diag', name: 'Diagnóstico' }
  ];

  const PAD_LAYOUTS = {
    xbox: ['A', 'B', 'X', 'Y'],
    play: ['✕', '○', '□', '△']
  };

  const KEYS = [
    ['Esc', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
    ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']'],
    ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ç', '~', 'Enter'],
    ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', ';', '/', 'Shift'],
    ['Ctrl', 'Alt', 'Space', 'Alt', 'Fn', 'Ctrl']
  ];

  const SHORTCUTS = [
    ['Ctrl / ⌘ + K', 'Abrir a paleta de comandos'],
    ['Esc', 'Fechar a paleta ou o aviso aberto'],
    ['Duplo clique na barra', 'Maximizar ou restaurar a janela'],
    ['Canto inferior direito', 'Redimensionar a janela'],
    ['Enter / Espaço', 'Abrir o cartão focado'],
    ['Setas + Tab', 'Navegar entre apps, cartões e abas']
  ];

  const view = { tab: 'pad', layout: 'xbox', fps: 0, ping: null, latency: null, report: '' };
  let raf = 0;
  let body = null;

  /* ---------- utilidades ---------- */
  function card(title, inner, hint) {
    return '<section class="kp-card"><h3>' + esc(title) + '</h3>' + inner + (hint ? '<p class="kp-note">' + hint + '</p>' : '') + '</section>';
  }

  function feature(name, ok) {
    return '<div class="kp-item"><span class="kp-grow">' + esc(name) + '</span><b style="color:' + (ok ? '#4ade80' : '#f87171') + '">' + (ok ? 'ok' : 'não') + '</b></div>';
  }

  function bytes(value) {
    if (!value) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let index = 0;
    let number = value;
    while (number >= 1024 && index < units.length - 1) { number /= 1024; index += 1; }
    return (Math.round(number * 10) / 10) + ' ' + units[index];
  }

  /* ---------- gamepad ---------- */
  function paintPad(box) {
    const padNames = PAD_LAYOUTS[view.layout];
    box.innerHTML = [
      card('Seu controle', [
        '<div class="kp-row"><button class="kp-btn" type="button" data-layout="xbox">Layout Xbox</button>',
        '<button class="kp-btn" type="button" data-layout="play">Layout PlayStation</button>',
        '<button class="kp-btn" type="button" data-rumble>Testar vibração</button></div>',
        '<p class="kp-note" data-padname>Conecte um controle e aperte qualquer botão.</p>',
        '<div class="kp-pad">',
        '  <div class="kp-sticks">',
        '    <div class="kp-stick" data-stick="0"><span class="kp-dot" data-dot="0"></span></div>',
        '    <div class="kp-stick" data-stick="1"><span class="kp-dot" data-dot="1"></span></div>',
        '  </div>',
        '  <div style="display:grid;gap:8px;min-width:180px">',
        '    <div class="kp-trigger"><span>Gatilho esquerdo <b data-tl>0%</b></span><i><b data-tlbar style="width:0%"></b></i></div>',
        '    <div class="kp-trigger"><span>Gatilho direito <b data-tr>0%</b></span><i><b data-trbar style="width:0%"></b></i></div>',
        '  </div>',
        '</div>',
        '<div class="kp-buttons" data-buttons></div>'
      ].join(''), 'Vibração só existe em navegador com suporte (Chromium no desktop).'),

      card('Botões de apoio', '<div class="kp-buttons" data-extra></div>', 'Os gatilhos aparecem na barra acima; o D-pad e os analógicos também são lidos em tempo real.'),

      card('Compatibilidade', [
        '<div class="kp-list">',
        feature('Gamepad API disponível', !!navigator.getGamepads),
        feature('Vibração (rumble)', !!(navigator.getGamepads && navigator.getGamepads()[0] && navigator.getGamepads()[0].vibrationActuator)),
        feature('Controle conectado', !!(navigator.getGamepads && [...navigator.getGamepads()].filter(Boolean).length)),
        '</div>'
      ].join(''), 'No Xbox, o navegador Edge entrega o controle padrão; o mapeamento é o mesmo do console.')
    ].join('');

    const nameNode = box.querySelector('[data-padname]');
    const buttons = box.querySelector('[data-buttons]');
    const extra = box.querySelector('[data-extra]');
    const padButtons = [];
    for (let i = 0; i < 4; i += 1) {
      const node = el('div', 'kp-padbtn', padNames[i]);
      buttons.append(node);
      padButtons.push(node);
    }
    const extras = ['↑', '↓', '←', '→', 'LB', 'RB', 'LT', 'RT', 'Back', 'Start', 'L3', 'R3'];
    extras.forEach(function (label) {
      extra.append(el('div', 'kp-padbtn', label));
    });

    box.querySelectorAll('[data-layout]').forEach(function (button) {
      button.classList.toggle('is-on', button.dataset.layout === view.layout);
      button.addEventListener('click', function () {
        view.layout = button.dataset.layout;
        paint();
      });
    });
    box.querySelector('[data-rumble]').addEventListener('click', function () {
      const gamepads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
      const act = gamepads[0] && gamepads[0].vibrationActuator;
      if (!act || !act.playEffect) { toast('Este navegador não expõe vibração.'); return; }
      act.playEffect('dual-rumble', { startDelay: 0, duration: 420, weakMagnitude: .8, strongMagnitude: .8 })
        .then(function () { toast('Vibração enviada ao controle.'); }, function () { toast('O controle recusou a vibração.'); });
    });

    /* loop de leitura */
    const dots = [box.querySelector('[data-dot="0"]'), box.querySelector('[data-dot="1"]')];
    const tl = box.querySelector('[data-tl]');
    const tr = box.querySelector('[data-tr]');
    const tlbar = box.querySelector('[data-tlbar]');
    const trbar = box.querySelector('[data-trbar]');
    const extraNodes = [...extra.children];

    const step = function () {
      if (!box.isConnected) return;
      const gamepads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
      const pad = gamepads[0];
      if (!pad) {
        nameNode.textContent = 'Nenhum controle conectado — aperte um botão do controle.';
      } else {
        nameNode.textContent = pad.id.slice(0, 64) + ' · ' + pad.buttons.length + ' botões';
        pad.axes.slice(0, 4).forEach(function (axis, index) {
          const dot = dots[Math.floor(index / 2)];
          if (!dot) return;
          const x = pad.axes[index % 2 === 0 ? index : index - 1] || 0;
          const y = axis;
          dot.style.transform = 'translate(' + Math.round(x * 34) + 'px,' + Math.round(y * 34) + 'px)';
        });
        padButtons.forEach(function (node, index) {
          const button = pad.buttons[index];
          node.classList.toggle('is-on', !!(button && button.pressed));
        });
        const lt = pad.buttons[6] ? pad.buttons[6].value : 0;
        const rt = pad.buttons[7] ? pad.buttons[7].value : 0;
        tl.textContent = Math.round(lt * 100) + '%';
        tr.textContent = Math.round(rt * 100) + '%';
        tlbar.style.width = Math.round(lt * 100) + '%';
        trbar.style.width = Math.round(rt * 100) + '%';
        extraNodes.forEach(function (node, index) {
          const map = [12, 13, 14, 15, 4, 5, 6, 7, 8, 9, 10, 11];
          const button = pad.buttons[map[index]];
          node.classList.toggle('is-on', !!(button && button.pressed));
        });
      }
      raf = requestAnimationFrame(step);
    };
    cancelAnimationFrame(raf);
    step();
  }

  /* ---------- teclado e mouse ---------- */
  function paintInput(box) {
    box.innerHTML = [
      card('Teclado', '<div class="kp-keyboard" data-keyboard></div><p class="kp-note">Clique no quadro acima do teclado e aperte qualquer tecla.</p>'),
      card('Mouse', [
        '<div class="kp-mouse" data-mouse><span>mova o mouse aqui dentro</span><span class="kp-mouse-dot" data-mouse-dot hidden></span></div>',
        '<div class="kp-stats">',
        '  <div class="kp-stat"><b data-mouse-pos>—</b><span>posição</span></div>',
        '  <div class="kp-stat"><b data-mouse-btn>—</b><span>último botão</span></div>',
        '  <div class="kp-stat"><b data-mouse-wheel>0</b><span>roda (delta)</span></div>',
        '  <div class="kp-stat"><b data-mouse-speed>0</b><span>px/s</span></div>',
        '</div>'
      ].join(''), 'O teste é local: nada do que você aperta sai do navegador.'),
      card('Atalhos do LuminOS', '<div class="kp-list">' + SHORTCUTS.map(function (pair) {
        return '<div class="kp-item"><span class="kp-kbd">' + esc(pair[0]) + '</span><span class="kp-grow">' + esc(pair[1]) + '</span></div>';
      }).join('') + '</div>')
    ].join('');

    /* teclado */
    const keyboard = box.querySelector('[data-keyboard]');
    const map = new Map();
    KEYS.forEach(function (row, index) {
      const line = el('div', 'kp-keyrow');
      row.forEach(function (label) {
        const key = el('span', 'kp-key', label);
        if (label === 'Space') key.classList.add('is-space');
        else if (label.length > 3) key.classList.add('is-wide');
        const id = label.toUpperCase();
        map.set(id, key);
        line.append(key);
      });
      if (index === 0) line.classList.add('kp-keyrow--top');
      keyboard.append(line);
    });

    const light = function (event, on) {
      const label = String(event.key || '').toUpperCase();
      const key = map.get(label === ' ' ? 'SPACE' : label === 'ESCAPE' ? 'ESC' : label);
      if (key) key.classList.toggle('is-on', on);
    };
    const down = function (event) { light(event, true); };
    const up = function (event) { light(event, false); };
    document.addEventListener('keydown', down);
    document.addEventListener('keyup', up);

    /* mouse */
    const stage = box.querySelector('[data-mouse]');
    const dot = box.querySelector('[data-mouse-dot]');
    const pos = box.querySelector('[data-mouse-pos]');
    const btn = box.querySelector('[data-mouse-btn]');
    const wheel = box.querySelector('[data-mouse-wheel]');
    const speed = box.querySelector('[data-mouse-speed]');
    let last = null;

    stage.addEventListener('pointermove', function (event) {
      const rect = stage.getBoundingClientRect();
      const x = Math.round(event.clientX - rect.left);
      const y = Math.round(event.clientY - rect.top);
      pos.textContent = x + ' × ' + y;
      dot.hidden = false;
      dot.style.left = x + 'px';
      dot.style.top = y + 'px';
      if (last) {
        const dt = Math.max(1, event.timeStamp - last.at);
        speed.textContent = Math.round((Math.hypot(x - last.x, y - last.y) / dt) * 1000);
      }
      last = { x: x, y: y, at: event.timeStamp };
    });
    stage.addEventListener('pointerdown', function (event) { btn.textContent = 'botão ' + event.button; });
    stage.addEventListener('wheel', function (event) {
      event.preventDefault();
      wheel.textContent = Math.round(event.deltaY);
    }, { passive: false });

    /* limpa os listeners quando a janela fecha */
    const watcher = setInterval(function () {
      if (box.isConnected) return;
      clearInterval(watcher);
      document.removeEventListener('keydown', down);
      document.removeEventListener('keyup', up);
    }, 1200);
  }

  /* ---------- latência ---------- */
  function paintLatency(box) {
    box.innerHTML = [
      card('Latência de entrada', [
        '<p class="kp-big" data-lat>—</p><p class="kp-note">Tempo entre a tecla descer e o navegador pintar o quadro seguinte.</p>',
        '<div class="kp-row"><button class="kp-btn kp-btn--primary" type="button" data-measure>Medir agora</button></div>',
        '<div class="kp-list" data-samples></div>'
      ].join(''), 'Use uma tecla repetida (setinha ou espaço) para pegar mais amostras.'),
      card('Teste de ping', [
        '<p class="kp-big" data-ping>—</p>',
        '<div class="kp-row"><button class="kp-btn" type="button" data-ping-btn>Medir ping (nosso servidor)</button></div>'
      ].join(''), 'Ping medido contra os arquivos do próprio LuminSDK — não é a sua operadora.')
    ].join('');

    const out = box.querySelector('[data-lat]');
    const list = box.querySelector('[data-samples]');
    const samples = [];
    let pending = null;

    const onKey = function (event) {
      if (!box.isConnected) { document.removeEventListener('keydown', onKey); return; }
      if (pending) return;
      pending = { at: performance.now() };
      requestAnimationFrame(function () {
        const value = Math.round((performance.now() - pending.at) * 10) / 10;
        pending = null;
        samples.push(value);
        if (samples.length > 8) samples.shift();
        out.textContent = value + ' ms';
        list.innerHTML = samples.slice().reverse().map(function (item, index) {
          return '<div class="kp-item"><span class="kp-grow">amostra ' + (samples.length - index) + '</span><b>' + item + ' ms</b></div>';
        }).join('');
      });
    };
    document.addEventListener('keydown', onKey);
    box.querySelector('[data-measure]').addEventListener('click', function () {
      const start = performance.now();
      requestAnimationFrame(function () {
        const value = Math.round((performance.now() - start) * 10) / 10;
        out.textContent = value + ' ms';
        toast('Frame em ' + value + ' ms');
      });
    });

    box.querySelector('[data-ping-btn]').addEventListener('click', function () {
      const node = box.querySelector('[data-ping]');
      node.textContent = '…';
      const url = 'assets/data/gnmath-games.json?ping=' + Date.now();
      const start = performance.now();
      fetch(url, { cache: 'no-store' }).then(function (response) {
        return response.arrayBuffer();
      }).then(function (buffer) {
        const ms = Math.round(performance.now() - start);
        node.textContent = ms + ' ms';
        toast('Ping ' + ms + ' ms · ' + bytes(buffer.byteLength));
      }).catch(function () {
        node.textContent = 'falhou';
      });
    });
  }

  /* ---------- diagnóstico ---------- */
  function paintDiag(box) {
    const nav = navigator;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection || {};
    const screenInfo = window.screen || {};
    let used = 0;
    try {
      Object.keys(localStorage).forEach(function (key) { used += (key.length + (localStorage.getItem(key) || '').length) * 2; });
    } catch (error) { used = 0; }

    box.innerHTML = [
      card('Navegador', [
        '<div class="kp-stats">',
        '  <div class="kp-stat"><b>' + esc((nav.userAgentData && nav.userAgentData.platform) || nav.platform || '—') + '</b><span>plataforma</span></div>',
        '  <div class="kp-stat"><b>' + (nav.hardwareConcurrency || '—') + '</b><span>núcleos</span></div>',
        '  <div class="kp-stat"><b>' + (nav.deviceMemory || '—') + ' GB</b><span>memória</span></div>',
        '  <div class="kp-stat"><b>' + esc(nav.language || '—') + '</b><span>idioma</span></div>',
        '</div>',
        '<p class="kp-code">' + esc(String(nav.userAgent).slice(0, 180)) + '</p>'
      ].join('')),

      card('Tela e conexão', [
        '<div class="kp-stats">',
        '  <div class="kp-stat"><b>' + (screenInfo.width || 0) + '×' + (screenInfo.height || 0) + '</b><span>tela</span></div>',
        '  <div class="kp-stat"><b>' + window.innerWidth + '×' + window.innerHeight + '</b><span>janela</span></div>',
        '  <div class="kp-stat"><b>' + (window.devicePixelRatio || 1) + 'x</b><span>densidade</span></div>',
        '  <div class="kp-stat"><b data-fps>—</b><span>FPS</span></div>',
        '</div>',
        '<div class="kp-row"><button class="kp-btn" type="button" data-fps-btn>Medir FPS (3 s)</button>',
        '<button class="kp-btn" type="button" data-full>Testar tela cheia</button></div>',
        '<p class="kp-note">Conexão: ' + esc(conn.effectiveType || 'desconhecida') + ' · ' + (conn.downlink ? conn.downlink + ' Mb/s estimados' : 'sem estimativa') + ' · ' + (nav.onLine ? 'online' : 'offline') + '</p>'
      ].join('')),

      card('Armazenamento', [
        '<div class="kp-stats">',
        '  <div class="kp-stat"><b>' + bytes(used) + '</b><span>localStorage</span></div>',
        '  <div class="kp-stat"><b data-quota>—</b><span>cota usada</span></div>',
        '  <div class="kp-stat"><b>' + (window.indexedDB ? 'sim' : 'não') + '</b><span>IndexedDB</span></div>',
        '  <div class="kp-stat"><b>' + ('serviceWorker' in nav ? 'sim' : 'não') + '</b><span>service worker</span></div>',
        '</div>',
        '<div class="kp-row"><button class="kp-btn" type="button" data-cache>Limpar cache do app</button>',
        '<button class="kp-btn kp-danger" type="button" data-cache-all>Apagar tudo (recarrega)</button></div>'
      ].join(''), 'Limpar o cache não apaga o seu perfil: XP, listas e notas ficam.'),

      card('Recursos', [
        '<div class="kp-list">',
        feature('Gamepad', !!nav.getGamepads),
        feature('WebAudio', !!(window.AudioContext || window.webkitAudioContext)),
        feature('Tela cheia', !!document.documentElement.requestFullscreen),
        feature('Área de transferência', !!navigator.clipboard),
        feature('Compartilhar', !!navigator.share),
        feature('Bateria', !!nav.getBattery),
        feature('Offline (service worker)', 'serviceWorker' in nav),
        feature('PWA instalável', !!document.querySelector('link[rel="manifest"]')),
        '</div>',
        '<p class="kp-note">Bateria: ' + (nav.getBattery ? 'consultando…' : 'este navegador não expõe') + '</p>'
      ].join('')),

      card('Relatório', [
        '<div class="kp-row"><button class="kp-btn kp-btn--primary" type="button" data-copy>Copiar diagnóstico</button></div>',
        '<pre class="kp-code" data-report hidden></pre>'
      ].join(''), 'Bom para colar num relato de bug ou no chat.')
    ].join('');

    /* cota */
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(function (info) {
        const node = box.querySelector('[data-quota]');
        if (!node) return;
        node.textContent = bytes(info.usage || 0) + ' / ' + bytes(info.quota || 0);
      }, function () {});
    }
    /* bateria */
    if (navigator.getBattery) {
      navigator.getBattery().then(function (battery) {
        const note = box.querySelector('.kp-note');
        if (note) note.textContent = 'Bateria: ' + Math.round(battery.level * 100) + '%' + (battery.charging ? ' (carregando)' : '');
      }, function () {});
    }

    /* FPS */
    box.querySelector('[data-fps-btn]').addEventListener('click', function () {
      const node = box.querySelector('[data-fps]');
      let frames = 0;
      const start = performance.now();
      const tick = function () {
        frames += 1;
        if (performance.now() - start < 3000) { requestAnimationFrame(tick); return; }
        const fps = Math.round((frames / (performance.now() - start)) * 1000);
        node.textContent = fps;
        toast('FPS medido: ' + fps);
      };
      node.textContent = '…';
      requestAnimationFrame(tick);
    });

    box.querySelector('[data-full]').addEventListener('click', function () {
      const target = box.closest('.win') || document.documentElement;
      if (document.fullscreenElement) { document.exitFullscreen(); return; }
      if (target.requestFullscreen) target.requestFullscreen().catch(function () { toast('O navegador recusou a tela cheia.'); });
    });

    box.querySelector('[data-cache]').addEventListener('click', function () {
      if (!window.caches) { toast('Este navegador não guarda cache de app.'); return; }
      caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (key) { return caches.delete(key); }));
      }).then(function () { toast('Cache do app limpo — o perfil continua aqui.'); });
    });

    box.querySelector('[data-cache-all]').addEventListener('click', function () {
      if (!window.confirm('Isso apaga perfil, notas, ajustes e cache deste navegador. Continuar?')) return;
      try {
        Object.keys(localStorage).forEach(function (key) {
          if (/^luminsdk/.test(key)) localStorage.removeItem(key);
        });
        sessionStorage.clear();
      } catch (error) {}
      if (window.caches) caches.keys().then(function (keys) { keys.forEach(function (key) { caches.delete(key); }); });
      setTimeout(function () { window.location.reload(); }, 300);
    });

    box.querySelector('[data-copy]').addEventListener('click', function () {
      const report = [
        'LuminSDK · diagnóstico',
        'UA: ' + navigator.userAgent,
        'plataforma: ' + (navigator.platform || '—') + ' · núcleos: ' + (navigator.hardwareConcurrency || '—') + ' · memória: ' + (navigator.deviceMemory || '—'),
        'tela: ' + window.screen.width + 'x' + window.screen.height + ' · janela: ' + window.innerWidth + 'x' + window.innerHeight + ' @' + window.devicePixelRatio + 'x',
        'conexão: ' + (conn.effectiveType || '—') + ' · online: ' + navigator.onLine,
        'armazenamento local: ' + bytes(used),
        'idioma: ' + navigator.language
      ].join('\n');
      const pre = box.querySelector('[data-report]');
      pre.hidden = false;
      pre.textContent = report;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(report).then(function () { toast('Diagnóstico copiado.'); }, function () { toast('Copie do quadro abaixo.'); });
      } else {
        toast('Copie do quadro abaixo.');
      }
    });
  }

  /* ---------- pintura ---------- */
  function paint() {
    if (!body) return;
    cancelAnimationFrame(raf);
    const box = body.querySelector('[data-box]');
    box.scrollTop = 0;
    if (view.tab === 'pad') paintPad(box);
    else if (view.tab === 'input') paintInput(box);
    else if (view.tab === 'latency') paintLatency(box);
    else paintDiag(box);
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
    id: 'lab',
    name: 'Laboratório',
    short: 'Lab',
    w: 760,
    h: 580,
    at: 2,
    icon: ICON,
    render: render
  });
})();
