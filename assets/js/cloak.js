/* =========================================================
   LuminSDK — abertura em about:blank  ·  ARQUIVO EDITÁVEL
   Ao abrir o portal, ele se muda para uma aba about:blank e o site
   original continua vivo dentro de um iframe nessa aba. A aba de trás
   vira https://www.google.com e tenta se fechar sozinha.

   REGRA DE OURO (por pedido): a aba about:blank abre SEMPRE que o portal
   é aberto direto no endereço. Nada de trava de sessão, nada de "já abri
   uma vez hoje": cada carga da página tenta.

   Como o navegador se comporta:
   · abrir aba exige gesto na PRIMEIRA carga; depois disso o navegador
     costuma liberar o domínio e as cargas seguintes abrem sozinhas
   · por isso, se a abertura automática for barrada, o primeiro clique ou
     tecla em qualquer lugar da página abre a aba (e aparece uma dica)
   · fechar a aba de trás só é permitido quando ela foi aberta por script
     (é o nosso caso): window.close() na aba do Google é recusado — aí ela
     simplesmente fica no Google, como você pediu ("vira Google e tenta
     fechar")

   ---------------------------------------------------------
   EDITE AQUI
   ---------------------------------------------------------
   · REDIRECT     para onde a aba de trás vai depois de abrir a branca
   · CLOSE_PARENT a aba de trás tenta se fechar depois do redirect?
   · CLOSE_DELAY  espera (ms) antes de tentar fechar
   · HINT         texto da dica quando o pop-up é barrado
   ========================================================= */
