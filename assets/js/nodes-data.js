/* =========================================================================
   MINATO MAKOTO — CANONICAL 13-NODE SPATIAL ADAPTER & PRESENTATION HELPERS
   ========================================================================= */
(function (global) {
  'use strict';

  const CAM_STATION_DIST = 535;

  const NODE_STAGE_LAYOUT = {
    'genesis-node': {
      overviewPos: { x: -410, y: 420, z: 0, ry: 0.12 },
      journeyPos: { x: -120, y: -4, z: 0, ry: 0.08 },
      accent: '#ff4425'
    },
    'harmony-card': {
      overviewPos: { x: -125, y: 315, z: -10, ry: 0.09 },
      journeyPos: { x: -125, y: 4, z: -900, ry: 0.08 },
      accent: '#ff4425'
    },
    'daydream-card': {
      overviewPos: { x: 160, y: 315, z: -15, ry: 0.06 },
      journeyPos: { x: -115, y: -8, z: -1800, ry: 0.07 },
      accent: '#cfece6'
    },
    'hithegioi-card': {
      overviewPos: { x: -410, y: 210, z: -20, ry: 0.12 },
      journeyPos: { x: -125, y: -6, z: -2700, ry: 0.08 },
      accent: '#e2ab4b'
    },
    'vib-itsher-node': {
      overviewPos: { x: -125, y: 105, z: -30, ry: 0.09 },
      journeyPos: { x: -115, y: 6, z: -3600, ry: 0.08 },
      accent: '#ff4425'
    },
    'motor-fest-card': {
      overviewPos: { x: 160, y: 105, z: -35, ry: 0.06 },
      journeyPos: { x: -125, y: -8, z: -4500, ry: 0.08 },
      accent: '#cfece6'
    },
    'doraemon-tvc-card': {
      overviewPos: { x: -410, y: 0, z: -40, ry: 0.12 },
      journeyPos: { x: -115, y: 6, z: -5400, ry: 0.07 },
      accent: '#e2ab4b'
    },
    'mv-le-card': {
      overviewPos: { x: -125, y: -105, z: -50, ry: 0.09 },
      journeyPos: { x: -125, y: -8, z: -6300, ry: 0.08 },
      accent: '#ff4425'
    },
    'dong-co-lau-card': {
      overviewPos: { x: 160, y: -105, z: -55, ry: 0.06 },
      journeyPos: { x: -115, y: 4, z: -7200, ry: 0.08 },
      accent: '#cfece6'
    },
    'ThaiLong-card': {
      overviewPos: { x: -410, y: -210, z: -60, ry: 0.12 },
      journeyPos: { x: -125, y: -8, z: -8100, ry: 0.08 },
      accent: '#e2ab4b'
    },
    'microlife-bts-card': {
      overviewPos: { x: -125, y: -315, z: -70, ry: 0.09 },
      journeyPos: { x: -115, y: 6, z: -9000, ry: 0.07 },
      accent: '#cfece6'
    },
    '2ndchance-card': {
      overviewPos: { x: 160, y: -315, z: -75, ry: 0.06 },
      journeyPos: { x: -125, y: -8, z: -9900, ry: 0.08 },
      accent: '#ff4425'
    },
    'PhongNguaDotQuy-card': {
      overviewPos: { x: -410, y: -420, z: -80, ry: 0.12 },
      journeyPos: { x: -120, y: 0, z: -10800, ry: 0.07 },
      accent: '#ff4425'
    }
  };

  const graphemeSegmenter = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter('vi', { granularity: 'grapheme' })
    : null;

  function splitGraphemes(text) {
    const normalized = String(text == null ? '' : text).normalize('NFC');
    if (graphemeSegmenter) {
      return Array.from(graphemeSegmenter.segment(normalized), (seg) => seg.segment);
    }
    return Array.from(normalized);
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[ch]));
  }

  function renderDossierSheetHTML(node) {
    const dossier = node && node.dossier;
    if (!dossier) return '';

    if (dossier.kind === 'profile') {
      const cells = (dossier.timeline || []).map((item, idx) => `
        <div class="sheet-cell" style="--cell-i:${idx}"><b>${escapeHtml(item.period)}</b><span>${escapeHtml(item.role)}</span></div>
      `).join('');

      const skills = (dossier.skills || []).map((skill) => `
        <div class="skill-meter">
          <div class="skill-meter-top"><span>${escapeHtml(skill.label)}</span><i data-text-fx="telemetry">${Number(skill.pct)}%</i></div>
          <div class="skill-track"><div class="skill-fill" style="--pct:${Number(skill.pct)}%"></div></div>
        </div>
      `).join('');

      const author = global.PortfolioCatalog && global.PortfolioCatalog.author;
      const contactBar = author ? `
        <div class="sheet-contact-row">
          <span class="sheet-contact-label">Liên hệ trực tiếp</span>
          <div class="sheet-contact-links">
            <a class="sheet-contact-link" href="mailto:${escapeHtml(author.email)}">Gửi email · ${escapeHtml(author.email)}</a>
            <a class="sheet-contact-link" href="tel:${escapeHtml(author.phoneE164)}">Gọi / Zalo · ${escapeHtml(author.phoneDisplay)}</a>
          </div>
        </div>
      ` : '';

      return `
        <div class="node-data-sheet">
          <div>
            <div class="sheet-head-anim">
              <h3 data-text-fx="cipher">${escapeHtml(dossier.heading)}</h3>
              <p>${escapeHtml(dossier.quote)}</p>
            </div>
            <div class="sheet-grid">${cells}</div>
          </div>
          <div>
            <div class="sheet-skills-bars">${skills}</div>
            ${contactBar}
          </div>
        </div>
      `;
    }

    if (dossier.kind === 'roster') {
      const cells = (dossier.roster || []).map((item, idx) => `
        <div class="sheet-cell" style="--cell-i:${idx}"><b>${escapeHtml(item.brand)}</b><span>${escapeHtml(item.detail)}</span></div>
      `).join('');

      return `
        <div class="node-data-sheet">
          <div>
            <div class="sheet-head-anim">
              <h3 data-text-fx="cipher">${escapeHtml(dossier.heading)}</h3>
              <p><strong>${escapeHtml(dossier.leadLabel)}</strong> ${escapeHtml(dossier.leadText)}</p>
            </div>
            <div class="sheet-grid">${cells}</div>
          </div>
          <div class="sheet-head-anim"><strong>${escapeHtml(dossier.scopeLabel)}</strong> ${escapeHtml(dossier.scopeText)}</div>
        </div>
      `;
    }

    return '';
  }

  // Procedural FUI Schematic Poster Generator scaled to 640x384 (clean geometry without telemetry text)
  function buildPosterSVG(node, index) {
    const seed = (index + 1) * 37;
    const rings = 3 + (index % 2);
    let ringMarkup = '';
    for (let r = 1; r <= rings; r++) {
      const rad = 40 * r + (index % 2) * 13;
      const dash = r % 2 === 0 ? '6 8' : '22 6 4 6';
      const spinClass = r % 2 === 0 ? 'orbit-ring-ccw' : 'orbit-ring-cw';
      ringMarkup += `<circle class="${spinClass}" cx="320" cy="192" r="${rad}" fill="none" stroke="${r === 1 ? node.accent : 'rgba(236,232,223,0.16)'}" stroke-width="${r === 1 ? 1.45 : 1}" stroke-dasharray="${dash}" />`;
    }

    let bars = '';
    for (let b = 0; b < 32; b++) {
      const x = 58 + b * 16.5;
      const h = 14 + ((b * seed * 7) % 72);
      const y = 192 - h / 2;
      const isHighlight = b % 6 === index % 6;
      bars += `<rect x="${x}" y="${y}" width="2.5" height="${h}" fill="${isHighlight ? node.accent : 'rgba(236,232,223,0.16)'}" />`;
    }

    return `
      <svg class="poster-art" viewBox="0 0 640 384" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <radialGradient id="glow-${index}" cx="50%" cy="50%" r="58%">
            <stop offset="0%" stop-color="${node.accent}" stop-opacity="0.22"/>
            <stop offset="65%" stop-color="#0b0b0a" stop-opacity="0.92"/>
            <stop offset="100%" stop-color="#070706" stop-opacity="1"/>
          </radialGradient>
        </defs>
        <rect width="640" height="384" fill="url(#glow-${index})"/>
        <line x1="0" y1="192" x2="640" y2="192" stroke="rgba(236,232,223,0.1)" stroke-width="1"/>
        <line x1="320" y1="0" x2="320" y2="384" stroke="rgba(236,232,223,0.1)" stroke-width="1"/>
        <line x1="0" y1="0" x2="640" y2="384" stroke="rgba(236,232,223,0.04)" stroke-width="1"/>
        <line x1="640" y1="0" x2="0" y2="384" stroke="rgba(236,232,223,0.04)" stroke-width="1"/>
        ${ringMarkup}
        <g opacity="0.62">${bars}</g>
      </svg>
    `;
  }

  const catalog = global.PortfolioCatalog;
  if (!catalog || !Array.isArray(catalog.nodes)) {
    throw new Error('PortfolioCatalog is missing. Ensure /assets/js/catalog-data.js is loaded before nodes-data.js.');
  }

  const OVERVIEW_SHORT_TITLES = {
    'genesis-node': 'Lương Bảo Huy',
    'harmony-card': 'Harmony 2025',
    'daydream-card': 'Day Dreams Final 2024',
    'hithegioi-card': 'BLACKA – Hi Thế Giới',
    'vib-itsher-node': 'VIB “It’s Her” & 2024',
    'motor-fest-card': 'Motor Fest 2023',
    'doraemon-tvc-card': 'Doraemon × LipIce',
    'mv-le-card': 'MV Lé — Dr Roc',
    'dong-co-lau-card': 'Đồng Cỏ Lau',
    'ThaiLong-card': 'Thái Long Yến Tiệc',
    'microlife-bts-card': 'Microlife Talkshow',
    '2ndchance-card': 'The 2nd Chance',
    'PhongNguaDotQuy-card': 'Phòng Ngừa Đột Quỵ'
  };

  function getOverviewShortTitle(node) {
    if (!node) return '';
    if (Object.prototype.hasOwnProperty.call(OVERVIEW_SHORT_TITLES, node.id)) {
      return OVERVIEW_SHORT_TITLES[node.id];
    }
    const full = String(node.title || '').trim();
    if (full.length <= 22) return full;
    const splitMatch = full.match(/^(.+?)(?:\s+[–—|&]\s+|\s+\(|\s+ft\.)/i);
    if (splitMatch && splitMatch[1].length >= 6) return splitMatch[1].trim();
    return `${full.slice(0, 20).trim()}…`;
  }

  const NODES = catalog.nodes.map((item, idx) => {
    const layout = NODE_STAGE_LAYOUT[item.id];
    if (!layout) {
      throw new Error(`Missing spatial stage layout for node ID "${item.id}".`);
    }
    return Object.assign({}, item, {
      index: idx,
      overviewShortTitle: getOverviewShortTitle(item),
      overviewPos: layout.overviewPos,
      journeyPos: layout.journeyPos,
      accent: layout.accent
    });
  });

  const NODE_BY_ID = Object.create(null);
  const NODE_BY_SLUG = Object.create(null);
  NODES.forEach((node) => {
    NODE_BY_ID[node.id] = node;
    NODE_BY_SLUG[node.slug] = node;
  });

  function getNodeById(nodeId) {
    return Object.prototype.hasOwnProperty.call(NODE_BY_ID, nodeId) ? NODE_BY_ID[nodeId] : null;
  }

  function getNodeIndexById(nodeId) {
    const node = getNodeById(nodeId);
    return node ? node.index : -1;
  }

  function getNodeIndexBySlug(slug) {
    const clean = String(slug || '').replace(/^\/+|\/+$/g, '');
    const node = Object.prototype.hasOwnProperty.call(NODE_BY_SLUG, clean) ? NODE_BY_SLUG[clean] : null;
    return node ? node.index : -1;
  }

  global.PortfolioData = {
    CAM_STATION_DIST,
    CATALOG: catalog,
    SITE: catalog.site,
    AUTHOR: catalog.author,
    WITNESS: catalog.witness,
    NODES,
    NODE_BY_ID,
    NODE_BY_SLUG,
    getNodeById,
    getNodeIndexById,
    getNodeIndexBySlug,
    getOverviewShortTitle,
    buildPosterSVG,
    renderDossierSheetHTML,
    splitGraphemes,
    escapeHtml
  };
})(window);
