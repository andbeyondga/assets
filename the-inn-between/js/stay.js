// THE INN BETWEEN — the stay. Hub, the hallways between, the amenities and their Managers.
//
//   Front desk (hub)  ->  elevator  ->  the hallway (spot what is out of order)  ->  an amenity
//   Each amenity has house rules nobody posts. The guests know them. Watch the guests.
//   Each amenity's Manager tests you. Win: a stamp. Lose: technical difficulties, NOTED.
//   Four stamps and the Concierge will see you. One is enough for an early departure.
window.INN = window.INN || {};
(function (INN) {
  'use strict';
  const V3 = THREE.Vector3;
  const UI = INN.UI, Audio = INN.Audio, Tex = INN.Tex;
  const EYE = 1.6;

  const S = INN.Stay = { act: {} };
  const REALMS = [
    { id: 'pool', name: 'THE POOL', manager: 'THE LIFEGUARD', open: true },
    { id: 'arcade', name: 'THE ARCADE', manager: 'ATTRACT MODE', open: false },
    { id: 'dining', name: 'THE DINING ROOM', manager: 'THE HEAD CHEF', open: false },
    { id: 'garden', name: 'THE GARDEN COURT', manager: 'THE GROUNDSKEEPER', open: false },
  ];
  S.REALMS = REALMS;

  let G, W, R;
  const rnd = Math.random;
  const pick = (a) => a[Math.floor(rnd() * a.length)];

  // ================================================================= setup
  S.setup = function (game) {
    G = game; W = G.world; R = G.run;
    R.stay = { stamps: {}, noted: 0, reached: {}, variant: { pool: 0 }, hints: {} };

    // your room, prepared in advance: no key hunting
    const keyRooms = Object.keys(INN.ROOMS).map(Number).filter((n) => INN.ROOMS[n].kind === 'key' && n <= 116);
    const n = pick(keyRooms);
    const rm = W.rooms[n];
    rm.hasKey = true; rm.key.visible = false;
    if (rm.luggage) rm.luggage.visible = true;
    R.claimed = n; R.holdingKey = true; R.claimT = R.T; R.hkNext = 1e9;
    R.hints.luggage = true;
    R.stamps.push({ text: 'ROOM ' + n, color: 'blue' });

    // the rest of the inn is closed for service in this broadcast
    rope(12, -1.5, 12, 1.5, 'z');             // east corridor
    rope(-1.5, 12, 1.5, 12, 'x');             // dining hall
    rope(-10.5, -12, -7.5, -12, 'x');         // promenade to the Garden Court
    rope(15.9, -1.75, 18.1, -1.75, 'x');     // the pool's door to the east corridor (pool side)

    S.hall.init();
    S.pool.init();
  };

  // a velvet rope on brass posts across an opening, with a card
  function rope(x0, z0, x1, z1, axis) {
    const M = W.M;
    for (const [x, z] of [[x0, z0], [x1, z1]]) {
      W.cyl(0.04, 0.05, 1.0, M.brass, x, 0.5, z);
      W.cyl(0.07, 0.07, 0.06, M.brass, x, 1.02, z);
      W.cyl(0.18, 0.2, 0.04, M.brass, x, 0.02, z);
    }
    const len = Math.hypot(x1 - x0, z1 - z0);
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, len, 6), new THREE.MeshLambertMaterial({ color: 0x8a1410 }));
    r.position.set((x0 + x1) / 2, 0.85, (z0 + z1) / 2);
    r.rotation.z = Math.PI / 2; if (axis === 'z' || Math.abs(z1 - z0) > Math.abs(x1 - x0)) { r.rotation.z = 0; r.rotation.x = Math.PI / 2; }
    W.add(r);
    const card = W.signMesh(Tex.sign('CLOSED FOR\nSERVICE', { w: 256, h: 128 }), 0.5, 0.25, (x0 + x1) / 2, 0.85, (z0 + z1) / 2, 0, { double: true });
    if (Math.abs(z1 - z0) > Math.abs(x1 - x0)) card.rotation.y = Math.PI / 2;
    W.collider(Math.min(x0, x1) - 0.15, Math.min(z0, z1) - 0.15, Math.max(x0, x1) + 0.15, Math.max(z0, z1) + 0.15);
  }

  // ================================================================= per-frame
  S.update = function (dt) {
    if (!R) return;
    S.hall.update(dt);
    S.pool.update(dt);
  };
  S.late = function (dt) { if (R) S.pool.late(dt); };

  S.stampCount = () => Object.keys(R.stay.stamps).length;

  // ================================================================= interactions
  S.label = function (it) {
    switch (it.type) {
      case 'elevator': return 'CALL ELEVATOR · AMENITIES';
      case 'poolbell': return S.pool.state === 'idle' ? (R.stay.stamps.pool ? 'THE LIFEGUARD HAS NOTHING FURTHER FOR YOU' : 'RING FOR THE LIFEGUARD') : '';
      case 'gate': return R.stay.stamps.pool ? 'RETURN TO THE FRONT DESK' : 'TRY THE GATE';
      case 'deskbell': case 'clerk': return S.stampCount() ? 'SPEAK WITH THE CONCIERGE' : 'SPEAK WITH THE DESK';
      default: return null;
    }
  };

  S.act.elevator = function () {
    Audio.click(new V3(10.3, 1.2, -11.8));
    G.openPaper({
      title: 'Amenities',
      speaker: 'The call button lights. A card beside it lists the floors in service.',
      options: REALMS.map((r) => ({
        label: r.name + (R.stay.stamps[r.id] ? '  (stamped)' : r.open ? '' : '  (not yet in service)'),
        fn: () => {
          if (!r.open) { UI.notice(r.name + ' is not yet in service. The button does not light.'); return; }
          if (R.stay.stamps[r.id]) { UI.notice(r.manager + ' has nothing further for you.'); return; }
          UI.closePaper();
          S.hall.start(r.id);
        },
      })).concat([{ label: 'Not now.', fn: () => UI.closePaper() }]),
    });
  };

  S.act.gate = function () {
    if (!R.stay.stamps.pool) { UI.notice('The gate is chained. A tag reads: GUESTS ARRIVE BY HALLWAY AND LEAVE APPROVED.'); return; }
    S.teleport(8.5, -9.6, Math.PI);
    UI.notice('The gate opens onto the front desk, which is not where it should be. The way back is always shorter.', 5);
  };

  S.act.poolbell = function () { S.pool.ringBell(); };

  // the front desk: forms, or with a stamp, the Concierge
  S.act.desk = function () {
    if (!S.stampCount()) return false;
    S.concierge();
    return true;
  };

  S.teleport = function (x, z, yaw) {
    G.player.pos.set(x, 0, z); G.player.yaw = yaw; G.player.pitch = 0;
    G.vhs.pulse(0.7, 0.35); Audio.staticBurst(0.25);
  };

  // ================================================================= losing: technical difficulties
  S.strike = function (why) {
    if (G.state !== 'play' && G.state !== 'paper' && G.state !== 'checkout') return;
    G.state = 'strike';
    G.releaseLock();
    UI.closePaper();
    UI.clearCaptions();
    UI.hud(false);
    Audio.stopMuzak(true);
    Audio.staticBurst(1.2);
    G.vhs.pulse(1, 1);
    R.stay.noted++;
    R.stamps.push({ text: 'NOTED', color: 'red' });
    const last = R.stay.noted >= 3;
    setTimeout(() => {
      if (last) { G.lose('noted'); return; }
      UI.card('standby', { line1: 'WE ARE EXPERIENCING TECHNICAL DIFFICULTIES', line2: 'PLEASE STAND BY' });
      setTimeout(() => G.say('The guest has been returned to their room.'), 600);
      setTimeout(() => {
        S.pool.reset(true);
        S.hall.stop();
        const rm = W.rooms[R.claimed];
        rm.door.target = 0; rm.door.angle = 0;
        S.teleport(rm.insideWorld.x, rm.insideWorld.z, rm.side === 'N' ? 0 : Math.PI);
        UI.card('none');
        UI.hud(true);
        G.state = 'play';
        G.requestLock();
        UI.notice('NOTED (' + R.stay.noted + ' of 3). ' + (why || ''), 6);
        if (R.stay.noted === 1) setTimeout(() => G.say('A guest who is noted three times has decided to stay with us. House rules may be revised after an incident.'), 2500);
      }, 4200);
    }, 700);
  };

  // ================================================================= the folio
  S.folioTop = function () {
    const slots = REALMS.map((r) => '<div class="slot' + (R.stay.stamps[r.id] ? ' done' : '') + '"><div class="slot-label">' + r.name.replace('THE ', '') + '</div>' +
      (R.stay.stamps[r.id] ? '<div class="stamp green slot-stamp">' + r.manager.replace('THE ', '') + '<br>APPROVED</div>' : '<div class="slot-empty">' + (r.open ? '' : 'NOT IN SERVICE') + '</div>') + '</div>').join('');
    let noted = '';
    for (let i = 0; i < 3; i++) noted += '<span class="noted' + (i < R.stay.noted ? ' on' : '') + '">' + (i < R.stay.noted ? 'NOTED' : '') + '</span>';
    return '<div class="small" style="margin:0 0 6px">STAMPS. FOUR, AND THE CONCIERGE WILL SEE YOU.</div><div class="slots">' + slots + '</div>' +
      '<div class="noted-row"><span class="small" style="margin:0">CONDUCT</span>' + noted + '</div>';
  };

  // ================================================================= checkout with the Concierge
  S.concierge = function () {
    const n = S.stampCount();
    const v = R.stay.variant.pool;
    const qs = [
      v === 0
        ? { q: 'At the pool, when the whistle blows, what does a guest do?', a: ['Stands perfectly still.', 'Keeps walking. It is good for circulation.', 'Leaves the deck.'], c: 0 }
        : { q: 'At the pool, how does a guest know to stand still?', a: ['When the Lifeguard raises an arm.', 'When the whistle blows.', 'When the lights change.'], c: 0 },
      { q: 'May a guest look at the water?', a: ['Never.', 'As long as they like.', 'Only during the whistle.'], c: 0 },
      { q: 'How does a guest cross the pool deck?', a: ['At a walk.', 'Quickly, while the whistle is quiet.', 'Along the water’s edge.'], c: 0 },
    ];
    G.state = 'checkout';
    G.releaseLock();
    UI.prompt('');
    let i = 0;
    const shuffle = (a) => { for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(rnd() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; };
    const intro = () => UI.paper({
      title: 'The Concierge',
      speaker: 'The clerk is gone. In their place, someone in the same uniform, taller, reading your folio upside down without turning it.',
      html: '<div class="body" style="font-size:17px">“' + n + ' stamp' + (n === 1 ? '' : 's') + '. ' + (n >= 4 ? 'Everything appears to be in order.' : 'Four is customary. An early departure can be arranged, as a courtesy. A few questions first.') + '”</div>',
      closable: false,
      options: [{ label: 'Go ahead.', fn: () => ask() }, { label: 'I will come back with more stamps.', fn: () => { UI.closePaper(); G.state = 'play'; G.requestLock(); } }],
    });
    const ask = () => {
      const Q = qs[i];
      const order = shuffle([0, 1, 2]);
      UI.paper({
        title: 'The Concierge',
        speaker: 'QUESTION ' + (i + 1) + ' OF ' + qs.length,
        html: '<div class="body" style="font-size:17px">“' + UI.esc(Q.q) + '”</div>',
        closable: false,
        options: order.map((k) => ({
          label: Q.a[k], fn: () => {
            if (k !== Q.c) {
              UI.paper({ title: 'The Concierge', html: '<div class="body" style="font-size:17px">“I see.” The Concierge makes a note.</div>', closable: false, stamp: { text: 'NOTED', color: 'red' }, options: [{ label: '...', fn: () => { UI.closePaper(); G.state = 'play'; S.strike('The Concierge was not satisfied.'); } }] });
              return;
            }
            i++;
            if (i < qs.length) return ask();
            UI.paper({
              title: 'The Concierge',
              html: '<div class="body" style="font-size:17px">“An early departure, then. Thank you for staying at the Inn Between. Please drive safely.”</div>',
              closable: false,
              stamp: { text: 'EARLY DEPARTURE', color: 'green' },
              options: [{ label: 'Sign here.', fn: () => { UI.closePaper(); G.win(n >= 4 ? 'full' : 'loop'); } }],
            });
          },
        })),
      });
    };
    intro();
  };

  // =================================================================
  // THE HALLWAY BETWEEN. One fixed, learnable corridor. Sometimes something is out of order.
  // =================================================================
  const OZ = 3000;              // the hallway lives far from the inn
  const HALF = 1.75;
  const ANOMALIES = [
    'door_number', 'door_ajar', 'dnd_card', 'sconce_green', 'pendant_swing', 'pendant_dark', 'painting_eyes',
    'clock_backward', 'guest_looks', 'guest_gone', 'vending_shoes', 'carpet_blue', 'longer', 'ceiling_low',
    'footprints', 'cart', 'knocking', 'sign_wrong', 'fern_dead',
  ];
  const H = S.hall = { active: false, group: null, rec: null };

  H.init = function () {
    W.zone('THE HALLWAY', 'corridor', -HALF, OZ - 46, HALF, OZ + 5, { area: 'transit' });
    H.mat = {
      blueCarpet: new THREE.MeshLambertMaterial({ map: Tex.spiralCarpet([0x0c1a3a, 0x1a3a7a, 0x2a2a4a, 0xb8c8d8, 0x2a4a8a, 0x101a2a, 0x1a2a5a]) }),
      green: new THREE.MeshBasicMaterial({ color: 0x5aff8a }),
      dark: new THREE.MeshBasicMaterial({ color: 0x050403 }),
      wet: new THREE.MeshBasicMaterial({ color: 0x0a0806, transparent: true, opacity: 0.55, depthWrite: false }),
      dead: new THREE.MeshLambertMaterial({ color: 0x5a3a1a }),
      snax: new THREE.MeshLambertMaterial({ map: Tex.vendingFront('SNAX', INN.VENDING.snax.items, INN.VENDING.snax.accent) }),
      shoes: new THREE.MeshLambertMaterial({ map: Tex.vendingFront('SHOES', INN.VENDING.shoes.items, INN.VENDING.shoes.accent) }),
      side: new THREE.MeshLambertMaterial({ color: 0x5a1a12 }),
      portrait: [portrait(false), portrait(true)],
      dnd: new THREE.MeshBasicMaterial({ map: Tex.dndCard(), side: THREE.DoubleSide }),
    };
    H.clockCanvas = Tex.canvas(128, 128);
    H.clockTex = new THREE.CanvasTexture(H.clockCanvas);
  };

  // the portrait of the founder: eyes closed. Unless they are not.
  function portrait(open) {
    const c = Tex.canvas(192, 256), g = c.getContext('2d');
    g.fillStyle = '#c9a24a'; g.fillRect(0, 0, 192, 256);
    g.fillStyle = '#0e2a1e'; g.fillRect(12, 12, 168, 232);
    g.fillStyle = '#5a1410'; g.beginPath(); g.moveTo(30, 244); g.quadraticCurveTo(96, 150, 162, 244); g.fill();
    g.fillStyle = '#c9a24a'; g.fillRect(90, 170, 12, 60);
    g.fillStyle = '#d8c0a8'; g.beginPath(); g.ellipse(96, 112, 34, 46, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2a1a10'; g.beginPath(); g.ellipse(96, 72, 36, 18, 0, Math.PI, 0); g.fill();
    if (open) {
      for (const x of [82, 110]) { g.fillStyle = '#f4efe2'; g.beginPath(); g.ellipse(x, 108, 7, 5, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#0a0a0a'; g.beginPath(); g.arc(x + 1, 108, 3, 0, Math.PI * 2); g.fill(); }
    } else {
      g.strokeStyle = '#3a2418'; g.lineWidth = 2;
      for (const x of [82, 110]) { g.beginPath(); g.arc(x, 106, 7, 0.2, Math.PI - 0.2); g.stroke(); }
    }
    g.strokeStyle = '#6a3a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(86, 134); g.lineTo(106, 134); g.stroke();
    g.fillStyle = '#c9a24a'; g.font = 'bold 12px Georgia'; g.textAlign = 'center'; g.fillText('THE FOUNDER', 96, 238);
    return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) });
  }

  H.start = function (realm) {
    H.realm = realm;
    H.required = R.stay.reached[realm] ? 2 : 5;
    H.count = 0;
    H.last = null;
    H.active = true;
    H.build(null, false);
    H.spawn();
    Audio.door(G.player.pos, false);
    if (!R.stay.hints.hall) {
      R.stay.hints.hall = true;
      setTimeout(() => G.say('The hallways between must be in order. If anything is out of order, turn back. If nothing is, continue.'), 1200);
    }
  };

  H.stop = function () {
    H.active = false;
    H.clear();
  };

  H.spawn = function () {
    const P = G.player;
    P.pos.set(0, 0, OZ - 1.3); P.yaw = 0; P.pitch = 0;
    G.vhs.pulse(0.5, 0.18); Audio.staticBurst(0.1);
  };

  H.clear = function () {
    if (!H.rec) return;
    const rec = H.rec;
    rec.group.removeFromParent();
    rec.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    rec.textures.forEach((t) => t.dispose());
    const cs = new Set(rec.colliders), fs = new Set(rec.fixtures);
    W.colliders = W.colliders.filter((c) => !cs.has(c));
    W.fixtures = W.fixtures.filter((f) => !fs.has(f));
    H.rec = null;
  };

  // judge the guest's choice when they leave through either end
  H.update = function (dt) {
    if (!H.active || !H.rec) return;
    const P = G.player, rec = H.rec;
    const back = P.pos.z > OZ + 0.9;
    const fwd = P.pos.z < OZ - rec.L - 0.9;
    rec.t += dt;
    H.animate(dt);
    if (!back && !fwd) return;
    if (rec.arrival) {
      if (fwd) { H.stop(); S.arrive(H.realm); return; }
      // turning back from the doors of the amenity: the hallway forgives this once
      H.spawn(); return;
    }
    const correct = fwd ? !rec.anomaly : !!rec.anomaly;
    if (correct) {
      H.count++;
      Audio.click(P.pos);
    } else {
      H.count = 0;
      G.vhs.pulse(1, 0.6); Audio.staticBurst(0.5);
      if (!R.stay.hints.hallWrong) { R.stay.hints.hallWrong = true; setTimeout(() => G.pa('Please return to the beginning of the hallway. Thank you.'), 900); }
    }
    let anom = null;
    // (the very first hallway of a trip is always in order, so it can be learned)
    if (H.count < H.required && rnd() < 0.58) { do { anom = pick(ANOMALIES); } while (anom === H.last); }
    H.last = anom || H.last;
    H.build(anom, H.count >= H.required);
    H.spawn();
  };

  H.build = function (anom, arrival) {
    H.clear();
    const M = W.M, b = new INN.Batch();
    const c0 = W.colliders.length, f0 = W.fixtures.length;
    const group = new THREE.Group(); W.root.add(group);
    const L = anom === 'longer' ? 36 : 30;
    const CH = anom === 'ceiling_low' ? 2.25 : 2.7;
    const rec = H.rec = { group, textures: [], anomaly: anom, arrival, L, t: 0, anim: {} };
    const z = (off) => OZ - off;   // offsets run north from the south archway
    const realm = REALMS.find((r) => r.id === H.realm);

    // shell: floor, ceiling, walls, and dark vestibules at both ends
    b.box(anom === 'carpet_blue' ? H.mat.blueCarpet : M.carpet, -HALF, HALF, -0.02, 0, z(L + 4), z(-4), 2.6);
    b.box(M.ceiling, -HALF, HALF, CH, CH + 0.02, z(L + 4), z(-4), 1.4);
    for (const side of [-1, 1]) {
      const x0 = side < 0 ? -HALF - 0.2 : HALF, x1 = side < 0 ? -HALF : HALF + 0.2;
      b.box(M.wood, x0, x1, 0, 1.05, z(L + 4), z(-4), 1.2);
      b.box(M.wallpaper, x0, x1, 1.05, CH, z(L + 4), z(-4), 1.2);
      W.collider(x0, z(L + 4), x1, z(-4));
    }
    b.box(M.woodDark, -HALF, HALF, 0, CH, z(-4) - 0.0, z(-4.2), 1);
    W.collider(-HALF, z(-4), HALF, z(-4.2));
    b.box(M.woodDark, -HALF, HALF, 0, CH, z(L + 4.2), z(L + 4), 1);
    W.collider(-HALF, z(L + 4.2), HALF, z(L + 4));
    // the archways: brass frames you pass through
    for (const off of [0, L]) {
      b.box(M.woodDark, -HALF, HALF, 2.25, CH, z(off) - 0.15, z(off) + 0.15, 1);
      b.box(M.brass, -HALF, -HALF + 0.12, 0, 2.25, z(off) - 0.15, z(off) + 0.15);
      b.box(M.brass, HALF - 0.12, HALF, 0, 2.25, z(off) - 0.15, z(off) + 0.15);
    }
    // the vestibules are dark: black curtains of shadow
    b.plane(H.mat.dark, 3.5, CH, 0, CH / 2, z(-3.9), 0, Math.PI, 0);
    if (!arrival) b.plane(H.mat.dark, 3.5, CH, 0, CH / 2, z(L + 3.9), 0, 0, 0);

    // doors: left 401 403 405 407 (409), right 402 404 406 408 (410)
    const doors = [[-1, 5, 401], [1, 8, 402], [-1, 11, 403], [1, 14, 404], [-1, 17, 405], [1, 20, 406], [-1, 23, 407], [1, 26, 408]];
    if (anom === 'longer') doors.push([-1, 31.5, 409], [1, 34, 410]);
    const doorAt = {};
    doors.forEach(([side, off, num]) => {
      const face = side * (HALF - 0.01);
      const zz = z(off);
      doorAt[num] = { side, off, x: face, z: zz };
      if (anom === 'door_ajar' && num === 405) {
        b.box(H.mat.dark, Math.min(face, face - side * 0.01), Math.max(face, face - side * 0.01), 0, 2.12, zz - 0.47, zz + 0.47);
        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.12, 0.94), M.door);
        const piv = new THREE.Group(); piv.position.set(face, 0, zz - 0.47); group.add(piv);
        panel.position.set(0, 1.06, 0.47); piv.add(panel); piv.rotation.y = -side * 0.5;
      } else {
        b.box(M.door, Math.min(face, face - side * 0.05), Math.max(face, face - side * 0.05), 0, 2.12, zz - 0.47, zz + 0.47, 1);
      }
      b.box(M.brass, Math.min(face, face - side * 0.1), Math.max(face, face - side * 0.1), 0.98, 1.04, zz + 0.28, zz + 0.34);
      b.box(M.brass, Math.min(face, face - side * 0.05), Math.max(face, face - side * 0.05), 2.12, 2.2, zz - 0.55, zz + 0.55);
      // sconce beside the door
      const green = anom === 'sconce_green' && num === 404;
      b.box(green ? H.mat.green : M.redShade, Math.min(face, face - side * 0.2), Math.max(face, face - side * 0.2), 1.65, 1.88, zz - 0.92, zz - 0.72);
      // number plate
      let shown = num;
      if (anom === 'door_number' && num === 406) shown = rec.anim.wrongNum = pick([460, 404, 416, 506]);
      const t = Tex.doorPlate(shown); rec.textures.push(t);
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.14), new THREE.MeshBasicMaterial({ map: t }));
      plate.position.set(face - side * 0.06, 1.62, zz); plate.rotation.y = -side * Math.PI / 2; group.add(plate);
      if (anom === 'dnd_card' && num === 403) {
        b.plane(H.mat.dnd, 0.16, 0.32, face - side * 0.12, 0.86, zz + 0.31, 0, -side * Math.PI / 2, 0.05);
      }
    });
    rec.doorAt = doorAt;

    // pendants: five (six if the hallway has grown), one may swing or go dark
    const pend = [4, 10, 16, 22, 28].concat(anom === 'longer' ? [34] : []);
    pend.forEach((off) => {
      const p = W.pendant(0, CH, z(off), group);
      const dark = anom === 'pendant_dark' && off === 16;
      if (dark) { p.glow.material = G.offMat; rec.anim.darkGlow = p.glow; }
      if (anom === 'pendant_swing' && off === 16) rec.anim.swing = p.glow.parent;
      if (!dark) W.fixtures.push({ mesh: p.glow, pos: new V3(0, CH - p.drop - 0.25, z(off)), flickerable: false, color: 0xffd2a0 });
    });

    // the founder's portrait, left wall between 403 and 405
    b.box(M.brass, -HALF, -HALF + 0.04, 1.0, 2.3, z(14) - 0.55, z(14) + 0.55);
    const port = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 1.26), H.mat.portrait[anom === 'painting_eyes' ? 1 : 0]);
    port.position.set(-HALF + 0.05, 1.65, z(14)); port.rotation.y = Math.PI / 2; group.add(port);

    // the clock, right wall between 402 and 404
    const clk = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: H.clockTex, transparent: true }));
    clk.position.set(HALF - 0.02, 1.9, z(11)); clk.rotation.y = -Math.PI / 2; group.add(clk);
    rec.anim.clockBack = anom === 'clock_backward';
    rec.anim.clockT = R.T;

    // a guest on a bench, reading, right side by 408
    b.box(M.leather, HALF - 0.6, HALF - 0.05, 0.2, 0.48, z(23) - 0.85, z(23) + 0.85, 1);
    b.box(M.leather, HALF - 0.18, HALF - 0.05, 0.48, 0.95, z(23) - 0.85, z(23) + 0.85, 1);
    W.collider(HALF - 0.65, z(23) - 0.9, HALF, z(23) + 0.9);
    if (anom !== 'guest_gone') {
      const gg = new INN.Guest({ type: 'armored', x: HALF - 0.35, z: z(23) + 0.2, ry: -Math.PI / 2, pose: 'sit', area: 'transit' });
      group.add(gg.g);
      const paper = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 0.03), W.M.cream);
      paper.position.set(0, 1.25, 0.42); paper.rotation.x = -0.25; gg.g.add(paper);
      rec.anim.guest = gg;
      rec.anim.paper = paper;
      rec.anim.looks = anom === 'guest_looks';
      if (rec.anim.looks) paper.position.y = 0.85;
    } else {
      b.box(W.M.cream, HALF - 0.5, HALF - 0.1, 0.48, 0.5, z(23) - 0.3, z(23) + 0.2);
    }

    // a snack machine, left side near the far end
    const vm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.9, 1.0), [H.mat.side, H.mat.side, H.mat.side, H.mat.side, H.mat.side, H.mat.side]);
    vm.position.set(-HALF + 0.37, 0.95, z(28.5)); group.add(vm);
    const front = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 1.88), anom === 'vending_shoes' ? H.mat.shoes : H.mat.snax);
    front.position.set(-HALF + 0.725, 0.95, z(28.5)); front.rotation.y = Math.PI / 2; group.add(front);
    W.collider(-HALF, z(28.5) - 0.5, -HALF + 0.75, z(28.5) + 0.5);

    // potted ferns flanking the start
    for (const side of [-1, 1]) {
      const fx = side * (HALF - 0.32), fz = z(2.4);
      b.mesh(M.brass, new THREE.CylinderGeometry(0.26, 0.2, 0.45, 10), fx, 0.22, fz);
      const dead = anom === 'fern_dead' && side > 0;
      for (let q = 0; q < 7; q++) {
        const g = new THREE.ConeGeometry(0.12, dead ? 0.7 : 1.0, 3); g.translate(0, dead ? 0.35 : 0.5, 0);
        b.mesh(dead ? H.mat.dead : (q % 2 ? M.leaf : M.leafDark), g, fx, 0.42, fz, dead ? 0.6 : 0, q * 0.9, dead ? 1.2 : 0.75);
      }
      W.collider(fx - 0.28, fz - 0.28, fx + 0.28, fz + 0.28);
    }

    // wet footprints toward 403
    if (anom === 'footprints') {
      for (let k = 0; k < 9; k++) {
        const t = k / 8;
        const fx = 0.4 - t * 1.8 + (k % 2 ? 0.14 : -0.14), fz = z(1.5 + t * 9.3);
        b.plane(H.mat.wet, 0.12, 0.27, fx, 0.012, fz, -Math.PI / 2, 0, 0.5 - t * 0.6);
      }
    }
    // a housekeeping cart, parked by 404
    if (anom === 'cart') {
      const cx = HALF - 0.45, cz = z(14) + 1.3;
      b.box(M.chrome, cx - 0.3, cx + 0.3, 0.1, 1.0, cz - 0.5, cz + 0.5);
      b.box(M.white, cx - 0.26, cx + 0.26, 1.0, 1.25, cz - 0.4, cz + 0.4);
      b.box(M.rustFab, cx - 0.26, cx + 0.26, 0.45, 0.7, cz - 0.45, cz + 0.45);
      W.collider(cx - 0.32, cz - 0.52, cx + 0.32, cz + 0.52);
      rec.anim.cartPos = new V3(cx, 0.6, cz);
    }
    if (anom === 'knocking') rec.anim.knockAt = new V3(doorAt[407].x, 1.4, doorAt[407].z);

    // signs: where you are going, and how far along you are
    const arrow = anom === 'sign_wrong' ? '◂ ' + realm.name : realm.name + ' ▸';
    const st = Tex.sign(arrow, { w: 512, h: 110, bg: '#0e2a1e', fg: '#e8d3a0', border: '#c9a24a' }); rec.textures.push(st);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.36), new THREE.MeshBasicMaterial({ map: st }));
    sg.position.set(0, 2.42, z(L) + 0.17); group.add(sg);
    const ct = Tex.sign(realm.name + '  ·  ' + Math.min(H.count, H.required) + ' OF ' + H.required + '\nIF ANYTHING IS OUT OF ORDER, TURN BACK', { w: 1400, h: 190, bg: '#120c08', fg: '#f4efe2', border: '#c9a24a', font: 'bold 46px "Futura","Century Gothic","Trebuchet MS",sans-serif' });
    rec.textures.push(ct);
    const cs = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.38), new THREE.MeshBasicMaterial({ map: ct }));
    cs.position.set(0, Math.min(2.3, CH - 0.3), z(3.6)); group.add(cs);
    const rod = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.4, 0.02), M.brass); rod.position.set(0, CH - 0.15, z(3.6)); group.add(rod);

    // the last hallway ends at the doors of the amenity
    if (arrival) {
      b.box(M.door, -1.2, -0.02, 0, 2.6, z(L + 3.95), z(L + 3.9), 1);
      b.box(M.door, 0.02, 1.2, 0, 2.6, z(L + 3.95), z(L + 3.9), 1);
      const at = Tex.neon(realm.name.replace('THE ', ''), '#4dff9a', { w: 512, h: 128, font: 'bold 86px "Futura","Trebuchet MS",sans-serif' }); rec.textures.push(at);
      const am = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.45), new THREE.MeshBasicMaterial({ map: at, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      am.position.set(0, 2.45, z(L + 3.85)); group.add(am);
      W.fixtures.push({ mesh: null, pos: new V3(0, 2.2, z(L + 3)), flickerable: false, color: 0x6aff9a, warm: true });
    }

    b.flush(group);
    rec.colliders = W.colliders.slice(c0);
    rec.fixtures = W.fixtures.slice(f0);
  };

  H.animate = function (dt) {
    const rec = H.rec, a = rec.anim, P = G.player;
    // the clock keeps the inn's time, or runs the wrong way
    if (a.clockBack) a.clockT -= dt * 2.4; else a.clockT = R.T;
    const tt = ((a.clockT % 24) + 24) % 24;
    Tex.drawClock(H.clockCanvas.getContext('2d'), 128, Math.floor(tt), (tt % 1) * 60);
    H.clockTex.needsUpdate = true;
    if (a.swing) a.swing.rotation.z = Math.sin(rec.t * 1.6) * 0.32;
    if (a.darkGlow) a.darkGlow.material = Math.random() < 0.03 ? W.M.fixture : G.offMat;
    if (a.guest) {
      a.guest.update(dt, rec.t);
      if (a.looks) {
        const g = a.guest.g;
        const want = Math.atan2(P.pos.x - g.position.x, P.pos.z - g.position.z) - g.rotation.y;
        a.guest.head.rotation.y = Math.max(-1.3, Math.min(1.3, Math.atan2(Math.sin(want), Math.cos(want))));
        a.guest.head.rotation.x = 0;
      } else if (a.guest.head) { a.guest.head.rotation.y = 0.05; a.guest.head.rotation.x = 0.35; }
    }
    a.sndT = (a.sndT || 0) - dt;
    if (a.sndT <= 0) {
      a.sndT = 2.5 + Math.random() * 2;
      if (a.knockAt && a.knockAt.distanceTo(P.pos) < 12) Audio.knock(a.knockAt);
      if (a.cartPos && a.cartPos.distanceTo(P.pos) < 14) Audio.squeak(a.cartPos);
    }
  };

  // ================================================================= arriving at an amenity
  S.arrive = function (realm) {
    R.stay.reached[realm] = true;
    if (realm === 'pool') S.pool.enter();
  };

  // =================================================================
  // THE POOL, run by THE LIFEGUARD.
  // House rules (never posted): stand still at the signal, never look at the water, walk.
  // Variant 0: the signal is the whistle. Variant 1 (after an incident): the signal is a raised arm;
  // the whistle now means nothing, and the announcements will tell you otherwise.
  // =================================================================
  const PL = S.pool = { state: 'idle', walkers: [] };
  const CHAIR = new V3(27, 0, -24.4);
  const BELL = new V3(19.6, 1.1, -3.3);
  const LOOP = [new V3(18.4, 0, -4.4), new V3(18.4, 0, -22.6), new V3(35.8, 0, -22.6), new V3(35.8, 0, -4.4)];

  PL.init = function () {
    const M = W.M;
    // the lifeguard chair: tall, white, facing the water
    const b = new INN.Batch();
    for (const [dx, dz] of [[-0.5, -0.4], [0.5, -0.4], [-0.5, 0.4], [0.5, 0.4]]) b.box(M.white, CHAIR.x + dx - 0.05, CHAIR.x + dx + 0.05, 0, 2.1, CHAIR.z + dz - 0.05, CHAIR.z + dz + 0.05);
    b.box(M.white, CHAIR.x - 0.6, CHAIR.x + 0.6, 2.0, 2.1, CHAIR.z - 0.5, CHAIR.z + 0.5);
    b.box(M.white, CHAIR.x - 0.6, CHAIR.x + 0.6, 2.1, 2.9, CHAIR.z - 0.5, CHAIR.z - 0.42);
    for (let k = 0; k < 5; k++) b.box(M.white, CHAIR.x - 0.4, CHAIR.x + 0.4, 0.35 + k * 0.38, 0.4 + k * 0.38, CHAIR.z + 0.55, CHAIR.z + 0.62);
    // the bell for the swim test, by the entrance
    b.box(M.brass, BELL.x - 0.04, BELL.x + 0.04, 0, 1.0, BELL.z - 0.04, BELL.z + 0.04);
    b.box(M.woodDark, BELL.x - 0.22, BELL.x + 0.22, 1.0, 1.05, BELL.z - 0.18, BELL.z + 0.18);
    b.flush(W.root);
    W.collider(CHAIR.x - 0.65, CHAIR.z - 0.55, CHAIR.x + 0.65, CHAIR.z + 0.65);
    W.collider(BELL.x - 0.2, BELL.z - 0.2, BELL.x + 0.2, BELL.z + 0.2);
    const bell = W.cyl(0.04, 0.11, 0.09, M.brass, BELL.x, 1.1, BELL.z);
    W.interact(bell, { type: 'poolbell' });
    bell.updateWorldMatrix(true, false); bell.userData.wp = new V3().setFromMatrixPosition(bell.matrixWorld);
    W.signMesh(Tex.sign('SWIM TEST\nRING FOR THE LIFEGUARD', { w: 512, h: 160 }), 0.9, 0.28, BELL.x, 1.28, BELL.z + 0.2, 0);
    const chairSign = W.signMesh(Tex.sign('LIFEGUARD ON DUTY', { w: 512, h: 96, bg: '#5a1410', fg: '#f4efe2', border: '#f4efe2' }), 1.2, 0.24, CHAIR.x, 2.6, CHAIR.z - 0.4, 0);
    void chairSign;

    // the Lifeguard: tall, red, a whistle on a cord, one arm that can rise
    PL.guard = makeLifeguard();
    PL.guard.g.position.set(CHAIR.x, 2.1, CHAIR.z - 0.1);
    PL.guard.g.visible = false;
    W.add(PL.guard.g);

    // guests who know the rules: they walk the deck, backs to the water
    const types = ['almost', 'armored', 'tall'];
    for (let i = 0; i < 3; i++) {
      const gg = new INN.Guest({ type: types[i], x: 18.4, z: -10, ry: 0, pose: 'stand', area: 'pool' });
      W.add(gg.g);
      PL.walkers.push({ g: gg, s: i * 18 + rnd() * 4, speed: 0.75 + rnd() * 0.2 });
    }
    // a ripple ring and a reflection to tempt you
    PL.ripple = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.32, 32), new THREE.MeshBasicMaterial({ color: 0xbff8f0, transparent: true, opacity: 0, depthWrite: false }));
    PL.ripple.rotation.x = -Math.PI / 2; W.add(PL.ripple);
    PL.reflect = makeReflectionFigure(); W.add(PL.reflect);
    PL.reset(false);
  };

  function makeLifeguard() {
    const g = new THREE.Group();
    const red = new THREE.MeshLambertMaterial({ color: 0x9a1a12 }), skin = new THREE.MeshLambertMaterial({ color: 0xc8b0a4 });
    const white = new THREE.MeshLambertMaterial({ color: 0xf0ece0 }), dark = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
    const box = (w, h, d, m, x, y, z, p) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); (p || g).add(o); return o; };
    for (const s of [-1, 1]) { box(0.13, 0.12, 0.7, red, s * 0.13, 0.12, 0.3); box(0.12, 1.0, 0.12, skin, s * 0.13, -0.32, 0.62); }
    box(0.5, 1.15, 0.3, red, 0, 0.75, 0);
    box(0.52, 0.06, 0.32, white, 0, 1.0, 0);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.4, 8), skin); neck.position.y = 1.5; g.add(neck);
    const head = new THREE.Group(); head.position.set(0, 1.85, 0); g.add(head);
    const hd = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), skin); hd.scale.set(0.9, 1.35, 1); head.add(hd);
    box(0.36, 0.05, 0.3, white, 0, 0.14, 0.08, head);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), dark); e.position.set(s * 0.06, 0.03, 0.14); head.add(e); }
    const whistle = box(0.05, 0.05, 0.08, new THREE.MeshPhongMaterial({ color: 0xc9a24a }), 0, 1.05, 0.17);
    void whistle;
    box(0.13, 0.7, 0.14, red, -0.33, 0.72, 0);
    const armPivot = new THREE.Group(); armPivot.position.set(0.33, 1.2, 0); g.add(armPivot);
    box(0.13, 0.75, 0.14, red, 0, -0.35, 0, armPivot);
    box(0.1, 0.12, 0.1, skin, 0, -0.78, 0, armPivot);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(1, 2.5, 1), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 1; g.add(hit);
    return { g, head, arm: armPivot, hit };
  }

  function makeReflectionFigure() {
    const c = Tex.canvas(128, 256), g = c.getContext('2d');
    g.fillStyle = 'rgba(6,14,16,0.95)';
    g.beginPath(); g.ellipse(64, 50, 26, 32, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(14, 256); g.quadraticCurveTo(10, 110, 64, 92); g.quadraticCurveTo(118, 110, 114, 256); g.fill();
    // one arm raised, waving
    g.beginPath(); g.moveTo(100, 120); g.lineTo(124, 40); g.lineTo(112, 36); g.lineTo(90, 116); g.fill();
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, opacity: 0, depthWrite: false }));
    m.visible = false;
    return m;
  }

  PL.reset = function (afterIncident) {
    if (afterIncident) R.stay.variant.pool = (R.stay.variant.pool + 1) % 2;
    PL.state = 'idle';
    PL.signal = false;
    PL.demoT = 6;
    PL.signalT = 0;
    PL.liesSaid = 0;
    PL.lieT = 0;
    PL.guard.arm.rotation.x = 0;
    PL.walkers.forEach((w) => { w.g.attentive = false; });
    PL.guard.arm.rotation.z = 0;
    // in the revised rules, the Lifeguard is already in the chair, saying nothing
    PL.guard.g.visible = R.stay.variant.pool === 1;
    setPoolLights(false);
  };

  PL.enter = function () {
    S.teleport(17, -4.6, 0);
    const v = R.stay.variant.pool;
    PL.lieT = 2.5;
    if (!R.stay.hints.poolIntro) {
      R.stay.hints.poolIntro = true;
      setTimeout(() => G.say('This is the pool. The Lifeguard manages it. Watch the other guests before you ring.'), 900);
    }
    void v;
  };

  // the swim test begins
  PL.ringBell = function () {
    if (PL.state !== 'idle') return;
    if (R.stay.stamps.pool) { UI.notice('The bell does not ring. You have already been approved.'); return; }
    Audio.deskBell(BELL);
    PL.state = 'boss';
    PL.lap = 1;
    PL.target = CHAIR.clone().add(new V3(0, 0, 1.6));
    PL.signal = false;
    PL.phaseT = 2.4;
    PL.lookT = 0;
    PL.decoyT = 3 + rnd() * 3;
    PL.bossLie = false;
    PL.guard.g.visible = true;
    G.vhs.pulse(0.5, 0.2);
    setTimeout(() => G.say('Swim test. To the chair, and back.', { tag: '◉ THE LIFEGUARD' }), 700);
  };

  function setPoolLights(red) {
    (W.poolLights || []).forEach((l) => l.material.color.setHex(red ? 0xff3a2a : 0x9ff0f0));
  }

  function lookingAtWater() {
    const P = G.player, B = W.poolBasin;
    if (!R.zone || R.zone.area !== 'pool') return null;
    const dir = new V3(0, 0, -1).applyQuaternion(G.camera.quaternion);
    if (dir.y > -0.3) return null;
    const t = (EYE + 0.35) / -dir.y;
    const hx = P.pos.x + dir.x * t, hz = P.pos.z + dir.z * t;
    if (t < 7 && hx > B.x0 + 0.2 && hx < B.x1 - 0.2 && hz > B.z0 + 0.2 && hz < B.z1 - 0.2) return new V3(hx, -0.34, hz);
    return null;
  }

  function signalOn(on) {
    const v = R.stay.variant.pool;
    PL.signal = on;
    if (on) {
      if (v === 0) { Audio.whistle(new V3(CHAIR.x, 2.8, CHAIR.z)); setPoolLights(true); }
      PL.raise = true;
    } else {
      setPoolLights(false);
      PL.raise = false;
    }
  }

  PL.update = function (dt) {
    if (!R.zone || R.zone.area !== 'pool' || G.state !== 'play') { if (PL.state === 'boss' && R.zone && R.zone.area !== 'pool') PL.state = 'idle'; return; }
    const P = G.player, v = R.stay.variant.pool;

    // the announcements, which are provided for your comfort
    if (PL.lieT > 0) {
      PL.lieT -= dt;
      if (PL.lieT <= 0 && PL.liesSaid < 2 && PL.state !== 'boss') {
        const lies = v === 0
          ? ['Welcome to the pool. Guests may look at the water as long as they like.', 'When the whistle blows, please keep moving. It is good for circulation.']
          : ['Welcome back to the pool. As always, guests stand still at the whistle.', 'Guests may look at the water as long as they like.'];
        G.pa(lies[PL.liesSaid]);
        PL.liesSaid++;
        PL.lieT = PL.liesSaid < 2 ? 22 : 0;
      }
    }

    // before the test: the guests demonstrate, if you are watching
    if (PL.state === 'idle') {
      PL.demoT -= dt;
      if (!PL.signal && PL.demoT <= 0) { signalOn(true); PL.demoT = 2.6; }
      else if (PL.signal && PL.demoT <= 0) { signalOn(false); PL.demoT = 7 + rnd() * 5; }
      // in the revised rules, the whistle sometimes blows for no reason, and nobody minds
      if (v === 1) { PL.decoyT = (PL.decoyT || 6) - dt; if (PL.decoyT <= 0 && !PL.signal) { Audio.whistle(new V3(CHAIR.x, 2.8, CHAIR.z)); PL.decoyT = 6 + rnd() * 6; } }
      // looking at the water: the reflection waves back, and the guests notice
      const hit = lookingAtWater();
      PL.lookT = hit ? (PL.lookT || 0) + dt : 0;
      showReflection(hit, PL.lookT);
      if (PL.lookT > 2.5 && !PL.warned) {
        PL.warned = true;
        PL.walkers.forEach((w) => { w.g.attentive = true; w.g.faceInstant(P.pos.x, P.pos.z); });
        UI.notice('Every guest on the deck has turned to look at you.', 4);
        setTimeout(() => { PL.warned = false; PL.walkers.forEach((w) => { w.g.attentive = false; }); }, 5000);
      }
      return;
    }

    // the swim test
    if (PL.state === 'boss') {
      PL.phaseT -= dt;
      const near = P.pos.distanceTo(PL.target) < (PL.lap === 1 ? 2.2 : 1.8);
      if (!PL.signal && PL.phaseT <= 0) {
        signalOn(true);
        PL.phaseT = 1.5 + rnd() * 1.4;
        PL.grace = 0.45;
        PL.anchor = null;
        // temptation: something moves in the water nearby
        const B = W.poolBasin;
        const rx = Math.max(B.x0 + 1, Math.min(B.x1 - 1, P.pos.x + (rnd() - 0.5) * 3)), rz = Math.max(B.z0 + 1, Math.min(B.z1 - 1, P.pos.z + (rnd() - 0.5) * 3));
        PL.ripple.position.set(rx, -0.33, rz); PL.rippleT = 0;
        if (rnd() < 0.7) Audio.splash(new V3(rx, 0, rz));
        if (!PL.bossLie && PL.lap === 2) { PL.bossLie = true; G.pa(v === 0 ? 'Guests may continue walking during the whistle.' : 'Please stand still at the whistle.'); }
      } else if (PL.signal && PL.phaseT <= 0) {
        signalOn(false);
        const left = P.pos.distanceTo(PL.target);
        PL.phaseT = Math.max(1.4, Math.min(4.2, 1.2 + rnd() * 2.6 + left * 0.03)) * (PL.lap === 2 ? 0.8 : 1);
      }
      // decoy whistles in the revised rules
      if (v === 1) { PL.decoyT -= dt; if (PL.decoyT <= 0 && !PL.signal) { Audio.whistle(new V3(CHAIR.x, 2.8, CHAIR.z)); PL.decoyT = 2.5 + rnd() * 3.5; } }
      // rule: stand still at the signal
      if (PL.signal) {
        if (PL.grace > 0) { PL.grace -= dt; if (PL.grace <= 0) PL.anchor = P.pos.clone(); }
        else if (PL.anchor && P.pos.distanceTo(PL.anchor) > 0.14) return PL.caught('You moved while the Lifeguard was watching.');
      }
      // rule: walk
      if (P.running && P.moving) return PL.caught('You ran on the pool deck.');
      // rule: never look at the water
      const hit = lookingAtWater();
      PL.lookT = hit ? PL.lookT + dt : 0;
      showReflection(hit, PL.lookT * 2);
      if (PL.lookT > 1.1) return PL.caught('You looked at the water.');
      // laps
      if (near) {
        if (PL.lap === 1) {
          PL.lap = 2; PL.target = BELL.clone().setY(0);
          G.say('Back.', { tag: '◉ THE LIFEGUARD' });
        } else {
          PL.win();
        }
      }
    }
  };

  function showReflection(hit, t) {
    const ref = PL.reflect, P = G.player;
    if (!hit) { ref.visible = false; return; }
    ref.visible = true;
    ref.position.copy(hit);
    ref.rotation.set(-Math.PI / 2, 0, Math.atan2(hit.x - P.pos.x, hit.z - P.pos.z) + Math.PI);
    ref.material.opacity = Math.min(0.8, t * 0.5);
  }

  PL.caught = function (why) {
    PL.state = 'caught';
    Audio.whistle(new V3(CHAIR.x, 2.8, CHAIR.z), true);
    setPoolLights(true);
    PL.walkers.forEach((w) => { w.g.attentive = true; w.g.faceInstant(G.player.pos.x, G.player.pos.z); });
    setTimeout(() => S.strike(why), 1300);
  };

  PL.win = function () {
    PL.state = 'done';
    signalOn(false);
    R.stay.stamps.pool = true;
    R.stamps.push({ text: 'POOL', color: 'green' });
    G.say('Approved.', { tag: '◉ THE LIFEGUARD' });
    setTimeout(() => {
      G.openPaper({
        title: 'Guest Folio · The Pool',
        html: '<div class="body" style="font-size:16px">The Lifeguard leans down from the chair and presses a wet stamp into your folio. It does not smudge.</div>',
        stamp: { text: 'LIFEGUARD APPROVED', color: 'green' },
        options: [{ label: 'Close the folio.', fn: () => UI.closePaper() }],
      });
      setTimeout(() => G.say('Your folio carries a stamp. The Concierge will see you at the front desk. The pool gate will take you there.'), 1500);
    }, 1400);
    PL.state = 'idle';
    PL.demoT = 999;
  };

  // after the scene animates: walkers circle the deck, freeze at the signal, never look at the water
  PL.late = function (dt) {
    if (!PL.walkers.length) return;
    const v = R.stay.variant.pool;
    const per = 2 * ((LOOP[2].x - LOOP[0].x) + (LOOP[0].z - LOOP[1].z));
    const frozen = PL.signal || PL.state === 'caught';
    PL.walkers.forEach((w) => {
      if (!frozen) w.s = (w.s + dt * w.speed) % per;
      const p = loopPos(w.s), ahead = loopPos((w.s + 0.5) % per);
      const g = w.g.g;
      g.position.set(p.x, 0, p.z);
      if (!w.g.attentive) {
        g.rotation.y = Math.atan2(ahead.x - p.x, ahead.z - p.z);
        // heads turned away from the water
        const cx = 27, cz = -13.5;
        const out = Math.atan2(p.x - cx, p.z - cz) - g.rotation.y;
        if (w.g.head) { w.g.head.rotation.y = Math.max(-1.1, Math.min(1.1, Math.atan2(Math.sin(out), Math.cos(out)))); w.g.head.rotation.x = 0; }
      }
      const bob = frozen ? 0 : Math.abs(Math.sin(w.s * 3.2)) * 0.03;
      g.position.y = bob;
    });
    // the Lifeguard's arm and gaze
    const gd = PL.guard;
    if (gd.g.visible) {
      const target = PL.raise ? -2.6 : 0;
      gd.arm.rotation.x += (target - gd.arm.rotation.x) * Math.min(1, dt * 10);
      const P = G.player;
      const want = Math.atan2(P.pos.x - gd.g.position.x, P.pos.z - gd.g.position.z);
      const k = PL.signal || PL.state === 'boss' ? 1 : 0.2;
      gd.head.rotation.y += (Math.max(-1.2, Math.min(1.2, want)) - gd.head.rotation.y) * Math.min(1, dt * 3 * k);
    }
    // ripple fades out
    if (PL.rippleT != null) {
      PL.rippleT += dt;
      const s = 1 + PL.rippleT * 3;
      PL.ripple.scale.set(s, s, s);
      PL.ripple.material.opacity = Math.max(0, 0.6 - PL.rippleT * 0.35);
    }
    void v;
  };

  function loopPos(s) {
    const L0 = LOOP;
    for (let i = 0; i < 4; i++) {
      const a = L0[i], b = L0[(i + 1) % 4];
      const len = a.distanceTo(b);
      if (s <= len) return a.clone().lerp(b, s / len);
      s -= len;
    }
    return L0[0].clone();
  }
})(window.INN);
