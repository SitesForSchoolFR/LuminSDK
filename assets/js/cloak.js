/* =========================================================
   LuminSDK — abertura em about:blank
   Quando o portal é aberto, ele se muda para uma aba about:blank e o site
   original continua vivo dentro de um iframe nessa aba: a barra de endereço
   mostra about:blank e o LuminSDK (jogos, sites, estudos, os) segue
   funcionando igual, só que emoldurado.

   Como funciona:
   · o navegador só deixa abrir uma aba em resposta a um clique/tecla, então
     tentamos na carga do site e, se o pop-up for barrado, armamos UM
     clique/tecla em qualquer lugar da página para a segunda tentativa
   · a aba about:blank nasce vazia (mesma origem do portal), recebe um
     documento mínimo com o iframe apontando para o endereço original e
     depois o título da aba passa a espelhar o do site (StudyHub)
   · a aba ORIGINAL não fica no LuminSDK: ela vira https://www.google.com
     (é o "openBackup()" do Utopia: about:blank com o site no iframe +
     location.replace(google) na aba de trás), então nem o histórico nem a
     barra de endereço mostram o endereço do portal
   · a trava da sessão dura no máximo alguns minutos (não para sempre):
     fechou a aba about:blank e outros eventos de bloqueio, o portal volta
     a abrir a aba sozinho na próxima visita/recarga — nada de ficar preso
     no endereço real só porque uma tentativa antiga falhou
   · dentro do iframe este script se desliga sozinho (self !== top), então
     não existe laço de iframe dentro de iframe
   · ?cloak=0 no endereço desliga tudo (útil para depurar)

   Sem bibliotecas, sem build.
   Autor: Ryan Smith · Licença MIT
   ========================================================= */
