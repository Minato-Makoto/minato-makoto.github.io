/* =========================================================================
   MINATO MAKOTO — MULTI-PRESET FUI TEXT ANIMATION ENGINE (window.TextFX)
   Presets: data-text-fx="cipher | telemetry | stagger | typewriter"
   ========================================================================= */
(function (global) {
  'use strict';

  const GLYPHS = '01▪▫◊∷∆+─═/';
  const activeTimers = new WeakMap();

  function getGraphemes(text) {
    if (global.PortfolioData && typeof global.PortfolioData.splitGraphemes === 'function') {
      return global.PortfolioData.splitGraphemes(text);
    }
    return Array.from(String(text == null ? '' : text).normalize('NFC'));
  }

  function escapeToken(str) {
    return String(str).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[ch]));
  }

  function clearElTimer(el) {
    const prev = activeTimers.get(el);
    if (!prev) return;
    if (Array.isArray(prev)) {
      prev.forEach((id) => clearTimeout(id));
    } else {
      cancelAnimationFrame(prev);
    }
    activeTimers.delete(el);
  }

  function resolveRaw(el, overrideText) {
    const source = typeof overrideText === 'string'
      ? overrideText
      : (el.dataset.fxRaw || el.textContent);
    const raw = String(source == null ? '' : source).normalize('NFC');
    el.dataset.fxRaw = raw;
    return raw;
  }

  // Preset 1: Optical Cipher Wave (grapheme-safe for Vietnamese combining/precomposed accents)
  function runCipher(el, opts = {}) {
    clearElTimer(el);
    const duration = typeof opts === 'number' ? opts : (opts.duration || 540);
    const raw = resolveRaw(el, typeof opts === 'object' ? opts.text : undefined);
    const chars = getGraphemes(raw);
    const len = chars.length;
    const start = performance.now();

    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const lockCount = Math.floor(eased * len);
      const frontierEnd = Math.min(len, lockCount + 3);

      let out = '';
      for (let i = 0; i < len; i++) {
        const ch = chars[i];
        if (ch === ' ' || i < lockCount) {
          out += ch;
        } else if (i < frontierEnd) {
          out += GLYPHS[(i + Math.floor(now / 92)) % GLYPHS.length];
        } else {
          out += i % 3 === 0 ? '·' : ' ';
        }
      }
      el.textContent = out;

      if (t < 1) {
        activeTimers.set(el, requestAnimationFrame(step));
      } else {
        el.textContent = raw;
        activeTimers.delete(el);
      }
    }
    activeTimers.set(el, requestAnimationFrame(step));
  }

  // Preset 2: Telemetry Numeric Interpolator
  function runTelemetry(el, opts = {}) {
    clearElTimer(el);
    const duration = typeof opts === 'number' ? opts : (opts.duration || 480);
    const raw = resolveRaw(el, typeof opts === 'object' ? opts.text : undefined);
    const start = performance.now();
    let lastTick = 0;

    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      if (t < 1) {
        if (now - lastTick >= 65) {
          lastTick = now;
          el.textContent = raw.replace(/\d+/g, (match) => {
            const targetNum = parseInt(match, 10);
            if (Number.isNaN(targetNum)) return match;
            const cur = Math.round(targetNum * eased + (1 - eased) * ((targetNum + 24) % 90));
            return String(cur).padStart(match.length, '0');
          });
        }
        activeTimers.set(el, requestAnimationFrame(step));
      } else {
        el.textContent = raw;
        activeTimers.delete(el);
      }
    }
    activeTimers.set(el, requestAnimationFrame(step));
  }

  // Preset 3: Staggered Word / Token Mask Slide-Up
  function runStagger(el, opts = {}) {
    clearElTimer(el);
    const raw = resolveRaw(el, typeof opts === 'object' ? opts.text : undefined);
    const tokens = raw.split(/(\s+)/);
    el.innerHTML = tokens
      .map((tok) => {
        if (/^\s+$/.test(tok)) return tok;
        return `<span class="fx-stagger-token">${escapeToken(tok)}</span>`;
      })
      .join('');

    const spans = el.querySelectorAll('.fx-stagger-token');
    const stepMs = spans.length > 1 ? Math.min(24, Math.floor(150 / (spans.length - 1))) : 0;
    const timers = [];
    const outerId = setTimeout(() => {
      spans.forEach((sp, idx) => {
        timers.push(setTimeout(() => sp.classList.add('is-revealed'), idx * stepMs));
      });
    }, 16);
    timers.push(outerId);
    activeTimers.set(el, timers);
  }

  // Preset 4: Tactical Bracket Typewriter (grapheme-safe for Vietnamese accents)
  function runTypewriter(el, opts = {}) {
    clearElTimer(el);
    const duration = typeof opts === 'number' ? opts : (opts.duration || 460);
    const raw = resolveRaw(el, typeof opts === 'object' ? opts.text : undefined);
    const chars = getGraphemes(raw);
    const len = chars.length;
    if (len === 0) {
      el.textContent = '';
      return;
    }
    const start = performance.now();

    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 2.2);
      const count = Math.max(1, Math.floor(eased * len));
      if (t < 1) {
        el.textContent = chars.slice(0, count).join('');
        const caret = document.createElement('span');
        caret.className = 'fx-type-caret';
        caret.textContent = '▍';
        el.appendChild(caret);
        activeTimers.set(el, requestAnimationFrame(step));
      } else {
        el.textContent = raw;
        activeTimers.delete(el);
      }
    }
    activeTimers.set(el, requestAnimationFrame(step));
  }

  function run(el, mode, opts) {
    if (!el) return;
    const fxMode = mode || el.dataset.textFx || 'cipher';
    if (fxMode === 'telemetry') runTelemetry(el, opts);
    else if (fxMode === 'stagger') runStagger(el, opts);
    else if (fxMode === 'typewriter') runTypewriter(el, opts);
    else runCipher(el, opts);
  }

  function cancel(el, restoreText) {
    if (!el) return;
    clearElTimer(el);
    if (typeof restoreText === 'string') {
      const normalized = restoreText.normalize('NFC');
      el.dataset.fxRaw = normalized;
      el.textContent = normalized;
    } else if (el.dataset.fxRaw) {
      el.textContent = el.dataset.fxRaw;
    }
  }

  function triggerWithin(container, opts = {}) {
    if (!container) return;
    const now = performance.now();
    const lastRun = Number(container.dataset.fxLastRun || 0);
    if (!opts.force && now - lastRun < 360) return;
    container.dataset.fxLastRun = String(now);
    container.querySelectorAll('[data-text-fx]').forEach((el) => run(el, el.dataset.textFx));
  }

  global.TextFX = { run, cancel, triggerWithin };
})(window);
