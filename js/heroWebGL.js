/**
 * PrimDom Interactive Day/Night WebGL Hero Canvas
 * Seamlessly manages Three.js WebGL scene, ping-pong fluid simulation, and tactile bas-relief lighting.
 */

import {
  quadVertexShader,
  fluidSimFragmentShader,
  basReliefVertexShader,
  basReliefFragmentShader
} from './shaders.js';
import { CONFIG } from './config.js';

export class HeroWebGL {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn(`[HeroWebGL] Container #${containerId} not found`);
      return;
    }

    this.THREE = window.THREE;
    if (!this.THREE) {
      console.error('[HeroWebGL] Three.js not loaded!');
      return;
    }

    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || 650;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.state = {
      mouse: new this.THREE.Vector2(0.5, 0.5),
      targetMouse: new this.THREE.Vector2(0.5, 0.5),
      prevMouse: new this.THREE.Vector2(0.5, 0.5),
      velocity: new this.THREE.Vector2(0, 0),
      pointerActive: 0.0,
      targetPointerActive: 0.0,
      manualNight: 0.0,
      targetManualNight: 0.0,
      isAutoDemoRunning: false,
      userInteracted: false
    };

    this.clock = new this.THREE.Clock();
    this.isRunning = false;
    this.imageAspect = new this.THREE.Vector2(2560, 1722);
  }

  async init() {
    if (!this.container || !this.THREE) return;

    // 1. Renderer
    this.renderer = new this.THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.domElement.className = 'hero-webgl-canvas';
    this.container.appendChild(this.renderer.domElement);

    // 2. Camera & Scene
    this.scene = new this.THREE.Scene();
    this.camera = new this.THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
    this.camera.position.z = 2.414;

    // 3. Fluid Simulation Setup (Ping-Pong FBO)
    const fboSize = 512;
    const fboOptions = {
      minFilter: this.THREE.LinearFilter,
      magFilter: this.THREE.LinearFilter,
      format: this.THREE.RGBAFormat,
      type: this.THREE.UnsignedByteType,
      depthBuffer: false,
      stencilBuffer: false
    };

    this.rtA = new this.THREE.WebGLRenderTarget(fboSize, fboSize, fboOptions);
    this.rtB = new this.THREE.WebGLRenderTarget(fboSize, fboSize, fboOptions);

    this.fluidScene = new this.THREE.Scene();
    this.fluidCamera = new this.THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.fluidMaterial = new this.THREE.ShaderMaterial({
      vertexShader: quadVertexShader,
      fragmentShader: fluidSimFragmentShader,
      uniforms: {
        uPrevTrail: { value: null },
        uMouse: { value: new this.THREE.Vector2(0.5, 0.5) },
        uPrevMouse: { value: new this.THREE.Vector2(0.5, 0.5) },
        uVelocity: { value: new this.THREE.Vector2(0, 0) },
        uAspect: { value: this.width / this.height },
        uTime: { value: 0.0 },
        uPointerActive: { value: 0.0 },
        uRadius: { value: CONFIG.hero.fluidRadius || 0.28 },
        uDecay: { value: CONFIG.hero.fluidDecay || 0.955 }
      }
    });

    this.fluidQuad = new this.THREE.Mesh(new this.THREE.PlaneGeometry(2, 2), this.fluidMaterial);
    this.fluidScene.add(this.fluidQuad);

    // 4. Main Bas-Relief Architectural Mesh
    const placeholderTex = this._createPlaceholderTexture();
    this.basReliefMaterial = new this.THREE.ShaderMaterial({
      vertexShader: basReliefVertexShader,
      fragmentShader: basReliefFragmentShader,
      transparent: true,
      uniforms: {
        uDayTex: { value: placeholderTex },
        uNightTex: { value: placeholderTex },
        uFluidMap: { value: null },
        uResolution: { value: new this.THREE.Vector2(this.width, this.height) },
        uImageAspect: { value: this.imageAspect },
        uMouse: { value: new this.THREE.Vector2(0.5, 0.5) },
        uTime: { value: 0.0 },
        uReliefLift: { value: 0.008 },
        uRippleLift: { value: 0.012 },
        uLightZ: { value: 0.28 },
        uNormalStrength: { value: 3.5 },
        uManualNight: { value: 0.0 }
      }
    });

    this.meshGeometry = new this.THREE.PlaneGeometry(2, 2, 120, 120);
    this.mesh = new this.THREE.Mesh(this.meshGeometry, this.basReliefMaterial);
    this.scene.add(this.mesh);

    // 5. Update scales & viewport
    this._updateProjectionAndScales();

    // 6. Bind events
    this._bindEvents();

    // 7. Load Assets
    await this._loadTextures();

    // 8. Start Loop
    this.isRunning = true;
    this.clock.start();
    this._animate();

    // 9. Initial subtle demonstration sweep
    if (CONFIG.hero.autoSweepOnStart) {
      setTimeout(() => {
        if (!this.state.userInteracted) {
          this._runAutoDemoSweep();
        }
      }, 1200);
    }
  }

  _createPlaceholderTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 4;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1e242b';
    ctx.fillRect(0, 0, 4, 4);
    const tex = new this.THREE.CanvasTexture(canvas);
    return tex;
  }

  async _loadTextures() {
    const loader = new this.THREE.TextureLoader();

    const loadTex = (url) =>
      new Promise((resolve) => {
        loader.load(
          url,
          (tex) => {
            tex.minFilter = this.THREE.LinearFilter;
            tex.magFilter = this.THREE.LinearFilter;
            tex.generateMipmaps = false;
            resolve(tex);
          },
          undefined,
          (err) => {
            console.warn('[HeroWebGL] Error loading texture:', url, err);
            resolve(null);
          }
        );
      });

    const [dayTex, nightTex] = await Promise.all([
      loadTex(CONFIG.hero.dayImage),
      loadTex(CONFIG.hero.nightImage)
    ]);

    if (dayTex) {
      this.basReliefMaterial.uniforms.uDayTex.value = dayTex;
      if (dayTex.image && dayTex.image.naturalWidth) {
        this.imageAspect.set(dayTex.image.naturalWidth, dayTex.image.naturalHeight);
        this.basReliefMaterial.uniforms.uImageAspect.value = this.imageAspect;
      }
    }

    if (nightTex) {
      this.basReliefMaterial.uniforms.uNightTex.value = nightTex;
    }

    // Hide stage preloader if any
    const loaderEl = document.getElementById('hero-loader');
    if (loaderEl) {
      loaderEl.classList.add('fade-out');
      setTimeout(() => loaderEl.remove(), 600);
    }
  }

  _updateProjectionAndScales() {
    if (!this.camera || !this.mesh) return;

    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || 650;

    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    // Scale plane to fit frustum exactly at z=0
    const vFovRad = (this.camera.fov * Math.PI) / 180;
    const planeHeight = 2 * Math.tan(vFovRad / 2) * this.camera.position.z;
    const planeWidth = planeHeight * this.camera.aspect;

    this.mesh.scale.set(planeWidth / 2, planeHeight / 2, 1);

    this.basReliefMaterial.uniforms.uResolution.value.set(this.width, this.height);
    this.fluidMaterial.uniforms.uAspect.value = this.width / this.height;
  }

  _bindEvents() {
    // Resize Observer
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this._updateProjectionAndScales();
      });
      this.resizeObserver.observe(this.container);
    } else {
      window.addEventListener('resize', () => this._updateProjectionAndScales());
    }

    const onPointerMove = (clientX, clientY) => {
      const rect = this.container.getBoundingClientRect();
      // Check if inside or near container
      const x = (clientX - rect.left) / rect.width;
      const y = 1.0 - (clientY - rect.top) / rect.height;

      if (x >= -0.05 && x <= 1.05 && y >= -0.05 && y <= 1.05) {
        this.state.targetMouse.set(
          this.THREE.MathUtils.clamp(x, 0, 1),
          this.THREE.MathUtils.clamp(y, 0, 1)
        );
        this.state.targetPointerActive = 1.0;
        this.state.userInteracted = true;
      } else {
        this.state.targetPointerActive = 0.0;
      }
    };

    this.container.addEventListener('pointerenter', (e) => {
      this.state.targetPointerActive = 1.0;
      this.state.userInteracted = true;
      onPointerMove(e.clientX, e.clientY);
    });

    this.container.addEventListener('pointermove', (e) => {
      onPointerMove(e.clientX, e.clientY);
    });

    this.container.addEventListener('pointerleave', () => {
      this.state.targetPointerActive = 0.0;
    });

    // Touch support (passive touchmove so scrolling page works smoothly)
    this.container.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        this.state.targetPointerActive = 1.0;
        this.state.userInteracted = true;
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    this.container.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length > 0) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    this.container.addEventListener('touchend', () => {
      this.state.targetPointerActive = 0.0;
    }, { passive: true });
  }

  // Auto demonstration sweep for WOW effect on initial load
  _runAutoDemoSweep() {
    this.state.isAutoDemoRunning = true;
    const startTime = performance.now();
    const duration = 2800; // ms

    const sweepStep = () => {
      if (this.state.userInteracted) {
        this.state.isAutoDemoRunning = false;
        return;
      }

      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      if (progress < 1.0) {
        // Smooth sine wave across the house facade
        const t = progress * Math.PI;
        const x = 0.42 + Math.sin(t) * 0.18;
        const y = 0.46 + Math.cos(t * 1.5) * 0.12;

        this.state.targetMouse.set(x, y);
        this.state.targetPointerActive = Math.sin(progress * Math.PI) * 0.95;

        requestAnimationFrame(sweepStep);
      } else {
        this.state.targetPointerActive = 0.0;
        this.state.isAutoDemoRunning = false;
      }
    };

    sweepStep();
  }

  // Toggle full night mode (for mobile or manual button)
  setManualNight(isNight) {
    this.state.targetManualNight = isNight ? 1.0 : 0.0;
    this.state.userInteracted = true;
  }

  toggleManualNight() {
    const next = this.state.targetManualNight > 0.5 ? 0.0 : 1.0;
    this.setManualNight(next === 1.0);
    return next === 1.0;
  }

  _animate() {
    if (!this.isRunning) return;
    requestAnimationFrame(() => this._animate());

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // Smooth lerps
    this.state.prevMouse.copy(this.state.mouse);
    this.state.mouse.lerp(this.state.targetMouse, 0.18);

    this.state.velocity.subVectors(this.state.mouse, this.state.prevMouse);
    this.state.pointerActive += (this.state.targetPointerActive - this.state.pointerActive) * 0.12;
    this.state.manualNight += (this.state.targetManualNight - this.state.manualNight) * 0.08;

    // 1. Update Fluid Simulation
    const fUniforms = this.fluidMaterial.uniforms;
    fUniforms.uPrevTrail.value = this.rtA.texture;
    fUniforms.uMouse.value.copy(this.state.mouse);
    fUniforms.uPrevMouse.value.copy(this.state.prevMouse);
    fUniforms.uVelocity.value.copy(this.state.velocity);
    fUniforms.uPointerActive.value = this.state.pointerActive;
    fUniforms.uTime.value = time;

    this.renderer.setRenderTarget(this.rtB);
    this.renderer.render(this.fluidScene, this.fluidCamera);

    // Swap ping-pong FBOs
    const temp = this.rtA;
    this.rtA = this.rtB;
    this.rtB = temp;

    // 2. Render Main Bas-Relief Scene
    const bUniforms = this.basReliefMaterial.uniforms;
    bUniforms.uFluidMap.value = this.rtA.texture;
    bUniforms.uMouse.value.copy(this.state.mouse);
    bUniforms.uTime.value = time;
    bUniforms.uManualNight.value = this.state.manualNight;

    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.isRunning = false;
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.rtA) this.rtA.dispose();
    if (this.rtB) this.rtB.dispose();
    if (this.fluidMaterial) this.fluidMaterial.dispose();
    if (this.basReliefMaterial) this.basReliefMaterial.dispose();
    if (this.renderer) this.renderer.dispose();
  }
}
