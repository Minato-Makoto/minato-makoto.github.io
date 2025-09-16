(function(){
  const stage = document.getElementById('stage3d');
  if (!stage || !window.THREE) {
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isMobile = window.matchMedia('(max-width: 768px)');
  let allowMotion = !prefersReducedMotion.matches;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030406, 0.0009);

  const camera = new THREE.PerspectiveCamera(60, stage.clientWidth / stage.clientHeight, 1, 5000);
  camera.position.set(0, 0, isMobile.matches ? 900 : 1200);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: !isMobile.matches,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(isMobile.matches ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(stage.clientWidth, stage.clientHeight);
  renderer.domElement.classList.add('webgl-layer');
  renderer.domElement.style.pointerEvents = 'none';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  stage.insertBefore(renderer.domElement, stage.firstChild);

  let cssRenderer = null;
  let cssScene = null;
  if (THREE.CSS3DRenderer) {
    cssScene = new THREE.Scene();
    cssRenderer = new THREE.CSS3DRenderer();
    cssRenderer.setSize(stage.clientWidth, stage.clientHeight);
    cssRenderer.domElement.classList.add('css3d');
    cssRenderer.domElement.style.pointerEvents = 'none';
    cssRenderer.domElement.setAttribute('aria-hidden', 'true');

    const placeholder = stage.querySelector('.css3d');
    if (placeholder && placeholder !== cssRenderer.domElement) {
      stage.replaceChild(cssRenderer.domElement, placeholder);
    } else {
      stage.appendChild(cssRenderer.domElement);
    }
  }

  const particleTotal = prefersReducedMotion.matches ? 280 : (isMobile.matches ? 900 : 1600);
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleTotal * 3);
  const basePositions = new Float32Array(particleTotal * 3);
  const driftSpeeds = new Float32Array(particleTotal);

  for (let i = 0; i < particleTotal; i++) {
    const i3 = i * 3;
    const radius = 280 + Math.pow(Math.random(), 0.55) * 1400;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const sinPhi = Math.sin(phi);

    const x = radius * sinPhi * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * sinPhi * Math.sin(theta);

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    basePositions[i3] = x;
    basePositions[i3 + 1] = y;
    basePositions[i3 + 2] = z;

    driftSpeeds[i] = 0.3 + Math.random() * 0.8;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x7dd3fc,
    size: isMobile.matches ? 2.6 : 3.4,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  const ambient = new THREE.AmbientLight(0xffffff, 0.12);
  scene.add(ambient);

  const targetParallax = new THREE.Vector2(0, 0);
  const currentParallax = new THREE.Vector2(0, 0);

  function updateGradient() {
    const x = (currentParallax.x * 12) + 50;
    const y = 45 - (currentParallax.y * 10);
    stage.style.setProperty('--bgx', `${x.toFixed(2)}%`);
    stage.style.setProperty('--bgy', `${y.toFixed(2)}%`);
  }

  const pointerHandler = (event) => {
    const rect = stage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    targetParallax.set(x * 2 - 1, (y * 2 - 1) * -1);
  };

  const leaveHandler = () => {
    targetParallax.set(0, 0);
  };

  stage.addEventListener('pointermove', pointerHandler);
  stage.addEventListener('pointerleave', leaveHandler);
  stage.addEventListener('touchmove', (event) => {
    if (!event.touches || event.touches.length === 0) return;
    const rect = stage.getBoundingClientRect();
    const touch = event.touches[0];
    const x = (touch.clientX - rect.left) / rect.width;
    const y = (touch.clientY - rect.top) / rect.height;
    targetParallax.set(x * 2 - 1, (y * 2 - 1) * -1);
  }, { passive: true });
  stage.addEventListener('touchend', leaveHandler);
  stage.addEventListener('touchcancel', leaveHandler);

  const clock = new THREE.Clock();
  let elapsed = 0;
  let frames = 0;
  let fpsStart = performance.now();
  const fpsElement = document.getElementById('fps');

  function animate() {
    const delta = clock.getDelta();
    elapsed += delta;

    currentParallax.lerp(targetParallax, 0.08);
    camera.position.x = currentParallax.x * 70;
    camera.position.y = currentParallax.y * 48;
    camera.lookAt(0, 0, 0);
    updateGradient();

    if (allowMotion) {
      const arr = geometry.attributes.position.array;
      for (let i = 0; i < particleTotal; i++) {
        const i3 = i * 3;
        const speed = driftSpeeds[i];
        arr[i3] = basePositions[i3] + Math.sin(elapsed * speed * 0.6 + i * 0.12) * 18;
        arr[i3 + 1] = basePositions[i3 + 1] + Math.cos(elapsed * speed * 0.45 + i * 0.08) * 22;
        arr[i3 + 2] = basePositions[i3 + 2] + Math.sin(elapsed * speed * 0.5 + i * 0.15) * 18;
      }
      geometry.attributes.position.needsUpdate = true;
      particles.rotation.y += delta * 0.18;
      particles.rotation.x = Math.sin(elapsed * 0.22) * 0.08;
    }

    renderer.render(scene, camera);
    if (cssRenderer && cssScene) {
      cssRenderer.render(cssScene, camera);
    }

    frames += 1;
    const now = performance.now();
    if (fpsElement && now - fpsStart >= 500) {
      const fps = Math.round((frames * 1000) / (now - fpsStart));
      fpsElement.textContent = `fps: ${fps}`;
      fpsStart = now;
      frames = 0;
    }

    requestAnimationFrame(animate);
  }

  animate();

  const resize = () => {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    if (cssRenderer) {
      cssRenderer.setSize(width, height);
    }
  };

  window.addEventListener('resize', resize);
  if (window.ResizeObserver) {
    const observer = new ResizeObserver(() => resize());
    observer.observe(stage);
  }

  const updatePixelRatio = () => {
    renderer.setPixelRatio(isMobile.matches ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  };

  const addMediaListener = (mediaQuery, handler) => {
    if (!mediaQuery) return;
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handler);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handler);
    }
  };

  addMediaListener(isMobile, () => {
    updatePixelRatio();
    camera.position.z = isMobile.matches ? 900 : 1200;
    resize();
  });

  addMediaListener(prefersReducedMotion, (event) => {
    allowMotion = !event.matches;
    if (!allowMotion) {
      geometry.attributes.position.array.set(basePositions);
      geometry.attributes.position.needsUpdate = true;
    }
  });
})();
