/* =========================================================================
   MINATO MAKOTO — PERSISTENT WITNESS SUB-HUD & DIALOGUE CONTROLLER
   ========================================================================= */
(function (global) {
  'use strict';

  const { AUTHOR, WITNESS, getNodeById, splitGraphemes, escapeHtml } = global.PortfolioData;

  let chatRunId = 0;

  function getDialogueKaomoji(slotKey, nodeId) {
    const exprs = WITNESS && WITNESS.dialogueExpressions;
    if (!exprs) return '';
    if (nodeId) {
      const nodeMap = exprs.byNodeId && exprs.byNodeId[nodeId];
      return (nodeMap && typeof nodeMap[slotKey] === 'string') ? nodeMap[slotKey] : '';
    }
    return typeof exprs[slotKey] === 'string' ? exprs[slotKey] : '';
  }

  function getMediaLabel(node, isOpen) {
    if (!node) return '';
    if (node.mediaType === 'sheet') {
      return isOpen ? 'Đóng hồ sơ' : 'Mở hồ sơ';
    }
    return isOpen ? 'Đóng video' : 'Xem video';
  }

  function syncMediaButtons(node, isOpen) {
    const headerBtn = document.getElementById('chat-action-btn');
    const promptBtn = document.querySelector('#chat-prompts [data-choice-role="media"]');

    if (!node) {
      if (headerBtn) {
        headerBtn.style.display = 'none';
        headerBtn.setAttribute('aria-pressed', 'false');
        headerBtn.classList.remove('is-active-media');
      }
      return;
    }

    const label = getMediaLabel(node, Boolean(isOpen));
    const pressed = Boolean(isOpen) ? 'true' : 'false';

    if (headerBtn) {
      headerBtn.style.display = 'inline-flex';
      headerBtn.textContent = label;
      headerBtn.setAttribute('aria-pressed', pressed);
      headerBtn.classList.toggle('is-active-media', Boolean(isOpen));
    }

    if (promptBtn) {
      const labelEl = promptBtn.querySelector('.prompt-chip-label');
      if (labelEl) labelEl.textContent = label;
      promptBtn.setAttribute('aria-pressed', pressed);
      promptBtn.classList.toggle('is-active-media', Boolean(isOpen));
    }
  }

  function appendChatMessage(type, text) {
    const streamEl = document.getElementById('chat-stream');
    if (!streamEl) return null;
    const wrap = document.createElement('div');
    wrap.className = `chat-msg is-${type}`;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = text;
    wrap.appendChild(bubble);
    streamEl.appendChild(wrap);
    streamEl.scrollTop = streamEl.scrollHeight;
    return bubble;
  }

  function streamWitnessBubble(text, runId, options) {
    const opts = typeof options === 'function' ? { onDone: options } : (options || {});
    const extraLinks = opts.links || null;
    const kaomoji = typeof opts.kaomoji === 'string' ? opts.kaomoji.trim() : '';
    const onDone = opts.onDone;

    const bubble = appendChatMessage('witness', '');
    if (!bubble) return;

    const textSpan = document.createElement('span');
    const kaomojiSpan = kaomoji ? document.createElement('span') : null;
    if (kaomojiSpan) {
      kaomojiSpan.className = 'witness-kaomoji';
      kaomojiSpan.setAttribute('aria-hidden', 'true');
      kaomojiSpan.hidden = true;
    }
    const caretSpan = document.createElement('span');
    caretSpan.className = 'vn-stream-caret';
    caretSpan.textContent = '▾';
    bubble.textContent = '';
    bubble.appendChild(textSpan);
    if (kaomojiSpan) bubble.appendChild(kaomojiSpan);
    bubble.appendChild(caretSpan);

    if (Array.isArray(extraLinks) && extraLinks.length > 0) {
      const linksRow = document.createElement('div');
      linksRow.className = 'chat-contact-links';
      extraLinks.forEach((item) => {
        const a = document.createElement('a');
        a.className = 'chat-inline-link';
        a.href = item.href;
        a.textContent = item.label;
        a.addEventListener('click', (ev) => ev.stopPropagation());
        linksRow.appendChild(a);
      });
      bubble.appendChild(linksRow);
    }

    const graphemes = splitGraphemes(text);
    const fullText = graphemes.join('');
    let idx = 0;
    let finished = false;
    let timerId = null;

    function finishImmediately() {
      if (finished) return;
      finished = true;
      if (timerId) clearTimeout(timerId);
      textSpan.textContent = fullText;
      if (kaomojiSpan) {
        kaomojiSpan.textContent = kaomoji;
        kaomojiSpan.hidden = false;
      }
      caretSpan.style.display = 'none';
      const streamEl = document.getElementById('chat-stream');
      if (streamEl) streamEl.scrollTop = streamEl.scrollHeight;
      if (onDone) onDone();
    }

    bubble.addEventListener('click', (ev) => {
      if (ev.target && ev.target.closest('a')) return;
      finishImmediately();
    });

    function stepChar() {
      if (finished || runId !== chatRunId) {
        return;
      }
      const ch = graphemes[idx] || '';
      const stepSize = (ch === '.' || ch === ',' || ch === '—' || ch === '!' || ch === ':' || ch === '?') ? 1 : 2;
      idx = Math.min(graphemes.length, idx + stepSize);
      textSpan.textContent = graphemes.slice(0, idx).join('');

      const streamEl = document.getElementById('chat-stream');
      if (streamEl) streamEl.scrollTop = streamEl.scrollHeight;

      if (idx >= graphemes.length) {
        finishImmediately();
        return;
      }

      const lastChar = graphemes[idx - 1];
      let delay = 24;
      if (lastChar === '.' || lastChar === '!' || lastChar === '?' || lastChar === '—') delay = 135;
      else if (lastChar === ',' || lastChar === ';' || lastChar === ':') delay = 70;

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
      if (choice.role) btn.dataset.choiceRole = choice.role;
      if (choice.nodeId) btn.dataset.targetNodeId = choice.nodeId;
      const idxStr = String(i + 1).padStart(2, '0');
      btn.innerHTML = `<span class="prompt-chip-idx">${idxStr}</span><span class="prompt-chip-label">${escapeHtml(choice.label)}</span>`;
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
    if (titleEl) titleEl.textContent = WITNESS.channelTitle;

    syncMediaButtons(null, false);

    const streamEl = document.getElementById('chat-stream');
    if (streamEl) streamEl.innerHTML = '';

    streamWitnessBubble(WITNESS.overviewGreeting, runId, {
      kaomoji: getDialogueKaomoji('overview')
    });

    const choices = (WITNESS.overviewChoices || []).map((choice) => ({
      label: choice.label,
      nodeId: choice.nodeId,
      action: () => actions.onSelectNodeById(choice.nodeId)
    }));

    renderChoiceButtons(choices);
  }

  function populateNodeContent(nodeId, playingNodeId, actions) {
    const node = getNodeById(nodeId);
    if (!node) return;

    const runId = ++chatRunId;
    const isOpen = playingNodeId === node.id;

    const titleEl = document.getElementById('chat-channel-title');
    if (titleEl) titleEl.textContent = WITNESS.channelTitle;

    const streamEl = document.getElementById('chat-stream');
    if (streamEl) streamEl.innerHTML = '';

    streamWitnessBubble(node.greeting, runId, {
      kaomoji: getDialogueKaomoji('greeting', node.id)
    });

    renderChoiceButtons([
      {
        label: 'Vai trò của Huy',
        action: () => {
          appendChatMessage('user', 'Huy đảm nhận phần nào trong dự án này?');
          streamWitnessBubble(node.roleDetail, chatRunId, {
            kaomoji: getDialogueKaomoji('roleDetail', node.id)
          });
        }
      },
      {
        label: 'Quy trình & Hậu kỳ',
        action: () => {
          appendChatMessage('user', 'Quá trình sản xuất và hậu kỳ có gì đáng chú ý?');
          streamWitnessBubble(node.techDetail, chatRunId, {
            kaomoji: getDialogueKaomoji('techDetail', node.id)
          });
        }
      },
      {
        label: getMediaLabel(node, isOpen),
        role: 'media',
        action: () => actions.onTriggerPrimaryById(node.id)
      },
      {
        label: 'Liên hệ hợp tác',
        action: () => {
          appendChatMessage('user', 'Mình muốn liên hệ làm việc với Huy.');
          streamWitnessBubble(
            WITNESS.contactPromptReply,
            chatRunId,
            {
              kaomoji: getDialogueKaomoji('contact'),
              links: [
                {
                  href: `mailto:${AUTHOR.email}`,
                  label: 'Gửi email'
                },
                {
                  href: `tel:${AUTHOR.phoneE164}`,
                  label: 'Gọi điện'
                }
              ]
            }
          );
        }
      }
    ]);

    syncMediaButtons(node, isOpen);
  }

  global.SubHudController = {
    populateOverviewContent,
    populateNodeContent,
    syncMediaButtons,
    getMediaLabel
  };
})(window);
