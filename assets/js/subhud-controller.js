/* =========================================================================
   MINATO MAKOTO — PERSISTENT MINIMALIST SUB-HUD & VISUAL NOVEL CONTROLLER
   Features:
   - Single Persistent Sub-HUD (Always Visible, Fixed Expanded State)
   - Modern Platform Minimalist Chat Stream (No Redundant Metadata/Headers)
   - High-Legibility Typography & Smooth Visual Novel Text Streaming
   ========================================================================= */
(function (global) {
  'use strict';

  const { NODES } = global.PortfolioData;

  let chatRunId = 0;

  /**
   * Persistent Sub-HUD State Update:
   * Sub-HUD stays permanently visible in one fixed position; only internal
   * dialogue and prompt choices refresh smoothly.
   */
  function runSubHudTransition(commitCallback) {
    if (typeof commitCallback === 'function') {
      commitCallback();
    }
  }

  function appendChatMessage(type, text) {
    const streamEl = document.getElementById('chat-stream');
    if (!streamEl) return null;
    const wrap = document.createElement('div');
    wrap.className = `chat-msg is-${type}`;
    wrap.innerHTML = `<div class="chat-bubble">${text}</div>`;
    streamEl.appendChild(wrap);
    streamEl.scrollTop = streamEl.scrollHeight;
    return wrap.querySelector('.chat-bubble');
  }

  function streamWitnessBubble(text, runId, onDone) {
    const bubble = appendChatMessage('witness', '');
    if (!bubble) return;
    const textSpan = document.createElement('span');
    const caretSpan = document.createElement('span');
    caretSpan.className = 'vn-stream-caret';
    caretSpan.textContent = '▾';
    bubble.textContent = '';
    bubble.appendChild(textSpan);
    bubble.appendChild(caretSpan);

    const chars = Array.from(text);
    let idx = 0;
    let finished = false;
    let timerId = null;

    function finishImmediately() {
      if (finished) return;
      finished = true;
      if (timerId) clearTimeout(timerId);
      textSpan.textContent = text;
      const streamEl = document.getElementById('chat-stream');
      if (streamEl) streamEl.scrollTop = streamEl.scrollHeight;
      if (onDone) onDone();
    }

    bubble.addEventListener('click', finishImmediately, { once: true });

    function stepChar() {
      if (finished || runId !== chatRunId) {
        return;
      }
      const ch = chars[idx] || '';
      const stepSize = (ch === '.' || ch === ',' || ch === '—' || ch === '!' || ch === ':') ? 1 : 2;
      idx = Math.min(chars.length, idx + stepSize);
      textSpan.textContent = chars.slice(0, idx).join('');

      const streamEl = document.getElementById('chat-stream');
      if (streamEl) streamEl.scrollTop = streamEl.scrollHeight;

      if (idx >= chars.length) {
        finishImmediately();
        return;
      }

      const lastChar = chars[idx - 1];
      let delay = 26;
      if (lastChar === '.' || lastChar === '!' || lastChar === '—') delay = 140;
      else if (lastChar === ',' || lastChar === ';' || lastChar === ':') delay = 75;

      timerId = setTimeout(stepChar, delay);
    }

    timerId = setTimeout(stepChar, 20);
  }

  function renderChoiceButtons(choices) {
    const promptsEl = document.getElementById('chat-prompts');
    if (!promptsEl) return;
    promptsEl.innerHTML = '';

    choices.forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'prompt-chip';
      const idxStr = String(i + 1).padStart(2, '0');
      btn.innerHTML = `<span class="prompt-chip-idx">${idxStr}</span><span class="prompt-chip-label">${choice.label}</span>`;
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        choice.action();
      });
      promptsEl.appendChild(btn);
    });
  }

  function populateOverviewContent(actions) {
    const runId = ++chatRunId;
    const titleEl = document.getElementById('chat-channel-title');
    if (titleEl) titleEl.textContent = 'Witness π.3.14';

    const actionBtn = document.getElementById('chat-action-btn');
    if (actionBtn) actionBtn.style.display = 'none';

    const streamEl = document.getElementById('chat-stream');
    if (streamEl) streamEl.innerHTML = '';

    streamWitnessBubble(
      'Chào người lạ. Em là Witness π.3.14 — người dẫn đường trong không gian 13 Node tác phẩm của Minato-sama (Lương Bảo Huy). Hãy lăn chuột xuống để đi vào trạm đầu tiên, hoặc chọn một nhánh hội thoại bên dưới.',
      runId
    );

    renderChoiceButtons([
      { label: 'Profile & Timeline', action: () => actions.onSelectNode(0) },
      { label: 'Harmony 2025', action: () => actions.onSelectNode(1) },
      { label: 'BLACKA MV & VFX', action: () => actions.onSelectNode(3) },
      { label: 'VIB & Brand Works', action: () => actions.onSelectNode(4) }
    ]);
  }

  function populateNodeContent(idx, playingNodeIndex, actions) {
    const node = NODES[idx];
    const runId = ++chatRunId;

    const titleEl = document.getElementById('chat-channel-title');
    if (titleEl) titleEl.textContent = 'Witness π.3.14';

    const actionBtn = document.getElementById('chat-action-btn');
    if (actionBtn) {
      actionBtn.style.display = 'inline-flex';
      if (node.mediaType === 'sheet') {
        actionBtn.textContent = playingNodeIndex === idx ? 'Close Dossier ■' : 'Open Dossier ↗';
      } else {
        actionBtn.textContent = playingNodeIndex === idx ? 'Stop Video ■' : '▶ Play Video';
      }
    }

    const streamEl = document.getElementById('chat-stream');
    if (streamEl) streamEl.innerHTML = '';

    streamWitnessBubble(node.greeting, runId);

    renderChoiceButtons([
      {
        label: 'Role & Scope',
        action: () => {
          appendChatMessage('user', 'Role & Scope?');
          streamWitnessBubble(node.roleDetail, chatRunId);
        }
      },
      {
        label: 'Post & Craft',
        action: () => {
          appendChatMessage('user', 'Post-Production & Craft?');
          streamWitnessBubble(node.techDetail, chatRunId);
        }
      },
      {
        label: node.mediaType === 'sheet' ? 'Open Dossier ↗' : '▶ Play Video',
        action: () => actions.onTriggerPrimary(idx)
      },
      {
        label: 'Contact & Booking',
        action: () => {
          appendChatMessage('user', 'Direct Contact & Booking?');
          streamWitnessBubble(
            'Liên hệ trực tiếp Lương Bảo Huy (Minato Makoto) qua Email: minatokiva@gmail.com hoặc Số điện thoại / Zalo: 0704 5555 27.',
            chatRunId
          );
        }
      }
    ]);
  }

  global.SubHudController = {
    runSubHudTransition,
    populateOverviewContent,
    populateNodeContent
  };
})(window);