(function () {
  'use strict';

  const CONFIG = {
    REDIRECT: 'https://www.google.com/',
    CLOSE_PARENT: true,
    CLOSE_DELAY: 900,
    HINT: 'Toque em qualquer lugar para abrir em about:blank'
  };

  const NAME = 'luminsdk-cloak';
  const BLANK = 'about:blank';
  const HERE = window.location.href;
  const TITLE = document.title || 'LuminSDK';

  /* já estamos dentro do iframe, já somos a aba em branco, ou é o arquivo
     único (que não deve migrar): nada a fazer */
  if (window.self !== window.top) return;
  if (window.name === NAME) return;
  if (window.__LUMIN_SINGLE__) return;
  if (/(?:^|[?&])cloak=0(?:&|$)/.test(window.location.search || '')) return;

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
      '.luminsdk-wake{position:fixed;inset:0;display:grid;place-items:center;cursor:pointer;' +
      'background:radial-gradient(circle at 50% 45%,#1a1035,#07070c 70%);' +
      'font:600 14px/1.5 system-ui,sans-serif;color:#e9d5ff;text-align:center;padding:24px}' +
      '</style></head><body>' +
      '<iframe id="luminsdk-surface" src="' + escapeHtml(url) + '"' +
      ' title="' + escapeHtml(pageTitle) + '" referrerpolicy="no-referrer" allowfullscreen' +
      ' allow="autoplay; fullscreen; gamepad; clipboard-write; clipboard-read;' +
      ' encrypted-media; pointer-lock; midi; accelerometer; gyroscope"></iframe>' +
      '<script>(function(){' +
      'var f=document.getElementById("luminsdk-surface");' +
      'function t(){try{var x=f.contentDocument&&f.contentDocument.title;' +
      'if(x&&document.title!==x)document.title=x;}catch(e){}}' +
      'f.addEventListener("load",t);setInterval(t,1200);' +
      'f.addEventListener("load",function(){try{' +
      'var d=f.contentDocument;if(d&&d.body&&!d.querySelector(".luminsdk-wake")){' +
      'var w=d.createElement("div");w.className="luminsdk-wake";' +
      'w.innerHTML="<div><b style=\"font-size:17px\">LuminSDK</b><br>' +
      'toque para continuar</div>";' +
      'w.addEventListener("click",function(){try{w.remove();}catch(e){}' +
      'try{f.contentWindow.focus();}catch(e){}});' +
      'd.body.appendChild(w);}}catch(e){}});' +
      '})();<\\/script>' +
      '</body></html>';
  }

  let child = null;

  /* abre a aba about:blank e despeja o iframe dentro */
  function spawn() {
    let win = null;
    try { win = window.open(BLANK, NAME); } catch (error) { win = null; }
    if (!win || win.closed) return false;          /* pop-up bloqueado */

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
    try { win.focus(); } catch (error) { /* a aba já recebeu o foco */ }
    leaveToGoogle();
    return true;
  }

  /* a aba de trás sai do LuminSDK na hora e tenta se fechar sozinha.
     window.close() só é aceito quando a aba foi aberta por script (nosso
     caso); se o navegador recusar, ela fica no Google — que é o pedido. */
  function leaveToGoogle() {
    try { window.location.replace(CONFIG.REDIRECT); } catch (error) {
      try { window.location.href = CONFIG.REDIRECT; } catch (error2) { /* sem saída */ }
    }
    if (!CONFIG.CLOSE_PARENT) return;
    window.setTimeout(function () {
      try { window.close(); } catch (error) { /* navegador recusou */ }
    }, Math.max(0, CONFIG.CLOSE_DELAY));
  }

  /* dica de uma linha (some no primeiro gesto ou em 12 s) */
  function hint() {
    let tip = null;
    const remove = function () {
      if (tip && tip.parentNode) tip.parentNode.removeChild(tip);
      tip = null;
    };
    const build = function () {
      if (tip) return;
      tip = document.createElement('div');
      tip.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);' +
        'z-index:9999;padding:9px 14px;border-radius:999px;font:600 12px/1.3 system-ui,sans-serif;' +
        'color:#e9d5ff;background:rgba(24,16,44,.92);border:1px solid rgba(196,181,253,.35);' +
        'box-shadow:0 10px 30px rgba(0,0,0,.45);pointer-events:none;white-space:nowrap';
      tip.textContent = CONFIG.HINT;
      document.body.append(tip);
      window.setTimeout(remove, 12000);
    };
    window.addEventListener('load', build);
    ['pointerdown', 'keydown'].forEach(function (type) {
      window.addEventListener(type, remove, true);
    });
  }

  /* pop-up barrado: o primeiro clique/tecla em qualquer lugar abre a aba.
     Os ouvintes ficam armados até uma tentativa dar certo — nunca mais
     "só funcionou uma vez". */
  function watchGesture() {
    const EVENTS = ['pointerdown', 'pointerup', 'mousedown', 'touchend', 'click', 'keydown'];
    let trying = 0;

    function stop() {
      EVENTS.forEach(function (type) {
        document.removeEventListener(type, attempt, true);
      });
    }

    function attempt() {
      const now = Date.now();
      if (now - trying < 250) return;     /* mesmo gesto, dois eventos */
      trying = now;
      if (spawn()) stop();
    }

    EVENTS.forEach(function (type) {
      document.addEventListener(type, attempt, true);
    });
  }

  /* tenta agora; se o navegador barrar, tenta no primeiro gesto */
  let opened = false;
  try { opened = spawn(); } catch (error) { opened = false; }
  if (!opened) {
    watchGesture();
    hint();
    /* algumas cargas liberam o pop-up um instante depois (a permissão do
       domínio chega com o primeiro frame): mais duas chances silenciosas */
    [400, 1500].forEach(function (delay) {
      window.setTimeout(function () {
        if (!child || (child && child.closed)) {
          try { spawn(); } catch (error) { /* segue no gesto */ }
        }
      }, delay);
    });
  }

  /* diagnóstico: window.LuminCloak.state() / window.LuminCloak.open() */
  window.LuminCloak = {
    config: CONFIG,
    open: function () { return spawn(); },
    state: function () {
      return { cloaked: !!child && !child.closed, redirect: CONFIG.REDIRECT };
    }
  };
})();
