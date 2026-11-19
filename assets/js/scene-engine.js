/* =========================================================================
   MINATO MAKOTO — PRODUCTION 3D HYBRID SCENE ENGINE (window.SceneEngine)
   Architecture:
   - Shared PerspectiveCamera across THREE.WebGLRenderer & THREE.CSS3DRenderer
   - Persistent Right-Side Sub-HUD Across Both OVERVIEW & JOURNEY Modes
   - Destination-Locked Station Routing (goToStation) + Single-Pass Tether
   ========================================================================= */
(function (global) {
  'use strict';

  const {
    CAM_STATION_DIST,
    SITE,
    NODES,
    getNodeById,
    getNodeIndexById,
    getNodeIndexBySlug,
    buildPosterSVG,
    renderDossierSheetHTML,
    escapeHtml
  } = global.PortfolioData;
  const TextFX = global.TextFX;
  const SubHudController = global.SubHudController;

  const TETHER_DURATION_MS = 680;
  const OVERVIEW_LABEL_OFFSET_LOCAL = 14;
  const OVERVIEW_LABEL_GAP_PX = 8;
  const JOURNEY_STATION_RY = 0.12;
  const cardMetrics = { halfW: 345, halfH: 222, labelLocalY: -236, dirty: true };

  const state = {
    mode: 'OVERVIEW',
    activeNodeId: NODES[0].id,
    activeNodeIndex: 0,
    arrivedNodeId: null,
    pendingArrivalNodeId: null,
    pendingArrivalPlayFx: false,
    stageMoving: false,
    hoveredNodeIndex: -1,
    activeOverviewLabelIdx: -1,
    playingNodeId: null,
    targetProgress: 0,
    currentProgress: 0,
    progressVel: 0,
    flightStartU: 0,
    flightTargetU: 0,
    flightStartVel: 0,
    flightStartTime: 0,
    flightDuration: 760,
    flightActive: false,
    freeScrollRoaming: false,
    scrollSnapCommitted: false,
    wheelSnapTimer: null,
    modeSwitchLockUntil: 0,
    camPos: null,
    camTargetPos: null,
    lookAtPos: null,
    lookAtTarget: null,
    pointerX: 0,
    pointerY: 0,
    smoothPointerX: 0,
    smoothPointerY: 0,
    tunnelAlpha: 0,
    tether: {
      phase: 'HIDDEN', // 'HIDDEN' | 'WAIT_CARD' | 'CONNECTING' | 'CONNECTED'
      nodeId: null,
      startTime: 0
    }
  };

  let scene, cssScene, camera, webglRenderer, cssRenderer;
  let signalSpline, cameraSpline, lookSpline, corridorGroup, dustParticlesMesh;
  let galaxyGroup = null;
  let sparkleMeshA = null;
  let sparkleMeshB = null;
  const tunnelMaterials = [];
  const nodeDomItems = [];
  const overviewWireItems = [];
  const overviewLabelItems = [];
  let overviewHubRingEl = null;
  let overviewHubCoreEl = null;
  const stopButtons = [];
  let pulsePointsMesh = null;
  let pulseProgress = 0;
  let lastTickMs = 0;

  let projVec = null;
  let labelProjVec = null;
  let lastOverviewLabelMaxW = 0;
  let tetherPathEl, tetherAnchorEl, tetherElbowEl, tetherCapsuleGroupEl;
  let chatDockEl, subhudChassisEl, chatPortLeftEl;
  let overviewLabelsLayerEl, topBarEl, scrubberEl;

  function resolveNodeAndIndex(nodeIdOrIdx) {
    if (typeof nodeIdOrIdx === 'string') {
      const node = getNodeById(nodeIdOrIdx);
      return node ? { node, index: node.index } : null;
    }
    const clamped = Math.max(0, Math.min(NODES.length - 1, Number(nodeIdOrIdx) || 0));
    const node = NODES[clamped];
    return node ? { node, index: clamped } : null;
  }

  function resolveLocationState(isInitialBoot = false) {
    const pathMatch = (window.location.pathname || '').match(/\/work\/([^/]+?)(?:\/index\.html)?\/?$/);
    if (pathMatch) {
      const slugIdx = getNodeIndexBySlug(decodeURIComponent(pathMatch[1]));
      if (slugIdx !== -1) {
        return { mode: 'JOURNEY', nodeIndex: slugIdx };
      }
    }

    if (isInitialBoot) {
      const initialAttrId = document.body.getAttribute('data-initial-node-id');
      if (initialAttrId) {
        const attrIdx = getNodeIndexById(initialAttrId);
        if (attrIdx !== -1) {
          return { mode: 'JOURNEY', nodeIndex: attrIdx };
        }
      }
    }

    return { mode: 'OVERVIEW', nodeIndex: -1 };
  }

  function syncLocationUrl(historyMode) {
    document.title = state.mode === 'OVERVIEW'
      ? SITE.title
      : (NODES[state.activeNodeIndex].seoTitle || `${NODES[state.activeNodeIndex].title} | ${SITE.name}`);

    if (historyMode === 'none') return;
    const mode = historyMode === 'push' ? 'push' : 'replace';
    const targetUrl = state.mode === 'OVERVIEW'
      ? '/'
      : NODES[state.activeNodeIndex].permalink;
    const stateObj = state.mode === 'OVERVIEW'
      ? { mode: 'OVERVIEW' }
      : { mode: 'JOURNEY', nodeId: state.activeNodeId };

    if (window.location.pathname === targetUrl) return;

    try {
      if (mode === 'push') {
        history.pushState(stateObj, '', targetUrl);
      } else {
        history.replaceState(stateObj, '', targetUrl);
      }
    } catch {
      // Ignore history restriction on non-origin file:// previews
    }
  }

  function hideTetherImmediately() {
    state.tether.phase = 'HIDDEN';
    state.tether.nodeId = null;
    state.tether.startTime = 0;
    if (tetherPathEl) tetherPathEl.style.opacity = '0';
    if (tetherAnchorEl) tetherAnchorEl.style.opacity = '0';
    if (tetherElbowEl) tetherElbowEl.style.opacity = '0';
    if (tetherCapsuleGroupEl) tetherCapsuleGroupEl.style.opacity = '0';
  }

  function startTetherConnection(nodeId) {
    if (!nodeId) {
      hideTetherImmediately();
      return;
    }
    if (
      state.tether.nodeId === nodeId &&
      (state.tether.phase === 'CONNECTING' || state.tether.phase === 'CONNECTED')
    ) {
      return;
    }
    hideTetherImmediately();
    state.tether.nodeId = nodeId;
    state.tether.phase = 'WAIT_CARD';
    state.tether.startTime = 0;
  }

  function setStageMoving(moving) {
    const next = Boolean(moving);
    if (state.stageMoving === next) return;
    state.stageMoving = next;
    if (next) {
      document.body.setAttribute('data-stage-moving', 'true');
    } else {
      document.body.removeAttribute('data-stage-moving');
    }
  }

  // Responsive ease-out-weighted click flight (immediate liftoff, smooth weighted settle)
  function launchProgressFlight(newTargetU, customDuration) {
    const clampedU = Math.max(0, Math.min(1, newTargetU));
    const dist = Math.abs(clampedU - state.currentProgress);
    if (dist < 0.0001) {
      state.currentProgress = clampedU;
      state.targetProgress = clampedU;
      state.progressVel = 0;
      state.flightActive = false;
      return;
    }
    state.targetProgress = clampedU;
    state.flightStartU = state.currentProgress;
    state.flightTargetU = clampedU;
    state.flightStartVel = state.progressVel;
    state.flightStartTime = performance.now();
    state.flightDuration = customDuration || Math.round(Math.min(1180, Math.max(660, 620 + dist * 920)));
    state.flightActive = true;
  }

  function canInitialize3D() {
    if (typeof THREE === 'undefined' || typeof THREE.CSS3DRenderer === 'undefined') {
      return false;
    }
    return Boolean(document.getElementById('webgl-layer') && document.getElementById('css3d-layer'));
  }

  function enableHtmlFallback() {
    document.body.setAttribute('data-scene-state', 'fallback');
  }

  function init() {
    if (!canInitialize3D()) {
      enableHtmlFallback();
      return;
    }

    const canvas = document.getElementById('webgl-layer');
    const cssRoot = document.getElementById('css3d-layer');

    try {
      webglRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    } catch {
      enableHtmlFallback();
      return;
    }

    const fallbackIframe = document.querySelector('.seo-fallback-shell iframe[data-fallback-player]');

    tetherPathEl = document.getElementById('tether-path');
    tetherAnchorEl = document.getElementById('tether-anchor');
    tetherElbowEl = document.getElementById('tether-elbow');
    tetherCapsuleGroupEl = document.getElementById('tether-capsule-group');
    chatDockEl = document.getElementById('chat-dock');
    subhudChassisEl = document.getElementById('subhud-chassis');
    chatPortLeftEl = document.getElementById('chat-port-left');
    overviewLabelsLayerEl = document.getElementById('overview-labels-layer');
    topBarEl = document.querySelector('.chrome-top');
    scrubberEl = document.querySelector('.z-scrubber');

    projVec = new THREE.Vector3();
    labelProjVec = new THREE.Vector3();

    camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 10, 16000);
    state.camPos = new THREE.Vector3(175, 0, 1620);
    state.camTargetPos = new THREE.Vector3(175, 0, 1620);
    state.lookAtPos = new THREE.Vector3(160, 0, -30);
    state.lookAtTarget = new THREE.Vector3(160, 0, -30);

    webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    webglRenderer.setSize(window.innerWidth, window.innerHeight);
    webglRenderer.setClearColor(0x070706, 1);

    cssRenderer = new THREE.CSS3DRenderer();
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    cssRoot.appendChild(cssRenderer.domElement);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070706, 0.00022);
    cssScene = new THREE.Scene();

    buildZCorridorWebGL();
    buildFloatingHUDNodes();
    buildLeftScrubber();
    bindEvents();

    document.body.setAttribute('data-scene-state', '3d');

    const initialLoc = resolveLocationState(true);
    if (initialLoc.mode === 'JOURNEY' && initialLoc.nodeIndex !== -1) {
      const initialNode = NODES[initialLoc.nodeIndex];
      goToStation(initialNode.id, {
        announceChat: true,
        immediate: true,
        historyMode: 'none'
      });
      if (initialNode.video && initialNode.video.embedUrl) {
        openNodeMedia(initialNode.id, {
          autoplay: false,
          adoptIframe: fallbackIframe
        });
      }
    } else {
      enterOverviewMode({ announceChat: true, immediate: true, historyMode: 'none' });
    }

    // Remove any unused fallback player iframes so at most one active player exists in the DOM
    document.querySelectorAll('.seo-fallback-shell iframe[data-fallback-player]').forEach((frame) => {
      frame.remove();
    });

    requestAnimationFrame(tick);
  }

  function createStarlightTexture() {
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.28, 'rgba(236, 232, 223, 0.85)');
    grad.addColorStop(0.65, 'rgba(207, 236, 230, 0.22)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  }

  function buildZCorridorWebGL() {
    corridorGroup = new THREE.Group();
    scene.add(corridorGroup);

    const spineWaypoints = NODES.map(n => new THREE.Vector3(n.journeyPos.x, n.journeyPos.y - 175, n.journeyPos.z));
    signalSpline = new THREE.CatmullRomCurve3(spineWaypoints);

    const camWaypoints = NODES.map(n => new THREE.Vector3(n.journeyPos.x + 98, n.journeyPos.y + 2, n.journeyPos.z + CAM_STATION_DIST));
    const lookWaypoints = NODES.map(n => new THREE.Vector3(n.journeyPos.x + 90, n.journeyPos.y - 2, n.journeyPos.z));
    cameraSpline = new THREE.CatmullRomCurve3(camWaypoints);
    lookSpline = new THREE.CatmullRomCurve3(lookWaypoints);

    const curvePts = signalSpline.getPoints(390);

    const centerGeo = new THREE.BufferGeometry().setFromPoints(curvePts);
    const centerMat = new THREE.LineBasicMaterial({ color: 0xff4425, transparent: true, opacity: 0 });
    tunnelMaterials.push({ mat: centerMat, baseOpacity: 0.65 });
    corridorGroup.add(new THREE.Line(centerGeo, centerMat));

    [-88, 88].forEach(offsetX => {
      const railPts = curvePts.map(p => new THREE.Vector3(p.x + offsetX, p.y - 6, p.z));
      const railGeo = new THREE.BufferGeometry().setFromPoints(railPts);
      const railMat = new THREE.LineBasicMaterial({ color: 0xece8df, transparent: true, opacity: 0 });
      tunnelMaterials.push({ mat: railMat, baseOpacity: 0.14 });
      corridorGroup.add(new THREE.Line(railGeo, railMat));
    });

    const gateVerts = [];
    for (let z = 100; z >= -11400; z -= 450) {
      const w = 900;
      const h = 480;
      gateVerts.push(
        new THREE.Vector3(-w, -h, z), new THREE.Vector3(-w, h, z),
        new THREE.Vector3(-w, h, z), new THREE.Vector3(-w + 70, h, z),
        new THREE.Vector3(-w, -h, z), new THREE.Vector3(-w + 70, -h, z),

        new THREE.Vector3(w, -h, z), new THREE.Vector3(w, h, z),
        new THREE.Vector3(w, h, z), new THREE.Vector3(w - 70, h, z),
        new THREE.Vector3(w, -h, z), new THREE.Vector3(w - 70, -h, z),

        new THREE.Vector3(-360, -295, z), new THREE.Vector3(360, -295, z)
      );
    }
    const gateGeo = new THREE.BufferGeometry().setFromPoints(gateVerts);
    const gateMat = new THREE.LineBasicMaterial({ color: 0xece8df, transparent: true, opacity: 0 });
    tunnelMaterials.push({ mat: gateMat, baseOpacity: 0.09 });
    corridorGroup.add(new THREE.LineSegments(gateGeo, gateMat));

    const pulseCount = 26;
    const pulsePos = new Float32Array(pulseCount * 3);
    const pulseGeo = new THREE.BufferGeometry();
    pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
    const pulseMat = new THREE.PointsMaterial({ color: 0xff4425, size: 7.5, transparent: true, opacity: 0 });
    tunnelMaterials.push({ mat: pulseMat, baseOpacity: 0.88 });
    pulsePointsMesh = new THREE.Points(pulseGeo, pulseMat);
    corridorGroup.add(pulsePointsMesh);

    galaxyGroup = new THREE.Group();
    scene.add(galaxyGroup);
    const starTex = createStarlightTexture();

    const particleCount = 1150;
    const pCoords = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pCoords[i * 3] = (Math.random() - 0.5) * 2800;
      pCoords[i * 3 + 1] = (Math.random() - 0.5) * 1600;
      pCoords[i * 3 + 2] = 950 - Math.random() * 12400;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pCoords, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xece8df,
      size: 6.2,
      map: starTex,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    dustParticlesMesh = new THREE.Points(pGeo, pMat);
    galaxyGroup.add(dustParticlesMesh);

    const sparkleCountA = 320;
    const sCoordsA = new Float32Array(sparkleCountA * 3);
    for (let i = 0; i < sparkleCountA; i++) {
      sCoordsA[i * 3] = (Math.random() - 0.5) * 2600;
      sCoordsA[i * 3 + 1] = (Math.random() - 0.5) * 1500;
      sCoordsA[i * 3 + 2] = 900 - Math.random() * 11800;
    }
    const sGeoA = new THREE.BufferGeometry();
    sGeoA.setAttribute('position', new THREE.BufferAttribute(sCoordsA, 3));
    const sMatA = new THREE.PointsMaterial({
      color: 0xcfece6,
      size: 10.5,
      map: starTex,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    sparkleMeshA = new THREE.Points(sGeoA, sMatA);
    galaxyGroup.add(sparkleMeshA);

    const sparkleCountB = 190;
    const sCoordsB = new Float32Array(sparkleCountB * 3);
    for (let i = 0; i < sparkleCountB; i++) {
      sCoordsB[i * 3] = (Math.random() - 0.5) * 2600;
      sCoordsB[i * 3 + 1] = (Math.random() - 0.5) * 1500;
      sCoordsB[i * 3 + 2] = 900 - Math.random() * 11800;
    }
    const sGeoB = new THREE.BufferGeometry();
    sGeoB.setAttribute('position', new THREE.BufferAttribute(sCoordsB, 3));
    const sMatB = new THREE.PointsMaterial({
      color: 0xff7a4d,
      size: 9.2,
      map: starTex,
      transparent: true,
      opacity: 0.64,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    sparkleMeshB = new THREE.Points(sGeoB, sMatB);
    galaxyGroup.add(sparkleMeshB);
  }

  function resetOverviewLabel(idx) {
    const entry = overviewLabelItems[idx];
    if (!entry) return;
    entry.sizerEl.textContent = entry.shortTitle;
    TextFX.cancel(entry.textEl, entry.shortTitle);
  }

  function resetAllOverviewLabels() {
    for (let i = 0; i < overviewLabelItems.length; i++) {
      resetOverviewLabel(i);
    }
    state.activeOverviewLabelIdx = -1;
  }

  function syncOverviewLabelTyping(priorityIdx) {
    if (state.mode !== 'OVERVIEW' || state.stageMoving) {
      if (state.activeOverviewLabelIdx !== -1) {
        resetOverviewLabel(state.activeOverviewLabelIdx);
        state.activeOverviewLabelIdx = -1;
      }
      return;
    }
    if (state.activeOverviewLabelIdx === priorityIdx) return;
    if (state.activeOverviewLabelIdx !== -1) {
      resetOverviewLabel(state.activeOverviewLabelIdx);
    }
    state.activeOverviewLabelIdx = priorityIdx;
    if (priorityIdx !== -1 && overviewLabelItems[priorityIdx]) {
      const entry = overviewLabelItems[priorityIdx];
      entry.sizerEl.textContent = entry.fullTitle;
      TextFX.run(entry.textEl, 'typewriter', { text: entry.fullTitle, duration: 420 });
    }
  }

  function buildFloatingHUDNodes() {
    const overviewGroup = document.getElementById('overview-wires-group');
    const svgNS = 'http://www.w3.org/2000/svg';

    NODES.forEach((node, idx) => {
      const el = document.createElement('article');
      el.className = 'hud-node';
      el.dataset.index = String(idx);
      el.dataset.nodeId = node.id;

      el.innerHTML = `
        <div class="node-rig">
          <div class="node-layer-back" aria-hidden="true">
            <span class="node-ghost-index">${escapeHtml(node.code)}</span>
          </div>

          <div class="node-layer-core">
            <div class="node-visual-poster">${buildPosterSVG(node, idx)}</div>
            <div class="node-scan-beam" aria-hidden="true"></div>
            <div class="node-shimmer" aria-hidden="true"></div>
            <div class="node-media-slot" data-slot="${idx}" data-node-id="${escapeHtml(node.id)}"></div>
            <span class="node-port-socket port-right" aria-hidden="true"></span>
          </div>

          <div class="node-layer-frame" aria-hidden="true">
            <span class="hud-corner tl"></span>
            <span class="hud-corner tr"></span>
            <span class="hud-corner bl"></span>
            <span class="hud-corner br"></span>
            <span class="hud-edge top"></span>
            <span class="hud-edge bottom"></span>
            <span class="hud-edge left"></span>
            <span class="hud-edge right"></span>
            <div class="node-top-strip">
              <span class="node-tally"><i class="node-tally-dot"></i><span data-text-fx="telemetry">${escapeHtml(node.year)}</span></span>
            </div>
          </div>

          <div class="node-layer-front">
            <div class="node-header-meta">
              <span class="node-cat-badge" data-text-fx="typewriter">${escapeHtml(node.category)}</span>
              <span class="node-coords-tag" data-text-fx="telemetry">${escapeHtml(node.client.split('·')[0].trim())}</span>
            </div>

            <div class="node-reticle-wrap" aria-hidden="true">
              <svg class="node-reticle-svg" viewBox="0 0 112 112">
                <circle class="reticle-ring-outer" cx="56" cy="56" r="48" fill="none" stroke="rgba(236,232,223,0.42)" stroke-width="1.1" stroke-dasharray="14 8 3 8"/>
                <circle class="reticle-ring-inner" cx="56" cy="56" r="33" fill="none" stroke="rgba(207,236,230,0.42)" stroke-width="0.9" stroke-dasharray="5 6"/>
                <line x1="56" y1="2" x2="56" y2="14" stroke="rgba(236,232,223,0.55)" stroke-width="1"/>
                <line x1="56" y1="98" x2="56" y2="110" stroke="rgba(236,232,223,0.55)" stroke-width="1"/>
                <line x1="2" y1="56" x2="14" y2="56" stroke="rgba(236,232,223,0.55)" stroke-width="1"/>
                <line x1="98" y1="56" x2="110" y2="56" stroke="rgba(236,232,223,0.55)" stroke-width="1"/>
              </svg>
            </div>

            <div class="node-caption-deck">
              <div>
                <h2 class="node-title-main" data-text-fx="cipher">${escapeHtml(node.title)}</h2>
                <div class="node-role-sub" data-text-fx="stagger">${escapeHtml(node.role)}</div>
              </div>
              <span class="node-action-hint" data-text-fx="typewriter">${node.mediaType === 'sheet' ? 'Mở hồ sơ' : 'Xem video'}</span>
            </div>
          </div>
        </div>
      `;

      const portRightEl = el.querySelector('.node-port-socket.port-right');
      const slotEl = el.querySelector('.node-media-slot');
      if (slotEl) {
        slotEl.addEventListener('click', (ev) => {
          ev.stopPropagation();
        });
      }

      if (overviewGroup) {
        const basePath = document.createElementNS(svgNS, 'path');
        basePath.setAttribute('class', 'overview-wire-base');
        basePath.setAttribute('d', 'M0,0 L0,0');

        const portCircle = document.createElementNS(svgNS, 'circle');
        portCircle.setAttribute('class', 'overview-node-port');
        portCircle.setAttribute('r', '3.5');

        overviewGroup.appendChild(basePath);
        overviewGroup.appendChild(portCircle);
        overviewWireItems.push({ basePath, portCircle });
      }

      if (overviewLabelsLayerEl) {
        const shortTitle = node.overviewShortTitle || node.title;
        const labelEl = document.createElement('div');
        labelEl.className = 'overview-node-label';
        labelEl.dataset.nodeId = node.id;

        const sizerEl = document.createElement('span');
        sizerEl.className = 'ov-label-sizer';
        sizerEl.setAttribute('aria-hidden', 'true');
        sizerEl.textContent = shortTitle;

        const textEl = document.createElement('span');
        textEl.className = 'ov-label-text';
        textEl.dataset.textFx = 'typewriter';
        textEl.textContent = shortTitle;

        labelEl.appendChild(sizerEl);
        labelEl.appendChild(textEl);
        overviewLabelsLayerEl.appendChild(labelEl);
        overviewLabelItems.push({
          el: labelEl,
          sizerEl,
          textEl,
          shortTitle,
          fullTitle: node.title,
          node,
          index: idx
        });
      }

      el.addEventListener('pointerenter', () => {
        state.hoveredNodeIndex = idx;
        if (state.mode === 'OVERVIEW' && !state.stageMoving) {
          TextFX.triggerWithin(el);
          syncOverviewLabelTyping(idx);
          startTetherConnection(node.id);
        }
      });

      el.addEventListener('pointerleave', () => {
        if (state.hoveredNodeIndex === idx) {
          state.hoveredNodeIndex = -1;
          if (state.mode === 'OVERVIEW') {
            syncOverviewLabelTyping(-1);
            hideTetherImmediately();
          }
        }
      });

      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (state.mode === 'OVERVIEW' || state.activeNodeId !== node.id) {
          goToStation(node.id, { historyMode: 'push' });
        } else {
          toggleNodePrimaryAction(node.id);
        }
      });

      const cssObj = new THREE.CSS3DObject(el);
      cssObj.position.set(node.overviewPos.x, node.overviewPos.y, node.overviewPos.z);
      cssObj.rotation.y = node.overviewPos.ry;
      cssObj.scale.setScalar(0.26);
      cssScene.add(cssObj);

      nodeDomItems.push({
        el,
        portRightEl,
        cssObj,
        node,
        targetPos: new THREE.Vector3(node.overviewPos.x, node.overviewPos.y, node.overviewPos.z),
        targetRy: node.overviewPos.ry,
        targetScale: 0.26
      });
    });

    if (overviewGroup) {
      overviewHubRingEl = document.createElementNS(svgNS, 'circle');
      overviewHubRingEl.setAttribute('class', 'overview-hub-ring');
      overviewHubRingEl.setAttribute('r', '7.5');

      overviewHubCoreEl = document.createElementNS(svgNS, 'circle');
      overviewHubCoreEl.setAttribute('class', 'overview-hub-core');
      overviewHubCoreEl.setAttribute('r', '3.2');

      overviewGroup.appendChild(overviewHubRingEl);
      overviewGroup.appendChild(overviewHubCoreEl);
    }
  }

  function buildLeftScrubber() {
    const list = document.getElementById('z-stops-list');
    if (!list) return;

    const existingLinks = Array.from(list.querySelectorAll('.z-stop-btn[data-node-id]'));
    NODES.forEach((node) => {
      const linkEl = existingLinks.find((item) => item.getAttribute('data-node-id') === node.id);
      if (!linkEl) return;
      linkEl.addEventListener('click', (ev) => {
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0) return;
        ev.preventDefault();
        goToStation(node.id, { historyMode: 'push' });
      });
      stopButtons.push(linkEl);
    });
  }

  function subHudActions() {
    return {
      onSelectNodeById: (nodeId) => {
        goToStation(nodeId, { historyMode: 'push' });
      },
      onTriggerPrimaryById: (nodeId) => {
        toggleNodePrimaryAction(nodeId);
      }
    };
  }

  function syncNavButtonsState() {
    const prevBtn = document.getElementById('btn-prev-node');
    const nextBtn = document.getElementById('btn-next-node');
    const overviewBtn = document.getElementById('btn-overview-mode');
    const isOverview = state.mode === 'OVERVIEW';
    const isLast = !isOverview && state.activeNodeIndex === NODES.length - 1;

    if (prevBtn) {
      prevBtn.disabled = isOverview;
      prevBtn.setAttribute('aria-disabled', isOverview ? 'true' : 'false');
      prevBtn.classList.toggle('is-disabled', isOverview);
    }

    if (nextBtn) {
      nextBtn.disabled = isLast;
      nextBtn.setAttribute('aria-disabled', isLast ? 'true' : 'false');
      nextBtn.classList.toggle('is-disabled', isLast);
    }

    if (overviewBtn) {
      overviewBtn.classList.toggle('is-overview-active', isOverview);
      overviewBtn.setAttribute('aria-pressed', isOverview ? 'true' : 'false');
    }
  }

  function updateOverviewCameraTargets(immediate) {
    const isDesktop = window.innerWidth > 1024;
    state.camTargetPos.set(isDesktop ? 175 : 0, 0, isDesktop ? 1620 : 2500);
    state.lookAtTarget.set(isDesktop ? 160 : 0, 0, -30);
    if (immediate) {
      state.camPos.copy(state.camTargetPos);
      state.lookAtPos.copy(state.lookAtTarget);
    }
  }

  function enterOverviewMode(arg1, arg2) {
    const opts = (arg1 && typeof arg1 === 'object')
      ? arg1
      : { announceChat: arg1 !== false, immediate: Boolean(arg2) };
    const announceChat = opts.announceChat !== false;
    const immediate = Boolean(opts.immediate);
    const historyMode = opts.historyMode || (state.mode === 'OVERVIEW' ? 'none' : 'push');

    if (state.wheelSnapTimer) {
      clearTimeout(state.wheelSnapTimer);
      state.wheelSnapTimer = null;
    }

    if (state.playingNodeId) {
      stopNodeMedia(state.playingNodeId);
    }

    hideTetherImmediately();
    resetAllOverviewLabels();

    state.mode = 'OVERVIEW';
    state.arrivedNodeId = null;
    state.pendingArrivalNodeId = null;
    state.pendingArrivalPlayFx = false;
    state.hoveredNodeIndex = -1;
    state.flightActive = false;
    state.freeScrollRoaming = false;
    state.scrollSnapCommitted = false;
    state.currentProgress = 0;
    state.targetProgress = 0;
    state.progressVel = 0;
    state.modeSwitchLockUntil = immediate ? 0 : performance.now() + 280;
    setStageMoving(!immediate);

    const scrubReadout = document.getElementById('scrubber-readout');
    if (scrubReadout) scrubReadout.textContent = 'Bản đồ';
    const progressFill = document.getElementById('z-progress-fill');
    if (progressFill) progressFill.style.height = '0%';

    nodeDomItems.forEach((item) => {
      item.targetPos.set(item.node.overviewPos.x, item.node.overviewPos.y, item.node.overviewPos.z);
      item.targetRy = item.node.overviewPos.ry;
      item.targetScale = 0.26;
      item.el.classList.remove('is-arrived', 'is-arriving-pulse', 'is-approaching', 'is-distant', 'is-behind-cam');
      if (immediate) {
        item.cssObj.position.copy(item.targetPos);
        item.cssObj.rotation.y = item.targetRy;
        item.cssObj.rotation.x = 0;
        item.cssObj.rotation.z = 0;
        item.cssObj.scale.setScalar(item.targetScale);
      }
    });

    stopButtons.forEach((btn) => {
      btn.classList.remove('is-current');
      btn.removeAttribute('aria-current');
    });

    updateOverviewCameraTargets(immediate);
    syncNavButtonsState();
    syncLocationUrl(historyMode);

    document.body.setAttribute('data-mode', 'OVERVIEW');
    if (announceChat) {
      SubHudController.populateOverviewContent(subHudActions());
    }
  }

  function syncScrubberState(activeIdx) {
    stopButtons.forEach((btn, idx) => {
      const isCurrent = state.mode === 'JOURNEY' && idx === activeIdx;
      btn.classList.toggle('is-current', isCurrent);
      if (isCurrent) {
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.removeAttribute('aria-current');
      }
    });

    const n = NODES[activeIdx];
    const scrubReadout = document.getElementById('scrubber-readout');
    if (scrubReadout && n) scrubReadout.textContent = `Mục ${n.code} / 12`;
    const pct = NODES.length > 1 ? (activeIdx / (NODES.length - 1)) * 100 : 0;
    const progressFill = document.getElementById('z-progress-fill');
    if (progressFill) progressFill.style.height = `${pct.toFixed(1)}%`;
  }

  function syncJourneyApproachingState(focusIdx, opts = {}) {
    if (state.mode !== 'JOURNEY') return;
    const clampedFocus = Math.max(0, Math.min(NODES.length - 1, focusIdx));
    const keepDepartingId = opts.keepDepartingId || null;

    nodeDomItems.forEach((item, idx) => {
      item.targetRy = JOURNEY_STATION_RY;
      const isFocus = idx === clampedFocus;
      const isDeparting = Boolean(keepDepartingId && item.node.id === keepDepartingId);
      item.el.classList.toggle('is-approaching', isFocus || isDeparting);
      item.el.classList.toggle('is-distant', !isFocus && !isDeparting);
      if (!isDeparting) {
        item.el.classList.remove('is-arrived', 'is-arriving-pulse');
      }
    });
  }

  function triggerStationArrival(nodeId, opts = {}) {
    const idx = getNodeIndexById(nodeId);
    if (idx === -1 || state.mode !== 'JOURNEY') return;
    const targetItem = nodeDomItems[idx];
    if (!targetItem) return;

    const playFx = opts.playFx !== false;
    state.arrivedNodeId = nodeId;
    state.pendingArrivalNodeId = null;
    state.pendingArrivalPlayFx = false;
    setStageMoving(false);

    nodeDomItems.forEach((item, i) => {
      const isTarget = i === idx;
      item.targetRy = JOURNEY_STATION_RY;
      item.el.classList.toggle('is-arrived', isTarget);
      item.el.classList.toggle('is-approaching', isTarget);
      item.el.classList.toggle('is-distant', !isTarget);
      if (!isTarget) {
        item.el.classList.remove('is-arriving-pulse');
      }
    });

    if (playFx && !targetItem.el.classList.contains('is-playing')) {
      targetItem.el.classList.remove('is-arriving-pulse');
      void targetItem.el.offsetWidth;
      targetItem.el.classList.add('is-arriving-pulse');
      TextFX.triggerWithin(targetItem.el, { force: true });
    }
  }

  function goToStation(nodeIdOrIdx, opts = {}) {
    const resolved = resolveNodeAndIndex(nodeIdOrIdx);
    if (!resolved) return;

    const { node, index: clamped } = resolved;
    const announceChat = opts.announceChat !== false;
    const immediate = Boolean(opts.immediate);
    const historyMode = opts.historyMode || 'push';

    if (
      !immediate &&
      state.mode === 'JOURNEY' &&
      state.activeNodeId === node.id &&
      state.arrivedNodeId === node.id &&
      !state.flightActive &&
      !state.freeScrollRoaming
    ) {
      return;
    }

    if (state.wheelSnapTimer) {
      clearTimeout(state.wheelSnapTimer);
      state.wheelSnapTimer = null;
    }

    if (state.playingNodeId && state.playingNodeId !== node.id) {
      stopNodeMedia(state.playingNodeId);
    }

    const wasOverview = state.mode === 'OVERVIEW';
    const prevId = state.activeNodeId;
    if (wasOverview) {
      resetAllOverviewLabels();
    }

    state.mode = 'JOURNEY';
    state.activeNodeId = node.id;
    state.activeNodeIndex = clamped;
    state.hoveredNodeIndex = -1;
    state.freeScrollRoaming = false;
    state.scrollSnapCommitted = false;
    state.modeSwitchLockUntil = immediate ? 0 : performance.now() + 240;

    nodeDomItems.forEach((item) => {
      item.targetPos.set(item.node.journeyPos.x, item.node.journeyPos.y, item.node.journeyPos.z);
      item.targetRy = JOURNEY_STATION_RY;
      item.targetScale = 0.448;
    });

    const targetU = NODES.length > 1 ? clamped / (NODES.length - 1) : 0;
    if (wasOverview || immediate) {
      state.currentProgress = targetU;
      state.targetProgress = targetU;
      state.progressVel = 0;
      state.flightActive = false;
      cameraSpline.getPointAt(targetU, state.camTargetPos);
      lookSpline.getPointAt(targetU, state.lookAtTarget);
      if (immediate) {
        state.camPos.copy(state.camTargetPos);
        state.lookAtPos.copy(state.lookAtTarget);
        nodeDomItems.forEach((item) => {
          item.cssObj.position.copy(item.targetPos);
          item.cssObj.rotation.y = item.targetRy;
          item.cssObj.rotation.x = 0;
          item.cssObj.rotation.z = 0;
          item.cssObj.scale.setScalar(item.targetScale);
        });
      }
    } else {
      launchProgressFlight(targetU);
    }

    document.body.setAttribute('data-mode', 'JOURNEY');
    syncScrubberState(clamped);
    syncNavButtonsState();
    syncLocationUrl(historyMode);

    if (immediate) {
      triggerStationArrival(node.id, { playFx: false });
      startTetherConnection(node.id);
    } else {
      hideTetherImmediately();
      setStageMoving(true);
      state.pendingArrivalNodeId = node.id;
      state.pendingArrivalPlayFx = true;
      syncJourneyApproachingState(clamped, { keepDepartingId: wasOverview ? null : prevId });
      startTetherConnection(node.id);
    }

    if (announceChat && (wasOverview || prevId !== node.id)) {
      SubHudController.populateNodeContent(node.id, state.playingNodeId, subHudActions());
    } else {
      SubHudController.syncMediaButtons(node, state.playingNodeId === node.id);
    }
  }

  function commitFreeScrollArrival(idx) {
    const clamped = Math.max(0, Math.min(NODES.length - 1, idx));
    const node = NODES[clamped];
    if (!node) return;

    const sameStation = state.activeNodeIndex === clamped && state.activeNodeId === node.id;
    state.freeScrollRoaming = false;
    state.scrollSnapCommitted = false;

    if (!sameStation) {
      if (state.playingNodeId && state.playingNodeId !== node.id) {
        stopNodeMedia(state.playingNodeId);
      }
      state.activeNodeIndex = clamped;
      state.activeNodeId = node.id;
      document.body.setAttribute('data-mode', 'JOURNEY');
      syncScrubberState(clamped);
      syncNavButtonsState();
      syncLocationUrl('replace');
      SubHudController.populateNodeContent(node.id, state.playingNodeId, subHudActions());
    } else {
      syncNavButtonsState();
    }

    triggerStationArrival(node.id, { playFx: !sameStation });
    startTetherConnection(node.id);
  }

  function stepJourney(dir) {
    if (state.mode === 'OVERVIEW') {
      if (dir > 0) {
        goToStation(NODES[0].id, { historyMode: 'push' });
      }
      return;
    }
    if (dir < 0 && state.activeNodeIndex === 0) {
      enterOverviewMode({ announceChat: true, immediate: false, historyMode: 'push' });
      return;
    }
    if (dir > 0 && state.activeNodeIndex >= NODES.length - 1) {
      return;
    }
    const nextIdx = Math.max(0, Math.min(NODES.length - 1, state.activeNodeIndex + dir));
    goToStation(NODES[nextIdx].id, { historyMode: 'push' });
  }

  function openNodeMedia(nodeIdOrIdx, opts = {}) {
    const resolved = resolveNodeAndIndex(nodeIdOrIdx);
    if (!resolved) return;
    const { node, index: idx } = resolved;
    const autoplay = opts.autoplay !== false;
    const adoptIframe = opts.adoptIframe || null;

    if (state.playingNodeId && state.playingNodeId !== node.id) {
      stopNodeMedia(state.playingNodeId);
    }

    const item = nodeDomItems[idx];
    if (!item) return;
    const slot = item.el.querySelector('.node-media-slot');
    if (!slot) return;

    if (node.mediaType === 'sheet') {
      slot.innerHTML = renderDossierSheetHTML(node);
      slot.scrollTop = 0;
      item.el.classList.add('is-playing');
      state.playingNodeId = node.id;
      SubHudController.syncMediaButtons(node, true);
      const sheetEl = slot.querySelector('.node-data-sheet');
      if (sheetEl) {
        void sheetEl.offsetWidth;
        sheetEl.classList.add('is-sheet-active');
        TextFX.triggerWithin(sheetEl);
      }
      return;
    }

    const video = node.video;
    if (!video || !video.embedUrl) return;

    let embedUrl = video.embedUrl;
    if (autoplay && node.mediaType === 'youtube') {
      embedUrl += embedUrl.includes('?') ? '&autoplay=1&rel=0' : '?autoplay=1&rel=0';
    }
    const sourceUrl = video.sourceUrl || embedUrl;
    const sourceLabel = node.mediaType === 'youtube' ? 'Xem trên YouTube ↗' : 'Xem trên Google Drive ↗';

    slot.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'node-player-wrap';

    let iframeEl;
    if (adoptIframe && !autoplay && adoptIframe.getAttribute('src') === video.embedUrl) {
      adoptIframe.removeAttribute('data-fallback-player');
      adoptIframe.title = node.title;
      iframeEl = adoptIframe;
    } else {
      iframeEl = document.createElement('iframe');
      iframeEl.src = embedUrl;
      iframeEl.setAttribute('allow', 'autoplay; encrypted-media; fullscreen');
      iframeEl.setAttribute('allowfullscreen', '');
      iframeEl.title = node.title;
      iframeEl.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    }

    const bar = document.createElement('div');
    bar.className = 'node-player-bar';
    const meta = document.createElement('span');
    meta.className = 'node-player-meta';
    meta.textContent = `${node.code} · ${node.title}`;
    const sourceLink = document.createElement('a');
    sourceLink.className = 'node-source-link';
    sourceLink.href = sourceUrl;
    sourceLink.target = '_blank';
    sourceLink.rel = 'noopener noreferrer';
    sourceLink.textContent = sourceLabel;
    sourceLink.addEventListener('click', (ev) => ev.stopPropagation());

    bar.appendChild(meta);
    bar.appendChild(sourceLink);
    wrap.appendChild(iframeEl);
    wrap.appendChild(bar);
    slot.appendChild(wrap);

    item.el.classList.add('is-playing');
    state.playingNodeId = node.id;
    SubHudController.syncMediaButtons(node, true);
  }

  function toggleNodePrimaryAction(nodeIdOrIdx) {
    const resolved = resolveNodeAndIndex(nodeIdOrIdx);
    if (!resolved) return;
    const { node } = resolved;

    if (state.mode === 'OVERVIEW') {
      goToStation(node.id, { historyMode: 'push' });
      return;
    }

    if (state.playingNodeId === node.id) {
      stopNodeMedia(node.id);
      return;
    }

    openNodeMedia(node.id);
  }

  function stopNodeMedia(nodeIdOrIdx) {
    const targetId = typeof nodeIdOrIdx === 'number'
      ? (NODES[nodeIdOrIdx] && NODES[nodeIdOrIdx].id)
      : (nodeIdOrIdx || state.playingNodeId);
    if (!targetId) return;

    const item = nodeDomItems.find((entry) => entry.node.id === targetId);
    if (item) {
      const slot = item.el.querySelector('.node-media-slot');
      if (slot) slot.innerHTML = '';
      item.el.classList.remove('is-playing');
    }

    if (state.playingNodeId === targetId) {
      state.playingNodeId = null;
      const activeNode = getNodeById(state.activeNodeId);
      if (state.mode === 'JOURNEY' && activeNode) {
        SubHudController.syncMediaButtons(activeNode, false);
      } else {
        SubHudController.syncMediaButtons(null, false);
      }
    }
  }

  function bindEvents() {
    const interactiveScrollSelector = '#chat-dock, .node-media-slot, .node-data-sheet, .z-scrubber, .seo-fallback-shell';

    window.addEventListener('wheel', (ev) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const targetEl = ev.target instanceof Element ? ev.target : null;
      if (targetEl && targetEl.closest(interactiveScrollSelector)) return;
      ev.preventDefault();

      const now = performance.now();
      if (now < state.modeSwitchLockUntil) return;

      const pixelDeltaY = ev.deltaMode === 1
        ? ev.deltaY * 32
        : (ev.deltaMode === 2 ? ev.deltaY * 320 : ev.deltaY);

      if (state.mode === 'OVERVIEW') {
        if (pixelDeltaY > 15) {
          goToStation(NODES[0].id, { historyMode: 'push' });
        }
        return;
      }

      if (Math.abs(pixelDeltaY) < 0.5) return;

      if (pixelDeltaY < -15 && state.activeNodeIndex === 0 && state.currentProgress <= 0.035 && !state.flightActive && !state.freeScrollRoaming) {
        if (state.wheelSnapTimer) clearTimeout(state.wheelSnapTimer);
        enterOverviewMode({ announceChat: true, immediate: false, historyMode: 'push' });
        return;
      }

      const baseProgress = state.freeScrollRoaming
        ? state.targetProgress
        : state.currentProgress;
      const rawDelta = pixelDeltaY * 0.00052;
      const deltaU = Math.max(-0.075, Math.min(0.075, rawDelta));
      const nextTargetU = Math.max(0, Math.min(1, baseProgress + deltaU));

      // Guard against boundary clamping (e.g., scrolling further down at station 12) or zero delta:
      // keep the current station's frame and tether undisturbed if we never leave the station.
      if (!state.freeScrollRoaming && !state.flightActive && Math.abs(nextTargetU - state.targetProgress) < 1e-6) {
        return;
      }

      hideTetherImmediately();
      setStageMoving(true);
      state.flightActive = false;
      state.freeScrollRoaming = true;
      state.scrollSnapCommitted = false;
      state.pendingArrivalNodeId = null;
      state.targetProgress = nextTargetU;

      const previewIdx = Math.round(nextTargetU * (NODES.length - 1));
      syncJourneyApproachingState(previewIdx, { keepDepartingId: state.activeNodeId });

      if (state.wheelSnapTimer) clearTimeout(state.wheelSnapTimer);
      state.wheelSnapTimer = setTimeout(() => {
        state.wheelSnapTimer = null;
        if (state.mode !== 'JOURNEY' || !state.freeScrollRoaming) return;
        const nearestIdx = Math.round(state.targetProgress * (NODES.length - 1));
        const stationU = NODES.length > 1 ? nearestIdx / (NODES.length - 1) : 0;
        state.targetProgress = stationU;
        state.scrollSnapCommitted = true;
        syncJourneyApproachingState(nearestIdx, { keepDepartingId: state.activeNodeId });
      }, 150);
    }, { passive: false });

    window.addEventListener('keydown', (ev) => {
      if (ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey) return;
      const targetEl = ev.target instanceof Element ? ev.target : null;
      if (targetEl && targetEl.closest('input, textarea, select, [contenteditable="true"]')) {
        return;
      }

      if (ev.key === 'Escape') {
        if (state.mode === 'JOURNEY') {
          ev.preventDefault();
          enterOverviewMode({ announceChat: true, immediate: false, historyMode: 'push' });
        }
        return;
      }

      if (targetEl && targetEl.closest('#chat-stream, .node-media-slot') && (ev.key === 'ArrowDown' || ev.key === 'ArrowUp')) {
        return;
      }

      if (ev.key === 'ArrowDown' || ev.key === 'ArrowRight' || ev.key === 'PageDown') {
        ev.preventDefault();
        stepJourney(1);
      } else if (ev.key === 'ArrowUp' || ev.key === 'ArrowLeft' || ev.key === 'PageUp') {
        ev.preventDefault();
        stepJourney(-1);
      } else if (ev.key === 'Home') {
        ev.preventDefault();
        goToStation(NODES[0].id, { historyMode: 'push' });
      } else if (ev.key === 'End') {
        ev.preventDefault();
        goToStation(NODES[NODES.length - 1].id, { historyMode: 'push' });
      }
    });

    window.addEventListener('pointermove', (ev) => {
      state.pointerX = (ev.clientX / window.innerWidth) * 2 - 1;
      state.pointerY = (ev.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    let activeTouchId = null;
    let touchStartY = 0;
    let touchStartX = 0;

    function resetTouchTracking() {
      activeTouchId = null;
      touchStartY = 0;
      touchStartX = 0;
    }

    window.addEventListener('touchstart', (ev) => {
      if (ev.touches.length !== 1) {
        resetTouchTracking();
        return;
      }
      const startEl = ev.target instanceof Element ? ev.target : null;
      if (startEl && startEl.closest(interactiveScrollSelector)) {
        resetTouchTracking();
        return;
      }
      const touch = ev.touches[0];
      activeTouchId = touch.identifier;
      touchStartY = touch.clientY;
      touchStartX = touch.clientX;
    }, { passive: true });

    window.addEventListener('touchcancel', resetTouchTracking, { passive: true });

    window.addEventListener('touchend', (ev) => {
      if (activeTouchId === null) return;
      if (ev.touches.length > 0) {
        resetTouchTracking();
        return;
      }
      let matched = null;
      for (let i = 0; i < ev.changedTouches.length; i++) {
        if (ev.changedTouches[i].identifier === activeTouchId) {
          matched = ev.changedTouches[i];
          break;
        }
      }
      const startY = touchStartY;
      const startX = touchStartX;
      resetTouchTracking();
      if (!matched) return;

      const endEl = ev.target instanceof Element ? ev.target : null;
      if (endEl && endEl.closest(interactiveScrollSelector)) return;

      const dy = startY - matched.clientY;
      const dx = startX - matched.clientX;
      if (Math.abs(dy) > 36 && Math.abs(dy) >= Math.abs(dx)) {
        stepJourney(dy > 0 ? 1 : -1);
      }
    }, { passive: true });

    const prevBtn = document.getElementById('btn-prev-node');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (state.mode === 'OVERVIEW') return;
        stepJourney(-1);
      });
    }

    const nextBtn = document.getElementById('btn-next-node');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => stepJourney(1));
    }

    const overviewBtn = document.getElementById('btn-overview-mode');
    if (overviewBtn) {
      overviewBtn.addEventListener('click', () => {
        enterOverviewMode({
          announceChat: true,
          immediate: false,
          historyMode: state.mode === 'OVERVIEW' ? 'none' : 'push'
        });
      });
    }

    const brandHomeTrigger = document.getElementById('brand-home-trigger');
    if (brandHomeTrigger) {
      brandHomeTrigger.addEventListener('click', (ev) => {
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
        ev.preventDefault();
        enterOverviewMode({
          announceChat: true,
          immediate: false,
          historyMode: state.mode === 'OVERVIEW' ? 'none' : 'push'
        });
      });
    }

    const chatActionBtn = document.getElementById('chat-action-btn');
    if (chatActionBtn) {
      chatActionBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (state.mode === 'OVERVIEW') {
          goToStation(NODES[0].id, { historyMode: 'push' });
        } else {
          toggleNodePrimaryAction(state.activeNodeId);
        }
      });
    }

    function applyHistoryLocation() {
      const targetLoc = resolveLocationState();
      if (targetLoc.mode === 'JOURNEY' && targetLoc.nodeIndex !== -1) {
        goToStation(NODES[targetLoc.nodeIndex].id, {
          announceChat: true,
          immediate: false,
          historyMode: 'none'
        });
      } else {
        enterOverviewMode({
          announceChat: true,
          immediate: false,
          historyMode: 'none'
        });
      }
    }

    window.addEventListener('popstate', applyHistoryLocation);

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      webglRenderer.setSize(window.innerWidth, window.innerHeight);
      cssRenderer.setSize(window.innerWidth, window.innerHeight);
      cardMetrics.dirty = true;
      if (state.mode === 'OVERVIEW') {
        updateOverviewCameraTargets(false);
      }
    });
  }

  function lerpScalar(a, b, t) {
    return a + (b - a) * t;
  }

  function getNodePortScreenCoords(item) {
    if (item && item.portRightEl) {
      const rect = item.portRightEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return {
          x: rect.left + rect.width * 0.5,
          y: rect.top + rect.height * 0.5
        };
      }
    }
    projVec.copy(item.cssObj.position);
    projVec.x += 160;
    projVec.project(camera);
    return {
      x: (projVec.x * 0.5 + 0.5) * window.innerWidth,
      y: (-projVec.y * 0.5 + 0.5) * window.innerHeight
    };
  }

  function isTargetCardAtStation(item) {
    if (!item) return false;
    if (state.mode === 'OVERVIEW') return !state.stageMoving;
    if (state.flightActive || state.freeScrollRoaming) return false;
    const expectedCamX = state.camTargetPos.x + state.smoothPointerX * 22;
    const camCloseZ = Math.abs(state.camPos.z - state.camTargetPos.z) <= 30;
    const camCloseX = Math.abs(state.camPos.x - expectedCamX) <= 30;
    const cardCloseZ = Math.abs(item.cssObj.position.z - item.targetPos.z) <= 30;
    const cardCloseX = Math.abs(item.cssObj.position.x - item.targetPos.x) <= 30;
    const cardCloseScale = Math.abs(item.cssObj.scale.x - item.targetScale) <= 0.016;
    return camCloseZ && camCloseX && cardCloseZ && cardCloseX && cardCloseScale;
  }

  function updateScreenTether(nowMs) {
    if (!chatDockEl && !subhudChassisEl) return;
    const chassisRect = (subhudChassisEl || chatDockEl).getBoundingClientRect();
    let ex = chassisRect.left;
    let ey = chassisRect.top + chassisRect.height * 0.5;
    if (chatPortLeftEl) {
      const leftRect = chatPortLeftEl.getBoundingClientRect();
      if (leftRect.width > 0) {
        ex = leftRect.left + leftRect.width * 0.5;
        ey = leftRect.top + leftRect.height * 0.5;
      }
    }

    if (state.mode === 'OVERVIEW') {
      if (overviewHubRingEl && overviewHubCoreEl) {
        overviewHubRingEl.setAttribute('cx', ex.toFixed(1));
        overviewHubRingEl.setAttribute('cy', ey.toFixed(1));
        overviewHubCoreEl.setAttribute('cx', ex.toFixed(1));
        overviewHubCoreEl.setAttribute('cy', ey.toFixed(1));
      }

      for (let i = 0; i < nodeDomItems.length; i++) {
        const item = nodeDomItems[i];
        const wire = overviewWireItems[i];
        if (!wire) continue;

        const portPt = getNodePortScreenCoords(item);
        const sx = portPt.x;
        const sy = portPt.y;

        const spanX = Math.max(54, Math.abs(ex - sx) * 0.46);
        const cx1 = sx + spanX;
        const cy1 = sy;
        const cx2 = ex - spanX;
        const cy2 = ey;

        const dStr = `M ${sx.toFixed(1)},${sy.toFixed(1)} C ${cx1.toFixed(1)},${cy1.toFixed(1)} ${cx2.toFixed(1)},${cy2.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`;
        wire.basePath.setAttribute('d', dStr);
        wire.portCircle.setAttribute('cx', sx.toFixed(1));
        wire.portCircle.setAttribute('cy', sy.toFixed(1));

        const isHighlighted = state.hoveredNodeIndex === i;
        wire.basePath.classList.toggle('is-highlighted', isHighlighted);
        wire.basePath.style.opacity = isHighlighted ? '0.88' : '0.42';
        wire.portCircle.style.opacity = isHighlighted ? '1' : '0.72';
      }
    }

    if (state.tether.phase === 'HIDDEN' || !state.tether.nodeId) {
      return;
    }

    const targetIdx = getNodeIndexById(state.tether.nodeId);
    const targetItem = targetIdx !== -1 ? nodeDomItems[targetIdx] : null;
    if (!targetItem) {
      hideTetherImmediately();
      return;
    }

    if (state.tether.phase === 'WAIT_CARD') {
      if (!isTargetCardAtStation(targetItem)) {
        return;
      }
      state.tether.phase = 'CONNECTING';
      state.tether.startTime = nowMs;
    }

    const portPt = getNodePortScreenCoords(targetItem);
    const sx = portPt.x;
    const sy = portPt.y;
    const spanX = state.mode === 'OVERVIEW'
      ? Math.max(54, Math.abs(ex - sx) * 0.46)
      : Math.max(48, Math.abs(ex - sx) * 0.48);
    const cx1 = sx + spanX;
    const cy1 = sy;
    const cx2 = ex - spanX;
    const cy2 = ey;

    let rawT = 1;
    if (state.tether.phase === 'CONNECTING') {
      rawT = Math.min(1, Math.max(0, (nowMs - state.tether.startTime) / TETHER_DURATION_MS));
      if (rawT >= 1) {
        state.tether.phase = 'CONNECTED';
      }
    }

    const u = rawT >= 1 ? 1 : (rawT * rawT * (3 - 2 * rawT));

    // Subdivide cubic Bezier [P0, P1, P2, P3] at parameter u via De Casteljau so the wire ends exactly at the oval
    const q0x = lerpScalar(sx, cx1, u);
    const q0y = lerpScalar(sy, cy1, u);
    const q1x = lerpScalar(cx1, cx2, u);
    const q1y = lerpScalar(cy1, cy2, u);
    const q2x = lerpScalar(cx2, ex, u);
    const q2y = lerpScalar(cy2, ey, u);

    const r0x = lerpScalar(q0x, q1x, u);
    const r0y = lerpScalar(q0y, q1y, u);
    const r1x = lerpScalar(q1x, q2x, u);
    const r1y = lerpScalar(q1y, q2y, u);

    const tipX = lerpScalar(r0x, r1x, u);
    const tipY = lerpScalar(r0y, r1y, u);

    if (tetherPathEl) {
      tetherPathEl.setAttribute(
        'd',
        `M ${sx.toFixed(1)},${sy.toFixed(1)} C ${q0x.toFixed(1)},${q0y.toFixed(1)} ${r0x.toFixed(1)},${r0y.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)}`
      );
      tetherPathEl.style.opacity = '0.94';
    }

    if (tetherAnchorEl) {
      tetherAnchorEl.setAttribute('cx', sx.toFixed(1));
      tetherAnchorEl.setAttribute('cy', sy.toFixed(1));
      tetherAnchorEl.style.opacity = '1';
    }

    if (state.tether.phase === 'CONNECTING') {
      const dx = r1x - r0x;
      const dy = r1y - r0y;
      const angleDeg = (Math.abs(dx) + Math.abs(dy) > 0.001)
        ? Math.atan2(dy, dx) * (180 / Math.PI)
        : Math.atan2(cy1 - sy, cx1 - sx) * (180 / Math.PI);
      const morph = Math.sin(Math.PI * u);
      const scaleX = 1 + 2.45 * morph;
      const scaleY = 1 - 0.38 * morph;

      if (tetherCapsuleGroupEl) {
        tetherCapsuleGroupEl.setAttribute(
          'transform',
          `translate(${tipX.toFixed(1)}, ${tipY.toFixed(1)}) rotate(${angleDeg.toFixed(1)}) scale(${scaleX.toFixed(2)}, ${scaleY.toFixed(2)})`
        );
        tetherCapsuleGroupEl.style.opacity = '1';
      }
      if (tetherElbowEl) {
        tetherElbowEl.style.opacity = '0';
      }
    } else {
      if (tetherCapsuleGroupEl) {
        tetherCapsuleGroupEl.style.opacity = '0';
      }
      if (tetherElbowEl) {
        tetherElbowEl.setAttribute('cx', ex.toFixed(1));
        tetherElbowEl.setAttribute('cy', ey.toFixed(1));
        tetherElbowEl.style.opacity = '1';
      }
    }
  }

  function rectsOverlap(a, b, pad = 0) {
    return !(
      a.right + pad <= b.left ||
      a.left - pad >= b.right ||
      a.bottom + pad <= b.top ||
      a.top - pad >= b.bottom
    );
  }

  // Camera NDC projection pattern adapted from Three.js r128 CSS2DRenderer / css2d_label.html (MIT)
  function projectCardLocalPoint(cssObj, lx, ly, lz, vw, vh) {
    labelProjVec.set(lx, ly, lz).applyMatrix4(cssObj.matrixWorld);
    labelProjVec.project(camera);
    return {
      x: (labelProjVec.x * 0.5 + 0.5) * vw,
      y: (-labelProjVec.y * 0.5 + 0.5) * vh,
      z: labelProjVec.z
    };
  }

  function syncCardMetrics() {
    const sampleEl = nodeDomItems[0] && nodeDomItems[0].el;
    if (!sampleEl) return;
    const w = sampleEl.offsetWidth;
    const h = sampleEl.offsetHeight;
    if (w > 0 && h > 0) {
      cardMetrics.halfW = w * 0.5;
      cardMetrics.halfH = h * 0.5;
      cardMetrics.labelLocalY = -(cardMetrics.halfH + OVERVIEW_LABEL_OFFSET_LOCAL);
      cardMetrics.dirty = false;
    }
  }

  function updateOverviewLabels() {
    if (state.mode !== 'OVERVIEW' || !overviewLabelsLayerEl || overviewLabelItems.length === 0) {
      return;
    }

    if (cardMetrics.dirty) {
      syncCardMetrics();
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isDesktop = vw > 1024;

    const topRect = topBarEl ? topBarEl.getBoundingClientRect() : null;
    const scrubRect = scrubberEl ? scrubberEl.getBoundingClientRect() : null;
    const chatRect = chatDockEl ? chatDockEl.getBoundingClientRect() : null;

    let topBound = topRect ? topRect.bottom + 4 : 60;
    let leftBound = 8;
    if (scrubRect && scrubRect.width > 0 && scrubRect.height > 0) {
      if (isDesktop) {
        leftBound = scrubRect.right + 8;
      } else {
        topBound = Math.max(topBound, scrubRect.bottom + 4);
      }
    }
    const rightBound = (isDesktop && chatRect && chatRect.width > 0)
      ? Math.max(leftBound + 120, chatRect.left - 10)
      : vw - 8;

    const priorityIdx = state.stageMoving ? -1 : state.hoveredNodeIndex;
    syncOverviewLabelTyping(priorityIdx);

    const projected = new Array(nodeDomItems.length);
    for (let i = 0; i < nodeDomItems.length; i++) {
      const item = nodeDomItems[i];
      const settledInOverview =
        Math.abs(item.cssObj.position.z - item.targetPos.z) <= 180 &&
        item.cssObj.scale.x <= 0.34;

      if (!settledInOverview) {
        projected[i] = null;
        continue;
      }

      const bottomPt = projectCardLocalPoint(item.cssObj, 0, cardMetrics.labelLocalY, 0, vw, vh);
      if (bottomPt.z > 1) {
        projected[i] = null;
        continue;
      }

      const tl = projectCardLocalPoint(item.cssObj, -cardMetrics.halfW, cardMetrics.halfH, 0, vw, vh);
      const br = projectCardLocalPoint(item.cssObj, cardMetrics.halfW, -cardMetrics.halfH, 0, vw, vh);
      projected[i] = {
        anchorX: bottomPt.x,
        anchorY: bottomPt.y + OVERVIEW_LABEL_GAP_PX,
        cardRect: {
          left: Math.min(tl.x, br.x) - 2,
          right: Math.max(tl.x, br.x) + 2,
          top: Math.min(tl.y, br.y) - 2,
          bottom: Math.max(tl.y, br.y) + 2
        }
      };
    }

    // Derive resting label max-width from projected horizontal column spacing (node 01 vs node 02)
    if (projected[1] && projected[2]) {
      const colPitch = Math.abs(projected[2].anchorX - projected[1].anchorX);
      const nextMaxW = Math.max(104, Math.min(216, Math.floor(colPitch - 12)));
      if (Math.abs(nextMaxW - lastOverviewLabelMaxW) >= 2) {
        lastOverviewLabelMaxW = nextMaxW;
        overviewLabelsLayerEl.style.setProperty('--ov-label-max-w', `${nextMaxW}px`);
      }
    }

    // Apply priority class first so measured offsetWidth/offsetHeight reflect full expanded title
    for (let i = 0; i < overviewLabelItems.length; i++) {
      overviewLabelItems[i].el.classList.toggle('is-priority', i === priorityIdx);
    }

    const placedRects = [];
    const order = [];
    if (priorityIdx !== -1 && projected[priorityIdx]) {
      order.push(priorityIdx);
    }
    for (let i = 0; i < overviewLabelItems.length; i++) {
      if (i !== priorityIdx) order.push(i);
    }

    for (let k = 0; k < order.length; k++) {
      const i = order[k];
      const labelEntry = overviewLabelItems[i];
      const p = projected[i];
      if (!labelEntry || !p) {
        if (labelEntry) {
          labelEntry.el.classList.remove('is-visible', 'is-priority');
          labelEntry.el.classList.add('is-occluded');
        }
        continue;
      }

      const w = labelEntry.el.offsetWidth;
      const h = labelEntry.el.offsetHeight;
      if (w <= 0 || h <= 0) continue;
      const isPriority = i === priorityIdx;

      const minLeft = leftBound;
      const maxLeft = Math.max(minLeft, (isPriority ? vw - 10 : rightBound) - w);
      const left = Math.max(minLeft, Math.min(maxLeft, p.anchorX - w * 0.5));
      let top = p.anchorY;
      if (isPriority && top + h > vh - 8) {
        top = Math.max(topBound, vh - 8 - h);
      }

      const rect = {
        left,
        right: left + w,
        top,
        bottom: top + h
      };

      let occluded = false;
      if (!isPriority) {
        if (rect.top < topBound || rect.bottom > vh - 4) {
          occluded = true;
        }
        if (!occluded && chatRect && chatRect.width > 0 && rectsOverlap(rect, chatRect, 4)) {
          occluded = true;
        }
        if (!occluded) {
          for (let pIdx = 0; pIdx < placedRects.length; pIdx++) {
            if (rectsOverlap(rect, placedRects[pIdx], 4)) {
              occluded = true;
              break;
            }
          }
        }
        if (!occluded) {
          for (let j = 0; j < projected.length; j++) {
            if (j !== i && projected[j] && rectsOverlap(rect, projected[j].cardRect, 2)) {
              occluded = true;
              break;
            }
          }
        }
      }

      labelEntry.el.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
      labelEntry.el.classList.toggle('is-visible', !occluded);
      labelEntry.el.classList.toggle('is-occluded', occluded);

      if (!occluded) {
        placedRects.push(rect);
      }
    }
  }

  function tick(nowMs) {
    requestAnimationFrame(tick);
    const now = nowMs || performance.now();
    const dtMs = lastTickMs > 0 ? Math.min(80, Math.max(4, now - lastTickMs)) : 16.667;
    lastTickMs = now;
    const dtFrames = dtMs / 16.667;
    const isActivelyTraveling = state.flightActive || state.freeScrollRoaming || state.stageMoving;
    const lerpAlpha = 1 - Math.pow(1 - (isActivelyTraveling ? 0.115 : 0.088), dtFrames);
    const camLerpAlpha = 1 - Math.pow(1 - (isActivelyTraveling ? 0.135 : 0.092), dtFrames);
    const ptrAlpha = 1 - Math.pow(1 - 0.065, dtFrames);
    const timeSec = now * 0.001;

    state.smoothPointerX += (state.pointerX - state.smoothPointerX) * ptrAlpha;
    state.smoothPointerY += (state.pointerY - state.smoothPointerY) * ptrAlpha;

    if (state.mode === 'JOURNEY') {
      if (state.flightActive) {
        const elapsed = now - state.flightStartTime;
        const T = state.flightDuration;
        const tau = Math.min(1, Math.max(0, elapsed / T));
        const p0 = state.flightStartU;
        const p1 = state.flightTargetU;
        const m0 = state.flightStartVel * T;

        if (Math.abs(m0) < 0.0005) {
          // Immediate liftoff ease-out cubic from rest (eliminates sluggish departure dead-zone)
          const inv = 1 - tau;
          const eased = 1 - inv * inv * inv;
          state.currentProgress = p0 + (p1 - p0) * eased;
          state.progressVel = (3 * inv * inv * (p1 - p0)) / T;
        } else {
          // C1 Hermite curve when chaining mid-flight for smooth velocity continuity
          const tau2 = tau * tau;
          const tau3 = tau2 * tau;
          const h00 = 2 * tau3 - 3 * tau2 + 1;
          const h10 = tau3 - 2 * tau2 + tau;
          const h01 = -2 * tau3 + 3 * tau2;
          state.currentProgress = h00 * p0 + h10 * m0 + h01 * p1;

          const dh00 = 6 * tau2 - 6 * tau;
          const dh10 = 3 * tau2 - 4 * tau + 1;
          const dh01 = -6 * tau2 + 6 * tau;
          state.progressVel = (dh00 * p0 + dh10 * m0 + dh01 * p1) / T;
        }

        if (tau >= 1) {
          state.currentProgress = p1;
          state.progressVel = 0;
          state.flightActive = false;
        }
      } else if (state.freeScrollRoaming) {
        // Single-beat continuous ease-out scroll glide (moves on frame 1, glides directly into station snap)
        const scrollAlpha = 1 - Math.pow(1 - 0.145, dtFrames);
        const prevU = state.currentProgress;
        state.currentProgress += (state.targetProgress - state.currentProgress) * scrollAlpha;
        state.progressVel = (state.currentProgress - prevU) / Math.max(1, dtMs);
      }

      const u = Math.max(0, Math.min(1, state.currentProgress));
      cameraSpline.getPointAt(u, state.camTargetPos);
      lookSpline.getPointAt(u, state.lookAtTarget);
    }

    const isJourney = state.mode === 'JOURNEY';
    const camParallaxX = isJourney ? state.smoothPointerX * 22 : state.smoothPointerX * 16;
    const camParallaxY = isJourney ? -state.smoothPointerY * 15 : -state.smoothPointerY * 11;
    const lookParallaxX = isJourney ? state.smoothPointerX * 8 : state.smoothPointerX * 6;
    const lookParallaxY = isJourney ? -state.smoothPointerY * 6 : -state.smoothPointerY * 4;

    state.camPos.x += (state.camTargetPos.x + camParallaxX - state.camPos.x) * camLerpAlpha;
    state.camPos.y += (state.camTargetPos.y + camParallaxY - state.camPos.y) * camLerpAlpha;
    state.camPos.z += (state.camTargetPos.z - state.camPos.z) * camLerpAlpha;

    state.lookAtPos.x += (state.lookAtTarget.x + lookParallaxX - state.lookAtPos.x) * camLerpAlpha;
    state.lookAtPos.y += (state.lookAtTarget.y + lookParallaxY - state.lookAtPos.y) * camLerpAlpha;
    state.lookAtPos.z += (state.lookAtTarget.z - state.lookAtPos.z) * camLerpAlpha;

    camera.position.copy(state.camPos);
    camera.lookAt(state.lookAtPos);

    const globalYaw = state.smoothPointerX * (isJourney ? 0.055 : 0.036);
    const globalPitch = -state.smoothPointerY * (isJourney ? 0.034 : 0.022);

    for (let i = 0; i < nodeDomItems.length; i++) {
      const item = nodeDomItems[i];
      const bobY = Math.sin(timeSec * 0.85 + i * 0.9) * 2.0;
      const bobX = Math.cos(timeSec * 0.65 + i * 1.1) * 1.0;
      const bobRz = Math.sin(timeSec * 0.72 + i * 0.7) * 0.002;

      item.cssObj.position.x += (item.targetPos.x + bobX - item.cssObj.position.x) * lerpAlpha;
      item.cssObj.position.y += (item.targetPos.y + bobY - item.cssObj.position.y) * lerpAlpha;
      item.cssObj.position.z += (item.targetPos.z - item.cssObj.position.z) * lerpAlpha;

      item.cssObj.rotation.y += (item.targetRy + globalYaw - item.cssObj.rotation.y) * lerpAlpha;
      item.cssObj.rotation.x += (globalPitch - item.cssObj.rotation.x) * lerpAlpha;
      item.cssObj.rotation.z = bobRz;

      const nextScale = item.cssObj.scale.x + (item.targetScale - item.cssObj.scale.x) * lerpAlpha;
      item.cssObj.scale.setScalar(nextScale);

      if (isJourney) {
        const behindCam = item.cssObj.position.z > camera.position.z - 140;
        item.el.classList.toggle('is-behind-cam', behindCam);
        if (behindCam && item.el.classList.contains('is-arrived')) {
          item.el.classList.remove('is-arrived', 'is-arriving-pulse');
        }
      }
    }

    // Synchronized arrival trigger (runs ONLY once camera + card actually arrive at destination)
    if (isJourney) {
      if (state.freeScrollRoaming && state.scrollSnapCommitted && !state.wheelSnapTimer) {
        const uDiff = Math.abs(state.targetProgress - state.currentProgress);
        const camDiffZ = Math.abs(state.camTargetPos.z - state.camPos.z);
        if (uDiff <= 0.0014 && camDiffZ <= 26) {
          state.currentProgress = state.targetProgress;
          state.progressVel = 0;
          const settledIdx = Math.round(state.targetProgress * (NODES.length - 1));
          commitFreeScrollArrival(settledIdx);
        }
      } else if (state.pendingArrivalNodeId) {
        const pendingIdx = getNodeIndexById(state.pendingArrivalNodeId);
        const pendingItem = pendingIdx !== -1 ? nodeDomItems[pendingIdx] : null;
        if (pendingItem && isTargetCardAtStation(pendingItem)) {
          triggerStationArrival(pendingItem.node.id, { playFx: state.pendingArrivalPlayFx });
        }
      }
    } else if (state.stageMoving) {
      const firstCard = nodeDomItems[0];
      const camSettled = Math.abs(state.camPos.z - state.camTargetPos.z) <= 36;
      const cardsSettled = !firstCard || firstCard.cssObj.scale.x <= 0.285;
      if (camSettled && cardsSettled) {
        setStageMoving(false);
        if (state.hoveredNodeIndex !== -1 && NODES[state.hoveredNodeIndex]) {
          syncOverviewLabelTyping(state.hoveredNodeIndex);
          startTetherConnection(NODES[state.hoveredNodeIndex].id);
        }
      }
    }

    if (chatDockEl) {
      const subBobY = Math.sin(timeSec * 0.85 + state.activeNodeIndex * 0.9 + 1.4) * 1.8;
      const subBobX = Math.cos(timeSec * 0.65 + state.activeNodeIndex * 1.1 + 1.4) * 0.9;
      const subTx = -state.smoothPointerX * 6.5 + subBobX;
      const subTy = -state.smoothPointerY * 4.5 + subBobY;
      const subRy = state.smoothPointerX * 2.4;
      const subRx = -state.smoothPointerY * 1.6;
      const subBx = -10 + state.smoothPointerX * 5.0;
      const subBy = 8 + state.smoothPointerY * 4.0;
      chatDockEl.style.setProperty('--sub-tx', `${subTx.toFixed(2)}px`);
      chatDockEl.style.setProperty('--sub-ty', `${subTy.toFixed(2)}px`);
      chatDockEl.style.setProperty('--sub-ry', `${subRy.toFixed(2)}deg`);
      chatDockEl.style.setProperty('--sub-rx', `${subRx.toFixed(2)}deg`);
      chatDockEl.style.setProperty('--sub-bx', `${subBx.toFixed(2)}px`);
      chatDockEl.style.setProperty('--sub-by', `${subBy.toFixed(2)}px`);
    }

    if (corridorGroup) {
      const envTargetX = -state.smoothPointerX * (isJourney ? 16 : 12);
      const envTargetY = state.smoothPointerY * (isJourney ? 10 : 8);
      corridorGroup.position.x += (envTargetX - corridorGroup.position.x) * 0.055;
      corridorGroup.position.y += (envTargetY - corridorGroup.position.y) * 0.055;
    }

    const targetTunnelAlpha = isJourney ? 1.0 : 0.0;
    const tunnelLerp = 1 - Math.pow(1 - 0.055, dtFrames);
    state.tunnelAlpha += (targetTunnelAlpha - state.tunnelAlpha) * tunnelLerp;
    for (let i = 0; i < tunnelMaterials.length; i++) {
      const entry = tunnelMaterials[i];
      entry.mat.opacity = entry.baseOpacity * state.tunnelAlpha;
    }

    if (galaxyGroup) {
      const galX = -state.smoothPointerX * (isJourney ? 22 : 18) + Math.sin(timeSec * 0.28) * 14;
      const galY = state.smoothPointerY * (isJourney ? 15 : 12) + Math.cos(timeSec * 0.22) * 10;
      galaxyGroup.position.x += (galX - galaxyGroup.position.x) * 0.05;
      galaxyGroup.position.y += (galY - galaxyGroup.position.y) * 0.05;
      galaxyGroup.rotation.z = Math.sin(timeSec * 0.12) * 0.035;
    }
    if (sparkleMeshA) {
      sparkleMeshA.material.opacity = 0.36 + 0.48 * (0.5 + 0.5 * Math.sin(timeSec * 2.2));
      sparkleMeshA.position.y = Math.sin(timeSec * 0.45) * 8;
    }
    if (sparkleMeshB) {
      sparkleMeshB.material.opacity = 0.30 + 0.46 * (0.5 + 0.5 * Math.cos(timeSec * 1.75 + 1.1));
      sparkleMeshB.position.x = Math.cos(timeSec * 0.38) * 8;
    }

    if (pulsePointsMesh && signalSpline && state.tunnelAlpha > 0.01) {
      pulseProgress = (pulseProgress + 0.0007) % 1;
      const posAttr = pulsePointsMesh.geometry.attributes.position;
      const count = posAttr.count;
      for (let i = 0; i < count; i++) {
        const t = (pulseProgress + i / count) % 1;
        const pt = signalSpline.getPointAt(t);
        posAttr.setXYZ(i, pt.x, pt.y, pt.z);
      }
      posAttr.needsUpdate = true;
    }

    webglRenderer.render(scene, camera);
    cssRenderer.render(cssScene, camera);
    updateScreenTether(now);
    if (!isJourney) {
      updateOverviewLabels();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.SceneEngine = {
    enterOverviewMode,
    goToStation,
    stepJourney
  };
})(window);
