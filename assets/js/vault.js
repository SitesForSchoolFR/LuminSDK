/* =========================================================
   App "Cofre" do LuminOS — backup, códigos e dados
   Aba de backup (exportar/importar JSON), códigos por app,
   mapa de armazenamento e o canto do desenvolvedor (status dos
   assets, registro de erros e playground).
   Autor: Ryan Smith · Licença MIT
   ========================================================= */
(function () {
  'use strict';

  const OS = window.LuminOS;
  if (!OS || typeof OS.register !== 'function') return;
  const el = OS.ui.el;
  const esc = OS.ui.esc;
  const toast = OS.ui.toast;

  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="12" cy="10.5" r="2.6"/><path d="M8.5 17c.6-1.6 1.9-2.4 3.5-2.4s2.9.8 3.5 2.4"/><path d="M7 4v3M17 4v3"/></svg>';
  const PREFIX = 'luminsdk';
  const BACKUP_VERSION = 1;

  /* ---------- registro de erros (instalado o mais cedo possível) ---------- */
  const LOG = { items: [], max: 40 };
  function logPush(kind, message) {
    LOG.items.push({ kind: kind, t: String(message || '').slice(0, 260), at: Date.now() });
    while (LOG.items.length > LOG.max) LOG.items.shift();
  }
  window.LuminLog = { list: function () { return LOG.items.slice(); }, clear: function () { LOG.items.length = 0; } };
  window.addEventListener('error', function (event) {
    logPush('erro', (event && event.message) || 'erro de script');
  });
  window.addEventListener('unhandledrejection', function (event) {
    const reason = event && event.reason;
    logPush('promessa', (reason && (reason.message || reason)) || 'promessa rejeitada');
  });

  const TABS = [
    { id: 'backup', name: 'Backup' },
    { id: 'codes', name: 'Códigos' },
    { id: 'data', name: 'Dados' },
    { id: 'dev', name: 'Desenvolvedor' }
  ];

  const CHANGELOG = [
    { v: 'v35', items: [
      'Laboratório: teste de controle, teclado e mouse, latência e diagnóstico.',
      'Estúdio: tema, cor de destaque, densidade, modos Lite/Imersivo e paleta Ctrl+K.',
      'Arcade: alvo rápido, bichinho, quiz, soundboard e roleta de jogos.',
      'Cofre: backup completo, códigos por app, mapa de dados e playground.',
      'Comunidade: compartilhar coleções por código (Local-First, entenda no app).'
    ] },
    { v: 'v34', items: [
      'Player Hub: perfil com XP, nível, conquistas, desafios, coleções e resenhas.',
      'Chip de nível no dock e bônus diário.'
    ] },
    { v: 'v33', items: ['Filmes com seis espelhos abrindo dentro do OS.', 'Ajustes que nunca esvaziam a tela.'] }
  ];

  const view = { tab: 'backup' };

  /* ---------- utilidades ---------- */
  function allKeys() {
    const out = [];
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && key.indexOf(PREFIX) === 0) out.push(key);
      }
    } catch (error) {}
    return out.sort();
  }

  function bytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1048576).toFixed(2) + ' MB';
  }

  function collect() {
    const data = {};
    allKeys().forEach(function (key) {
      try { data[key] = localStorage.getItem(key); } catch (error) {}
    });
    return { app: 'LuminSDK', v: BACKUP_VERSION, at: new Date().toISOString(), data: data };
  }

  function restore(text) {
    let raw = null;
    try { raw = JSON.parse(String(text || '')); } catch (error) { return { ok: false, error: 'o arquivo não é um JSON válido' }; }
    if (!raw || typeof raw !== 'object') return { ok: false, error: 'conteúdo inesperado' };
    const data = raw.data && typeof raw.data === 'object' ? raw.data : raw;
    const keys = Object.keys(data).filter(function (key) { return key.indexOf(PREFIX) === 0 && typeof data[key] === 'string'; });
    if (!keys.length) return { ok: false, error: 'nenhuma chave do LuminSDK encontrada no arquivo' };
    keys.forEach(function (key) {
      try { localStorage.setItem(key, data[key]); } catch (error) {}
    });
    return { ok: true, keys: keys.length };
  }

  /* checksum simples para detectar código corrompido */
  function checksum(text) {
    let sum = 5381;
    for (let i = 0; i < text.length; i += 1) sum = ((sum * 33) ^ text.charCodeAt(i)) >>> 0;
    return sum.toString(36).slice(0, 4).toUpperCase();
  }

  function b64(text) {
    try {
      return btoa(unescape(encodeURIComponent(text))).replace(/\+/g, '.').replace(/\//g, '_').replace(/=+$/, '');
    } catch (error) { return ''; }
  }

  function unb64(text) {
    const padded = text.replace(/\./g, '+').replace(/_/g, '/');
    return decodeURIComponent(escape(atob(padded + '==='.slice((padded.length + 3) % 4))));
  }

  function makeCode(kind, payload) {
    const body = b64(JSON.stringify(payload));
    if (!body) return '';
    return 'LUM-' + kind + '-' + body + '-' + checksum(kind + body);
  }

  function readCode(code) {
    const text = String(code || '').trim();
    if (text.length > 900) return { kind: '', error: 'longo demais' };
    const parts = text.split('-');
    if (parts.length !== 4 || parts[0].toUpperCase() !== 'LUM') return null;
    const kind = parts[1].toUpperCase();
    const body = parts[2];
    if (checksum(kind + body) !== parts[3].toUpperCase()) return { kind: kind, error: 'checksum' };
    try { return { kind: kind, payload: JSON.parse(unb64(body)) }; } catch (error) { return { kind: kind, error: 'payload' }; }
  }

  function prefsPayload() {
    const p = OS.ui.prefs();
    return { wall: p.wall, accent: p.accent, accentHex: p.accentHex || '', density: p.density, font: p.font, lite: !!p.lite, immersive: !!p.immersive, motion: p.motion !== false, contrast: !!p.contrast };
  }

  /* selo visual determinístico (não é QR — é só uma impressão do arquivo) */
  function sealSvg(seed) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i += 1) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    const cells = [];
    let x = h || 7;
    for (let i = 0; i < 81; i += 1) {
      x = (Math.imul(x, 1103515245) + 12345) >>> 0;
      if ((x >>> 16) % 2 === 0) cells.push('<rect x="' + (i % 9) + '" y="' + Math.floor(i / 9) + '" width="1" height="1"/>');
    }
    return '<svg viewBox="0 0 9 9" width="132" height="132" shape-rendering="crispEdges" aria-label="Selo do backup">' +
      '<rect width="9" height="9" fill="#0c0c12"/><g fill="#c4b5fd">' + cells.join('') + '</g></svg>';
  }

  /* ---------- abas ---------- */
  function paintBackup(box) {
    const snapshot = collect();
    const payload = JSON.stringify(snapshot);
    box.innerHTML = [
      '<section class="kp-card"><h3>Exportar</h3>',
      '<p class="kp-note">Leva perfil, XP, coleções, preferências, notas, pet e avisos. ' + bytes(payload.length) + ' · ' + Object.keys(snapshot.data).length + ' chaves.</p>',
      '<div class="kp-row"><button class="kp-btn kp-btn--primary" type="button" data-export>Baixar backup .json</button>',
      '<button class="kp-btn" type="button" data-copy>Copiar JSON</button><button class="kp-btn" type="button" data-preview>Ver conteúdo</button></div>',
      '<pre class="kp-code" data-preview-box hidden></pre></section>',

      '<section class="kp-card"><h3>Importar</h3>',
      '<p class="kp-note">Cole o JSON ou escolha o arquivo. Só chaves <code>luminsdk*</code> são aceitas.</p>',
      '<textarea class="kp-field" data-import rows="4" placeholder="{ &quot;app&quot;: &quot;LuminSDK&quot;, … }" aria-label="JSON do backup"></textarea>',
      '<div class="kp-row"><input type="file" accept=".json,application/json" data-file aria-label="Arquivo de backup">',
      '<button class="kp-btn kp-btn--primary" type="button" data-restore>Restaurar</button></div>',
      '<p class="kp-note" data-restore-out></p></section>',

      '<section class="kp-card"><h3>Selo deste backup</h3>',
      '<div class="kp-row" style="align-items:flex-start">' + sealSvg(payload) +
      '<div style="flex:1;min-width:0"><p class="kp-note">Impressão visual do arquivo atual (' + checksum(payload) + '). Serve para comparar dois backups rapidamente — <b>não é um QR code</b> e não carrega dados.</p></div></div></section>'
    ].join('');

    box.querySelector('[data-export]').addEventListener('click', function () {
      const text = JSON.stringify(collect(), null, 2);
      const name = 'luminsdk-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      try {
        const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
        const link = el('a');
        link.href = url;
        link.download = name;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        toast('Backup gerado: ' + name);
      } catch (error) {
        toast('O navegador bloqueou o download. Use "Copiar JSON".');
      }
    });

    box.querySelector('[data-copy]').addEventListener('click', function () {
      const text = JSON.stringify(collect(), null, 2);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { toast('JSON copiado.'); }, function () { toast('Não deu para copiar.'); });
      } else toast('Copie pelo botão "Ver conteúdo".');
    });

    box.querySelector('[data-preview]').addEventListener('click', function () {
      const pre = box.querySelector('[data-preview-box]');
      pre.hidden = !pre.hidden;
      pre.textContent = JSON.stringify(collect(), null, 2).slice(0, 6000);
    });

    box.querySelector('[data-file]').addEventListener('change', function (event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function () { box.querySelector('[data-import]').value = String(reader.result || '').slice(0, 400000); };
      reader.readAsText(file);
    });

    box.querySelector('[data-restore]').addEventListener('click', function () {
      const result = restore(box.querySelector('[data-import]').value);
      const out = box.querySelector('[data-restore-out]');
      if (!result.ok) { out.textContent = 'Não importei: ' + result.error + '.'; return; }
      out.textContent = result.keys + ' chaves restauradas. Recarregue o OS para ver tudo aplicado.';
      toast('Backup restaurado (' + result.keys + ' chaves).');
      if (window.LuminOS.ui.applyPrefs) OS.ui.applyPrefs();
    });
  }

  function paintCodes(box) {
    box.innerHTML = [
      '<section class="kp-card"><h3>Gerar código</h3>',
      '<p class="kp-note">Códigos levam um pedaço do seu OS para outra pessoa ou para outro navegador. Nada sai daqui — você copia e cola.</p>',
      '<div class="kp-row"><button class="kp-btn kp-btn--primary" type="button" data-gen="PREF">Aparência</button>',
      '<button class="kp-btn" type="button" data-gen="PLAY">Progresso</button>',
      '<button class="kp-btn" type="button" data-gen="PET">Bichinho</button></div>',
      '<input class="kp-field" data-code-out readonly placeholder="o código aparece aqui" aria-label="Código gerado">',
      '<div class="kp-row"><button class="kp-btn" type="button" data-copy-code>Copiar</button></div></section>',

      '<section class="kp-card"><h3>Ler código</h3>',
      '<textarea class="kp-field" data-code-in rows="2" placeholder="LUM-PREF-…" aria-label="Código para importar"></textarea>',
      '<div class="kp-row"><button class="kp-btn kp-btn--primary" type="button" data-apply>Aplicar código</button></div>',
      '<p class="kp-note" data-code-msg>O checksum no fim detecta código cortado ou alterado.</p></section>',

      '<section class="kp-card"><h3>Como funciona</h3><div class="kp-list">',
      '<div class="kp-item"><b style="min-width:52px">PREF</b><span class="kp-grow">tema, cor, densidade e efeitos</span></div>',
      '<div class="kp-item"><b style="min-width:52px">PLAY</b><span class="kp-grow">nível, XP e jogos favoritos</span></div>',
      '<div class="kp-item"><b style="min-width:52px">PET</b><span class="kp-grow">nome e estado do bichinho</span></div>',
      '</div></section>'
    ].join('');

    const out = box.querySelector('[data-code-out]');

    box.querySelectorAll('[data-gen]').forEach(function (button) {
      button.addEventListener('click', function () {
        const kind = button.dataset.gen;
        let payload = null;
        if (kind === 'PREF') payload = prefsPayload();
        else if (kind === 'PLAY' && window.LuminPlayer) {
          const summary = window.LuminPlayer.summary();
          const data = window.LuminPlayer.read();
          payload = { n: summary.level, x: summary.xp, f: (data.favorites || []).slice(0, 8).map(String) };
        } else if (kind === 'PET') {
          try { payload = JSON.parse(localStorage.getItem('luminsdk:pet:v1') || 'null'); } catch (error) { payload = null; }
          if (payload) payload = { name: payload.name, h: Math.round(payload.hunger), j: Math.round(payload.joy), e: Math.round(payload.energy) };
        }
        if (!payload) { out.value = ''; toast('Sem dados para gerar este código ainda.'); return; }
        out.value = makeCode(kind, payload);
        toast('Código ' + kind + ' gerado.');
      });
    });

    box.querySelector('[data-copy-code]').addEventListener('click', function () {
      if (!out.value) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(out.value).then(function () { toast('Código copiado.'); }, function () { out.select(); });
      } else out.select();
    });

    box.querySelector('[data-apply]').addEventListener('click', function () {
      const msg = box.querySelector('[data-code-msg]');
      const parsed = readCode(box.querySelector('[data-code-in]').value);
      if (!parsed) { msg.textContent = 'Isso não parece um código LUM-…'; return; }
      if (parsed.error) { msg.textContent = 'Código inválido (' + parsed.error + '). Confira se copiou inteiro.'; return; }
      const p = parsed.payload || {};
      if (parsed.kind === 'PREF') {
        OS.ui.savePrefs({
          wall: p.wall, accent: p.accent, accentHex: p.accentHex || '', density: p.density,
          font: p.font, lite: !!p.lite, immersive: !!p.immersive, motion: p.motion !== false, contrast: !!p.contrast
        });
        msg.textContent = 'Aparência aplicada.';
        toast('Aparência importada.');
        return;
      }
      if (parsed.kind === 'PET') {
        try {
          const now = JSON.parse(localStorage.getItem('luminsdk:pet:v1') || 'null') || { born: Date.now(), last: Date.now() };
          now.name = String(p.name || now.name || 'Lumi').slice(0, 16);
          now.hunger = Number(p.h) || now.hunger || 60;
          now.joy = Number(p.j) || now.joy || 60;
          now.energy = Number(p.e) || now.energy || 60;
          localStorage.setItem('luminsdk:pet:v1', JSON.stringify(now));
          msg.textContent = 'Bichinho atualizado.';
        } catch (error) { msg.textContent = 'Não deu para gravar o bichinho.'; }
        return;
      }
      msg.textContent = 'Código PLAY entendido — abra o app Arcade para ver o bichinho e o Perfil para o nível.';
      toast('Código PLAY recebido (' + (p.n || '?') + ').');
    });
  }

  function paintData(box) {
    const keys = allKeys();
    const rows = keys.map(function (key) {
      let value = '';
      try { value = localStorage.getItem(key) || ''; } catch (error) {}
      return { key: key, size: value.length };
    }).sort(function (a, b) { return b.size - a.size; });
    const total = rows.reduce(function (sum, row) { return sum + row.size; }, 0);

    box.innerHTML = [
      '<section class="kp-card"><h3>Ocupação</h3>',
      '<div class="kp-stats"><div class="kp-stat"><b>' + bytes(total) + '</b><span>total guardado</span></div>',
      '<div class="kp-stat"><b>' + rows.length + '</b><span>chaves</span></div>',
      '<div class="kp-stat"><b data-quota>—</b><span>cota do navegador</span></div></div>',
      '<p class="kp-note">Tudo fica no seu navegador. Limpar o site apaga o progresso — exporte antes.</p></section>',

      '<section class="kp-card"><h3>Por app</h3><div class="kp-list" data-list>',
      rows.length ? rows.map(function (row) {
        return '<div class="kp-item"><span class="kp-grow" style="word-break:break-all">' + esc(row.key) + '</span><small>' + bytes(row.size) + '</small>' +
          '<button class="kp-btn" type="button" data-del="' + esc(row.key) + '">apagar</button></div>';
      }).join('') : '<p class="kp-empty">Nada guardado ainda.</p>',
      '</div></section>',

      '<section class="kp-card"><h3>Apagar tudo</h3>',
      '<p class="kp-note">Remove todas as chaves <code>luminsdk*</code> deste navegador. Não tem como desfazer.</p>',
      '<div class="kp-row"><button class="kp-btn kp-danger" type="button" data-wipe>Apagar meus dados</button></div></section>'
    ].join('');

    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(function (info) {
        const node = box.querySelector('[data-quota]');
        if (node) node.textContent = bytes(info.usage || 0);
      }, function () {});
    }

    box.querySelectorAll('[data-del]').forEach(function (button) {
      button.addEventListener('click', function () {
        try { localStorage.removeItem(button.dataset.del); } catch (error) {}
        toast('Chave apagada.');
        paint();
      });
    });

    box.querySelector('[data-wipe]').addEventListener('click', function () {
      if (!window.confirm('Apagar todo o progresso do LuminSDK neste navegador?')) return;
      allKeys().forEach(function (key) { try { localStorage.removeItem(key); } catch (error) {} });
      toast('Dados apagados. Recarregando…');
      setTimeout(function () { window.location.reload(); }, 700);
    });
  }

  function paintDev(box) {
    const prefs = OS.ui.prefs();
    box.innerHTML = [
      '<section class="kp-card"><h3>Novidades</h3><div class="kp-list">',
      CHANGELOG.map(function (entry) {
        return '<div class="kp-item" style="align-items:flex-start"><b style="min-width:42px">' + entry.v + '</b><span class="kp-grow">' +
          entry.items.map(function (item) { return '• ' + esc(item); }).join('<br>') + '</span></div>';
      }).join(''),
      '</div></section>',

      '<section class="kp-card"><h3>Status dos arquivos</h3>',
      '<p class="kp-note">Confere se os assets essenciais respondem (útil depois de um deploy).</p>',
      '<div class="kp-row"><button class="kp-btn" type="button" data-check>Testar assets</button></div>',
      '<div class="kp-list" data-assets><p class="kp-empty">Nada testado ainda.</p></div></section>',

      '<section class="kp-card"><h3>Registro de erros</h3>',
      '<p class="kp-note">Só desta sessão, na memória. Nada é enviado a lugar nenhum.</p>',
      '<div class="kp-list" data-errors></div>',
      '<div class="kp-row"><button class="kp-btn" type="button" data-clear-log>Limpar registro</button></div></section>',

      '<section class="kp-card"><h3>Preferências cruas</h3>',
      '<textarea class="kp-field" data-prefs rows="7" spellcheck="false" aria-label="JSON das preferências">' + esc(JSON.stringify(prefs, null, 2)) + '</textarea>',
      '<div class="kp-row"><button class="kp-btn kp-btn--primary" type="button" data-save-prefs>Salvar</button></div>',
      '<p class="kp-note" data-prefs-msg>Editar aqui é o mesmo que usar o Estúdio.</p></section>',

      '<section class="kp-card"><h3>Playground</h3>',
      '<p class="kp-note">Roda JavaScript nesta página. Use com cuidado.</p>',
      '<textarea class="kp-field" data-js rows="3" spellcheck="false" placeholder="LuminOS.ui.prefs()" aria-label="Código">LuminOS.ui.prefs()</textarea>',
      '<div class="kp-row"><button class="kp-btn kp-btn--primary" type="button" data-run>Executar</button></div>',
      '<pre class="kp-code" data-js-out>—</pre></section>'
    ].join('');

    function paintErrors() {
      const node = box.querySelector('[data-errors]');
      if (!node) return;
      const items = window.LuminLog.list().slice().reverse();
      node.innerHTML = items.length ? items.map(function (item) {
        const when = new Date(item.at);
        return '<div class="kp-item"><small>' + String(when.getHours()).padStart(2, '0') + ':' + String(when.getMinutes()).padStart(2, '0') + '</small>' +
          '<b style="min-width:56px">' + esc(item.kind) + '</b><span class="kp-grow" style="word-break:break-word">' + esc(item.t) + '</span></div>';
      }).join('') : '<p class="kp-empty">Nenhum erro nesta sessão. 🎉</p>';
    }
    paintErrors();

    box.querySelector('[data-clear-log]').addEventListener('click', function () {
      window.LuminLog.clear();
      paintErrors();
      toast('Registro limpo.');
    });

    box.querySelector('[data-check]').addEventListener('click', function () {
      const node = box.querySelector('[data-assets]');
      const files = ['assets/css/os.css', 'assets/js/os.js', 'assets/js/player.js', 'assets/js/studio.js', 'assets/data/gnmath-games.json'];
      node.innerHTML = '<p class="kp-empty">testando…</p>';
      Promise.all(files.map(function (file) {
        const started = Date.now();
        return fetch(file + '?status=' + started, { method: 'HEAD' }).then(function (response) {
          return { file: file, ok: response.ok, code: response.status, ms: Date.now() - started };
        }, function () {
          return { file: file, ok: false, code: 0, ms: Date.now() - started };
        });
      })).then(function (results) {
        node.innerHTML = results.map(function (item) {
          return '<div class="kp-item"><span style="color:' + (item.ok ? '#4ade80' : '#f87171') + '">●</span>' +
            '<span class="kp-grow" style="word-break:break-all">' + esc(item.file) + '</span>' +
            '<small>' + (item.ok ? 'ok' : 'falhou') + ' · ' + item.code + ' · ' + item.ms + 'ms</small></div>';
        }).join('');
      });
    });

    box.querySelector('[data-save-prefs]').addEventListener('click', function () {
      const msg = box.querySelector('[data-prefs-msg]');
      let parsed = null;
      try { parsed = JSON.parse(box.querySelector('[data-prefs]').value); } catch (error) { msg.textContent = 'JSON inválido.'; return; }
      if (!parsed || typeof parsed !== 'object') { msg.textContent = 'Precisa ser um objeto.'; return; }
      OS.ui.savePrefs(parsed);
      msg.textContent = 'Salvo.';
      toast('Preferências salvas.');
      paint();
    });

    box.querySelector('[data-run]').addEventListener('click', function () {
      const out = box.querySelector('[data-js-out]');
      const source = box.querySelector('[data-js]').value;
      try {
        const value = Function('"use strict";return (' + source + '\n);')();
        const shown = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
        out.textContent = shown === undefined ? 'undefined' : shown;
      } catch (error) {
        try {
          const value = Function('"use strict";' + source)();
          out.textContent = String(value === undefined ? 'undefined' : (typeof value === 'object' ? JSON.stringify(value, null, 2) : value));
        } catch (inner) {
          out.textContent = 'Erro: ' + inner.message;
        }
      }
    });
  }

  /* ---------- pintura ---------- */
  let body = null;

  function paint() {
    if (!body) return;
    const box = body.querySelector('[data-box]');
    box.scrollTop = 0;
    if (view.tab === 'backup') paintBackup(box);
    else if (view.tab === 'codes') paintCodes(box);
    else if (view.tab === 'data') paintData(box);
    else paintDev(box);
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
    id: 'vault',
    name: 'Cofre',
    short: 'Cofre',
    w: 720,
    h: 570,
    at: 5,
    icon: ICON,
    render: render
  });

  window.LuminVault = { collect: collect, restore: restore, makeCode: makeCode, readCode: readCode };
})();
