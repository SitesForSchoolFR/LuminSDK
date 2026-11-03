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
   · uma aba só gera outra uma vez por sessão (sessionStorage): recarregar
     não abre aba atrás de aba; fechou a aba about:blank, a próxima
     recarga volta a abrir
   · dentro do iframe este script se desliga sozinho (self !== top), então
     não existe laço de iframe dentro de iframe
   · ?cloak=0 no endereço desliga tudo (útil para depurar)

   Sem bibliotecas, sem build.
   Autor: Ryan Smith · Licença MIT
   ========================================================= */
(function () {
  'use strict';

  const KEY = 'luminsdk:v1:cloak:spawned';
  const NAME = 'luminsdk-cloak';
  const BLANK = 'about:blank';
  const TITLE = document.title || 'LuminSDK';

  /* já estamos dentro do iframe, já somos a aba about:blank, ou é o
     arquivo único (que não deve migrar): nada a fazer */
  if (window.self !== window.top) return;
  if (window.name === NAME) return;
  if (window.__LUMIN_SINGLE__) return;

  if (/(?:^|[?&])cloak=0(?:&|$)/.test(window.location.search || '')) return;

  const here = window.location.href;

  function alreadySpawned() {
    try { return sessionStorage.getItem(KEY) === '1'; } catch (error) { return false; }
  }

  function markSpawned(on) {
    try {
      if (on) sessionStorage.setItem(KEY, '1');
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
      'f.addEventListener("load",t);setInterval(t,1200);})();<\/script>' +
      '</body></html>';
  }

  let child = null;

  /* abre (ou reaproveita) a aba about:blank e despeja o iframe dentro */
  function spawn() {
    if (alreadySpawned()) return false;

    let win = null;
    try { win = window.open(BLANK, NAME); } catch (error) { win = null; }
    if (!win || win.closed) return false;         /* pop-up bloqueado */

    try { win.name = NAME; } catch (error) { /* nome já vem da abertura */ }

    try {
      win.document.open();
      win.document.write(shellHtml(here, TITLE));
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
    return true;
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
    function stop() {
      document.removeEventListener('pointerdown', attempt, true);
      document.removeEventListener('keydown', attempt, true);
      document.removeEventListener('touchend', attempt, true);
    }

    function attempt() {
      if (alreadySpawned()) { stop(); return; }
      if (spawn()) stop();
    }

    document.addEventListener('pointerdown', attempt, true);
    document.addEventListener('keydown', attempt, true);
    document.addEventListener('touchend', attempt, true);
  }

  if (!spawn()) watchGesture();

  /* diagnóstico: window.LuminCloak.state() / window.LuminCloak.open() */
  window.LuminCloak = {
    open: function () { return spawn(); },
    state: function () {
      return { cloaked: !!child, spawned: alreadySpawned() };
    }
  };
})();
