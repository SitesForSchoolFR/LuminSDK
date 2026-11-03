/* =========================================================
   LuminSDK — atmosfera e aparência
   · paleta de cores em tempo real (com persistência)
   · partículas de fundo na cor escolhida
   · fundo que segue o ponteiro (parallax suave)
   · cursor personalizado
   · sliders de colunas e linhas da grade

   Autor: Ryan Smith · Licença MIT
   ========================================================= */
(function () {
  'use strict';

  const THEME_KEY = 'luminsdk-theme';
  /* v2: o visual minimalista ignora a cor antiga (violeta) e recomeça no neutro */
  const COLOR_KEY = 'luminsdk-color-v2';
  const NEUTRAL = '#e7e7ea';
  const root = document.documentElement;
  const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  /* Antes exigíamos "(hover: hover) and (pointer: fine)": notebooks com tela
     sensível ao toque, alguns drivers e o navegador do Xbox respondem "false"
     e ficavam sem pontos que seguem o mouse e sem cursor próprio.
     Agora só ficamos de fora quando o aparelho é claramente só toque. */
  const finePointer = (function () {
    if (!window.matchMedia) return true;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const noHover = window.matchMedia('(hover: none)').matches;
    const anyFine = window.matchMedia('(pointer: fine)').matches || window.matchMedia('(any-pointer: fine)').matches;
    if (anyFine) return true;
    return !(coarse && noHover);
  })();

  const PRESETS = [
    { name: 'Grafite', hex: '#e7e7ea' },
    { name: 'Violeta', hex: '#8b5cf6' },
    { name: 'Índigo', hex: '#6366f1' },
    { name: 'Azul', hex: '#3b82f6' },
    { name: 'Ciano', hex: '#06b6d4' },
    { name: 'Turquesa', hex: '#14b8a6' },
    { name: 'Esmeralda', hex: '#10b981' },
    { name: 'Limão', hex: '#84cc16' },
    { name: 'Âmbar', hex: '#f59e0b' },
    { name: 'Laranja', hex: '#f97316' },
    { name: 'Vermelho', hex: '#ef4444' },
    { name: 'Rosa', hex: '#ec4899' },
    { name: 'Magenta', hex: '#d946ef' },
    /* Y2K: o azul cromado, o aqua de interface e o rosa bubblegum */
    { name: 'Y2K Cromado', hex: '#5b7ea6' },
    { name: 'Y2K Cyber', hex: '#6d5efc' },
    { name: 'Y2K Aqua', hex: '#0aa2c0' },
    { name: 'Y2K Bubblegum', hex: '#e0518f' }
  ];

  /* ---------- cor: conversões ---------- */
  function hexToRgb(hex) {
    let value = String(hex || '').replace('#', '').trim();
    if (value.length === 3) value = value.split('').map((c) => c + c).join('');
    if (!/^[0-9a-f]{6}$/i.test(value)) return { r: 231, g: 231, b: 234 };
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16)
    };
  }

  function rgbToHex(r, g, b) {
    const to = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return '#' + to(r) + to(g) + to(b);
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function hslToHex(h, s, l) {
    const hh = (((h % 360) + 360) % 360) / 360;
    const ss = Math.max(0, Math.min(100, s)) / 100;
    const ll = Math.max(0, Math.min(100, l)) / 100;

    if (ss === 0) {
      const v = Math.round(ll * 255);
      return rgbToHex(v, v, v);
    }

    const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
    const p = 2 * ll - q;
    const channel = (t) => {
      let tt = t;
      if (tt < 0) tt += 1;
      if (tt > 1) tt -= 1;
      if (tt < 1 / 6) return p + (q - p) * 6 * tt;
      if (tt < 1 / 2) return q;
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
      return p;
    };
    return rgbToHex(channel(hh + 1 / 3) * 255, channel(hh) * 255, channel(hh - 1 / 3) * 255);
  }

  /* ---------- aplicação da paleta ---------- */
  const palette = {
    hex: NEUTRAL,
    rgb: { r: 231, g: 231, b: 234 },
    hsl: { h: 240, s: 4, l: 91 }
  };

  function setToken(name, value) {
    root.style.setProperty(name, value);
  }

  /* Tema Astolfo ligado: a paleta é do personagem. O seletor de cores
     continua salvo e volta a valer quando o tema é desligado. */
  const ASTOLFO_HEX = '#ff8fc4';

  function applyPalette(hex, options) {
    if (root.getAttribute('data-skin') === 'astolfo') {
      hex = ASTOLFO_HEX;
      options = { persist: false };     /* não sobrescreve a cor escolhida */
    }
    const isLight = root.getAttribute('data-theme') === 'light';
    const base = hexToRgb(hex);
    const hsl = rgbToHsl(base.r, base.g, base.b);

    palette.hex = rgbToHex(base.r, base.g, base.b);
    palette.rgb = base;
    palette.hsl = hsl;

    /* No tema claro o destaque precisa ser mais escuro para manter contraste */
    /* no escuro mantém a cor escolhida (só clareia o mínimo para contraste);
       no claro escurece para o destaque continuar legível */
    /* Minimalista: um matiz só. Em vez de girar a roda de cores (+18/+140/+80),
       os tons saem do mesmo matiz variando só a luminosidade — assim qualquer
       cor escolhida continua discreta. Cor neutra (saturação baixa) fica cinza. */
    const neutral = (hsl.s || 0) < 8;
    const hue = neutral ? 240 : hsl.h;
    const sat = neutral ? 0 : Math.min(88, Math.max(18, hsl.s));
    /* neutro: quase branco no escuro, quase preto no claro — é o que dá o
       ar minimalista e mantém o contraste do texto em cima do botão */
    const accentL = neutral
      ? (isLight ? 20 : 92)
      : (isLight ? Math.max(28, Math.min(50, hsl.l - 14)) : Math.min(90, Math.max(46, hsl.l)));

    const accent = hslToHex(hue, sat, accentL);
    const accentRgb = hexToRgb(accent);
    const soft = hslToHex(hue, sat, Math.max(6, accentL - 7));
    const softRgb = hexToRgb(soft);
    const alt = hslToHex(hue, sat, Math.min(96, accentL + 7));
    const altRgb = hexToRgb(alt);
    const pop = hslToHex(hue, sat, Math.max(4, accentL - 13));
    const popRgb = hexToRgb(pop);
    const strong = hslToHex(hue, sat, Math.max(3, accentL - 20));

    setToken('--accent', accent);
    setToken('--accent-rgb', accentRgb.r + ', ' + accentRgb.g + ', ' + accentRgb.b);
    setToken('--accent-soft', soft);
    setToken('--accent-soft-rgb', softRgb.r + ', ' + softRgb.g + ', ' + softRgb.b);
    setToken('--accent-alt', alt);
    setToken('--accent-alt-rgb', altRgb.r + ', ' + altRgb.g + ', ' + altRgb.b);
    setToken('--accent-pop', pop);
    setToken('--accent-pop-rgb', popRgb.r + ', ' + popRgb.g + ', ' + popRgb.b);
    setToken('--accent-strong', strong);
    setToken('--glow', 'rgba(' + accentRgb.r + ', ' + accentRgb.g + ', ' + accentRgb.b + ', ' + (isLight ? 0.08 : 0.12) + ')');
    /* texto em cima do destaque: escuro quando o destaque é claro */
    setToken('--accent-contrast', accentL > 62 ? '#0b0b0d' : '#ffffff');

    /* mantém os apelidos antigos funcionando */
    setToken('--violet', accent);
    setToken('--indigo', soft);
    setToken('--cyan', alt);
    setToken('--pink', pop);

    if (!options || options.persist !== false) {
      try {
        localStorage.setItem(COLOR_KEY, palette.hex);
      } catch (error) {
        /* sem armazenamento: aplica só nesta sessão */
      }
    }

    if (window.LuminAtmosphere && typeof window.LuminAtmosphere.recolor === 'function') {
      window.LuminAtmosphere.recolor();
    }

    return palette;
  }

  function loadSavedColor() {
    try {
      return localStorage.getItem(COLOR_KEY);
    } catch (error) {
      return null;
    }
  }

  /* ---------- UI da paleta ---------- */
  function initPaletteUI() {
    const toggle = document.getElementById('palette-toggle');
    const panel = document.getElementById('palette-panel');
    const swatches = document.getElementById('palette-swatches');
    const customColor = document.getElementById('palette-color');
    const hue = document.getElementById('palette-hue');
    const reset = document.getElementById('palette-reset');
    const close = document.getElementById('palette-close');

    if (!toggle || !panel || !swatches) return;

    PRESETS.forEach((preset) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'swatch';
      button.dataset.hex = preset.hex;
      button.style.background = preset.hex;
      button.style.color = preset.hex;
      button.setAttribute('aria-label', 'Usar a cor ' + preset.name);
      button.setAttribute('aria-pressed', 'false');
      button.title = preset.name;
      button.addEventListener('click', () => {
        applyPalette(preset.hex);
        syncSwatches();
        if (customColor) customColor.value = palette.hex;
        if (hue) hue.value = String(palette.hsl.h);
      });
      swatches.append(button);
    });

    function syncSwatches() {
      swatches.querySelectorAll('.swatch').forEach((swatch) => {
        const active = swatch.dataset.hex.toLowerCase() === palette.hex.toLowerCase();
        swatch.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }

    function openPanel(open) {
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      const dot = document.getElementById('palette-dot');
      if (dot) dot.style.filter = open ? 'brightness(1.25)' : '';
    }

    toggle.addEventListener('click', () => openPanel(panel.hidden));

    if (close) close.addEventListener('click', () => {
      openPanel(false);
      toggle.focus({ preventScroll: true });
    });

    document.addEventListener('click', (event) => {
      if (panel.hidden) return;
      if (panel.contains(event.target) || toggle.contains(event.target)) return;
      openPanel(false);
    });

    if (customColor) {
      customColor.addEventListener('input', () => {
        applyPalette(customColor.value);
        syncSwatches();
        if (hue) hue.value = String(palette.hsl.h);
      });
    }

    if (hue) {
      hue.addEventListener('input', () => {
        const next = hslToHex(Number(hue.value), 82, 62);
        applyPalette(next);
        syncSwatches();
        if (customColor) customColor.value = palette.hex;
      });
    }

    if (reset) {
      reset.addEventListener('click', () => {
        applyPalette('#8b5cf6');
        syncSwatches();
        if (customColor) customColor.value = '#8b5cf6';
        if (hue) hue.value = '262';
        if (window.LuminLibrary) window.LuminLibrary.toast('Cor padrão restaurada.');
      });
    }

    if (customColor) customColor.value = palette.hex;
    if (hue) hue.value = String(palette.hsl.h);
    syncSwatches();

    /* o index também pode disparar a troca de tema */
    window.addEventListener('lumin:theme', () => {
      applyPalette(palette.hex, { persist: false });
    });
  }

  /* ---------- sliders da grade ---------- */
  function initGridUI() {
    const cols = document.getElementById('grid-cols');
    const rows = document.getElementById('grid-rows');
    const colsValue = document.getElementById('grid-cols-value');
    const rowsValue = document.getElementById('grid-rows-value');
    const reset = document.getElementById('grid-reset');
    const library = window.LuminLibrary;

    if (!cols || !rows || !library || typeof library.getGrid !== 'function') return;

    const limits = typeof library.gridDefaults === 'function'
      ? library.gridDefaults()
      : { minCols: 2, maxCols: 12, minRows: 2, maxRows: 8 };

    cols.min = String(limits.minCols);
    cols.max = String(limits.maxCols);
    rows.min = String(limits.minRows);
    rows.max = String(limits.maxRows);

    let commitTimer = null;

    function paintFill(input) {
      const min = Number(input.min);
      const max = Number(input.max);
      const value = Number(input.value);
      const percent = ((value - min) / Math.max(1, max - min)) * 100;
      input.style.setProperty('--fill', percent.toFixed(1) + '%');
    }

    function syncFromLibrary() {
      const grid = library.getGrid();
      cols.value = String(grid.cols);
      rows.value = String(grid.rows);
      if (colsValue) colsValue.textContent = String(grid.cols);
      if (rowsValue) rowsValue.textContent = String(grid.rows);
      cols.setAttribute('aria-valuetext', grid.cols + ' colunas');
      rows.setAttribute('aria-valuetext', grid.rows + ' linhas');
      paintFill(cols);
      paintFill(rows);
      if (reset) {
        reset.classList.toggle('is-active', grid.auto);
        reset.textContent = grid.auto ? 'Auto' : 'Automático';
        reset.title = grid.auto
          ? 'A grade está no tamanho automático'
          : 'Voltar ao tamanho automático';
      }
    }

    function commit() {
      clearTimeout(commitTimer);
      commitTimer = setTimeout(() => {
        library.setGrid(Number(cols.value), Number(rows.value));
      }, 420);
    }

    function onInput() {
      if (colsValue) colsValue.textContent = cols.value;
      if (rowsValue) rowsValue.textContent = rows.value;
      cols.setAttribute('aria-valuetext', cols.value + ' colunas');
      rows.setAttribute('aria-valuetext', rows.value + ' linhas');
      paintFill(cols);
      paintFill(rows);
      library.previewGrid(Number(cols.value), Number(rows.value));
      commit();
    }

    cols.addEventListener('input', onInput);
    rows.addEventListener('input', onInput);

    /* botões de tamanho (P/M/G) */
    const sizeButtons = [...document.querySelectorAll('.size-btn')];
    const sizeWrap = sizeButtons.length ? sizeButtons[0].parentElement : null;

    function syncSizes() {
      if (!sizeButtons.length) return;
      const grid = library.getGrid();
      const current = grid.manual ? null : (grid.size || null);
      sizeButtons.forEach((button) => {
        const active = button.dataset.size === current;
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      if (sizeWrap) {
        sizeWrap.title = grid.manual
          ? 'Colunas definidas manualmente — escolha um tamanho para voltar às colunas automáticas'
          : '';
        sizeWrap.classList.toggle('is-overridden', !!grid.manual);
      }
    }

    if (sizeButtons.length) {
      sizeButtons.forEach((button) => {
        button.addEventListener('click', () => {
          if (typeof library.setCardSize !== 'function') return;
          library.setCardSize(button.dataset.size);
          syncSizes();
          /* mantém os sliders coerentes com o novo número de colunas */
          window.setTimeout(syncFromLibrary, 60);
        });
      });
    }

    window.addEventListener('lumin:grid', () => {
      syncFromLibrary();
      syncSizes();
    });

    if (reset) {
      reset.addEventListener('click', () => {
        library.setGrid(null, null);
        syncFromLibrary();
      });
    }

    syncFromLibrary();
    syncSizes();
  }

  /* ---------- atmosfera: partículas, parallax e cursor ---------- */
  function createAtmosphere() {
    const holder = document.querySelector('.bg-fx');
    if (!holder) return null;

    let canvas = holder.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'bg-fx__canvas';
      canvas.setAttribute('aria-hidden', 'true');
      holder.append(canvas);
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return null;

    const pointer = { x: 0, y: 0, tx: 0, ty: 0, active: false };
    const blobs = [...holder.querySelectorAll('.bg-fx__blob')];

    let particles = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let running = false;
    let lastDraw = 0;
    let quality = 1;                 // 1 = completo, .5 = metade, .3 = mínimo
    let colors = { main: '139, 92, 246', alt: '34, 211, 238', pop: '244, 114, 182' };
    let glowGradient = null;
    let glowAt = { x: -999, y: -999 };

    const MAX_PARTICLES = 118;
    const MIN_PARTICLES = 28;
    const FRAME_BUDGET = 26;          // ms — acima disso, reduz a qualidade
    const CONNECT_DIST = 104;
    const CONNECT_DIST2 = CONNECT_DIST * CONNECT_DIST;

    function feature(name, fallback) {
      const api = window.LuminSettings;
      if (!api || typeof api.get !== 'function') return fallback;
      const current = api.get();
      return current[name] !== false;
    }

    function refreshColors() {
      const styles = getComputedStyle(root);
      colors = {
        main: styles.getPropertyValue('--accent-rgb').trim() || '139, 92, 246',
        alt: styles.getPropertyValue('--accent-alt-rgb').trim() || '34, 211, 238',
        pop: styles.getPropertyValue('--accent-pop-rgb').trim() || '244, 114, 182'
      };
      glowGradient = null;
    }

    function particleCount() {
      const base = (width * height) / 21000;
      const target = Math.round(base * quality);
      return Math.max(MIN_PARTICLES, Math.min(MAX_PARTICLES, target));
    }

    function resize() {
      const rect = holder.getBoundingClientRect();
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      width = Math.max(320, rect.width);
      height = Math.max(320, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      glowGradient = null;
      seedParticles();
      if (!running) draw();
    }

    function seedParticles() {
      const count = particleCount();
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.26,
        vy: (Math.random() - 0.5) * 0.26,
        r: 1.1 + Math.random() * 1.9,
        tw: Math.random() * Math.PI * 2,
        alt: Math.random() > 0.72,
        pop: Math.random() > 0.86,
        sparkle: Math.random() > 0.85
      }));
    }

    function drawPointerGlow() {
      if (!pointer.active || !feature('parallax', true)) return;

      if (!glowGradient || Math.abs(pointer.x - glowAt.x) > 30 || Math.abs(pointer.y - glowAt.y) > 30) {
        glowGradient = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 340);
        glowGradient.addColorStop(0, 'rgba(' + colors.main + ', .38)');
        glowGradient.addColorStop(0.3, 'rgba(' + colors.pop + ', .18)');
        glowGradient.addColorStop(0.62, 'rgba(' + colors.alt + ', .1)');
        glowGradient.addColorStop(1, 'rgba(' + colors.main + ', 0)');
        glowAt = { x: pointer.x, y: pointer.y };
      }

      ctx.fillStyle = glowGradient;
      ctx.fillRect(pointer.x - 340, pointer.y - 340, 680, 680);
    }

    function drawConnections() {
      /* grade espacial: evita comparar todos com todos */
      const cell = CONNECT_DIST;
      const cols = Math.ceil(width / cell) + 1;
      const rows = Math.ceil(height / cell) + 1;
      const buckets = new Map();

      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        const key = (Math.floor(particle.x / cell)) + ':' + (Math.floor(particle.y / cell));
        let bucket = buckets.get(key);
        if (!bucket) {
          bucket = [];
          buckets.set(key, bucket);
        }
        bucket.push(i);
      }

      ctx.lineWidth = 0.8;
      ctx.strokeStyle = 'rgba(' + colors.main + ', .24)';
      ctx.beginPath();

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        const cx = Math.floor(a.x / cell);
        const cy = Math.floor(a.y / cell);

        for (let ox = 0; ox <= 1; ox++) {
          for (let oy = -1; oy <= 1; oy++) {
            if (ox === 0 && oy <= 0) continue;
            const bucket = buckets.get((cx + ox) + ':' + (cy + oy));
            if (!bucket) continue;

            for (let b = 0; b < bucket.length; b++) {
              const other = particles[bucket[b]];
              const dx = a.x - other.x;
              const dy = a.y - other.y;
              if (dx * dx + dy * dy > CONNECT_DIST2) continue;
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(other.x, other.y);
            }
          }
        }
      }
      ctx.stroke();
    }

    function draw() {
      if (!width || !height) return;

      ctx.clearRect(0, 0, width, height);
      if (!feature('particles', true)) return;

      drawPointerGlow();

      /* pontos: halo suave + núcleo brilhante, com leve cintilância */
      const clock = performance.now() / 1000;
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        const rgb = particle.pop ? colors.pop : particle.alt ? colors.alt : colors.main;
        const twinkle = 0.72 + Math.sin(clock * 1.6 + (particle.tw || 0)) * 0.28;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r * 3.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + rgb + ', ' + (0.1 * twinkle).toFixed(3) + ')';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + rgb + ', ' + (0.9 * twinkle).toFixed(3) + ')';
        ctx.fill();

        /* brilho em cruz nas maiores: o toque Y2K */
        if (particle.sparkle) {
          const arm = particle.r * (3.4 + twinkle * 1.6);
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(' + rgb + ', ' + (0.22 * twinkle).toFixed(3) + ')';
          ctx.lineWidth = 0.9;
          ctx.moveTo(particle.x - arm, particle.y);
          ctx.lineTo(particle.x + arm, particle.y);
          ctx.moveTo(particle.x, particle.y - arm);
          ctx.lineTo(particle.x, particle.y + arm);
          ctx.stroke();
        }
      }

      if (particles.length <= MAX_PARTICLES * quality) drawConnections();

      /* laços até o ponteiro */
      if (pointer.active && feature('parallax', true)) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(' + colors.alt + ', .42)';
        ctx.lineWidth = 0.9;
        for (let i = 0; i < particles.length; i++) {
          const particle = particles[i];
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          if (dx * dx + dy * dy > 220 * 220) continue;
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(pointer.x, pointer.y);
        }
        ctx.stroke();
      }
    }

    function step(now) {
      if (!running) return;

      /* limita a ~40 fps para poupar bateria */
      if (now - lastDraw < 24) {
        frame = requestAnimationFrame(step);
        return;
      }

      const elapsed = now - lastDraw;
      lastDraw = now;

      if (elapsed > FRAME_BUDGET && quality > 0.35) {
        quality = Math.max(0.3, quality - 0.15);
        seedParticles();
      } else if (elapsed < 15 && quality < 1) {
        quality = Math.min(1, quality + 0.02);
      }

      pointer.x += (pointer.tx - pointer.x) * 0.12;
      pointer.y += (pointer.ty - pointer.y) * 0.12;

      const repel = feature('parallax', true);

      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < -16) particle.x = width + 16;
        else if (particle.x > width + 16) particle.x = -16;
        if (particle.y < -16) particle.y = height + 16;
        else if (particle.y > height + 16) particle.y = -16;

        if (repel && pointer.active) {
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < 130 * 130 && dist2 > 0.01) {
            const dist = Math.sqrt(dist2);
            const force = (1 - dist / 130) * 0.5;
            particle.x += (dx / dist) * force;
            particle.y += (dy / dist) * force;
          }
        }
      }

      draw();
      frame = requestAnimationFrame(step);
    }

    function parallax() {
      if (!feature('parallax', true)) {
        canvas.style.transform = '';
        blobs.forEach((blob) => { blob.style.transform = ''; });
        return;
      }

      const nx = pointer.active ? pointer.tx / width - 0.5 : 0;
      const ny = pointer.active ? pointer.ty / height - 0.5 : 0;

      canvas.style.transform = 'translate3d(' + (nx * -22).toFixed(2) + 'px, ' + (ny * -16).toFixed(2) + 'px, 0)';

      for (let i = 0; i < blobs.length; i++) {
        const depth = i === 0 ? 40 : -30;
        blobs[i].style.transform =
          'translate3d(' + (nx * depth).toFixed(2) + 'px, ' + (ny * depth * 0.7).toFixed(2) + 'px, 0)';
      }
    }

    function start() {
      if (running) return;
      if (!feature('particles', true)) {
        draw();
        return;
      }
      running = true;
      lastDraw = 0;
      frame = requestAnimationFrame(step);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(frame);
    }

    /* com "reduzir movimento" ativo o site não anima sozinho, mas continua
       respondendo ao mouse: o brilho e os laços acompanham o ponteiro */
    let staticFrame = 0;
    function scheduleStaticDraw() {
      if (staticFrame) return;
      staticFrame = requestAnimationFrame(() => {
        staticFrame = 0;
        draw();
      });
    }

    function onPointerMove(event) {
      const rect = holder.getBoundingClientRect();
      pointer.tx = event.clientX - rect.left;
      pointer.ty = event.clientY - rect.top;
      pointer.active = true;

      if (reduceMotion) {
        scheduleStaticDraw();
        return;
      }

      if (parallaxFrame) return;
      parallaxFrame = requestAnimationFrame(() => {
        parallax();
        parallaxFrame = 0;
      });
    }

    let parallaxFrame = 0;

    window.addEventListener('resize', resize, { passive: true });

    window.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      onPointerMove(event);
    }, { passive: true });

    window.addEventListener('pointerleave', () => {
      pointer.active = false;
      if (!reduceMotion) parallax();
      else scheduleStaticDraw();
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else start();
    });

    /* com um jogo aberto a atmosfera sai de cena: o jogo fica com a CPU toda */
    const playing = () => root.classList.contains('is-playing');
    if (window.MutationObserver) {
      let wasPlaying = playing();
      new MutationObserver(() => {
        const nowPlaying = playing();
        if (nowPlaying === wasPlaying) return;
        wasPlaying = nowPlaying;
        if (nowPlaying) stop();
        else if (!document.hidden && feature('particles', true) && !reduceMotion) start();
      }).observe(root, { attributes: true, attributeFilter: ['class'] });
    }

    refreshColors();
    resize();

    if (reduceMotion) {
      draw();
    } else {
      start();
    }

    return {
      recolor: () => {
        refreshColors();
        draw();
      },
      refresh: () => {
        refreshColors();
        resize();
        if (feature('particles', true) && !document.hidden && !reduceMotion) start();
        else stop();
        parallax();
      },
      stop: stop
    };
  }

  /* ---------- cursor personalizado ---------- */
  function initCursor() {
    if (!finePointer) return null;

    const dot = document.createElement('div');
    const ring = document.createElement('div');
    dot.className = 'cursor-dot';
    dot.setAttribute('aria-hidden', 'true');
    ring.className = 'cursor-ring';
    ring.setAttribute('aria-hidden', 'true');
    document.body.append(dot, ring);

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { x: pos.x, y: pos.y };
    let looping = false;      // rAF ligado?
    let enabled = true;

    function feature() {
      const api = window.LuminSettings;
      if (api && typeof api.get === 'function') return api.get().cursor !== false;
      /* abas sem o painel carregado (Sites, Navegador, provedor) leem o
         que ficou salvo em vez de ligar o cursor contra a vontade */
      try {
        const raw = localStorage.getItem('luminsdk-settings');
        if (!raw) return true;
        const saved = JSON.parse(raw);
        if (!saved || !saved.settings) return true;
        return saved.settings.cursor !== false;
      } catch (error) {
        return true;
      }
    }

    /* um único frame de animação por vez; o laço morre quando o anel alcança
       o ponteiro (antes ficava girando a 60 fps para sempre) */
    function animate() {
      if (!enabled || document.hidden || root.classList.contains('is-playing')) {
        looping = false;
        return;
      }

      const easing = reduceMotion ? 1 : 0.18;
      const dx = pos.x - ringPos.x;
      const dy = pos.y - ringPos.y;

      if (Math.abs(dx) < 0.15 && Math.abs(dy) < 0.15) {
        ringPos.x = pos.x;
        ringPos.y = pos.y;
        ring.style.transform = 'translate3d(' + pos.x + 'px, ' + pos.y + 'px, 0)';
        looping = false;
        return;
      }

      ringPos.x += dx * easing;
      ringPos.y += dy * easing;
      ring.style.transform = 'translate3d(' + ringPos.x + 'px, ' + ringPos.y + 'px, 0)';
      requestAnimationFrame(animate);
    }

    function kick() {
      if (looping || reduceMotion) return;
      looping = true;
      requestAnimationFrame(animate);
    }

    function move(event) {
      pos.x = event.clientX;
      pos.y = event.clientY;

      if (!root.classList.contains('cursor-active')) {
        root.classList.add('cursor-active');
        ringPos.x = pos.x;
        ringPos.y = pos.y;
        ring.style.transform = 'translate3d(' + pos.x + 'px, ' + pos.y + 'px, 0)';
      }

      dot.style.transform = 'translate3d(' + pos.x + 'px, ' + pos.y + 'px, 0)';
      kick();
    }

    window.addEventListener('pointermove', move, { passive: true });

    window.addEventListener('pointerover', (event) => {
      const target = event.target;
      const interactive = target && target.closest
        ? target.closest('a, button, summary, [role="button"], input, select, .game-card, label')
        : null;
      root.classList.toggle('cursor-hover', !!interactive);
    }, { passive: true });

    window.addEventListener('pointerdown', () => root.classList.add('cursor-pressed'));
    window.addEventListener('pointerup', () => root.classList.remove('cursor-pressed'));

    document.addEventListener('pointerleave', () => {
      root.classList.remove('cursor-active', 'cursor-hover');
      looping = false;
    });

    function start() {
      enabled = feature() && finePointer;
      if (!enabled) {
        root.classList.remove('has-custom-cursor');
        looping = false;
        return;
      }
      root.classList.toggle('cursor-static', reduceMotion);
      root.classList.add('has-custom-cursor');
      if (root.classList.contains('cursor-active')) kick();
    }

    function stop() {
      enabled = false;
      looping = false;
      root.classList.remove('has-custom-cursor', 'cursor-static', 'cursor-hover', 'cursor-pressed', 'cursor-active');
    }

    start();

    return {
      start: start,
      stop: stop,
      pause: () => {
        looping = false;
        if (root.classList.contains('cursor-hover')) root.classList.remove('cursor-hover');
        if (root.classList.contains('cursor-pressed')) root.classList.remove('cursor-pressed');
      },
      refresh: () => {
        if (feature()) start();
        else stop();
      }
    };
  }

  /* ---------- inicialização ---------- */
  let started = false;

  function init() {
    if (started) return;
    started = true;

    const saved = loadSavedColor();
    const start = saved || NEUTRAL;
    palette.hsl = rgbToHsl(hexToRgb(start).r, hexToRgb(start).g, hexToRgb(start).b);
    applyPalette(start, { persist: false });

    window.LuminAtmosphere = createAtmosphere() || { recolor: function () {}, refresh: function () {}, stop: function () {} };

    /* API usada pelo painel de personalização */
    window.LuminPalette = {
      apply: function (hex) { return applyPalette(hex); },
      current: function () { return palette.hex; },
      presets: function () {
        return PRESETS.map(function (preset) { return { name: preset.name, hex: preset.hex }; });
      }
    };

    initPaletteUI();
    initGridUI();
    const cursor = initCursor();
    window.LuminCursor = cursor;

    /* mudanças no painel de configurações refletem na hora */
    const applySettings = () => {
      if (window.LuminAtmosphere && window.LuminAtmosphere.refresh) window.LuminAtmosphere.refresh();
      if (cursor && cursor.refresh) cursor.refresh();
    };

    /* o player abre/fecha; a atmosfera e o cursor acompanham sem gastar frames.
       Só reagimos à troca do estado de jogo — observar toda classe causaria laço. */
    if (window.MutationObserver) {
      let wasPlaying = root.classList.contains('is-playing');
      new MutationObserver(() => {
        const playing = root.classList.contains('is-playing');
        if (playing === wasPlaying) return;
        wasPlaying = playing;
        if (playing && cursor && cursor.pause) cursor.pause();
      }).observe(root, { attributes: true, attributeFilter: ['class'] });
    }
    window.addEventListener('lumin:settings', applySettings);

    /* ligar/desligar o tema Astolfo reaplica a paleta na hora */
    window.addEventListener('lumin:astolfo', function () {
      applyPalette(loadSavedColor() || NEUTRAL, { persist: false });
    });

    /* o botão de tema do site.js pede a reaplicação da paleta */
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      window.setTimeout(() => applyPalette(palette.hex, { persist: false }), 0);
    });

    /* armazenamento alterado em outra aba */
    window.addEventListener('storage', (event) => {
      if (event.key === THEME_KEY && event.newValue) {
        root.setAttribute('data-theme', event.newValue === 'light' ? 'light' : 'dark');
        applyPalette(palette.hex, { persist: false });
      }
      if (event.key === COLOR_KEY && event.newValue) {
        applyPalette(event.newValue, { persist: false });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
