// THE INN BETWEEN — the floor plan.
// One floor. Twenty rooms. An atrium, a pool, an arcade, a dining room, four exits.
//
//   x runs east, z runs south, y is up. Units are meters.
//
//   West stair  | West corridor (rooms 101-116)   | ATRIUM | East corridor (117-120)      | East vestibule
//   x -72..-62  | x -62..-12                       | -12..12| x 12..58                     | x 58..66
//                                                  | DINING (south, z 16..32) -> service corridor -> service door
//                                                    POOL (north, x 14..40)   ARCADE (north, x 40..56)
window.INN = window.INN || {};
(function (INN) {
  'use strict';
  const Tex = INN.Tex;

  function World(scene, opts) {
    this.scene = scene;
    this.opts = opts || {};
    this.colliders = [];
    this.zones = [];
    this.interactables = [];
    this.fixtures = [];
    this.rooms = {};
    this.doors = [];
    this.exits = {};
    this.guestSpots = [];
    this.plaques = {};
    this.vending = [];
    this.arcade = [];
    this.anim = [];
    this.soundSpots = [];
    this.root = new THREE.Group();
    scene.add(this.root);
    this.makeMaterials();
    this.build();
  }

  const P = World.prototype;

  // ----------------------------------------------------------- materials
  P.makeMaterials = function () {
    const L = (o) => new THREE.MeshLambertMaterial(o);
    const M = this.M = {};
    // the grand-hotel palette: emerald walls, crimson doors and carpet, brass and warm bulbs
    M.carpet = L({ map: Tex.spiralCarpet([0x4a100c, 0x8a2216, 0x3a4220, 0xd2b48a, 0x9a2a1a, 0x2a2a14, 0x6a1a10]) });
    M.carpetRoom = L({ map: Tex.carpet([0x5a1410, 0x2a3a1e, 0x7a2016, 0x3a2a14, 0x8a3a1c]) });
    M.carpetArcade = L({ map: Tex.carpet([0x3a1c2a, 0x8a3a1a, 0x1c3a3a, 0xc8862a, 0x2a1414]) });
    M.wood = L({ map: Tex.wood(0x3e2210) });
    M.woodDark = L({ map: Tex.wood(0x2a160a) });
    M.wallpaper = L({ map: Tex.damask('#0c261d', '#14382b', '#c9a24a') });
    M.wallpaperRoom = L({ map: Tex.damask('#340d0b', '#4a1410', '#c9a24a') });
    M.door = new THREE.MeshPhongMaterial({ map: Tex.wood(0x9a1c14), shininess: 55, specular: 0x3a1a14 });
    M.leather = L({ map: Tex.leather() });
    M.checker = L({ map: Tex.checker('#5a100c', '#0e0a08') });
    M.redCarpet = L({ map: Tex.shag(0x6a1410) });
    M.tile = L({ map: Tex.tile(0x2f8a7e, '#cfe0d4') });
    M.tilePool = L({ map: Tex.tile(0x4fb0b0, '#e8f0ea', 10) });
    M.tileFloor = L({ map: Tex.tile(0xd8cfb0, '#7a7060', 6), color: 0xa49c88 });
    M.ceiling = L({ map: Tex.coffer() });
    M.shag = L({ map: Tex.shag(0xb07a2a) });
    M.avocado = M.leather;
    M.harvest = L({ map: Tex.fabric('#1f3a2a', '#1a3324') });
    M.rustFab = L({ map: Tex.fabric('#6a1612', '#5a120e') });
    M.cream = L({ color: 0xe8dcc0 });
    M.sheet = L({ color: 0xe9e2cc });
    M.black = L({ color: 0x111111 });
    M.darkGlass = new THREE.MeshPhongMaterial({ color: 0x0a0f10, specular: 0x666666, shininess: 90, transparent: true, opacity: 0.85 });
    M.chrome = new THREE.MeshPhongMaterial({ color: 0xbbbbbb, specular: 0xffffff, shininess: 120 });
    M.brass = new THREE.MeshPhongMaterial({ color: 0xc9a24a, specular: 0xffe0a0, shininess: 70 });
    M.fixture = new THREE.MeshBasicMaterial({ color: 0xffe2b4 });
    M.shade = new THREE.MeshPhongMaterial({ color: 0x8a6424, specular: 0xffe0a0, shininess: 60, side: THREE.DoubleSide });
    M.fixtureWarm = new THREE.MeshBasicMaterial({ color: 0xffe2a8 });
    M.lampShade = new THREE.MeshBasicMaterial({ color: 0xffbe78 });
    M.redShade = new THREE.MeshBasicMaterial({ color: 0xff5a3a });
    M.lampOff = L({ color: 0x5a4a2a });
    M.water = new THREE.MeshPhongMaterial({ color: 0x1f8f9a, emissive: 0x0a4a52, specular: 0xffffff, shininess: 100, transparent: true, opacity: 0.82 });
    M.metal = new THREE.MeshPhongMaterial({ color: 0x6a6a64, specular: 0x999999, shininess: 40 });
    M.orange = L({ color: 0xd8742a });
    M.screenOff = new THREE.MeshBasicMaterial({ color: 0x1a2220 });
    M.curtain = L({ map: Tex.fabric('#8a3a1a', '#7a3216') });
    M.frosted = new THREE.MeshBasicMaterial({ color: 0xd8e4d8, transparent: true, opacity: 0.55 });
    M.plant = L({ color: 0x3a5a2a });
    M.food = L({ color: 0xd8a050 });
    M.coffee = L({ color: 0x2a1a0a });
    M.white = L({ color: 0xf0ece0 });
    M.stucco = L({ color: 0xf0bfae });
    M.terrazzo = L({ map: Tex.terrazzo() });
    M.grass = L({ map: Tex.grass(), color: 0x6a7a5c });
    M.vines = L({ map: Tex.vines(), color: 0x8a9a80, alphaTest: 0.45, side: THREE.DoubleSide });
    M.leaf = L({ color: 0x2e4f26 });
    M.leafDark = L({ color: 0x18301a });
    M.trunk = L({ color: 0x6a4c34 });
    M.glass = new THREE.MeshPhongMaterial({ color: 0xa8e0d8, transparent: true, opacity: 0.2, shininess: 110, specular: 0xffffff, depthWrite: false });
    M.skylight = new THREE.MeshBasicMaterial({ map: Tex.skylight() });
    M.cabGlow = new THREE.MeshBasicMaterial({ color: 0xffd9a0 });
  };

  // ----------------------------------------------------------- helpers
  function tileUV(geo, su, sv) {
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
    uv.needsUpdate = true;
    return geo;
  }

  function boxGeo(w, h, d, tile) {
    const g = new THREE.BoxGeometry(w, h, d);
    if (!tile) return g;
    const uv = g.attributes.uv;
    // face order: +x, -x, +y, -y, +z, -z
    const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, uv.getX(i) * dims[f][0] / tile, uv.getY(i) * dims[f][1] / tile);
    }
    uv.needsUpdate = true;
    return g;
  }

  P.add = function (mesh, parent) { (parent || this.root).add(mesh); return mesh; };

  P.box = function (w, h, d, mat, x, y, z, opts) {
    opts = opts || {};
    const m = new THREE.Mesh(boxGeo(w, h, d, opts.tile), mat);
    m.position.set(x, y, z);
    if (opts.ry) m.rotation.y = opts.ry;
    this.add(m, opts.parent);
    if (opts.collide) this.collider(x - w / 2, z - d / 2, x + w / 2, z + d / 2);
    return m;
  };

  P.cyl = function (rt, rb, h, mat, x, y, z, opts) {
    opts = opts || {};
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, opts.seg || 16), mat);
    m.position.set(x, y, z);
    this.add(m, opts.parent);
    if (opts.collide) this.collider(x - rb, z - rb, x + rb, z + rb);
    return m;
  };

  P.plane = function (w, h, mat, x, y, z, rx, ry, opts) {
    opts = opts || {};
    const g = new THREE.PlaneGeometry(w, h);
    if (opts.tile) tileUV(g, w / opts.tile, h / opts.tile);
    const m = new THREE.Mesh(g, mat);
    m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0);
    this.add(m, opts.parent);
    return m;
  };

  P.collider = function (x0, z0, x1, z1) {
    const c = { x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), on: true };
    this.colliders.push(c);
    return c;
  };

  P.zone = function (name, kind, x0, z0, x1, z1, extra) {
    const z = Object.assign({ name, kind, x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1) }, extra || {});
    this.zones.push(z);
    return z;
  };

  P.interact = function (mesh, data) {
    mesh.userData.it = data;
    this.interactables.push(mesh);
    return mesh;
  };

  P.floor = function (x0, z0, x1, z1, mat, tile, y) {
    const w = x1 - x0, d = z1 - z0;
    return this.plane(w, d, mat, (x0 + x1) / 2, y || 0, (z0 + z1) / 2, -Math.PI / 2, 0, { tile: tile || 2 });
  };

  P.ceil = function (x0, z0, x1, z1, h, mat) {
    const w = x1 - x0, d = z1 - z0;
    return this.plane(w, d, mat || this.M.ceiling, (x0 + x1) / 2, h, (z0 + z1) / 2, Math.PI / 2, 0, { tile: 1.2 });
  };

  // A wall slab. styles: corr | tile | pool | wood | room | arcade | plain
  P.slab = function (style, x0, x1, z0, z1, y0, y1, parent) {
    const M = this.M;
    const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const parts = {
      corr: [[M.wood, 0, 1.05], [M.wallpaper, 1.05, 99]],
      room: [[M.wood, 0, 0.9], [M.wallpaperRoom, 0.9, 99]],
      tile: [[M.tile, 0, 99]],
      pool: [[M.tilePool, 0, 99]],
      wood: [[M.wood, 0, 99]],
      arcade: [[M.woodDark, 0, 99]],
      plain: [[M.cream, 0, 99]],
      lobby: [[M.wood, 0, 1.05], [M.wallpaper, 1.05, 99]],
    }[style] || [[M.cream, 0, 99]];
    for (const [mat, a, b] of parts) {
      const ya = Math.max(y0, a), yb = Math.min(y1, b);
      if (yb <= ya) continue;
      const m = new THREE.Mesh(boxGeo(w, yb - ya, d, 1.2), mat);
      m.position.set(cx, (ya + yb) / 2, cz);
      this.add(m, parent);
    }
  };

  // Axis-aligned wall with openings, two styled faces (A on the negative side, B on the positive side).
  // axis 'x': wall runs along x at z = at. axis 'z': runs along z at x = at.
  P.wall = function (axis, at, from, to, h, styleA, styleB, openings, opts) {
    opts = opts || {};
    const t = 0.1;
    openings = (openings || []).slice().sort((a, b) => a.c - b.c);
    const segs = [];
    let cur = from;
    for (const o of openings) {
      const a = o.c - o.w / 2, b = o.c + o.w / 2;
      if (a > cur) segs.push([cur, a]);
      cur = b;
    }
    if (cur < to) segs.push([cur, to]);
    const put = (s0, s1, y0, y1, collide) => {
      if (axis === 'x') {
        this.slab(styleA, s0, s1, at - t, at, y0, y1, opts.parent);
        this.slab(styleB, s0, s1, at, at + t, y0, y1, opts.parent);
        if (collide) this.collider(s0, at - t, s1, at + t);
      } else {
        this.slab(styleA, at - t, at, s0, s1, y0, y1, opts.parent);
        this.slab(styleB, at, at + t, s0, s1, y0, y1, opts.parent);
        if (collide) this.collider(at - t, s0, at + t, s1);
      }
    };
    segs.forEach(([a, b]) => put(a, b, 0, h, true));
    openings.forEach((o) => { const oh = o.h || 2.2; if (oh < h) put(o.c - o.w / 2, o.c + o.w / 2, oh, h, false); });
  };

  // A brass cone pendant hung from the ceiling at height y. Returns the glowing part,
  // which is what flickers. Shared with the generated wings.
  P.pendant = function (x, y, z, parent) {
    const M = this.M;
    const drop = y > 4 ? Math.min(3.2, y * 0.35) : 0.55;
    const g = new THREE.Group(); g.position.set(x, y, z); (parent || this.root).add(g);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, drop, 5), M.brass); rod.position.y = -drop / 2; g.add(rod);
    const big = y > 4 ? 1.6 : 1;
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.34 * big, 0.36 * big, 18, 1, true), M.shade); shade.position.y = -drop - 0.12 * big; g.add(shade);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.08, 10), M.brass); cap.position.y = -drop + 0.06 * big; g.add(cap);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.32 * big, 18), M.fixture); glow.rotation.x = Math.PI / 2; glow.position.y = -drop - 0.29 * big; g.add(glow);
    return { glow, drop: drop + 0.3 * big };
  };

  P.fixture = function (x, y, z, axis, len, parent, flickerable) {
    const p = this.pendant(x, y, z, parent);
    const wp = new THREE.Vector3();
    (parent || this.root).updateMatrixWorld(true);
    p.glow.getWorldPosition(wp);
    this.fixtures.push({ mesh: p.glow, pos: wp.clone().setY(wp.y - 0.25), flickerable: flickerable !== false, color: 0xffd2a0 });
    return p.glow;
  };

  P.signMesh = function (tex, w, h, x, y, z, ry, opts) {
    opts = opts || {};
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: !!opts.transparent, blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: !opts.additive, side: opts.double ? THREE.DoubleSide : THREE.FrontSide });
    const m = this.plane(w, h, mat, x, y, z, 0, ry || 0, opts);
    return m;
  };

  P.lamp = function (x, y, z, parent) {
    this.cyl(0.08, 0.12, 0.35, this.M.brass, x, y + 0.17, z, { parent });
    const shade = this.cyl(0.14, 0.24, 0.3, this.M.lampShade, x, y + 0.5, z, { parent });
    return shade;
  };

  P.clock = function (x, y, z, ry, size, parent, fixed) {
    if (!this.clockTex) {
      this.clockCanvas = Tex.canvas(128, 128);
      this.clockTex = new THREE.CanvasTexture(this.clockCanvas);
      this.fixedClockCanvas = Tex.canvas(128, 128);
      this.fixedClockTex = new THREE.CanvasTexture(this.fixedClockCanvas);
      Tex.drawClock(this.clockCanvas.getContext('2d'), 128, 8, 0);
      Tex.drawClock(this.fixedClockCanvas.getContext('2d'), 128, 8, 0);
    }
    const mat = new THREE.MeshBasicMaterial({ map: fixed ? this.fixedClockTex : this.clockTex, transparent: true });
    const m = this.plane(size || 0.5, size || 0.5, mat, x, y, z, 0, ry || 0, { parent });
    return m;
  };

  // ----------------------------------------------------------- build
  P.build = function () {
    this.buildAtrium();
    this.buildWestWing();
    this.buildEastWing();
    this.buildPool();
    this.buildArcade();
    this.buildDining();
    this.buildExits();
    this.buildPromenade();
    this.buildGardenCourt();
    this.zone('THE WINGS', 'corridor', -1e5, -1e5, 1e5, -44, { area: 'wing' });
  };

  // ----------------------------------------------------------- atrium
  P.buildAtrium = function () {
    const M = this.M, H = 7;
    this.floor(-12, -12, 12, 12, M.carpet, 2.4);
    this.ceil(-12, -12, 12, 12, H);
    this.wall('z', -12, -12, 12, H, 'corr', 'corr', [{ c: 0, w: 3, h: 2.7 }]);
    this.wall('z', 12, -12, 12, H, 'corr', 'corr', [{ c: 0, w: 3, h: 2.7 }]);
    this.wall('x', -12, -12, 12, H, 'corr', 'corr', [{ c: -9, w: 3, h: 3.0 }]);
    this.wall('x', 12, -12, 12, H, 'corr', 'corr', [{ c: 0, w: 3, h: 2.7 }]);
    this.zone('THE ATRIUM', 'atrium', -12, -12, 12, 12, { area: 'atrium', ceiling: H });

    // ceiling light wells: too many, too even
    for (let x = -8; x <= 8; x += 4) for (let z = -8; z <= 8; z += 4) this.fixture(x, H, z, 'x', 2.2, null, true);

    // emblem rug
    const rc = Tex.canvas(512, 512), rg = rc.getContext('2d');
    rg.fillStyle = '#6a3216'; rg.beginPath(); rg.arc(256, 256, 255, 0, Math.PI * 2); rg.fill();
    Tex.drawEmblem(rg, 256, 256, 230, { bg: '#1c3a3a' });
    const rug = this.plane(5, 5, new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(rc), transparent: true }), 0, 0.025, -4.5, -Math.PI / 2, 0);
    rug.rotation.z = Math.PI;

    // the front desk
    this.box(9, 1.1, 1, M.wood, 0, 0.55, -8.5, { collide: true, tile: 1 });
    this.box(9.2, 0.06, 1.2, M.brass, 0, 1.12, -8.5);
    this.collider(-4.6, -12, -4.4, -8); this.collider(4.4, -12, 4.6, -8);
    this.box(0.2, 1.1, 3.5, M.wood, -4.5, 0.55, -10.25, { tile: 1 });
    this.box(0.2, 1.1, 3.5, M.wood, 4.5, 0.55, -10.25, { tile: 1 });
    // pigeonholes of keys behind the desk
    this.box(6, 2.2, 0.4, M.woodDark, 0, 2.4, -11.7);
    for (let i = 0; i < 10; i++) for (let j = 0; j < 4; j++) {
      this.box(0.5, 0.45, 0.05, M.black, -2.7 + i * 0.6, 1.6 + j * 0.52, -11.48);
      if ((i * 7 + j * 3) % 5 !== 0) this.box(0.04, 0.16, 0.02, M.brass, -2.7 + i * 0.6, 1.55 + j * 0.52, -11.44);
    }
    const bell = this.cyl(0.04, 0.12, 0.1, M.brass, 2.6, 1.2, -8.3);
    this.interact(bell, { type: 'deskbell' });
    const clerkSpot = { x: 0, z: -9.9, ry: 0 };
    this.clerkSpot = clerkSpot;
    const forms = this.box(0.5, 0.02, 0.35, M.cream, -1.2, 1.16, -8.4);
    this.interact(forms, { type: 'clerk' });
    this.clockAt = this.clock(0, 4.2, -11.78, 0, 0.9);
    this.signMesh(Tex.sign('FRONT DESK', { w: 512, h: 96 }), 3, 0.56, 0, 3.6, -11.78, 0);

    // neon: THE INN BETWEEN
    this.neonSign = this.signMesh(Tex.neon('The Inn Between', '#4dff9a', { underline: '#ff3a2a' }), 11, 2.75, 0, 5.4, -11.75, 0, { transparent: true, additive: true });
    this.neonLight = { pos: new THREE.Vector3(0, 4.5, -9), color: 0x4dff9a };

    // residents plaque (names of guests who stayed)
    this.residentsMesh = this.signMesh(Tex.residentsPlaque(this.opts.residents || []), 1.3, 1.3, 6.4, 1.7, -11.85, 0);
    this.interact(this.residentsMesh, { type: 'residents' });

    // rule plaque
    this.plaques.atrium = this.plaqueMesh('atrium', -6.2, 1.6, -11.85, 0);

    // elevator implying more floors than exist
    this.box(2, 2.4, 0.15, M.chrome, 9, 1.2, -11.85);
    this.box(0.04, 2.4, 0.17, M.black, 9, 1.2, -11.84);
    const dial = Tex.canvas(256, 128), dg = dial.getContext('2d');
    dg.fillStyle = '#2a1a0a'; dg.fillRect(0, 0, 256, 128);
    dg.strokeStyle = '#c9a24a'; dg.lineWidth = 4; dg.beginPath(); dg.arc(128, 120, 100, Math.PI, 0); dg.stroke();
    dg.fillStyle = '#e8d3a0'; dg.font = 'bold 16px Georgia'; dg.textAlign = 'center';
    ['1', '2', '3', '9', '14', '40', '?', '∞'].forEach((n, i) => {
      const a = Math.PI + (i + 0.5) / 8 * Math.PI;
      dg.fillText(n, 128 + Math.cos(a) * 82, 126 + Math.sin(a) * 82);
    });
    this.signMesh(new THREE.CanvasTexture(dial), 1, 0.5, 9, 2.75, -11.84, 0);
    this.elevatorNeedle = this.box(0.02, 0.36, 0.02, M.orange, 9, 2.6, -11.82);
    this.elevatorNeedle.geometry.translate(0, 0.18, 0);
    this.elevatorNeedle.position.y = 2.53;
    const call = this.box(0.12, 0.25, 0.05, M.brass, 10.3, 1.2, -11.85);
    this.interact(call, { type: 'elevator' });

    // lounge
    const sofa = (x, z, ry, mat) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry;
      this.box(2.2, 0.45, 0.9, mat, 0, 0.22, 0, { parent: g });
      this.box(2.2, 0.55, 0.2, mat, 0, 0.6, -0.4, { parent: g });
      this.box(0.2, 0.3, 0.9, mat, -1.1, 0.55, 0, { parent: g });
      this.box(0.2, 0.3, 0.9, mat, 1.1, 0.55, 0, { parent: g });
      this.add(g);
      const c = Math.abs(Math.sin(ry)) > 0.5;
      this.collider(x - (c ? 0.5 : 1.2), z - (c ? 1.2 : 0.5), x + (c ? 0.5 : 1.2), z + (c ? 1.2 : 0.5));
      return g;
    };
    const chair = (x, z, ry, mat, parent) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry;
      this.box(0.8, 0.42, 0.8, mat, 0, 0.21, 0, { parent: g });
      this.box(0.8, 0.6, 0.16, mat, 0, 0.7, -0.34, { parent: g });
      this.add(g, parent);
      if (!parent) this.collider(x - 0.45, z - 0.45, x + 0.45, z + 0.45);
      return g;
    };
    this.chairFn = chair;
    sofa(-5, 2, 0, M.avocado); sofa(-5, 7, Math.PI, M.avocado);
    this.box(1.6, 0.4, 0.9, M.darkGlass, -5, 0.2, 4.5, { collide: true });
    sofa(6, 3, Math.PI / 2, M.harvest); chair(9, 5.5, -Math.PI / 2, M.rustFab); chair(9, 2, -Math.PI / 2, M.rustFab);
    this.box(0.9, 0.4, 0.9, M.darkGlass, 7.6, 0.2, 3.8, { collide: true });
    // floor lamps & plants
    for (const [x, z] of [[10.5, 10.5], [-10.5, 10.5], [10.5, -6]]) {
      this.cyl(0.3, 0.35, 0.6, M.orange, x, 0.3, z, { collide: true });
      const p = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.6, 7), M.plant); p.position.set(x, 1.4, z); this.add(p);
    }
    for (const [x, z] of [[-8, 9], [3, 8]]) {
      this.cyl(0.03, 0.03, 1.7, M.chrome, x, 0.85, z);
      const s = this.cyl(0.2, 0.3, 0.35, M.lampShade, x, 1.8, z);
      this.fixtures.push({ mesh: s, pos: new THREE.Vector3(x, 1.6, z), flickerable: false, color: 0xffc070, warm: true });
    }
    // chrome columns
    for (const [x, z] of [[-8, -6], [8, -6], [-8, 9.5], [8, 9.5]]) this.cyl(0.35, 0.35, H, M.chrome, x, H / 2, z, { collide: true, seg: 20 });

    // guests in the lounge
    this.guestSpots.push({ area: 'atrium', type: 'armored', x: -5.4, z: 2.1, ry: Math.PI, pose: 'sit' });
    this.guestSpots.push({ area: 'atrium', type: 'almost', x: -4.2, z: 6.9, ry: 0, pose: 'sit' });
    this.guestSpots.push({ area: 'atrium', type: 'tall', x: 6.1, z: 2.6, ry: -Math.PI / 2, pose: 'sit' });
    this.guestSpots.push({ area: 'atrium', type: 'tentacle', x: 9, z: 5.5, ry: -Math.PI / 2, pose: 'sit' });
    this.guestSpots.push({ area: 'atrium', type: 'tall', x: 10.2, z: -9.5, ry: Math.PI * 0.85, pose: 'stand' });

    // directions
    this.signMesh(Tex.sign('← ROOMS 101 – 116', { w: 512, h: 96 }), 2.8, 0.52, -11.88, 3.1, 0, Math.PI / 2);
    this.signMesh(Tex.sign('ROOMS 117 – 120 · POOL · ARCADE →', { w: 768, h: 96 }), 3.6, 0.45, 11.88, 3.1, 0, -Math.PI / 2);
    this.signMesh(Tex.sign('DINING ROOM', { w: 512, h: 96 }), 2.4, 0.45, 0, 3.1, 11.88, Math.PI);
    this.soundSpots.push({ kind: 'muzak', pos: new THREE.Vector3(0, 6, 0) });
  };

  P.plaqueMesh = function (key, x, y, z, ry) {
    const R = INN.RULES[key];
    const m = this.signMesh(Tex.plaque(R.title, R.lines.map((l, i) => (i + 1) + '. ' + l)), 0.8, 1.0, x, y, z, ry);
    this.box(0.9, 1.1, 0.04, this.M.woodDark, x - Math.sin(ry) * 0.035, y, z - Math.cos(ry) * 0.035, { ry });
    this.interact(m, { type: 'plaque', key });
    return m;
  };

  // ----------------------------------------------------------- corridors
  P.corridorShell = function (x0, x1, h, sideN, sideS) {
    const M = this.M;
    this.floor(x0, -1.5, x1, 1.5, M.carpet, 2.4);
    this.ceil(x0, -1.5, x1, 1.5, h);
    for (let x = x0 + 3; x < x1; x += 6) this.fixture(x, h, 0, 'x', 1.3, null, true);
  };

  P.buildWestWing = function () {
    const M = this.M, H = 2.7;
    this.corridorShell(-62, -12, H);
    this.zone('WEST CORRIDOR', 'corridor', -62, -1.5, -12, 1.5, { area: 'west' });
    // alcove walls next to the atrium
    this.wall('x', -1.5, -14, -12, H, 'corr', 'corr');
    this.wall('x', 1.5, -14, -12, H, 'corr', 'corr');
    // vending: almost-right snacks
    this.vendingMachine('snax', -13, -1.05, 0);
    // ice machine
    this.box(1, 1.2, 0.7, M.metal, -13, 0.6, 1.1, { collide: true });
    this.signMesh(Tex.sign('ICE', { w: 256, h: 96, bg: '#1c3a3a', fg: '#e8f0ea', border: '#5fb3ad' }), 0.8, 0.3, -13, 1.6, 1.42, Math.PI);
    this.soundSpots.push({ kind: 'ice', pos: new THREE.Vector3(-13, 1, 1.1) });

    const plan = INN.ROOMS;
    for (let i = 0; i < 8; i++) {
      const x0 = -20 - 6 * i;
      this.buildRoom(101 + 2 * i, x0, 'N');
      this.buildRoom(102 + 2 * i, x0, 'S');
    }
    void plan;
  };

  P.buildEastWing = function () {
    const M = this.M, H = 2.7;
    this.corridorShell(12, 58, H);
    this.zone('EAST CORRIDOR', 'corridor', 12, -1.5, 58, 1.5, { area: 'east' });
    // north wall: pool and arcade share it
    this.wall('x', -1.5, 12, 40, H, 'pool', 'corr', [{ c: 17, w: 2.2, h: 2.3 }]);
    this.wall('x', -1.5, 40, 58, H, 'arcade', 'corr', [{ c: 44, w: 2.2, h: 2.3 }]);
    this.signMesh(Tex.sign('POOL', { w: 256, h: 96, bg: '#1c3a3a', fg: '#9ff0e8', border: '#5fb3ad' }), 1, 0.38, 17, 2.48, -1.38, 0);
    this.signMesh(Tex.sign('ARCADE', { w: 256, h: 96, bg: '#3a1c2a', fg: '#ffb0d0', border: '#ff4fa0' }), 1.1, 0.4, 44, 2.48, -1.38, 0);
    this.plaques.pool = this.plaqueMesh('pool', 19.6, 1.55, -1.38, 0);
    this.plaques.arcade = this.plaqueMesh('arcade', 46.6, 1.55, -1.38, 0);
    // south side: rooms 117-120 then plain wall
    for (let j = 0; j < 4; j++) this.buildRoom(117 + j, 14 + 6 * j, 'S');
    this.wall('x', 1.5, 38, 58, H, 'corr', 'plain');
    this.wall('x', 1.5, 12, 14, H, 'corr', 'plain');
    this.vendingMachine('provisions', 41, 1.05, Math.PI);
    this.vendingMachine('shoes', 50, -1.05, 0);
  };

  // ----------------------------------------------------------- rooms
  // A room module. Built in local space: corridor wall on z=0, interior z in [0,7], x in [-3,3].
  P.buildRoom = function (num, x0, side) {
    const M = this.M;
    const spec = INN.ROOMS[num] || { kind: 'key' };
    const cx = x0 + 3;
    const g = new THREE.Group();
    const flip = side === 'N';
    g.position.set(cx, 0, flip ? -1.5 : 1.5);
    g.rotation.y = flip ? Math.PI : 0;
    this.add(g);
    g.updateMatrixWorld(true);
    const L = (x, z) => ({ x: flip ? cx - x : cx + x, z: flip ? -1.5 - z : 1.5 + z });
    const lcol = (x0_, z0_, x1_, z1_) => { const a = L(x0_, z0_), b = L(x1_, z1_); return this.collider(a.x, a.z, b.x, b.z); };

    const doorX = -1.6, H = 2.7, RH = 2.6;
    // front wall: corridor face toward -z(local), room face toward +z(local)
    const front = (a, b, y0, y1) => {
      this.slab('corr', a, b, -0.1, 0, y0, y1, g);
      this.slab('room', a, b, 0, 0.1, y0, Math.min(y1, RH), g);
    };
    front(-3, doorX - 0.5, 0, H); front(doorX + 0.5, 3, 0, H); front(doorX - 0.5, doorX + 0.5, 2.15, H);
    lcol(-3, -0.1, doorX - 0.5, 0.1); lcol(doorX + 0.5, -0.1, 3, 0.1);

    const room = {
      num, side, cx, group: g, L, kind: spec.kind, dnd: spec.dnd, x0,
      doorWorld: new THREE.Vector3(L(doorX, -0.6).x, 1.5, L(doorX, -0.6).z),
      insideWorld: new THREE.Vector3(L(0, 3.5).x, 1.5, L(0, 3.5).z),
      plateNum: num,
    };
    this.rooms[num] = room;

    // door
    const pivot = new THREE.Group();
    pivot.position.set(doorX - 0.47, 0, 0);
    g.add(pivot);
    const panel = this.box(0.94, 2.12, 0.05, M.door, 0.47, 1.06, -0.02, { parent: pivot, tile: 1 });
    this.box(0.06, 0.06, 0.08, M.brass, 0.84, 1.0, -0.07, { parent: pivot });
    this.box(0.06, 0.06, 0.08, M.brass, 0.84, 1.0, 0.03, { parent: pivot });
    const plateMat = new THREE.MeshBasicMaterial({ map: Tex.doorPlate(num) });
    const plate = this.plane(0.28, 0.14, plateMat, 0.47, 1.62, -0.06, 0, Math.PI, { parent: pivot });
    const door = { pivot, panel, angle: 0, target: 0, room, plate, plateMat, locked: spec.kind === 'occupied' };
    door.collider = lcol(doorX - 0.5, -0.06, doorX + 0.5, 0.06);
    this.interact(panel, { type: 'door', num });
    room.door = door;
    this.doors.push(door);

    // key hook beside the door, corridor side
    room.keyHookLocal = new THREE.Vector3(doorX + 0.62, 1.45, -0.12);
    this.box(0.04, 0.04, 0.08, M.brass, room.keyHookLocal.x, 1.52, -0.12, { parent: g });
    room.key = this.makeKey(num);
    room.key.position.copy(room.keyHookLocal);
    room.key.rotation.y = Math.PI;
    g.add(room.key);
    room.key.visible = false;
    this.interact(room.key.userData.hit, { type: 'key', num });

    if (spec.dnd) {
      const card = this.plane(0.16, 0.32, new THREE.MeshBasicMaterial({ map: Tex.dndCard(), side: THREE.DoubleSide }), 0.8, 0.86, -0.1, 0, Math.PI, { parent: pivot });
      card.rotation.z = 0.05;
      room.dndCard = card;
    }

    // interior (hidden when the door is shut and the guest is elsewhere)
    const inner = new THREE.Group(); g.add(inner);
    room.inner = inner;
    if (spec.dnd === 'copy') { this.buildCopyCorridor(room, inner); return; }
    inner.add(this.plane(6, 7, M.carpetRoom, 0, 0.005, 3.5, -Math.PI / 2, 0, { tile: 2, parent: inner }));
    this.plane(6, 7, M.ceiling, 0, RH, 3.5, Math.PI / 2, 0, { tile: 1.2, parent: inner });
    this.slab('room', 2.85, 2.95, 0.1, 7, 0, RH, inner); this.slab('room', -2.95, -2.85, 0.1, 7, 0, RH, inner);
    this.slab('room', -3, 3, 6.9, 7.0, 0, RH, inner);
    lcol(2.85, 0, 2.95, 7); lcol(-2.95, 0, -2.85, 7); lcol(-3, 6.9, 3, 7);
    this.fixture(0, RH, 3.5, 'x', 1.0, inner, true);
    const fx = this.fixtures[this.fixtures.length - 1];
    fx.room = num;
    room.zone = (() => { const a = L(-2.85, 0.1), b = L(2.85, 6.9); return this.zone('ROOM ' + num, spec.dnd ? 'dnd' : 'room', a.x, a.z, b.x, b.z, { num, area: 'room' }); })();

    if (spec.dnd === 'clocks') return this.buildClockRoom(room, inner, lcol);
    if (spec.dnd === 'anatomy') return this.buildAnatomyRoom(room, inner, lcol);
    if (spec.dnd === 'audience') return this.buildAudienceRoom(room, inner, lcol);
    this.furnishRoom(room, inner, lcol);
  };

  P.makeKey = function (num) {
    const M = this.M, k = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 14), M.brass); ring.position.y = 0.0; k.add(ring);
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.09, 0.006), M.brass); shaft.position.y = -0.08; k.add(shaft);
    const bit = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.012, 0.006), M.brass); bit.position.set(0.015, -0.115, 0); k.add(bit);
    const tag = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.012), M.orange); tag.position.set(0, -0.1, -0.02); k.add(tag);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 0.1), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = -0.06; k.add(hit);
    k.userData.hit = hit;
    k.userData.num = num;
    return k;
  };

  P.furnishRoom = function (room, inner, lcol) {
    const M = this.M;
    const b = (w, h, d, m, x, y, z) => this.box(w, h, d, m, x, y, z, { parent: inner });
    // bed: headboard against the right wall
    b(0.12, 1.1, 1.7, M.woodDark, 2.78, 0.55, 3.8);
    b(2.1, 0.4, 1.6, M.woodDark, 1.75, 0.2, 3.8);
    b(2.05, 0.18, 1.55, M.sheet, 1.75, 0.49, 3.8);
    const spreadMade = b(1.6, 0.06, 1.62, M.harvest, 1.45, 0.6, 3.8);
    const spreadMess = b(1.4, 0.12, 1.3, M.harvest, 1.25, 0.62, 3.6);
    spreadMess.rotation.y = 0.35; spreadMess.rotation.z = 0.06;
    const pillow = b(0.35, 0.14, 0.6, M.white, 2.5, 0.65, 3.4); const pillow2 = b(0.35, 0.14, 0.6, M.white, 2.5, 0.65, 4.2);
    pillow2.rotation.y = 0.4;
    lcol(0.7, 2.95, 2.9, 4.65);
    room.bed = { spreadMade, spreadMess, pillow2 };
    spreadMade.visible = false;
    const bedHit = this.box(2.1, 0.8, 1.6, new THREE.MeshBasicMaterial({ visible: false }), 1.75, 0.4, 3.8, { parent: inner });
    this.interact(bedHit, { type: 'bed', num: room.num });
    // towels (appear after service)
    room.towels = new THREE.Group();
    [0, 1, 2].forEach((i) => this.box(0.4, 0.06, 0.3, M.white, 0, 0.03 + i * 0.065, 0, { parent: room.towels }));
    room.towels.position.set(1.2, 0.64, 3.9); room.towels.visible = false; inner.add(room.towels);
    // nightstands and lamp
    b(0.5, 0.55, 0.45, M.woodDark, 2.55, 0.27, 2.6); lcol(2.3, 2.38, 2.9, 2.83);
    b(0.5, 0.55, 0.45, M.woodDark, 2.55, 0.27, 5.0); lcol(2.3, 4.78, 2.9, 5.23);
    this.lamp(2.55, 0.55, 2.6, inner);
    // dresser + television on the left wall
    b(0.55, 0.8, 1.7, M.wood, -2.55, 0.4, 3.9); lcol(-2.85, 3.05, -2.25, 4.75);
    b(0.5, 0.45, 0.6, M.woodDark, -2.5, 1.03, 3.6);
    const scr = this.plane(0.42, 0.32, M.screenOff, -2.24, 1.04, 3.6, 0, Math.PI / 2, { parent: inner });
    room.tv = scr;
    this.clock(-2.84, 1.95, 3.9, Math.PI / 2, 0.42, inner);
    // armchair
    const ch = this.chairFn(-2.0, 6.0, Math.PI * 0.8, M.avocado, inner); void ch;
    lcol(-2.5, 5.5, -1.5, 6.5);
    // curtained window (there is nothing behind it)
    this.box(2.2, 1.6, 0.06, M.curtain, 0.3, 1.45, 6.86, { parent: inner });
    this.box(2.4, 0.08, 0.1, M.brass, 0.3, 2.3, 6.84, { parent: inner });
    const glow = this.plane(2.3, 0.05, new THREE.MeshBasicMaterial({ color: 0xff70a8 }), 0.3, 0.64, 6.84, 0, Math.PI, { parent: inner });
    void glow;
    // a bathroom door that is always occupied
    this.box(0.8, 2.0, 0.05, M.woodDark, 2.2, 1.0, 6.86, { parent: inner });
    // luggage: unpacked by the bed, or packed by the door
    room.luggage = this.makeSuitcase(inner); room.luggage.position.set(0.1, 0, 5.3); room.luggage.rotation.y = 0.3;
    room.luggage.visible = false;
    room.luggagePacked = this.makeSuitcase(inner, true); room.luggagePacked.position.set(-0.75, 0, 0.55);
    room.luggagePacked.visible = false;
  };

  P.makeSuitcase = function (parent, closed) {
    const M = this.M, g = new THREE.Group();
    if (closed) {
      this.box(0.7, 0.5, 0.22, M.rustFab, 0, 0.25, 0, { parent: g });
      this.box(0.25, 0.04, 0.04, M.brass, 0, 0.53, 0, { parent: g });
    } else {
      this.box(0.7, 0.12, 0.5, M.rustFab, 0, 0.06, 0, { parent: g });
      const lid = this.box(0.7, 0.5, 0.06, M.rustFab, 0, 0.3, -0.27, { parent: g }); lid.rotation.x = -0.2;
      this.box(0.6, 0.06, 0.4, M.cream, 0, 0.14, 0, { parent: g });
    }
    parent.add(g);
    return g;
  };

  // DND: a room full of clocks set to your check-in time
  P.buildClockRoom = function (room, inner, lcol) {
    const M = this.M;
    room.clocks = [];
    for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) {
      const z = 0.6 + i * 0.7, y = 0.5 + j * 0.55;
      this.clock(2.84, y, z, -Math.PI / 2, 0.42 + ((i + j) % 3) * 0.06, inner, true);
      this.clock(-2.84, y + 0.2, z + 0.2, Math.PI / 2, 0.38 + ((i * j) % 3) * 0.06, inner, true);
    }
    for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) this.clock(-2.5 + i * 0.7, 0.5 + j * 0.55, 6.84, Math.PI, 0.44, inner, true);
    for (let i = 0; i < 18; i++) {
      const c = this.clock(-2 + (i % 6) * 0.8, 0.02, 1.2 + Math.floor(i / 6) * 1.6, 0, 0.5, inner, true);
      c.rotation.x = -Math.PI / 2; c.rotation.z = i * 0.7;
    }
    const table = this.box(0.8, 0.7, 0.8, M.woodDark, 0, 0.35, 4.6, { parent: inner }); void table;
    lcol(-0.4, 4.2, 0.4, 5.0);
    const item = this.clock(0, 0.86, 4.6, 0, 0.32, inner, true);
    item.rotation.x = -Math.PI / 2.4;
    this.interact(item, { type: 'dnditem', num: room.num, item: 'clock' });
    room.item = item;
    room.tickSpot = room.insideWorld.clone();
  };

  // DND: a room furnished for something with different anatomy
  P.buildAnatomyRoom = function (room, inner, lcol) {
    const M = this.M;
    const b = (w, h, d, m, x, y, z) => this.box(w, h, d, m, x, y, z, { parent: inner });
    // a bed four meters long and half a meter wide, set on a slope
    const bed = new THREE.Group(); inner.add(bed);
    this.box(0.55, 0.3, 4.6, M.woodDark, 0, 0.5, 0, { parent: bed });
    this.box(0.5, 0.1, 4.5, M.sheet, 0, 0.7, 0, { parent: bed });
    this.box(0.5, 0.08, 0.3, M.white, 0, 0.78, -2.1, { parent: bed });
    this.box(0.5, 0.08, 0.3, M.white, 0, 0.78, 2.1, { parent: bed });
    bed.position.set(1.9, 0.0, 3.6); bed.rotation.x = 0.06;
    for (const z of [-2.2, -0.7, 0.7, 2.2]) this.box(0.06, 0.5, 0.06, M.brass, 0, 0.25, z, { parent: bed });
    lcol(1.6, 1.3, 2.2, 5.9);
    // a sink mounted too high, a mirror at the ankle
    b(0.6, 0.15, 0.4, M.white, -2.6, 2.3, 2.0);
    b(0.04, 0.3, 0.04, M.chrome, -2.75, 2.5, 2.0);
    b(0.04, 0.35, 0.7, M.chrome, -2.84, 0.25, 2.0);
    this.plane(0.66, 0.3, new THREE.MeshPhongMaterial({ color: 0x9aa4a4, shininess: 120, specular: 0xffffff }), -2.81, 0.25, 2.0, 0, Math.PI / 2, { parent: inner });
    // chairs with the back on the wrong side and three legs at different heights
    for (const [x, z, r] of [[-1.2, 4.4, 0.4], [-0.2, 5.6, 2.2], [-1.8, 5.8, 4.1]]) {
      const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = r; inner.add(c);
      this.box(0.6, 0.06, 0.6, M.avocado, 0, 0.95, 0, { parent: c });
      this.box(0.6, 0.9, 0.06, M.avocado, 0, 0.45, 0.3, { parent: c });
      [[-0.25, -0.25, 0.95], [0.25, -0.25, 0.7], [0, 0.25, 1.2]].forEach(([lx, lz, lh]) => this.box(0.04, lh, 0.04, M.woodDark, lx, lh / 2, lz, { parent: c }));
    }
    lcol(-2.2, 3.9, 0.2, 6.3);
    // a wardrobe of six-sleeved garments
    b(1.8, 0.04, 0.04, M.chrome, -0.6, 2.2, 6.6);
    for (let i = 0; i < 4; i++) {
      const gar = new THREE.Group(); gar.position.set(-1.3 + i * 0.45, 1.45, 6.6); inner.add(gar);
      this.box(0.35, 1.1, 0.08, i % 2 ? M.rustFab : M.harvest, 0, 0, 0, { parent: gar });
      for (let s = 0; s < 3; s++) {
        const sl = this.box(0.6, 0.08, 0.06, i % 2 ? M.rustFab : M.harvest, 0, 0.4 - s * 0.32, 0, { parent: gar });
        sl.rotation.z = 0.5 - s * 0.1;
        const sr = this.box(0.6, 0.08, 0.06, i % 2 ? M.rustFab : M.harvest, 0, 0.4 - s * 0.32, 0, { parent: gar });
        sr.rotation.z = -0.5 + s * 0.1;
      }
      if (i === 2) { room.item = gar; this.interact(gar.children[0], { type: 'dnditem', num: room.num, item: 'garment' }); }
    }
    lcol(-1.6, 6.4, 0.4, 6.9);
    this.lamp(-2.5, 0.0, 0.8, inner);
  };

  // DND: an audience room. The television shows the doorway from behind you.
  P.buildAudienceRoom = function (room, inner, lcol) {
    const M = this.M;
    this.box(1.4, 1.1, 0.7, M.woodDark, 0, 0.55, 6.4, { parent: inner });
    lcol(-0.7, 6.05, 0.7, 6.9);
    this.tvTarget = new THREE.WebGLRenderTarget(256, 192);
    const scr = this.plane(1.0, 0.75, new THREE.MeshBasicMaterial({ map: this.tvTarget.texture }), 0, 0.85, 6.04, 0, Math.PI, { parent: inner });
    room.tvScreen = scr;
    this.box(1.2, 0.12, 0.7, M.wood, 0, 1.16, 6.4, { parent: inner });
    // rows of empty seats with an aisle down the middle
    for (let r = 0; r < 3; r++) for (const x of [-2.0, -1.1, 1.1, 2.0]) {
      const z = 2.2 + r * 1.2;
      this.chairFn(x, z, 0, M.rustFab, inner);
      lcol(x - 0.42, z - 0.42, x + 0.42, z + 0.42);
    }
    const tape = this.box(0.19, 0.03, 0.11, M.black, 0.4, 1.24, 6.3, { parent: inner });
    this.interact(tape, { type: 'dnditem', num: room.num, item: 'tape' });
    room.item = tape;
    room.audience = true;
  };

  // DND: an exact copy of the corridor. It goes somewhere.
  P.buildCopyCorridor = function (room, inner) {
    const M = this.M, H = 2.7, LEN = 40;
    const cx = -1.6; // aligned with the door
    const L = room.L;
    inner.add(this.plane(3, LEN, M.carpet, cx, 0.005, LEN / 2, -Math.PI / 2, 0, { tile: 2.4, parent: inner }));
    this.plane(3, LEN, M.ceiling, cx, H, LEN / 2, Math.PI / 2, 0, { tile: 1.2, parent: inner });
    for (let z = 3; z < LEN; z += 6) { this.fixture(cx, H, z, 'z', 1.3, inner, true); this.fixtures[this.fixtures.length - 1].room = room.num; }
    const sideWall = (x, sgn) => {
      for (let z = 0; z < LEN; z += 6) {
        const dz = z + 3 - 1.6 * sgn;
        this.slab('corr', x - 0.05, x + 0.05, z, dz - 0.5, 0, H, inner);
        this.slab('corr', x - 0.05, x + 0.05, dz + 0.5, z + 6, 0, H, inner);
        this.slab('corr', x - 0.05, x + 0.05, dz - 0.5, dz + 0.5, 2.15, H, inner);
        this.box(0.04, 2.12, 0.94, M.door, x - 0.02 * sgn, 1.06, dz, { parent: inner, tile: 1 });
        const n = 101 + 2 * Math.floor(z / 6) + (sgn > 0 ? 1 : 0);
        this.plane(0.28, 0.14, new THREE.MeshBasicMaterial({ map: Tex.doorPlate(n) }), x - 0.07 * sgn, 1.62, dz, 0, -sgn * Math.PI / 2, { parent: inner });
        if (z === 18 && sgn > 0) {
          const k = this.makeKey('—'); k.position.set(x - 0.08 * sgn, 1.45, dz + 0.62); k.rotation.y = -sgn * Math.PI / 2; inner.add(k);
          this.interact(k.userData.hit, { type: 'dnditem', num: room.num, item: 'blankkey' });
          room.item = k;
        }
      }
    };
    sideWall(cx - 1.55, -1); sideWall(cx + 1.55, 1);
    // colliders in world space
    const a = L(cx - 1.6, 0), b = L(cx - 1.5, LEN); this.collider(a.x, a.z, b.x, b.z);
    const c = L(cx + 1.5, 0), d = L(cx + 1.6, LEN); this.collider(c.x, c.z, d.x, d.z);
    // the end of the copy: stairs
    this.slab('corr', cx - 1.5, cx + 1.5, LEN, LEN + 0.1, 0, H, inner);
    const e = L(cx - 1.5, LEN), f = L(cx + 1.5, LEN + 0.1); this.collider(e.x, e.z, f.x, f.z);
    const endDoor = this.box(1.1, 2.15, 0.06, M.metal, cx, 1.07, LEN - 0.04, { parent: inner });
    this.interact(endDoor, { type: 'shortcut' });
    this.plane(0.9, 0.3, new THREE.MeshBasicMaterial({ map: Tex.sign('STAIRS', { w: 256, h: 96, bg: '#3a0a0a', fg: '#ff6050', border: '#ff6050' }) }), cx, 2.35, LEN - 0.08, 0, Math.PI, { parent: inner });
    // a copy of the snack machine, slightly wrong
    const vm = this.box(1.0, 1.9, 0.8, new THREE.MeshLambertMaterial({ map: Tex.vendingFront('SNAX', INN.VENDING.snax.items.slice().reverse(), '#b0402a') }), cx + 1.05, 0.95, 26, { parent: inner });
    vm.rotation.y = -Math.PI / 2;
    const zz = L(cx - 1.5, 0), zz2 = L(cx + 1.5, LEN);
    room.zone = this.zone('ROOM 101', 'dnd', zz.x, zz.z, zz2.x, zz2.z, { num: room.num, area: 'copy' });
  };

  // ----------------------------------------------------------- vending
  P.vendingMachine = function (key, x, z, ry) {
    const V = INN.VENDING[key];
    const front = new THREE.MeshLambertMaterial({ map: Tex.vendingFront(V.title, V.items, V.accent) });
    const side = new THREE.MeshLambertMaterial({ color: new THREE.Color(V.accent).multiplyScalar(0.6) });
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.9, 0.7), [side, side, side, side, front, side]);
    m.position.set(x, 0.95, z); m.rotation.y = ry;
    this.add(m);
    this.collider(x - 0.5, z - 0.4, x + 0.5, z + 0.4);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 1.5), new THREE.MeshBasicMaterial({ color: 0xfff0d0, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.position.set(0, 0.0, 0.36); m.add(glow);
    this.interact(m, { type: 'vending', key });
    this.vending.push({ key, mesh: m, pos: new THREE.Vector3(x, 1, z) });
    this.fixtures.push({ mesh: glow, pos: new THREE.Vector3(x + Math.sin(ry) * 0.8, 1.2, z + Math.cos(ry) * 0.8), flickerable: false, color: 0xd8f0ff, dim: true });
  };

  // ----------------------------------------------------------- pool
  P.buildPool = function () {
    const M = this.M, H = 6;
    const X0 = 14, X1 = 40, Z0 = -26, Z1 = -1.5;
    const B = { x0: 20, x1: 34, z0: -20, z1: -7 };
    // deck around the basin
    this.floor(X0, Z0, X1, B.z0, M.tileFloor, 1.5);
    this.floor(X0, B.z1, X1, Z1, M.tileFloor, 1.5);
    this.floor(X0, B.z0, B.x0, B.z1, M.tileFloor, 1.5);
    this.floor(B.x1, B.z0, X1, B.z1, M.tileFloor, 1.5);
    // basin
    const D = 1.8;
    this.box(B.x1 - B.x0, 0.05, B.z1 - B.z0, M.tilePool, (B.x0 + B.x1) / 2, -D, (B.z0 + B.z1) / 2, { tile: 1 });
    this.box(B.x1 - B.x0, D, 0.1, M.tilePool, (B.x0 + B.x1) / 2, -D / 2, B.z0 + 0.05, { tile: 1 });
    this.box(B.x1 - B.x0, D, 0.1, M.tilePool, (B.x0 + B.x1) / 2, -D / 2, B.z1 - 0.05, { tile: 1 });
    this.box(0.1, D, B.z1 - B.z0, M.tilePool, B.x0 + 0.05, -D / 2, (B.z0 + B.z1) / 2, { tile: 1 });
    this.box(0.1, D, B.z1 - B.z0, M.tilePool, B.x1 - 0.05, -D / 2, (B.z0 + B.z1) / 2, { tile: 1 });
    // lip
    const lip = (w, d, x, z) => this.box(w, 0.06, d, M.white, x, 0.03, z);
    lip(B.x1 - B.x0 + 0.4, 0.2, (B.x0 + B.x1) / 2, B.z0 - 0.1); lip(B.x1 - B.x0 + 0.4, 0.2, (B.x0 + B.x1) / 2, B.z1 + 0.1);
    lip(0.2, B.z1 - B.z0, B.x0 - 0.1, (B.z0 + B.z1) / 2); lip(0.2, B.z1 - B.z0, B.x1 + 0.1, (B.z0 + B.z1) / 2);
    this.collider(B.x0 - 0.05, B.z0 - 0.05, B.x1 + 0.05, B.z1 + 0.05);
    this.water = this.plane(B.x1 - B.x0, B.z1 - B.z0, M.water, (B.x0 + B.x1) / 2, -0.35, (B.z0 + B.z1) / 2, -Math.PI / 2, 0);
    this.poolBasin = B;
    this.poolLights = [];
    for (let x = B.x0 + 2; x < B.x1; x += 4) {
      for (const z of [B.z0 + 0.12, B.z1 - 0.12]) {
        const l = this.box(0.4, 0.2, 0.02, new THREE.MeshBasicMaterial({ color: 0x9ff0f0 }), x, -1.0, z);
        this.poolLights.push(l);
      }
    }
    this.ceil(X0, Z0, X1, Z1, H);
    this.wall('x', Z0, X0, X1, H, 'plain', 'pool', [{ c: 35, w: 3, h: 2.4 }]);
    this.wall('z', X0, Z0, Z1, H, 'plain', 'pool');
    this.wall('z', X1, Z0, Z1, H, 'pool', 'arcade');
    for (let x = 17; x <= 37; x += 5) for (let z = -23; z <= -4; z += 6) this.fixture(x, H, z, 'x', 1.6, null, true);
    this.zone('THE POOL', 'pool', X0, Z0, X1, Z1, { area: 'pool' });
    // red neon over the pool
    this.poolNeonOpen = this.signMesh(Tex.neon('Pool', '#ff3040', { w: 512, h: 256 }), 4, 2, 27, 4.4, -25.85, 0, { transparent: true, additive: true });
    this.poolNeonClosed = this.signMesh(Tex.neon('CLOSED', '#ff2030', { w: 512, h: 256, font: 'bold 120px "Futura","Trebuchet MS",sans-serif' }), 3.2, 1.6, 27, 2.8, -25.85, 0, { transparent: true, additive: true });
    this.poolNeonClosed.visible = false;
    this.poolNeonLight = { pos: new THREE.Vector3(27, 3.6, -23), color: 0xff3040 };
    // loungers and guests
    for (let i = 0; i < 4; i++) {
      const z = -19 + i * 4;
      const g = new THREE.Group(); g.position.set(16.5, 0, z); this.add(g);
      this.box(0.7, 0.3, 1.9, M.white, 0, 0.3, 0, { parent: g });
      const back = this.box(0.7, 0.06, 0.8, M.white, 0, 0.6, -0.9, { parent: g }); back.rotation.x = 0.8;
      this.collider(16.1, z - 1.2, 16.9, z + 1);
    }
    this.guestSpots.push({ area: 'pool', type: 'tentacle', x: 16.5, z: -15.2, ry: 0, pose: 'lie' });
    this.guestSpots.push({ area: 'pool', type: 'almost', x: 34.9, z: -12, ry: -Math.PI / 2, pose: 'stand', lookDown: true });
    this.soundSpots.push({ kind: 'pool', pos: new THREE.Vector3(27, 0, -13) });
  };

  // ----------------------------------------------------------- arcade
  P.buildArcade = function () {
    const M = this.M, H = 3;
    const X0 = 40, X1 = 56, Z0 = -16, Z1 = -1.5;
    this.floor(X0, Z0, X1, Z1, M.carpetArcade, 2);
    this.ceil(X0, Z0, X1, Z1, H, M.woodDark);
    this.wall('x', Z0, X0, X1, H, 'plain', 'arcade');
    this.wall('z', X1, Z0, Z1, H, 'arcade', 'plain');
    for (let x = 43; x <= 53; x += 5) for (let z = -13; z <= -4; z += 4.5) this.fixture(x, H, z, 'x', 1.0, null, true);
    this.zone('THE ARCADE', 'arcade', X0, Z0, X1, Z1, { area: 'arcade' });
    const titles = INN.ARCADE_TITLES;
    const spots = [[43, -15.2, 0], [46.5, -15.2, 0], [50, -15.2, 0], [53.5, -15.2, 0], [55.2, -11, -Math.PI / 2], [55.2, -7, -Math.PI / 2]];
    spots.forEach(([x, z, ry], i) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; this.add(g);
      const body = new THREE.MeshLambertMaterial({ color: [0x8a3a1a, 0x1c3a3a, 0x6b7a2a, 0x3a1c2a, 0xc99a2a, 0x2a2a5a][i] });
      this.box(0.9, 1.9, 0.8, body, 0, 0.95, 0, { parent: g });
      this.box(0.9, 0.12, 0.5, M.black, 0, 1.0, 0.55, { parent: g });
      const marquee = this.plane(0.86, 0.22, new THREE.MeshBasicMaterial({ map: Tex.sign(titles[i], { w: 256, h: 64, bg: '#1a0a0a', fg: '#ffd080', border: false }) }), 0, 1.78, 0.41, 0, 0, { parent: g });
      void marquee;
      const c = Tex.canvas(128, 96);
      const tex = new THREE.CanvasTexture(c);
      tex.minFilter = THREE.NearestFilter; tex.magFilter = THREE.NearestFilter;
      const scr = this.plane(0.66, 0.5, new THREE.MeshBasicMaterial({ map: tex }), 0, 1.35, 0.41, 0, 0, { parent: g });
      const stick = this.cyl(0.015, 0.015, 0.12, M.black, -0.15, 1.12, 0.6, { parent: g });
      this.interact(scr, { type: 'arcade', idx: i });
      const wp = new THREE.Vector3(); g.updateMatrixWorld(true); scr.getWorldPosition(wp);
      this.arcade.push({ idx: i, title: titles[i], canvas: c, ctx: c.getContext('2d'), tex, mesh: scr, stick, pos: wp, phase: Math.random() * 10, score: 0 });
      const dx = Math.abs(Math.sin(ry)) > 0.5;
      this.collider(x - (dx ? 0.45 : 0.5), z - (dx ? 0.5 : 0.45), x + (dx ? 0.45 : 0.5), z + (dx ? 0.5 : 0.45));
      this.fixtures.push({ mesh: scr, pos: wp.clone().add(new THREE.Vector3(Math.sin(ry) * 0.8, 0, Math.cos(ry) * 0.8)), flickerable: false, color: 0x9fd0ff, dim: true });
    });
    this.guestSpots.push({ area: 'arcade', type: 'armored', x: 46.5, z: -13.6, ry: Math.PI, pose: 'stand' });
  };

  // ----------------------------------------------------------- dining
  P.buildDining = function () {
    const M = this.M, H = 3.4;
    // hallway
    this.floor(-1.5, 12, 1.5, 16, M.carpet, 2.4);
    this.ceil(-1.5, 12, 1.5, 16, 2.7);
    this.wall('z', -1.5, 12, 16, 2.7, 'corr', 'corr');
    this.wall('z', 1.5, 12, 16, 2.7, 'corr', 'corr');
    this.fixture(0, 2.7, 14, 'z', 1.2, null, true);
    this.zone('DINING HALL', 'corridor', -1.5, 12, 1.5, 16, { area: 'hall' });
    this.plaques.dining = this.plaqueMesh('dining', 1.38, 1.55, 14.6, -Math.PI / 2);

    const X0 = -12, X1 = 12, Z0 = 16, Z1 = 32;
    this.floor(X0, Z0, X1, Z1, M.tileFloor, 1.2);
    this.ceil(X0, Z0, X1, Z1, H);
    this.wall('x', Z0, X0, X1, H, 'tile', 'tile', [{ c: 0, w: 3, h: 2.7 }]);
    this.wall('x', Z1, X0, X1, H, 'tile', 'plain', [{ c: 7, w: 1.2, h: 2.2 }]);
    this.wall('z', X0, Z0, Z1, H, 'plain', 'tile');
    this.wall('z', X1, Z0, Z1, H, 'tile', 'corr', [{ c: 28.5, w: 3, h: 2.6 }]);
    for (let x = -8; x <= 8; x += 4) for (let z = 19; z <= 30; z += 4) this.fixture(x, H, z, 'x', 1.4, null, true);
    this.zone('THE DINING ROOM', 'dining', X0, Z0, X1, Z1, { area: 'dining' });
    this.clock(-11.88, 2.6, 24, Math.PI / 2, 0.7);

    // buffet
    this.box(1.1, 0.95, 8, M.wood, -11.0, 0.47, 24, { collide: true, tile: 1 });
    this.box(1.2, 0.05, 8.1, M.chrome, -11.0, 0.97, 24);
    this.buffet = new THREE.Group(); this.add(this.buffet);
    for (let i = 0; i < 5; i++) {
      this.cyl(0.32, 0.28, 0.05, M.chrome, -10.95, 1.02, 20.8 + i * 1.6, { parent: this.buffet });
      for (let k = 0; k < 3; k++) this.cyl(0.13, 0.13, 0.04, i % 2 ? M.food : M.orange, -10.95 + (k - 1) * 0.12, 1.07 + k * 0.03, 20.8 + i * 1.6 + (k % 2) * 0.08, { parent: this.buffet });
    }
    this.cyl(0.18, 0.2, 0.5, M.chrome, -10.95, 1.25, 27.6, { parent: this.buffet });
    this.buffet.visible = false;
    const plates = this.box(0.4, 0.2, 0.4, M.white, -10.9, 1.08, 19.6);
    this.interact(plates, { type: 'plate' });
    this.plateStack = plates;
    this.signMesh(Tex.sign('CONTINENTAL BREAKFAST', { w: 768, h: 96 }), 3.6, 0.45, -11.86, 2.2, 24, Math.PI / 2);
    // kitchen hatch: frosted glass, the cook's shape behind it
    this.box(8, 1.0, 0.5, M.chrome, 0, 0.5, 31.6, { collide: true });
    this.box(7.6, 1.0, 0.04, M.frosted, 0, 1.6, 31.9);
    this.cookShape = this.box(0.7, 1.4, 0.1, new THREE.MeshBasicMaterial({ color: 0x2a2620, transparent: true, opacity: 0.6 }), 0, 1.4, 32.3);
    this.soundSpots.push({ kind: 'kitchen', pos: new THREE.Vector3(0, 1.4, 32.5) });
    // kitchen door: do not enter
    const kd = this.box(1.1, 2.1, 0.06, M.metal, 7, 1.05, 31.97);
    this.interact(kd, { type: 'kitchen' });
    this.plane(0.5, 0.5, new THREE.MeshBasicMaterial({ color: 0x9ab0a0 }), 7, 1.6, 31.92, 0, Math.PI);
    this.signMesh(Tex.sign('KITCHEN\nSTAFF ONLY', { w: 256, h: 128 }), 0.7, 0.35, 7, 2.35, 31.88, Math.PI);
    // tables
    for (const x of [-5, 0.5, 6]) for (const z of [20, 25]) {
      this.cyl(0.6, 0.6, 0.05, M.white, x, 0.75, z);
      this.cyl(0.06, 0.06, 0.75, M.chrome, x, 0.37, z, { collide: true });
      this.collider(x - 0.6, z - 0.6, x + 0.6, z + 0.6);
      for (const a of [0, Math.PI]) {
        const cxp = x + Math.sin(a) * 0.95, czp = z + Math.cos(a) * 0.95;
        this.chairFn(cxp, czp, a + Math.PI, M.avocado);
      }
    }
    this.guestSpots.push({ area: 'dining', type: 'armored', x: -5, z: 20.95, ry: Math.PI, pose: 'sit' });
    this.guestSpots.push({ area: 'dining', type: 'tall', x: 6, z: 24.05, ry: 0, pose: 'sit' });
    this.guestSpots.push({ area: 'dining', type: 'almost', x: 0.5, z: 25.95, ry: Math.PI, pose: 'sit' });
    this.guestSpots.push({ area: 'dining', type: 'tentacle', x: 6, z: 20.95, ry: Math.PI, pose: 'sit' });
    this.soundSpots.push({ kind: 'muzak', pos: new THREE.Vector3(0, 3, 24) });

    // service corridor to the service door
    this.floor(12, 27, 27, 30, M.tileFloor, 1.2);
    this.ceil(12, 27, 27, 30, 2.6);
    this.wall('x', 27, 12, 27, 2.6, 'plain', 'plain');
    this.wall('x', 30, 12, 27, 2.6, 'plain', 'plain');
    for (let x = 15; x < 27; x += 5) this.fixture(x, 2.6, 28.5, 'x', 1.2, null, true);
    this.zone('SERVICE CORRIDOR', 'corridor', 12, 27, 27, 30, { area: 'service' });
  };

  // ----------------------------------------------------------- exits
  P.buildExits = function () {
    const M = this.M;
    // west stairwell vestibule
    this.floor(-72, -4, -62, 4, M.carpet, 2.4);
    this.ceil(-72, -4, -62, 4, 3.2);
    this.wall('z', -62, -4, -1.5, 3.2, 'corr', 'corr');
    this.wall('z', -62, 1.5, 4, 3.2, 'corr', 'corr');
    this.wall('x', -4, -72, -62, 3.2, 'corr', 'corr');
    this.wall('x', 4, -72, -62, 3.2, 'corr', 'corr');
    this.wall('z', -72, -4, 4, 3.2, 'corr', 'corr');
    this.slab('corr', -62.1, -61.9, -1.5, 1.5, 2.7, 3.2);
    this.fixture(-67, 3.2, 0, 'z', 1.3, null, true);
    this.zone('WEST STAIRWELL', 'exit', -72, -4, -62, 4, { area: 'west-exit', exit: 'west' });
    for (const s of [-1, 1]) {
      const d = this.box(0.06, 2.2, 1.0, M.metal, -71.85, 1.1, s * 0.52);
      this.interact(d, { type: 'stairs' });
    }
    this.signMesh(Tex.sign('STAIRS\nFLOOR 1 OF 1', { w: 256, h: 128, bg: '#2a0a0a', fg: '#ff6050', border: '#ff6050' }), 0.9, 0.45, -71.86, 2.55, 0, Math.PI / 2);
    this.signMesh(Tex.neon('VACANCY', '#ff4fa0', { w: 512, h: 128, mirror: true, font: 'bold 84px "Futura","Trebuchet MS",sans-serif' }), 2.4, 0.6, -71.8, 2.9, -2.6, Math.PI / 2, { transparent: true, additive: true });
    this.exitPodium('west', 'WEST STAIRWELL', -66.5, -2.6, 0, new THREE.Vector3(-64, 0, 0));

    // east vestibule
    this.floor(58, -4, 66, 4, M.carpet, 2.4);
    this.ceil(58, -4, 66, 4, 3.2);
    this.wall('z', 58, -4, -1.5, 3.2, 'corr', 'corr');
    this.wall('z', 58, 1.5, 4, 3.2, 'corr', 'corr');
    this.slab('corr', 57.9, 58.1, -1.5, 1.5, 2.7, 3.2);
    this.wall('x', -4, 58, 66, 3.2, 'corr', 'corr');
    this.wall('x', 4, 58, 66, 3.2, 'corr', 'corr');
    this.wall('z', 66, -4, 4, 3.2, 'corr', 'corr', [{ c: 0, w: 4, h: 2.6 }]);
    this.box(0.08, 2.6, 4, M.darkGlass, 66, 1.3, 0, { collide: true });
    this.plane(4, 2.6, new THREE.MeshBasicMaterial({ color: 0x1a0a14 }), 66.3, 1.3, 0, 0, -Math.PI / 2);
    this.box(0.1, 2.6, 0.06, M.chrome, 65.95, 1.3, 0);
    const glassDoor = this.box(0.04, 0.3, 0.6, M.chrome, 65.9, 1.1, 0.4);
    this.interact(glassDoor, { type: 'glassdoor' });
    this.fixture(62, 3.2, 0, 'z', 1.3, null, true);
    this.zone('EAST VESTIBULE', 'exit', 58, -4, 66, 4, { area: 'east-exit', exit: 'east' });
    this.signMesh(Tex.neon('MOTOR INN', '#3fe0d0', { w: 512, h: 128, mirror: true, font: 'bold 84px "Futura","Trebuchet MS",sans-serif' }), 2.4, 0.6, 65.8, 2.85, 0, -Math.PI / 2, { transparent: true, additive: true });
    this.exitPodium('east', 'EAST VESTIBULE', 62, 2.6, Math.PI, new THREE.Vector3(60, 0, 0));

    // pool gate (north wall of the pool)
    this.box(3, 2.4, 0.05, M.metal, 35, 1.2, -26.05);
    for (let i = 0; i < 12; i++) this.box(0.03, 2.4, 0.03, M.chrome, 33.6 + i * 0.25, 1.2, -25.98);
    this.box(3, 2.4, 0.4, new THREE.MeshBasicMaterial({ color: 0x050808 }), 35, 1.2, -26.4);
    this.collider(33.5, -26.4, 36.5, -25.9);
    const gate = this.box(0.3, 0.3, 0.1, M.brass, 34.9, 1.1, -25.9);
    this.interact(gate, { type: 'gate' });
    this.signMesh(Tex.sign('POOL GATE', { w: 256, h: 80 }), 1, 0.3, 35, 2.65, -25.82, 0);
    this.zone('POOL GATE', 'exit', 32, -26, 38, -21, { area: 'pool', exit: 'pool', inPool: true });
    this.exitPodium('pool', 'POOL GATE', 31.5, -24.6, Math.PI / 2, new THREE.Vector3(35, 0, -23));

    // service door
    this.wall('z', 27, 27, 30, 2.6, 'plain', 'plain');
    const sd = this.box(0.06, 2.15, 1.1, M.metal, 26.9, 1.07, 28.5);
    this.interact(sd, { type: 'servicedoor' });
    this.signMesh(Tex.sign('SERVICE\nENTRANCE', { w: 256, h: 128 }), 0.8, 0.4, 26.86, 2.35, 28.5, -Math.PI / 2);
    this.zone('SERVICE DOOR', 'exit', 21, 27, 27, 30, { area: 'service', exit: 'service' });
    this.exitPodium('service', 'SERVICE DOOR', 25.2, 28.5, -Math.PI / 2, new THREE.Vector3(23.5, 0, 28.5));

    // the neon glow that comes from nowhere at each corridor end
    this.glowSpots = [
      { pos: new THREE.Vector3(-70, 2.6, -2.4), color: 0xff4fa0 },
      { pos: new THREE.Vector3(64.5, 2.6, 0), color: 0x3fe0d0 },
    ];
  };

  P.exitPodium = function (id, name, x, z, ry, standPos) {
    const M = this.M, g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; this.add(g);
    this.box(0.9, 1.1, 0.5, M.wood, 0, 0.55, 0, { parent: g, tile: 1 });
    this.box(1.0, 0.05, 0.6, M.brass, 0, 1.12, 0, { parent: g });
    this.collider(x - 0.55, z - 0.55, x + 0.55, z + 0.55);
    // banker's lamp: lit when this is the live exit
    this.cyl(0.05, 0.07, 0.2, M.brass, -0.3, 1.25, 0.05, { parent: g });
    const shadeOn = new THREE.MeshBasicMaterial({ color: 0x5aff9a });
    const shadeOff = new THREE.MeshLambertMaterial({ color: 0x1c3a2a });
    const shade = this.box(0.32, 0.1, 0.14, shadeOff, -0.3, 1.38, 0.05, { parent: g });
    const bell = this.cyl(0.04, 0.1, 0.08, M.brass, 0.25, 1.18, 0.1, { parent: g });
    this.interact(bell, { type: 'exitbell', exit: id });
    const card = this.plane(0.6, 0.18, new THREE.MeshBasicMaterial({ map: Tex.sign(name, { w: 256, h: 76 }) }), 0, 0.85, 0.26, 0, 0, { parent: g });
    void card;
    g.updateMatrixWorld(true);
    const attendantPos = new THREE.Vector3(0, 0, -0.75).applyMatrix4(g.matrixWorld);
    const lampPos = new THREE.Vector3(-0.3, 1.5, 0.05).applyMatrix4(g.matrixWorld);
    this.exits[id] = { id, name, group: g, shade, shadeOn, shadeOff, bell, attendantPos, attendantRy: ry, lampPos, standPos, x, z };
  };

  // ----------------------------------------------------------- the promenade
  // A long, tall hall from the front desk to the Garden Court. Slightly too long.
  P.buildPromenade = function () {
    // in a stay, the promenade is the Hallway Between, built by INN.Stay
    if (INN.Game && INN.Game.SLICE) { this.signMesh(Tex.sign('THE GARDEN COURT ↑', { w: 512, h: 96 }), 2.6, 0.48, -9, 3.45, -11.86, 0); return; }
    const M = this.M, H = 3.4;
    this.floor(-10.5, -44, -7.5, -12, M.carpet, 2.4);
    this.ceil(-10.5, -44, -7.5, -12, H);
    this.wall('z', -10.5, -44, -12, H, 'corr', 'corr');
    this.wall('z', -7.5, -44, -12, H, 'corr', 'corr');
    for (let z = -15; z > -44; z -= 5) this.fixture(-9, H, z, 'z', 1.3, null, true);
    this.zone('THE PROMENADE', 'corridor', -10.5, -44, -7.5, -12, { area: 'promenade' });
    this.signMesh(Tex.sign('THE GARDEN COURT ↑', { w: 512, h: 96 }), 2.6, 0.48, -9, 3.45, -11.86, 0);
    this.plaques.garden = this.plaqueMesh('garden', -7.62, 1.55, -42.2, -Math.PI / 2);
    // framed postcards of the inn as it was
    for (const z of [-20, -30]) {
      const c = Tex.canvas(256, 180), g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 0, 180); gr.addColorStop(0, '#f2a0b0'); gr.addColorStop(0.6, '#f7d48e'); gr.addColorStop(1, '#2f8a7e');
      g.fillStyle = gr; g.fillRect(0, 0, 256, 180);
      g.fillStyle = '#3a2a22'; g.fillRect(40, 70, 176, 80);
      g.fillStyle = '#ffd890'; for (let i = 0; i < 8; i++) for (let j = 0; j < 3; j++) if ((i + j * 3 + z) % 4) g.fillRect(50 + i * 21, 80 + j * 22, 10, 12);
      g.fillStyle = '#ff4fa0'; g.font = 'italic bold 22px Georgia'; g.textAlign = 'center'; g.fillText('The Inn Between', 128, 50);
      g.strokeStyle = '#c9a24a'; g.lineWidth = 10; g.strokeRect(0, 0, 256, 180);
      this.signMesh(new THREE.CanvasTexture(c), 1.1, 0.78, -10.38, 1.7, z, Math.PI / 2);
    }
  };

  // ----------------------------------------------------------- the Garden Court
  // A six-story atrium court: stacked balconies of rooms, planters, palms, a fountain,
  // a glass elevator that is not for guests, and a skylight with nothing above it.
  P.buildGardenCourt = function () {
    const M = this.M;
    const X0 = -30, X1 = 30, Z0 = -76, Z1 = -44, H = 44, FH = 3.6, D = 2.6, FLOORS = 11;
    const b = new INN.Batch();
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const bulbs = [];          // warm pinpoints: balcony edges and door lamps
    const redBulbs = [];       // the marquee

    this.floor(X0, Z0, X1, Z1, M.checker, 2.4);
    this.plane(X1 - X0, Z1 - Z0, M.ceiling, 0, H, (Z0 + Z1) / 2, Math.PI / 2, 0, { tile: 3 });
    const sky = new THREE.MeshBasicMaterial({ map: INN.Tex.skylight(), color: 0x3a5a48 });
    this.plane(36, 18, sky, 0, H - 0.05, (Z0 + Z1) / 2, Math.PI / 2, 0, { tile: 4.5 });
    this.wall('x', Z1, X0, X1, H, 'lobby', 'plain', [{ c: -9, w: 3, h: 3.0 }]);
    this.wall('x', Z0, X0, X1, H, 'plain', 'lobby', [{ c: -12, w: 3, h: 2.7 }, { c: 12, w: 3, h: 2.7 }]);
    this.wall('z', X0, Z0, Z1, H, 'plain', 'lobby', [{ c: -62, w: 3, h: 2.7 }]);
    this.wall('z', X1, Z0, Z1, H, 'lobby', 'plain', [{ c: -62, w: 3, h: 2.7 }]);
    this.zone('THE GARDEN COURT', 'garden', X0, Z0, X1, Z1, { area: 'garden', ceiling: H });
    const openings = [[-9, Z1], [-12, Z0], [12, Z0], [X0, -62], [X1, -62]];
    const nearOpening = (x, z) => openings.some(([ox, oz]) => Math.abs(ox - x) < 2.4 && Math.abs(oz - z) < 2.4);

    // the sides of the court: rows of crimson doors on every floor, each with its own lamp
    const sides = [
      { axis: 'x', wall: Z0, dir: 1, a: X0, b: -1.8, ta: X0 + D, tb: -1.8 },
      { axis: 'x', wall: Z0, dir: 1, a: 1.8, b: X1, ta: 1.8, tb: X1 - D },
      { axis: 'x', wall: Z1, dir: -1, a: X0, b: X1, ta: X0 + D, tb: X1 - D },
      { axis: 'z', wall: X0, dir: 1, a: Z0 + D, b: Z1 - D, ta: Z0 + D, tb: Z1 - D },
      { axis: 'z', wall: X1, dir: -1, a: Z0 + D, b: Z1 - D, ta: Z0 + D, tb: Z1 - D },
    ];
    const sbox = (side, mat, s0, s1, d0, d1, y0, y1, tile) => {
      const w0 = side.wall + side.dir * d0, w1 = side.wall + side.dir * d1;
      if (side.axis === 'x') b.box(mat, s0, s1, y0, y1, Math.min(w0, w1), Math.max(w0, w1), tile);
      else b.box(mat, Math.min(w0, w1), Math.max(w0, w1), y0, y1, s0, s1, tile);
    };
    const pt = (side, s, d, y) => (side.axis === 'x' ? new THREE.Vector3(s, y, side.wall + side.dir * d) : new THREE.Vector3(side.wall + side.dir * d, y, s));
    const doorsAlong = (side, y, ground) => {
      const len = side.b - side.a;
      const n = Math.floor(len / 3.2);
      const off = side.a + (len - (n - 1) * 3.2) / 2;
      for (let i = 0; i < n; i++) {
        const p = off + i * 3.2;
        const q = pt(side, p, 0.2, 0);
        if (ground && (nearOpening(q.x, q.z) || (side.wall === Z0 && Math.abs(p) < 3.2))) continue;
        sbox(side, M.door, p - 0.47, p + 0.47, 0.1, 0.16, y, y + 2.15, 1);
        sbox(side, M.brass, p - 0.55, p + 0.55, 0.1, 0.13, y + 2.15, y + 2.25);
        sbox(side, M.brass, p + 0.3, p + 0.36, 0.1, 0.2, y + 0.98, y + 1.04);
        // the lamp beside every door
        sbox(side, M.brass, p + 0.75, p + 0.85, 0.1, 0.2, y + 1.55, y + 1.65);
        sbox(side, M.redShade, p + 0.68, p + 0.92, 0.18, 0.4, y + 1.65, y + 1.9);
        bulbs.push(pt(side, p + 0.8, 0.3, y + 1.78));
        if (ground && i % 2 === 0) this.fixtures.push({ mesh: null, pos: pt(side, p + 0.8, 0.8, y + 1.9), flickerable: false, color: 0xff9a6a, warm: true });
      }
    };
    sides.forEach((side) => doorsAlong(side, 0, true));
    for (let k = 1; k <= FLOORS; k++) {
      const y = FH * k;
      sides.forEach((side) => {
        sbox(side, M.woodDark, side.a, side.b, 0.1, D, y - 0.42, y, 1.2);          // gallery slab
        sbox(side, M.redCarpet, side.a, side.b, 0.1, D - 0.1, y, y + 0.02, 1.5);   // crimson runner
        sbox(side, M.wood, side.a, side.b, D - 0.06, D + 0.04, y - 0.5, y - 0.02, 1); // fascia
        sbox(side, M.brass, side.a, side.b, D + 0.04, D + 0.07, y - 0.36, y - 0.3);   // gold trim
        // brass railing: top rail, bottom rail, balusters
        sbox(side, M.brass, side.a, side.b, D - 0.12, D - 0.02, y + 1.0, y + 1.07);
        sbox(side, M.brass, side.a, side.b, D - 0.1, D - 0.04, y + 0.1, y + 0.15);
        for (let s = side.a + 0.2; s < side.b; s += 0.42) sbox(side, M.brass, s - 0.018, s + 0.018, D - 0.09, D - 0.05, y + 0.15, y + 1.0);
        doorsAlong(side, y, false);
        // strings of tiny bulbs along the balcony edge
        for (let s = side.a + 0.35; s < side.b; s += 0.7) bulbs.push(pt(side, s, D + 0.1, y - 0.46));
        // planters and trailing vines on the lower floors, where the jungle reaches
        if (k <= 4) {
          sbox(side, M.woodDark, side.ta, side.tb, D + 0.07, D + 0.55, y - 0.95, y - 0.5, 1);
          sbox(side, M.grass, side.ta, side.tb, D + 0.07, D + 0.55, y - 0.5, y - 0.32, 0.8);
          for (let s = side.ta + 0.6; s < side.tb - 0.6; s += 0.8 + rnd() * 1.2) {
            const L = Math.min(1.2 + rnd() * 3.2, y - 0.5 - 2.6);
            if (L < 0.6) continue;
            const d = side.wall + side.dir * (D + 0.57);
            const yc = y - 0.45 - L / 2;
            const uv = [0, 1 - L / 4.6, 1, 1];
            if (side.axis === 'x') b.plane(M.vines, 0.8, L, s, yc, d, 0, 0, 0, null, uv);
            else b.plane(M.vines, 0.8, L, d, yc, s, 0, Math.PI / 2, 0, null, uv);
          }
        }
      });
    }

    // the floor of the court is a jungle; the paths are a cross and a walk around the walls
    this.planters = [];
    const beds = [[-26.5, -72.5, -4.5, -65.5], [4.5, -72.5, 26.5, -65.5], [-26.5, -56.5, -4.5, -47.5], [4.5, -56.5, 26.5, -47.5]];
    const palm = (x, z, h) => {
      let px = x, pz = z;
      const lean = (rnd() - 0.5) * 0.08, lz = (rnd() - 0.5) * 0.08;
      for (let i = 0; i < 6; i++) {
        const seg = h / 6;
        b.mesh(M.trunk, new THREE.CylinderGeometry(0.2 - i * 0.015, 0.24 - i * 0.015, seg, 7), px, seg * (i + 0.5), pz);
        px += lean * seg; pz += lz * seg;
      }
      for (let f = 0; f < 10; f++) {
        const g = new THREE.ConeGeometry(0.5, 4.6, 4); g.translate(0, 2.3, 0);
        b.mesh(f % 2 ? M.leaf : M.leafDark, g, px, h, pz, 0, (f / 10) * Math.PI * 2 + rnd() * 0.3, 1.15 + rnd() * 0.5, 1, 1, 0.35);
      }
    };
    const tree = (x, z, h) => {
      b.mesh(M.trunk, new THREE.CylinderGeometry(0.3, 0.55, h, 8), x, h / 2, z);
      for (let i = 0; i < 4; i++) {
        const a = rnd() * Math.PI * 2;
        const g = new THREE.CylinderGeometry(0.08, 0.16, 2.6, 5); g.translate(0, 1.3, 0);
        b.mesh(M.trunk, g, x, h * (0.55 + rnd() * 0.3), z, Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9);
      }
      for (let i = 0; i < 9; i++) {
        const r = 1.6 + rnd() * 1.6;
        b.mesh(i % 3 ? M.leafDark : M.leaf, new THREE.IcosahedronGeometry(r, 0), x + (rnd() - 0.5) * 5, h + (rnd() - 0.2) * 2.4, z + (rnd() - 0.5) * 5, rnd(), rnd(), rnd(), 1, 0.7, 1);
      }
    };
    const fern = (x, z) => {
      for (let f = 0; f < 8; f++) {
        const g = new THREE.ConeGeometry(0.22, 1.6, 3); g.translate(0, 0.8, 0);
        b.mesh(f % 2 ? M.leaf : M.leafDark, g, x, 0.05, z, 0, f * 0.8, 0.8 + rnd() * 0.5);
      }
    };
    const bush = (x, z) => b.mesh(rnd() < 0.5 ? M.leafDark : M.leaf, new THREE.IcosahedronGeometry(0.6 + rnd() * 0.8, 0), x, 0.4, z, rnd(), rnd(), 0, 1.2, 0.7, 1.2);
    beds.forEach(([x0, z0, x1, z1]) => {
      this.planters.push({ x0, z0, x1, z1 });
      b.box(M.grass, x0, x1, 0, 0.05, z0, z1, 1.5);
      b.box(M.brass, x0 - 0.12, x1 + 0.12, 0, 0.32, z0 - 0.12, z0, 1);
      b.box(M.brass, x0 - 0.12, x1 + 0.12, 0, 0.32, z1, z1 + 0.12, 1);
      b.box(M.brass, x0 - 0.12, x0, 0, 0.32, z0, z1, 1);
      b.box(M.brass, x1, x1 + 0.12, 0, 0.32, z0, z1, 1);
      const w = x1 - x0, dpt = z1 - z0;
      tree(x0 + w * 0.25, (z0 + z1) / 2, 7 + rnd() * 4);
      tree(x0 + w * 0.75, (z0 + z1) / 2 + (rnd() - 0.5) * 2, 6 + rnd() * 5);
      palm(x0 + w * 0.5, z0 + dpt * 0.3, 9 + rnd() * 5);
      palm(x0 + 1.5, z1 - 1.5, 7 + rnd() * 4);
      palm(x1 - 1.5, z0 + 1.5, 8 + rnd() * 5);
      for (let i = 0; i < 14; i++) fern(x0 + 0.7 + rnd() * (w - 1.4), z0 + 0.7 + rnd() * (dpt - 1.4));
      for (let i = 0; i < 16; i++) bush(x0 + 0.8 + rnd() * (w - 1.6), z0 + 0.8 + rnd() * (dpt - 1.6));
    });
    for (const [x, z] of [[-27.5, -47], [27.5, -47], [-27.5, -73], [27.5, -73]]) {
      b.mesh(M.brass, new THREE.CylinderGeometry(0.55, 0.42, 0.8, 12), x, 0.4, z);
      this.collider(x - 0.55, z - 0.55, x + 0.55, z + 0.55);
      palm(x, z, 5 + rnd() * 3);
    }
    // the fountain, at the crossing of the paths
    const fx = 0, fz = -61;
    b.mesh(M.white, new THREE.CylinderGeometry(3.3, 3.5, 0.6, 32), fx, 0.3, fz);
    b.mesh(M.white, new THREE.CylinderGeometry(0.35, 0.45, 2.6, 12), fx, 1.3, fz);
    b.mesh(M.white, new THREE.CylinderGeometry(1.4, 0.5, 0.35, 20), fx, 1.6, fz);
    b.mesh(M.white, new THREE.CylinderGeometry(0.75, 0.3, 0.3, 16), fx, 2.6, fz);
    b.mesh(M.glass, new THREE.CylinderGeometry(0.05, 0.12, 3.6, 8), fx, 4.4, fz);
    this.collider(fx - 3.5, fz - 3.5, fx + 3.5, fz + 3.5);
    const water = new THREE.Mesh(new THREE.CircleGeometry(3.1, 32), M.water);
    water.rotation.x = -Math.PI / 2; water.position.set(fx, 0.55, fz); this.add(water);
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2;
      b.mesh(M.glass, new THREE.CylinderGeometry(0.03, 0.06, 1.1, 5), fx + Math.cos(a) * 1.3, 1.0, fz + Math.sin(a) * 1.3);
    }
    this.fountainPos = new THREE.Vector3(fx, 1, fz);
    // globe lamps along the paths
    for (const [x, z] of [[-4, -50], [4, -50], [-4, -72], [4, -72], [-12, -56.9], [12, -56.9], [-12, -65.1], [12, -65.1], [-27.6, -60], [27.6, -60]]) {
      b.mesh(M.brass, new THREE.CylinderGeometry(0.06, 0.09, 3.2, 8), x, 1.6, z);
      b.mesh(M.lampShade, new THREE.SphereGeometry(0.3, 12, 8), x, 3.4, z);
      bulbs.push(new THREE.Vector3(x, 3.4, z));
      this.collider(x - 0.15, z - 0.15, x + 0.15, z + 0.15);
      this.fixtures.push({ mesh: null, pos: new THREE.Vector3(x, 3.0, z), flickerable: false, color: 0xffc080, warm: true });
    }
    const bench = (x, z, ry) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; this.add(g);
      this.box(2.2, 0.12, 0.6, M.leather, 0, 0.45, 0, { parent: g });
      this.box(2.2, 0.55, 0.12, M.leather, 0, 0.78, -0.3, { parent: g });
      this.box(0.08, 0.45, 0.5, M.brass, -1, 0.22, 0, { parent: g });
      this.box(0.08, 0.45, 0.5, M.brass, 1, 0.22, 0, { parent: g });
      const c = Math.abs(Math.sin(ry)) > 0.5;
      this.collider(x - (c ? 0.4 : 1.15), z - (c ? 1.15 : 0.4), x + (c ? 0.4 : 1.15), z + (c ? 1.15 : 0.4));
    };
    bench(-16, -57.1, Math.PI); bench(16, -64.9, 0); bench(-3.8, -52, Math.PI / 2);

    // the glass elevator, not for guests
    const ex = 0, ez0 = Z0 + 0.1, ez1 = Z0 + 2.9;
    for (const [x, z] of [[-1.6, ez0], [1.6, ez0], [-1.6, ez1], [1.6, ez1]]) b.box(M.brass, x - 0.07, x + 0.07, 0, H, z - 0.07, z + 0.07);
    b.box(M.glass, -1.55, 1.55, 0, H, ez1 - 0.02, ez1 + 0.02);
    b.box(M.glass, -1.62, -1.58, 0, H, ez0, ez1);
    b.box(M.glass, 1.58, 1.62, 0, H, ez0, ez1);
    this.collider(-1.7, Z0, 1.7, ez1 + 0.1);
    const cab = new THREE.Group(); this.add(cab);
    this.box(3.0, 0.15, 2.6, M.brass, ex, 0.07, (ez0 + ez1) / 2, { parent: cab });
    this.box(3.0, 0.15, 2.6, M.brass, ex, 2.6, (ez0 + ez1) / 2, { parent: cab });
    this.box(2.8, 2.4, 0.05, M.cabGlow, ex, 1.35, ez0 + 0.15, { parent: cab });
    this.box(0.4, 1.7, 0.3, M.black, ex + 0.4, 0.95, ez0 + 0.6, { parent: cab });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), M.black); head.position.set(ex + 0.4, 1.95, ez0 + 0.6); cab.add(head);
    this.elevatorCab = cab;
    this.fixtures.push({ mesh: null, pos: new THREE.Vector3(ex, 1.5, ez1 + 1), flickerable: false, color: 0xffd9a0, warm: true, cab: true });
    const call = this.box(0.16, 0.26, 0.06, M.brass, 2.25, 1.2, Z0 + 0.13);
    this.interact(call, { type: 'glasselevator' });

    // the marquee over the way in: green neon, red chaser bulbs
    const mq = { x0: -14, x1: -4, y0: 3.3, y1: 5.3, z0: Z1 - 2.6, z1: Z1 - 0.1 };
    b.box(M.woodDark, mq.x0, mq.x1, mq.y0, mq.y1, mq.z0, mq.z1, 1);
    b.box(M.brass, mq.x0 - 0.05, mq.x1 + 0.05, mq.y0 - 0.06, mq.y0, mq.z0 - 0.05, mq.z1, 1);
    this.marqueeTex = [INN.Tex.marquee('THE INN BETWEEN', 0), INN.Tex.marquee('THE INN BETWEEN', 1), INN.Tex.marquee('THE INN BETWEEN', 2)];
    this.marqueeMat = new THREE.MeshBasicMaterial({ map: this.marqueeTex[0] });
    this.plane(mq.x1 - mq.x0 - 0.1, mq.y1 - mq.y0 - 0.1, this.marqueeMat, (mq.x0 + mq.x1) / 2, (mq.y0 + mq.y1) / 2, mq.z0 - 0.01, 0, Math.PI);
    for (let x = mq.x0 + 0.3; x < mq.x1; x += 0.45) for (let z = mq.z0 + 0.3; z < mq.z1 - 0.2; z += 0.55) redBulbs.push(new THREE.Vector3(x, mq.y0 - 0.08, z));
    this.fixtures.push({ mesh: null, pos: new THREE.Vector3(-9, 2.6, Z1 - 3), flickerable: false, color: 0x6aff9a, warm: true });

    // shafts of light falling through the haze
    const shaftMat = new THREE.MeshBasicMaterial({ map: INN.Tex.shaft(), transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    for (const [x, z, r] of [[-10, -60, 0.2], [8, -66, -0.3], [-2, -52, 0.6], [16, -58, 1.2]]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(4, H - 2), shaftMat);
      m.position.set(x, H / 2, z); m.rotation.set(0, r, 0.12); this.add(m);
      const m2 = m.clone(); m2.rotation.y = r + Math.PI / 2; this.add(m2);
    }

    b.flush(this.root);

    // thousands of small warm bulbs, one draw call
    const pts = (list, color, size) => {
      const g = new THREE.BufferGeometry().setFromPoints(list);
      const m = new THREE.Points(g, new THREE.PointsMaterial({ map: INN.Tex.bulb(), color, size, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      this.add(m);
      return m;
    };
    pts(bulbs, 0xffd8a0, 0.62);
    this.marqueeBulbs = pts(redBulbs, 0xff4a30, 0.32);

    // signs
    this.signMesh(Tex.neon('The Garden Court', '#4dff9a', { underline: '#ff3a2a' }), 9, 2.25, 9, 7.2, Z1 - 0.12, Math.PI, { transparent: true, additive: true });
    this.signMesh(Tex.sign('WEST WING', { w: 384, h: 96 }), 1.8, 0.45, X0 + 0.12, 3.1, -62, Math.PI / 2);
    this.signMesh(Tex.sign('EAST WING', { w: 384, h: 96 }), 1.8, 0.45, X1 - 0.12, 3.1, -62, -Math.PI / 2);
    this.signMesh(Tex.sign('NORTH WING', { w: 384, h: 96 }), 1.8, 0.45, -12, 3.1, Z0 + 0.12, 0);
    this.signMesh(Tex.sign('NORTH WING', { w: 384, h: 96 }), 1.8, 0.45, 12, 3.1, Z0 + 0.12, 0);

    // guests: on the benches, by the fountain, and watching from the balconies
    const gs = (s) => this.guestSpots.push(Object.assign({ area: 'garden' }, s));
    gs({ type: 'almost', x: -16.4, z: -57.2, ry: Math.PI, pose: 'sit' });
    gs({ type: 'armored', x: 16.5, z: -64.8, ry: 0, pose: 'sit' });
    gs({ type: 'tall', x: 4.6, z: -57.5, ry: Math.atan2(-4.6, -3.5), pose: 'stand' });
    gs({ type: 'almost', x: -6, z: Z0 + D - 0.6, y: FH * 2, ry: 0, pose: 'stand', lookDown: true });
    gs({ type: 'tall', x: X0 + D - 0.6, z: -55, y: FH * 3, ry: Math.PI / 2, pose: 'stand' });
    gs({ type: 'armored', x: X1 - D + 0.6, z: -67, y: FH, ry: -Math.PI / 2, pose: 'stand' });
    gs({ type: 'almost', x: 14, z: Z1 - D + 0.6, y: FH * 4, ry: Math.PI, pose: 'stand', lookDown: true });
    gs({ type: 'tall', x: 19, z: Z0 + D - 0.6, y: FH * 6, ry: 0, pose: 'stand' });
    gs({ type: 'tentacle', x: X0 + D - 0.6, z: -70, y: FH, ry: Math.PI / 2, pose: 'stand' });
    gs({ type: 'almost', x: -20, z: Z1 - D + 0.6, y: FH * 8, ry: Math.PI, pose: 'stand', lookDown: true });
    this.soundSpots.push({ kind: 'fountain', pos: this.fountainPos });
  };

  // ----------------------------------------------------------- queries
  P.zoneAt = function (x, z) {
    let best = null;
    for (const zn of this.zones) {
      if (x >= zn.x0 && x <= zn.x1 && z >= zn.z0 && z <= zn.z1) {
        if (!best || (zn.x1 - zn.x0) * (zn.z1 - zn.z0) < (best.x1 - best.x0) * (best.z1 - best.z0)) best = zn;
      }
    }
    return best;
  };

  P.collide = function (pos, r) {
    for (let iter = 0; iter < 2; iter++) {
      for (const c of this.colliders) {
        if (!c.on) continue;
        const nx = Math.max(c.x0, Math.min(pos.x, c.x1));
        const nz = Math.max(c.z0, Math.min(pos.z, c.z1));
        const dx = pos.x - nx, dz = pos.z - nz;
        const d2 = dx * dx + dz * dz;
        if (d2 < r * r) {
          if (d2 > 1e-8) {
            const d = Math.sqrt(d2), push = r - d;
            pos.x += dx / d * push; pos.z += dz / d * push;
          } else {
            // center inside the box: push out along the shallowest axis
            const l = pos.x - c.x0, rr = c.x1 - pos.x, t = pos.z - c.z0, b = c.z1 - pos.z;
            const m = Math.min(l, rr, t, b);
            if (m === l) pos.x = c.x0 - r; else if (m === rr) pos.x = c.x1 + r; else if (m === t) pos.z = c.z0 - r; else pos.z = c.z1 + r;
          }
        }
      }
    }
  };

  INN.World = World;
})(window.INN);
