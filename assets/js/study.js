/* =========================================================
   StudyHub — interações da página de estudos
   · abas (início, recursos, quiz, planejador, dúvidas)
   · busca e filtro por matéria nos recursos
   · planejador salvo no próprio navegador (localStorage), com progresso
   · cronômetro de foco (25/10/5 min)
   · quiz com banco de questões por série e matéria (study-questions.js)
   · título fixo "StudyHub | Estudos e Quiz"
   · saída discreta para o LuminSDK: clicar em "Ryan Smith" no rodapé
     (o atalho Shift+D / Alt+S agora é do app.js, que vale em todas as abas)

   Sem bibliotecas, sem build.
   Autor: Ryan Smith · Licença MIT
   ========================================================= */
(function () {
  'use strict';

  const TASKS_KEY = 'studydesk:v1:tasks';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.prototype.slice.call(document.querySelectorAll(sel));

  /* ---------- título fixo: sempre \"StudyHub | Estudos e Quiz\" ----------
     o app define o título ao trocar de aba; enquanto esta página estiver
     aberta, qualquer troca volta para o nome certo. */
  const TITLE = 'StudyHub | Estudos e Quiz';
  let titleObserver = null;

  function holdTitle() {
    if (document.title !== TITLE) document.title = TITLE;
    const head = document.querySelector('title');
    if (!head || !window.MutationObserver) return null;
    const observer = new MutationObserver(function () {
      if (document.title !== TITLE) document.title = TITLE;
    });
    observer.observe(head, { childList: true, characterData: true, subtree: true });
    return observer;
  }

  titleObserver = holdTitle();
  window.addEventListener('lumin:view', function (event) {
    const route = event.detail && event.detail.route;
    if (route === 'estudo') {
      if (!titleObserver) titleObserver = holdTitle();
    } else if (titleObserver) {
      titleObserver.disconnect();
      titleObserver = null;
    }
  });

  /* ---------- abas: cada seção pertence a uma aba (data-panel) ---------- */
  const TAB_OF_HASH = {
    '#inicio': 'inicio', '#sd-topo': 'inicio', '#materias': 'inicio',
    '#recursos': 'recursos', '#teste': 'quiz', '#planejador': 'planejador', '#faq-estudo': 'faq'
  };

  function showTab(name) {
    $$('#conteudo [data-panel]').forEach(function (panel) {
      panel.hidden = panel.dataset.panel !== name;
    });
    $$('.sd-nav [data-tab]').forEach(function (link) {
      const on = link.dataset.tab === name;
      link.classList.toggle('is-on', on);
      link.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  function openTab(hash, scroll) {
    const name = TAB_OF_HASH[hash] || 'inicio';
    showTab(name);
    if (scroll === false) return;
    const target = hash && hash !== '#sd-topo' ? document.querySelector(hash) : null;
    if (target && target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showTab('inicio');

  /* links da página (menu, rodapé, chamadas) trocam de aba, sem recarregar */
  const studyRoot = $('#view-estudo');
  if (studyRoot) {
    studyRoot.addEventListener('click', function (event) {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;
      const hash = link.getAttribute('href');
      if (!(hash in TAB_OF_HASH) && hash !== '#conteudo') return;
      if (hash === '#conteudo') return;
      event.preventDefault();
      openTab(hash, true);
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', hash);
      }
    });
  }

  /* ---------- recursos: busca + filtro ---------- */
  const state = { query: '', subject: '' };
  const list = $('#lista');
  const info = $('#recursos-info');
  const empty = $('#vazio');
  const search = $('#busca');
  const chips = $('#chips');

  const RESOURCES = $$('.sd-res__item').map(function (node) {
    return {
      node: node,
      subject: node.dataset.subject || '',
      text: (node.textContent || '').toLowerCase() + ' ' + (node.dataset.keys || '')
    };
  });

  function filter() {
    let shown = 0;
    RESOURCES.forEach(function (item) {
      const okSubject = !state.subject || item.subject === state.subject;
      const okQuery = !state.query || item.text.indexOf(state.query) >= 0;
      const ok = okSubject && okQuery;
      item.node.hidden = !ok;
      if (ok) shown++;
    });

    if (empty) empty.hidden = shown !== 0;
    if (info) {
      info.textContent = shown === RESOURCES.length
        ? 'Mostrando todos os recursos.'
        : shown === 0
          ? 'Nenhum recurso corresponde ao filtro.'
          : 'Mostrando ' + shown + ' de ' + RESOURCES.length + ' recursos.';
    }
  }

  if (search) {
    let timer = 0;
    search.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        state.query = search.value.trim().toLowerCase();
        filter();
      }, 90);
    });
    search.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        state.query = search.value.trim().toLowerCase();
        filter();
        const first = RESOURCES.filter(function (item) { return !item.node.hidden; })[0];
        if (first) {
          first.node.querySelector('details').open = true;
          first.node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });
  }

  const buscar = $('#buscar');
  if (buscar) {
    buscar.addEventListener('click', function () {
      if (search) {
        state.query = search.value.trim().toLowerCase();
        filter();
      }
      showTab('recursos');
      const section = $('#recursos');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (chips) {
    chips.addEventListener('click', function (event) {
      const chip = event.target.closest('[data-subject]');
      if (!chip) return;
      state.subject = chip.dataset.subject || '';
      $$('#chips [data-subject]').forEach(function (item) {
        item.classList.toggle('is-on', item === chip);
      });
      filter();
    });
  }

  /* cartões de matéria: levam ao acervo já filtrado */
  $$('#materias [data-subject]').forEach(function (button) {
    button.addEventListener('click', function () {
      state.subject = button.dataset.subject || '';
      state.query = '';
      if (search) search.value = '';
      $$('#chips [data-subject]').forEach(function (item) {
        item.classList.toggle('is-on', (item.dataset.subject || '') === state.subject);
      });
      filter();
      showTab('recursos');
      const section = $('#recursos');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ---------- planejador ---------- */
  function readTasks() {
    try {
      const list = JSON.parse(localStorage.getItem(TASKS_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (error) {
      return [];
    }
  }

  function saveTasks(tasks) {
    try {
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks.slice(0, 80)));
    } catch (error) {}
  }

  const tasksBox = $('#tarefas');
  const noTasks = $('#sem-tarefas');
  const progressBox = $('#progresso');
  const progressFill = $('#progresso-fill');
  const progressText = $('#progresso-texto');
  const copyBtn = $('#copiar-plano');

  function paintProgress(tasks) {
    const done = tasks.filter(function (task) { return task.done; }).length;
    if (progressBox) progressBox.hidden = tasks.length === 0;
    if (copyBtn) copyBtn.hidden = tasks.length === 0;
    if (progressFill) {
      progressFill.style.width = tasks.length ? Math.round((done / tasks.length) * 100) + '%' : '0%';
    }
    if (progressText) {
      progressText.textContent = done + ' de ' + tasks.length + ' concluída' +
        (tasks.length === 1 ? '' : 's') +
        (tasks.length ? ' · ' + Math.round((done / tasks.length) * 100) + '%' : '');
    }
  }

  function paint() {
    if (!tasksBox) return;
    const tasks = readTasks();
    tasksBox.textContent = '';
    if (noTasks) noTasks.hidden = tasks.length > 0;
    paintProgress(tasks);

    tasks.forEach(function (task, index) {
      const item = document.createElement('li');
      item.className = 'task' + (task.done ? ' is-done' : '');

      const check = document.createElement('input');
      check.type = 'checkbox';
      check.checked = !!task.done;
      check.setAttribute('aria-label', 'Concluir: ' + task.text);
      check.addEventListener('change', function () {
        const all = readTasks();
        if (all[index]) all[index].done = check.checked;
        saveTasks(all);
        paint();
      });

      const label = document.createElement('span');
      label.textContent = task.text;

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.title = 'Remover tarefa';
      remove.setAttribute('aria-label', 'Remover: ' + task.text);
      remove.addEventListener('click', function () {
        const all = readTasks();
        all.splice(index, 1);
        saveTasks(all);
        paint();
      });

      item.append(check, label, remove);
      tasksBox.append(item);
    });
  }

  const form = $('#planner-form');
  const input = $('#tarefa');
  if (form && input) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      const tasks = readTasks();
      tasks.push({ text: text.slice(0, 120), done: false });
      saveTasks(tasks);
      input.value = '';
      paint();
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      const tasks = readTasks();
      if (!tasks.length) return;
      const text = 'Meu plano de estudos\n' + tasks.map(function (task) {
        return (task.done ? '[x] ' : '[ ] ') + task.text;
      }).join('\n');
      const done = function () {
        copyBtn.textContent = 'Plano copiado!';
        setTimeout(function () { copyBtn.textContent = 'Copiar plano'; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        const area = document.createElement('textarea');
        area.value = text;
        document.body.append(area);
        area.select();
        try { document.execCommand('copy'); } catch (error) {}
        area.remove();
        done();
      }
    });
  }

  paint();

  /* ---------- cronômetro de foco ---------- */
  (function timer() {
    const clock = $('#timer-clock');
    const bar = $('#timer-bar');
    const toggle = $('#timer-toggle');
    const reset = $('#timer-reset');
    const hint = $('#timer-hint');
    const box = $('#foco');
    const presets = $$('#foco [data-min]');
    if (!clock || !toggle) return;

    let total = 25 * 60;
    let left = total;
    let running = false;
    let tick = 0;

    function format(seconds) {
      const min = Math.floor(seconds / 60);
      const sec = seconds % 60;
      return (min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec;
    }

    function paintClock() {
      clock.textContent = format(left);
      if (bar) bar.style.width = (total ? ((total - left) / total) * 100 : 0) + '%';
      if (box) box.classList.toggle('timer--run', running);
      toggle.textContent = running ? 'Pausar' : (left === total ? 'Começar' : 'Continuar');
    }

    function stop() {
      clearInterval(tick);
      tick = 0;
      running = false;
      paintClock();
    }

    function start() {
      if (running || left <= 0) return;
      running = true;
      paintClock();
      tick = setInterval(function () {
        left -= 1;
        if (left <= 0) {
          left = 0;
          stop();
          clock.classList.add('is-done');
          if (hint) hint.textContent = 'Bloco concluído! Levante, beba água e volte em 5 minutos.';
          return;
        }
        paintClock();
      }, 1000);
    }

    toggle.addEventListener('click', function () {
      if (running) stop();
      else start();
    });

    if (reset) {
      reset.addEventListener('click', function () {
        stop();
        left = total;
        clock.classList.remove('is-done');
        if (hint) hint.textContent = 'Estude em blocos e descanse 5 minutos entre eles.';
        paintClock();
      });
    }

    presets.forEach(function (chip) {
      chip.addEventListener('click', function () {
        stop();
        total = Number(chip.dataset.min) * 60;
        left = total;
        clock.classList.remove('is-done');
        if (hint) hint.textContent = chip.dataset.min + ' minutos de foco. Sem celular por perto.';
        presets.forEach(function (item) { item.classList.toggle('is-on', item === chip); });
        paintClock();
      });
    });

    paintClock();
  })();

  /* ---------- teste rápido ---------- */
  (function quiz() {
    const box = $('#quiz');
    const count = $('#quiz-count');
    const score = $('#quiz-score');
    const bar = $('#quiz-bar');
    const question = $('#quiz-question');
    const options = $('#quiz-options');
    const feedback = $('#quiz-feedback');
    const next = $('#quiz-next');
    const restart = $('#quiz-restart');
    const review = $('#quiz-review');
    const pool = $('#quiz-pool');
    const sizeSel = $('#quiz-size');
    if (!box || !options) return;

    /* banco: assets/js/study-questions.js (window.STUDY_QUESTIONS) */
    const BANK = (window.STUDY_QUESTIONS || []).map(function (row, i) {
      return { id: i, grade: row[0], subject: row[1], q: row[2], a: row[3], right: row[4], why: row[5] };
    });

    const filters = { grade: '', subject: '' };
    let deck = [];
    let index = 0;
    let hits = 0;
    let wrong = [];
    let answered = false;
    let reviewing = false;

    function shuffle(list) {
      const copy = list.slice();
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
      }
      return copy;
    }

    function matching() {
      return BANK.filter(function (item) {
        return (!filters.grade || item.grade === filters.grade) &&
          (!filters.subject || item.subject === filters.subject);
      });
    }

    function paintPool() {
      if (!pool) return;
      const total = matching().length;
      pool.textContent = total + (total === 1 ? ' pergunta neste filtro' : ' perguntas neste filtro');
    }

    function paintScore() {
      if (score) score.textContent = hits + (hits === 1 ? ' acerto' : ' acertos');
    }

    function setButtons(group, attr, value) {
      $$(group + ' [' + attr + ']').forEach(function (item) {
        item.classList.toggle('is-on', (item.getAttribute(attr) || '') === value);
      });
    }

    function start(items, isReview) {
      reviewing = !!isReview;
      box.classList.remove('is-over');
      if (review) review.hidden = true;
      if (next) next.hidden = true;
      if (feedback) { feedback.textContent = ''; feedback.className = 'sd-quiz__feedback'; }
      index = 0;
      hits = 0;
      wrong = [];
      paintPool();
      paintScore();

      if (!items.length) {
        deck = [];
        if (count) count.textContent = 'Sem perguntas';
        if (bar) bar.style.width = '0%';
        if (question) question.textContent = 'Nenhuma pergunta com essa combinação de série e matéria. Troque um dos filtros.';
        options.textContent = '';
        return;
      }

      const limit = Number(sizeSel && sizeSel.value) || 10;
      deck = isReview ? shuffle(items) : shuffle(items).slice(0, Math.min(limit, items.length));
      render();
    }

    function render() {
      answered = false;
      const item = deck[index];
      if (count) {
        count.textContent = (reviewing ? 'Revisão · ' : '') +
          'Pergunta ' + (index + 1) + ' de ' + deck.length + ' · ' + item.grade.replace(/^(\d)$/, '$1º ano').replace('vida', 'vida prática');
      }
      if (bar) bar.style.width = Math.round((index / deck.length) * 100) + '%';
      if (question) question.textContent = item.q;
      if (feedback) { feedback.textContent = ''; feedback.className = 'sd-quiz__feedback'; }
      if (next) { next.hidden = true; next.textContent = index === deck.length - 1 ? 'Ver resultado' : 'Próxima'; }
      options.textContent = '';

      item.a.forEach(function (text, i) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'opt';
        button.textContent = text;
        button.addEventListener('click', function () { choose(i); });
        options.append(button);
      });
    }

    function choose(i) {
      if (answered || !deck[index]) return;
      answered = true;
      const item = deck[index];
      const right = i === item.right;
      if (right) hits += 1;
      else wrong.push(item);

      Array.prototype.forEach.call(options.children, function (child, k) {
        child.disabled = true;
        if (k === item.right) child.classList.add('is-right');
        else if (k === i) child.classList.add('is-wrong');
      });
      if (feedback) {
        feedback.className = 'sd-quiz__feedback ' + (right ? 'is-right' : 'is-wrong');
        feedback.textContent = (right ? 'Isso! ' : 'Resposta: ' + item.a[item.right] + '. ') + item.why;
      }
      paintScore();
      if (next) next.hidden = false;
    }

    function finish() {
      box.classList.add('is-over');
      if (bar) bar.style.width = '100%';
      if (count) count.textContent = 'Resultado';
      const pct = Math.round((hits / deck.length) * 100);
      if (feedback) {
        feedback.className = 'sd-quiz__feedback ' + (pct >= 70 ? 'is-right' : 'is-wrong');
        feedback.textContent = hits + ' de ' + deck.length + ' (' + pct + '%)' +
          (pct >= 70 ? ' — muito bom, continue assim.' : ' — revise os erros abaixo e tente de novo.');
      }
      if (question) question.textContent = wrong.length ? 'Erros para revisar: ' + wrong.length : 'Nenhum erro nesta rodada!';
      options.textContent = '';

      if (wrong.length) {
        const list = document.createElement('ol');
        list.className = 'sd-quiz__wrong';
        wrong.forEach(function (item) {
          const li = document.createElement('li');
          li.textContent = item.q + ' → ' + item.a[item.right];
          list.append(li);
        });
        options.append(list);
      }
      if (next) next.hidden = true;
      if (review) review.hidden = wrong.length === 0;
    }

    if (next) {
      next.addEventListener('click', function () {
        if (!answered) return;
        index += 1;
        if (index >= deck.length) finish();
        else render();
      });
    }

    if (review) {
      review.addEventListener('click', function () {
        start(wrong.slice(), true);
      });
    }

    if (restart) {
      restart.addEventListener('click', function () {
        start(matching(), false);
      });
    }

    const gradeRow = $('#quiz-grades');
    if (gradeRow) {
      gradeRow.addEventListener('click', function (event) {
        const chip = event.target.closest('[data-grade]');
        if (!chip) return;
        filters.grade = chip.dataset.grade || '';
        setButtons('#quiz-grades', 'data-grade', filters.grade);
        start(matching(), false);
      });
    }

    const subjectRow = $('#quiz-subjects');
    if (subjectRow) {
      subjectRow.addEventListener('click', function (event) {
        const chip = event.target.closest('[data-qsubject]');
        if (!chip) return;
        filters.subject = chip.dataset.qsubject || '';
        setButtons('#quiz-subjects', 'data-qsubject', filters.subject);
        start(matching(), false);
      });
    }

    if (sizeSel) {
      sizeSel.addEventListener('change', function () { start(matching(), false); });
    }

    /* teclas 1 a 4 escolhem a alternativa quando o quiz está aberto */
    document.addEventListener('keydown', function (event) {
      if (answered || !deck.length || box.classList.contains('is-over')) return;
      if (!/^[1-4]$/.test(event.key)) return;
      const tag = (event.target && event.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const button = options.children[Number(event.key) - 1];
      if (button) button.click();
    });

    start(matching(), false);
  })();

  /* atalho "/" leva direto para a busca */
  document.addEventListener('keydown', function (event) {
    if (event.key !== '/' || event.ctrlKey || event.metaKey) return;
    const tag = (event.target && event.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (!search) return;
    event.preventDefault();
    search.focus();
  });

  /* "Entrar" não abre cadastro: o acesso é livre (e isso fica claro) */
  const entrar = $('#entrar');
  if (entrar) {
    entrar.addEventListener('click', function () {
      entrar.textContent = 'Acesso livre';
      entrar.disabled = true;
      entrar.title = 'Não é preciso conta para ler os resumos.';
      setTimeout(function () {
        entrar.textContent = 'Entrar';
        entrar.disabled = false;
      }, 2600);
    });
  }

  /* ---------- saída discreta ---------- */
  function reveal() {
    try { sessionStorage.setItem('luminsdk:v1:reveal', '1'); } catch (error) {}
    if (window.LuminApp) {
      window.LuminApp.go('lumin', { reveal: true });
      return;
    }
    /* sem o app (caso raro): recarrega a própria URL, que já é única —
       o app lê a marca acima e abre o catálogo */
    window.location.replace('./');
  }

  const autor = $('#autor');
  if (autor) {
    autor.addEventListener('click', function (event) {
      if (event.metaKey || event.ctrlKey) return;
      event.preventDefault();
      reveal();
    });
  }

})();
