/* =========================================================
   App "Arcade" do LuminOS — a parte divertida
   Alvo rápido, roleta de jogos, desafio aleatório, bichinho virtual,
   quiz, dicionário, sons gerados na hora e curiosidades.
   Autor: Ryan Smith · Licença MIT
   ========================================================= */
(function () {
  'use strict';

  const OS = window.LuminOS;
  if (!OS || typeof OS.register !== 'function') return;
  const el = OS.ui.el;
  const esc = OS.ui.esc;
  const toast = OS.ui.toast;

  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="7" width="19" height="11" rx="3"/><path d="M7 10.5v3M5.5 12h3M15.5 11h.01M17.8 13h.01"/></svg>';
  const PET_KEY = 'luminsdk:pet:v1';
  const ARCADE_KEY = 'luminsdk:arcade:v1';

  const TABS = [
    { id: 'play', name: 'Brincar' },
    { id: 'pet', name: 'Bichinho' },
    { id: 'quiz', name: 'Quiz' },
    { id: 'sounds', name: 'Sons' },
    { id: 'more', name: 'Extras' }
  ];

  const TRIVIA = [
    { q: 'Qual foi o primeiro jogo do Mario lançado em 1981?', a: ['Donkey Kong', 'Super Mario Bros.', 'Mario Bros.', 'Wrecking Crew'], right: 0 },
    { q: 'O que significa "RPG"?', a: ['Ritmo por grades', 'Role-playing game', 'Raster por GPU', 'Run-time profile group'], right: 1 },
    { q: 'Qual empresa criou o Game Boy?', a: ['Sega', 'Sony', 'Nintendo', 'Atari'], right: 2 },
    { q: 'Em que ano saiu o primeiro PlayStation?', a: ['1992', '1994', '1996', '1998'], right: 1 },
    { q: 'Qual é o apelido do personagem principal de The Legend of Zelda?', a: ['Zelda', 'Link', 'Ganon', 'Navi'], right: 1 },
    { q: 'Qual jogo popularizou o modo battle royale em 2017?', a: ['H1Z1', 'PUBG', 'Fortnite', 'Apex Legends'], right: 1 },
    { q: 'O que é "lag"?', a: ['Um tipo de gráfico', 'Atraso entre ação e resposta', 'Um bug de save', 'Um modo de jogo'], right: 1 },
    { q: 'Qual console tem o controle chamado "DualSense"?', a: ['Xbox Series X', 'PS5', 'Switch', 'Steam Deck'], right: 1 },
    { q: 'Qual desses NÃO é um console?', a: ['Dreamcast', 'GameCube', 'Vulkan', 'Saturn'], right: 2 },
    { q: 'O que significa "FPS" nos jogos?', a: ['Frames por segundo', 'First person shooter apenas', 'Fast play speed', 'Fase por setor'], right: 0 }
  ];

  const DICTIONARY = [
    ['Aggro', 'Ação de chamar a atenção dos inimigos para si.'],
    ['Buff', 'Melhoria temporária ou permanente em um atributo.'],
    ['Nerf', 'Redução de poder de algo considerado forte demais.'],
    ['RNG', 'Aleatoriedade do jogo ("random number generator").'],
    ['Meta', 'A estratégia mais eficiente do momento.'],
    ['Speedrun', 'Terminar o jogo o mais rápido possível.'],
    ['Hitbox', 'Área invisível que registra colisões.'],
    ['Frame perfect', 'Ação que exige precisão de um quadro só.'],
    ['Grind', 'Repetir tarefas para ganhar recursos.'],
    ['Roguelike', 'Fases geradas e morte permanente.'],
    ['Cooldown', 'Tempo de espera para usar algo de novo.'],
    ['Checkpoint', 'Ponto onde o jogo salva o seu progresso.']
  ];

  const FACTS = [
    'O primeiro console doméstico, o Magnavox Odyssey (1972), usava adesivos na TV para simular gráficos coloridos.',
    'O jogo mais vendido da história é Minecraft, com mais de 300 milhões de cópias.',
    'O botão "Konami" (cima, cima, baixo, baixo…) virou piada porque o código de trapaça era difícil de esquecer.',
    'A Nintendo nasceu em 1889 vendendo cartas de baralho.',
    'Pac-Man foi projetado para atrair público feminino nos fliperamas dos anos 1980.',
    'O controle do Xbox foi o primeiro a ser desenhado com ergonomia de "dedos para gatilhos".',
    'Grand Theft Auto V arrecadou mais em 24 horas do que muitos filmes em toda a bilheteria.',
    'Tetris foi criado por um engenheiro russo em 1984 e rodava em um Elektronika 60.'
  ];

  const CHALLENGES = [
    'Jogue 10 minutos sem olhar o relógio.',
    'Abra um jogo do acervo que você nunca jogou.',
    'Termine uma fase com o som desligado.',
    'Favorite três jogos em sequência.',
    'Zere a pontuação de hoje no Alvo rápido.',
    'Monte uma coleção com cinco jogos de 5 minutos.',
    'Escreva uma resenha de duas linhas sobre o último jogo.',
    'Jogue um clássico que você só conhece de nome.'
  ];

  const SOUNDS = [
    { id: 'blip', name: 'Blip', play: function (ac) { tone(ac, 880, .07, 'square', .18); } },
    { id: 'coin', name: 'Moeda', play: function (ac) { tone(ac, 988, .06, 'square', .2); setTimeout(function () { tone(ac, 1319, .12, 'square', .2); }, 60); } },
    { id: 'laser', name: 'Laser', play: function (ac) { sweep(ac, 1200, 180, .18, 'sawtooth', .16); } },
    { id: 'jump', name: 'Pulo', play: function (ac) { sweep(ac, 320, 720, .14, 'triangle', .2); } },
    { id: 'hit', name: 'Dano', play: function (ac) { sweep(ac, 240, 90, .2, 'square', .2); } },
    { id: 'power', name: 'Power-up', play: function (ac) { [523, 659, 784, 1047].forEach(function (freq, i) { setTimeout(function () { tone(ac, freq, .09, 'triangle', .18); }, i * 70); }); } },
    { id: 'alarm', name: 'Alarme', play: function (ac) { tone(ac, 440, .18, 'sawtooth', .14); setTimeout(function () { tone(ac, 330, .18, 'sawtooth', .14); }, 200); } },
    { id: 'chord', name: 'Acorde', play: function (ac) { [261, 329, 392].forEach(function (freq) { tone(ac, freq, .5, 'sine', .12); }); } }
  ];

  const view = { tab: 'play', quiz: null, quizIndex: 0, score: 0, answered: false };

  /* ---------- helpers ---------- */
  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; } catch (error) { return fallback; }
  }
  function store(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) {}
  }
  function dayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function pick(list, seed) {
    const index = Math.abs(seed) % list.length;
    return list[index];
  }
  function daySeed() {
    return Number(dayKey().replace(/-/g, ''));
  }

  /* ---------- áudio ---------- */
  let audio = null;
  function context() {
    if (audio) return audio;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    try { audio = new Ctor(); } catch (error) { audio = null; }
    return audio;
  }
  function tone(ac, freq, duration, type, volume) {
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.value = volume || .15;
    gain.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + duration);
  }
  function sweep(ac, from, to, duration, type, volume) {
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(from, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, to), ac.currentTime + duration);
    gain.gain.value = volume || .15;
    gain.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + duration);
  }

  /* ---------- brincar ---------- */
  function paintPlay(box) {
    const arcade = load(ARCADE_KEY, { best: 0, plays: 0 });
    const games = OS.state.games || [];
    if (!games.length && view.tab === 'play') {
      OS.data.games().then(function (list) {
        if (list && list.length) paint();
      }, function () {});
    }
    const today = pick(FACTS, daySeed());
    const challenge = pick(CHALLENGES, daySeed() + 3);

    box.innerHTML = [
      '<section class="kp-card"><h3>Alvo rápido</h3>',
      '<p class="kp-note">Clique nos alvos em 20 segundos. Recorde: <b>' + (arcade.best || 0) + '</b> pontos.</p>',
      '<div class="kp-arena" data-arena><span class="kp-mouse-dot" data-arena-dot hidden></span><span class="kp-arena__hint" data-arena-hint>aperte começar</span></div>',
      '<div class="kp-row"><button class="kp-btn kp-btn--primary" type="button" data-start>Começar</button>',
      '<span class="kp-big" style="font-size:1rem" data-score>0</span><span class="kp-note">pontos</span></div></section>',

      '<section class="kp-card"><h3>Roleta e desafios</h3>',
      '<div class="kp-row"><button class="kp-btn" type="button" data-roulette>Roleta de jogo</button>',
      '<button class="kp-btn" type="button" data-challenge>Desafio aleatório</button></div>',
      '<p class="kp-note" data-roulette-out>Sorteia um jogo do acervo e abre no player.</p>',
      '<p class="kp-note">Desafio de hoje: <b>' + esc(challenge) + '</b></p>',
      '<p class="kp-note">Jogo do dia: <b>' + esc(games.length ? pick(games, daySeed()).n : 'abra o acervo primeiro') + '</b></p></section>',

      '<section class="kp-card"><h3>Curiosidade do dia</h3><p>' + esc(today) + '</p></section>'
    ].join('');

    const arena = box.querySelector('[data-arena]');
    const hint = box.querySelector('[data-arena-hint]');
    const scoreNode = box.querySelector('[data-score]');
    let score = 0;
    let left = 0;
    let running = false;
    let ticker = 0;
    let target = null;

    function place() {
      if (target) target.remove();
      target = el('button', 'kp-target');
      target.type = 'button';
      const rect = arena.getBoundingClientRect();
      const x = 26 + Math.random() * Math.max(20, rect.width - 52);
      const y = 26 + Math.random() * Math.max(20, rect.height - 52);
      target.style.left = Math.round(x) + 'px';
      target.style.top = Math.round(y) + 'px';
      target.addEventListener('click', function () {
        if (!running) return;
        score += 1;
        scoreNode.textContent = score;
        place();
      });
      arena.append(target);
    }

    function stop() {
      running = false;
      if (target) { target.remove(); target = null; }
      clearInterval(ticker);
      hint.textContent = 'fim · ' + score + ' pontos';
      const now = load(ARCADE_KEY, { best: 0, plays: 0 });
      now.plays = (now.plays || 0) + 1;
      if (score > (now.best || 0)) {
        now.best = score;
        toast('Novo recorde: ' + score + ' pontos');
      }
      store(ARCADE_KEY, now);
      if (window.LuminPlayer) window.LuminPlayer.addXp(4 + score);
      paint();
    }

    box.querySelector('[data-start]').addEventListener('click', function () {
      score = 0;
      left = 20;
      running = true;
      scoreNode.textContent = '0';
      hint.textContent = left + 's';
      place();
      clearInterval(ticker);
      ticker = setInterval(function () {
        left -= 1;
        hint.textContent = Math.max(0, left) + 's';
        if (left <= 0) stop();
      }, 1000);
    });

    box.querySelector('[data-roulette]').addEventListener('click', function () {
      const out = box.querySelector('[data-roulette-out]');
      if (!games.length) { out.textContent = 'Abra o app Jogos uma vez para carregar o acervo.'; return; }
      const game = games[Math.floor(Math.random() * games.length)];
      out.textContent = 'Sorteado: ' + game.n + ' — abrindo…';
      OS.play(game.id);
    });

    box.querySelector('[data-challenge]').addEventListener('click', function () {
      const text = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
      toast(text);
      box.querySelectorAll('.kp-note')[2].textContent = 'Desafio: ' + text;
    });
  }

  /* ---------- bichinho ---------- */
  function petState() {
    const pet = load(PET_KEY, null) || { born: Date.now(), hunger: 70, joy: 70, energy: 70, name: 'Lumi', last: Date.now(), secrets: 0 };
    /* cada hora parada tira um pouco de cada barra */
    const hours = Math.max(0, Math.floor((Date.now() - pet.last) / 3600000));
    if (hours > 0) {
      pet.hunger = Math.max(0, pet.hunger - hours * 6);
      pet.joy = Math.max(0, pet.joy - hours * 4);
      pet.energy = Math.max(0, pet.energy - hours * 3);
      pet.last = Date.now();
      store(PET_KEY, pet);
    }
    return pet;
  }

  function paintPet(box) {
    const pet = petState();
    const mood = pet.joy > 70 ? '😄' : pet.joy > 40 ? '🙂' : pet.joy > 15 ? '😕' : '😢';
    box.innerHTML = [
      '<section class="kp-pet"><div class="kp-pet-face" data-face>' + mood + '</div>',
      '<input class="kp-field" style="max-width:220px;text-align:center" data-petname value="' + esc(pet.name) + '" aria-label="Nome do bichinho">',
      '<div class="kp-bars">',
      '  <div class="kp-bar"><span>fome</span><i><b style="width:' + pet.hunger + '%"></b></i></div>',
      '  <div class="kp-bar"><span>alegria</span><i><b style="width:' + pet.joy + '%"></b></i></div>',
      '  <div class="kp-bar"><span>energia</span><i><b style="width:' + pet.energy + '%"></b></i></div>',
      '</div>',
      '<div class="kp-row"><button class="kp-btn" type="button" data-act="feed">Alimentar</button>',
      '<button class="kp-btn" type="button" data-act="play">Brincar</button>',
      '<button class="kp-btn" type="button" data-act="rest">Dormir</button></div>',
      '<p class="kp-note">Ele fica com você neste navegador. Cuidar dele dá XP.</p></section>',

      '<section class="kp-card"><h3>Carinho escondido</h3><p class="kp-note">Dizem que quem faz carinho cinco vezes seguidas encontra uma salinha secreta…</p>',
      '<div class="kp-row"><button class="kp-btn" type="button" data-pet>Fazer carinho</button><span class="kp-note" data-hits>0/5</span></div></section>'
    ].join('');

    const apply = function (patch, xp, message) {
      const now = petState();
      Object.assign(now, patch);
      now.last = Date.now();
      store(PET_KEY, now);
      if (window.LuminPlayer) window.LuminPlayer.addXp(xp);
      toast(message);
      paint();
    };

    box.querySelectorAll('[data-act]').forEach(function (button) {
      button.addEventListener('click', function () {
        const action = button.dataset.act;
        const now = petState();
        if (action === 'feed') apply({ hunger: Math.min(100, now.hunger + 22), energy: Math.min(100, now.energy + 4) }, 3, pet.name + ' comeu bem.');
        else if (action === 'play') apply({ joy: Math.min(100, now.joy + 20), energy: Math.max(0, now.energy - 8), hunger: Math.max(0, now.hunger - 6) }, 5, 'Brincadeira feita!');
        else apply({ energy: Math.min(100, now.energy + 26), joy: Math.min(100, now.joy + 4) }, 2, pet.name + ' tirou um cochilo.');
      });
    });

    box.querySelector('[data-petname]').addEventListener('change', function (event) {
      const now = petState();
      now.name = event.target.value.slice(0, 16) || 'Lumi';
      store(PET_KEY, now);
      toast('Agora ele se chama ' + now.name + '.');
    });

    let hits = 0;
    box.querySelector('[data-pet]').addEventListener('click', function () {
      hits += 1;
      box.querySelector('[data-hits]').textContent = Math.min(5, hits) + '/5';
      const face = box.querySelector('[data-face]');
      face.textContent = hits >= 5 ? '🥚' : '💜';
      if (hits < 5) return;
      toast('Sala secreta liberada: +30 XP e um easter egg na Central de avisos.');
      if (window.LuminPlayer) window.LuminPlayer.addXp(30);
      if (window.LuminNotify) window.LuminNotify.push('Easter egg: você cuidou do bichinho cinco vezes seguidas.');
      box.querySelector('[data-hits]').textContent = 'segredo ✓';
    });
  }

  /* ---------- quiz ---------- */
  function paintQuiz(box) {
    if (!view.quiz) {
      box.innerHTML = [
        '<section class="kp-card"><h3>Quiz de games</h3>',
        '<p class="kp-note">Cinco perguntas por rodada, sorteadas do banco de ' + TRIVIA.length + '.</p>',
        '<div class="kp-row"><button class="kp-btn kp-btn--primary" type="button" data-start>Começar rodada</button></div></section>',
        '<section class="kp-card"><h3>Dicionário do jogador</h3><div class="kp-list">',
        DICTIONARY.map(function (item) {
          return '<div class="kp-item"><b style="min-width:88px">' + esc(item[0]) + '</b><span class="kp-grow">' + esc(item[1]) + '</span></div>';
        }).join(''),
        '</div></section>'
      ].join('');
      box.querySelector('[data-start]').addEventListener('click', function () {
        const pool = TRIVIA.slice().sort(function () { return Math.random() - .5; }).slice(0, 5);
        view.quiz = pool;
        view.quizIndex = 0;
        view.score = 0;
        view.answered = false;
        paint();
      });
      return;
    }

    const item = view.quiz[view.quizIndex];
    const last = view.quizIndex === view.quiz.length - 1;
    box.innerHTML = [
      '<section class="kp-card"><h3>Pergunta ' + (view.quizIndex + 1) + ' de ' + view.quiz.length + '</h3>',
      '<p style="font-size:.9rem;color:#f0f0f8">' + esc(item.q) + '</p>',
      '<div class="kp-list" data-answers>',
      item.a.map(function (answer, index) {
        return '<button class="kp-item" type="button" data-answer="' + index + '" style="cursor:pointer"><span class="kp-grow">' + esc(answer) + '</span></button>';
      }).join(''),
      '</div><p class="kp-note" data-feedback>Escolha uma resposta.</p></section>'
    ].join('');

    box.querySelectorAll('[data-answer]').forEach(function (button) {
      button.addEventListener('click', function () {
        if (view.answered) return;
        view.answered = true;
        const chosen = Number(button.dataset.answer);
        const right = chosen === item.right;
        if (right) view.score += 1;
        box.querySelectorAll('[data-answer]').forEach(function (node) {
          const index = Number(node.dataset.answer);
          node.style.borderColor = index === item.right ? 'rgba(74,222,128,.6)' : (index === chosen ? 'rgba(248,113,113,.6)' : '');
          if (index === item.right) node.style.background = 'rgba(74,222,128,.12)';
        });
        box.querySelector('[data-feedback]').textContent = right ? 'Acertou.' : 'Errou — a certa é "' + item.a[item.right] + '".';
        const next = el('button', 'kp-btn kp-btn--primary');
        next.type = 'button';
        next.textContent = last ? 'Ver resultado' : 'Próxima';
        next.style.marginTop = '8px';
        next.addEventListener('click', function () {
          if (last) {
            const score = view.score;
            toast('Quiz: ' + score + '/' + view.quiz.length);
            if (window.LuminPlayer) window.LuminPlayer.addXp(5 + score * 4);
            view.quiz = null;
            paint();
            return;
          }
          view.quizIndex += 1;
          view.answered = false;
          paint();
        });
        box.querySelector('[data-feedback]').after(next);
      });
    });
  }

  /* ---------- sons ---------- */
  function paintSounds(box) {
    box.innerHTML = [
      '<section class="kp-card"><h3>Soundboard</h3>',
      '<p class="kp-note">Sons gerados na hora com WebAudio — nenhum arquivo baixado.</p>',
      '<div class="kp-sound">',
      SOUNDS.map(function (sound) {
        return '<button class="kp-btn" type="button" data-sound="' + sound.id + '">' + esc(sound.name) + '</button>';
      }).join(''),
      '</div></section>',
      '<section class="kp-card"><h3>Tom contínuo</h3>',
      '<p class="kp-note">Segure para ouvir uma senoide em 220 Hz.</p>',
      '<div class="kp-row"><button class="kp-btn" type="button" data-hold>Seguar</button></div></section>'
    ].join('');

    box.querySelectorAll('[data-sound]').forEach(function (button) {
      button.addEventListener('click', function () {
        const ac = context();
        if (!ac) { toast('Este navegador não libera áudio.'); return; }
        if (ac.state === 'suspended') ac.resume();
        const sound = SOUNDS.filter(function (item) { return item.id === button.dataset.sound; })[0];
        if (sound) sound.play(ac);
      });
    });

    const hold = box.querySelector('[data-hold]');
    let osc = null;
    hold.addEventListener('pointerdown', function () {
      const ac = context();
      if (!ac) return;
      if (ac.state === 'suspended') ac.resume();
      osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.frequency.value = 220;
      gain.gain.value = .08;
      osc.connect(gain).connect(ac.destination);
      osc.start();
    });
    const stop = function () {
      if (!osc) return;
      try { osc.stop(); } catch (error) {}
      osc = null;
    };
    hold.addEventListener('pointerup', stop);
    hold.addEventListener('pointerleave', stop);
  }

  /* ---------- extras ---------- */
  const UNITS = {
    comprimento: { label: 'Comprimento', list: { mm: .001, cm: .01, m: 1, km: 1000, mi: 1609.34, ft: .3048, pol: .0254 } },
    massa: { label: 'Massa', list: { g: 1, kg: 1000, lb: 453.592, oz: 28.3495 } },
    tempo: { label: 'Tempo', list: { s: 1, min: 60, h: 3600, dia: 86400 } },
    dados: { label: 'Dados', list: { B: 1, KB: 1024, MB: 1048576, GB: 1073741824 } }
  };

  function clock(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const rest = s % 60;
    const pad = function (n) { return String(n).padStart(2, '0'); };
    return (h ? pad(h) + ':' : '') + pad(m) + ':' + pad(rest);
  }

  function paintMore(box) {
    const arcade = load(ARCADE_KEY, { best: 0, plays: 0 });
    box.innerHTML = [
      '<section class="kp-card"><h3>Seus números do arcade</h3><div class="kp-stats">',
      '<div class="kp-stat"><b>' + (arcade.best || 0) + '</b><span>recorde no alvo</span></div>',
      '<div class="kp-stat"><b>' + (arcade.plays || 0) + '</b><span>rodadas jogadas</span></div>',
      '<div class="kp-stat"><b>' + TRIVIA.length + '</b><span>perguntas no quiz</span></div>',
      '<div class="kp-stat"><b>' + DICTIONARY.length + '</b><span>termos no dicionário</span></div>',
      '</div></section>',

      '<section class="kp-card"><h3>Cronômetro</h3>',
      '<div class="kp-row"><span class="kp-big" data-timer style="font-size:1.35rem;font-variant-numeric:tabular-nums">00:00</span>',
      '<button class="kp-btn kp-btn--primary" type="button" data-timer-toggle>Iniciar</button>',
      '<button class="kp-btn" type="button" data-timer-reset>Zerar</button></div>',
      '<p class="kp-note">Conta o tempo nesta aba; se você sair, ele para. Bom para medir uma sessão de foco.</p></section>',

      '<section class="kp-card"><h3>Conversor</h3>',
      '<div class="kp-row" data-unit-cats>',
      Object.keys(UNITS).map(function (key, index) {
        return '<button class="kp-btn' + (index === 0 ? ' is-on' : '') + '" type="button" data-cat="' + key + '">' + UNITS[key].label + '</button>';
      }).join(''),
      '</div>',
      '<div class="kp-row"><input class="kp-field" type="number" data-value value="1" style="max-width:96px" aria-label="Valor">',
      '<select class="kp-field" data-from style="max-width:104px" aria-label="Unidade de origem"></select>',
      '<span class="kp-note">→</span>',
      '<select class="kp-field" data-to style="max-width:104px" aria-label="Unidade de destino"></select></div>',
      '<p class="kp-note" data-result>—</p></section>',

      '<section class="kp-card"><h3>Mais curiosidades</h3><div class="kp-list">',
      FACTS.slice(0, 5).map(function (fact) { return '<div class="kp-item"><span class="kp-grow">' + esc(fact) + '</span></div>'; }).join(''),
      '</div></section>',

      '<section class="kp-card"><h3>Sala secreta</h3><p class="kp-note">Ela só abre para quem já cuidou do bichinho cinco vezes. Sem atalho — é segredo.</p></section>'
    ].join('');

    /* cronômetro */
    const timerNode = box.querySelector('[data-timer]');
    let seconds = 0;
    let running = false;
    let ticker = 0;

    const stopTicker = function () {
      if (ticker) clearInterval(ticker);
      ticker = 0;
    };

    box.querySelector('[data-timer-toggle]').addEventListener('click', function (event) {
      running = !running;
      event.target.textContent = running ? 'Pausar' : 'Iniciar';
      stopTicker();
      if (!running) return;
      ticker = setInterval(function () {
        if (!timerNode.isConnected) { stopTicker(); return; }
        seconds += 1;
        timerNode.textContent = clock(seconds);
      }, 1000);
    });

    box.querySelector('[data-timer-reset]').addEventListener('click', function () {
      stopTicker();
      running = false;
      seconds = 0;
      timerNode.textContent = '00:00';
      const toggle = box.querySelector('[data-timer-toggle]');
      if (toggle) toggle.textContent = 'Iniciar';
    });

    /* conversor */
    const from = box.querySelector('[data-from]');
    const to = box.querySelector('[data-to]');
    const value = box.querySelector('[data-value]');
    const result = box.querySelector('[data-result]');

    const fill = function (category) {
      const units = Object.keys(UNITS[category].list);
      from.innerHTML = units.map(function (unit) { return '<option value="' + unit + '">' + unit + '</option>'; }).join('');
      to.innerHTML = from.innerHTML;
      to.selectedIndex = Math.min(1, units.length - 1);
      convert();
    };

    const convert = function () {
      const table = UNITS[box.dataset.category || 'comprimento'].list;
      const amount = Number(value.value);
      const a = table[from.value];
      const b = table[to.value];
      if (!isFinite(amount) || !a || !b) { result.textContent = '—'; return; }
      const out = (amount * a) / b;
      /* três casas bastam, mas valores pequenos não viram "2.00e-3" */
      const pretty = Math.abs(out) >= 1 ? out.toFixed(3).replace(/\.?0+$/, '') : String(Number(out.toPrecision(4)));
      result.textContent = amount + ' ' + from.value + ' = ' + pretty + ' ' + to.value;
    };

    box.dataset.category = 'comprimento';
    box.querySelectorAll('[data-cat]').forEach(function (button) {
      button.addEventListener('click', function () {
        box.dataset.category = button.dataset.cat;
        box.querySelectorAll('[data-cat]').forEach(function (item) { item.classList.toggle('is-on', item === button); });
        fill(button.dataset.cat);
      });
    });
    value.addEventListener('input', convert);
    from.addEventListener('change', convert);
    to.addEventListener('change', convert);
    fill('comprimento');
  }

  /* ---------- pintura ---------- */
  let body = null;

  function paint() {
    if (!body) return;
    const box = body.querySelector('[data-box]');
    box.scrollTop = 0;
    if (view.tab === 'play') paintPlay(box);
    else if (view.tab === 'pet') paintPet(box);
    else if (view.tab === 'quiz') paintQuiz(box);
    else if (view.tab === 'sounds') paintSounds(box);
    else paintMore(box);
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
    id: 'arcade',
    name: 'Arcade',
    short: 'Arcade',
    w: 720,
    h: 560,
    at: 4,
    icon: ICON,
    render: render
  });
})();
