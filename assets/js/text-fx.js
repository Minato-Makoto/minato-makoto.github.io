/* =========================================================================
   MINATO MAKOTO — MULTI-PRESET FUI TEXT ANIMATION ENGINE (window.TextFX)
   Presets: data-text-fx="cipher | telemetry | stagger | typewriter"
   ========================================================================= */
(function (global) {
  'use strict';

  const GLYPHS = '01▪▫◊∷∆+─═/';
  const activeTimers = new WeakMap();

  function clearElTimer(el) {
    const prev = activeTimers.get(el);
    if (prev) {
      cancelAnimationFrame(prev);
      clearTimeout(prev);
      activeTimers.delete(el);
    }
  }

  // Preset 1: Optical Cipher Wave
  function runCipher(el, duration = 880) {
    clearElTimer(el);
    const raw = el.dataset.fxRaw || el.textContent;
    el.dataset.fxRaw = raw;
    const chars = Array.from(raw);
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

  // Preset 2: Telemetry Numeric / Coordinate Interpolator
  function runTelemetry(el, duration = 840) {
    clearElTimer(el);
    const raw = el.dataset.fxRaw || el.textContent;
    el.dataset.fxRaw = raw;
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
  function runStagger(el) {
    clearElTimer(el);
    const raw = el.dataset.fxRaw || el.textContent;
    el.dataset.fxRaw = raw;
    const tokens = raw.split(/(\s+)/);
    el.innerHTML = tokens
      .map((tok) => {
        if (/^\s+$/.test(tok)) return tok;
        return `<span class="fx-stagger-token">${tok}</span>`;
      })
      .join('');

    const spans = el.querySelectorAll('.fx-stagger-token');
    const tid = setTimeout(() => {
      spans.forEach((sp, idx) => {
        setTimeout(() => sp.classList.add('is-revealed'), idx * 52);
      });
    }, 24);
    activeTimers.set(el, tid);
  }

  // Preset 4: Tactical Bracket Typewriter
  function runTypewriter(el, duration = 740) {
    clearElTimer(el);
    const raw = el.dataset.fxRaw || el.textContent;
    el.dataset.fxRaw = raw;
    const chars = Array.from(raw);
    const len = chars.length;
    const start = performance.now();

    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 2.4);
      const count = Math.max(1, Math.floor(eased * len));
      if (t < 1) {
        el.innerHTML = `${chars.slice(0, count).join('')}<span class="fx-type-caret">▍</span>`;
        activeTimers.set(el, requestAnimationFrame(step));
      } else {
        el.textContent = raw;
        activeTimers.delete(el);
      }
    }
    activeTimers.set(el, requestAnimationFrame(step));
  }

  function run(el, mode) {
    if (!el) return;
    const fxMode = mode || el.dataset.textFx || 'cipher';
    if (fxMode === 'telemetry') runTelemetry(el);
    else if (fxMode === 'stagger') runStagger(el);
    else if (fxMode === 'typewriter') runTypewriter(el);
    else runCipher(el);
  }

  function triggerWithin(container) {
    if (!container) return;
    const now = performance.now();
    const lastRun = Number(container.dataset.fxLastRun || 0);
    if (now - lastRun < 550) return;
    container.dataset.fxLastRun = String(now);
    container.querySelectorAll('[data-text-fx]').forEach((el) => run(el, el.dataset.textFx));
  }

  global.TextFX = { run, triggerWithin };
})(window);
