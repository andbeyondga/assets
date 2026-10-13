// THE INN BETWEEN — the world seen through a worn videotape, with neon bloom.
// Pipeline: scene -> rt, bright pass -> blur ping-pong (quarter res) -> composite with tape treatment.
window.INN = window.INN || {};
(function (INN) {
  'use strict';

  const vert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

  // keep only what is bright: neon, tubes, the skylight
  const brightFrag = `
    precision highp float;
    uniform sampler2D tDiffuse; uniform float threshold;
    varying vec2 vUv;
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float l = max(c.r, max(c.g, c.b));
      float k = smoothstep(threshold, threshold + 0.25, l);
      gl_FragColor = vec4(c * k, 1.0);
    }`;

  const blurFrag = `
    precision highp float;
    uniform sampler2D tDiffuse; uniform vec2 dir;
    varying vec2 vUv;
    void main() {
      vec3 s = texture2D(tDiffuse, vUv).rgb * 0.227;
      s += texture2D(tDiffuse, vUv + dir * 1.385).rgb * 0.316;
      s += texture2D(tDiffuse, vUv - dir * 1.385).rgb * 0.316;
      s += texture2D(tDiffuse, vUv + dir * 3.231).rgb * 0.070;
      s += texture2D(tDiffuse, vUv - dir * 3.231).rgb * 0.070;
      gl_FragColor = vec4(s, 1.0);
    }`;

  const frag = `
    precision highp float;
    uniform sampler2D tDiffuse, tBloom;
    uniform float time, desat, glitch, staticAmt, hueShift, fade, trackY, darken, bloom;
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
      // a light tape wobble; the tracking band only bites when something goes wrong
      float band = 1.0 - smoothstep(0.0, 0.03 + glitch * 0.05, abs(uv.y - trackY));
      uv.x += sin(uv.y * 220.0 + time * 7.0) * 0.00025;
      uv.x += sin(time * 1.7 + uv.y * 4.0) * 0.0005;
      uv.x += band * glitch * 0.03 * (rand(vec2(floor(uv.y * 120.0), time)) - 0.5);
      float head = 1.0 - smoothstep(0.0, 0.012, uv.y);
      uv.x += head * 0.015 * sin(time * 40.0 + uv.y * 300.0);

      float ca = 0.0009 + glitch * 0.007;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + vec2(ca, 0.0)).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - vec2(ca * 1.3, 0.0)).b;
      // a little luma bleed
      vec3 bl = texture2D(tDiffuse, uv + vec2(0.0015, 0.0)).rgb + texture2D(tDiffuse, uv - vec2(0.0015, 0.0)).rgb;
      col = mix(col, bl * 0.5, 0.12);

      // bloom: warm, a touch wide, like light through a dirty lens
      vec3 b = texture2D(tBloom, uv).rgb;
      col += b * bloom * vec3(1.05, 0.95, 0.9);

      // faded 1974 postcard grade
      col = col * 0.95 + vec3(0.02, 0.016, 0.024);
      col = mix(col, col * vec3(1.05, 0.99, 0.92), 0.5);
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(col, vec3(l), desat);
      if (hueShift > 0.0) col = hueRotate(col, hueShift);

      col *= 0.97 + 0.03 * sin(vUv.y * res.y * 1.5708);
      col += (rand(vUv * res + time * 61.0) - 0.5) * (0.03 + staticAmt * 0.2);
      col += band * glitch * 0.06 * rand(vec2(time, vUv.y));
      float s = rand(floor(vUv * res * 0.5) + floor(time * 30.0));
      col = mix(col, vec3(s), clamp(staticAmt, 0.0, 1.0));
      vec2 v = vUv - 0.5;
      col *= 1.0 - dot(v, v) * (0.55 + darken);
      col *= fade;
      gl_FragColor = vec4(col, 1.0);
    }`;

  function rt(w, h) {
    return new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  }

  function VHS(renderer) {
    this.renderer = renderer;
    this.rt = rt(960, 540);
    this.bA = rt(240, 135); this.bB = rt(240, 135);
    this.uniforms = {
      tDiffuse: { value: this.rt.texture }, tBloom: { value: this.bA.texture },
      time: { value: 0 }, desat: { value: 0 }, glitch: { value: 0 }, bloom: { value: 0.85 },
      staticAmt: { value: 0 }, hueShift: { value: 0 }, fade: { value: 1 }, trackY: { value: 0.5 },
      darken: { value: 0 }, res: { value: new THREE.Vector2(960, 540) },
    };
    this.matFinal = new THREE.ShaderMaterial({ uniforms: this.uniforms, vertexShader: vert, fragmentShader: frag, depthTest: false, depthWrite: false });
    this.matBright = new THREE.ShaderMaterial({ uniforms: { tDiffuse: { value: this.rt.texture }, threshold: { value: 0.74 } }, vertexShader: vert, fragmentShader: brightFrag, depthTest: false, depthWrite: false });
    this.matBlur = new THREE.ShaderMaterial({ uniforms: { tDiffuse: { value: null }, dir: { value: new THREE.Vector2() } }, vertexShader: vert, fragmentShader: blurFrag, depthTest: false, depthWrite: false });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.matFinal);
    this.qScene = new THREE.Scene(); this.qScene.add(this.quad);
    this.qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.glitchPulse = 0;
    this.staticPulse = 0;
    this.track = 0.5; this.trackSpeed = 0.05;
  }

  VHS.prototype.resize = function (w, h) {
    // still soft, but closer to a clean broadcast
    const lines = Math.min(900, Math.max(480, Math.round(h * 0.85)));
    const width = Math.round(lines * (w / h));
    this.rt.setSize(width, lines);
    this.uniforms.res.value.set(width, lines);
    const bw = Math.max(64, Math.round(width / 4)), bh = Math.max(36, Math.round(lines / 4));
    this.bA.setSize(bw, bh); this.bB.setSize(bw, bh);
    this.bloomTexel = new THREE.Vector2(1 / bw, 1 / bh);
  };

  VHS.prototype.pulse = function (glitch, stat) {
    this.glitchPulse = Math.max(this.glitchPulse, glitch || 0);
    this.staticPulse = Math.max(this.staticPulse, stat || 0);
  };

  VHS.prototype.pass = function (mat, target) {
    this.quad.material = mat;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.qScene, this.qCam);
  };

  VHS.prototype.render = function (scene, camera, dt, base) {
    base = base || {};
    const u = this.uniforms;
    u.time.value += dt;
    this.glitchPulse = Math.max(0, this.glitchPulse - dt * 1.6);
    this.staticPulse = Math.max(0, this.staticPulse - dt * 2.5);
    this.track += this.trackSpeed * dt;
    if (this.track > 1.15) { this.track = -0.15; this.trackSpeed = 0.02 + Math.random() * 0.06; }
    if (Math.random() < dt * 0.015) this.glitchPulse = Math.max(this.glitchPulse, 0.25 + Math.random() * 0.3);
    u.trackY.value = this.track;
    u.glitch.value = Math.min(1, (base.glitch || 0) + this.glitchPulse);
    u.staticAmt.value = Math.min(1, (base.staticAmt || 0) + this.staticPulse);
    u.desat.value = base.desat || 0;
    u.hueShift.value = base.hue || 0;
    u.fade.value = base.fade == null ? 1 : base.fade;
    u.darken.value = base.darken || 0;
    if (base.bloom != null) u.bloom.value = base.bloom;
    const r = this.renderer;
    r.setRenderTarget(this.rt);
    r.render(scene, camera);
    // bloom chain
    if (!this.bloomTexel) this.bloomTexel = new THREE.Vector2(1 / 240, 1 / 135);
    this.pass(this.matBright, this.bA);
    const bu = this.matBlur.uniforms;
    for (let i = 0; i < 2; i++) {
      const s = 1 + i * 1.5;
      bu.tDiffuse.value = this.bA.texture; bu.dir.value.set(this.bloomTexel.x * s, 0); this.pass(this.matBlur, this.bB);
      bu.tDiffuse.value = this.bB.texture; bu.dir.value.set(0, this.bloomTexel.y * s); this.pass(this.matBlur, this.bA);
    }
    this.pass(this.matFinal, null);
  };

  INN.VHS = VHS;
})(window.INN);
