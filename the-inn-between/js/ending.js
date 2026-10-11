// THE INN BETWEEN — checkout. A highway at dawn, colors of a 1974 postcard.
// The inn is gone from the rear-view mirror. One key hangs from it.
window.INN = window.INN || {};
(function (INN) {
  'use strict';

  function Ending(renderer, roomNum) {
    const scene = this.scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf2b48a, 40, 260);
    const cam = this.camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.25, 600);
    cam.position.set(-0.4, 1.15, 0);
    scene.add(cam);
    this.renderer = renderer;
    this.t = 0;

    const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 24, 16), new THREE.MeshBasicMaterial({ map: INN.Tex.skyGradient(), side: THREE.BackSide, fog: false }));
    scene.add(sky);
    const sun = new THREE.Mesh(new THREE.CircleGeometry(26, 32), new THREE.MeshBasicMaterial({ color: 0xffd890, fog: false }));
    sun.position.set(0, 18, -480); scene.add(sun);
    const halo = new THREE.Mesh(new THREE.CircleGeometry(60, 32), new THREE.MeshBasicMaterial({ color: 0xffb070, transparent: true, opacity: 0.35, fog: false }));
    halo.position.set(0, 18, -481); scene.add(halo);
    scene.add(new THREE.HemisphereLight(0xffe0c8, 0x8a6a5a, 1.05));
    const dl = new THREE.DirectionalLight(0xffc890, 0.5); dl.position.set(0, 10, -20); scene.add(dl);

    // the land on either side of the road (no overlap: the picture has little depth precision)
    const landMat = new THREE.MeshLambertMaterial({ color: 0xa8785a });
    for (const [w, x] of [[600, -2.4 - 300], [600, 5.6 + 300]]) {
      const land = new THREE.Mesh(new THREE.PlaneGeometry(w, 1200), landMat);
      land.rotation.x = -Math.PI / 2; land.position.x = x; scene.add(land);
    }
    // road: plain asphalt, painted dashes that scroll past
    const road = new THREE.Mesh(new THREE.PlaneGeometry(8, 1200), new THREE.MeshLambertMaterial({ color: 0x3a3236 }));
    road.rotation.x = -Math.PI / 2; road.position.set(1.6, 0, 0); scene.add(road);
    this.dashes = [];
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xe8c070 });
    for (let i = 0; i < 40; i++) {
      const d = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 3), dashMat);
      d.rotation.x = -Math.PI / 2; d.position.set(1.6, 0.06, -i * 8); scene.add(d); this.dashes.push(d);
    }
    for (const ex of [-2.3, 5.5]) {
      const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 1200), new THREE.MeshBasicMaterial({ color: 0xd8cbb8 }));
      edge.rotation.x = -Math.PI / 2; edge.position.set(ex, 0.06, 0); scene.add(edge);
    }

    // palms and telephone poles that scroll past
    this.props = [];
    const trunk = new THREE.MeshLambertMaterial({ color: 0x4a2a2a });
    const frond = new THREE.MeshLambertMaterial({ color: 0x2a3a3a });
    for (let i = 0; i < 40; i++) {
      const g = new THREE.Group();
      if (i % 3 === 0) {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 9, 6), trunk); p.position.y = 4.5; g.add(p);
        const bar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.12), trunk); bar.position.y = 8.4; g.add(bar);
      } else {
        const h = 7 + Math.random() * 5;
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.3, h, 6), trunk); p.position.y = h / 2; p.rotation.z = (Math.random() - 0.5) * 0.15; g.add(p);
        for (let k = 0; k < 7; k++) {
          const f = new THREE.Mesh(new THREE.ConeGeometry(0.4, 3.4, 4), frond);
          f.position.y = h; f.rotation.z = Math.PI / 2.4; f.rotation.y = k / 7 * Math.PI * 2;
          f.geometry.translate(0, 1.6, 0);
          g.add(f);
        }
      }
      const side = i % 2 ? 1 : -1;
      g.position.set(side * (7 + Math.random() * 14), 0, -i * 15);
      scene.add(g); this.props.push(g);
    }

    // the car interior, attached to the camera
    const dash = new THREE.Mesh(new THREE.BoxGeometry(3, 0.6, 1), new THREE.MeshLambertMaterial({ color: 0x2a1a12 }));
    dash.position.set(0.2, -0.75, -0.9); cam.add(dash);
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 8, 24), new THREE.MeshLambertMaterial({ color: 0x1a1210 }));
    wheel.position.set(0, -0.42, -0.55); wheel.rotation.x = -0.4; cam.add(wheel);
    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.4, 0.08), new THREE.MeshLambertMaterial({ color: 0x1a1210 }));
    pillarL.position.set(-0.85, 0.1, -0.85); pillarL.rotation.z = -0.35; cam.add(pillarL);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 1.2), new THREE.MeshLambertMaterial({ color: 0x3a2a22 }));
    roof.position.set(0.2, 0.62, -0.6); cam.add(roof);

    // rear-view mirror: the road behind, and nothing else
    this.rearCam = new THREE.PerspectiveCamera(40, 3, 0.1, 600);
    this.rearRT = new THREE.WebGLRenderTarget(384, 128);
    const mtex = this.rearRT.texture;
    const mirror = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.085), new THREE.MeshBasicMaterial({ map: mtex, side: THREE.DoubleSide }));
    mirror.position.set(0.2, 0.2, -0.62);
    mirror.scale.x = -1;
    cam.add(mirror);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.02), new THREE.MeshLambertMaterial({ color: 0x111111 }));
    frame.position.set(0.2, 0.2, -0.635); cam.add(frame);
    const stem = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.2, 0.015), new THREE.MeshLambertMaterial({ color: 0x111111 }));
    stem.position.set(0.2, 0.33, -0.64); cam.add(stem);
    // the key
    const pend = this.pend = new THREE.Group(); pend.position.set(0.24, 0.16, -0.6); cam.add(pend);
    const string = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.09, 0.003), new THREE.MeshBasicMaterial({ color: 0xc9a24a }));
    string.position.y = -0.045; pend.add(string);
    const brass = new THREE.MeshPhongMaterial({ color: 0xd9b25a, specular: 0xffffff, shininess: 80, emissive: 0x3a2a08 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.003, 6, 14), brass); ring.position.y = -0.1; pend.add(ring);
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.04, 0.003), brass); shaft.position.y = -0.13; pend.add(shaft);
    const tc = INN.Tex.canvas(64, 96), tg = tc.getContext('2d');
    tg.fillStyle = '#d8742a'; tg.fillRect(0, 0, 64, 96);
    tg.fillStyle = '#2a1a0c'; tg.font = 'bold 26px Georgia'; tg.textAlign = 'center'; tg.fillText(String(roomNum || ''), 32, 58);
    const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.028, 0.042), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(tc) }));
    tag.position.set(0.012, -0.14, 0.004); pend.add(tag);
  }

  Ending.prototype.update = function (dt) {
    this.t += dt;
    const speed = 22;
    this.dashes.forEach((d) => { d.position.z += speed * dt; if (d.position.z > 10) d.position.z -= 320; });
    this.props.forEach((p) => { p.position.z += speed * dt; if (p.position.z > 20) p.position.z -= 600; });
    this.pend.rotation.z = Math.sin(this.t * 1.7) * 0.25 + Math.sin(this.t * 0.6) * 0.08;
    this.pend.rotation.x = Math.sin(this.t * 1.3) * 0.1;
    this.camera.position.y = 1.15 + Math.sin(this.t * 9) * 0.004;
    this.camera.rotation.y = Math.sin(this.t * 0.2) * 0.03;
    this.rearCam.position.copy(this.camera.position).add(new THREE.Vector3(0, 0.3, 0.5));
    this.rearCam.lookAt(this.rearCam.position.x, 1.0, 100);
    const r = this.renderer;
    r.setRenderTarget(this.rearRT); r.render(this.scene, this.rearCam); r.setRenderTarget(null);
  };

  INN.Ending = Ending;
})(window.INN);
