// THE INN BETWEEN — touch controls. Only switched on for devices with no hover and a coarse
// pointer (phones, tablets), so keyboard and mouse play is untouched.
//   left half:  a thumbstick that appears where your thumb lands
//   right half: drag to look, tap to use
//   buttons:    USE, RUN (toggle), FOLIO, PAUSE; tap the watch to raise it
window.INN = window.INN || {};
(function (INN) {
  'use strict';

  const T = {
    enabled: false,
    move: { x: 0, y: 0, active: false },
    run: false,
  };

  T.detect = function () {
    try { return window.matchMedia('(hover: none) and (pointer: coarse)').matches; } catch (e) { return false; }
  };

  T.init = function (G) {
    T.enabled = true;
    T.G = G;
    document.body.classList.add('touch');
    const ui = document.createElement('div');
    ui.id = 'touch-ui';
    ui.innerHTML =
      '<div id="stick-zone"></div><div id="look-zone"></div>' +
      '<div id="stick"><div id="stick-knob"></div></div>' +
      '<button class="tbtn" id="t-use">USE</button>' +
      '<button class="tbtn" id="t-run">RUN</button>' +
      '<button class="tbtn small" id="t-folio">FOLIO</button>' +
      '<button class="tbtn small" id="t-pause">❚❚</button>';
    document.body.appendChild(ui);
    const rot = document.createElement('div');
    rot.id = 'rotate';
    rot.innerHTML = '<canvas width="640" height="480"></canvas><div class="rot-text">PLEASE TURN YOUR SET SIDEWAYS</div>';
    document.body.appendChild(rot);
    INN.Tex.drawTestCard(rot.querySelector('canvas').getContext('2d'), 640, 480, 0, 'PLEASE STAND BY');

    const $ = (id) => document.getElementById(id);
    const stick = $('stick'), knob = $('stick-knob');
    const R = 56;
    let stickId = null, sx = 0, sy = 0;
    let lookId = null, lx = 0, ly = 0, lookStart = 0, lookDist = 0;

    const tap = (el, fn) => el.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); fn(); }, { passive: false });
    tap($('t-use'), () => { if (G.state === 'play') G.tryInteract(); });
    tap($('t-run'), () => { T.run = !T.run; $('t-run').classList.toggle('on', T.run); });
    tap($('t-folio'), () => { if (G.state === 'play') G.openFolio(); });
    tap($('t-pause'), () => { if (G.state === 'play') G.pause(); });
    // the watch: tap to raise, tap again to lower
    const watch = document.getElementById('watch');
    watch.style.pointerEvents = 'auto';
    tap(watch, () => { G.keys.KeyQ = !G.keys.KeyQ; });

    $('stick-zone').addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      if (stickId !== null) return;
      stickId = t.identifier; sx = t.clientX; sy = t.clientY;
      stick.style.left = sx + 'px'; stick.style.top = sy + 'px';
      stick.classList.add('on');
      knob.style.transform = 'translate(-50%,-50%)';
      T.move.active = true; T.move.x = 0; T.move.y = 0;
    }, { passive: false });

    $('look-zone').addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      if (lookId !== null) return;
      lookId = t.identifier; lx = t.clientX; ly = t.clientY; lookStart = performance.now(); lookDist = 0;
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === stickId) {
          let dx = t.clientX - sx, dy = t.clientY - sy;
          const d = Math.hypot(dx, dy);
          if (d > R) { dx *= R / d; dy *= R / d; }
          knob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
          T.move.x = dx / R; T.move.y = dy / R;
        } else if (t.identifier === lookId) {
          const dx = t.clientX - lx, dy = t.clientY - ly;
          lx = t.clientX; ly = t.clientY; lookDist += Math.abs(dx) + Math.abs(dy);
          if (G.state === 'play') {
            const s = 0.0055;
            G.player.yaw -= dx * s;
            G.player.pitch = Math.max(-1.45, Math.min(1.45, G.player.pitch - dy * s));
          }
        }
      }
    }, { passive: true });

    const end = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === stickId) {
          stickId = null; stick.classList.remove('on');
          T.move.active = false; T.move.x = 0; T.move.y = 0;
        } else if (t.identifier === lookId) {
          lookId = null;
          // a quick tap on the right side uses whatever is under the crosshair
          if (lookDist < 12 && performance.now() - lookStart < 260 && G.state === 'play') G.tryInteract();
        }
      }
    };
    document.addEventListener('touchend', end);
    document.addEventListener('touchcancel', end);

    // during the opening broadcast, a tap fast-forwards a line
    document.addEventListener('touchstart', () => {
      if (G.state === 'intro') {
        G.keys.Space = true; INN.UI.skipLine();
        setTimeout(() => { G.keys.Space = false; }, 200);
      }
    }, { passive: true });
  };

  // keep the run toggle honest with the keyboard state the game reads
  T.frame = function (G) {
    if (!T.enabled) return;
    G.keys.ShiftLeft = T.run;
    const use = document.getElementById('t-use');
    if (use) use.classList.toggle('ready', !!G.target);
  };

  // the first tap of the broadcast: go fullscreen where the device allows it, and wake speech
  T.firstGesture = function () {
    if (!T.enabled) return;
    const el = document.documentElement;
    try { const p = el.requestFullscreen && el.requestFullscreen({ navigationUI: 'hide' }); if (p && p.catch) p.catch(() => {}); } catch (e) { /* not offered */ }
    try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* not offered */ }
    try { if (window.speechSynthesis) speechSynthesis.speak(new SpeechSynthesisUtterance(' ')); } catch (e) { /* no voice */ }
  };

  INN.Touch = T;
})(window.INN);
