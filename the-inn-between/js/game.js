// THE INN BETWEEN — the administration.
// Time, rules, housekeeping, breakfast, attention, checkout, and the broadcast that frames it all.
window.INN = window.INN || {};
(function (INN) {
  'use strict';
  const UI = INN.UI, Audio = INN.Audio;
  const V3 = THREE.Vector3;

  const HOURS_PER_SEC = 0.1;      // one game hour = ten real seconds
  const START_T = 20;             // check-in: 8 PM, day one
  const EYE = 1.6;
  const WALK = 2.5, RUN = 6.2;

  const STORE_KEY = 'innBetween.v1';
  function load() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; } }
  function save(d) { try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); } catch (e) { /* private window */ } }

  const G = INN.Game = {
    state: 'boot', keys: {}, locked: false, dragLook: false, mouseDown: false,
    store: load(), name: '', vehicle: '', level: 0, extendedStays: 0,
  };

  // =============================================================== boot
  G.boot = function () {
    UI.init();
    // phones and tablets get touch controls and a lighter picture; desktop is unchanged
    G.touch = INN.Touch.detect();
    if (G.touch) INN.Touch.init(G);
    const canvas = document.getElementById('gl');
    const r = G.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    r.setPixelRatio(1);
    r.setSize(innerWidth, innerHeight, false);
    G.vhs = new INN.VHS(r, { light: G.touch });
    G.vhs.resize(innerWidth, innerHeight);
    G.camera = new THREE.PerspectiveCamera(85, innerWidth / innerHeight, 0.1, 160);
    G.camera.layers.set(0);
    fitFov();
    addEventListener('resize', () => {
      r.setSize(innerWidth, innerHeight, false);
      G.vhs.resize(innerWidth, innerHeight);
      G.camera.aspect = innerWidth / innerHeight; fitFov();
      if (G.ending) { G.ending.camera.aspect = innerWidth / innerHeight; G.ending.camera.updateProjectionMatrix(); }
    });
    UI.voice = G.store.voice !== false;
    G.bindInput();
    G.buildRun(true);
    UI.hud(false);
    G.showBootCard();
    G.last = performance.now();
    requestAnimationFrame(G.frame);
  };

  // 85 degrees tall, but on very wide phone screens keep the sides from stretching past ~120
  function fitFov() {
    const a = innerWidth / innerHeight;
    const maxH = 120 * Math.PI / 180;
    const v = a > 1.85 ? Math.min(85, 2 * Math.atan(Math.tan(maxH / 2) / a) * 180 / Math.PI) : 85;
    G.camera.fov = v; G.camera.updateProjectionMatrix();
  }

  G.showBootCard = function () {
    G.state = 'boot';
    UI.card('standby', { line1: 'PLEASE STAND BY', line2: 'PRESS ▶ PLAY TO BEGIN THE BROADCAST' });
    UI.cardOver.innerHTML = '<div style="margin-top:auto;margin-bottom:3vh" class="press" data-go>▶ PLAY</div>';
    UI.cardOver.querySelector('[data-go]').addEventListener('click', G.startBroadcast, { once: true });
    G.bootKey = (e) => { if (G.state === 'boot' && (e.code === 'Enter' || e.code === 'Space')) G.startBroadcast(); };
    addEventListener('keydown', G.bootKey);
  };

  // =============================================================== run setup
  G.buildRun = function (fresh) {
    if (G.scene) disposeScene(G.scene);
    const scene = G.scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1712);
    scene.fog = new THREE.Fog(0x0b1712, 5, 32);
    G.ambient = new THREE.AmbientLight(0x8a9070, 0.5); scene.add(G.ambient);
    scene.add(new THREE.HemisphereLight(0xffd8b0, 0x0e2a1c, 0.25));
    scene.add(G.camera);
    G.lights = [];
    for (let i = 0; i < (G.touch ? 6 : 8); i++) { const l = new THREE.PointLight(0xfff0d8, 0, 10, 1.3); scene.add(l); G.lights.push(l); }

    const residents = G.store.residents || [];
    const world = G.world = new INN.World(scene, { residents });
    G.offMat = new THREE.MeshBasicMaterial({ color: 0x2a2a24 });

    // keys hang on some vacant rooms
    const keyRooms = Object.keys(INN.ROOMS).map(Number).filter((n) => INN.ROOMS[n].kind === 'key');
    shuffle(keyRooms);
    const nKeys = Math.max(4, 8 - G.level);
    keyRooms.forEach((n, i) => { const rm = world.rooms[n]; rm.hasKey = i < nKeys; rm.key.visible = rm.hasKey; });

    // guests, staff, the player's own body
    G.guests = world.guestSpots.map((s) => { const gg = new INN.Guest(s); scene.add(gg.g); world.interact(gg.hit, { type: 'guest', guest: gg }); return gg; });
    G.clerk = new INN.Guest({ type: 'uniform', x: world.clerkSpot.x, z: world.clerkSpot.z, ry: 0, pose: 'stand', area: 'desk' });
    scene.add(G.clerk.g); world.interact(G.clerk.hit, { type: 'clerk' });
    G.attendants = {};
    Object.values(world.exits).forEach((ex) => {
      const a = new INN.Guest({ type: 'uniform', x: ex.attendantPos.x, z: ex.attendantPos.z, ry: ex.attendantRy, pose: 'stand', area: 'exit' });
      a.g.visible = false; scene.add(a.g); world.interact(a.hit, { type: 'attendant', exit: ex.id });
      G.attendants[ex.id] = a;
    });
    G.stalker = new INN.Guest({ type: 'tall', x: 0, z: 0, ry: 0, pose: 'stand', area: 'none' });
    G.stalker.g.visible = false; scene.add(G.stalker.g);
    G.body = INN.Entities.playerBody(); scene.add(G.body);
    G.reflection = makeReflection(); scene.add(G.reflection);
    G.tvCam = new THREE.PerspectiveCamera(55, 4 / 3, 0.05, 40);
    G.tvCam.layers.enable(1);

    // cached interactable positions for cheap proximity tests
    G.wings = new INN.Wings(world);
    if (G.touch) { G.wings.loadR = 40; G.wings.dropR = 56; }
    world.interactables.forEach((m) => { m.updateWorldMatrix(true, false); m.userData.wp = new V3().setFromMatrixPosition(m.matrixWorld); });

    // ---------------------------------------------------------- run state
    const lvl = G.level;
    const picks = shuffle(INN.FALSE_RULES.slice()).slice(0, 2);
    const R = G.run = {
      T: START_T, composure: 100 - lvl * 15, claimed: null, holdingKey: false, claimT: 0, keyReturned: false,
      hkNext: null, hk: {}, survivedHK: false, hkCount: 0,
      breakfasts: 0, ateThisCycle: false, missedStreak: 0, breakfastActive: false, plates: 0, games: 0,
      bfLen: Math.max(2, 4 - lvl), exitEvery: Math.max(6, 12 - lvl * 3),
      wrongFoods: 0, foods: [], shoes: [], items: [], tickets: [],
      effects: { loop: 0, slow: 0, hue: 0, echo: 0 },
      attention: 0, conduct: [], rulesRead: new Set(), dndSeen: new Set(),
      falseRules: picks, falseSaid: new Set(), wrongRoom: null,
      liveExit: pick(Object.keys(world.exits)), selfPlaying: new Set(), poolClosed: false,
      zone: null, prevZone: null, zoneTime: 0, hints: {}, events: [], reflectT: 0, reflectLook: 0, poolStayT: 0, runT: 0,
      cooldown: {}, stamps: [{ text: 'CHECKED IN', color: 'blue' }],
      ruleBreakT: -99, checkoutReady: false, muzakT: 8, ambT: {}, flashT: 60 + Math.random() * 60, playTime: 0,
      flicker: null, flickerT: 3, lightsT: 0,
    };
    for (let i = 0; i < G.extendedStays; i++) R.stamps.push({ text: 'EXTENDED STAY', color: 'red' });
    R.checkInText = fmtClock(R.T, true);
    // the arcade: two machines are already playing themselves
    shuffleArcade();
    // schedule the inn
    sched(START_T + 0.4, () => {
      if (R.falseRules.some((f) => f.id === 'poolclose')) G.pa('Good evening, and welcome to the Inn Between. We hope you enjoy your stay.');
      else G.pa('Good evening, and welcome to the Inn Between. The pool will close at eleven o’clock.');
    });
    daily(5.5, () => G.pa('Good morning. Breakfast will be served at the bell.'));
    daily(6, (late) => breakfastStart(late));
    daily(6 + R.bfLen, () => breakfastEnd());
    daily(22.9, () => { if (!R.falseRules.some((f) => f.id === 'poolclose')) G.pa('The pool will close in five minutes.'); });
    daily(23, () => { R.poolClosed = true; R.poolStayT = 0; });
    daily(29, () => { R.poolClosed = false; });
    repeat(START_T + R.exitEvery, R.exitEvery, () => shiftExit());
    repeat(START_T + 8, 8, () => { if (!R.zone || R.zone.area !== 'arcade') shuffleArcade(); });
    // the broadcast lies, twice at most
    const lieTimes = [START_T + 4.5 + Math.random() * 3, START_T + 22 + Math.random() * 8];
    picks.forEach((f, i) => sched(lieTimes[i], () => { if (R.falseSaid.size < 2) { R.falseSaid.add(f.id); G.pa(f.text); } }));
    applyExitLamps();

    // player
    G.player = { pos: new V3(0, 0, -2.5), yaw: 0, pitch: 0.12, bob: 0, stepT: 0, moving: false, running: false };
    G.camera.position.set(0, EYE, -2.5);
  };

  function disposeScene(scene) {
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
      }
    });
  }

  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  // =============================================================== scheduler
  function sched(t, fn) { G.run.events.push({ t, fn }); G.run.events.sort((a, b) => a.t - b.t); }
  function daily(hour, fn) {
    let t = Math.floor(START_T / 24) * 24 + hour;
    while (t < START_T) t += 24;
    const run = (late) => { fn(late); sched(t += 24, run); };
    sched(t, run);
  }
  function repeat(t0, every, fn) {
    let t = t0;
    const run = (late) => { fn(late); sched(t += every, run); };
    sched(t, run);
  }
  function runEvents() {
    const R = G.run;
    let guard = 0;
    while (R.events.length && R.events[0].t <= R.T && guard++ < 40) {
      const e = R.events.shift();
      e.fn(R.T - e.t);
    }
  }

  // =============================================================== broadcast & PA
  G.say = (t, opts) => UI.say(t, 'broadcast', opts);
  // the PA belongs to one stay; announcements never follow a guest out of it
  const LIVE = { play: 1, paper: 1, checkout: 1, resting: 1, standby: 1 };
  G.pa = function (t) {
    const run = G.run;
    if (!LIVE[G.state]) return Promise.resolve();
    Audio.paChime();
    Audio.duck = 0.3; Audio.setMuzakVolume(Audio.muzakVolume);
    return new Promise((res) => setTimeout(() => {
      if (G.run !== run || !LIVE[G.state]) { Audio.duck = 1; return res(); }
      UI.say(t, 'pa').then(() => { Audio.duck = 1; Audio.setMuzakVolume(Audio.muzakVolume); res(); });
    }, 1700));
  };
  function hintOnce(key, text, kind) {
    const R = G.run;
    if (R.hints[key]) return;
    R.hints[key] = true;
    if (kind === 'pa') G.pa(text); else G.say(text);
  }

  // =============================================================== intro
  G.startBroadcast = function () {
    if (G.state !== 'boot') return;
    removeEventListener('keydown', G.bootKey);
    Audio.init();
    INN.Touch.firstGesture();
    G.state = 'intro';
    G.introCam = { t: 0 };
    UI.card('static');
    Audio.staticBurst(1.4);
    showSkip(true);
    const live = () => G.state === 'intro';
    const seq = async () => {
      await wait(1400); if (!live()) return;
      UI.card('emblem');
      Audio.paChime();
      await wait(5200); if (!live()) return;
      UI.cardData.fadeOut = UI.cardT; await wait(1100); if (!live()) return;
      UI.card('none');
      for (const line of INN.INTRO) {
        if (G.state !== 'intro') return;
        if (line === '@LETHALITY') {
          UI.card('html', { html: UI.lethalityHTML() });
          Audio.staticBurst(0.3);
          await waitOrSkip(5500);
          UI.card('none');
          continue;
        }
        await G.say(line);
      }
      if (live()) G.registration();
    };
    seq();
  };

  // the viewer may skip the safety film; the rules are still posted by every door
  function showSkip(on) {
    let b = document.getElementById('skip-intro');
    if (!b) {
      b = document.createElement('button');
      b.id = 'skip-intro';
      b.textContent = G.touch ? 'SKIP \u25B6\u25B6|' : 'SKIP \u25B6\u25B6|  (ESC)';
      b.addEventListener('click', (e) => { e.stopPropagation(); G.skipIntro(); });
      document.body.appendChild(b);
    }
    b.style.display = on ? 'block' : 'none';
  }
  G.skipIntro = function () {
    if (G.state !== 'intro') return;
    G.state = 'register';
    UI.clearCaptions();
    UI.card('none');
    Audio.staticBurst(0.25);
    G.registration();
  };

  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
  function waitOrSkip(ms) {
    return new Promise((r) => {
      const t0 = performance.now();
      const iv = setInterval(() => { if (G.keys.Space || performance.now() - t0 > ms) { clearInterval(iv); r(); } }, 50);
    });
  }

  G.registration = function () {
    G.state = 'register';
    showSkip(false);
    UI.card('standby', { line1: 'GUEST REGISTRATION', line2: 'PLEASE PRINT CLEARLY' });
    const voice = UI.voice;
    const render = () => {
      UI.paper({
        title: 'Guest Registration Card',
        closable: false,
        html:
          '<div class="field"><label>GUEST NAME</label><input id="reg-name" maxlength="24" autocomplete="off" value="' + UI.esc(G.name) + '" placeholder="print clearly"></div>' +
          '<div class="field"><label>ARRIVING FROM</label><span class="val">THE ROAD</span></div>' +
          '<div class="field"><label>VEHICLE</label><input id="reg-car" maxlength="24" autocomplete="off" value="' + UI.esc(G.vehicle) + '" placeholder="make and color"></div>' +
          '<div class="field"><label>NUMBER IN PARTY</label><span class="val">1</span></div>' +
          '<div class="field"><label>DATE</label><span class="val">OCT. 11 1978</span></div>' +
          '<div class="field"><label>NARRATION</label><span class="val">' + (UI.voice ? 'AUDIBLE' : 'CAPTIONS ONLY') + '</span></div>',
        options: [
          { label: 'Sign and return the card to the desk.', fn: submit },
          { label: 'Narration: ' + (UI.voice ? 'change to CAPTIONS ONLY' : 'change to AUDIBLE'), fn: () => { grab(); UI.voice = !UI.voice; G.store.voice = UI.voice; save(G.store); render(); } },
        ],
        footer: 'BY SIGNING, THE GUEST AGREES TO OBSERVE ALL POSTED RULES. THE MANAGEMENT IS NOT RESPONSIBLE FOR ARTICLES LEFT IN ROOMS, CORRIDORS, OR THE GUEST.',
        onEnter: submit,
      });
    };
    const grab = () => {
      const n = document.getElementById('reg-name'), c = document.getElementById('reg-car');
      if (n) G.name = n.value.trim(); if (c) G.vehicle = c.value.trim();
    };
    function submit() {
      grab();
      if (!G.name) { const n = document.getElementById('reg-name'); if (n) { n.placeholder = 'the desk requires a name'; n.focus(); } return; }
      UI.paperEl.insertAdjacentHTML('beforeend', '<div class="stamp big blue">CHECKED IN</div>');
      Audio.stamp();
      setTimeout(() => { UI.closePaper(); G.beginPlay(true); }, 1100);
    }
    void voice;
    render();
  };

  G.beginPlay = function (firstOfBroadcast) {
    G.state = 'standby';
    UI.card('standby', { line1: 'PLEASE STAND BY' });
    setTimeout(() => {
      UI.card('none');
      UI.hud(true);
      G.state = 'play';
      G.requestLock();
      if (firstOfBroadcast) {
        setTimeout(() => G.say('Your room key is waiting on a door. Read the plaque before entering any common area.'), 2500);
      } else {
        G.pa('Welcome back. Your stay has been extended.');
      }
    }, firstOfBroadcast ? 1800 : 2600);
  };

  // =============================================================== input
  G.bindInput = function () {
    const canvas = G.renderer.domElement;
    addEventListener('keydown', (e) => {
      if (UI.paperOpen && document.activeElement && document.activeElement.tagName === 'INPUT') return;
      G.keys[e.code] = true;
      if (e.code === 'Space' && (G.state === 'intro')) { e.preventDefault(); UI.skipLine(); }
      if ((e.code === 'Escape' || e.code === 'Enter') && G.state === 'intro') { e.preventDefault(); G.skipIntro(); }
      if (G.state !== 'play' || e.innHandled) return;
      if (e.code === 'KeyE') G.tryInteract();
      if (e.code === 'KeyF' || e.code === 'Tab') { e.preventDefault(); G.openFolio(); }
      if (e.code === 'Escape' && G.dragLook) G.pause();
      if (e.code === 'Space') e.preventDefault();
    });
    addEventListener('keyup', (e) => { G.keys[e.code] = false; });
    addEventListener('blur', () => { G.keys = {}; });
    canvas.addEventListener('click', () => { if (G.state === 'play' && !G.locked) G.requestLock(); });
    document.addEventListener('pointerlockchange', () => {
      G.locked = document.pointerLockElement === canvas;
      if (G.locked) {
        G.everLocked = true;
        // a lock that lands after paperwork opened is handed straight back
        if (G.state !== 'play') { G.internalUnlock = true; document.exitPointerLock(); return; }
      }
      if (!G.locked && G.state === 'play' && !G.internalUnlock && !G.dragLook) G.pause();
      G.internalUnlock = false;
    });
    // inside a sandboxed frame pointer lock may be refused: fall back to drag-to-look
    document.addEventListener('pointerlockerror', () => { if (!G.everLocked) G.dragLook = true; });
    addEventListener('mousemove', (e) => {
      if (G.state !== 'play') return;
      if (!G.locked && !(G.dragLook && G.mouseDown)) return;
      const s = 0.0022;
      G.player.yaw -= e.movementX * s;
      G.player.pitch = Math.max(-1.45, Math.min(1.45, G.player.pitch - e.movementY * s));
    });
    canvas.addEventListener('mousedown', () => { G.mouseDown = true; });
    addEventListener('mouseup', () => { G.mouseDown = false; });
  };

  G.requestLock = function () {
    const c = G.renderer.domElement;
    if (G.touch) return;
    if (G.dragLook || !c.requestPointerLock) { G.dragLook = true; return; }
    try {
      const p = c.requestPointerLock();
      if (p && p.catch) p.catch(() => { if (!G.everLocked) G.dragLook = true; });
    } catch (e) { G.dragLook = true; }
  };
  G.releaseLock = function () {
    if (document.pointerLockElement) { G.internalUnlock = true; document.exitPointerLock(); }
  };

  G.openPaper = function (opts) {
    G.state = 'paper';
    G.releaseLock();
    UI.prompt('');
    const userClose = opts.onClose;
    opts.onClose = () => { if (G.state === 'paper') { G.state = 'play'; G.requestLock(); } if (userClose) userClose(); };
    if (UI.paperOpen) UI.onPaperClose = null; // swapping one form for another
    UI.paper(opts);
  };
  G.closePaper = function () { UI.closePaper(); };

  G.pause = function () {
    if (G.state !== 'play') return;
    G.state = 'paused';
    UI.hud(false);
    UI.card('standby', { line1: 'BROADCAST PAUSED', line2: 'PLEASE STAND BY' });
    UI.flash('emblem', 2);
    const R = G.run;
    const menu = () => UI.paper({
      title: 'Guest Services',
      closable: true,
      html: G.touch ? '<div class="body">CONTROLS ON FILE:\nLEFT THUMB · WALK\nRIGHT THUMB · LOOK (TAP TO USE)\nUSE · TAKE / SPEAK / READ\nRUN · HURRY (MIND THE ATRIUM)\nFOLIO · YOUR PAPERWORK\nTAP THE WATCH · CONSULT IT\n\nGUEST: ' + UI.esc(G.name).toUpperCase() + '\nCURRENT LOCATION: ' + (R.zone ? R.zone.name : 'UNKNOWN') + '</div>' : '<div class="body">CONTROLS ON FILE:\nW A S D · WALK        MOUSE · LOOK\nSHIFT · HURRY         E · USE / TAKE / SPEAK\nF · FOLIO             Q (HOLD) · CONSULT WATCH\nESC · PAUSE BROADCAST\n\nGUEST: ' + UI.esc(G.name).toUpperCase() + '\nCURRENT LOCATION: ' + (R.zone ? R.zone.name : 'UNKNOWN') + '</div>',
      options: [
        { label: 'Resume the broadcast.', fn: () => UI.closePaper() },
        { label: 'Narration: ' + (UI.voice ? 'AUDIBLE (change to captions only)' : 'CAPTIONS ONLY (change to audible)'), fn: () => { UI.voice = !UI.voice; G.store.voice = UI.voice; save(G.store); menu(); } },
        { label: 'Review my folio.', fn: () => { UI.paper(folioOpts(() => menu())); } },
      ],
      onClose: () => { UI.card('none'); UI.hud(true); G.state = 'play'; G.requestLock(); },
    });
    menu();
  };

  // =============================================================== frame
  G.frame = function (now) {
    requestAnimationFrame(G.frame);
    G.frames = (G.frames || 0) + 1;
    const dt = Math.min(0.05, (now - G.last) / 1000);
    G.last = now;
    Audio.update(dt);
    UI.updateCard(dt);

    if (G.state === 'ending') {
      G.ending.update(dt);
      G.vhs.render(G.ending.scene, G.ending.camera, dt, { fade: Math.min(1, G.endT / 2.5), desat: 0 });
      G.endT += dt;
      return;
    }
    if (G.state === 'boot' || G.state === 'intro' || G.state === 'register' || G.state === 'standby') {
      // a slow dolly down the west corridor
      G.introCam = G.introCam || { t: 0 };
      G.introCam.t += dt;
      const x = -16 - (G.introCam.t * 0.6) % 40;
      G.camera.position.set(x, EYE, 0.2);
      G.camera.rotation.set(-0.03, Math.PI / 2, 0, 'YXZ');
      updateLights(dt, true);
      animateWorld(dt);
      G.vhs.render(G.scene, G.camera, dt, { glitch: 0.15 });
      return;
    }
    if (G.state === 'play') G.update(dt);
    const R = G.run;
    if (G.state === 'play' || G.state === 'paper' || G.state === 'paused' || G.state === 'checkout') {
      animateWorld(dt);
      updateLights(dt);
      renderTV();
    }
    const comp = R ? R.composure : 100;
    G.vhs.render(G.scene, G.camera, dt, {
      desat: Math.max(0, Math.min(0.85, (62 - comp) / 62)) + (R && R.missedStreak >= 2 ? 0.1 : 0),
      glitch: comp < 30 ? 0.25 : 0,
      hue: R && R.effects.hue > 0 ? 0.9 : 0,
      darken: comp < 40 ? (40 - comp) / 30 : 0,
      fade: G.fade == null ? 1 : G.fade,
      staticAmt: G.staticAmt || 0,
    });
  };

  // =============================================================== update
  G.update = function (dt) {
    const R = G.run, P = G.player;
    R.playTime += dt;
    INN.Touch.frame(G);
    movePlayer(dt);
    // time
    R.T += dt * HOURS_PER_SEC;
    runEvents();
    // zones and rules
    const z = G.world.zoneAt(P.pos.x, P.pos.z);
    if (z !== R.zone) enterZone(z);
    R.zoneTime += dt;
    enforceRules(dt);
    housekeeping(dt);
    composure(dt);
    effects(dt);
    updateExits();
    stalker(dt);
    G.wings.update(P.pos, dt);
    atmosphere(dt);
    ambience(dt);
    targeting();
    // watch & OSD
    const hour = R.T % 24;
    UI.raiseWatch(G.keys.KeyQ);
    UI.drawWatch({ h: Math.floor(hour), m: (hour % 1) * 60, day: Math.floor((R.T - START_T + 20) / 24) + 1, hkLeft: R.claimed ? R.hkNext - R.T : null, room: R.claimed });
    UI.osd(dateStamp(R.T), false);
    // subliminal broadcast frames
    R.flashT -= dt * (R.composure < 30 ? 2.5 : 1);
    if (R.flashT <= 0) {
      R.flashT = 70 + Math.random() * 90;
      UI.flash(Math.random() < 0.35 ? 'emblem' : (Math.random() < 0.2 ? 'testcard' : pick(INN.SUBLIMINAL)), 2 + Math.floor(Math.random() * 2));
      G.vhs.pulse(0.8, 0.4);
    }
    if (R.composure <= 0) G.lose('composure');
  };

  function movePlayer(dt) {
    const P = G.player, R = G.run, k = G.keys;
    let fx = 0, fz = 0;
    if (k.KeyW || k.ArrowUp) fz -= 1;
    if (k.KeyS || k.ArrowDown) fz += 1;
    if (k.KeyA || k.ArrowLeft) fx -= 1;
    if (k.KeyD || k.ArrowRight) fx += 1;
    // the thumbstick is analog: a light push is a slow walk
    let analog = 1;
    if (INN.Touch.move.active) {
      const m = INN.Touch.move, mag = Math.min(1, Math.hypot(m.x, m.y));
      if (mag > 0.15) { fx += m.x; fz += m.y; analog = mag; }
    }
    const len = Math.hypot(fx, fz);
    P.moving = len > 0;
    P.running = P.moving && (k.ShiftLeft || k.ShiftRight);
    let speed = (P.running ? RUN : WALK) * analog;
    if (R.effects.slow > 0) speed *= 0.6;
    if (len > 0) {
      fx /= len; fz /= len;
      const s = Math.sin(P.yaw), c = Math.cos(P.yaw);
      const dx = (fx * c + fz * s) * speed * dt, dz = (-fx * s + fz * c) * speed * dt;
      P.pos.x += dx; P.pos.z += dz;
      G.world.collide(P.pos, 0.3);
      P.bob += dt * (P.running ? 11 : 7);
      P.stepT -= dt;
      if (P.stepT <= 0) { P.stepT = P.running ? 0.34 : 0.55; Audio.footstepSelf(); if (R.effects.echo > 0) echoStep(); }
    }
    // the duplicated corridor
    if (R.effects.loop > 0 && R.zone && R.zone.area === 'west' && P.pos.x < -50) P.pos.x += 30;
    if (R.effects.loop > 0 && R.zone && R.zone.area === 'east' && P.pos.x > 50) P.pos.x -= 24;
    const cam = G.camera;
    cam.position.set(P.pos.x, EYE + Math.sin(P.bob) * (P.moving ? 0.025 : 0), P.pos.z);
    cam.rotation.set(P.pitch, P.yaw, 0, 'YXZ');
    G.body.position.set(P.pos.x, 0, P.pos.z); G.body.rotation.y = P.yaw + Math.PI;
    const fwd = new V3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw));
    Audio.setListener(cam.position, fwd);
  }

  function echoStep() {
    const P = G.player;
    const back = new V3(Math.sin(P.yaw) * 3, 0.1, Math.cos(P.yaw) * 3).add(P.pos);
    setTimeout(() => Audio.footstepOther(back), 260);
  }

  // =============================================================== zones
  function enterZone(z) {
    const R = G.run;
    R.prevZone = R.zone; R.zone = z; R.zoneTime = 0;
    if (!z) return;
    // attention: guests face you when you enter, silently
    if (R.attention > 0) {
      G.guests.forEach((g) => { if (g.area === z.area) { g.attentive = true; g.faceInstant(G.player.pos.x, G.player.pos.z); } });
    }
    if (z.kind === 'dnd') {
      if (!R.dndSeen.has(z.num)) { R.dndSeen.add(z.num); }
      R.composure -= 8;
      Audio.stopMuzak(true);
      G.vhs.pulse(0.6, 0.15);
    }
    if (z.area === 'pool') R.poolStayT = 0;
    if (z.kind === 'room' && z.num === R.claimed && !R.hints.luggage) {
      R.hints.luggage = true;
      UI.notice('Your luggage has been brought up. You did not bring luggage.', 5);
    }
    if (z.kind === 'exit' && z.exit === R.liveExit && !R.checkoutReady) {
      hintOnce('lamp', 'A lit lamp marks the live exit. An attendant will meet you here when your folio is complete.');
    }
  }

  // =============================================================== rules
  function breakRule(area, idx, why) {
    const R = G.run;
    const key = area + idx;
    if (R.cooldown[key] && R.playTime - R.cooldown[key] < 15) return;
    R.cooldown[key] = R.playTime;
    R.attention = Math.min(5, R.attention + 1);
    R.conduct.push(INN.RULES[area].title + ': ' + INN.RULES[area].lines[idx]);
    R.ruleBreakT = R.playTime;
    Audio.ruleBroken();
    // the guests in the room turn toward you, slowly
    G.guests.forEach((g) => { if (g.area === area || (R.zone && g.area === R.zone.area)) { g.attentive = true; g.faceSlow(G.player.pos.x, G.player.pos.z); } });
    void why;
    if (R.attention === 1) setTimeout(() => { if (G.state === 'play') G.say('A reminder. The Inn’s guests are people of habit. Please do not give them a reason to change.'); }, 14000);
  }

  function enforceRules(dt) {
    const R = G.run, P = G.player, z = R.zone;
    if (!z) return;
    // ATRIUM 1: walk, do not run
    if (z.area === 'atrium' && P.running) {
      R.runT += dt;
      if (R.runT > 0.5) { breakRule('atrium', 0); R.runT = 0; }
    } else R.runT = 0;
    // POOL 2: closes at eleven
    if (z.area === 'pool' && R.poolClosed) {
      R.poolStayT += dt;
      if (R.poolStayT > 8) { breakRule('pool', 1); R.poolStayT = -10; }
    }
    // GARDEN COURT 1: keep to the paths
    if (z.area === 'garden' && G.world.planters.some((b) => P.pos.x > b.x0 + 0.1 && P.pos.x < b.x1 - 0.1 && P.pos.z > b.z0 + 0.1 && P.pos.z < b.z1 - 0.1)) {
      R.bedT = (R.bedT || 0) + dt;
      if (R.bedT > 0.4) { breakRule('garden', 0); R.bedT = -6; }
    } else if ((R.bedT || 0) > 0) R.bedT = 0;
    // POOL 1: your reflection, five seconds
    reflection(dt);
  }

  function reflection(dt) {
    const R = G.run, P = G.player, B = G.world.poolBasin, ref = G.reflection;
    let looking = false;
    if (R.zone && R.zone.area === 'pool') {
      const dir = new V3(0, 0, -1).applyQuaternion(G.camera.quaternion);
      if (dir.y < -0.35) {
        const t = (EYE + 0.35) / -dir.y;
        const hx = P.pos.x + dir.x * t, hz = P.pos.z + dir.z * t;
        if (t < 4.2 && hx > B.x0 + 0.2 && hx < B.x1 - 0.2 && hz > B.z0 + 0.2 && hz < B.z1 - 0.2) {
          looking = true;
          ref.position.set(hx, -0.34, hz);
          ref.rotation.set(-Math.PI / 2, 0, Math.atan2(hx - P.pos.x, hz - P.pos.z) + Math.PI);
        }
      }
    }
    if (looking) {
      R.reflectT += dt; R.reflectLook = 0;
      ref.visible = true;
      // it begins to move slightly before you do
      ref.material.opacity = Math.min(0.8, R.reflectT * 0.4);
      ref.scale.x = 1 + Math.max(0, R.reflectT - 3) * 0.04;
      if (R.reflectT > 5) { breakRule('pool', 0); R.reflectT = -3; }
    } else {
      R.reflectLook += dt;
      if (R.reflectLook > 0.6) ref.visible = false;
      if (R.reflectLook > 1.5) R.reflectT = Math.max(0, R.reflectT);
      if (R.reflectLook > 1.5 && R.reflectT > 0) R.reflectT = 0;
    }
  }

  function makeReflection() {
    const c = INN.Tex.canvas(128, 256), g = c.getContext('2d');
    g.fillStyle = 'rgba(8,14,16,0.95)';
    g.beginPath(); g.ellipse(64, 50, 26, 32, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(14, 256); g.quadraticCurveTo(10, 110, 64, 92); g.quadraticCurveTo(118, 110, 114, 256); g.fill();
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, opacity: 0, depthWrite: false }));
    m.visible = false;
    m.renderOrder = 2;
    return m;
  }

  // =============================================================== housekeeping
  function housekeeping(dt) {
    const R = G.run, hk = R.hk;
    if (!R.claimed) return;
    const room = G.world.rooms[R.claimed];
    const left = R.hkNext - R.T;
    const corridorDir = room.doorWorld.x < 0 ? -1 : 1;
    const far = new V3(room.doorWorld.x + corridorDir * 26, 1, 0);
    if (left <= 3 && !hk.approach) {
      hk.approach = true;
      Audio.cartStart(far);
      G.pa('Housekeeping is now in service on this floor.');
    }
    if (hk.approach && !hk.gone) {
      const k = Math.max(0, Math.min(1, (3 - left) / 2.75));
      Audio.cartMove(new V3().lerpVectors(far, new V3(room.doorWorld.x, 1, room.doorWorld.z * 0.4), k));
    }
    if (left <= 0.25 && !hk.ended) {
      if (isSeenByHousekeeping(room)) return G.lose('housekeeping');
      hk.checked = true;
    }
    if (left <= 0 && !hk.doorShut) {
      hk.doorShut = true;
      room.door.target = 0;
      Audio.door(room.doorWorld, false);
    }
    if (left <= 0 && left > -1.5) {
      hk.sheetT = (hk.sheetT || 0) - dt;
      if (hk.sheetT <= 0) { hk.sheetT = 2 + Math.random() * 3; Audio.sheets(room.insideWorld); }
    }
    if (left <= -1.5 && !hk.ended) {
      hk.ended = true;
      Audio.cartStop();
      // evidence: a made bed, folded towels, your luggage packed by the door
      if (room.bed) { room.bed.spreadMade.visible = true; room.bed.spreadMess.visible = false; room.bed.pillow2.rotation.y = 0; }
      if (room.towels) room.towels.visible = true;
      if (room.luggage) { room.luggage.visible = false; room.luggagePacked.visible = true; }
      R.hkCount++;
      if (!R.survivedHK) {
        R.survivedHK = true;
        R.stamps.push({ text: 'SERVICED', color: 'green' });
        G.say('Housekeeping has serviced your room. You may now return your key to its door.');
      }
      // the next service, forty-eight hours on
      R.hkNext += 48; R.hk = {};
    }
  }

  function isSeenByHousekeeping(room) {
    const R = G.run, P = G.player, z = R.zone;
    if (!z) return false;
    if (z.num === room.num) return true;
    const sameCorridor = z.kind === 'corridor' && ((z.area === 'west' && room.doorWorld.x < 0) || (z.area === 'east' && room.doorWorld.x > 0));
    return sameCorridor && Math.abs(P.pos.x - room.doorWorld.x) < 9;
  }

  // =============================================================== breakfast
  function breakfastStart(late) {
    const R = G.run;
    R.plates = 0; R.games = 0; R.ateThisCycle = false;
    if (late > R.bfLen) return;
    R.breakfastActive = true;
    G.world.buffet.visible = true;
    Audio.breakfastBell();
    setTimeout(() => G.pa('The continental breakfast is now being served in the dining room.'), 2600);
  }
  function breakfastEnd() {
    const R = G.run;
    R.breakfastActive = false;
    G.world.buffet.visible = false;
    if (!R.ateThisCycle) {
      R.missedStreak++;
      if (R.missedStreak === 2) UI.notice('You have missed two breakfasts. You can feel it.', 5);
    }
    G.pa('Breakfast service has concluded. Thank you.');
  }

  // =============================================================== composure
  function composure(dt) {
    const R = G.run, z = R.zone;
    let d = 0;
    if (R.missedStreak >= 2) d -= 0.3;
    if (z && z.kind === 'dnd') d -= 0.5;
    if (R.attention > 0) {
      const p = G.player.pos;
      const watched = G.guests.some((g) => g.attentive && g.g.position.distanceToSquared(p) < 144);
      if (watched) d -= 0.07 * R.attention * (1 + G.level * 0.5);
    }
    R.composure = Math.max(0, Math.min(100, R.composure + d * dt));
    Audio.setWhispers(Math.pow(Math.max(0, (75 - R.composure) / 75), 1.4) + (z && z.kind === 'dnd' ? 0.3 : 0));
    if (R.composure < 35) hintOnce('lowcomp', 'If you feel unwell, this is normal. Eat. Rest in your room. Do not linger where you are not expected.');
  }

  function effects(dt) {
    const E = G.run.effects;
    for (const k in E) if (E[k] > 0) E[k] = Math.max(0, E[k] - dt);
    Audio.muzakPitch = E.slow > 0 ? -160 : 0;
  }

  // =============================================================== exits
  function shiftExit() {
    const R = G.run;
    const here = R.zone && R.zone.kind === 'exit' && R.zone.exit === R.liveExit;
    if (here || G.state === 'checkout') return;
    const others = Object.keys(G.world.exits).filter((k) => k !== R.liveExit);
    R.liveExit = pick(others);
    applyExitLamps();
    G.pa('Please note. An exit has been relocated for your convenience.');
  }
  function applyExitLamps() {
    const R = G.run;
    Object.values(G.world.exits).forEach((ex) => { ex.shade.material = ex.id === R.liveExit ? ex.shadeOn : ex.shadeOff; });
  }
  function checkoutReady() {
    const R = G.run;
    return R.survivedHK && R.breakfasts >= 1 && R.keyReturned && !R.holdingKey;
  }
  function updateExits() {
    const R = G.run;
    const ready = checkoutReady();
    if (ready && !R.checkoutReady) {
      R.checkoutReady = true;
      G.say('Your folio is complete. An attendant is waiting at the live exit. Look for the green lamp.');
    }
    if (!ready) R.checkoutReady = false;
    Object.entries(G.attendants).forEach(([id, a]) => { a.g.visible = ready && id === R.liveExit; });
  }

  // =============================================================== the corridor guest
  function stalker(dt) {
    const R = G.run, s = G.stalker, P = G.player;
    if (R.attention < 2) { s.g.visible = false; return; }
    s.t = (s.t || 0) + dt;
    const z = R.zone;
    if (s.g.visible) {
      const d = s.g.position.distanceTo(P.pos);
      const inView = inFrustum(s.g.position.clone().setY(1.5));
      if (d < 7 || (!inView && s.t > 4) || s.t > 30) { s.g.visible = false; s.t = 0; }
      return;
    }
    if (s.t < 25 || !z) return;
    if (z.area === 'wing') return wingStalker(s, P);
    if (z.area !== 'west' && z.area !== 'east') return;
    const minX = z.area === 'west' ? -61 : 13, maxX = z.area === 'west' ? -13 : 57;
    const dir = Math.random() < 0.5 ? -1 : 1;
    const x = Math.max(minX, Math.min(maxX, P.pos.x + dir * (16 + Math.random() * 6)));
    if (Math.abs(x - P.pos.x) < 12) return;
    const pos = new V3(x, 1.5, 0);
    if (inFrustum(pos)) return; // never appears while you watch
    s.g.position.set(x, 0, 0);
    s.faceInstant(P.pos.x, P.pos.z);
    s.g.visible = true; s.t = 0;
  }

  // in the wings, the guest waits at the far end of whatever corridor you are in
  function wingStalker(s, P) {
    const axis = G.wings.axisAt(P.pos.x, P.pos.z);
    for (let tries = 0; tries < 4; tries++) {
      const d = (Math.random() < 0.5 ? -1 : 1) * (15 + Math.random() * 8);
      const x = axis === 'x' ? P.pos.x + d : Math.round((P.pos.x - 12) / 24) * 24 + 12;
      const z = axis === 'z' ? P.pos.z + d : Math.round((P.pos.z + 62) / 24) * 24 - 62;
      if (!G.wings.isCorridor(x, z) || inFrustum(new V3(x, 1.5, z))) continue;
      s.g.position.set(x, 0, z);
      s.faceInstant(P.pos.x, P.pos.z);
      s.g.visible = true; s.t = 0;
      return;
    }
  }

  // the court opens up: longer sight lines, more light; the wings close back in
  const _fogC = new THREE.Color();
  function atmosphere(dt) {
    const a = G.run.zone ? G.run.zone.area : '';
    const fog = G.scene.fog, k = Math.min(1, dt * 1.5);
    // green haze in the court (deep enough that the balconies never end), a colder haze in the wings
    const far = a === 'garden' ? 82 : a === 'wing' ? 28 : 32, near = a === 'garden' ? 6 : 5;
    fog.far += (far - fog.far) * k; fog.near += (near - fog.near) * k;
    _fogC.setHex(a === 'garden' ? 0x12301f : a === 'wing' ? 0x0a1519 : 0x0b1712);
    fog.color.lerp(_fogC, k); G.scene.background.copy(fog.color);
    const amb = a === 'garden' ? 0.62 : a === 'wing' ? 0.42 : 0.5;
    G.ambient.intensity += (amb - G.ambient.intensity) * k;
  }

  const _frustum = new THREE.Frustum(), _pm = new THREE.Matrix4();
  function inFrustum(p) {
    G.camera.updateMatrixWorld();
    _pm.multiplyMatrices(G.camera.projectionMatrix, G.camera.matrixWorldInverse);
    _frustum.setFromProjectionMatrix(_pm);
    return _frustum.containsPoint(p);
  }

  // =============================================================== sound beds
  function ambience(dt) {
    const R = G.run, z = R.zone, P = G.player, A = R.ambT;
    const area = z ? z.area : '';
    // muzak: comes and goes, never constant
    R.muzakT -= dt;
    const dnd = z && z.kind === 'dnd';
    if (R.muzakT <= 0) {
      if (Audio.muzakOn) { Audio.stopMuzak(); R.muzakT = 45 + Math.random() * 80; }
      else if (!dnd) { Audio.startMuzak(); R.muzakT = 60 + Math.random() * 60; }
      else R.muzakT = 5;
    }
    if (dnd && Audio.muzakOn) Audio.stopMuzak(true);
    const vol = { atrium: 0.75, garden: 0.6, dining: 0.7, arcade: 0.55, pool: 0.45, room: 0.2, copy: 0.05, wing: 0.25, promenade: 0.45 }[area];
    Audio.setMuzakVolume(vol == null ? 0.35 : vol);
    const every = (k, a, b, fn) => { A[k] = (A[k] == null ? a + Math.random() * (b - a) : A[k]) - dt; if (A[k] <= 0) { A[k] = a + Math.random() * (b - a); fn(); } };
    every('ice', 30, 70, () => Audio.iceMachine(new V3(-13, 1, 1.1)));
    every('steps', 30, 80, () => otherFootsteps());
    if (area === 'garden') every('fountain', 0.8, 2.2, () => Audio.slosh(G.world.fountainPos));
    if (area === 'pool') { every('drip', 1.5, 5, () => Audio.drip(new V3(20 + Math.random() * 14, -0.3, -20 + Math.random() * 13))); every('slosh', 6, 14, () => Audio.slosh(new V3(27, -0.3, -13))); }
    if (area === 'dining' && R.breakfastActive) every('sizzle', 3, 7, () => Audio.sizzle(new V3(0, 1.4, 32.5)));
    if (area === 'arcade') every('blip', 0.3, 1.2, () => { const m = G.world.arcade[pick([...R.selfPlaying])]; if (m) Audio.gameBlip(m.pos); });
    if (area === 'west' || area === 'east') every('tv', 12, 30, () => {
      const occ = [103, 108, 110, 115, 118].map((n) => G.world.rooms[n]).filter((r) => r.doorWorld.distanceTo(P.pos) < 10);
      if (occ.length) Audio.tvMurmur(pick(occ).doorWorld);
    });
    const clockRoom = G.world.rooms[106];
    if (clockRoom.door.angle > 0.05 || (z && z.num === 106)) every('tick', 1, 1, () => Audio.tick(clockRoom.insideWorld, 0.35));
  }

  function otherFootsteps() {
    // heels, somewhere else. Other guests are not silent.
    const P = G.player;
    const along = Math.random() < 0.5 ? -1 : 1;
    const start = new V3(P.pos.x + along * (14 + Math.random() * 8), 0.2, P.pos.z + (Math.random() - 0.5) * 6);
    const dir = new V3(Math.random() < 0.5 ? 1 : -1, 0, 0);
    const n = 6 + Math.floor(Math.random() * 6);
    for (let i = 0; i < n; i++) setTimeout(() => Audio.footstepOther(start.clone().addScaledVector(dir, i * 0.7)), i * 520);
  }

  // =============================================================== world animation
  function animateWorld(dt) {
    const W = G.world, R = G.run, t = performance.now() / 1000;
    W.doors.forEach((d) => {
      d.angle += (d.target - d.angle) * Math.min(1, dt * 5);
      d.pivot.rotation.y = d.angle;
      d.collider.on = Math.abs(d.angle) < 0.35;
      const z = R && R.zone;
      d.room.inner.visible = Math.abs(d.angle) > 0.02 || !!(z && z.num === d.room.num);
    });
    if (G.guests) G.guests.forEach((g) => g.update(dt, t));
    if (G.clerk) G.clerk.update(dt, t);
    Object.values(G.attendants || {}).forEach((a) => a.update(dt, t));
    if (W.water) W.water.material.emissive.setHSL(0.5, 0.7, 0.13 + Math.sin(t * 0.7) * 0.02);
    if (W.marqueeMat) {
      // the marquee bulbs chase
      const ph = Math.floor(t * 4) % 3;
      if (ph !== W._mqPh) { W._mqPh = ph; W.marqueeMat.map = W.marqueeTex[ph]; W.marqueeMat.needsUpdate = true; }
      W.marqueeBulbs.material.opacity = 0.75 + 0.25 * Math.sin(t * 9);
    }
    if (W.elevatorCab) {
      // the glass car rises and settles, floor by floor, carrying no guest
      const cyc = (t * 0.04) % 2, f = cyc < 1 ? cyc : 2 - cyc;
      const target = Math.round(f * 5) * 3.6;
      W.elevatorCab.position.y += (target - W.elevatorCab.position.y) * Math.min(1, dt * 0.6);
    }
    if (W.elevatorNeedle) W.elevatorNeedle.rotation.z = Math.sin(t * 0.05) * 1.3 + Math.sin(t * 0.31) * 0.05;
    if (R) {
      W.poolNeonClosed.visible = R.poolClosed;
      W.poolNeonOpen.visible = !R.poolClosed;
      W.cookShape.position.x = Math.sin(t * 0.3) * 2.8;
      W.cookShape.visible = R.breakfastActive;
    }
    // clocks: the live clock follows the inn; the fixed clocks show your check-in time
    const T = R ? R.T : START_T;
    const minute = Math.floor(T * 60);
    if (minute !== W._lastMinute) {
      W._lastMinute = minute;
      INN.Tex.drawClock(W.clockCanvas.getContext('2d'), 128, Math.floor(T % 24), (T % 1) * 60);
      W.clockTex.needsUpdate = true;
      const ct = R && R.claimed ? R.claimT : START_T;
      if (W._fixedFor !== ct) {
        W._fixedFor = ct;
        INN.Tex.drawClock(W.fixedClockCanvas.getContext('2d'), 128, Math.floor(ct % 24), (ct % 1) * 60);
        W.fixedClockTex.needsUpdate = true;
      }
    }
    // arcade screens
    W._arcT = (W._arcT || 0) + dt;
    if (W._arcT > 0.08) { W._arcT = 0; W.arcade.forEach((m) => drawArcade(m, t)); }
  }

  function drawArcade(m, t) {
    const R = G.run, g = m.ctx;
    const selfPlay = R && R.selfPlaying.has(m.idx);
    g.fillStyle = '#05080a'; g.fillRect(0, 0, 128, 96);
    g.font = 'bold 9px monospace'; g.fillStyle = '#ffd080'; g.textAlign = 'center';
    if (selfPlay) {
      m.score += Math.floor(Math.random() * 3);
      g.textAlign = 'left'; g.fillText('1UP ' + String(m.score * 10).padStart(6, '0'), 4, 10);
      const ph = t * 2 + m.phase;
      if (m.idx % 3 === 0) { // a ball between two paddles
        const bx = 64 + Math.sin(ph * 1.3) * 54, by = 52 + Math.sin(ph * 2.1) * 30;
        g.fillStyle = '#e8f0ea'; g.fillRect(bx - 2, by - 2, 4, 4);
        g.fillRect(4, by - 10, 3, 20); g.fillRect(121, 52 + Math.sin(ph * 2.1 - 0.3) * 28 - 10, 3, 20);
      } else if (m.idx % 3 === 1) { // a key falling into a hand
        g.fillStyle = '#c9a24a'; g.fillRect(60 + Math.sin(ph) * 40, (ph * 30) % 80 + 12, 6, 10);
        g.fillStyle = '#e8dcc0'; g.fillRect(60 + Math.sin(ph - 0.2) * 40 - 8, 86, 22, 4);
      } else { // corridors, endlessly
        g.strokeStyle = '#5fb3ad';
        for (let i = 0; i < 6; i++) { const s = ((ph * 8 + i * 12) % 72); g.strokeRect(64 - s, 52 - s * 0.6, s * 2, s * 1.2); }
      }
      m.stick.rotation.z = Math.sin(t * 9 + m.phase) * 0.4;
    } else {
      g.fillText(m.title, 64, 36);
      if (Math.floor(t * 1.5 + m.phase) % 2) g.fillText('INSERT COIN', 64, 60);
      g.fillStyle = '#5fb3ad'; g.fillText('FREE PLAY', 64, 84);
      m.stick.rotation.z = 0;
    }
    m.tex.needsUpdate = true;
  }

  function shuffleArcade() {
    const R = G.run;
    R.selfPlaying = new Set(shuffle([0, 1, 2, 3, 4, 5]).slice(0, 2));
  }

  // =============================================================== lights
  function updateLights(dt, intro) {
    const W = G.world, R = G.run;
    const p = intro ? G.camera.position : G.player.pos;
    G.lightsT = (G.lightsT || 0) - dt;
    // the flickering tube: always somewhere just out of sight
    if (R && !intro) flicker(dt, p);
    if (G.lightsT <= 0) {
      G.lightsT = 0.12;
      const z = R && R.zone;
      const cands = [];
      for (const f of W.fixtures) {
        if (f.room) { const rm = W.rooms[f.room]; if (!(z && z.num === f.room) && Math.abs(rm.door.angle) < 0.05) continue; }
        const d = f.pos.distanceToSquared(p);
        if (d < 400) cands.push({ f, d });
      }
      for (const s of [W.neonLight, W.poolNeonLight, ...(W.glowSpots || [])]) cands.push({ f: { pos: s.pos, color: s.color, neon: true }, d: s.pos.distanceToSquared(p) * 0.6 });
      cands.sort((a, b) => a.d - b.d);
      G.lightAssign = cands.slice(0, G.lights.length);
    }
    const fl = R && R.flicker;
    G.lights.forEach((l, i) => {
      const c = G.lightAssign && G.lightAssign[i];
      if (!c) { l.intensity = 0; return; }
      const f = c.f;
      l.position.copy(f.pos);
      l.color.setHex(f.color || 0xfff2d8);
      const d = Math.sqrt(f.pos.distanceToSquared(p));
      let inten = f.neon ? 0.85 : f.dim ? 0.35 : f.warm ? 0.7 : 0.75;
      if (f.neon && f.pos === W.poolNeonLight.pos && (!R || !R.poolClosed)) inten = 0.6;
      inten *= Math.max(0, Math.min(1, (17 - d) / 5));
      if (fl && fl.f === f && fl.off) inten *= 0.05;
      l.intensity = inten;
      l.distance = f.neon ? 14 : 9;
    });
  }

  function flicker(dt, p) {
    const R = G.run, W = G.world;
    const fwd = new V3(-Math.sin(G.player.yaw), 0, -Math.cos(G.player.yaw));
    if (R.flicker) {
      const fl = R.flicker;
      fl.t -= dt; fl.toggle -= dt;
      const to = fl.f.pos.clone().sub(p);
      const seen = to.length() < 14 && to.normalize().dot(fwd) > 0.45;
      if (fl.toggle <= 0) {
        fl.off = !fl.off; fl.toggle = fl.off ? 0.04 + Math.random() * 0.15 : 0.05 + Math.random() * 0.9;
        fl.f.mesh.material = fl.off ? G.offMat : fl.mat;
        if (fl.off) Audio.zap(fl.f.pos);
      }
      if (seen || fl.t <= 0) { fl.f.mesh.material = fl.mat; R.flicker = null; R.flickerT = seen ? 0.5 : 2; }
      return;
    }
    R.flickerT -= dt;
    if (R.flickerT > 0) return;
    const opts = W.fixtures.filter((f) => {
      if (!f.flickerable || f.room) return false;
      const to = f.pos.clone().sub(p); const d = to.length();
      return d > 6 && d < 20 && to.normalize().dot(fwd) < -0.1;
    });
    if (!opts.length) { R.flickerT = 1; return; }
    const f = pick(opts);
    R.flicker = { f, mat: f.mesh.material, t: 6 + Math.random() * 8, toggle: 0, off: false };
  }

  // =============================================================== the audience television
  function renderTV() {
    const W = G.world, room = W.rooms[114];
    if (!room || !W.tvTarget) return;
    const P = G.player;
    if (!(Math.abs(room.door.angle) > 0.05 || (G.run.zone && G.run.zone.num === 114))) return;
    if (P.pos.distanceTo(room.insideWorld) > 9) return;
    G.tvFrame = (G.tvFrame || 0) + 1;
    if (G.tvFrame % 2) return;
    const back = new V3(Math.sin(P.yaw), 0, Math.cos(P.yaw));
    G.tvCam.position.set(P.pos.x + back.x * 2.2, 2.2, P.pos.z + back.z * 2.2);
    G.tvCam.lookAt(P.pos.x - back.x, 1.2, P.pos.z - back.z);
    const r = G.renderer;
    room.tvScreen.visible = false; // never sample the target being drawn
    r.setRenderTarget(W.tvTarget);
    r.render(G.scene, G.tvCam);
    r.setRenderTarget(null);
    room.tvScreen.visible = true;
  }

  // =============================================================== interaction
  const ray = new THREE.Raycaster();
  function targeting() {
    const P = G.player, W = G.world;
    const near = [];
    for (const m of W.interactables) {
      const wp = m.userData.wp;
      if (!wp) continue;
      if (Math.abs(wp.x - P.pos.x) < 4 && Math.abs(wp.z - P.pos.z) < 4 && isVisibleChain(m)) near.push(m);
    }
    G.target = null;
    if (near.length) {
      ray.setFromCamera({ x: 0, y: 0 }, G.camera);
      ray.far = 2.6;
      const hits = ray.intersectObjects(near, false);
      if (hits.length) G.target = hits[0].object;
    }
    const label = G.target ? labelFor(G.target.userData.it) : '';
    UI.prompt(label ? (G.touch ? '' : '[E] ') + label : (!G.locked && !G.dragLook && !G.touch ? 'CLICK TO RESUME THE BROADCAST' : ''));
  }

  function isVisibleChain(o) {
    // allow the invisible hit boxes, but not objects inside hidden rooms
    let p = o.parent;
    while (p) { if (!p.visible) return p.userData.num != null; p = p.parent; }
    return true;
  }

  function labelFor(it) {
    const R = G.run, W = G.world;
    switch (it.type) {
      case 'door': {
        const rm = W.rooms[it.num];
        const open = Math.abs(rm.door.angle) > 0.3;
        if (open) return 'CLOSE DOOR';
        if (rm.kind === 'dnd') return 'OPEN DOOR · DO NOT DISTURB';
        return 'TRY DOOR · ' + (rm.door.plateNum || it.num);
      }
      case 'key': {
        const rm = W.rooms[it.num];
        if (rm.hasKey && rm.key.visible) return R.claimed && R.claimed !== it.num ? 'KEY · ROOM ' + it.num + ' (YOU HAVE A ROOM)' : 'TAKE KEY · ROOM ' + it.num;
        if (R.claimed === it.num && R.holdingKey) return 'HANG KEY ON ITS DOOR';
        return '';
      }
      case 'plaque': return 'READ POSTED RULES';
      case 'clerk': return 'SPEAK WITH THE DESK';
      case 'deskbell': return 'RING FOR SERVICE';
      case 'residents': return 'READ PLAQUE';
      case 'elevator': return 'CALL ELEVATOR';
      case 'stairs': return 'OPEN STAIRWELL';
      case 'glassdoor': case 'gate': case 'servicedoor': return 'TRY DOOR';
      case 'glasselevator': return 'CALL ELEVATOR';
      case 'kitchen': return 'PUSH DOOR · KITCHEN';
      case 'plate': return R.breakfastActive ? 'TAKE A PLATE' : 'PLATES';
      case 'vending': return 'MAKE A SELECTION · ' + INN.VENDING[it.key].title;
      case 'arcade': return 'PLAY · ' + W.arcade[it.idx].title;
      case 'guest': return 'SPEAK TO GUEST';
      case 'bed': return R.claimed === it.num ? 'REST' : '';
      case 'dnditem': return 'TAKE';
      case 'shortcut': return 'TAKE THE STAIRS';
      case 'exitbell': return 'RING';
      case 'attendant': return 'CHECK OUT';
      default: return '';
    }
  }

  G.tryInteract = function () {
    if (!G.target) return;
    const it = G.target.userData.it;
    const fn = ACT[it.type];
    if (fn) fn(it, G.target);
  };

  const ACT = {
    door(it) {
      const R = G.run, rm = G.world.rooms[it.num], d = rm.door;
      if (Math.abs(d.angle) > 0.3) { d.target = 0; Audio.door(rm.doorWorld, false); return; }
      if (rm.kind === 'occupied') { Audio.click(rm.doorWorld); UI.notice('The handle does not turn. Someone is in residence.'); if (Math.random() < 0.5) Audio.tvMurmur(rm.doorWorld); return; }
      if (rm.kind === 'dnd') {
        if (!R.hints['dnd' + it.num]) { R.hints['dnd' + it.num] = true; UI.notice('The placard says DO NOT DISTURB. The door is not locked.'); }
        d.target = -1.45; Audio.door(rm.doorWorld, true); return;
      }
      if (R.claimed === it.num && R.holdingKey) { d.target = -1.45; Audio.door(rm.doorWorld, true); return; }
      Audio.click(rm.doorWorld);
      if (R.claimed === it.num && R.keyReturned) UI.notice('Locked. Your key hangs beside the door, where it belongs.');
      else if (rm.hasKey) UI.notice('Locked. A key hangs beside the door.');
      else UI.notice('Locked. There is no key for this room.');
    },
    key(it) {
      const R = G.run, rm = G.world.rooms[it.num];
      if (rm.hasKey && rm.key.visible) {
        if (R.claimed && R.claimed !== it.num) { UI.notice('You already have a room. The inn does not permit two.'); return; }
        rm.key.visible = false;
        Audio.keys(rm.doorWorld);
        R.holdingKey = true; R.keyReturned = false;
        if (!R.claimed) {
          R.claimed = it.num; R.claimT = R.T; R.hkNext = R.T + 48; R.hk = {};
          R.stamps.push({ text: 'ROOM ' + it.num, color: 'blue' });
          if (rm.luggage) rm.luggage.visible = true;
          G.say('Thank you. The room is yours. Housekeeping will arrive in forty-eight hours. Please consult your wristwatch.');
          // later, the announcement that gets your number wrong
          sched(R.T + 24 + Math.random() * 6, wrongNumber);
        } else UI.notice('You take your key back. The room is yours again.');
        return;
      }
      if (R.claimed === it.num && R.holdingKey) {
        G.openPaper({
          title: 'Form 12 \u00b7 Return of Key',
          body: 'THE GUEST WISHES TO RETURN THE KEY TO ROOM ' + it.num + ' TO ITS DOOR.\n\nTHE DOOR WILL LOCK. THE ROOM REMAINS ON THE GUEST\u2019S FOLIO, AND HOUSEKEEPING WILL CONTINUE AS SCHEDULED.',
          options: [
            { label: 'Hang the key on its hook.', fn: () => {
              UI.closePaper();
              rm.key.visible = true;
              Audio.keys(rm.doorWorld);
              R.holdingKey = false; R.keyReturned = true;
              rm.door.target = 0;
              if (!R.stamps.some((s) => s.text === 'KEY RETURNED')) R.stamps.push({ text: 'KEY RETURNED', color: 'green' });
              UI.notice('You hang the key on its hook. The door is locked now.');
            } },
            { label: 'Keep the key for now.', fn: () => UI.closePaper() },
          ],
        });
      }
    },
    bed(it) {
      const R = G.run;
      if (R.claimed !== it.num) return;
      if (R.hkNext - R.T < 8) { UI.notice('You cannot sleep. Something is scheduled.'); return; }
      G.state = 'resting';
      UI.hud(false);
      let f = 1;
      const iv = setInterval(() => { f -= 0.05; G.fade = Math.max(0, f); if (f <= 0) { clearInterval(iv); done(); } }, 40);
      function done() {
        R.T += 3; R.composure = Math.min(100, R.composure + 14);
        runEvents();
        setTimeout(() => {
          let k = 0;
          const iv2 = setInterval(() => { k += 0.05; G.fade = Math.min(1, k); if (k >= 1) { clearInterval(iv2); G.fade = 1; G.state = 'play'; UI.hud(true); UI.notice('You rest. When you wake, the towels have been moved.'); } }, 40);
        }, 600);
      }
    },
    plaque(it) {
      const R = G.run, P = INN.RULES[it.key];
      R.rulesRead.add(it.key);
      G.openPaper({
        letterhead: false,
        html: '<div class="plaque"><h2>' + P.title + '</h2><div style="text-align:center;font-size:12px;letter-spacing:2px">THE MANAGEMENT THANKS YOU</div><ol>' + P.lines.map((l) => '<li>' + l + '</li>').join('') + '</ol></div>',
        footer: 'A copy of these rules has been entered in your folio.',
      });
    },
    clerk() { clerkMenu(); },
    deskbell() { Audio.deskBell(new V3(2.6, 1.2, -8.3)); setTimeout(clerkMenu, 500); },
    residents() {
      const names = G.store.residents || [];
      G.openPaper({ title: 'Guests in Residence', body: names.length ? names.map((n) => '• ' + n.toUpperCase()).join('\n') + '\n\nWHO HAVE DECIDED TO STAY WITH US.' : 'NO NAMES HAVE BEEN ENGRAVED.\n\nTHERE IS ROOM.' });
    },
    elevator() { Audio.click(new V3(10.3, 1.2, -11.8)); UI.notice('A card in the slot reads: OUT OF SERVICE. GUESTS ARE ASKED TO USE THE STAIRS.'); },
    stairs() { Audio.click(G.player.pos); UI.notice('The stairwell door is locked from the other side. The sign says FLOOR 1 OF 1. The elevator disagrees.'); },
    glassdoor() { UI.notice('Beyond the glass there is no parking lot. There is a pink light, very far away.'); },
    gate() { UI.notice('The gate is chained. Beyond it, the dark smells of chlorine and highway.'); },
    servicedoor() { UI.notice('SERVICE ENTRANCE. It does not open from this side.'); },
    glasselevator() {
      breakRule('garden', 1);
      Audio.deskBell(new V3(2.25, 1.2, -75.8));
      UI.notice('Far above, the car stops. It does not come down. Someone inside turns to look at the button you pressed.', 6);
    },
    kitchen() {
      breakRule('dining', 1);
      Audio.click(new V3(7, 1, 31.9));
      UI.notice('You push the door. It gives an inch, and something on the other side stops talking.');
    },
    plate() {
      const R = G.run;
      if (!R.breakfastActive) { UI.notice('The plates are stacked and clean. Breakfast is served at the bell.'); return; }
      R.plates++;
      if (R.plates > 1) {
        breakRule('dining', 0);
        UI.notice('You take a second plate. It is exactly the same as the first.');
        return;
      }
      R.ateThisCycle = true; R.breakfasts++; R.missedStreak = 0;
      R.composure = Math.min(100, R.composure + 25);
      R.stamps.push({ text: 'BREAKFAST', color: 'green' });
      Audio.stamp();
      UI.notice('Eggs, toast, half a grapefruit, coffee. It is exactly right. It is the first thing here that is.', 5);
      if (R.breakfasts === 1) setTimeout(() => G.say('Well done. A guest who eats is a guest who stays alert.'), 3000);
    },
    vending(it) { vendingMenu(it.key); },
    arcade(it) { arcadePlay(it.idx); },
    guest(it) {
      const R = G.run, g = it.guest;
      if (g.area === 'atrium' && g.spec.pose === 'sit') breakRule('atrium', 1);
      UI.notice(R.attention > 0 ? 'They do not answer. They are already looking at you.' : 'They do not respond. They do not need to.');
    },
    dnditem(it, mesh) {
      const R = G.run, rm = G.world.rooms[it.num], I = INN.DND_ITEMS[it.item];
      if (R.items.some((x) => x.id === it.item)) return;
      R.items.push({ id: it.item, name: I.name });
      (rm.item || mesh).visible = false;
      mesh.visible = false;
      G.world.interactables = G.world.interactables.filter((m) => m !== mesh);
      R.composure -= 30;
      G.vhs.pulse(1, 0.5);
      Audio.staticBurst(0.4);
      UI.notice(I.name + '. ' + I.note, 6);
    },
    shortcut() {
      const R = G.run;
      G.vhs.pulse(1, 0.9); Audio.staticBurst(0.6);
      const ex = G.world.exits.east;
      G.player.pos.set(ex.standPos.x, 0, ex.standPos.z);
      G.player.yaw = -Math.PI / 2;
      UI.notice('The stairs go down one flight and open onto a vestibule you have already been to.', 5);
      R.composure -= 4;
    },
    exitbell(it) {
      const R = G.run, ex = G.world.exits[it.exit];
      Audio.deskBell(ex.lampPos);
      if (it.exit !== R.liveExit) { setTimeout(() => UI.notice('The lamp is dark. No one comes.'), 900); return; }
      if (checkoutReady()) { startCheckout(it.exit); return; }
      setTimeout(() => G.say('An attendant will be with you when your folio is complete.'), 900);
    },
    attendant(it) { startCheckout(it.exit); },
  };

  // =============================================================== the desk
  function clerkMenu() {
    G.openPaper({
      title: 'Guest Inquiry',
      speaker: 'The clerk smiles without moving the smile, and slides a pad of printed forms across the desk. You may select one.',
      options: INN.FORMS.map((f) => ({
        label: f.q, fn: () => {
          G.openPaper({ title: f.form, body: f.body, stamp: { text: 'FILED', color: 'blue' }, options: [{ label: 'Ask something else.', fn: () => clerkMenu() }, { label: 'Thank you.', fn: () => UI.closePaper() }] });
        },
      })).concat([{ label: 'Nothing, thank you.', fn: () => UI.closePaper() }]),
    });
  }

  // =============================================================== vending
  function vendingMenu(key) {
    const V = INN.VENDING[key], R = G.run;
    const vm = G.world.vending.find((v) => v.key === key);
    G.openPaper({
      title: V.title + ' · Make a Selection',
      speaker: V.shoes ? 'Every coil holds a shoe. A card reads: NO CHARGE. IT HAS BEEN TAKEN CARE OF.' : 'A card reads: NO CHARGE. IT HAS BEEN TAKEN CARE OF.',
      options: V.items.map((item, i) => ({
        label: String.fromCharCode(65 + i) + (i + 1) + '  ' + item.name, fn: () => {
          UI.closePaper();
          Audio.vend(vm.pos);
          if (V.shoes) {
            R.shoes.push(item.name);
            const desc = item.name === 'HOUSE SLIPPER' ? 'Monogrammed with ' + initials() + '.' : item.desc;
            setTimeout(() => UI.notice(item.name + '. ' + desc, 5), 900);
            return;
          }
          setTimeout(() => eatWrong(item), 900);
        },
      })).concat([{ label: 'Make no selection.', fn: () => UI.closePaper() }]),
    });
  }

  function initials() { return (G.name || 'X').split(/\s+/).map((w) => w[0]).join('').toUpperCase(); }

  function eatWrong(item) {
    const R = G.run;
    R.wrongFoods++;
    R.foods.push(item.name);
    R.composure = Math.min(100, R.composure + 4);
    UI.notice('You eat the ' + item.name.toLowerCase() + '. ' + item.desc + ' It is almost right.', 5);
    switch (item.effect) {
      case 'skip': {
        const h = 4 + Math.random() * 3;
        G.vhs.pulse(1, 1); Audio.staticBurst(0.8);
        R.T += h;
        break;
      }
      case 'loop': R.effects.loop = 60; break;
      case 'hue': R.effects.hue = 50; break;
      case 'slow': R.effects.slow = 60; break;
      case 'echo': R.effects.echo = 70; break;
    }
    if (R.wrongFoods >= 3) setTimeout(() => G.lose('food'), 2500);
  }

  // =============================================================== arcade
  function arcadePlay(idx) {
    const R = G.run, m = G.world.arcade[idx];
    if (R.selfPlaying.has(idx)) {
      breakRule('arcade', 0);
      UI.notice('You take the controls. The screen keeps playing without you, and now it is losing.', 5);
      return;
    }
    R.games++;
    if (R.games > 1) breakRule('arcade', 1);
    Audio.gameBlip(m.pos);
    const ticket = 'TICKET No. ' + (1000 + Math.floor(Math.random() * 9000)) + ' · THE EXIT IS PRESENTLY AT THE ' + INN.EXIT_NAMES[R.liveExit];
    R.tickets.push(ticket);
    G.openPaper({
      letterhead: false,
      title: m.title,
      html: '<div class="body" style="background:#05080a;color:#ffd080;padding:18px;font-family:VT323,monospace;font-size:22px;text-align:center">GAME OVER<br><br>A TICKET PRINTS:<br><br>' + UI.esc(ticket) + '<br><br><span style="color:#5fb3ad">VALID UNTIL THE NEXT RELOCATION</span></div>',
      footer: 'The ticket has been entered in your folio.',
    });
  }

  // =============================================================== the wrong room number
  function wrongNumber() {
    const R = G.run;
    if (!R.claimed || R.wrongRoom) return;
    const opts = [];
    for (let n = 101; n <= 120; n++) if (n !== R.claimed && Math.abs(n - R.claimed) <= 4) opts.push(n);
    R.wrongRoom = pick(opts);
    G.pa('Would the guest in room ' + R.wrongRoom + ' please remain where they are. Thank you.').then(() => {
      const rm = G.world.rooms[R.claimed];
      rm.door.plateMat.map = INN.Tex.doorPlate(R.wrongRoom);
      rm.door.plateMat.needsUpdate = true;
      rm.door.plateNum = R.wrongRoom;
    });
  }

  // =============================================================== folio
  G.openFolio = function () { G.openPaper(folioOpts()); };

  function folioOpts(back) {
    const R = G.run;
    const stamps = R.stamps.map((s) => '<span class="stamp ' + s.color + '">' + s.text + '</span>').join('');
    const rules = [...R.rulesRead].map((k) => INN.RULES[k].short.map((s) => '<li>' + s + '</li>').join('')).join('');
    const list = (a) => (a.length ? a.map((x) => UI.esc(x)).join('<br>') : '—');
    const html =
      '<div class="twocol">' +
      '<div><b>GUEST</b><br>' + UI.esc(G.name).toUpperCase() + '</div>' +
      '<div><b>KEY TAG</b><br>' + (R.claimed ? 'ROOM ' + R.claimed + (R.holdingKey ? ' (IN HAND)' : R.keyReturned ? ' (ON ITS DOOR)' : '') : 'NO ROOM ASSIGNED') + '</div>' +
      '<div><b>CHECK-IN</b><br>' + R.checkInText + '</div>' +
      '<div><b>VEHICLE</b><br>' + (UI.esc(G.vehicle).toUpperCase() || '—') + '</div>' +
      '</div>' +
      '<div class="stamps">' + stamps + '</div>' +
      '<div class="twocol">' +
      '<div><b>RULES ON FILE</b><ul class="rules" style="padding-left:18px;margin:4px 0">' + (rules || '<li>None. Plaques are posted by each door.</li>') + '</ul></div>' +
      '<div><b>INCIDENTALS</b><br>' + list(R.foods.concat(R.shoes)) + '<br><br><b>ARTICLES</b><br>' + list(R.items.map((i) => i.name)) + '</div>' +
      '</div>' +
      '<div style="margin-top:10px"><b>TICKETS</b><br>' + list(R.tickets) + '</div>' +
      '<div style="margin-top:10px"><b>GUEST CONDUCT</b> · ' + (R.conduct.length ? 'NOTED (' + R.conduct.length + ')' : 'SATISFACTORY') + '</div>';
    return {
      title: 'Guest Folio', html, closable: true,
      footer: 'CHECK-OUT REQUIRES: ONE HOUSEKEEPING SERVICE · ONE BREAKFAST · KEY RETURNED TO ITS DOOR.',
      onClose: back ? () => back() : undefined,
    };
  }

  // =============================================================== checkout
  function startCheckout(exitId) {
    const R = G.run;
    G.state = 'checkout';
    G.releaseLock();
    UI.prompt('');
    const qs = [];
    // 1. room number: the folio knows; the door may not
    const nums = new Set([R.claimed]);
    if (R.wrongRoom) nums.add(R.wrongRoom);
    while (nums.size < 3) nums.add(101 + Math.floor(Math.random() * 20));
    const numOpts = shuffle([...nums]);
    qs.push({ q: 'Good evening. Checking out? May I have your room number, please?', a: numOpts.map((n) => 'Room ' + n + '.'), correct: numOpts.indexOf(R.claimed) });
    // 2-3. the rules, as posted. The broadcast's versions are offered too.
    const said = [...R.falseSaid].filter((id) => INN.CHECKOUT_RULE_Q[id]);
    const pool = shuffle(Object.keys(INN.CHECKOUT_RULE_Q).filter((k) => !said.includes(k)));
    const ruleIds = said.concat(pool).slice(0, 2 + (G.level > 0 ? 1 : 0));
    ruleIds.forEach((id) => {
      const Q = INN.CHECKOUT_RULE_Q[id];
      const order = shuffle([0, 1, 2]);
      qs.push({ q: Q.q, a: order.map((i) => Q.a[i]), correct: order.indexOf(Q.correct) });
    });
    // 4. belongings
    const carrying = R.items.length > 0;
    const bel = shuffle(['No.', 'Only what I brought.', 'Yes. I would like to return it.']);
    qs.push({ q: 'Are you leaving with anything that belongs to the Inn?', a: bel, correct: bel.indexOf(carrying ? 'Yes. I would like to return it.' : 'No.'), after: carrying ? 'Thank you. We will see that it is returned to its room.' : null });
    // 5. if the guests noticed
    if (R.attention > 0) {
      const ap = shuffle(['I apologize for the disturbance.', 'I didn’t do anything.', 'Nothing.']);
      qs.push({ q: 'Some of our guests have remarked on you. Is there anything you would like to say?', a: ap, correct: ap.indexOf('I apologize for the disturbance.') });
    }
    let i = 0;
    const ask = () => {
      const Q = qs[i];
      UI.paper({
        title: 'Check-Out · ' + INN.EXIT_NAMES[exitId],
        speaker: 'THE ATTENDANT',
        html: '<div class="body" style="font-size:17px">“' + UI.esc(Q.q) + '”</div>',
        closable: false,
        options: Q.a.map((a, k) => ({
          label: a, fn: () => {
            if (k !== Q.correct) return extended();
            i++;
            if (i >= qs.length) return success();
            if (Q.after) { UI.notice(Q.after, 3); }
            ask();
          },
        })),
      });
    };
    ask();

    function extended() {
      UI.paper({
        title: 'Check-Out · ' + INN.EXIT_NAMES[exitId],
        speaker: 'THE ATTENDANT',
        html: '<div class="body" style="font-size:17px">“I see. Thank you. We have extended your stay.”</div>',
        closable: false,
        stamp: { text: 'EXTENDED STAY', color: 'red' },
        options: [{ label: 'Sign here.', fn: () => { UI.closePaper(); G.extendStay(); } }],
      });
    }
    function success() {
      UI.paper({
        title: 'Check-Out · ' + INN.EXIT_NAMES[exitId],
        speaker: 'THE ATTENDANT',
        html: '<div class="body" style="font-size:17px">“Everything is in order. Thank you for staying at the Inn Between. Please drive safely.”</div>',
        closable: false,
        stamp: { text: 'CHECKED OUT', color: 'green' },
        options: [{ label: 'Sign here.', fn: () => { UI.closePaper(); G.win(); } }],
      });
    }
  }

  // =============================================================== endings
  G.extendStay = function () {
    G.extendedStays++;
    G.level++;
    G.state = 'standby';
    UI.hud(false);
    UI.clearCaptions();
    Audio.cartStop(); Audio.stopMuzak(true);
    UI.card('standby', { line1: 'PLEASE STAND BY', line2: 'YOUR STAY HAS BEEN EXTENDED' });
    setTimeout(() => { G.buildRun(false); G.beginPlay(false); }, 900);
  };

  G.lose = function (reason) {
    if (G.state === 'lost') return;
    G.state = 'lost';
    G.releaseLock();
    UI.closePaper();
    UI.clearCaptions();
    UI.hud(false);
    Audio.cartStop(); Audio.stopMuzak(true);
    const why = {
      composure: 'THE GUEST’S COMPOSURE HAS BEEN RETURNED TO THE MANAGEMENT.',
      housekeeping: 'THE GUEST WAS PRESENT FOR HOUSEKEEPING.',
      food: 'THE GUEST HAS DEVELOPED A TASTE FOR THE INN.',
    }[reason];
    // engrave the name for the next broadcast
    const names = G.store.residents || [];
    names.push(G.name || 'A GUEST');
    G.store.residents = names.slice(-9);
    save(G.store);
    // the lights simply go out
    let f = 1;
    const iv = setInterval(() => {
      f -= 0.03; G.fade = Math.max(0, f);
      if (reason === 'housekeeping' && f > 0.5 && f < 0.56) Audio.sheets(G.camera.position);
      if (f <= 0) {
        clearInterval(iv);
        G.fade = 1;
        Audio.staticBurst(1.2);
        UI.card('static');
        setTimeout(() => {
          UI.card('html', {
            html: '<div class="bigtitle">The guest has decided<br>to stay with us.</div>' +
              '<div class="subtitle">' + why + '</div><div style="height:4vh"></div>' + UI.lethalityHTML('THIS BROADCAST WILL NOW RESUME FROM THE BEGINNING. THE GUEST’S NAME HAS BEEN ENGRAVED.') +
              '<div class="press" data-go>PRESS ▶ PLAY TO BEGIN A NEW BROADCAST</div>',
            onClick: () => G.newBroadcast(),
          });
          setTimeout(() => G.say('The guest has decided to stay with us. Thank you for watching.', { tag: '◉ AN EDUCATIONAL BROADCAST' }), 600);
        }, 1400);
      }
    }, 50);
  };

  G.newBroadcast = function () {
    UI.clearCaptions();
    G.level = 0; G.extendedStays = 0; G.name = '';
    G.buildRun(true);
    G.introCam = { t: 0 };
    G.registration();
  };

  G.win = function () {
    G.state = 'standby';
    UI.hud(false);
    UI.clearCaptions();
    Audio.cartStop(); Audio.stopMuzak(true);
    UI.card('standby', { line1: 'CHECK-OUT COMPLETE', line2: 'PLEASE STAND BY' });
    const room = G.run.claimed;
    const playTime = G.run.playTime;
    setTimeout(() => {
      UI.card('none');
      G.ending = new INN.Ending(G.renderer, room);
      G.endT = 0;
      G.state = 'ending';
      Audio.engine(true);
      setTimeout(() => G.say('Thank you for staying at the Inn Between.'), 3500);
      setTimeout(() => G.say('Please drive safely. The road is very long, and the Inn is never far from it.'), 9000);
      setTimeout(() => {
        Audio.engine(false);
        const mins = Math.floor(playTime / 60), secs = Math.floor(playTime % 60);
        UI.card('html', {
          html: '<div class="bigtitle">Thank you for watching.</div>' +
            '<div class="subtitle">GUEST: ' + UI.esc(G.name).toUpperCase() + ' · ROOM ' + room + ' · EXTENDED STAYS: ' + G.extendedStays + ' · TIME ON TAPE: ' + mins + ':' + String(secs).padStart(2, '0') + '</div>' +
            '<div class="subtitle" style="margin-top:3vh">THIS HAS BEEN AN EDUCATIONAL BROADCAST.</div>' +
            '<div class="press" data-go>PRESS ▶ PLAY TO BEGIN A NEW BROADCAST</div>',
          onClick: () => { G.ending = null; G.newBroadcast(); },
        });
        G.state = 'boot-end';
      }, 19000);
    }, 2200);
  };

  // =============================================================== formatting
  const MONTHS = ['JAN.', 'FEB.', 'MAR.', 'APR.', 'MAY', 'JUN.', 'JUL.', 'AUG.', 'SEP.', 'OCT.', 'NOV.', 'DEC.'];
  function fmtClock(T, withDay) {
    const h = Math.floor(T % 24), m = Math.floor((T % 1) * 60);
    const hh = ((h + 11) % 12) + 1;
    const s = hh + ':' + String(m).padStart(2, '0') + (h < 12 ? ' AM' : ' PM');
    return withDay ? 'DAY ' + (Math.floor((T - START_T + 20) / 24) + 1) + ', ' + s : s;
  }
  let dateGlitch = 0, dateGlitchText = '';
  function dateStamp(T) {
    if (dateGlitch > 0) { dateGlitch -= 1 / 60; return dateGlitchText; }
    if (Math.random() < 0.0003) {
      dateGlitch = 0.6 + Math.random();
      dateGlitchText = pick(['FEB. 30 1978', 'OCT. 48 1978', 'NOV. 31 1978', 'DEC. 00 1978', 'OCT. 11 1987', 'OCT. 11 19––', '––– –– ––––']) + '  ' + fmtClock(T);
      return dateGlitchText;
    }
    const day = 11 + Math.floor((T - START_T + 20) / 24);
    const d = new Date(1978, 9, day);
    return MONTHS[d.getMonth()] + ' ' + String(d.getDate()).padStart(2, '0') + ' 1978  ' + fmtClock(T);
  }

  addEventListener('load', G.boot);
})(window.INN);
