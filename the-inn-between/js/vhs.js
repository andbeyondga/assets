// THE INN BETWEEN — the whole world is seen through a worn videotape.
window.INN = window.INN || {};
(function (INN) {
  'use strict';

  const frag = `
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform float time, desat, glitch, staticAmt, hueShift, fade, trackY, darken;
    uniform vec2 res;
    varying vec2 vUv;

    float rand(vec2 co) { return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453); }

    vec3 hueRotate(vec3 c, float a) {
      const vec3 k = vec3(0.57735);
      float ca = cos(a);
      return c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca);
    }

    void main() {
      vec2 uv = vUv;
      // tape wobble and tracking band
      float band = 1.0 - smoothstep(0.0, 0.035 + glitch * 0.05, abs(uv.y - trackY));
      uv.x += sin(uv.y * 220.0 + time * 7.0) * 0.0006;
      uv.x += sin(time * 1.7 + uv.y * 4.0) * 0.0012;
      uv.x += band * (0.004 + glitch * 0.03) * (rand(vec2(floor(uv.y * 120.0), time)) - 0.5);
      // head-switching noise at the bottom of the frame
      float head = 1.0 - smoothstep(0.0, 0.025, uv.y);
      uv.x += head * 0.03 * sin(time * 40.0 + uv.y * 300.0);

      float ca = 0.0022 + glitch * 0.008;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + vec2(ca, 0.0)).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - vec2(ca * 1.4, 0.0)).b;
      // luma bleed / soft focus
      vec3 bl = texture2D(tDiffuse, uv + vec2(0.003, 0.0)).rgb + texture2D(tDiffuse, uv - vec2(0.003, 0.0)).rgb
              + texture2D(tDiffuse, uv + vec2(0.0, 0.003)).rgb + texture2D(tDiffuse, uv - vec2(0.0, 0.003)).rgb;
      col = mix(col, bl * 0.25, 0.3);
      // glow from bright neon
      vec3 glow = texture2D(tDiffuse, uv + vec2(0.008, 0.0)).rgb + texture2D(tDiffuse, uv - vec2(0.008, 0.0)).rgb
                + texture2D(tDiffuse, uv + vec2(0.0, 0.01)).rgb + texture2D(tDiffuse, uv - vec2(0.0, 0.01)).rgb;
      col += max(glow * 0.25 - 0.55, 0.0) * 0.6;

      // faded 1974 postcard grade: lifted blacks, warm mids, teal shadows
      col = col * 0.92 + vec3(0.035, 0.028, 0.04);
      col = mix(col, col * vec3(1.06, 0.98, 0.9), 0.6);
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(col, vec3(l), desat);
      if (hueShift > 0.0) col = hueRotate(col, hueShift);

      // scanlines
      col *= 0.9 + 0.1 * sin(vUv.y * res.y * 1.5708);
      // grain
      col += (rand(vUv * res + time * 61.0) - 0.5) * (0.07 + staticAmt * 0.2);
      // tracking band brightens
      col += band * 0.05 * rand(vec2(time, vUv.y));
      // static
      float s = rand(floor(vUv * res * 0.5) + floor(time * 30.0));
      col = mix(col, vec3(s), clamp(staticAmt, 0.0, 1.0));
      // vignette
      vec2 v = vUv - 0.5;
      col *= 1.0 - dot(v, v) * (0.9 + darken);
      col *= fade;
      gl_FragColor = vec4(col, 1.0);
    }`;

  const vert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

  function VHS(renderer) {
    this.renderer = renderer;
    this.rt = new THREE.WebGLRenderTarget(640, 480, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    this.uniforms = {
      tDiffuse: { value: this.rt.texture }, time: { value: 0 }, desat: { value: 0 }, glitch: { value: 0 },
      staticAmt: { value: 0 }, hueShift: { value: 0 }, fade: { value: 1 }, trackY: { value: 0.5 },
      darken: { value: 0 }, res: { value: new THREE.Vector2(640, 480) },
    };
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: this.uniforms, vertexShader: vert, fragmentShader: frag, depthTest: false, depthWrite: false,
    }));
    this.qScene = new THREE.Scene(); this.qScene.add(this.quad);
    this.qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.glitchPulse = 0;
    this.staticPulse = 0;
    this.track = 0.5; this.trackSpeed = 0.05;
  }

  VHS.prototype.resize = function (w, h) {
    // a soft, standard-definition picture
    const lines = Math.min(540, Math.max(360, Math.round(h * 0.6)));
    const width = Math.round(lines * (w / h));
    this.rt.setSize(width, lines);
    this.uniforms.res.value.set(width, lines);
  };

  VHS.prototype.pulse = function (glitch, stat) {
    this.glitchPulse = Math.max(this.glitchPulse, glitch || 0);
    this.staticPulse = Math.max(this.staticPulse, stat || 0);
  };

  VHS.prototype.render = function (scene, camera, dt, base) {
    base = base || {};
    const u = this.uniforms;
    u.time.value += dt;
    this.glitchPulse = Math.max(0, this.glitchPulse - dt * 1.6);
    this.staticPulse = Math.max(0, this.staticPulse - dt * 2.5);
    this.track += this.trackSpeed * dt;
    if (this.track > 1.15) { this.track = -0.15; this.trackSpeed = 0.02 + Math.random() * 0.08; }
    if (Math.random() < dt * 0.05) this.glitchPulse = Math.max(this.glitchPulse, 0.4 + Math.random() * 0.4);
    u.trackY.value = this.track;
    u.glitch.value = Math.min(1, (base.glitch || 0) + this.glitchPulse);
    u.staticAmt.value = Math.min(1, (base.staticAmt || 0) + this.staticPulse);
    u.desat.value = base.desat || 0;
    u.hueShift.value = base.hue || 0;
    u.fade.value = base.fade == null ? 1 : base.fade;
    u.darken.value = base.darken || 0;
    const r = this.renderer;
    r.setRenderTarget(this.rt);
    r.render(scene, camera);
    r.setRenderTarget(null);
    r.render(this.qScene, this.qCam);
  };

  INN.VHS = VHS;
})(window.INN);
