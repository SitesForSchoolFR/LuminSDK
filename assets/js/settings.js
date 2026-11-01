/* =========================================================
   LuminSDK — personalização e desempenho
   · 20+ opções de aparência, efeitos e desempenho
   · preferências persistentes (efeitos, estilo Y2K, fonte,
     cantos, densidade e velocidade das animações)
   · detecção automática de dispositivo
   · modo leve / tudo ligado
   · painel de configurações e backup

   Autor: Ryan Smith · Licença MIT
   ========================================================= */
(function () {
  'use strict';

  const KEY = 'luminsdk-settings';
  const VERSION = 4; /* v4: cursor próprio ligado por padrão */
  const root = document.documentElement;

  /* Padrão minimalista: nenhum enfeite ligado. Tudo o que existe no painel
     continua disponível — quem quiser o visual cheio liga de novo. */
  const DEFAULTS = {
    /* desempenho e movimento */
    particles: false,
    parallax: false,
    cursor: true,
    motion: true,
    blur: false,
    hover: true,
    /* estilo Y2K */
    y2k: false,
    chrome: false,
    gloss: false,
    bubblecorners: false,
    neon: false,
    glow: false,
    /* fundo */
    stars: false,
    bubbles: false,
    gridfx: false,
    noise: false,
    scanlines: false,
    /* meta */
    auto: true
  };

  const CLASSES = {
    particles: 'no-particles',
    parallax: 'no-parallax',
    cursor: 'no-custom-cursor',
    motion: 'no-motion',
    blur: 'no-blur',
    hover: 'no-hover',
    y2k: 'no-y2k',
    chrome: 'no-chrome',
    gloss: 'no-gloss',
    bubblecorners: 'no-bubblecorners',
    neon: 'no-neon',
    glow: 'no-glow',
    stars: 'no-stars',
    bubbles: 'no-bubbles',
    gridfx: 'no-gridfx',
    noise: 'no-noise',
    scanlines: 'no-scanlines'
  };

  /* opções de múltipla escolha (data-font, data-radius, data-density, data-speed) */
  const OPTION_DEFAULTS = { font: 'inter', radius: 'soft', density: 'cozy', speed: 'normal' };
  const OPTION_VALUES = {
    font: ['inter', 'display', 'mono'],
    radius: ['sharp', 'soft', 'bubble'],
    density: ['cozy', 'compact'],
    speed: ['slow', 'normal', 'fast']
  };

  const listeners = [];
  let settings = Object.assign({}, DEFAULTS);
  let options = Object.assign({}, OPTION_DEFAULTS);

  /* ---------- detecção de dispositivo ---------- */
  function detectDevice() {
    const nav = navigator || {};
    const cores = nav.hardwareConcurrency || 4;
    const memory = nav.deviceMemory || 4;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const savesData = !!(nav.connection && nav.connection.saveData);
    const slowNet = !!(nav.connection && /2g/.test(nav.connection.effectiveType || ''));
    const smallScreen = window.innerWidth < 480;

    /* só considera "modesto" quando há mais de um sinal fraco, ou um sinal forte */
    const lowEnd = (cores <= 2 && memory <= 2) || savesData || slowNet;

    return {
      cores: cores,
      memory: memory,
      reduced: reduced,
      saveData: savesData,
      slowNet: slowNet,
      smallScreen: smallScreen,
      modest: lowEnd
    };
  }

  /* Preset automático: mantém o capricho em máquinas boas e alivia nas modestas */
  function autoSettings() {
    const device = detectDevice();
    /* o padrão é o minimalismo; só o movimento acompanha o aparelho */
    return {
      particles: false,
      parallax: false,
      cursor: true,
      motion: !device.reduced,
      blur: false,
      hover: true,
      y2k: false,
      chrome: false,
      gloss: false,
      bubblecorners: false,
      neon: false,
      glow: false,
      stars: false,
      bubbles: false,
      gridfx: false,
      noise: false,
      scanlines: false,
      auto: true
    };
  }

  const PRESETS = {
    light: {
      particles: false, parallax: false, cursor: false, motion: false, blur: false, hover: false,
      y2k: false, chrome: false, gloss: false, bubblecorners: false, neon: false, glow: false,
      stars: false, bubbles: false, gridfx: false, noise: false, scanlines: false,
      auto: false
    },
    full: {
      particles: true, parallax: true, cursor: true, motion: true, blur: true, hover: true,
      y2k: true, chrome: true, gloss: true, bubblecorners: true, neon: true, glow: true,
      stars: true, bubbles: true, gridfx: true, noise: true, scanlines: true,
      auto: false
    }
  };

  /* ---------- persistência ---------- */
  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      /* preferências de versões antigas podiam deixar efeitos desligados
         sem o visitante saber; a partir da v2, recomeçamos do padrão */
      if (parsed.v !== VERSION) return null;
      return parsed;
    } catch (error) {
      return null;
    }
  }

  function write() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ v: VERSION, settings: settings, options: options }));
    } catch (error) {
      /* sem armazenamento: vale para esta sessão */
    }
  }

  /* ---------- aplicação ---------- */
  function apply() {
    Object.keys(CLASSES).forEach((key) => {
      const enabled = settings[key] !== false;
      root.classList.toggle(CLASSES[key], !enabled);
    });
    root.setAttribute('data-perf', settings.motion === false ? 'light' : 'full');

    Object.keys(OPTION_VALUES).forEach((key) => {
      const value = OPTION_VALUES[key].indexOf(options[key]) >= 0 ? options[key] : OPTION_DEFAULTS[key];
      root.setAttribute('data-' + key, value);
    });
  }

  function emit() {
    const payload = Object.assign({}, settings, { device: detectDevice(), options: Object.assign({}, options) });
    /* um ouvinte com defeito não pode interromper a troca de opção:
       antes o erro subia até o clique e o painel parava no meio */
    try {
      window.dispatchEvent(new CustomEvent('lumin:settings', { detail: payload }));
    } catch (error) {
      console.warn('[LuminSDK] aviso de configurações falhou:', error);
    }
    listeners.forEach((fn) => {
      try {
        fn(payload);
      } catch (error) {
        console.warn('[LuminSDK] listener de configurações falhou:', error);
      }
    });
  }

  /* aplica tudo protegido: se algo falhar no meio, a interface do painel
     é sincronizada de qualquer jeito (o painel nunca fica "vazio") */
  function commit(nextSettings, nextOptions) {
    if (nextSettings) settings = nextSettings;
    if (nextOptions) options = nextOptions;
    try {
      apply();
      write();
      emit();
    } catch (error) {
      console.warn('[LuminSDK] não foi possível aplicar a configuração:', error);
    }
    try {
      syncUI();
    } catch (error) {
      console.warn('[LuminSDK] não foi possível atualizar o painel:', error);
    }
  }

  function set(key, value, opts) {
    if (!(key in DEFAULTS)) return;
    settings = Object.assign({}, settings);
    settings[key] = !!value;
    if (!opts || opts.auto !== true) settings.auto = false;
    commit();
  }

  function setOption(key, value) {
    if (!(key in OPTION_VALUES)) return;
    if (OPTION_VALUES[key].indexOf(value) < 0) return;
    settings = Object.assign({}, settings);
    settings.auto = false;
    options = Object.assign({}, options);
    options[key] = value;
    commit();
  }

  function setAll(next) {
    commit(Object.assign({}, DEFAULTS, next), null);
  }

  function reset() {
    commit(Object.assign({}, autoSettings()), Object.assign({}, OPTION_DEFAULTS));
  }


  /* =========================================================
     Sugestão personalizada — o "sugestão para você" do painel.
     Combina o perfil do aparelho com o histórico de partidas
     para propor uma configuração em vez de exigir escolhas.
     ========================================================= */
  function buildSuggestion() {
    const device = detectDevice();
    const coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    const hour = new Date().getHours();
    const night = hour >= 19 || hour < 6;

    let stats = null;
    try {
      if (window.LuminProgress && typeof window.LuminProgress.stats === 'function') {
        stats = window.LuminProgress.stats();
      }
    } catch (error) {
      stats = null;
    }

    const sessions = stats ? Number(stats.sessions) || 0 : 0;
    const unique = stats ? Number(stats.unique) || 0 : 0;
    const streak = stats ? Number(stats.streak) || 0 : 0;

    const next = Object.assign({}, autoSettings());
    const opts = Object.assign({}, OPTION_DEFAULTS);
    const reasons = [];

    if (device.modest) {
      reasons.push('Aparelho modesto: visual limpo, sem efeitos, os jogos abrem mais rápido.');
    } else {
      reasons.push('Visual minimalista por padrão: sem estrelas, bolhas ou brilhos — os efeitos Y2K ficam a um toque.');
    }

    if (device.reduced) {
      reasons.push('Você pediu menos movimento no sistema: animações e brilhos pausados.');
    } else if (device.smallScreen) {
      reasons.push('Tela pequena: fundo mais limpo e cards em uma coluna.');
    }

    if (sessions >= 8) {
      opts.density = 'compact';
      opts.speed = 'fast';
      reasons.push('Já são ' + sessions + ' partidas: grade compacta e animações rápidas.');
    } else if (!sessions) {
      opts.density = 'cozy';
      opts.radius = 'soft';
      reasons.push('Primeira visita: cards confortáveis e cantos suaves.');
    }

    if (streak >= 3) {
      opts.font = 'display';
      reasons.push('Sequência de ' + streak + ' dias jogando: títulos em Grotesk para dar ênfase.');
    }

    next.auto = true;

    return {
      settings: next,
      options: opts,
      theme: night ? 'dark' : 'light',
      headline: sessions
        ? 'Você já jogou ' + sessions + (sessions === 1 ? ' partida' : ' partidas') +
          (unique > 1 ? ' em ' + unique + ' jogos diferentes' : '') + ' por aqui.'
        : 'Primeira vez por aqui? Esta é a combinação que eu recomendo.',
      reasons: reasons.slice(0, 3)
    };
  }

  let suggestionCache = null;

  function renderSuggestion() {
    const headline = document.getElementById('settings-suggest-headline');
    const list = document.getElementById('settings-suggest-list');
    const apply = document.getElementById('settings-suggest-apply');
    const skip = document.getElementById('settings-suggest-skip');
    const card = document.getElementById('settings-suggest');
    if (!headline || !list || !card) return;

    suggestionCache = buildSuggestion();
    headline.textContent = suggestionCache.headline;

    list.textContent = '';
    suggestionCache.reasons.forEach((text) => {
      const item = document.createElement('li');
      item.textContent = text;
      list.appendChild(item);
    });

    if (apply) apply.textContent = suggestionCache.theme === 'dark' ? 'Aplicar (tema escuro)' : 'Aplicar (tema claro)';
    if (skip) skip.hidden = false;
  }

  function applySuggestion() {
    if (!suggestionCache) suggestionCache = buildSuggestion();
    settings = Object.assign({}, DEFAULTS, suggestionCache.settings);
    options = Object.assign({}, OPTION_DEFAULTS, suggestionCache.options);
    setTheme(suggestionCache.theme);
    apply();
    write();
    emit();
    syncUI();
    const card = document.getElementById('settings-suggest');
    if (card) card.classList.add('is-applied');
    if (window.LuminLibrary && typeof window.LuminLibrary.toast === 'function') {
      window.LuminLibrary.toast('Sugestão aplicada — dá para ajustar tudo abaixo.');
    }
  }

  /* ---------- UI ---------- */
  function syncUI() {
    document.querySelectorAll('[data-setting]').forEach((input) => {
      const key = input.dataset.setting;
      input.checked = settings[key] !== false;
    });

    document.querySelectorAll('[data-option]').forEach((button) => {
      const key = button.dataset.option;
      const active = options[key] === button.dataset.value;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    const theme = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    document.querySelectorAll('[data-theme-choice]').forEach((button) => {
      const active = button.dataset.themeChoice === theme;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    document.querySelectorAll('#custom-swatches .swatch').forEach((swatch) => {
      const current = window.LuminPalette ? String(window.LuminPalette.current() || '').toLowerCase() : '';
      const active = swatch.dataset.hex && swatch.dataset.hex.toLowerCase() === current;
      swatch.classList.toggle('is-active', !!active);
      swatch.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    /* estado dos presets: mostra qual combinação está valendo agora */
    const effectKeys = Object.keys(DEFAULTS).filter((key) => key !== 'auto');
    const allOff = effectKeys.every((key) => settings[key] === false);
    const allOn = effectKeys.every((key) => settings[key] !== false);
    const presetActive = settings.auto ? 'auto' : allOff ? 'light' : allOn ? 'full' : '';
    [
      ['settings-auto', 'auto'],
      ['settings-light', 'light'],
      ['settings-full', 'full']
    ].forEach((pair) => {
      const button = document.getElementById(pair[0]);
      if (!button) return;
      const active = presetActive === pair[1];
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    const device = detectDevice();
    const label = document.getElementById('settings-device');
    if (label) {
      const parts = [];
      parts.push(device.cores + ' núcleos');
      if (device.memory) parts.push(device.memory + ' GB RAM');
      if (device.reduced) parts.push('movimento reduzido no sistema');
      if (device.saveData) parts.push('economia de dados ativa');
      parts.push(device.modest ? 'perfil leve' : 'perfil completo');
      if (settings.auto) parts.push('automático');
      label.textContent = parts.join(' · ');
    }

    const count = document.getElementById('settings-count');
    if (count) {
      const total = Object.keys(DEFAULTS).length - 1 + Object.keys(OPTION_VALUES).length;
      count.textContent = total + ' opções';
    }
  }

  function buildSwatches() {
    const holder = document.getElementById('custom-swatches');
    if (!holder || !window.LuminPalette) return;
    holder.textContent = '';
    window.LuminPalette.presets().forEach((preset) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'swatch swatch--mini';
      button.dataset.hex = preset.hex;
      button.style.background = preset.hex;
      button.setAttribute('aria-label', 'Usar a cor ' + preset.name);
      button.title = preset.name;
      button.addEventListener('click', () => {
        window.LuminPalette.apply(preset.hex);
        syncUI();
      });
      holder.appendChild(button);
    });
  }

  function setTheme(theme) {
    if (window.LuminTheme && typeof window.LuminTheme.set === 'function') {
      window.LuminTheme.set(theme);
    } else {
      root.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
    }
    syncUI();
  }

  function openSettings() {
    const dialog = document.getElementById('settings');
    if (!dialog) return;

    /* cada bloco é opcional: um erro em um deles não pode impedir o
       painel de abrir (antes, uma exceção aqui deixava a tela vazia) */
    [buildSwatches, renderSuggestion, syncUI].forEach((step) => {
      try {
        step();
      } catch (error) {
        console.warn('[LuminSDK] bloco do painel falhou:', error);
      }
    });

    try {
      if (typeof dialog.showModal === 'function') {
        if (!dialog.open) dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
    } catch (error) {
      dialog.setAttribute('open', '');
    }
  }

  function closeSettings() {
    const dialog = document.getElementById('settings');
    if (!dialog) return;
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
  }

  function initUI() {
    const button = document.getElementById('settings-btn');
    const close = document.getElementById('settings-close');
    const auto = document.getElementById('settings-auto');
    const light = document.getElementById('settings-light');
    const full = document.getElementById('settings-full');

    if (button) button.addEventListener('click', openSettings);
    if (close) close.addEventListener('click', closeSettings);

    const done = document.getElementById('settings-done');
    if (done) done.addEventListener('click', closeSettings);

    const sheet = document.getElementById('settings');
    if (sheet) {
      /* clique fora do cartão fecha (alguns navegadores não fazem isso sozinhos) */
      sheet.addEventListener('click', (event) => {
        if (event.target !== sheet) return;
        const rect = sheet.getBoundingClientRect();
        const outside =
          event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom;
        if (outside) closeSettings();
      });
      /* Esc no Safari antigo não fecha <dialog> */
      document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || !sheet.open) return;
        closeSettings();
      });
    }

    const suggestApply = document.getElementById('settings-suggest-apply');
    const suggestSkip = document.getElementById('settings-suggest-skip');
    if (suggestApply) suggestApply.addEventListener('click', applySuggestion);
    if (suggestSkip) {
      suggestSkip.addEventListener('click', () => {
        const card = document.getElementById('settings-suggest');
        if (card) card.classList.add('is-skipped');
      });
    }

    document.querySelectorAll('[data-setting]').forEach((input) => {
      input.addEventListener('change', () => set(input.dataset.setting, input.checked));
    });

    document.querySelectorAll('[data-option]').forEach((optionButton) => {
      optionButton.addEventListener('click', () => setOption(optionButton.dataset.option, optionButton.dataset.value));
    });

    document.querySelectorAll('[data-theme-choice]').forEach((themeButton) => {
      themeButton.addEventListener('click', () => setTheme(themeButton.dataset.themeChoice));
    });

    if (auto) {
      auto.addEventListener('click', () => {
        reset();
        if (window.LuminLibrary) window.LuminLibrary.toast('Efeitos ajustados para este dispositivo.');
      });
    }
    if (light) {
      light.addEventListener('click', () => {
        setAll(PRESETS.light);
        if (window.LuminLibrary) window.LuminLibrary.toast('Modo leve ativado.');
      });
    }
    if (full) {
      full.addEventListener('click', () => {
        setAll(PRESETS.full);
        if (window.LuminLibrary) window.LuminLibrary.toast('Todos os efeitos ligados.');
      });
    }

    /* dados */
    const exportBtn = document.getElementById('data-export');
    const importInput = document.getElementById('data-import');
    const clearBtn = document.getElementById('data-clear');

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const api = window.LuminLibrary;
        if (api && api.exportData) api.exportData();
      });
    }

    if (importInput) {
      importInput.addEventListener('change', () => {
        const api = window.LuminLibrary;
        const file = importInput.files && importInput.files[0];
        if (api && api.importData && file) api.importData(file).then(() => syncDataStats());
        importInput.value = '';
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const api = window.LuminLibrary;
        if (!api) return;
        const confirmed = window.confirm('Apagar favoritos, histórico e cores por jogo deste navegador?');
        if (!confirmed) return;
        api.clearData();
        syncDataStats();
        if (api.toast) api.toast('Seus dados foram apagados.');
      });
    }

    /* o painel reflete o estado dos dados ao abrir */
    if (button) button.addEventListener('click', syncDataStats);
    window.addEventListener('lumin:theme', syncUI);
    syncUI();
    syncDataStats();
  }

  function syncDataStats() {
    const label = document.getElementById('data-stats');
    const api = window.LuminLibrary;
    if (!label || !api || !api.dataStats) return;
    const stats = api.dataStats();
    label.textContent =
      stats.favorites + ' favorito' + (stats.favorites === 1 ? '' : 's') +
      ' · ' + stats.recents + ' no histórico' +
      ' · ' + stats.colors + ' cor' + (stats.colors === 1 ? '' : 'es') + ' por jogo';
  }

  /* ---------- inicialização ---------- */
  function init() {
    const saved = read();
    if (saved) {
      const values = saved.settings && typeof saved.settings === 'object' ? saved.settings : saved;
      const picks = saved.options && typeof saved.options === 'object' ? saved.options : {};
      settings = Object.assign({}, DEFAULTS, values);
      options = Object.assign({}, OPTION_DEFAULTS, picks);
    } else {
      settings = autoSettings();
      options = Object.assign({}, OPTION_DEFAULTS);
    }
    apply();
    write();
    initUI();
    emit();

    /* se o usuário mexer no sistema, respeitamos */
    if (window.matchMedia) {
      const query = window.matchMedia('(prefers-reduced-motion: reduce)');
      const onChange = (event) => {
        if (!settings.auto) return;
        settings = Object.assign({}, autoSettings(), { auto: true });
        if (event.matches) settings.motion = false;
        apply();
        write();
        emit();
        syncUI();
      };
      if (query.addEventListener) query.addEventListener('change', onChange);
      else if (query.addListener) query.addListener(onChange);
    }
  }

  window.LuminSettings = {
    get: () => Object.assign({}, settings),
    options: () => Object.assign({}, options),
    set: set,
    setOption: setOption,
    setAll: setAll,
    reset: reset,
    open: openSettings,
    close: closeSettings,
    on: (fn) => {
      listeners.push(fn);
      return () => {
        const index = listeners.indexOf(fn);
        if (index >= 0) listeners.splice(index, 1);
      };
    },
    device: detectDevice,
    suggestion: buildSuggestion,
    syncDataStats: syncDataStats,
    sync: syncUI
  };

  /* aplica o mais cedo possível para evitar "flash" de efeitos */
  const initial = read();
  if (initial) {
    const values = initial.settings && typeof initial.settings === 'object' ? initial.settings : initial;
    settings = Object.assign({}, DEFAULTS, values);
    options = Object.assign({}, OPTION_DEFAULTS, initial.options || {});
  } else {
    settings = autoSettings();
  }
  apply();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
