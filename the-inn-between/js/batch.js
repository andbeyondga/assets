// THE INN BETWEEN — geometry batching. Big spaces are built from thousands of
// boxes; merging them per material keeps the draw count small.
window.INN = window.INN || {};
(function (INN) {
  'use strict';

  const _m = new THREE.Matrix4(), _n = new THREE.Matrix3(), _v = new THREE.Vector3();
  const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(1, 1, 1);

  function Batch() { this.groups = new Map(); }

  Batch.prototype.geo = function (mat, geometry, matrix) {
    let g = this.groups.get(mat);
    if (!g) { g = { pos: [], norm: [], uv: [], idx: [], count: 0 }; this.groups.set(mat, g); }
    const p = geometry.attributes.position, n = geometry.attributes.normal, uv = geometry.attributes.uv;
    _n.getNormalMatrix(matrix);
    for (let i = 0; i < p.count; i++) {
      _v.fromBufferAttribute(p, i).applyMatrix4(matrix); g.pos.push(_v.x, _v.y, _v.z);
      _v.fromBufferAttribute(n, i).applyMatrix3(_n).normalize(); g.norm.push(_v.x, _v.y, _v.z);
      g.uv.push(uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0);
    }
    const ix = geometry.index;
    if (ix) for (let i = 0; i < ix.count; i++) g.idx.push(ix.getX(i) + g.count);
    else for (let i = 0; i < p.count; i++) g.idx.push(i + g.count);
    g.count += p.count;
    geometry.dispose();
  };

  // axis-aligned box in world coordinates, texture tiled by real size
  Batch.prototype.box = function (mat, x0, x1, y0, y1, z0, z1, tile) {
    const w = Math.abs(x1 - x0), h = Math.abs(y1 - y0), d = Math.abs(z1 - z0);
    if (w <= 0 || h <= 0 || d <= 0) return;
    const g = new THREE.BoxGeometry(w, h, d);
    if (tile) {
      const uv = g.attributes.uv;
      const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
      for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
        const i = f * 4 + k;
        uv.setXY(i, uv.getX(i) * dims[f][0] / tile, uv.getY(i) * dims[f][1] / tile);
      }
    }
    _m.makeTranslation((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    this.geo(mat, g, _m);
  };

  Batch.prototype.plane = function (mat, w, h, x, y, z, rx, ry, rz, tile, uvRect) {
    const g = new THREE.PlaneGeometry(w, h);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      let u = uv.getX(i), v = uv.getY(i);
      if (tile) { u *= w / tile; v *= h / tile; }
      if (uvRect) { u = uvRect[0] + u * (uvRect[2] - uvRect[0]); v = uvRect[1] + v * (uvRect[3] - uvRect[1]); }
      uv.setXY(i, u, v);
    }
    _e.set(rx || 0, ry || 0, rz || 0); _q.setFromEuler(_e);
    _m.compose(_v.set(x, y, z), _q, _s);
    this.geo(mat, g, _m);
  };

  Batch.prototype.mesh = function (mat, geometry, x, y, z, rx, ry, rz, sx, sy, sz) {
    _e.set(rx || 0, ry || 0, rz || 0); _q.setFromEuler(_e);
    _m.compose(new THREE.Vector3(x, y, z), _q, new THREE.Vector3(sx || 1, sy || sx || 1, sz || sx || 1));
    this.geo(mat, geometry, _m);
  };

  Batch.prototype.flush = function (parent) {
    const out = [];
    this.groups.forEach((g, mat) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(g.pos, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(g.norm, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(g.uv, 2));
      geo.setIndex(g.count > 65535 ? new THREE.Uint32BufferAttribute(g.idx, 1) : new THREE.Uint16BufferAttribute(g.idx, 1));
      geo.computeBoundingSphere();
      const m = new THREE.Mesh(geo, mat);
      parent.add(m); out.push(m);
    });
    this.groups.clear();
    return out;
  };

  INN.Batch = Batch;
})(window.INN);
