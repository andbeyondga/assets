// THE INN BETWEEN — the Wings. Corridors of rooms that go on forever,
// generated in chunks around the guest the way a voxel world is, and forgotten behind them.
//
// The wings are a lattice. Corridor lines run along x at z = -62 - 24j (j >= 0)
// and along z at x = 12 + 24i. Each 24 m segment between two crossings either exists
// or does not, decided by a hash of its coordinates, so the same corridor is always
// in the same place. The Garden Court (x -30..30, z -76..-44) and everything south of
// z = -44 belong to the hand-built inn; the lattice is clipped around them.
window.INN = window.INN || {};
(function (INN) {
  'use strict';

  const SP = 24, X_OFF = 12, Z_OFF = -62, HALF = 1.5, H = 2.7, ROOM_D = 7;
  const LOBBY = { x0: -30, x1: 30, z0: -76, z1: -44 };
  const NORTH_LIMIT = -44;           // nothing generated south of this
  const LOAD_R = 54, DROP_R = 72;
  const OPENINGS = [[-30, -62], [30, -62], [-12, -76], [12, -76]];

  function hash(a, b, c) {
    let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  const nodeX = (i) => X_OFF + SP * i;
  const nodeZ = (j) => Z_OFF - SP * j;
  const inLobby = (x, z, m) => x > LOBBY.x0 - (m || 0) && x < LOBBY.x1 + (m || 0) && z > LOBBY.z0 - (m || 0) && z < LOBBY.z1 + (m || 0);
  const forbidden = (x0, z0, x1, z1) => Math.max(z0, z1) > NORTH_LIMIT - 0.3 ||
    (Math.min(x0, x1) < LOBBY.x1 + 0.3 && Math.max(x0, x1) > LOBBY.x0 - 0.3 && Math.min(z0, z1) < LOBBY.z1 + 0.3 && Math.max(z0, z1) > LOBBY.z0 - 0.3);

  // does the corridor between node (i,j) and its east / north neighbour exist?
  function hasH(i, j) { if (j < 0) return false; if (j === 0) return true; return hash(i, j, 1) < 0.72; }
  function hasV(i, j) { if (j < 0) return false; if (i === -1 || i === 0) return true; return hash(i, j, 2) < 0.62; }

  // a segment's walkable span after clipping around the Garden Court; null if nothing is left
  function span(axis, i, j) {
    if (axis === 'x') {
      if (!hasH(i, j)) return null;
      const z = nodeZ(j);
      let a = nodeX(i), b = nodeX(i + 1), aNode = true, bNode = true;
      if (z > LOBBY.z0 && z < LOBBY.z1) {
        if (b <= LOBBY.x0 || a >= LOBBY.x1) { /* clear of the court */ } else if (a < LOBBY.x0) { b = LOBBY.x0; bNode = false; } else if (b > LOBBY.x1) { a = LOBBY.x1; aNode = false; } else return null;
      }
      return { axis, i, j, c: z, a, b, aNode, bNode };
    }
    if (!hasV(i, j)) return null;
    const x = nodeX(i);
    // runs north: from z = nodeZ(j) to nodeZ(j+1), stored as a > b in z, so keep a = south end
    let a = nodeZ(j), b = nodeZ(j + 1), aNode = true, bNode = true;
    if (x > LOBBY.x0 && x < LOBBY.x1) {
      if (b >= LOBBY.z1 || a <= LOBBY.z0) { /* clear */ } else if (a > LOBBY.z0 && b < LOBBY.z0) { a = LOBBY.z0; aNode = false; } else return null;
    }
    return { axis, i, j, c: x, a, b, aNode, bNode };
  }

  function nodeLive(i, j) {
    if (j < 0) return false;
    if (inLobby(nodeX(i), nodeZ(j), 0.5)) return false;
    return !!(span('x', i, j) || span('x', i - 1, j) || span('z', i, j) || span('z', i, j - 1));
  }

  function Wings(world) {
    this.world = world;
    this.M = world.M;
    this.loaded = new Map();
    this.t = 0;
    this.signTex = {};
    this.plateCache = [];
    this.dark = new THREE.MeshBasicMaterial({ color: 0x050403 });
    this.dndMat = new THREE.MeshBasicMaterial({ map: INN.Tex.dndCard() });
  }

  const P = Wings.prototype;

  // ------------------------------------------------------------- streaming
  P.update = function (pos, dt, force) {
    this.t -= dt;
    if (this.t > 0 && !force) return;
    this.t = 0.25;
    // only the part of the inn north of the front desk can reach the wings
    if (pos.z > -20) { if (this.loaded.size) this.unloadAll(); return; }
    const want = new Map();
    const LOAD_R = this.loadR || 54, DROP_R = this.dropR || 72;
    const i0 = Math.floor((pos.x - LOAD_R - X_OFF) / SP), i1 = Math.ceil((pos.x + LOAD_R - X_OFF) / SP);
    const j0 = Math.max(0, Math.floor((Z_OFF - pos.z - LOAD_R) / SP)), j1 = Math.ceil((Z_OFF - pos.z + LOAD_R) / SP);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const near = (x, z) => Math.hypot(x - pos.x, z - pos.z) < LOAD_R + 12;
      if (near(nodeX(i) + SP / 2, nodeZ(j))) { const s = span('x', i, j); if (s) want.set('x' + i + ',' + j, s); }
      if (near(nodeX(i), nodeZ(j) - SP / 2)) { const s = span('z', i, j); if (s) want.set('z' + i + ',' + j, s); }
      if (near(nodeX(i), nodeZ(j)) && nodeLive(i, j)) want.set('n' + i + ',' + j, { node: true, i, j });
    }
    // drop what is far behind
    this.loaded.forEach((rec, key) => {
      if (want.has(key)) return;
      if (Math.hypot(rec.cx - pos.x, rec.cz - pos.z) > DROP_R) this.unload(key);
    });
    // build the nearest missing pieces, a few per tick to avoid hitches
    const missing = [...want.entries()].filter(([k]) => !this.loaded.has(k)).map(([k, s]) => {
      const cx = s.node ? nodeX(s.i) : (s.axis === 'x' ? (s.a + s.b) / 2 : s.c);
      const cz = s.node ? nodeZ(s.j) : (s.axis === 'x' ? s.c : (s.a + s.b) / 2);
      return { k, s, d: Math.hypot(cx - pos.x, cz - pos.z) };
    }).sort((a, b) => a.d - b.d);
    for (const m of missing.slice(0, force ? 999 : 3)) this.build(m.k, m.s);
  };

  P.unloadAll = function () { [...this.loaded.keys()].forEach((k) => this.unload(k)); };

  P.unload = function (key) {
    const rec = this.loaded.get(key), W = this.world;
    if (!rec) return;
    rec.group.removeFromParent();
    rec.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    rec.textures.forEach((t) => t.dispose());
    const cs = new Set(rec.colliders), fs = new Set(rec.fixtures), is = new Set(rec.interactables);
    W.colliders = W.colliders.filter((c) => !cs.has(c));
    W.fixtures = W.fixtures.filter((f) => !fs.has(f));
    W.interactables = W.interactables.filter((m) => !is.has(m));
    this.loaded.delete(key);
  };

  P.build = function (key, s) {
    const W = this.world;
    const c0 = W.colliders.length, f0 = W.fixtures.length, i0 = W.interactables.length;
    const group = new THREE.Group();
    W.root.add(group);
    const rec = { group, textures: [], cx: 0, cz: 0 };
    if (s.node) this.buildNode(s.i, s.j, group, rec); else this.buildSegment(s, group, rec);
    rec.colliders = W.colliders.slice(c0);
    rec.fixtures = W.fixtures.slice(f0);
    rec.interactables = W.interactables.slice(i0);
    rec.interactables.forEach((m) => { m.updateWorldMatrix(true, false); m.userData.wp = new THREE.Vector3().setFromMatrixPosition(m.matrixWorld); });
    this.loaded.set(key, rec);
  };

  // ------------------------------------------------------------- pieces
  // helpers that work in corridor terms: s along the corridor, d across it (+d = east for z-corridors, south for x-corridors)
  function frame(axis, c) {
    const toW = (s, d) => (axis === 'x' ? [s, c + d] : [c + d, s]);
    return {
      box(b, mat, s0, s1, d0, d1, y0, y1, tile) {
        const [ax, az] = toW(Math.min(s0, s1), Math.min(d0, d1)), [bx, bz] = toW(Math.max(s0, s1), Math.max(d0, d1));
        b.box(mat, Math.min(ax, bx), Math.max(ax, bx), y0, y1, Math.min(az, bz), Math.max(az, bz), tile);
      },
      rect(s0, s1, d0, d1) {
        const [ax, az] = toW(s0, d0), [bx, bz] = toW(s1, d1);
        return [Math.min(ax, bx), Math.min(az, bz), Math.max(ax, bx), Math.max(az, bz)];
      },
      toW,
      // rotation that makes a plane face toward -d (side +1) or +d (side -1), i.e. into the corridor
      faceIn(side) {
        if (axis === 'x') return side > 0 ? Math.PI : 0;
        return side > 0 ? -Math.PI / 2 : Math.PI / 2;
      },
    };
  }

  P.plateAtlas = function (nums, rec) {
    const c = INN.Tex.canvas(1024, 64), g = c.getContext('2d');
    nums.forEach((n, k) => {
      const x = k * 128;
      g.fillStyle = '#c9a24a'; g.fillRect(x, 0, 128, 64);
      g.strokeStyle = '#6a4c14'; g.lineWidth = 4; g.strokeRect(x + 3, 3, 122, 58);
      g.fillStyle = '#2a1a06'; g.font = 'bold 36px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(n), x + 64, 34);
    });
    const t = new THREE.CanvasTexture(c);
    rec.textures.push(t);
    const m = new THREE.MeshBasicMaterial({ map: t });
    rec.mats = (rec.mats || []).concat(m);
    return m;
  };

  P.buildSegment = function (s, group, rec) {
    const M = this.M, W = this.world, b = new INN.Batch();
    const f = frame(s.axis, s.c);
    const lo = Math.min(s.a, s.b), hi = Math.max(s.a, s.b);
    const loNode = s.axis === 'x' ? s.aNode : s.bNode, hiNode = s.axis === 'x' ? s.bNode : s.aNode;
    const s0 = lo + (loNode ? HALF : 0), s1 = hi - (hiNode ? HALF : 0);
    if (s1 - s0 < 0.5) return;
    rec.cx = s.axis === 'x' ? (s0 + s1) / 2 : s.c; rec.cz = s.axis === 'x' ? s.c : (s0 + s1) / 2;
    const seed = (k) => hash(s.i * 7 + (s.axis === 'x' ? 0 : 3), s.j * 13 + 5, k);
    const darkStretch = seed(1) < 0.14;
    const tileWing = seed(2) < 0.1;
    const wallStyle = tileWing ? [[M.tile, 0, H]] : [[M.wood, 0, 1.05], [seed(3) < 0.25 ? M.wallpaperRoom : M.wallpaper, 1.05, H]];

    // floor and ceiling
    f.box(b, tileWing ? M.tileFloor : M.carpet, s0, s1, -HALF, HALF, -0.02, 0, 2.4);
    f.box(b, M.ceiling, s0, s1, -HALF, HALF, H, H + 0.02, 1.2);
    // walls
    for (const side of [-1, 1]) {
      const d0 = side * HALF, d1 = side * (HALF + 0.2);
      wallStyle.forEach(([mat, y0, y1]) => f.box(b, mat, s0, s1, d0, d1, y0, y1, 1.2));
      W.collider(...f.rect(s0, s1, d0, d1));
    }
    // doors, every six meters, where a room could actually be
    const plateNums = [], plates = [];
    const claimed = INN.Game && INN.Game.run && INN.Game.run.claimed;
    let k = 0;
    for (let p = s0 + 3; p < s1 - 1.5; p += 6, k++) {
      for (const side of [-1, 1]) {
        const roomRect = f.rect(p - 3, p + 3, side * HALF, side * (HALF + ROOM_D));
        if (forbidden(...roomRect)) continue;
        const r = seed(10 + k * 2 + (side > 0 ? 1 : 0));
        const face = side * (HALF - 0.01);
        if (r < 0.05) {
          // a door left open onto nothing
          f.box(b, this.dark, p - 0.47, p + 0.47, face, face - side * 0.005, 0, 2.12);
          continue;
        }
        f.box(b, M.door, p - 0.47, p + 0.47, face, face - side * 0.05, 0, 2.12, 1);
        // a red-shaded sconce beside the door
        f.box(b, M.redShade, p + 0.72, p + 0.92, face, face - side * 0.2, 1.65, 1.88);
        f.box(b, M.brass, p + 0.3, p + 0.36, face - side * 0.05, face - side * 0.11, 0.98, 1.04);
        // the number: usually a stranger's, once in a while your own
        let n = 2000 + Math.floor(hash(s.i * 31 + k, s.j * 17 + side, 9) * 7800);
        if (claimed && r > 0.97) n = claimed;
        plates.push({ p, side, face });
        plateNums.push(n);
        if (r > 0.05 && r < 0.11) {
          const [x, z] = f.toW(p + 0.33, face - side * 0.11);
          b.plane(this.dndMat, 0.16, 0.32, x, 0.88, z, 0, f.faceIn(side), 0);
        }
      }
    }
    if (plates.length) {
      const pm = this.plateAtlas(plateNums, rec);
      plates.forEach((pl, idx) => {
        const [x, z] = f.toW(pl.p, pl.face - pl.side * 0.06);
        b.plane(pm, 0.28, 0.14, x, 1.62, z, 0, f.faceIn(pl.side), 0, null, [idx / 8, 0, (idx + 1) / 8, 1]);
      });
    }
    // potted ferns between the doors
    for (let p = s0 + 6, kk = 0; p < s1 - 1; p += 6, kk++) {
      if (seed(40 + kk) > 0.4) continue;
      const side = seed(60 + kk) < 0.5 ? -1 : 1;
      const [x, z] = f.toW(p, side * (HALF - 0.32));
      b.mesh(M.brass, new THREE.CylinderGeometry(0.26, 0.2, 0.45, 10), x, 0.22, z);
      for (let q = 0; q < 7; q++) {
        const g = new THREE.ConeGeometry(0.12, 1.0, 3); g.translate(0, 0.5, 0);
        b.mesh(q % 2 ? M.leaf : M.leafDark, g, x, 0.42, z, 0, q * 0.9, 0.75);
      }
      W.collider(x - 0.28, z - 0.28, x + 0.28, z + 0.28);
    }
    b.flush(group);
    // pendant lamps, unless this stretch has gone dark
    const fixtures = [];
    for (let p = s0 + 3; p < s1 - 1; p += 6) fixtures.push(p);
    fixtures.forEach((p, idx) => {
      if (darkStretch && idx !== Math.floor(fixtures.length / 2)) return;
      const [x, z] = f.toW(p, 0);
      const pd = W.pendant(x, H, z, group);
      W.fixtures.push({ mesh: pd.glow, pos: new THREE.Vector3(x, H - pd.drop - 0.25, z), flickerable: true, color: 0xffd2a0 });
    });
    // now and then: a snack machine, a little wrong
    if (seed(4) < 0.08 && s1 - s0 > 12) {
      const side = seed(5) < 0.5 ? -1 : 1, p = s0 + 6;
      const [x, z] = f.toW(p, side * (HALF - 0.38));
      const ry = s.axis === 'x' ? (side > 0 ? Math.PI : 0) : (side > 0 ? -Math.PI / 2 : Math.PI / 2);
      const before = W.root.children.length;
      W.vendingMachine(seed(6) < 0.5 ? 'snax' : 'provisions', x, z, ry);
      // the machine was added to the root; move it into this piece so it unloads with it
      W.root.children.slice(before).forEach((o) => group.add(o));
    }
    // signs back to the lobby, hung just before each crossing
    for (const end of [-1, 1]) {
      const atNode = end < 0 ? loNode : hiNode;
      if (!atNode) continue;
      const nodeS = end < 0 ? lo : hi;
      const travel = end; // walking toward this end means moving +s (end=1) or -s (end=-1)
      const node = s.axis === 'x' ? { i: end < 0 ? s.i : s.i + 1, j: s.j } : { i: s.i, j: end < 0 ? s.j : s.j + 1 };
      // in z-corridors lo is the north end (smaller z); fix the node index
      if (s.axis === 'z') node.j = end < 0 ? s.j + 1 : s.j;
      const dirW = s.axis === 'x' ? [travel, 0] : [0, travel];
      const arrow = this.arrowFor(node, dirW);
      const tex = this.sign(arrow);
      const [x, z] = f.toW(nodeS - end * 3.2, 0);
      const ry = s.axis === 'x' ? (travel > 0 ? -Math.PI / 2 : Math.PI / 2) : (travel > 0 ? Math.PI : 0);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.3), new THREE.MeshBasicMaterial({ map: tex }));
      m.position.set(x, 2.35, z); m.rotation.y = ry; group.add(m);
      const rod = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2, 0.02), M.brass); rod.position.set(x, 2.6, z); group.add(rod);
    }
  };

  P.buildNode = function (i, j, group, rec) {
    const M = this.M, W = this.world, b = new INN.Batch();
    const x = nodeX(i), z = nodeZ(j);
    rec.cx = x; rec.cz = z;
    b.box(M.carpet, x - HALF, x + HALF, -0.02, 0, z - HALF, z + HALF, 2.4);
    b.box(M.ceiling, x - HALF, x + HALF, H, H + 0.02, z - HALF, z + HALF, 1.2);
    const wall = (x0, x1, z0, z1) => {
      b.box(M.wood, x0, x1, 0, 1.05, z0, z1, 1.2); b.box(M.wallpaper, x0, x1, 1.05, H, z0, z1, 1.2);
      W.collider(x0, z0, x1, z1);
    };
    const T = 0.2;
    if (!span('x', i, j)) wall(x + HALF, x + HALF + T, z - HALF, z + HALF);       // east
    if (!span('x', i - 1, j)) wall(x - HALF - T, x - HALF, z - HALF, z + HALF);   // west
    if (!span('z', i, j)) wall(x - HALF, x + HALF, z - HALF - T, z - HALF);       // north
    if (!span('z', i, j - 1)) wall(x - HALF, x + HALF, z + HALF, z + HALF + T);   // south
    for (const [cx, cz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const px = x + cx * HALF, pz = z + cz * HALF;
      wall(Math.min(px, px + cx * T), Math.max(px, px + cx * T), Math.min(pz, pz + cz * T), Math.max(pz, pz + cz * T));
    }
    b.flush(group);
    const pd = W.pendant(x, H, z, group);
    W.fixtures.push({ mesh: pd.glow, pos: new THREE.Vector3(x, H - pd.drop - 0.25, z), flickerable: true, color: 0xffd2a0 });
  };

  // ------------------------------------------------------------- the way back
  function distToLobby(x, z) {
    let best = 1e9;
    for (const [ox, oz] of OPENINGS) best = Math.min(best, Math.abs(ox - x) + Math.abs(oz - z));
    return best;
  }

  // From a crossing, which way is the lobby? Arrows are relative to the guest walking direction dirW.
  P.arrowFor = function (node, dirW) {
    const x = nodeX(node.i), z = nodeZ(node.j);
    const exits = [];
    const eastS = span('x', node.i, node.j), westS = span('x', node.i - 1, node.j);
    const northS = span('z', node.i, node.j), southS = span('z', node.i, node.j - 1);
    if (eastS) exits.push({ d: [1, 0], end: eastS.bNode ? [nodeX(node.i + 1), z] : [eastS.b, z] });
    if (westS) exits.push({ d: [-1, 0], end: westS.aNode ? [nodeX(node.i - 1), z] : [westS.a, z] });
    if (northS) exits.push({ d: [0, -1], end: [x, nodeZ(node.j + 1)] });
    if (southS) exits.push({ d: [0, 1], end: southS.aNode ? [x, nodeZ(node.j - 1)] : [x, southS.a] });
    if (!exits.length) return 'back';
    exits.sort((a, b) => distToLobby(a.end[0], a.end[1]) - distToLobby(b.end[0], b.end[1]));
    const best = exits[0].d;
    if (best[0] === dirW[0] && best[1] === dirW[1]) return 'ahead';
    if (best[0] === -dirW[0] && best[1] === -dirW[1]) return 'back';
    const right = [-dirW[1], dirW[0]];
    return best[0] === right[0] && best[1] === right[1] ? 'right' : 'left';
  };

  P.sign = function (arrow) {
    if (this.signTex[arrow]) return this.signTex[arrow];
    const text = { ahead: 'LOBBY ↑', back: 'LOBBY ↓', left: '← LOBBY', right: 'LOBBY →' }[arrow];
    const t = INN.Tex.sign(text, { w: 512, h: 118, bg: '#1c2a2a', fg: '#e8f0ea', border: '#c9a24a' });
    this.signTex[arrow] = t;
    return t;
  };

  // is this point inside a generated corridor? (used to place the corridor guest)
  P.isCorridor = function (x, z) {
    if (z > NORTH_LIMIT || inLobby(x, z, 0)) return false;
    const j = Math.round((Z_OFF - z) / SP), i = Math.round((x - X_OFF) / SP);
    if (Math.abs(z - nodeZ(j)) < HALF - 0.3) {
      const ii = Math.floor((x - X_OFF) / SP), s = span('x', ii, j);
      if (s && x > Math.min(s.a, s.b) && x < Math.max(s.a, s.b)) return true;
      if (Math.abs(x - nodeX(i)) < HALF && nodeLive(i, j)) return true;
    }
    if (Math.abs(x - nodeX(i)) < HALF - 0.3) {
      const jj = Math.floor((Z_OFF - z) / SP), s = span('z', i, jj);
      if (s && z < Math.max(s.a, s.b) && z > Math.min(s.a, s.b)) return true;
    }
    return false;
  };

  // which way does the corridor at this point run?
  P.axisAt = function (x, z) {
    const j = Math.round((Z_OFF - z) / SP);
    return Math.abs(z - nodeZ(j)) < HALF ? 'x' : 'z';
  };

  INN.Wings = Wings;
})(window.INN);