(function () {
  'use strict';

  const KEY = 'luminsdk:v1:cloak:spawned';
  /* a trava da sessão não pode durar para sempre: 3 min depois de uma
     abertura, a próxima visita/recarga tenta de novo */
  const TTL = 3 * 60 * 1000;
  const NAME = 'luminsdk-cloak';
  /* para onde a aba original vai depois que o portal nasce no about:blank
     (mesmo destino do Utopia) */
  const REDIRECT = 'https://www.google.com/';
  const HERE = window.location.href;
  const BLANK = 'about:blank';
  const TITLE = document.title || 'LuminSDK';

  /* já estamos dentro do iframe, já somos a aba about:blank, ou é o
     arquivo único (que não deve migrar): nada a fazer */
  if (window.self !== window.top) return;
  if (window.name === NAME) return;
  if (window.__LUMIN_SINGLE__) return;

  if (/(?:^|[?&])cloak=0(?:&|$)/.test(window.location.search || '')) return;

  function alreadySpawned() {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (!raw) return false;
      if (raw === '1') {
        /* marca antiga (versões anteriores): expira agora — melhor tentar
           de novo do que ficar sem about:blank para sempre */
        sessionStorage.removeItem(KEY);
        return false;
      }
      const at = parseInt(raw, 10);
      if (!at || Date.now() - at > TTL) {
        sessionStorage.removeItem(KEY);
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  function markSpawned(on) {
    try {
      if (on) sessionStorage.setItem(KEY, String(Date.now()));
      else sessionStorage.removeItem(KEY);
    } catch (error) { /* modo privado sem storage */ }
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* documento da aba about:blank: só o iframe, em tela cheia */
  function shellHtml(url, pageTitle) {
    return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<meta name="referrer" content="no-referrer">' +
      '<title>' + escapeHtml(pageTitle) + '</title><style>' +
      'html,body{height:100%;margin:0;overflow:hidden;background:#07070c}' +
      '#luminsdk-surface{position:fixed;inset:0;width:100%;height:100%;border:0;' +
      'display:block;background:#07070c}' +
      '</style></head><body>' +
      '<iframe id="luminsdk-surface" src="' + escapeHtml(url) + '"' +
      ' title="' + escapeHtml(pageTitle) + '" referrerpolicy="no-referrer" allowfullscreen' +
      ' allow="autoplay; fullscreen; gamepad; clipboard-write; clipboard-read;' +
      ' encrypted-media; pointer-lock; midi; accelerometer; gyroscope"></iframe>' +
      '<script>(function(){var f=document.getElementById("luminsdk-surface");' +
      'function t(){try{var x=f.contentDocument&&f.contentDocument.title;' +
      'if(x&&document.title!==x)document.title=x;}catch(e){}}' +
      'f.addEventListener("load",t);setInterval(t,1200);' +
      '/* avisa o portal (mesma origem) que a aba em branco está viva */' +
      'try{if(window.opener&&!window.opener.closed){' +
      'window.opener.sessionStorage.setItem("luminsdk:v1:cloak:spawned",String(Date.now()));}}catch(e){}' +
      '})();<\/script>' +
      '</body></html>';
  }

  let child = null;
  let trying = 0;

  /* a aba que o próprio navegador abriu (link _blank, window.open de outro
     módulo) é a nossa: evita uma segunda aba em branco em cima dela */
  function noteOpenedWindow() {
    try {
      window.addEventListener('load', function () {
        try {
          if (window.opener && window.opener !== window) markSpawned(true);
        } catch (error) { /* origem diferente */ }
      }, { once: true });
    } catch (error) { /* navegador antigo sem once */ }
  }

  noteOpenedWindow();

  /* abre (ou reaproveita) a aba about:blank e despeja o iframe dentro */
  function spawn() {
    if (alreadySpawned()) return false;
    /* dois eventos do mesmo gesto (pointerdown + click) não viram duas
       tentativas de abertura */
    const now = Date.now();
    if (now - trying < 250) return false;
    trying = now;

    let win = null;
    try { win = window.open(BLANK, NAME); } catch (error) { win = null; }
    if (!win || win.closed) return false;         /* pop-up bloqueado */

    try { win.name = NAME; } catch (error) { /* nome já vem da abertura */ }

    try {
      win.document.open();
      win.document.write(shellHtml(HERE, TITLE));
      win.document.close();
    } catch (error) {
      /* não deu para escrever: não deixa uma aba em branco perdida */
      try { win.close(); } catch (error2) { /* nada a fazer */ }
      return false;
    }

    child = win;
    markSpawned(true);
    watchClosing();
    try { win.focus(); } catch (error) { /* aba já recebeu o foco */ }

    /* a página de trás sai do LuminSDK na hora: quem voltar para ela (ou
       olhar o histórico) encontra o Google, não o portal */
    leaveToGoogle();
    return true;
  }

  /* vira o Google na aba original — sem deixar um endereço do LuminSDK
     aparecendo depois das costas (mesma ideia do openBackup() do Utopia).
     ?cloak=google desliga só esta troca, para quem quiser o portal na aba
     de trás. */
  function leaveToGoogle() {
    if (/(?:^|[?&])cloak=google(?:&|$)/.test(window.location.search || '')) return;
    try {
      window.location.replace(REDIRECT);
    } catch (error) {
      try { window.location.href = REDIRECT; } catch (error2) { /* sem saída */ }
    }
  }

  /* fechou a aba about:blank: libera a trava para a próxima recarga abrir
     outra (senão a pessoa ficaria presa no portal com o endereço à mostra) */
  function watchClosing() {
    const timer = window.setInterval(function () {
      try {
        if (child && !child.closed) return;
      } catch (error) { /* aba inacessível */ }
      window.clearInterval(timer);
      child = null;
      markSpawned(false);
    }, 2000);
  }

  /* pop-up barrado na carga: a segunda tentativa é o primeiro clique/tecla,
     que é justamente o que o navegador aceita como permissão */
  function watchGesture() {
    const EVENTS = ['pointerdown', 'pointerup', 'mousedown', 'touchend', 'click', 'keydown'];

    function stop() {
      EVENTS.forEach(function (type) {
        document.removeEventListener(type, attempt, true);
      });
    }

    function attempt() {
      if (alreadySpawned()) { stop(); return; }
      if (spawn()) stop();
    }

    /* se ainda não abriu, os ouvintes continuam armados nos próximos gestos */

    /* ouvimos mais de um evento do mesmo gesto: alguns navegadores só
       liberam a aba no click, outros no keydown — o guarda de tempo em
       spawn() evita tentativa duplicada */
    EVENTS.forEach(function (type) {
      document.addEventListener(type, attempt, true);
    });
  }

  /* o navegador só abre aba com gesto: tentamos na carga e, se barrar,
     armamos o primeiro clique/tecla e mostramos uma dica discreta */
  if (!spawn()) {
    watchGesture();
    hint();
  }

  /* dica de uma linha (some no primeiro gesto ou em 12 s) */
  function hint() {
    let tip = null;
    const remove = function () {
      if (tip && tip.parentNode) tip.parentNode.removeChild(tip);
      tip = null;
    };
    const build = function () {
      if (tip || alreadySpawned()) return;
      tip = document.createElement('div');
      tip.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);' +
        'z-index:9999;padding:9px 14px;border-radius:999px;font:600 12px/1.3 system-ui,sans-serif;' +
        'color:#e9d5ff;background:rgba(24,16,44,.92);border:1px solid rgba(196,181,253,.35);' +
        'box-shadow:0 10px 30px rgba(0,0,0,.45);pointer-events:none;white-space:nowrap';
      tip.textContent = 'Toque em qualquer lugar para abrir em about:blank';
      document.body.append(tip);
      window.setTimeout(remove, 12000);
    };
    window.addEventListener('load', build);
    ['pointerdown', 'keydown'].forEach(function (type) {
      window.addEventListener(type, remove, true);
    });
  }

  /* diagnóstico: window.LuminCloak.state() / window.LuminCloak.open() */
  window.LuminCloak = {
    open: function () { return spawn(); },
    state: function () {
      return { cloaked: !!child, spawned: alreadySpawned(), redirect: REDIRECT };
    }
  };
})();
