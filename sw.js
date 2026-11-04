/* =========================================================
   LuminSDK — service worker
   Guarda o "app shell" em cache para abrir offline (jogos
   continuam precisando de internet, pois vêm do LuminSDK).
   Autor: Ryan Smith · Licença MIT
   ========================================================= */
'use strict';

const VERSION = 'v57';
const SHELL_CACHE = 'lumin-shell-' + VERSION;
const RUNTIME_CACHE = 'lumin-runtime-' + VERSION;

/* Só o essencial para o site abrir offline.
   Imagens pesadas (banner, ícones grandes), o JSON do GN-Math e a outra aba
   entram no cache sozinhos na primeira visita, pelo handler de fetch abaixo.
   Antes o install baixava ~700 KB de uma vez, inclusive arquivos que a
   pessoa talvez nunca abrisse. */
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/css/styles.css?v=57',
  'assets/css/app.css?v=57',
  'assets/js/app.js?v=57',
  'assets/js/cloak.js?v=57',
  'assets/js/anim.js?v=57',
  'assets/css/anim.css?v=57',
  'assets/js/astolfo.js?v=57',
  'assets/css/astolfo.css?v=57',
  'assets/js/site.js?v=57',
  'assets/js/settings.js?v=57',
  'assets/js/progress.js?v=57',
  'assets/js/atmosphere.js?v=57',
  'assets/js/library.js?v=57',
  'assets/js/bonus.js?v=57',
  'assets/js/social.js?v=57',
  'assets/js/player.js?v=57',
  'assets/js/os.js?v=57',
  'assets/js/profile.js?v=57',
  'assets/js/lab.js?v=57',
  'assets/js/studio.js?v=57',
  'assets/js/arcade.js?v=57',
  'assets/js/vault.js?v=57',
  'assets/js/community.js?v=57',
  'assets/css/social.css?v=57',
  'assets/css/lcore.css?v=57',
  'assets/js/lcore.js?v=57',
  'assets/css/os.css?v=57',
  'assets/css/hub.css?v=57',
  'assets/js/hub.js?v=57',
  'assets/js/central.js?v=57',
  'assets/img/hub.svg',
  'assets/css/study.css?v=57',
  'assets/css/browser.css?v=57',
  'assets/js/browser.js?v=57',
  'assets/js/provider.js?v=57',
  'assets/css/provider.css?v=57',
  'assets/img/browser.jpg',
  'assets/img/duckmath.jpg',
  'assets/img/astra.jpg',
  'assets/img/favicon.svg',
  'assets/img/os-icon.jpg',
  /* papel de parede do tema Astolfo (73 KB): sem ele o tema abre sem fundo offline */
  'assets/img/astolfo/astolfo-wall-1280.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        /* 'reload' ignora o cache HTTP: garante que a casca nova seja a que
           acabou de ser publicada, e não uma cópia antiga do navegador. */
        Promise.all(
          SHELL.map((path) =>
            cache.add(new Request(path, { cache: 'reload' })).catch(() => undefined)
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  /* Fontes do Google: stale-while-revalidate. Tratar antes dos hosts externos. */
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request)
            .then((response) => {
              if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
              return response;
            })
            .catch(() => cached || new Response('', { status: 503, statusText: 'Offline' }));
          return cached || network;
        })
      )
    );
    return;
  }


  /* Requisições do SDK / catálogo: sempre rede (dados nunca podem ficar velhos) */
  const isSdk = url.hostname !== self.location.hostname;
  if (isSdk) return;

  /* Navegação: rede primeiro, cache como reserva (offline) */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match('index.html'))
            .then((cached) => cached || new Response('Offline', { status: 503, statusText: 'Offline' }))
        )
    );
    return;
  }


  /* Estáticos locais: rede primeiro, cache só como reserva offline.
     (cache primeiro fazia o navegador continuar rodando o JS/CSS antigo
     depois de uma correção publicada.) */
  event.respondWith(
    fetch(request)
      .then((response) => {
        /* só guarda sucesso de verdade: 404 de arquivo recém-publicado
           (ex.: assets/js/anim.js?v=57 antes do Pages terminar) não pode
           virar cache permanente */
        if (response && response.ok && response.status === 200) {
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, response.clone())).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || new Response('Offline', { status: 503, statusText: 'Offline' })))
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});
