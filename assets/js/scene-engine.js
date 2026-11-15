/* =========================================================================
   MINATO MAKOTO — PRODUCTION 3D HYBRID SCENE ENGINE (window.SceneEngine)
   Architecture:
   - Shared PerspectiveCamera across THREE.WebGLRenderer & THREE.CSS3DRenderer
   - Persistent Right-Side Sub-HUD Across Both OVERVIEW & JOURNEY Modes
   - Vertical Staggered 2-Column Node Constellation in OVERVIEW Mode
   - Continuous Global Mouse-Tracking Tilt (Zero Boundary Shake)
   - Z-Invariant Corridor Parallax (Uniform Comfort from Node 00 to Node 12)
   - Dreamina-Style Stretched Comet Trail + Tangent-Aligned Oval Data Capsule
   ========================================================================= */
(function (global) {
  'use strict';

  const { CAM_STATION_DIST, NODES, buildPosterSVG } = global.PortfolioData;
  const TextFX = global.TextFX;
  const SubHudController = global.SubHudController;

  const state = {
    mode: 'OVERVIEW',
    activeNodeIndex: 0,
    hoveredNodeIndex: -1,
    targetProgress: 0,
    currentProgress: 0,
    progressVel: 0,
    flightStartU: 0,
    flightTargetU: 0,
    flightStartVel: 0,
    flightStartTime: 0,
    flightDuration: 920,
    flightActive: false,
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
    playingNodeIndex: -1,
    tunnelAlpha: 0
  };

  let scene, cssScene, camera, webglRenderer, cssRenderer;
  let signalSpline, cameraSpline, lookSpline, corridorGroup, dustParticlesMesh;
  let galaxyGroup = null;
  let sparkleMeshA = null;
  let sparkleMeshB = null;
  const tunnelMaterials = [];
  const nodeDomItems = [];
  const overviewWireItems = [];
  let overviewHubRingEl = null;
  let overviewHubCoreEl = null;
  const stopButtons = [];
  let pulsePointsMesh = null;
  let pulseProgress = 0;
  let lastTickMs = 0;

  let projVec = null;
  let tetherBaseEl, tetherPathEl, tetherCometEl, tetherAnchorEl, tetherElbowEl, tetherPulseEl;
  let tetherCapsuleGroupEl, chatDockEl, subhudChassisEl;
  let chatPortLeftEl, zPosEl, a11yLiveEl, compassDeckEl, compassReadoutEl;

  function announceA11y(msg) {
    if (a11yLiveEl) a11yLiveEl.textContent = msg;
  }

  function syncUrlHash() {
    const hash = state.mode === 'OVERVIEW'
      ? '#overview'
      : `#${NODES[state.activeNodeIndex].id}`;
    if (window.location.hash !== hash) {
      try {
        history.replaceState(null, '', hash);
      } catch {
        window.location.hash = hash;
      }
    }
  }

  // Calmer, weighted Hermite flight curve (900ms - 1360ms default)
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
    state.flightDuration = customDuration || Math.round(Math.min(1360, Math.max(900, 820 + dist * 1300)));
    state.flightActive = true;
  }

  function init() {
    const canvas = document.getElementById('webgl-layer');
    const cssRoot = document.getElementById('css3d-layer');

    tetherBaseEl = document.getElementById('tether-path-base');
    tetherPathEl = document.getElementById('tether-path');
    tetherCometEl = document.getElementById('tether-comet-trail');
    tetherAnchorEl = document.getElementById('tether-anchor');
    tetherElbowEl = document.getElementById('tether-elbow');
    tetherPulseEl = document.getElementById('tether-pulse');
    tetherCapsuleGroupEl = document.getElementById('tether-capsule-group');
    chatDockEl = document.getElementById('chat-dock');
    subhudChassisEl = document.getElementById('subhud-chassis');
    chatPortLeftEl = document.getElementById('chat-port-left');
    zPosEl = document.getElementById('hud-z-pos');
    a11yLiveEl = document.getElementById('a11y-live');
    compassDeckEl = document.getElementById('header-compass-deck');
    compassReadoutEl = document.getElementById('compass-readout');

    projVec = new THREE.Vector3();

    camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 10, 16000);
    state.camPos = new THREE.Vector3(175, 0, 1620);
    state.camTargetPos = new THREE.Vector3(175, 0, 1620);
    state.lookAtPos = new THREE.Vector3(160, 0, -30);
    state.lookAtTarget = new THREE.Vector3(160, 0, -30);

    webglRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
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

    // Parse initial deep-link hash if present, else boot into Overview
    const rawHash = (window.location.hash || '').replace(/^#/, '');
    const parts = rawHash.split('/');
    const targetId = parts[parts.length - 1];
    const foundNodeIdx = NODES.findIndex(n => n.id === targetId);
    if (foundNodeIdx !== -1) {
      enterJourneyAtNode(foundNodeIdx, true, true);
    } else {
      enterOverviewMode(true, true);
    }

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

    // Calibrated camera offset (+98 X / +90 lookX) so the enlarged 690x444 Main Node HUD expands rightward
    // to sit ~40px from the enlarged Sub-HUD without overlapping
    const camWaypoints = NODES.map(n => new THREE.Vector3(n.journeyPos.x + 98, n.journeyPos.y + 2, n.journeyPos.z + CAM_STATION_DIST));
    const lookWaypoints = NODES.map(n => new THREE.Vector3(n.journeyPos.x + 90, n.journeyPos.y - 2, n.journeyPos.z));
    cameraSpline = new THREE.CatmullRomCurve3(camWaypoints);
    lookSpline = new THREE.CatmullRomCurve3(lookWaypoints);

    const curvePts = signalSpline.getPoints(390);

    // 3D Tunnel Materials start at opacity 0 in OVERVIEW and smoothly transition up in JOURNEY
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

    // Floating, Sparkling Galaxy Starfield (Always visible against the deep black background in Overview & Journey)
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

  function buildFloatingHUDNodes() {
    const overviewGroup = document.getElementById('overview-wires-group');
    const svgNS = 'http://www.w3.org/2000/svg';

    NODES.forEach((node, idx) => {
      const el = document.createElement('article');
      el.className = 'hud-node';
      el.dataset.index = String(idx);
      el.setAttribute('aria-label', `Node ${node.code}: ${node.title}`);

      // Note: .node-port-socket.port-right is placed directly on .node-layer-core
      // so it sits on the exact right edge of the Node HUD card (zero inner/outer offset).
      // .node-layer-frame includes 4 corners (.hud-corner) + 4 edge calipers (.hud-edge)
      // for hover expand/retract & glow choreography.
      el.innerHTML = `
        <div class="node-rig">
          <div class="node-layer-back" aria-hidden="true">
            <span class="node-ghost-index">${node.code}</span>
            <div class="node-depth-ruler">
              <span>+1</span>
              <span>00</span>
              <span>-1</span>
            </div>
          </div>

          <div class="node-layer-core">
            <div class="node-visual-poster">${buildPosterSVG(node, idx)}</div>
            <div class="node-scan-beam" aria-hidden="true"></div>
            <div class="node-shimmer" aria-hidden="true"></div>
            <div class="node-media-slot" data-slot="${idx}"></div>
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
              <span class="node-tally"><i class="node-tally-dot"></i><span data-text-fx="telemetry">NODE_${node.code} // ${node.year}</span></span>
              <span data-text-fx="telemetry">Z:${node.journeyPos.z}m</span>
            </div>
          </div>

          <div class="node-layer-front">
            <div class="node-header-meta">
              <span class="node-cat-badge" data-text-fx="typewriter">${node.category}</span>
              <span class="node-coords-tag" data-text-fx="telemetry">${node.client.split('·')[0].trim()}</span>
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
              <span class="reticle-lock-label" data-text-fx="cipher">FOCUS // ${node.code}</span>
            </div>

            <div class="node-caption-deck">
              <div>
                <h2 class="node-title-main" data-text-fx="cipher">${node.title}</h2>
                <div class="node-role-sub" data-text-fx="stagger">${node.role}</div>
              </div>
              <span class="node-action-hint" data-text-fx="typewriter">${node.mediaType === 'sheet' ? 'DATA SHEET' : 'STREAM'}</span>
            </div>
          </div>
        </div>
      `;

      const portRightEl = el.querySelector('.node-port-socket.port-right');

      if (overviewGroup) {
        const basePath = document.createElementNS(svgNS, 'path');
        basePath.setAttribute('class', 'overview-wire-base');
        basePath.setAttribute('d', 'M0,0 L0,0');

        const flowPath = document.createElementNS(svgNS, 'path');
        flowPath.setAttribute('class', 'overview-wire-flow');
        flowPath.setAttribute('d', 'M0,0 L0,0');

        const cometPath = document.createElementNS(svgNS, 'path');
        cometPath.setAttribute('class', 'overview-wire-comet');
        cometPath.setAttribute('pathLength', '1000');
        cometPath.setAttribute('d', 'M0,0 L0,0');

        const portCircle = document.createElementNS(svgNS, 'circle');
        portCircle.setAttribute('class', 'overview-node-port');
        portCircle.setAttribute('r', '3.5');

        overviewGroup.appendChild(basePath);
        overviewGroup.appendChild(flowPath);
        overviewGroup.appendChild(cometPath);
        overviewGroup.appendChild(portCircle);
        overviewWireItems.push({ basePath, flowPath, cometPath, portCircle });
      }

      // Hover only triggers visual animations (TextFX + CSS 4-corner/4-edge shape expansion);
      // 3D mouse-tracking tilt is always active globally in tick() so the card never shakes!
      el.addEventListener('pointerenter', () => {
        state.hoveredNodeIndex = idx;
        TextFX.triggerWithin(el);
      });

      el.addEventListener('pointerleave', () => {
        if (state.hoveredNodeIndex === idx) state.hoveredNodeIndex = -1;
      });

      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (state.mode === 'OVERVIEW' || state.activeNodeIndex !== idx) {
          enterJourneyAtNode(idx, true, false);
        } else {
          triggerNodePrimaryAction(idx);
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
    NODES.forEach((node, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'z-stop-btn';
      btn.innerHTML = `<span class="stop-idx">${node.code}</span><span class="stop-name">${node.title}</span>`;
      btn.addEventListener('click', () => enterJourneyAtNode(idx, true, false));
      list.appendChild(btn);
      stopButtons.push(btn);
    });
  }

  function subHudActions() {
    return {
      onSelectNode: (idx) => enterJourneyAtNode(idx, true, false),
      onTriggerPrimary: (idx) => triggerNodePrimaryAction(idx)
    };
  }

  function enterOverviewMode(announceChat = true, immediate = false) {
    if (state.playingNodeIndex !== -1) {
      stopNodeVideo(state.playingNodeIndex);
    }
    state.mode = 'OVERVIEW';
    state.flightActive = false;
    state.progressVel = 0;
    state.modeSwitchLockUntil = performance.now() + 750;

    const modeLabelEl = document.getElementById('hud-mode-label');
    if (modeLabelEl) modeLabelEl.textContent = 'CONSTELLATION OVERVIEW';
    document.getElementById('scrubber-readout').textContent = 'OVERVIEW (13 NODES)';
    document.getElementById('btn-overview-mode').classList.add('is-overview-active');
    if (compassReadoutEl) {
      compassReadoutEl.textContent = 'WITNESS π.3.14 // 13 NODES SYNCED';
    }

    nodeDomItems.forEach((item) => {
      item.targetPos.set(item.node.overviewPos.x, item.node.overviewPos.y, item.node.overviewPos.z);
      item.targetRy = item.node.overviewPos.ry;
      item.targetScale = 0.26;
      item.el.classList.remove('is-active', 'is-distant', 'is-passed', 'is-behind-cam');
    });

    stopButtons.forEach((btn) => {
      btn.classList.remove('is-current');
    });

    // Camera framed closer (Z=1620) so the 3-Column Constellation fills the Left-Center stage with larger nodes
    const isDesktop = window.innerWidth > 1024;
    state.camTargetPos.set(isDesktop ? 175 : 0, 0, isDesktop ? 1620 : 2500);
    state.lookAtTarget.set(isDesktop ? 160 : 0, 0, -30);

    syncUrlHash();
    announceA11y('Chế độ Toàn cảnh 13 Node HUD.');

    document.body.setAttribute('data-mode', 'OVERVIEW');
    if (announceChat) {
      SubHudController.runSubHudTransition(
        () => {
          SubHudController.populateOverviewContent(subHudActions());
        },
        { isOverview: true, code: 'BUS_13' },
        immediate
      );
    }
  }

  function enterJourneyAtNode(idx, announceChat = true, immediate = false) {
    const clamped = Math.max(0, Math.min(NODES.length - 1, idx));
    if (state.playingNodeIndex !== -1 && state.playingNodeIndex !== clamped) {
      stopNodeVideo(state.playingNodeIndex);
    }

    const wasOverview = state.mode === 'OVERVIEW';
    const prevIdx = state.activeNodeIndex;
    state.mode = 'JOURNEY';
    state.activeNodeIndex = clamped;
    state.modeSwitchLockUntil = performance.now() + 750;

    const modeLabelEl = document.getElementById('hud-mode-label');
    if (modeLabelEl) modeLabelEl.textContent = 'Z-AXIS JOURNEY';
    document.getElementById('btn-overview-mode').classList.remove('is-overview-active');

    nodeDomItems.forEach((item, i) => {
      item.targetPos.set(item.node.journeyPos.x, item.node.journeyPos.y, item.node.journeyPos.z);
      item.targetRy = i === clamped ? 0.12 : item.node.journeyPos.ry;
      item.targetScale = 0.448;
    });

    const targetU = clamped / (NODES.length - 1);
    if (wasOverview || immediate) {
      state.currentProgress = targetU;
      state.targetProgress = targetU;
      state.progressVel = 0;
      state.flightActive = false;
      if (immediate) {
        cameraSpline.getPointAt(targetU, state.camTargetPos);
        lookSpline.getPointAt(targetU, state.lookAtTarget);
        state.camPos.copy(state.camTargetPos);
        state.lookAtPos.copy(state.lookAtTarget);
        nodeDomItems.forEach((item) => {
          item.cssObj.position.copy(item.targetPos);
          item.cssObj.rotation.y = item.targetRy;
          item.cssObj.scale.setScalar(item.targetScale);
        });
      }
    } else {
      launchProgressFlight(targetU);
    }

    syncJourneyNodeStates();
    syncUrlHash();
    const targetNode = NODES[clamped];
    announceA11y(`Trạm ${targetNode.code}: ${targetNode.title}`);

    if (nodeDomItems[clamped]) {
      TextFX.triggerWithin(nodeDomItems[clamped].el);
    }

    document.body.setAttribute('data-mode', 'JOURNEY');
    if (announceChat || wasOverview || prevIdx !== clamped) {
      SubHudController.runSubHudTransition(
        () => {
          SubHudController.populateNodeContent(clamped, state.playingNodeIndex, subHudActions());
        },
        {
          isOverview: false,
          code: targetNode.code,
          z: targetNode.journeyPos.z,
          cat: targetNode.category.split('//')[0].trim(),
          year: targetNode.year
        },
        immediate
      );
    }
  }

  function syncJourneyNodeStates() {
    const activeIdx = state.activeNodeIndex;
    nodeDomItems.forEach((item, idx) => {
      if (state.mode === 'JOURNEY') {
        item.targetRy = idx === activeIdx ? 0.12 : item.node.journeyPos.ry;
        item.el.classList.toggle('is-active', idx === activeIdx);
        item.el.classList.toggle('is-distant', idx > activeIdx);
        item.el.classList.toggle('is-passed', idx < activeIdx);
      }
    });

    stopButtons.forEach((btn, idx) => {
      btn.classList.toggle('is-current', state.mode === 'JOURNEY' && idx === activeIdx);
    });

    const n = NODES[activeIdx];
    document.getElementById('scrubber-readout').textContent = `${n.code} / 12 · Z:${n.journeyPos.z}m`;
    if (compassReadoutEl) {
      compassReadoutEl.textContent = `LOCK // NODE_${n.code} · Z:${n.journeyPos.z}m`;
    }
    const pct = (activeIdx / (NODES.length - 1)) * 100;
    document.getElementById('z-progress-fill').style.height = `${pct.toFixed(1)}%`;
  }

  function stepJourney(dir) {
    // Requirement 6: In OVERVIEW mode, PREV (dir < 0) is intentionally unassigned (left empty for future feature)
    if (state.mode === 'OVERVIEW') {
      if (dir > 0) {
        enterJourneyAtNode(0, true, false);
      }
      return;
    }
    if (dir < 0 && state.activeNodeIndex === 0) {
      enterOverviewMode(true, false);
      return;
    }
    const nextIdx = Math.max(0, Math.min(NODES.length - 1, state.activeNodeIndex + dir));
    enterJourneyAtNode(nextIdx, true, false);
  }

  function triggerNodePrimaryAction(idx) {
    if (state.mode === 'OVERVIEW') {
      enterJourneyAtNode(idx, true, false);
      return;
    }

    const node = NODES[idx];
    if (state.playingNodeIndex === idx) {
      stopNodeVideo(idx);
      return;
    }

    if (state.playingNodeIndex !== -1) {
      stopNodeVideo(state.playingNodeIndex);
    }

    const item = nodeDomItems[idx];
    const slot = item.el.querySelector('.node-media-slot');

    if (node.mediaType === 'sheet') {
      slot.innerHTML = node.sheetHtml;
      item.el.classList.add('is-playing');
      state.playingNodeIndex = idx;
      document.getElementById('chat-action-btn').textContent = 'Đóng Hồ sơ ■';
      const sheetEl = slot.querySelector('.node-data-sheet');
      if (sheetEl) {
        void sheetEl.offsetWidth;
        sheetEl.classList.add('is-sheet-active');
        TextFX.triggerWithin(sheetEl);
      }
      return;
    }

    let embedUrl = '';
    if (node.mediaType === 'youtube') {
      const m = node.link.match(/[?&]v=([^&]+)/);
      const vid = m ? m[1] : '';
      embedUrl = `https://www.youtube.com/embed/${vid}?autoplay=1&rel=0`;
    } else if (node.mediaType === 'drive') {
      const m = node.link.match(/\/d\/([^/]+)/);
      const fid = m ? m[1] : '';
      embedUrl = `https://drive.google.com/file/d/${fid}/preview`;
    }

    if (embedUrl) {
      slot.innerHTML = `<iframe src="${embedUrl}" allow="autoplay; encrypted-media; fullscreen" allowfullscreen title="${node.title}"></iframe>`;
      item.el.classList.add('is-playing');
      state.playingNodeIndex = idx;
      document.getElementById('chat-action-btn').textContent = 'Dừng Video ■';
    }
  }

  function stopNodeVideo(idx) {
    const item = nodeDomItems[idx];
    if (!item) return;
    const slot = item.el.querySelector('.node-media-slot');
    slot.innerHTML = '';
    item.el.classList.remove('is-playing');
    if (state.playingNodeIndex === idx) {
      state.playingNodeIndex = -1;
      const node = NODES[idx];
      document.getElementById('chat-action-btn').textContent =
        node.mediaType === 'sheet' ? 'Mở Hồ sơ ↗' : '▶ Phát Video';
    }
  }

  function bindEvents() {
    window.addEventListener('wheel', (ev) => {
      const targetEl = ev.target instanceof Element ? ev.target : null;
      if (targetEl && (targetEl.closest('#chat-stream') || targetEl.closest('.node-media-slot'))) return;
      ev.preventDefault();

      const now = performance.now();
      if (now < state.modeSwitchLockUntil) return;

      // Scroll DOWN from Overview -> Enter Node 00
      if (state.mode === 'OVERVIEW') {
        if (ev.deltaY > 15) {
          enterJourneyAtNode(0, true, false);
        }
        return;
      }

      // Scroll UP while at Node 00 -> Return to Overview Main Page
      if (state.mode === 'JOURNEY' && ev.deltaY < -15 && state.activeNodeIndex === 0 && state.currentProgress <= 0.035) {
        if (state.wheelSnapTimer) clearTimeout(state.wheelSnapTimer);
        enterOverviewMode(true, false);
        return;
      }

      const rawDelta = ev.deltaY * 0.00045;
      const deltaU = Math.max(-0.068, Math.min(0.068, rawDelta));
      const nextTargetU = Math.max(0, Math.min(1, state.targetProgress + deltaU));
      launchProgressFlight(nextTargetU, 860);

      if (state.wheelSnapTimer) clearTimeout(state.wheelSnapTimer);
      state.wheelSnapTimer = setTimeout(() => {
        if (state.mode !== 'JOURNEY') return;
        const nearestIdx = Math.round(state.targetProgress * (NODES.length - 1));
        const stationU = nearestIdx / (NODES.length - 1);
        if (Math.abs(stationU - state.targetProgress) > 0.002) {
          launchProgressFlight(stationU, 780);
        }
      }, 220);
    }, { passive: false });

    window.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        enterOverviewMode(true, false);
      } else if (ev.key === 'ArrowDown' || ev.key === 'ArrowRight' || ev.key === 'PageDown') {
        ev.preventDefault();
        stepJourney(1);
      } else if (ev.key === 'ArrowUp' || ev.key === 'ArrowLeft' || ev.key === 'PageUp') {
        ev.preventDefault();
        stepJourney(-1);
      } else if (ev.key === 'Home') {
        ev.preventDefault();
        enterJourneyAtNode(0, true, false);
      } else if (ev.key === 'End') {
        ev.preventDefault();
        enterJourneyAtNode(NODES.length - 1, true, false);
      }
    });

    window.addEventListener('pointermove', (ev) => {
      state.pointerX = (ev.clientX / window.innerWidth) * 2 - 1;
      state.pointerY = (ev.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    let touchY = 0;
    window.addEventListener('touchstart', (ev) => {
      if (ev.touches.length === 1) touchY = ev.touches[0].clientY;
    }, { passive: true });
    window.addEventListener('touchend', (ev) => {
      const targetEl = ev.target instanceof Element ? ev.target : null;
      if (targetEl && targetEl.closest('#chat-dock')) return;
      if (ev.changedTouches.length === 1) {
        const dy = touchY - ev.changedTouches[0].clientY;
        if (Math.abs(dy) > 36) stepJourney(dy > 0 ? 1 : -1);
      }
    }, { passive: true });

    // Requirement 6: In OVERVIEW mode, PREV button is unassigned (reserved for future feature)
    document.getElementById('btn-prev-node').addEventListener('click', () => {
      if (state.mode === 'OVERVIEW') {
        return;
      }
      stepJourney(-1);
    });

    document.getElementById('btn-next-node').addEventListener('click', () => stepJourney(1));
    document.getElementById('btn-overview-mode').addEventListener('click', () => {
      if (state.mode === 'OVERVIEW') {
        enterJourneyAtNode(state.activeNodeIndex, true, false);
      } else {
        enterOverviewMode(true, false);
      }
    });
    const topOverviewBtn = document.getElementById('top-overview-btn');
    if (topOverviewBtn) {
      topOverviewBtn.addEventListener('click', () => {
        if (state.mode === 'OVERVIEW') {
          enterJourneyAtNode(state.activeNodeIndex, true, false);
        } else {
          enterOverviewMode(true, false);
        }
      });
    }
    document.getElementById('brand-home-trigger').addEventListener('click', () => enterOverviewMode(true, false));

    document.getElementById('chat-action-btn').addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (state.mode === 'OVERVIEW') {
        enterJourneyAtNode(0, true, false);
      } else {
        triggerNodePrimaryAction(state.activeNodeIndex);
      }
    });

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      webglRenderer.setSize(window.innerWidth, window.innerHeight);
      cssRenderer.setSize(window.innerWidth, window.innerHeight);
      if (state.mode === 'OVERVIEW') enterOverviewMode(false, true);
    });
  }

  // Evaluate Cubic Bezier point AND tangent angle for oval capsule orientation
  function evalCubicBezierWithTangent(t, x0, y0, cx1, cy1, cx2, cy2, x3, y3) {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;
    const b0 = mt2 * mt;
    const b1 = 3 * mt2 * t;
    const b2 = 3 * mt * t2;
    const b3 = t2 * t;

    const x = b0 * x0 + b1 * cx1 + b2 * cx2 + b3 * x3;
    const y = b0 * y0 + b1 * cy1 + b2 * cy2 + b3 * y3;

    const dx = 3 * mt2 * (cx1 - x0) + 6 * mt * t * (cx2 - cx1) + 3 * t2 * (x3 - cx2);
    const dy = 3 * mt2 * (cy1 - y0) + 6 * mt * t * (cy2 - cy1) + 3 * t2 * (y3 - cy2);
    const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);

    return { x, y, angleDeg };
  }

  // Circle -> Oval -> Circle Kinematics along the Bezier wire:
  // Starts as a pure circle (scale 1,1) at t=0, stretches into a sleek 5.5:1 oval during flight,
  // and contracts back into a pure circle (scale 1,1) at t=1!
  function computeCapsuleKinematics(rawPhase) {
    let travelT = 0;
    let morph = 0;
    if (rawPhase <= 0.08) {
      travelT = 0;
      morph = 0;
    } else if (rawPhase >= 0.92) {
      travelT = 1;
      morph = 0;
    } else {
      const u = (rawPhase - 0.08) / 0.84;
      travelT = u * u * (3 - 2 * u);
      morph = Math.sin(Math.PI * travelT);
    }
    const scaleX = 1 + 2.45 * morph;
    const scaleY = 1 - 0.38 * morph;
    const cometOpacity = 0.08 + 0.88 * morph;
    const cometOffset = (150 - travelT * 1000).toFixed(1);
    return { travelT, morph, scaleX, scaleY, cometOpacity, cometOffset };
  }

  // Exact DOM Port Center Lookup (Fixes Requirement 7: 0px offset between port circle and wire anchor)
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

  function updateScreenTether(timeSec) {
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

    // OVERVIEW MODE: All 13 Vertically-Stacked Nodes wire from their .port-right into #chat-port-left
    if (document.body.getAttribute('data-mode') === 'OVERVIEW') {
      if (overviewHubRingEl && overviewHubCoreEl) {
        overviewHubRingEl.setAttribute('cx', ex.toFixed(1));
        overviewHubRingEl.setAttribute('cy', ey.toFixed(1));
        overviewHubCoreEl.setAttribute('cx', ex.toFixed(1));
        overviewHubCoreEl.setAttribute('cy', ey.toFixed(1));
      }

      const cycleIdx = Math.floor(timeSec * 0.56) % NODES.length;
      const packetWireIdx = state.hoveredNodeIndex !== -1 ? state.hoveredNodeIndex : cycleIdx;
      const rawPhase = (timeSec * 0.56) % 1;
      const kin = computeCapsuleKinematics(rawPhase);

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
        wire.flowPath.setAttribute('d', dStr);
        wire.cometPath.setAttribute('d', dStr);
        wire.portCircle.setAttribute('cx', sx.toFixed(1));
        wire.portCircle.setAttribute('cy', sy.toFixed(1));

        const isHighlighted = state.hoveredNodeIndex === i || i === packetWireIdx;
        wire.basePath.classList.toggle('is-highlighted', state.hoveredNodeIndex === i);
        wire.flowPath.classList.toggle('is-highlighted', state.hoveredNodeIndex === i);
        wire.basePath.style.opacity = state.hoveredNodeIndex === i ? '0.96' : '0.42';
        wire.flowPath.style.opacity = state.hoveredNodeIndex === i ? '0.98' : '0.48';
        wire.portCircle.style.opacity = isHighlighted ? '1' : '0.72';

        if (i === packetWireIdx) {
          wire.cometPath.style.opacity = kin.cometOpacity.toFixed(2);
          wire.cometPath.style.strokeDashoffset = kin.cometOffset;
          const pt = evalCubicBezierWithTangent(kin.travelT, sx, sy, cx1, cy1, cx2, cy2, ex, ey);
          if (tetherCapsuleGroupEl) {
            tetherCapsuleGroupEl.setAttribute(
              'transform',
              `translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)}) rotate(${pt.angleDeg.toFixed(1)}) scale(${kin.scaleX.toFixed(2)}, ${kin.scaleY.toFixed(2)})`
            );
          }
        } else {
          wire.cometPath.style.opacity = '0';
        }
      }
      return;
    }

    // JOURNEY MODE: Exact Port-to-Port Cubic Bezier Bridge + Dreamina Comet Stream + Circle->Oval->Circle Capsule
    const activeItem = nodeDomItems[state.activeNodeIndex];
    if (!activeItem) return;

    const portPt = getNodePortScreenCoords(activeItem);
    const sx = portPt.x;
    const sy = portPt.y;

    const spanX = Math.max(48, Math.abs(ex - sx) * 0.48);
    const cx1 = sx + spanX;
    const cy1 = sy;
    const cx2 = ex - spanX;
    const cy2 = ey;

    const dStr = `M ${sx.toFixed(1)},${sy.toFixed(1)} C ${cx1.toFixed(1)},${cy1.toFixed(1)} ${cx2.toFixed(1)},${cy2.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`;
    tetherBaseEl.setAttribute('d', dStr);
    tetherPathEl.setAttribute('d', dStr);
    if (tetherCometEl) {
      tetherCometEl.setAttribute('d', dStr);
    }

    tetherAnchorEl.setAttribute('cx', sx.toFixed(1));
    tetherAnchorEl.setAttribute('cy', sy.toFixed(1));
    tetherPulseEl.setAttribute('cx', sx.toFixed(1));
    tetherPulseEl.setAttribute('cy', sy.toFixed(1));
    tetherElbowEl.setAttribute('cx', ex.toFixed(1));
    tetherElbowEl.setAttribute('cy', ey.toFixed(1));

    const rawPhase = (timeSec * 0.56) % 1;
    const kin = computeCapsuleKinematics(rawPhase);
    if (tetherCometEl) {
      tetherCometEl.style.opacity = kin.cometOpacity.toFixed(2);
      tetherCometEl.style.strokeDashoffset = kin.cometOffset;
    }

    const pt = evalCubicBezierWithTangent(kin.travelT, sx, sy, cx1, cy1, cx2, cy2, ex, ey);
    if (tetherCapsuleGroupEl) {
      tetherCapsuleGroupEl.setAttribute(
        'transform',
        `translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)}) rotate(${pt.angleDeg.toFixed(1)}) scale(${kin.scaleX.toFixed(2)}, ${kin.scaleY.toFixed(2)})`
      );
    }
  }

  function tick(nowMs) {
    requestAnimationFrame(tick);
    const now = nowMs || performance.now();
    const dtMs = lastTickMs > 0 ? Math.min(80, Math.max(4, now - lastTickMs)) : 16.667;
    lastTickMs = now;
    const dtFrames = dtMs / 16.667;
    const lerpAlpha = 1 - Math.pow(1 - 0.088, dtFrames);
    const ptrAlpha = 1 - Math.pow(1 - 0.065, dtFrames);
    const timeSec = now * 0.001;

    state.smoothPointerX += (state.pointerX - state.smoothPointerX) * ptrAlpha;
    state.smoothPointerY += (state.pointerY - state.smoothPointerY) * ptrAlpha;

    if (compassDeckEl) {
      const shiftPx = (state.smoothPointerX * -16 + state.currentProgress * 44).toFixed(1);
      compassDeckEl.style.setProperty('--compass-shift', `${shiftPx}px`);
    }

    if (state.mode === 'JOURNEY') {
      if (state.flightActive) {
        const elapsed = (nowMs || performance.now()) - state.flightStartTime;
        const T = state.flightDuration;
        const tau = Math.min(1, Math.max(0, elapsed / T));

        const tau2 = tau * tau;
        const tau3 = tau2 * tau;
        const h00 = 2 * tau3 - 3 * tau2 + 1;
        const h10 = tau3 - 2 * tau2 + tau;
        const h01 = -2 * tau3 + 3 * tau2;

        const p0 = state.flightStartU;
        const p1 = state.flightTargetU;
        const m0 = state.flightStartVel * T;

        state.currentProgress = h00 * p0 + h10 * m0 + h01 * p1;

        const dh00 = 6 * tau2 - 6 * tau;
        const dh10 = 3 * tau2 - 4 * tau + 1;
        const dh01 = -6 * tau2 + 6 * tau;
        state.progressVel = (dh00 * p0 + dh10 * m0 + dh01 * p1) / T;

        if (tau >= 1) {
          state.currentProgress = p1;
          state.progressVel = 0;
          state.flightActive = false;
        }
      }

      const u = Math.max(0, Math.min(1, state.currentProgress));
      cameraSpline.getPointAt(u, state.camTargetPos);
      lookSpline.getPointAt(u, state.lookAtTarget);

      const currentNearest = Math.round(u * (NODES.length - 1));
      if (currentNearest !== state.activeNodeIndex && Math.abs(u * (NODES.length - 1) - currentNearest) < 0.34) {
        if (state.playingNodeIndex !== -1 && state.playingNodeIndex !== currentNearest) {
          stopNodeVideo(state.playingNodeIndex);
        }
        state.activeNodeIndex = currentNearest;
        syncJourneyNodeStates();
        syncUrlHash();
        if (nodeDomItems[currentNearest]) {
          TextFX.triggerWithin(nodeDomItems[currentNearest].el);
        }
        document.body.setAttribute('data-mode', 'JOURNEY');
        SubHudController.populateNodeContent(currentNearest, state.playingNodeIndex, subHudActions());
      }
    }

    // Requirement 9: Continuous global mouse tracking on all Node HUDs (zero boundary shake!)
    const isJourney = state.mode === 'JOURNEY';
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
      }
    }

    // Persistent Right-Side 3D Sub-HUD smoothly tracks mouse in BOTH Overview & Journey modes
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

    // Requirement 8: Z-Invariant Corridor & Camera Parallax (Matches Node 00-02 comfort at all Z depths!)
    const camParallaxX = isJourney ? state.smoothPointerX * 22 : state.smoothPointerX * 16;
    const camParallaxY = isJourney ? -state.smoothPointerY * 15 : -state.smoothPointerY * 11;
    const lookParallaxX = isJourney ? state.smoothPointerX * 8 : state.smoothPointerX * 6;
    const lookParallaxY = isJourney ? -state.smoothPointerY * 6 : -state.smoothPointerY * 4;

    state.camPos.x += (state.camTargetPos.x + camParallaxX - state.camPos.x) * lerpAlpha;
    state.camPos.y += (state.camTargetPos.y + camParallaxY - state.camPos.y) * lerpAlpha;
    state.camPos.z += (state.camTargetPos.z - state.camPos.z) * lerpAlpha;

    state.lookAtPos.x += (state.lookAtTarget.x + lookParallaxX - state.lookAtPos.x) * lerpAlpha;
    state.lookAtPos.y += (state.lookAtTarget.y + lookParallaxY - state.lookAtPos.y) * lerpAlpha;
    state.lookAtPos.z += (state.lookAtTarget.z - state.lookAtPos.z) * lerpAlpha;

    if (corridorGroup) {
      // Constant lateral shift instead of rotation around Z=0 so deeper nodes (Z=-10800m) never swing!
      const envTargetX = -state.smoothPointerX * (isJourney ? 16 : 12);
      const envTargetY = state.smoothPointerY * (isJourney ? 10 : 8);
      corridorGroup.position.x += (envTargetX - corridorGroup.position.x) * 0.055;
      corridorGroup.position.y += (envTargetY - corridorGroup.position.y) * 0.055;
    }

    // 3D Tunnel Opacity Transition: 0 in OVERVIEW (pure galaxy + nodes), smoothly fades to 1 in JOURNEY
    const targetTunnelAlpha = isJourney ? 1.0 : 0.0;
    const tunnelLerp = 1 - Math.pow(1 - 0.055, dtFrames);
    state.tunnelAlpha += (targetTunnelAlpha - state.tunnelAlpha) * tunnelLerp;
    for (let i = 0; i < tunnelMaterials.length; i++) {
      const entry = tunnelMaterials[i];
      entry.mat.opacity = entry.baseOpacity * state.tunnelAlpha;
    }

    // Floating, Sparkling Galaxy Choreography
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

    camera.position.copy(state.camPos);
    camera.lookAt(state.lookAtPos);

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

    if (zPosEl) {
      zPosEl.textContent = `${Math.round(camera.position.z - CAM_STATION_DIST)}m`;
    }

    webglRenderer.render(scene, camera);
    cssRenderer.render(cssScene, camera);
    updateScreenTether(timeSec);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.SceneEngine = {
    enterOverviewMode,
    enterJourneyAtNode,
    stepJourney
  };
})(window);
