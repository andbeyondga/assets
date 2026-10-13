// THE INN BETWEEN — guests and staff. Indifference is the horror.
window.INN = window.INN || {};
(function (INN) {
  'use strict';

  const ph = (c, s) => new THREE.MeshPhongMaterial({ color: c, shininess: s || 20, specular: 0x222222 });
  const lm = (c) => new THREE.MeshLambertMaterial({ color: c });
  let MAT = null;
  function mats() {
    if (MAT) return MAT;
    MAT = {
      armor: ph(0x4a3a24, 80), armorDark: ph(0x2a2016, 60), visor: new THREE.MeshBasicMaterial({ color: 0x0a0806 }),
      skin: lm(0x6a8a7a), skinDark: lm(0x4a6a5a),
      suitTall: lm(0x26221e), paleHead: lm(0xd8d0c0),
      suitBrown: lm(0x5a3a1c), shirt: lm(0xe8dcc0), flesh: lm(0xd8b094), fleshOff: lm(0xc8b0a4),
      uniform: lm(0x6a1a1a), gold: ph(0xc9a24a, 70), black: lm(0x111111), eye: new THREE.MeshBasicMaterial({ color: 0x0a0a0a }),
      player: lm(0x2a2a30), playerHead: lm(0x3a3430),
    };
    return MAT;
  }

  function B(w, h, d, m, x, y, z, parent) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  }
  function S(r, m, x, y, z, parent, sx, sy, sz) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), m);
    mesh.position.set(x, y, z); mesh.scale.set(sx || 1, sy || 1, sz || 1); parent.add(mesh); return mesh;
  }
  function C(rt, rb, h, m, x, y, z, parent) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 10), m);
    mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  }

  // legs for seated / standing figures; returns hip height
  function legs(g, m, pose, len, w) {
    len = len || 0.9; w = w || 0.14;
    if (pose === 'sit') {
      for (const s of [-1, 1]) {
        B(w, w, len * 0.5, m, s * 0.12, 0.47, 0.22, g);
        B(w, 0.47, w, m, s * 0.12, 0.235, 0.45, g);
      }
      return 0.47;
    }
    if (pose === 'lie') return 0.62;
    for (const s of [-1, 1]) B(w, len, w, m, s * 0.12, len / 2, 0, g);
    return len;
  }

  function armored(pose) {
    const M = mats(), g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const hip = legs(body, M.armorDark, pose, 0.95, 0.18);
    for (let i = 0; i < 4; i++) {
      const p = B(0.62 - i * 0.04, 0.2, 0.42, i % 2 ? M.armor : M.armorDark, 0, hip + 0.12 + i * 0.19, 0, body);
      p.rotation.x = -0.05;
    }
    B(0.9, 0.16, 0.5, M.armor, 0, hip + 0.86, 0, body); // pauldrons
    for (const s of [-1, 1]) {
      const a = B(0.16, 0.7, 0.18, M.armorDark, s * 0.42, hip + 0.48, 0.05, body);
      a.rotation.x = pose === 'sit' ? -0.6 : -0.1;
    }
    const head = new THREE.Group(); head.position.set(0, hip + 1.08, 0); body.add(head);
    B(0.34, 0.4, 0.36, M.armor, 0, 0, 0, head);
    B(0.26, 0.04, 0.02, M.visor, 0, 0.04, 0.185, head);
    B(0.06, 0.18, 0.4, M.armorDark, 0, 0.22, 0, head);
    return { g, body, head, height: hip + 1.3 };
  }

  function tentacled(pose) {
    const M = mats(), g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const hip = pose === 'lie' ? 0.62 : legs(body, M.skinDark, pose, 0.85, 0.15);
    const torso = S(0.32, M.skin, 0, hip + 0.4, 0, body, 1, 1.4, 0.9);
    void torso;
    const head = new THREE.Group(); head.position.set(0, hip + 0.98, 0.02); body.add(head);
    S(0.24, M.skin, 0, 0, 0, head, 1, 1.25, 1.1);
    const tentacles = [];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const pts = [];
      for (let k = 0; k < 6; k++) pts.push(new THREE.Vector3(Math.sin(a) * (0.12 + k * 0.03), -0.12 - k * 0.12, Math.cos(a) * (0.12 + k * 0.03) + 0.08));
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.03, 6), M.skinDark);
      head.add(tube); tentacles.push({ mesh: tube, a, phase: Math.random() * 6 });
    }
    if (pose === 'lie') { body.rotation.x = -Math.PI / 2.3; body.position.set(0, 0.2, 0.2); }
    return { g, body, head, tentacles, height: hip + 1.2 };
  }

  function tall(pose) {
    const M = mats(), g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    let hip;
    if (pose === 'sit') {
      // knees up near the shoulders
      for (const s of [-1, 1]) {
        const th = B(0.1, 1.15, 0.1, M.suitTall, s * 0.13, 0.85, 0.3, body); th.rotation.x = -0.9;
        B(0.1, 1.2, 0.1, M.suitTall, s * 0.13, 0.6, 0.72, body);
      }
      hip = 0.47;
    } else {
      for (const s of [-1, 1]) B(0.1, 1.7, 0.1, M.suitTall, s * 0.1, 0.85, 0, body);
      hip = 1.7;
    }
    B(0.38, 1.2, 0.22, M.suitTall, 0, hip + 0.6, 0, body);
    for (const s of [-1, 1]) {
      const a = B(0.08, 1.35, 0.08, M.suitTall, s * 0.25, hip + 0.55, 0.02, body); a.rotation.z = s * 0.05;
      S(0.06, M.paleHead, s * 0.27, hip - 0.15, 0.03, body, 1, 2.2, 0.6);
    }
    C(0.04, 0.05, 0.4, M.paleHead, 0, hip + 1.38, 0, body);
    const head = new THREE.Group(); head.position.set(0, hip + 1.7, 0); body.add(head);
    S(0.12, M.paleHead, 0, 0, 0, head, 0.85, 1.25, 0.9);
    return { g, body, head, height: hip + 1.85 };
  }

  function almost(pose) {
    const M = mats(), g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const hip = legs(body, M.suitBrown, pose, 0.92, 0.15);
    B(0.5, 0.68, 0.28, M.suitBrown, 0, hip + 0.36, 0, body);
    B(0.16, 0.5, 0.02, M.shirt, 0, hip + 0.45, 0.145, body);
    B(0.08, 0.36, 0.02, M.uniform, 0, hip + 0.42, 0.16, body);
    for (const s of [-1, 1]) {
      const a = B(0.13, 0.72, 0.14, M.suitBrown, s * 0.32, hip + 0.32, pose === 'sit' ? 0.12 : 0, body);
      a.rotation.x = pose === 'sit' ? -0.5 : 0;
    }
    C(0.06, 0.07, 0.34, M.fleshOff, 0, hip + 0.86, 0, body); // a neck slightly too long
    const head = new THREE.Group(); head.position.set(0, hip + 1.15, 0.01); body.add(head);
    S(0.15, M.fleshOff, 0, 0, 0, head, 1.05, 1.3, 1.08); // a head slightly too large, too smooth
    B(0.32, 0.06, 0.32, M.suitBrown, 0, 0.18, 0, head).scale.set(1, 1, 1);
    return { g, body, head, height: hip + 1.35 };
  }

  function uniformed(pose) {
    const M = mats(), g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const hip = legs(body, M.black, pose, 0.92, 0.15);
    B(0.5, 0.66, 0.28, M.uniform, 0, hip + 0.35, 0, body);
    B(0.52, 0.04, 0.3, M.gold, 0, hip + 0.02, 0, body);
    B(0.1, 0.05, 0.02, M.gold, -0.12, hip + 0.55, 0.15, body); // name badge, blank
    B(0.14, 0.05, 0.03, M.black, 0, hip + 0.66, 0.15, body); // bow tie
    for (const s of [-1, 1]) B(0.12, 0.66, 0.13, M.uniform, s * 0.31, hip + 0.33, 0, body);
    C(0.055, 0.06, 0.16, M.fleshOff, 0, hip + 0.76, 0, body);
    const head = new THREE.Group(); head.position.set(0, hip + 0.98, 0.01); body.add(head);
    S(0.14, M.fleshOff, 0, 0, 0, head, 0.92, 1.35, 1.0);
    // eyes set a little too far apart, a smile that is drawn on
    S(0.018, M.eye, -0.085, 0.04, 0.125, head); S(0.018, M.eye, 0.085, 0.04, 0.125, head);
    B(0.08, 0.008, 0.01, M.eye, 0, -0.07, 0.135, head);
    C(0.13, 0.13, 0.08, M.uniform, 0, 0.2, 0, head);
    B(0.27, 0.015, 0.1, M.black, 0, 0.165, 0.1, head);
    return { g, body, head, height: hip + 1.25 };
  }

  const BUILD = { armored, tentacle: tentacled, tall, almost, uniform: uniformed };

  function Guest(spec) {
    const r = BUILD[spec.type](spec.pose || 'stand');
    Object.assign(this, r);
    this.spec = spec;
    this.area = spec.area;
    this.baseRy = spec.ry || 0;
    this.g.position.set(spec.x, spec.y || 0, spec.z);
    this.g.rotation.y = this.baseRy;
    this.phase = Math.random() * 10;
    this.targetRy = this.baseRy;
    this.attentive = false;
    this.headBase = this.head ? this.head.rotation.x : 0;
    if (spec.lookDown && this.head) this.head.rotation.x = 0.6;
    const hit = new THREE.Mesh(new THREE.BoxGeometry(0.9, this.height || 1.8, 0.9), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = (this.height || 1.8) / 2;
    this.g.add(hit);
    this.hit = hit;
  }

  Guest.prototype.update = function (dt, t) {
    const b = 1 + Math.sin(t * 1.1 + this.phase) * 0.008;
    this.body.scale.set(1, b, 1);
    if (this.head && !this.attentive) {
      this.head.rotation.y = Math.sin(t * 0.13 + this.phase) * 0.15;
      if (this.spec.area === 'dining') this.head.rotation.x = 0.15 + Math.max(0, Math.sin(t * 0.9 + this.phase)) * 0.2;
    }
    if (this.tentacles) {
      this.tentacles.forEach((tt) => {
        tt.mesh.rotation.x = Math.sin(t * 0.8 + tt.phase) * 0.12;
        tt.mesh.rotation.z = Math.cos(t * 0.6 + tt.phase) * 0.1;
      });
    }
    // turning toward the guest who broke a rule: slow, silent
    let d = this.targetRy - this.g.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    this.g.rotation.y += d * Math.min(1, dt * 0.8);
  };

  Guest.prototype.faceInstant = function (px, pz) {
    const ry = Math.atan2(px - this.g.position.x, pz - this.g.position.z);
    this.g.rotation.y = ry; this.targetRy = ry;
    if (this.head) { this.head.rotation.y = 0; this.head.rotation.x = 0; }
  };
  Guest.prototype.faceSlow = function (px, pz) {
    this.targetRy = Math.atan2(px - this.g.position.x, pz - this.g.position.z);
    if (this.head) { this.head.rotation.y = 0; this.head.rotation.x = 0; }
  };

  // The player's own body, seen only by the television in Room 114 and the pool.
  function playerBody() {
    const M = mats(), g = new THREE.Group();
    B(0.42, 0.62, 0.24, M.player, 0, 1.22, 0, g);
    for (const s of [-1, 1]) { B(0.14, 0.9, 0.15, M.player, s * 0.11, 0.45, 0, g); B(0.11, 0.62, 0.12, M.player, s * 0.28, 1.2, 0, g); }
    S(0.13, M.playerHead, 0, 1.68, 0, g, 1, 1.15, 1);
    g.traverse((o) => o.layers.set(1));
    return g;
  }

  INN.Guest = Guest;
  INN.Entities = { playerBody, BUILD };
})(window.INN);
