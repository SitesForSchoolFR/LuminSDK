/* =========================================================
   LuminPlayer — o estado do jogador dentro do LuminOS
   Tudo fica no navegador (localStorage), sem conta e sem servidor.
   É a base que alimenta Perfil, Conquistas, Desafios, Coleções e a
   Retrospectiva: um lugar só para XP, partidas, minutos e afins.
   Autor: Ryan Smith · Licença MIT
   ========================================================= */
(function () {
  'use strict';

  const KEY = 'luminsdk:player:v1';
  const MAX_SESSIONS = 300;
  const listeners = [];

  /* sessão aberta agora (não persiste: se recarregar, fecha no tempo) */
  let open = null;
  let memory = null;

  /* ---------- conquistas ----------
     test(ctx) devolve true quando desbloqueia; progress(ctx) devolve
     [feito, alvo] para a barra de progresso nas bloqueadas. */
  const ACHIEVEMENTS = [
    { id: 'first', name: 'Ligou o console', desc: 'Jogue o seu primeiro jogo', xp: 20, test: (c) => c.games >= 1, progress: (c) => [c.games, 1] },
    { id: 'ten', name: 'Variedade', desc: 'Jogue 10 jogos diferentes', xp: 30, test: (c) => c.games >= 10, progress: (c) => [c.games, 10] },
    { id: 'fifty', name: 'Colecionador', desc: 'Jogue 50 jogos diferentes', xp: 60, test: (c) => c.games >= 50, progress: (c) => [c.games, 50] },
    { id: 'plays100', name: 'Sessão da tarde', desc: '100 partidas abertas', xp: 50, test: (c) => c.plays >= 100, progress: (c) => [c.plays, 100] },
    { id: 'hour1', name: 'Uma horinha', desc: '60 minutos jogados', xp: 20, test: (c) => c.minutes >= 60, progress: (c) => [c.minutes, 60] },
    { id: 'hour10', name: 'Dez horas', desc: '600 minutos jogados', xp: 45, test: (c) => c.minutes >= 600, progress: (c) => [c.minutes, 600] },
    { id: 'hour100', name: 'Centenário', desc: '6000 minutos jogados', xp: 120, test: (c) => c.minutes >= 6000, progress: (c) => [c.minutes, 6000] },
    { id: 'fav1', name: 'Primeiro favorito', desc: 'Favorite um jogo', xp: 15, test: (c) => c.favorites >= 1, progress: (c) => [c.favorites, 1] },
    { id: 'fav10', name: 'Critério', desc: 'Dez favoritos na lista', xp: 35, test: (c) => c.favorites >= 10, progress: (c) => [c.favorites, 10] },
    { id: 'wish5', name: 'Lista de desejos', desc: 'Cinco jogos na wishlist', xp: 25, test: (c) => c.wishlist >= 5, progress: (c) => [c.wishlist, 5] },
    { id: 'backlog5', name: 'Fila organizada', desc: 'Cinco jogos no backlog', xp: 25, test: (c) => c.backlog >= 5, progress: (c) => [c.backlog, 5] },
    { id: 'col1', name: 'Curador', desc: 'Crie a sua primeira coleção', xp: 20, test: (c) => c.collections >= 1, progress: (c) => [c.collections, 1] },
    { id: 'rate5', name: 'Opinião formada', desc: 'Avalie cinco jogos', xp: 35, test: (c) => c.ratings >= 5, progress: (c) => [c.ratings, 5] },
    { id: 'review1', name: 'Resenha', desc: 'Escreva uma avaliação com texto', xp: 30, test: (c) => c.reviews >= 1, progress: (c) => [c.reviews, 1] },
    { id: 'done1', name: 'Zerei', desc: 'Marque um jogo como zerado', xp: 30, test: (c) => c.done >= 1, progress: (c) => [c.done, 1] },
    { id: 'streak3', name: 'Três dias seguidos', desc: 'Entre três dias em sequência', xp: 30, test: (c) => c.streak >= 3, progress: (c) => [c.streak, 3] },
    { id: 'streak7', name: 'Semana cheia', desc: 'Sete dias seguidos', xp: 70, test: (c) => c.streak >= 7, progress: (c) => [c.streak, 7] },
    { id: 'level5', name: 'Nível 5', desc: 'Chegue ao nível 5', xp: 0, test: (c) => c.level >= 5, progress: (c) => [c.level, 5] },
    { id: 'level10', name: 'Nível 10', desc: 'Chegue ao nível 10', xp: 0, test: (c) => c.level >= 10, progress: (c) => [c.level, 10] },
    { id: 'owl', name: 'Coruja', desc: 'Abra um jogo entre 0h e 6h', xp: 25, test: (c) => c.night, progress: (c) => [c.night ? 1 : 0, 1] },
    { id: 'marathon', name: 'Maratona', desc: 'Uma sessão de 60 minutos ou mais', xp: 40, test: (c) => c.longest >= 60, progress: (c) => [c.longest, 60] },
    { id: 'explorer', name: 'Explorador', desc: 'Jogue de 10 estúdios diferentes', xp: 45, test: (c) => c.studios >= 10, progress: (c) => [c.studios, 10] },
    /* ocultas: não aparecem com dica até desbloquear */
    { id: 'ghost', name: 'Fantasma', desc: 'Abra o Perfil treze vezes', hidden: true, xp: 40, test: (c) => c.opens >= 13, progress: (c) => [c.opens, 13] },
    { id: 'tabs', name: 'Curioso', desc: 'Passeie por todas as abas do Perfil', hidden: true, xp: 30, test: (c) => c.tabs >= 6, progress: (c) => [c.tabs, 6] },
    { id: 'wrapped', name: 'Retrospectiva', desc: 'Abra a sua Retrospectiva', hidden: true, xp: 20, test: (c) => c.wrapped, progress: (c) => [c.wrapped ? 1 : 0, 1] }
  ];

  /* ---------- armazenamento ---------- */
  function blank() {
    return {
      v: 1,
      created: Date.now(),
      xp: 0,
      profile: { name: 'Jogador', art: 0 },
      games: {},
      favorites: [],
      wishlist: [],
      backlog: [],
      collections: [],
      notes: {},
      ratings: {},
      achievements: {},
      favXp: {},
      sessions: [],
      login: { last: '', streak: 0, total: 0 },
      challenges: { date: '', claimed: [] },
      challengeList: [],
      seen: { tabs: [], wrapped: false },
      opens: 0
    };
  }

  function normalize(raw) {
    const base = blank();
    if (!raw || typeof raw !== 'object') return base;
    const out = Object.assign(base, raw);
    out.profile = Object.assign(base.profile, raw.profile || {});
    out.login = Object.assign(base.login, raw.login || {});
    out.challenges = Object.assign(base.challenges, raw.challenges || {});
    out.seen = Object.assign(base.seen, raw.seen || {});
    ['games', 'notes', 'ratings', 'achievements', 'favXp'].forEach(function (key) {
      if (!out[key] || typeof out[key] !== 'object' || Array.isArray(out[key])) out[key] = {};
    });
    ['favorites', 'wishlist', 'backlog', 'collections', 'sessions'].forEach(function (key) {
      if (!Array.isArray(out[key])) out[key] = [];
    });
    out.seen.tabs = Array.isArray(out.seen.tabs) ? out.seen.tabs : [];
    out.xp = Math.max(0, Number(out.xp) || 0);
    return out;
  }

  function read() {
    if (memory) return memory;
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (error) { raw = null; }
    memory = normalize(raw);
    return memory;
  }

  function write(silent) {
    memory = read();
    try { localStorage.setItem(KEY, JSON.stringify(memory)); } catch (error) { /* cota cheia: segue em memória */ }
    if (!silent) emit();
    return memory;
  }

  function emit() {
    const snapshot = summary();
    listeners.forEach(function (fn) {
      try { fn(snapshot); } catch (error) { /* um inscrito quebrado não derruba o resto */ }
    });
  }

  /* ---------- nível / XP ---------- */
  function levelInfo(xp) {
    let level = 1;
    let need = 100;
    let left = Math.max(0, Number(xp) || 0);
    while (left >= need && level < 999) {
      left -= need;
      level += 1;
      need = Math.round(need * 1.32);
    }
    return { level: level, into: left, need: need, pct: Math.round((left / need) * 100) };
  }

  function addXp(amount) {
    const s = read();
    const value = Math.round(Number(amount) || 0);
    if (!value) return 0;
    s.xp = Math.max(0, s.xp + value);
    return value;
  }

  /* ---------- dias ---------- */
  function dayKey(date) {
    const d = date || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function dayDiff(a, b) {
    const parse = function (key) { const parts = String(key).split('-').map(Number); return new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1).getTime(); };
    if (!a || !b) return 99;
    return Math.round((parse(b) - parse(a)) / 86400000);
  }

  function login() {
    const s = read();
    const today = dayKey();
    if (s.login.last === today) return null;
    const gap = dayDiff(s.login.last, today);
    s.login.streak = gap === 1 ? s.login.streak + 1 : 1;
    s.login.last = today;
    s.login.total += 1;
    const reward = 10 + Math.min(16, s.login.streak * 2);
    addXp(reward);
    write(true);
    const news = checkQuiet();
    emit();
    return { reward: reward, streak: s.login.streak, level: levelInfo(read().xp).level, achievements: news };
  }

  /* ---------- partidas ---------- */
  function entryFor(s, id) {
    const key = String(id);
    if (!s.games[key]) {
      s.games[key] = { name: '', studio: '', plays: 0, minutes: 0, first: 0, last: 0, status: 'jogando' };
    }
    return s.games[key];
  }

  function startSession(game) {
    if (!game || game.id === undefined || game.id === null) return null;
    /* recarregar o mesmo jogo em menos de 45 s continua a mesma sessão */
    if (open && open.id === String(game.id) && Date.now() - open.start < 45000) {
      return { xp: 0, achievements: [], first: false, continued: true };
    }
    if (open) endSession();
    const s = read();
    const entry = entryFor(s, game.id);
    entry.name = game.n || game.name || entry.name || 'Jogo';
    entry.studio = game.a || game.studio || entry.studio || '';
    entry.plays += 1;
    if (!entry.first) entry.first = Date.now();
    entry.last = Date.now();
    if (entry.status && entry.status !== 'zerado' && entry.status !== 'backlog') entry.status = 'jogando';
    const first = entry.plays === 1;
    let xp = 8 + (first ? 20 : 0);
    if (new Date().getHours() < 6) s.night = true;
    addXp(xp);
    open = { id: String(game.id), name: entry.name, start: Date.now() };
    write(true);
    const news = checkQuiet();
    emit();
    return { xp: xp, achievements: news, first: first };
  }

  function endSession() {
    if (!open) return null;
    const s = read();
    const entry = entryFor(s, open.id);
    const minutes = Math.max(0, Math.round((Date.now() - open.start) / 60000));
    const seconds = Math.max(0, Math.round((Date.now() - open.start) / 1000));
    let xp = 0;
    if (minutes >= 1) {
      xp = Math.min(90, minutes);
      entry.minutes += minutes;
      s.sessions.push({ id: open.id, name: entry.name, at: Date.now(), mins: minutes });
      if (s.sessions.length > MAX_SESSIONS) s.sessions = s.sessions.slice(-MAX_SESSIONS);
      addXp(xp);
    }
    const done = { name: entry.name, minutes: minutes, seconds: seconds, xp: xp };
    open = null;
    write(true);
    const news = checkQuiet();
    emit();
    return Object.assign(done, { achievements: news, level: levelInfo(read().xp).level });
  }

  function currentSession() {
    if (!open) return null;
    return { id: open.id, name: open.name, start: open.start, seconds: Math.round((Date.now() - open.start) / 1000) };
  }

  /* ---------- listas ---------- */
  function toggleIn(list, id) {
    const key = String(id);
    const at = list.indexOf(key);
    if (at >= 0) list.splice(at, 1);
    else list.push(key);
    return at < 0;
  }

  function toggleFavorite(game) {
    const s = read();
    const on = toggleIn(s.favorites, game.id);
    if (game && game.n) entryFor(s, game.id).name = game.n;
    /* XP só na primeira vez que o jogo entra nos favoritos */
    if (on && !s.favXp[String(game.id)]) {
      s.favXp[String(game.id)] = 1;
      addXp(3);
    }
    write(true);
    const news = checkQuiet();
    emit();
    return { on: on, achievements: news };
  }

  function toggleWishlist(game) {
    const s = read();
    const on = toggleIn(s.wishlist, game.id);
    if (game && game.n) entryFor(s, game.id).name = game.n;
    write(true);
    const news = checkQuiet();
    emit();
    return { on: on, achievements: news };
  }

  function toggleBacklog(game) {
    const s = read();
    const on = toggleIn(s.backlog, game.id);
    const entry = entryFor(s, game.id);
    if (game && game.n) entry.name = game.n;
    entry.status = on ? 'backlog' : 'jogando';
    write(true);
    emit();
    return { on: on };
  }

  function setStatus(id, status) {
    const s = read();
    const entry = entryFor(s, id);
    entry.status = status;
    if (status === 'zerado') {
      const at = s.backlog.indexOf(String(id));
      if (at >= 0) s.backlog.splice(at, 1);
    }
    write(true);
    const news = checkQuiet();
    emit();
    return { achievements: news };
  }

  function setNote(id, text) {
    const s = read();
    const clean = String(text || '');
    if (clean.trim()) s.notes[String(id)] = clean.slice(0, 2000);
    else delete s.notes[String(id)];
    write(true);
    emit();
  }

  function setRating(id, stars, review, name) {
    const s = read();
    const key = String(id);
    const value = Math.max(0, Math.min(5, Math.round(Number(stars) || 0)));
    const text = String(review || '').slice(0, 1200);
    const before = s.ratings[key] || { stars: 0, review: '' };
    if (!value && !text.trim()) delete s.ratings[key];
    else s.ratings[key] = { stars: value, review: text, at: Date.now(), name: name || (s.games[key] && s.games[key].name) || '' };
    write(true);
    /* XP só quando a nota muda e quando a resenha nasce */
    if (value && value !== before.stars) addXp(6);
    if (text.trim().length > 3 && (before.review || '').trim().length <= 3) addXp(10);
    write(true);
    const news = checkQuiet();
    emit();
    return { achievements: news };
  }

  /* ---------- coleções ---------- */
  function createCollection(name) {
    const s = read();
    const title = String(name || '').trim().slice(0, 40);
    if (!title) return null;
    const collection = { id: 'c' + Date.now().toString(36), name: title, games: [], at: Date.now() };
    s.collections.push(collection);
    if (s.collections.length <= 5) addXp(10);
    write(true);
    const news = checkQuiet();
    emit();
    return { collection: collection, achievements: news };
  }

  function removeCollection(id) {
    const s = read();
    s.collections = s.collections.filter(function (item) { return item.id !== id; });
    write(true);
    return s.collections.slice();
  }

  function toggleCollectionGame(collectionId, game) {
    const s = read();
    const collection = s.collections.filter(function (item) { return item.id === collectionId; })[0];
    if (!collection) return null;
    const on = toggleIn(collection.games, game.id);
    if (game && game.n) entryFor(s, game.id).name = game.n;
    write(true);
    emit();
    return { on: on };
  }

  /* ---------- conquistas ---------- */
  function context() {
    const s = read();
    const ids = Object.keys(s.games);
    let plays = 0;
    let minutes = 0;
    let studios = {};
    let longest = 0;
    ids.forEach(function (id) {
      const entry = s.games[id];
      plays += entry.plays || 0;
      minutes += entry.minutes || 0;
      if (entry.studio) studios[entry.studio] = true;
    });
    s.sessions.forEach(function (item) { if (item.mins > longest) longest = item.mins; });
    const ratingsList = Object.keys(s.ratings).map(function (key) { return s.ratings[key]; });
    return {
      games: ids.filter(function (id) { return (s.games[id].plays || 0) > 0; }).length,
      plays: plays,
      minutes: minutes,
      favorites: s.favorites.length,
      wishlist: s.wishlist.length,
      backlog: s.backlog.length,
      collections: s.collections.length,
      ratings: ratingsList.filter(function (item) { return item.stars > 0; }).length,
      reviews: ratingsList.filter(function (item) { return (item.review || '').trim().length > 3; }).length,
      done: ids.filter(function (id) { return s.games[id].status === 'zerado'; }).length,
      streak: s.login.streak || 0,
      level: levelInfo(s.xp).level,
      night: !!s.night,
      longest: longest,
      studios: Object.keys(studios).length,
      opens: s.opens || 0,
      tabs: (s.seen.tabs || []).length,
      wrapped: !!s.seen.wrapped
    };
  }

  function list() {
    const s = read();
    const ctx = context();
    return ACHIEVEMENTS.map(function (item) {
      const at = s.achievements[item.id] || 0;
      const pair = item.progress ? item.progress(ctx) : [0, 1];
      return {
        id: item.id,
        name: item.name,
        desc: item.desc,
        hidden: !!item.hidden,
        xp: item.xp || 0,
        at: at,
        done: !!at,
        progress: pair[0],
        target: pair[1]
      };
    });
  }

  /* verifica sem avisar (usado em ações em lote) */
  function checkQuiet() {
    const s = read();
    const ctx = context();
    const unlocked = [];
    ACHIEVEMENTS.forEach(function (item) {
      if (s.achievements[item.id]) return;
      let ok = false;
      try { ok = !!item.test(ctx); } catch (error) { ok = false; }
      if (!ok) return;
      s.achievements[item.id] = Date.now();
      s.xp += item.xp || 0;
      unlocked.push({ id: item.id, name: item.name, desc: item.desc, xp: item.xp || 0 });
    });
    if (unlocked.length) write(true);
    return unlocked;
  }

  /* ---------- desafios do dia ---------- */
  const CHALLENGES = [
    { id: 'play2', text: 'Abra 2 jogos hoje', target: 2, metric: 'plays', reward: 15 },
    { id: 'play4', text: 'Abra 4 jogos hoje', target: 4, metric: 'plays', reward: 25 },
    { id: 'min15', text: 'Jogue 15 minutos', target: 15, metric: 'minutes', reward: 20 },
    { id: 'min30', text: 'Jogue 30 minutos', target: 30, metric: 'minutes', reward: 35 },
    { id: 'distinct3', text: 'Jogue 3 jogos diferentes', target: 3, metric: 'distinct', reward: 25 },
    { id: 'fav1', text: 'Favorite um jogo', target: 1, metric: 'favorites', reward: 12 }
  ];

  function dayStats() {
    const s = read();
    const today = dayKey();
    /* partidas de hoje: sessões encerradas + jogos abertos hoje (mesmo que
       a sessão tenha durado menos de um minuto) */
    const todaySessions = s.sessions.filter(function (item) { return dayKey(new Date(item.at)) === today; });
    const opened = Object.keys(s.games).filter(function (id) {
      return s.games[id].last && dayKey(new Date(s.games[id].last)) === today;
    });
    let minutes = todaySessions.reduce(function (sum, item) { return sum + item.mins; }, 0);
    if (open) minutes += Math.floor((Date.now() - open.start) / 60000);
    return {
      plays: Math.max(opened.length, todaySessions.length) + (open && opened.length === 0 ? 1 : 0),
      minutes: minutes,
      distinct: Math.max(opened.length, Object.keys(todaySessions.reduce(function (acc, item) { acc[item.id] = true; return acc; }, {})).length)
    };
  }

  /* três desafios por dia, sempre os mesmos naquele dia */
  function challenges() {
    const s = read();
    const today = dayKey();
    if (s.challenges.date !== today) {
      const seed = Number(today.replace(/-/g, '')) % 997;
      const picks = [];
      for (let i = 0; i < 3; i += 1) {
        picks.push(CHALLENGES[(seed + i * 2) % CHALLENGES.length]);
      }
      const unique = [];
      picks.forEach(function (item) { if (!unique.some(function (u) { return u.id === item.id; })) unique.push(item); });
      let extra = 0;
      while (unique.length < 3) {
        const candidate = CHALLENGES[(seed + extra + 5) % CHALLENGES.length];
        if (!unique.some(function (u) { return u.id === candidate.id; })) unique.push(candidate);
        extra += 1;
      }
      s.challenges = { date: today, claimed: [] };
      s.challengeList = unique.map(function (item) { return item.id; });
      write(true);
    }
    const ids = s.challengeList && s.challengeList.length ? s.challengeList : CHALLENGES.slice(0, 3).map(function (item) { return item.id; });
    const stats = dayStats();
    const favToday = s.favorites.length;
    return ids.map(function (id) {
      const def = CHALLENGES.filter(function (item) { return item.id === id; })[0] || CHALLENGES[0];
      let progress = 0;
      if (def.metric === 'plays') progress = stats.plays;
      else if (def.metric === 'minutes') progress = stats.minutes;
      else if (def.metric === 'distinct') progress = stats.distinct;
      else if (def.metric === 'favorites') progress = favToday;
      const claimed = (s.challenges.claimed || []).indexOf(def.id) >= 0;
      return {
        id: def.id,
        text: def.text,
        reward: def.reward,
        progress: Math.min(def.target, progress),
        target: def.target,
        done: progress >= def.target,
        claimed: claimed
      };
    });
  }

  function claimChallenges() {
    const s = read();
    const listNow = challenges();
    const gained = [];
    listNow.forEach(function (item) {
      if (!item.done || item.claimed) return;
      s.challenges.claimed.push(item.id);
      addXp(item.reward);
      gained.push(item);
    });
    if (gained.length) {
      write(true);
      checkQuiet();
      emit();
    }
    return gained;
  }

  /* ---------- perfil ---------- */
  function setName(name) {
    const s = read();
    s.profile.name = String(name || '').trim().slice(0, 24) || 'Jogador';
    write();
    return s.profile.name;
  }

  function cycleArt() {
    const s = read();
    s.profile.art = (Number(s.profile.art) || 0) + 1;
    write();
    return s.profile.art;
  }

  function markOpen() {
    const s = read();
    s.opens = (Number(s.opens) || 0) + 1;
    write(true);
    const news = checkQuiet();
    emit();
    return news;
  }

  function markTab(id) {
    const s = read();
    if (s.seen.tabs.indexOf(id) < 0) s.seen.tabs.push(id);
    write(true);
    const news = checkQuiet();
    emit();
    return news;
  }

  function markWrapped() {
    const s = read();
    s.seen.wrapped = true;
    write(true);
    const news = checkQuiet();
    emit();
    return news;
  }

  /* ---------- resumo / export ---------- */
  function summary() {
    const s = read();
    const info = levelInfo(s.xp);
    const ctx = context();
    return {
      name: s.profile.name,
      art: s.profile.art,
      xp: s.xp,
      level: info.level,
      into: info.into,
      need: info.need,
      pct: info.pct,
      games: ctx.games,
      plays: ctx.plays,
      minutes: ctx.minutes,
      favorites: ctx.favorites,
      wishlist: ctx.wishlist,
      backlog: ctx.backlog,
      collections: s.collections.length,
      achievements: list().filter(function (item) { return item.done; }).length,
      achievementsTotal: ACHIEVEMENTS.length,
      streak: s.login.streak || 0,
      rating: ratingStats()
    };
  }

  function ratingStats() {
    const s = read();
    const values = Object.keys(s.ratings).map(function (key) { return s.ratings[key].stars || 0; }).filter(Boolean);
    if (!values.length) return 0;
    return Math.round((values.reduce(function (a, b) { return a + b; }, 0) / values.length) * 10) / 10;
  }

  function topGames(limit) {
    const s = read();
    return Object.keys(s.games)
      .map(function (id) { return Object.assign({ id: id }, s.games[id]); })
      .filter(function (item) { return (item.plays || 0) > 0; })
      .sort(function (a, b) { return (b.minutes || 0) - (a.minutes || 0) || (b.plays || 0) - (a.plays || 0); })
      .slice(0, limit || 5);
  }

  function recent(limit) {
    const s = read();
    return Object.keys(s.games)
      .map(function (id) { return Object.assign({ id: id }, s.games[id]); })
      .filter(function (item) { return item.last > 0; })
      .sort(function (a, b) { return b.last - a.last; })
      .slice(0, limit || 5);
  }

  function exportData() {
    return JSON.stringify(read(), null, 2);
  }

  function importData(text) {
    let raw = null;
    try { raw = JSON.parse(String(text || '')); } catch (error) { return { ok: false, error: 'JSON inválido' }; }
    if (!raw || typeof raw !== 'object' || !('xp' in raw) || !('games' in raw)) return { ok: false, error: 'não parece um backup do LuminPlayer' };
    memory = normalize(raw);
    write();
    return { ok: true, summary: summary() };
  }

  function reset() {
    memory = blank();
    write();
    return summary();
  }

  function on(fn) {
    if (typeof fn !== 'function') return function () {};
    listeners.push(fn);
    return function () {
      const at = listeners.indexOf(fn);
      if (at >= 0) listeners.splice(at, 1);
    };
  }

  window.LuminPlayer = {
    read: read,
    summary: summary,
    levelInfo: levelInfo,
    login: login,
    startSession: startSession,
    endSession: endSession,
    currentSession: currentSession,
    toggleFavorite: toggleFavorite,
    toggleWishlist: toggleWishlist,
    toggleBacklog: toggleBacklog,
    setStatus: setStatus,
    setNote: setNote,
    setRating: setRating,
    createCollection: createCollection,
    removeCollection: removeCollection,
    toggleCollectionGame: toggleCollectionGame,
    achievements: list,
    challenges: challenges,
    claimChallenges: claimChallenges,
    dayStats: dayStats,
    topGames: topGames,
    recent: recent,
    setName: setName,
    cycleArt: cycleArt,
    markOpen: markOpen,
    markTab: markTab,
    markWrapped: markWrapped,
    addXp: function (amount) { addXp(amount); write(); return summary(); },
    exportData: exportData,
    importData: importData,
    reset: reset,
    on: on
  };
})();
