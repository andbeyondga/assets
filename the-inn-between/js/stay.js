// THE INN BETWEEN — the stay. An open inn, its amenities, and the Managers who run them.
//
//   The whole inn is open. Walk anywhere: your room and the Do Not Disturb doors to the west,
//   the Pool and the Arcade to the east, the Dining Room to the south. North of the front desk,
//   the Hallway Between leads to the Garden Court and the endless Wings beyond; it lets you through
//   only when you can tell whether it is in order.
//   Each amenity has house rules nobody posts. The guests know them. Watch the guests.
//   Each Manager tests you. Win: a stamp. Lose: technical difficulties, NOTED.
//   Four stamps and the Concierge will see you. Fewer, and an early departure can be arranged.
window.INN = window.INN || {};
(function (INN) {
  'use strict';
  const V3 = THREE.Vector3;
  const UI = INN.UI, Audio = INN.Audio, Tex = INN.Tex;
  const EYE = 1.6;

  const S = INN.Stay = { act: {} };
  const REALMS = [
    { id: 'pool', name: 'THE POOL', manager: 'THE LIFEGUARD', entry: [17, -4.6, 0] },
    { id: 'arcade', name: 'THE ARCADE', manager: 'ATTRACT MODE', entry: [44, -3.4, 0] },
    { id: 'dining', name: 'THE DINING ROOM', manager: 'THE HEAD CHEF', entry: [0, 17.6, Math.PI] },
    { id: 'garden', name: 'THE GARDEN COURT', manager: 'THE GROUNDSKEEPER', entry: [-9, -46.5, 0] },
  ];
  S.REALMS = REALMS;

  let G, W, R;
  const rnd = Math.random;
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const shuffle = (a) => { for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(rnd() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; };

  // clues printed on arcade tickets: what the Hallway Between looks like when it is in order
  const HINTS = [
    'THE FOUNDER KEEPS HIS EYES CLOSED.',
    'THE GUEST ON THE BENCH IS ALWAYS READING.',
    'EVERY SCONCE IN THE HALLWAY BETWEEN IS RED.',
    'THE HALLWAY CLOCK KEEPS THE INN’S TIME.',
    'NOBODY KNOCKS FROM INSIDE 407.',
    'EIGHT DOORS: 401 TO 408. NO MORE, NO LESS.',
    'THE SNACK MACHINE SELLS SNACKS.',
    'THE PENDANTS HANG STILL. ALL FIVE ARE LIT.',
    'HOUSEKEEPING DOES NOT LEAVE ITS CART IN THE HALLWAY BETWEEN.',
    'THE CARPET IS RED. IT HAS ALWAYS BEEN RED.',
    'THE FERNS ARE GREEN.',
    'NO DOOR IN THE HALLWAY IS LEFT OPEN.',
    'NOBODY HAS ASKED NOT TO BE DISTURBED IN THE HALLWAY BETWEEN.',
    'THE FLOOR IS DRY.',
    'THE SIGN POINTS THE WAY YOU ARE GOING.',
  ];

  // ================================================================= setup
  S.setup = function (game) {
    G = game; W = G.world; R = G.run;
    R.stay = { stamps: {}, noted: 0, variant: { pool: 0, arcade: 0, dining: 0, garden: 0 }, hints: {}, visited: {}, notes: [], tickets: 0 };

    // your room, prepared in advance
    const keyRooms = Object.keys(INN.ROOMS).map(Number).filter((n) => INN.ROOMS[n].kind === 'key' && n <= 116);
    const n = pick(keyRooms);
    const rm = W.rooms[n];
    rm.hasKey = true; rm.key.visible = false;
    if (rm.luggage) rm.luggage.visible = true;
    R.claimed = n; R.holdingKey = true; R.claimT = R.T; R.hkNext = 1e9;
    R.hints.luggage = true;
    R.stamps.push({ text: 'ROOM ' + n, color: 'blue' });

    S.hall.init();
    S.pool.init();
    S.arcade.init();
    S.dining.init();
    S.garden.init();
  };

  // ================================================================= per-frame
  S.update = function (dt) {
    if (!R) return;
    S.hall.update(dt);
    S.pool.update(dt);
    S.arcade.update(dt);
    S.dining.update(dt);
    S.garden.update(dt);
  };
  S.late = function (dt) { if (!R) return; S.pool.late(dt); S.arcade.late(dt); S.dining.late(dt); S.garden.late(dt); };

  // entering an area: remember it for the elevator, and let its Manager react
  S.onZone = function (z) {
    if (!R || !R.stay || !z) return;
    const a = z.area;
    if (REALMS.some((r) => r.id === a) && !R.stay.visited[a]) {
      R.stay.visited[a] = true;
      const r = REALMS.find((x) => x.id === a);
      if (!R.stay.hints['first' + a]) {
        R.stay.hints['first' + a] = true;
        setTimeout(() => G.say(r.name.charAt(0) + r.name.slice(1).toLowerCase() + ' is managed by ' + r.manager.toLowerCase() + '. Watch the other guests before you ring.'), 1200);
      }
    }
    if (a === 'pool') S.pool.onEnter();
    if (a === 'arcade') S.arcade.onEnter();
    if (a === 'dining') S.dining.onEnter();
    if (a === 'garden') S.garden.onEnter();
  };

  S.stampCount = () => Object.keys(R.stay.stamps).length;

  S.award = function (id, text) {
    R.stay.stamps[id] = true;
    R.stamps.push({ text: REALMS.find((r) => r.id === id).name.replace('THE ', ''), color: 'green' });
    const r = REALMS.find((x) => x.id === id);
    G.say('Approved.', { tag: '◉ ' + r.manager });
    setTimeout(() => {
      G.openPaper({
        title: 'Guest Folio · ' + r.name.replace('THE ', '').toLowerCase().replace(/^./, (c) => c.toUpperCase()),
        html: '<div class="body" style="font-size:16px">' + text + '</div>' + S.folioTop(),
        stamp: { text: r.manager.replace('THE ', '') + ' APPROVED', color: 'green' },
        options: [{ label: 'Close the folio.', fn: () => UI.closePaper() }],
      });
      const n = S.stampCount();
      setTimeout(() => G.say(n >= 4 ? 'Your folio is complete. The Concierge will see you at the front desk.' : n === 1 ? 'Your folio carries a stamp. The Concierge can arrange an early departure at the front desk, or you may continue your stay.' : 'Your folio carries ' + n + ' stamps. Four is customary.'), 1500);
    }, 1400);
  };

  // ================================================================= interactions
  // handlers return false to let the inn's ordinary behaviour run instead
  S.label = function (it) {
    switch (it.type) {
      case 'elevator': return 'CALL ELEVATOR';
      case 'poolbell': return S.pool.state === 'idle' ? (R.stay.stamps.pool ? 'THE LIFEGUARD HAS NOTHING FURTHER FOR YOU' : 'RING FOR THE LIFEGUARD') : '';
      case 'arcadebell': return S.arcade.state === 'idle' ? (R.stay.stamps.arcade ? 'ATTRACT MODE HAS NOTHING FURTHER FOR YOU' : 'RING FOR ATTRACT MODE') : '';
      case 'chefbell': return S.dining.state === 'idle' ? (R.stay.stamps.dining ? 'THE HEAD CHEF HAS NOTHING FURTHER FOR YOU' : 'RING FOR SERVICE') : '';
      case 'gkbell': return S.garden.state === 'idle' ? (R.stay.stamps.garden ? 'THE GROUNDSKEEPER HAS NOTHING FURTHER FOR YOU' : 'RING FOR THE GROUNDSKEEPER') : '';
      case 'chefitem': return 'TAKE ' + it.food.toUpperCase();
      case 'guest': return S.dining.state === 'boss' && it.guest.area === 'dining' ? (R.stay.carry ? 'SERVE THE ' + R.stay.carry.toUpperCase() : 'NOTHING TO SERVE') : null;
      case 'arcade': return S.arcade.state === 'boss' ? 'PLAY THIS ONE' : null;
      case 'plate': return 'PLATES';
      case 'deskbell': case 'clerk': return S.stampCount() ? 'SPEAK WITH THE CONCIERGE' : 'SPEAK WITH THE DESK';
      default: return null;
    }
  };

  // the elevator: fast travel to amenities you have already found on foot
  S.act.elevator = function () {
    Audio.click(new V3(10.3, 1.2, -11.8));
    const known = REALMS.filter((r) => R.stay.visited[r.id]);
    G.openPaper({
      title: 'Elevator',
      speaker: known.length ? 'The call button lights. The card beside it lists only the floors you have been to.' : 'The call button lights, then goes out. A card reads: THE ELEVATOR GOES ONLY WHERE THE GUEST HAS ALREADY BEEN.',
      options: known.map((r) => ({
        label: r.name + (R.stay.stamps[r.id] ? '  (stamped)' : ''),
        fn: () => { UI.closePaper(); Audio.door(G.player.pos, false); S.teleport(r.entry[0], r.entry[1], r.entry[2]); },
      })).concat([{ label: 'Never mind.', fn: () => UI.closePaper() }]),
    });
  };

  S.act.poolbell = () => S.pool.ringBell();
  S.act.arcadebell = () => S.arcade.ringBell();
  S.act.chefbell = () => S.dining.ringBell();
  S.act.gkbell = () => S.garden.ringBell();
  S.act.chefitem = (it) => S.dining.take(it.food);
  S.act.guest = (it) => (S.dining.state === 'boss' && it.guest.area === 'dining' ? S.dining.serve(it.guest) : false);
  S.act.arcade = (it) => S.arcade.play(it.idx);
  S.act.plate = () => { UI.notice('The plates are stacked and clean. The Head Chef serves the guests here, not you.'); };
  S.act.gate = () => { UI.notice('The gate is chained. Beyond it, the dark smells of chlorine and highway.'); };
  S.act.deskbell = () => (S.stampCount() ? (S.concierge(), true) : false);
  S.act.clerk = S.act.deskbell;

  S.teleport = function (x, z, yaw) {
    G.player.pos.set(x, 0, z); G.player.yaw = yaw; G.player.pitch = 0;
    G.vhs.pulse(0.7, 0.35); Audio.staticBurst(0.25);
  };

  // ================================================================= losing: technical difficulties
  S.strike = function (why, realm) {
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
    R.stay.carry = null;
    R.stamps.push({ text: 'NOTED', color: 'red' });
    const last = R.stay.noted >= 3;
    setTimeout(() => {
      if (last) { G.lose('noted'); return; }
      UI.card('standby', { line1: 'WE ARE EXPERIENCING TECHNICAL DIFFICULTIES', line2: 'PLEASE STAND BY' });
      setTimeout(() => G.say('The guest has been returned to their room.'), 600);
      setTimeout(() => {
        // the house rules of the amenity where it happened are revised
        if (realm && R.stay.variant[realm] != null) R.stay.variant[realm] = (R.stay.variant[realm] + 1) % 2;
        S.pool.reset(); S.arcade.reset(); S.dining.reset(); S.garden.reset();
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
      (R.stay.stamps[r.id] ? '<div class="stamp green slot-stamp">' + r.manager.replace('THE ', '') + '<br>APPROVED</div>' : '<div class="slot-empty">' + r.manager + '</div>') + '</div>').join('');
    let noted = '';
    for (let i = 0; i < 3; i++) noted += '<span class="noted' + (i < R.stay.noted ? ' on' : '') + '">' + (i < R.stay.noted ? 'NOTED' : '') + '</span>';
    return '<div class="small" style="margin:0 0 6px">STAMPS. FOUR, AND THE CONCIERGE WILL SEE YOU.</div><div class="slots">' + slots + '</div>' +
      '<div class="noted-row"><span class="small" style="margin:0">CONDUCT</span>' + noted + '</div>';
  };
  S.notesHTML = function () {
    const n = R.stay.notes;
    return '<div style="margin-top:10px"><b>NOTES</b><br>' + (n.length ? n.map((x) => '• ' + UI.esc(x)).join('<br>') : 'Free arcade cabinets print tickets. Some guests keep them.') + '</div>';
  };

  // ================================================================= checkout with the Concierge
  const GUEST_NAMES = { armored: 'the guest in armor', tall: 'the very tall guest', almost: 'the guest with the long neck', tentacle: 'the guest with the tentacles' };
  function realmQuestions() {
    const qs = [];
    const v = R.stay.variant;
    if (R.stay.stamps.pool) qs.push(v.pool === 0
      ? { q: 'At the pool, when the whistle blows, what does a guest do?', a: ['Stands perfectly still.', 'Keeps walking. It is good for circulation.', 'Leaves the deck.'], c: 0 }
      : { q: 'At the pool, how does a guest know to stand still?', a: ['When the Lifeguard raises an arm.', 'When the whistle blows.', 'When the lights change.'], c: 0 });
    if (R.stay.stamps.arcade) qs.push({ q: 'A cabinet in the arcade is playing itself. What does a guest do?', a: ['Leaves it be.', 'Takes a turn.', 'Unplugs it.'], c: 0 });
    if (R.stay.stamps.dining) {
      const t = pick(Object.keys(GUEST_NAMES));
      const food = S.dining.foodFor(t);
      const others = ['grapefruit', 'coffee', 'eggs', 'toast'].filter((f) => f !== food).slice(0, 2);
      qs.push({ q: 'What does ' + GUEST_NAMES[t] + ' take at breakfast?', a: [cap(food) + '.', cap(others[0]) + '.', cap(others[1]) + '.'], c: 0 });
    }
    if (R.stay.stamps.garden) {
      const safe = v.garden === 0 ? 'black' : 'red', bad = v.garden === 0 ? 'red' : 'black';
      qs.push({ q: 'Where does a guest step in the Garden Court?', a: ['Only on the ' + safe + ' squares.', 'Only on the ' + bad + ' squares.', 'Anywhere along the paths.'], c: 0 });
    }
    if (!qs.length) qs.push({ q: 'In the Hallway Between, if anything is out of order, what does a guest do?', a: ['Turns back.', 'Continues.', 'Reports it to the desk.'], c: 0 });
    return qs;
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  S.concierge = function () {
    const n = S.stampCount();
    const qs = realmQuestions();
    G.state = 'checkout';
    G.releaseLock();
    UI.prompt('');
    let i = 0;
    const back = () => { UI.closePaper(); G.state = 'play'; G.requestLock(); };
    const intro = () => UI.paper({
      title: 'The Concierge',
      speaker: 'The clerk is gone. In their place, someone in the same uniform, taller, reading your folio upside down without turning it.',
      html: '<div class="body" style="font-size:17px">“' + n + ' stamp' + (n === 1 ? '' : 's') + '. ' + (n >= 4 ? 'Everything appears to be in order. A few questions, and you may go.' : 'Four is customary. An early departure can be arranged, as a courtesy. A few questions first.') + '”</div>',
      closable: false,
      options: [{ label: n >= 4 ? 'I am ready to check out.' : 'I would like an early departure.', fn: () => ask() }, { label: 'I will stay a little longer.', fn: back }],
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
              html: '<div class="body" style="font-size:17px">“' + (n >= 4 ? 'Everything is in order. Thank you for staying at the Inn Between. Please drive safely.' : 'An early departure, then. Thank you for staying at the Inn Between. Please drive safely.') + '”</div>',
              closable: false,
              stamp: { text: n >= 4 ? 'CHECKED OUT' : 'EARLY DEPARTURE', color: 'green' },
              options: [{ label: 'Sign here.', fn: () => { UI.closePaper(); G.win(n >= 4 ? 'full' : 'loop'); } }],
            });
          },
        })),
      });
    };
    intro();
  };

  // =================================================================
  // THE HALLWAY BETWEEN. The long hall from the front desk to the Garden Court.
  // One fixed, learnable corridor. Sometimes something is out of order.
  // Walk its length when it is in order, or back out when it is not. Five right calls in a row
  // and it lets you through to the Garden Court, after which it stays open.
  // =================================================================
  const HX = -9;                // centre line of the hall
  const OZ = -12.3;             // south archway, just inside the front desk's north wall
  const END = -43.9;            // where the hall meets the Garden Court
  const HALF = 1.75;
  const ANOMALIES = [
    'door_number', 'door_ajar', 'dnd_card', 'sconce_green', 'pendant_swing', 'pendant_dark', 'painting_eyes',
    'clock_backward', 'guest_looks', 'guest_gone', 'vending_shoes', 'carpet_blue', 'longer', 'ceiling_low',
    'footprints', 'cart', 'knocking', 'sign_wrong', 'fern_dead',
  ];
  const H = S.hall = { active: false, group: null, rec: null };

  H.init = function () {
    W.zone('THE HALLWAY BETWEEN', 'corridor', HX - HALF, -44, HX + HALF, -12, { area: 'transit' });
    H.required = 5; H.count = 0; H.solved = false; H.engaged = false; H.last = null;
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

  H.respawn = function () {
    // seamless: same place in the new hall, a few steps in from the start
    const P = G.player;
    P.pos.z = OZ - 1.2;
    P.pos.x = Math.max(HX - HALF + 0.4, Math.min(HX + HALF - 0.4, P.pos.x));
    G.vhs.pulse(0.45, 0.15); Audio.staticBurst(0.08);
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
    if (!H.rec) H.build(null, false);
    const P = G.player, rec = H.rec;
    rec.t += dt;
    const inHall = P.pos.x > HX - HALF - 0.2 && P.pos.x < HX + HALF + 0.2;
    if (inHall) H.animate(dt);
    if (H.solved || rec.arrival) {
      if (rec.arrival && P.pos.z < END - 0.5) { H.solved = true; }
      return;
    }
    if (!inHall) { H.engaged = false; return; }
    if (P.pos.z < OZ - 0.6 && P.pos.z > OZ - rec.L + 0.6) {
      if (!H.engaged && !R.stay.hints.hall) { R.stay.hints.hall = true; G.say('This is the Hallway Between. It must be in order. If anything is out of order, turn back. If nothing is, continue.'); }
      H.engaged = true;
    }
    if (!H.engaged) return;
    const back = P.pos.z > OZ + 0.5;
    const fwd = P.pos.z < OZ - rec.L - 0.9;
    if (!back && !fwd) return;
    const correct = fwd ? !rec.anomaly : !!rec.anomaly;
    if (correct) { H.count++; Audio.click(P.pos); }
    else {
      H.count = 0;
      G.vhs.pulse(1, 0.6); Audio.staticBurst(0.5);
      if (!R.stay.hints.hallWrong) { R.stay.hints.hallWrong = true; setTimeout(() => G.pa('Please return to the beginning of the hallway. Thank you.'), 900); }
    }
    let anom = null;
    if (H.count < H.required && rnd() < 0.58) { do { anom = pick(ANOMALIES); } while (anom === H.last); }
    if (anom) H.last = anom;
    H.engaged = false;
    H.build(anom, H.count >= H.required);
    if (fwd) H.respawn(); else { G.vhs.pulse(0.5, 0.2); Audio.staticBurst(0.08); }
    if (H.count >= H.required) setTimeout(() => G.say('The Hallway Between is in order. The Garden Court is ahead.'), 600);
  };

  H.build = function (anom, arrival) {
    H.clear();
    const M = W.M, b = new INN.Batch();
    const c0 = W.colliders.length, f0 = W.fixtures.length;
    const group = new THREE.Group(); group.position.x = HX; W.root.add(group);
    const col = (x0, z0, x1, z1) => W.collider(x0 + HX, z0, x1 + HX, z1);
    const open = arrival || H.solved;
    const L = anom === 'longer' ? 30.5 : 28;
    const CH = anom === 'ceiling_low' ? 2.25 : 2.7;
    const rec = H.rec = { group, textures: [], anomaly: anom, arrival, L, t: 0, anim: {} };
    const z = (off) => OZ - off;   // offsets run north from the south archway
    const realm = REALMS.find((r) => r.id === 'garden');

    // shell: floor, ceiling and walls from the front desk to the Garden Court
    b.box(anom === 'carpet_blue' ? H.mat.blueCarpet : M.carpet, -HALF, HALF, -0.02, 0, -44, -12, 2.6);
    b.box(M.ceiling, -HALF, HALF, CH, CH + 0.02, -44, -12, 1.4);
    if (CH < 2.7) b.box(M.woodDark, -HALF, HALF, CH, 2.72, -44, -12, 1);
    for (const side of [-1, 1]) {
      const x0 = side < 0 ? -HALF - 0.2 : HALF, x1 = side < 0 ? -HALF : HALF + 0.2;
      b.box(M.wood, x0, x1, 0, 1.05, -44, -12, 1.2);
      b.box(M.wallpaper, x0, x1, 1.05, CH, -44, -12, 1.2);
      b.box(M.woodDark, x0, x1, CH, 3.0, -44, -12, 1);
      col(x0, -44, x1, -12);
    }
    // until the hall is in order, its far end is a wall of shadow
    if (!open) {
      b.box(M.woodDark, -HALF, HALF, 0, CH, END - 0.2, END, 1);
      col(-HALF, END - 0.2, HALF, END);
    }
    // the archways: brass frames you pass through
    for (const off of [0, L]) {
      b.box(M.woodDark, -HALF, HALF, 2.25, CH, z(off) - 0.15, z(off) + 0.15, 1);
      b.box(M.brass, -HALF, -HALF + 0.12, 0, 2.25, z(off) - 0.15, z(off) + 0.15);
      b.box(M.brass, HALF - 0.12, HALF, 0, 2.25, z(off) - 0.15, z(off) + 0.15);
    }
    if (!open) b.plane(H.mat.dark, 3.5, CH, 0, CH / 2, END + 0.05, 0, 0, 0);

    // doors: left 401 403 405 407 (409), right 402 404 406 408 (410)
    const doors = [[-1, 5, 401], [1, 8, 402], [-1, 11, 403], [1, 14, 404], [-1, 17, 405], [1, 20, 406], [-1, 23, 407], [1, 26, 408]];
    if (anom === 'longer') doors.push([-1, 29.3, 409], [1, 29.3, 410]);
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
    const pend = [4, 10, 16, 22, 27].concat(anom === 'longer' ? [29.8] : []);
    pend.forEach((off) => {
      const p = W.pendant(0, CH, z(off), group);
      const dark = anom === 'pendant_dark' && off === 16;
      if (dark) { p.glow.material = G.offMat; rec.anim.darkGlow = p.glow; }
      if (anom === 'pendant_swing' && off === 16) rec.anim.swing = p.glow.parent;
      if (!dark) W.fixtures.push({ mesh: p.glow, pos: new V3(HX, CH - p.drop - 0.25, z(off)), flickerable: false, color: 0xffd2a0 });
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
    col(HALF - 0.65, z(23) - 0.9, HALF, z(23) + 0.9);
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
    vm.position.set(-HALF + 0.37, 0.95, z(26.5)); group.add(vm);
    const front = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 1.88), anom === 'vending_shoes' ? H.mat.shoes : H.mat.snax);
    front.position.set(-HALF + 0.725, 0.95, z(26.5)); front.rotation.y = Math.PI / 2; group.add(front);
    col(-HALF, z(26.5) - 0.5, -HALF + 0.75, z(26.5) + 0.5);

    // potted ferns flanking the start
    for (const side of [-1, 1]) {
      const fx = side * (HALF - 0.32), fz = z(2.4);
      b.mesh(M.brass, new THREE.CylinderGeometry(0.26, 0.2, 0.45, 10), fx, 0.22, fz);
      const dead = anom === 'fern_dead' && side > 0;
      for (let q = 0; q < 7; q++) {
        const g = new THREE.ConeGeometry(0.12, dead ? 0.7 : 1.0, 3); g.translate(0, dead ? 0.35 : 0.5, 0);
        b.mesh(dead ? H.mat.dead : (q % 2 ? M.leaf : M.leafDark), g, fx, 0.42, fz, dead ? 0.6 : 0, q * 0.9, dead ? 1.2 : 0.75);
      }
      col(fx - 0.28, fz - 0.28, fx + 0.28, fz + 0.28);
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
      col(cx - 0.32, cz - 0.52, cx + 0.32, cz + 0.52);
      rec.anim.cartPos = new V3(cx + HX, 0.6, cz);
    }
    if (anom === 'knocking') rec.anim.knockAt = new V3(doorAt[407].x + HX, 1.4, doorAt[407].z);

    // signs: where you are going, and how far along you are
    const arrow = anom === 'sign_wrong' ? '◂ ' + realm.name : realm.name + ' ▸';
    const st = Tex.sign(arrow, { w: 512, h: 110, bg: '#0e2a1e', fg: '#e8d3a0', border: '#c9a24a' }); rec.textures.push(st);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.36), new THREE.MeshBasicMaterial({ map: st }));
    sg.position.set(0, 2.42, z(L) + 0.17); group.add(sg);
    const ct = Tex.sign(open ? 'THE HALLWAY BETWEEN\nIN ORDER' : 'THE HALLWAY BETWEEN  ·  ' + Math.min(H.count, H.required) + ' OF ' + H.required + '\nIF ANYTHING IS OUT OF ORDER, TURN BACK', { w: 1400, h: 190, bg: '#120c08', fg: '#f4efe2', border: '#c9a24a', font: 'bold 46px "Futura","Century Gothic","Trebuchet MS",sans-serif' });
    rec.textures.push(ct);
    const cs = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.38), new THREE.MeshBasicMaterial({ map: ct }));
    cs.position.set(0, Math.min(2.3, CH - 0.3), z(3.6)); group.add(cs);
    const rod = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.4, 0.02), M.brass); rod.position.set(0, CH - 0.15, z(3.6)); group.add(rod);

    // in order: green light spills in from the Garden Court
    if (open) W.fixtures.push({ mesh: null, pos: new V3(HX, 2.2, END + 0.6), flickerable: false, color: 0x6aff9a, warm: true });

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
        const want = Math.atan2(P.pos.x - (g.position.x + HX), P.pos.z - g.position.z) - g.rotation.y;
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
    PL.reset();
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

  PL.reset = function () {
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

  PL.onEnter = function () {
    if (PL.state === 'idle' && !R.stay.stamps.pool) { PL.lieT = 3; PL.liesSaid = 0; }
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
    setTimeout(() => S.strike(why, 'pool'), 1300);
  };

  PL.win = function () {
    signalOn(false);
    PL.state = 'idle';
    PL.demoT = 999;
    S.award('pool', 'The Lifeguard leans down from the chair and presses a wet stamp into your folio. It does not smudge.');
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

  // =================================================================
  // THE ARCADE, run by ATTRACT MODE.
  // House rule (never posted): if a machine is already playing itself, do not interrupt it.
  // The guests only ever wait at machines that are waiting for a player.
  // The test: every cabinet lights up at once. Play the one that is waiting for you. Three rounds.
  // =================================================================
  const AR = S.arcade = { state: 'idle', guests: [] };
  const BOOTH = new V3(41.4, 0, -4.4);

  AR.init = function () {
    const M = W.M;
    W.box(0.9, 1.05, 0.7, M.woodDark, BOOTH.x, 0.52, BOOTH.z, { collide: true });
    W.box(1.0, 0.05, 0.8, M.brass, BOOTH.x, 1.07, BOOTH.z);
    const bell = W.cyl(0.04, 0.11, 0.09, M.brass, BOOTH.x + 0.22, 1.14, BOOTH.z);
    W.interact(bell, { type: 'arcadebell' });
    W.signMesh(Tex.sign('TOKENS\nRING FOR ATTRACT MODE', { w: 512, h: 160 }), 0.9, 0.28, BOOTH.x, 1.36, BOOTH.z + 0.37, 0);
    AR.cabs = W.arcade.map((m) => {
      const q = new THREE.Quaternion(); m.mesh.getWorldQuaternion(q);
      const n = new V3(0, 0, 1).applyQuaternion(q); n.y = 0; n.normalize();
      return { m, n, stand: m.pos.clone().setY(0).addScaledVector(n, 0.9) };
    });
    ['almost', 'tall'].forEach((t, i) => {
      const gg = new INN.Guest({ type: t, x: 48 + i * 2, z: -8, ry: 0, pose: 'stand', area: 'arcade-staff' });
      W.add(gg.g);
      AR.guests.push({ g: gg, target: -1, wait: i * 4 });
    });
    AR.shuffleT = 30;
    AR.reset();
  };

  AR.reset = function () { AR.state = 'idle'; AR.lied = false; };

  AR.onEnter = function () {
    if (AR.state === 'idle' && !R.stay.stamps.arcade && !AR.lieSaid) { AR.lieSaid = true; setTimeout(() => G.pa('In the arcade, every cabinet is free to play. Please, take a turn.'), 4000); }
  };

  AR.ringBell = function () {
    if (AR.state !== 'idle') return;
    if (R.stay.stamps.arcade) { UI.notice('The bell does not ring. Attract Mode has already approved you.'); return; }
    Audio.deskBell(new V3(BOOTH.x, 1.1, BOOTH.z));
    AR.state = 'boss'; AR.round = 1;
    AR.newRound();
    setTimeout(() => G.say('Play the one that is waiting for you.', { tag: '◉ ATTRACT MODE' }), 600);
  };

  AR.newRound = function () {
    AR.target = Math.floor(rnd() * AR.cabs.length);
    AR.timer = 22;
    AR.flash = 1.2;
    AR.frozenPh = rnd() * 10; AR.frozenScore = Math.floor(rnd() * 900) * 10;
    Audio.staticBurst(0.15);
    if (AR.round === 2 && !AR.lied) { AR.lied = true; G.pa('Every cabinet is free to play.'); }
  };

  AR.play = function (idx) {
    if (AR.state === 'boss') {
      if (AR.flash > 0) return true;
      if (idx === AR.target) {
        for (let k = 0; k < 4; k++) setTimeout(() => Audio.gameBlip(AR.cabs[idx].m.pos), k * 90);
        AR.round++;
        if (AR.round > 3) { AR.win(); return true; }
        AR.newRound();
        return true;
      }
      AR.state = 'caught';
      Audio.staticBurst(0.6);
      setTimeout(() => S.strike('You interrupted a machine that was playing itself.', 'arcade'), 900);
      return true;
    }
    if (AR.state !== 'idle') return true;
    // a machine playing itself: the inn's ordinary reaction (the guests notice)
    if (R.selfPlaying.has(idx)) return false;
    // a free game prints a ticket with a clue about the Hallway Between
    const m = AR.cabs[idx].m;
    Audio.gameBlip(m.pos);
    const fresh = HINTS.filter((h) => !R.stay.notes.includes(h));
    const hint = fresh.length ? pick(fresh) : pick(HINTS);
    if (!R.stay.notes.includes(hint)) R.stay.notes.push(hint);
    G.openPaper({
      letterhead: false,
      title: m.title,
      html: '<div class="body" style="background:#05080a;color:#ffd080;padding:18px;font-family:VT323,monospace;font-size:22px;text-align:center">GAME OVER<br><br>A TICKET PRINTS:<br><br>' + UI.esc(hint) + '</div>',
      footer: 'The ticket has been entered in your folio.',
    });
    return true;
  };

  AR.win = function () {
    AR.state = 'idle';
    S.award('arcade', 'Every screen in the arcade shows the same word for a single frame: APPROVED. A ticket prints from every slot at once. One of them is a stamp.');
  };

  AR.update = function (dt) {
    const inArcade = R.zone && R.zone.area === 'arcade';
    // machines take turns playing themselves while nobody is watching
    AR.shuffleT -= dt;
    if (AR.shuffleT <= 0 && !inArcade && AR.state === 'idle') {
      AR.shuffleT = 30;
      R.selfPlaying = new Set(shuffle([0, 1, 2, 3, 4, 5]).slice(0, 2));
      AR.guests.forEach((g) => { g.target = -1; });
    }
    if (AR.state === 'boss') {
      if (!inArcade) { AR.state = 'idle'; return; }
      AR.flash -= dt;
      AR.timer -= dt;
      if (AR.timer <= 0) { G.say('Again.', { tag: '◉ ATTRACT MODE' }); AR.newRound(); }
    }
  };

  // the guests wander from waiting machine to waiting machine, never near one playing itself
  AR.late = function (dt) {
    const taken = new Set(AR.guests.map((g) => g.target));
    AR.guests.forEach((w) => {
      const gg = w.g.g;
      if (w.target >= 0 && R.selfPlaying.has(w.target)) w.target = -1;   // it started playing itself: step away
      if (w.target < 0) {
        const free = AR.cabs.map((c, i) => i).filter((i) => !R.selfPlaying.has(i) && !taken.has(i));
        if (free.length) { w.target = pick(free); taken.add(w.target); w.wait = 6 + rnd() * 6; }
        return;
      }
      const c = AR.cabs[w.target];
      const d = c.stand.clone().sub(gg.position); d.y = 0;
      const dist = d.length();
      if (dist > 0.05) {
        const step = Math.min(dist, dt * 0.8);
        gg.position.addScaledVector(d.normalize(), step);
        gg.rotation.y = Math.atan2(d.x, d.z);
      } else {
        gg.rotation.y = Math.atan2(-c.n.x, -c.n.z);
        w.wait -= dt;
        if (w.wait <= 0 && AR.state !== 'boss') w.target = -1;
      }
    });
  };

  // during the test, Attract Mode draws every screen
  S.drawArcade = function (m, t) {
    if (AR.state !== 'boss' && AR.state !== 'caught') return false;
    const g = m.ctx, i = m.idx, r = AR.round;
    g.fillStyle = '#05080a'; g.fillRect(0, 0, 128, 96);
    g.textAlign = 'center';
    if (AR.flash > 0) {
      g.fillStyle = Math.floor(t * 8) % 2 ? '#ffd080' : '#ff4fa0'; g.font = 'bold 16px monospace';
      g.fillText('ATTRACT', 64, 42); g.fillText('MODE', 64, 62);
      return true;
    }
    const isT = i === AR.target;
    if (r === 1 && isT) {
      g.fillStyle = '#ffd080'; g.font = 'bold 9px monospace'; g.fillText(m.title, 64, 36);
      if (Math.floor(t * 1.5) % 2) g.fillText('INSERT COIN', 64, 60);
      m.stick.rotation.z = 0;
      return true;
    }
    const frozen = r === 2 && isT, mirror = r === 3 && isT;
    const ph = frozen ? AR.frozenPh : t * 2;
    const score = frozen ? AR.frozenScore : Math.floor(t * 23) * 10;
    g.fillStyle = '#ffd080'; g.font = 'bold 9px monospace'; g.textAlign = 'left';
    g.fillText('1UP ' + String(score).padStart(6, '0'), 4, 10);
    const sx = Math.sin(ph * 1.3) * 54;
    const bx = 64 + (mirror ? -sx : sx), by = 52 + Math.sin(ph * 2.1) * 30;
    g.fillStyle = '#e8f0ea'; g.fillRect(bx - 2, by - 2, 4, 4);
    g.fillRect(4, by - 10, 3, 20); g.fillRect(121, 52 + Math.sin(ph * 2.1 - 0.3) * 28 - 10, 3, 20);
    m.stick.rotation.z = frozen ? 0 : Math.sin(t * 9 + i) * 0.4;
    return true;
  };

  // =================================================================
  // THE DINING ROOM, run by THE HEAD CHEF.
  // House rule (never posted): every guest takes the same thing, every time. Look at their plates.
  // The test: service. Bring each guest what they always take, before the bell.
  // =================================================================
  const DN = S.dining = { state: 'idle', plates: [] };
  const FOODS = ['grapefruit', 'coffee', 'eggs', 'toast'];
  const TYPES = ['armored', 'tall', 'almost', 'tentacle'];
  const PASS = new V3(2.6, 1.06, 31.45);
  DN.foodFor = (type) => FOODS[(TYPES.indexOf(type) + R.stay.variant.dining) % 4];

  function foodMesh(food, s) {
    const g = new THREE.Group(), M = W.M;
    const add = (geo, mat, x, y, z) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); g.add(o); return o; };
    add(new THREE.CylinderGeometry(0.15, 0.13, 0.02, 20), M.white, 0, 0.01, 0);
    if (food === 'grapefruit') add(new THREE.SphereGeometry(0.075, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xe8603a }), 0, 0.02, 0);
    if (food === 'coffee') { add(new THREE.CylinderGeometry(0.05, 0.04, 0.09, 14), M.white, 0, 0.065, 0); add(new THREE.CircleGeometry(0.045, 14), M.coffee, 0, 0.111, 0).rotation.x = -Math.PI / 2; }
    if (food === 'eggs') for (const dx of [-0.045, 0.045]) { add(new THREE.CylinderGeometry(0.05, 0.05, 0.01, 14), M.white, dx, 0.025, 0); add(new THREE.SphereGeometry(0.02, 8, 6), new THREE.MeshLambertMaterial({ color: 0xf0b020 }), dx, 0.032, 0); }
    if (food === 'toast') for (const dz of [-0.03, 0.03]) add(new THREE.BoxGeometry(0.11, 0.015, 0.1), new THREE.MeshLambertMaterial({ color: 0xc8904a }), 0, 0.025 + (dz > 0 ? 0.015 : 0), dz);
    g.scale.setScalar(s || 1);
    return g;
  }

  DN.init = function () {
    const M = W.M;
    // the buffet: one tray of each thing the guests take
    FOODS.forEach((food, i) => {
      const z = 20.8 + i * 1.6;
      const tray = W.cyl(0.3, 0.28, 0.04, M.chrome, -10.95, 1.0, z);
      W.interact(tray, { type: 'chefitem', food });
      const f = foodMesh(food, 1.6); f.position.set(-10.95, 1.02, z); W.add(f);
      W.signMesh(Tex.sign(food.toUpperCase(), { w: 256, h: 64 }), 0.5, 0.13, -10.44, 1.12, z, Math.PI / 2);
    });
    // the service bell on the pass, under the frosted glass
    const bell = W.cyl(0.04, 0.11, 0.09, M.brass, PASS.x, PASS.y, PASS.z);
    W.interact(bell, { type: 'chefbell' });
    W.signMesh(Tex.sign('SERVICE\nRING FOR THE HEAD CHEF', { w: 512, h: 160 }), 0.9, 0.28, PASS.x, 1.38, 31.3, Math.PI);
    // every guest has their plate in front of them: the rule, in plain sight
    DN.guests = G.guests.filter((g) => g.area === 'dining');
    DN.guests.forEach((gg) => {
      const ry = gg.baseRy;
      const pos = gg.g.position.clone().add(new V3(Math.sin(ry) * 0.55, 0.78, Math.cos(ry) * 0.55));
      DN.plates.push({ guest: gg, pos, mesh: null });
    });
    DN.reset();
  };

  DN.showPlate = function (p, food) {
    if (p.mesh) { p.mesh.removeFromParent(); p.mesh = null; }
    if (!food) return;
    p.mesh = foodMesh(food, 1); p.mesh.position.copy(p.pos); W.add(p.mesh);
  };

  DN.reset = function () {
    DN.state = 'idle';
    DN.served = new Set();
    if (R) R.stay && (R.stay.carry = null);
    DN.plates.forEach((p) => DN.showPlate(p, DN.foodFor(p.guest.spec.type)));
  };

  DN.onEnter = function () {
    if (DN.state === 'idle' && !R.stay.stamps.dining && !DN.lieSaid) { DN.lieSaid = true; setTimeout(() => G.pa('The guests in the dining room are not particular. They will eat whatever they are served.'), 4000); }
  };

  DN.ringBell = function () {
    if (DN.state !== 'idle') return;
    if (R.stay.stamps.dining) { UI.notice('Nobody answers. The Head Chef has already approved you.'); return; }
    Audio.deskBell(PASS);
    DN.state = 'boss';
    DN.timer = 75;
    DN.served = new Set();
    R.stay.carry = null;
    DN.plates.forEach((p) => DN.showPlate(p, null));
    setTimeout(() => G.say('Service.', { tag: '◉ THE HEAD CHEF' }), 500);
    setTimeout(() => { if (DN.state === 'boss') UI.notice('The plates have been cleared. Every guest is waiting.', 4); }, 1500);
  };

  DN.take = function (food) {
    if (DN.state !== 'boss') { UI.notice('The trays are full. The Head Chef has not called for service.'); return; }
    R.stay.carry = food;
    Audio.click(G.player.pos);
    UI.notice('You take the ' + food + '.', 2);
  };

  DN.serve = function (gg) {
    const p = DN.plates.find((x) => x.guest === gg);
    if (!p) return false;
    if (DN.served.has(gg)) { UI.notice('They have been served.'); return true; }
    if (!R.stay.carry) { UI.notice('You have nothing to serve. The trays are on the buffet.'); return true; }
    if (R.stay.carry !== DN.foodFor(gg.spec.type)) {
      DN.state = 'caught';
      UI.notice('The guest looks at the ' + R.stay.carry + ' and does not move. The kitchen goes quiet.', 4);
      Audio.stopMuzak(true);
      setTimeout(() => S.strike('The Head Chef saw what you served.', 'dining'), 1600);
      return true;
    }
    DN.showPlate(p, R.stay.carry);
    DN.served.add(gg);
    R.stay.carry = null;
    Audio.deskBell(p.pos);
    if (DN.served.size >= DN.plates.length) { DN.state = 'idle'; S.award('dining', 'From behind the frosted glass, a hand you never quite see slides a card through the hatch. It is stamped, and still warm.'); }
    return true;
  };

  DN.update = function (dt) {
    if (DN.state !== 'boss') return;
    if (!R.zone || R.zone.area !== 'dining') { DN.reset(); return; }
    DN.timer -= dt;
    DN.sizzleT = (DN.sizzleT || 0) - dt;
    if (DN.sizzleT <= 0) { DN.sizzleT = 2 + rnd() * 2; Audio.sizzle(new V3(0, 1.4, 32.5)); }
    if (DN.timer < 15 && !DN.warned) { DN.warned = true; UI.notice('The Head Chef rings the bell once. Not much time.', 3); Audio.deskBell(PASS); }
    if (DN.timer <= 0) { DN.state = 'caught'; setTimeout(() => S.strike('Service ended before every guest was served.', 'dining'), 600); }
  };

  DN.late = function () {
    // the Head Chef's shape behind the frosted glass: busy during service, still otherwise
    if (W.cookShape) W.cookShape.visible = true;
    if (DN.state === 'boss' && W.cookShape) W.cookShape.position.x = Math.sin(performance.now() / 300) * 3;
  };

  // =================================================================
  // THE GARDEN COURT, run by THE GROUNDSKEEPER.
  // House rule (never posted): on the marble, guests step only on one colour. Watch them walk:
  // they move in strange diagonals, never touching the other colour. (After an incident, the colour changes.)
  // The test: cross the court to the Groundskeeper by the glass elevator, on the right colour only.
  // =================================================================
  const GD = S.garden = { state: 'idle', walkers: [] };
  const GK = new V3(0, 0, -71.2);
  const GBELL = new V3(-6.8, 1.1, -46.4);

  // the floor's checker, worked out from how its texture is laid on the court (2.4 m tiles of 2x2 squares)
  function isRedAt(x, z) {
    const u = (x + 30) / 2.4, v = (-44 - z) / 2.4;
    const fu = u - Math.floor(u), fv = v - Math.floor(v);
    const cx = Math.floor(fu * 2), cy = Math.floor((1 - fv) * 2);
    return (cx + cy) % 2 === 1;
  }
  function edgeDist(x, z) {
    const m = (a) => a - Math.floor(a);
    const a = m((x + 30) / 1.2), b = m((-44 - z) / 1.2);
    return Math.min(a, 1 - a, b, 1 - b) * 1.2;
  }
  const badColorIsRed = () => R.stay.variant.garden === 0;
  const unsafe = (x, z) => isRedAt(x, z) === badColorIsRed();
  GD.unsafe = unsafe;

  // a zigzag of square centres on the safe colour, from (x,z) along an axis
  function zigzag(x, z, axis, steps) {
    let k = Math.round((x + 29.4) / 1.2), m = Math.round((-44.6 - z) / 1.2);
    const cx = (kk) => -29.4 + 1.2 * kk, cz = (mm) => -44.6 - 1.2 * mm;
    if (unsafe(cx(k), cz(m))) k += 1;
    const pts = [new V3(cx(k), 0, cz(m))];
    for (let i = 0; i < steps; i++) {
      if (axis === 'x') { k += 1; m += i % 2 ? -1 : 1; } else { m += 1; k += i % 2 ? -1 : 1; }
      pts.push(new V3(cx(k), 0, cz(m)));
    }
    return pts;
  }

  GD.init = function () {
    const M = W.M;
    W.box(0.08, 1.0, 0.08, M.brass, GBELL.x, 0.5, GBELL.z);
    W.box(0.4, 0.05, 0.3, M.woodDark, GBELL.x, 1.02, GBELL.z);
    W.collider(GBELL.x - 0.2, GBELL.z - 0.2, GBELL.x + 0.2, GBELL.z + 0.2);
    const bell = W.cyl(0.04, 0.11, 0.09, M.brass, GBELL.x, 1.1, GBELL.z);
    W.interact(bell, { type: 'gkbell' });
    W.signMesh(Tex.sign('THE GROUNDSKEEPER\nRING TO CROSS THE COURT', { w: 512, h: 160 }), 0.9, 0.28, GBELL.x, 1.32, GBELL.z + 0.17, 0);
    // the Groundskeeper: very tall, shears in hand, by the glass elevator
    GD.keeper = new INN.Guest({ type: 'tall', x: GK.x, z: GK.z - 0.6, ry: 0, pose: 'stand', area: 'garden-staff' });
    const shears = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.7, 0.05), M.chrome); shears.position.set(0.3, 1.2, 0.2); shears.rotation.z = 0.4;
    GD.keeper.g.add(shears);
    W.add(GD.keeper.g);
    ['almost', 'armored'].forEach((t) => {
      const gg = new INN.Guest({ type: t, x: 0, z: -60, ry: 0, pose: 'stand', area: 'garden-staff' });
      W.add(gg.g);
      GD.walkers.push({ g: gg, s: rnd() * 10, dir: 1 });
    });
    GD.reset();
  };

  GD.reset = function () {
    GD.state = 'idle';
    GD.badT = 0;
    // two guests demonstrate, walking zigzags on the safe colour
    const routes = [zigzag(-25.5, -61, 'x', 16), zigzag(-2.0, -66.5, 'x', 5).concat(zigzag(3.5, -66.5, 'z', 0))];
    routes[1] = zigzag(-26.5, -46.2, 'x', 40);
    GD.walkers.forEach((w, i) => { w.path = routes[i]; w.s = 0; w.dir = 1; });
  };

  GD.onEnter = function () {
    if (GD.state === 'idle' && !R.stay.stamps.garden && !GD.lieSaid) { GD.lieSaid = true; setTimeout(() => G.pa('Guests may walk wherever they like in the Garden Court.'), 5000); }
  };

  GD.ringBell = function () {
    if (GD.state !== 'idle') return;
    if (R.stay.stamps.garden) { UI.notice('The bell does not ring. The Groundskeeper has already approved you.'); return; }
    Audio.deskBell(GBELL);
    GD.state = 'boss';
    GD.badT = 0;
    // every guest in the court turns to watch
    G.guests.filter((g) => g.area === 'garden').forEach((g) => { g.attentive = true; g.faceSlow(G.player.pos.x, G.player.pos.z); });
    setTimeout(() => G.say('Come to me. Mind where you step.', { tag: '◉ THE GROUNDSKEEPER' }), 600);
  };

  GD.update = function (dt) {
    if (GD.state !== 'boss') return;
    const P = G.player.pos;
    if (!R.zone || R.zone.area !== 'garden') { GD.state = 'idle'; return; }
    if (W.planters.some((b) => P.x > b.x0 && P.x < b.x1 && P.z > b.z0 && P.z < b.z1)) return GD.caught('You stepped into the planting beds.');
    if (unsafe(P.x, P.z) && edgeDist(P.x, P.z) > 0.2) GD.badT += dt; else GD.badT = Math.max(0, GD.badT - dt * 2);
    if (GD.badT > 0.3) return GD.caught('You stepped where the guests do not.');
    if (Math.hypot(P.x - GK.x, P.z - GK.z) < 1.5) {
      GD.state = 'idle';
      G.guests.filter((g) => g.area === 'garden').forEach((g) => { g.attentive = false; });
      S.award('garden', 'The Groundskeeper clips something from the nearest palm and presses it flat into your folio. When you look again, it is a stamp.');
    }
  };

  GD.caught = function (why) {
    GD.state = 'caught';
    Audio.staticBurst(0.4);
    G.guests.filter((g) => g.area === 'garden').forEach((g) => g.faceInstant(G.player.pos.x, G.player.pos.z));
    setTimeout(() => S.strike(why, 'garden'), 1200);
  };

  GD.late = function (dt) {
    GD.walkers.forEach((w) => {
      const p = w.path; if (!p || p.length < 2) return;
      const segs = p.length - 1;
      w.s += dt * 0.55 * w.dir;
      if (w.s >= segs) { w.s = segs; w.dir = -1; }
      if (w.s <= 0) { w.s = 0; w.dir = 1; }
      const i = Math.min(segs - 1, Math.floor(w.s)), f = w.s - i;
      const a = p[i], b = p[i + 1];
      const gg = w.g.g;
      gg.position.set(a.x + (b.x - a.x) * f, 0, a.z + (b.z - a.z) * f);
      const dx = (b.x - a.x) * w.dir, dz = (b.z - a.z) * w.dir;
      gg.rotation.y = Math.atan2(dx, dz);
    });
    if (GD.keeper) {
      const P = G.player.pos, k = GD.keeper;
      const want = Math.atan2(P.x - k.g.position.x, P.z - k.g.position.z);
      k.g.rotation.y += (want - k.g.rotation.y) * Math.min(1, dt * (GD.state === 'boss' ? 2 : 0.3));
    }
  };
})(window.INN);
