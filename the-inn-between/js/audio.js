// THE INN BETWEEN — all sound is synthesized. Hum, hiss, bells, chimes, muzak.
window.INN = window.INN || {};
(function (INN) {
  'use strict';

  const A = {
    ctx: null, master: null, sfx: null, reverb: null, ambience: null,
    muzakBus: null, whisperGain: null, ready: false,
    muzakOn: false, muzakTimer: 0, muzakVolume: 0.5, muzakPitch: 0,
    loops: {}, cart: null, duck: 1,
  };

  let noiseBuf = null;

  A.init = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = A.ctx = new AC();
    A.master = ctx.createGain(); A.master.gain.value = 0.9;
    A.master.connect(ctx.destination);
    A.sfx = ctx.createGain(); A.sfx.connect(A.master);
    A.reverb = ctx.createConvolver(); A.reverb.buffer = impulse(2.8, 2.2);
    const rv = ctx.createGain(); rv.gain.value = 0.55;
    A.reverb.connect(rv); rv.connect(A.master);
    A.ambience = ctx.createGain(); A.ambience.connect(A.master);

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    buildHum();
    buildHiss();
    buildWhispers();
    buildMuzakBus();
    A.ready = true;
  };

  function impulse(sec, decay) {
    const ctx = A.ctx, len = ctx.sampleRate * sec;
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  }

  function noise(loop) {
    const s = A.ctx.createBufferSource();
    s.buffer = noiseBuf; s.loop = !!loop;
    return s;
  }

  function panner(pos) {
    const p = A.ctx.createPanner();
    p.panningModel = 'HRTF'; p.distanceModel = 'inverse';
    p.refDistance = 2.5; p.maxDistance = 60; p.rolloffFactor = 1.3;
    setPos(p, pos);
    p.connect(A.sfx);
    const send = A.ctx.createGain(); send.gain.value = 0.35;
    p.connect(send); send.connect(A.reverb);
    return p;
  }

  function setPos(p, pos) {
    if (p.positionX) { p.positionX.value = pos.x; p.positionY.value = pos.y; p.positionZ.value = pos.z; }
    else p.setPosition(pos.x, pos.y, pos.z);
  }

  function out(pos, wet) {
    if (pos) return panner(pos);
    const g = A.ctx.createGain(); g.connect(A.sfx);
    if (wet) { const s = A.ctx.createGain(); s.gain.value = wet; g.connect(s); s.connect(A.reverb); }
    return g;
  }

  A.setListener = function (pos, fwd) {
    if (!A.ready) return;
    const l = A.ctx.listener, t = A.ctx.currentTime;
    if (l.positionX) {
      l.positionX.setTargetAtTime(pos.x, t, 0.02); l.positionY.setTargetAtTime(pos.y, t, 0.02); l.positionZ.setTargetAtTime(pos.z, t, 0.02);
      l.forwardX.setTargetAtTime(fwd.x, t, 0.02); l.forwardY.setTargetAtTime(fwd.y, t, 0.02); l.forwardZ.setTargetAtTime(fwd.z, t, 0.02);
      l.upX.value = 0; l.upY.value = 1; l.upZ.value = 0;
    } else {
      l.setPosition(pos.x, pos.y, pos.z);
      l.setOrientation(fwd.x, fwd.y, fwd.z, 0, 1, 0);
    }
  };

  // ------------------------------------------------------------ constant beds
  function buildHum() {
    const ctx = A.ctx;
    const g = ctx.createGain(); g.gain.value = 0.045; g.connect(A.ambience);
    A.humGain = g;
    [60, 120, 180].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = i === 1 ? 'sawtooth' : 'sine'; o.frequency.value = f;
      const og = ctx.createGain(); og.gain.value = [0.6, 0.12, 0.25][i];
      if (i === 1) { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; o.connect(lp); lp.connect(og); }
      else o.connect(og);
      og.connect(g); o.start();
    });
    const n = noise(true), bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 7200; bp.Q.value = 3;
    const ng = ctx.createGain(); ng.gain.value = 0.05; n.connect(bp); bp.connect(ng); ng.connect(g); n.start();
  }

  function buildHiss() {
    const ctx = A.ctx;
    const n = noise(true), hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
    const g = ctx.createGain(); g.gain.value = 0.012;
    n.connect(hp); hp.connect(g); g.connect(A.master); n.start();
    A.hissGain = g;
  }

  function buildWhispers() {
    const ctx = A.ctx;
    A.whisperGain = ctx.createGain(); A.whisperGain.gain.value = 0;
    A.whisperGain.connect(A.master);
    const s = ctx.createGain(); s.gain.value = 0.6; A.whisperGain.connect(s); s.connect(A.reverb);
    for (let v = 0; v < 3; v++) {
      const n = noise(true);
      const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 9;
      const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.Q.value = 12;
      const amp = ctx.createGain(); amp.gain.value = 0;
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
      if (pan.pan) pan.pan.value = (v - 1) * 0.8;
      n.connect(f1); f1.connect(f2); f2.connect(amp); amp.connect(pan); pan.connect(A.whisperGain);
      n.start(ctx.currentTime + v * 0.37);
      const sched = () => {
        if (!A.ctx) return;
        const t = ctx.currentTime;
        const syl = 3 + Math.floor(Math.random() * 6);
        let tt = t;
        for (let i = 0; i < syl; i++) {
          const d = 0.08 + Math.random() * 0.18;
          f1.frequency.setValueAtTime(500 + Math.random() * 1600, tt);
          f2.frequency.setValueAtTime(1200 + Math.random() * 2400, tt);
          amp.gain.setValueAtTime(0, tt);
          amp.gain.linearRampToValueAtTime(0.9 + Math.random(), tt + d * 0.3);
          amp.gain.linearRampToValueAtTime(0, tt + d);
          tt += d + Math.random() * 0.06;
        }
        setTimeout(sched, (tt - t) * 1000 + 300 + Math.random() * 2200);
      };
      setTimeout(sched, 400 + v * 700);
    }
  }

  A.setWhispers = function (level) {
    if (!A.ready) return;
    A.whisperGain.gain.setTargetAtTime(Math.max(0, level) * 0.22, A.ctx.currentTime, 0.4);
  };

  A.setHum = function (on) {
    if (!A.ready) return;
    A.humGain.gain.setTargetAtTime(on ? 0.045 : 0.0, A.ctx.currentTime, on ? 1.5 : 0.05);
  };

  // --------------------------------------------------------------- muzak
  // Slow, warped lounge covers of songs that do not exist.
  function buildMuzakBus() {
    const ctx = A.ctx;
    A.muzakBus = ctx.createGain(); A.muzakBus.gain.value = 0;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 320;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    const sh = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * 1.8); }
    sh.curve = curve;
    A.muzakBus.connect(hp); hp.connect(lp); lp.connect(sh);
    const out = ctx.createGain(); out.gain.value = 0.55; sh.connect(out); out.connect(A.master);
    const s = ctx.createGain(); s.gain.value = 0.7; sh.connect(s); s.connect(A.reverb);
    // tape wobble shared by every voice
    A.wow = ctx.createOscillator(); A.wow.frequency.value = 0.55;
    A.wowDepth = ctx.createGain(); A.wowDepth.gain.value = 14;
    A.wow.connect(A.wowDepth); A.wow.start();
    A.flutter = ctx.createOscillator(); A.flutter.frequency.value = 6.3;
    const fd = ctx.createGain(); fd.gain.value = 3; A.flutter.connect(fd); fd.connect(A.wowDepth); A.flutter.start();
  }

  const KEYS = [57, 53, 50, 55]; // A, F, D, G roots (midi) for an invented standard
  const CHORDS = [[0, 4, 7, 11], [0, 3, 7, 10], [0, 4, 7, 9], [0, 3, 7, 10], [0, 4, 7, 11], [0, 5, 7, 10]];
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function epNote(freq, t, dur, vel) {
    const ctx = A.ctx;
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    o1.type = 'sine'; o2.type = 'triangle';
    o1.frequency.value = freq; o2.frequency.value = freq * 2.003;
    const base = -55 + A.muzakPitch; // a quarter tone too slow
    o1.detune.value = base; o2.detune.value = base;
    A.wowDepth.connect(o1.detune); A.wowDepth.connect(o2.detune);
    const g = ctx.createGain(), g2 = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.02);
    g.gain.exponentialRampToValueAtTime(vel * 0.35, t + 0.5);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    g2.gain.setValueAtTime(vel * 0.25, t); g2.gain.exponentialRampToValueAtTime(0.0005, t + 0.6);
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(A.muzakBus);
    o1.start(t); o2.start(t); o1.stop(t + dur + 0.1); o2.stop(t + dur + 0.1);
    o1.onended = () => {
      try { A.wowDepth.disconnect(o1.detune); A.wowDepth.disconnect(o2.detune); } catch (e) { /* gone */ }
    };
  }

  let muzakNext = 0, muzakBar = 0, muzakKey = 57, melodyNote = 0;
  function scheduleMuzak() {
    if (!A.muzakOn) return;
    const ctx = A.ctx;
    const beat = 60 / 54; // a ballad, slowed
    while (muzakNext < ctx.currentTime + 1.5) {
      const ch = CHORDS[muzakBar % CHORDS.length];
      const root = muzakKey + [0, 5, -3, 2, 0, 7][muzakBar % 6];
      const t = muzakNext;
      // pad chord
      ch.forEach((iv, i) => epNote(mtof(root + iv - 12 + (i > 1 ? 12 : 0)), t + i * 0.03, beat * 4, 0.07));
      epNote(mtof(root - 24), t, beat * 3.5, 0.09);
      // a melody that almost resolves
      const scale = [0, 2, 4, 7, 9, 11, 12, 14];
      for (let b = 0; b < 4; b++) {
        if (Math.random() < 0.35) continue;
        melodyNote = Math.max(0, Math.min(scale.length - 1, melodyNote + Math.floor(Math.random() * 3) - 1));
        const len = beat * (Math.random() < 0.3 ? 2 : 1);
        epNote(mtof(root + 12 + scale[melodyNote]), t + b * beat + (Math.random() * 0.04), len * 1.2, 0.06);
      }
      muzakNext += beat * 4;
      muzakBar++;
    }
  }

  A.startMuzak = function () {
    if (!A.ready || A.muzakOn) return;
    A.muzakOn = true;
    muzakKey = KEYS[Math.floor(Math.random() * KEYS.length)];
    muzakNext = A.ctx.currentTime + 0.2; muzakBar = 0;
    A.muzakBus.gain.setTargetAtTime(A.muzakVolume * A.duck, A.ctx.currentTime, 1.2);
  };
  A.stopMuzak = function (fast) {
    if (!A.ready || !A.muzakOn) return;
    A.muzakOn = false;
    A.muzakBus.gain.setTargetAtTime(0, A.ctx.currentTime, fast ? 0.05 : 1.5);
  };
  A.setMuzakVolume = function (v) {
    A.muzakVolume = v;
    if (A.ready && A.muzakOn) A.muzakBus.gain.setTargetAtTime(v * A.duck, A.ctx.currentTime, 0.8);
  };

  // ------------------------------------------------------------ one-shots
  A.update = function (dt) {
    if (!A.ready) return;
    scheduleMuzak();
  };

  function tone(freq, dur, type, vol, pos, opts) {
    opts = opts || {};
    const ctx = A.ctx, t = ctx.currentTime + (opts.delay || 0);
    const o = ctx.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (opts.slide) o.frequency.exponentialRampToValueAtTime(opts.slide, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + (opts.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    o.connect(g); g.connect(out(pos, opts.wet)); o.start(t); o.stop(t + dur + 0.05);
  }

  function burst(dur, f, q, vol, pos, opts) {
    opts = opts || {};
    const ctx = A.ctx, t = ctx.currentTime + (opts.delay || 0);
    const n = noise(false), bp = ctx.createBiquadFilter();
    bp.type = opts.type || 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + (opts.attack || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    n.connect(bp); bp.connect(g); g.connect(out(pos, opts.wet));
    n.start(t, Math.random()); n.stop(t + dur + 0.05);
  }

  A.paChime = function () {
    if (!A.ready) return;
    [[659.3, 0], [523.3, 0.55], [392, 1.1]].forEach(([f, d]) => {
      tone(f, 1.8, 'sine', 0.16, null, { delay: d, wet: 0.8 });
      tone(f * 2, 1.2, 'sine', 0.04, null, { delay: d, wet: 0.8 });
    });
  };

  A.breakfastBell = function () {
    if (!A.ready) return;
    for (let i = 0; i < 3; i++) {
      [1, 2.76, 5.4, 8.9].forEach((m, j) => tone(880 * m, 2.4 / (j + 1), 'sine', 0.12 / (j + 1), null, { delay: i * 0.9, wet: 1 }));
    }
  };

  A.door = function (pos, open) {
    if (!A.ready) return;
    if (open) {
      tone(180, 0.5, 'sawtooth', 0.02, pos, { slide: 140, attack: 0.1 });
      burst(0.25, 400, 2, 0.08, pos);
    } else {
      tone(70, 0.35, 'sine', 0.35, pos, { slide: 40 });
      burst(0.12, 900, 1.5, 0.15, pos);
    }
  };

  A.click = function (pos) { if (A.ready) burst(0.04, 3000, 4, 0.12, pos); };
  A.keys = function (pos) {
    if (!A.ready) return;
    for (let i = 0; i < 5; i++) tone(3200 + Math.random() * 2400, 0.25, 'sine', 0.03, pos, { delay: i * 0.05 });
  };
  A.stamp = function () { if (!A.ready) return; tone(90, 0.2, 'sine', 0.5, null, { slide: 50 }); burst(0.08, 1500, 1, 0.3); };
  A.vend = function (pos) {
    if (!A.ready) return;
    tone(220, 0.6, 'square', 0.02, pos, { slide: 200, attack: 0.1 });
    tone(80, 0.3, 'sine', 0.4, pos, { delay: 0.8, slide: 50 });
    burst(0.15, 600, 1, 0.2, pos, { delay: 0.8 });
  };
  A.paper = function () { if (A.ready) burst(0.35, 4000, 0.6, 0.06, null, { attack: 0.08 }); };
  A.deskBell = function (pos) {
    if (!A.ready) return;
    [1, 2.4, 4.1].forEach((m, i) => tone(1760 * m, 1.6 / (i + 1), 'sine', 0.1 / (i + 1), pos, { wet: 0.6 }));
  };
  A.typewriter = function () { if (A.ready) burst(0.03, 2200, 3, 0.08); };

  A.ruleBroken = function () {
    if (!A.ready) return;
    // no sting: the room simply goes quiet, then one low note
    A.stopMuzak(true);
    A.setHum(false);
    setTimeout(() => { tone(55, 4, 'sine', 0.18, null, { attack: 1.2, wet: 0.6 }); }, 900);
    setTimeout(() => A.setHum(true), 5200);
  };

  A.footstepSelf = function () { if (A.ready) burst(0.09, 180, 0.8, 0.035); };
  A.footstepOther = function (pos) {
    if (!A.ready) return;
    burst(0.05, 2400, 2.5, 0.5, pos); tone(140, 0.08, 'sine', 0.2, pos);
  };

  A.zap = function (pos) {
    if (!A.ready) return;
    burst(0.06 + Math.random() * 0.08, 5000, 0.5, 0.25, pos);
    tone(120, 0.1, 'square', 0.04, pos);
  };

  A.tick = function (pos, vol) { if (A.ready) burst(0.02, 3500, 6, vol || 0.15, pos); };

  A.staticBurst = function (dur) {
    if (!A.ready) return;
    burst(dur || 0.2, 3000, 0.3, 0.18, null, { type: 'highpass' });
  };

  A.iceMachine = function (pos) {
    if (!A.ready) return;
    tone(48, 3.5, 'sawtooth', 0.04, pos, { attack: 0.6 });
    for (let i = 0; i < 9; i++) burst(0.06, 2500 + Math.random() * 2000, 4, 0.25, pos, { delay: 2.4 + i * 0.07 + Math.random() * 0.05 });
  };

  A.drip = function (pos) {
    if (!A.ready) return;
    tone(900 + Math.random() * 600, 0.12, 'sine', 0.12, pos, { slide: 1800, wet: 1 });
  };
  A.slosh = function (pos) { if (A.ready) burst(1.6, 500, 0.4, 0.1, pos, { attack: 0.6, wet: 1 }); };

  A.sizzle = function (pos) {
    if (!A.ready) return;
    burst(2.5, 6000, 0.6, 0.08, pos, { attack: 0.3 });
    for (let i = 0; i < 3; i++) tone(300 + Math.random() * 500, 0.12, 'triangle', 0.08, pos, { delay: Math.random() * 2 });
  };

  A.tvMurmur = function (pos) {
    if (!A.ready) return;
    for (let i = 0; i < 6; i++) burst(0.18, 700 + Math.random() * 500, 5, 0.1, pos, { delay: i * 0.22 });
  };

  A.gameBlip = function (pos) {
    if (!A.ready) return;
    tone(440 * Math.pow(2, Math.floor(Math.random() * 8) / 6), 0.08, 'square', 0.03, pos);
  };

  // the lifeguard's pea whistle: a shrill trill
  A.whistle = function (pos, long) {
    if (!A.ready) return;
    const ctx = A.ctx, t = ctx.currentTime, dur = long ? 1.6 : 0.55;
    const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 2650;
    const trill = ctx.createOscillator(); trill.frequency.value = 34;
    const td = ctx.createGain(); td.gain.value = 140; trill.connect(td); td.connect(o.frequency);
    const am = ctx.createGain(); am.gain.value = 0;
    const amo = ctx.createOscillator(); amo.frequency.value = 34; const amd = ctx.createGain(); amd.gain.value = 0.04;
    amo.connect(amd); amd.connect(am.gain);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2700; bp.Q.value = 3;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5, t + 0.02); g.gain.setValueAtTime(0.5, t + dur - 0.08); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(bp); bp.connect(am); am.connect(g); g.connect(out(pos, 0.8));
    am.gain.setValueAtTime(0.06, t);
    [o, trill, amo].forEach((s) => { s.start(t); s.stop(t + dur + 0.05); });
  };
  A.knock = function (pos) {
    if (!A.ready) return;
    for (let i = 0; i < 3; i++) { tone(95, 0.18, 'sine', 0.5, pos, { delay: i * 0.32, slide: 60 }); burst(0.06, 700, 1, 0.3, pos, { delay: i * 0.32 }); }
  };
  A.splash = function (pos) { if (A.ready) { burst(0.7, 1400, 0.5, 0.25, pos, { attack: 0.01, wet: 1 }); burst(1.2, 400, 0.6, 0.12, pos, { delay: 0.1, attack: 0.2, wet: 1 }); } };
  A.squeak = function (pos) { if (A.ready) tone(1900, 0.25, 'triangle', 0.05, pos, { slide: 2300 }); };

  A.sheets = function (pos) { if (A.ready) burst(0.9, 1400, 0.4, 0.12, pos, { attack: 0.3 }); };

  // housekeeping cart: a squeaking wheel and rattling bottles that never appear
  A.cartStart = function (pos) {
    if (!A.ready || A.cart) return;
    const ctx = A.ctx;
    const p = panner(pos);
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 1900;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 1.3;
    const ld = ctx.createGain(); ld.gain.value = 260; lfo.connect(ld); ld.connect(o.frequency);
    const og = ctx.createGain(); og.gain.value = 0;
    const am = ctx.createOscillator(); am.type = 'square'; am.frequency.value = 1.3;
    const amg = ctx.createGain(); amg.gain.value = 0.012; am.connect(amg); amg.connect(og.gain);
    o.connect(og); og.connect(p);
    const n = noise(true), bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 6;
    const ng = ctx.createGain(); ng.gain.value = 0.03; n.connect(bp); bp.connect(ng); ng.connect(p);
    const rum = ctx.createOscillator(); rum.frequency.value = 38; const rg = ctx.createGain(); rg.gain.value = 0.06; rum.connect(rg); rg.connect(p);
    [o, lfo, am, n, rum].forEach((s) => s.start());
    A.cart = { p, nodes: [o, lfo, am, n, rum] };
  };
  A.cartMove = function (pos) { if (A.cart) setPos(A.cart.p, pos); };
  A.cartStop = function () {
    if (!A.cart) return;
    A.cart.nodes.forEach((s) => { try { s.stop(); } catch (e) { /* already stopped */ } });
    A.cart.p.disconnect();
    A.cart = null;
  };

  A.engine = function (on) {
    if (!A.ready) return;
    if (on && !A.engineNodes) {
      const ctx = A.ctx;
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 42;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
      const g = ctx.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(0.08, ctx.currentTime, 2);
      const n = noise(true), nl = ctx.createBiquadFilter(); nl.type = 'lowpass'; nl.frequency.value = 500;
      const ng = ctx.createGain(); ng.gain.value = 0.05;
      o.connect(lp); lp.connect(g); n.connect(nl); nl.connect(ng); ng.connect(g); g.connect(A.master);
      o.start(); n.start();
      A.engineNodes = { o, n, g };
    } else if (!on && A.engineNodes) {
      A.engineNodes.o.stop(); A.engineNodes.n.stop(); A.engineNodes = null;
    }
  };

  A.silenceAll = function (sec) {
    if (!A.ready) return;
    A.master.gain.setTargetAtTime(0, A.ctx.currentTime, 0.05);
    setTimeout(() => A.master.gain.setTargetAtTime(0.9, A.ctx.currentTime, 0.5), (sec || 1) * 1000);
  };

  INN.Audio = A;
})(window.INN);
