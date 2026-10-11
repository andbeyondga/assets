// THE INN BETWEEN — broadcast captions, inn paperwork, the wristwatch, test cards.
// The game never breaks character: every menu is a form, every screen is a broadcast.
window.INN = window.INN || {};
(function (INN) {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const UI = { voice: true, queue: [], speaking: false, paperOpen: false, cardMode: 'none' };

  UI.init = function () {
    UI.cap = $('caption'); UI.capText = UI.cap.querySelector('.text'); UI.capTag = UI.cap.querySelector('.tag');
    UI.promptEl = $('prompt'); UI.noticeEl = $('notice');
    UI.watch = $('watch'); UI.wg = UI.watch.getContext('2d');
    UI.flashEl = $('flash'); UI.flashCanvas = UI.flashEl.querySelector('canvas');
    UI.cardEl = $('card'); UI.cardCanvas = UI.cardEl.querySelector('canvas'); UI.cardOver = UI.cardEl.querySelector('.over');
    UI.paperWrap = $('paper-wrap'); UI.paperEl = $('paper');
    UI.date = $('vcr-date'); UI.play = $('vcr-play'); UI.ff = $('vcr-ff');
    UI.crosshair = $('crosshair');
    document.addEventListener('keydown', (e) => {
      if (!UI.paperOpen) return;
      if (e.target && e.target.tagName === 'INPUT') { if (e.key === 'Enter' && UI.enterFn) { e.preventDefault(); UI.enterFn(); } return; }
      const n = parseInt(e.key, 10);
      if (n >= 1 && UI.optFns && UI.optFns[n - 1]) { e.preventDefault(); e.innHandled = true; UI.optFns[n - 1](); }
      if ((e.key === 'Escape' || e.key === 'Tab' || e.key.toLowerCase() === 'f') && UI.paperClosable) { e.preventDefault(); e.innHandled = true; UI.closePaper(); }
    });
    // pick a voice once they load
    if (window.speechSynthesis) {
      const pick = () => {
        const vs = speechSynthesis.getVoices();
        UI.voiceObj = vs.find((v) => /en-GB/i.test(v.lang) && /male|daniel|arthur|george/i.test(v.name))
          || vs.find((v) => /Daniel|Alex|Fred|David|Google UK English Male/i.test(v.name))
          || vs.find((v) => /^en/i.test(v.lang)) || null;
      };
      pick(); speechSynthesis.onvoiceschanged = pick;
    }
  };

  // ------------------------------------------------------------- captions
  function speak(text, kind) {
    return new Promise((res) => {
      if (!UI.voice || !window.speechSynthesis) return res(false);
      try {
        const u = new SpeechSynthesisUtterance(text);
        if (UI.voiceObj) u.voice = UI.voiceObj;
        u.rate = kind === 'pa' ? 0.86 : 0.9;
        u.pitch = kind === 'pa' ? 0.8 : 0.92;
        u.volume = kind === 'pa' ? 0.75 : 0.9;
        let done = false;
        const fin = () => { if (!done) { done = true; res(true); } };
        u.onend = fin; u.onerror = fin;
        setTimeout(fin, 2000 + text.length * 110);
        speechSynthesis.speak(u);
      } catch (e) { res(false); }
    });
  }

  UI.say = function (text, kind, opts) {
    return new Promise((resolve) => {
      UI.queue.push({ text, kind: kind || 'broadcast', resolve, opts: opts || {} });
      if (!UI.speaking) next();
    });
  };

  UI.skipLine = function () { if (UI.lineSkip) UI.lineSkip(); };

  function next() {
    const item = UI.queue.shift();
    if (!item) { UI.speaking = false; UI.cap.classList.remove('on'); return; }
    UI.speaking = true;
    const pa = item.kind === 'pa';
    UI.capTag.textContent = pa ? '◉ PUBLIC ADDRESS' : (item.opts.tag || '◉ AN EDUCATIONAL BROADCAST');
    UI.capTag.className = 'tag' + (pa ? ' pa' : '');
    UI.capText.textContent = item.text;
    UI.cap.classList.add('on');
    const words = item.text.split(/\s+/).length;
    const minDur = Math.max(2400, words * 330 + 1200);
    const start = performance.now();
    let finished = false;
    const finish = () => {
      if (finished) return; finished = true; UI.lineSkip = null;
      UI.cap.classList.remove('on');
      if (window.speechSynthesis) speechSynthesis.cancel();
      item.resolve();
      setTimeout(next, 280);
    };
    UI.lineSkip = finish;
    speak(item.text, item.kind).then((spoke) => {
      const el = performance.now() - start;
      setTimeout(finish, spoke ? 350 : Math.max(0, minDur - el));
    });
  }

  UI.clearCaptions = function () {
    UI.queue.forEach((q) => q.resolve());
    UI.queue = [];
    if (UI.lineSkip) UI.lineSkip();
    if (window.speechSynthesis) speechSynthesis.cancel();
  };

  UI.notice = function (text, sec) {
    UI.noticeEl.textContent = text;
    UI.noticeEl.classList.add('on');
    clearTimeout(UI.noticeT);
    UI.noticeT = setTimeout(() => UI.noticeEl.classList.remove('on'), (sec || 4) * 1000);
  };

  UI.prompt = function (text) {
    if (UI.lastPrompt === text) return;
    UI.lastPrompt = text;
    UI.promptEl.textContent = text || '';
  };

  UI.hud = function (on) {
    ['vcr-play', 'vcr-date'].forEach((id) => { $(id).style.display = on ? '' : 'none'; });
    UI.crosshair.style.display = on ? '' : 'none';
    UI.watch.style.display = on ? '' : 'none';
    if (!on) UI.prompt('');
  };

  UI.osd = function (dateStr, ff) {
    UI.date.textContent = dateStr;
    UI.ff.style.display = ff ? 'block' : 'none';
  };

  // ------------------------------------------------------------- the wristwatch
  UI.drawWatch = function (s) {
    const g = UI.wg, W = 300, r = 118, cx = 150, cy = 150;
    g.clearRect(0, 0, W, W);
    // strap
    g.fillStyle = '#4a2a14'; g.fillRect(cx - 58, 0, 116, W);
    g.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 6; y < W; y += 14) g.fillRect(cx - 58, y, 116, 2);
    // case
    const cg = g.createRadialGradient(cx - 30, cy - 30, 10, cx, cy, r + 14);
    cg.addColorStop(0, '#f2d890'); cg.addColorStop(0.6, '#c9a24a'); cg.addColorStop(1, '#6a4c14');
    g.fillStyle = cg; g.beginPath(); g.arc(cx, cy, r + 12, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#efe6cc'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2a1a0c';
    for (let i = 0; i < 60; i++) {
      const a = i / 60 * Math.PI * 2, big = i % 5 === 0;
      g.save(); g.translate(cx, cy); g.rotate(a); g.fillRect(-1.5 * (big ? 2 : 1), -r + 6, 3 * (big ? 2 : 1), big ? 16 : 6); g.restore();
    }
    g.font = 'bold 13px Georgia'; g.textAlign = 'center';
    g.fillText('THE INN BETWEEN', cx, cy - 46);
    // housekeeping subdial: 48 hours to a revolution
    const sx = cx, sy = cy + 40, sr = 30;
    g.strokeStyle = '#2a1a0c'; g.lineWidth = 1.5; g.beginPath(); g.arc(sx, sy, sr, 0, Math.PI * 2); g.stroke();
    g.font = 'bold 9px Georgia'; g.fillText('48', sx, sy - sr + 11); g.fillText('24', sx, sy + sr - 4);
    g.fillText('HOUSEKEEPING', sx, sy + sr + 12);
    if (s.hkLeft != null) {
      const a = (1 - Math.max(0, s.hkLeft) / 48) * Math.PI * 2;
      g.strokeStyle = '#b0202a'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.sin(a) * (sr - 4), sy - Math.cos(a) * (sr - 4)); g.stroke();
      g.font = 'bold 11px "VT323", monospace'; g.fillStyle = '#b0202a';
      g.fillText(Math.max(0, Math.ceil(s.hkLeft)) + 'H', sx + 46, sy + 4);
      g.fillStyle = '#2a1a0c';
    }
    // day window
    g.fillStyle = '#fff'; g.fillRect(cx + 52, cy - 10, 40, 20);
    g.strokeStyle = '#2a1a0c'; g.lineWidth = 1; g.strokeRect(cx + 52, cy - 10, 40, 20);
    g.fillStyle = '#2a1a0c'; g.font = 'bold 13px "VT323", monospace'; g.fillText('DAY ' + s.day, cx + 72, cy + 5);
    if (s.room) {
      g.font = 'italic 11px Georgia'; g.fillText('room ' + s.room, cx - 70, cy + 5);
    }
    // hands
    const hA = ((s.h % 12) + s.m / 60) / 12 * Math.PI * 2, mA = s.m / 60 * Math.PI * 2;
    g.lineCap = 'round'; g.strokeStyle = '#1a1008';
    g.lineWidth = 7; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(hA) * 56, cy - Math.cos(hA) * 56); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(mA) * 88, cy - Math.cos(mA) * 88); g.stroke();
    g.fillStyle = '#b0402a'; g.beginPath(); g.arc(cx, cy, 6, 0, Math.PI * 2); g.fill();
    // crystal glare
    g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.ellipse(cx - 30, cy - 50, 60, 26, -0.5, 0, Math.PI * 2); g.fill();
  };

  UI.raiseWatch = function (on) { UI.watch.classList.toggle('raised', !!on); };

  // ------------------------------------------------------------- paperwork
  function letterhead() {
    return '<div class="letterhead"><canvas width="112" height="112" class="emb"></canvas><div><div class="lh-name">THE INN BETWEEN</div><div class="lh-sub">A MOTOR INN · OPEN ALL NIGHT · ALL NIGHTS</div></div></div>';
  }

  UI.paper = function (o) {
    UI.paperOpen = true;
    UI.paperClosable = o.closable !== false;
    UI.onPaperClose = o.onClose || null;
    let html = (o.letterhead !== false ? letterhead() : '');
    if (UI.paperClosable) html += '<button class="close" data-close>[ESC] CLOSE</button>';
    if (o.title) html += '<h2>' + o.title + '</h2>';
    if (o.speaker) html += '<div class="speaker">' + o.speaker + '</div>';
    if (o.html) html += o.html;
    if (o.body) html += '<div class="body"></div>';
    if (o.options && o.options.length) {
      html += '<div class="opts">' + o.options.map((op, i) => '<button class="opt" data-i="' + i + '"><span class="n">' + (i + 1) + '.</span>' + esc(op.label) + '</button>').join('') + '</div>';
    }
    if (o.footer) html += '<div class="small">' + o.footer + '</div>';
    if (o.stamp) html += '<div class="stamp big ' + (o.stamp.color || 'red') + '">' + o.stamp.text + '</div>';
    UI.paperEl.innerHTML = html;
    if (o.body) UI.paperEl.querySelector('.body').textContent = o.body;
    const emb = UI.paperEl.querySelector('canvas.emb');
    if (emb) INN.Tex.drawEmblem(emb.getContext('2d'), 56, 56, 54, { text: false });
    UI.optFns = (o.options || []).map((op) => () => { INN.Audio.paper(); op.fn(); });
    UI.paperEl.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => UI.optFns[+b.dataset.i]()));
    const cl = UI.paperEl.querySelector('[data-close]');
    if (cl) cl.addEventListener('click', () => UI.closePaper());
    UI.enterFn = o.onEnter || null;
    UI.paperWrap.style.display = 'flex';
    UI.paperEl.scrollTop = 0;
    INN.Audio.paper();
    const inp = UI.paperEl.querySelector('input');
    if (inp) setTimeout(() => inp.focus(), 50);
    if (o.stamp) INN.Audio.stamp();
    return UI.paperEl;
  };

  UI.closePaper = function () {
    if (!UI.paperOpen) return;
    UI.paperOpen = false;
    UI.paperWrap.style.display = 'none';
    UI.paperEl.innerHTML = '';
    UI.optFns = null; UI.enterFn = null;
    const cb = UI.onPaperClose; UI.onPaperClose = null;
    if (cb) cb();
  };

  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]); }
  UI.esc = esc;

  // ------------------------------------------------------------- cards
  UI.card = function (mode, data) {
    UI.cardMode = mode; UI.cardData = data || {};
    UI.cardT = 0;
    UI.cardEl.style.display = mode === 'none' ? 'none' : 'block';
    UI.cardOver.innerHTML = (data && data.html) || '';
    UI.cardCanvas.style.display = mode === 'html' ? 'none' : 'block';
    UI.cardEl.style.background = mode === 'emblem' ? 'transparent' : '#000';
    if (data && data.onClick) {
      const el = UI.cardOver.querySelector('[data-go]') || UI.cardOver;
      el.addEventListener('click', data.onClick, { once: true });
    }
  };

  UI.updateCard = function (dt) {
    if (UI.cardMode === 'none' || UI.cardMode === 'html') return;
    UI.cardT += dt;
    const c = UI.cardCanvas, g = c.getContext('2d'), w = c.width, h = c.height;
    if (UI.cardMode === 'static') {
      staticNoise(g, w, h, 1);
    } else if (UI.cardMode === 'standby') {
      INN.Tex.drawTestCard(g, w, h, UI.cardT, UI.cardData.line1, UI.cardData.line2);
      if (Math.random() < 0.08) staticNoise(g, w, h, 0.35);
      rollBar(g, w, h, UI.cardT);
    } else if (UI.cardMode === 'emblem') {
      g.clearRect(0, 0, w, h);
      const a = Math.min(1, UI.cardT / 1.5) * (UI.cardData.fadeOut ? Math.max(0, 1 - (UI.cardT - UI.cardData.fadeOut)) : 1);
      g.globalAlpha = a;
      g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(0, 0, w, h);
      INN.Tex.drawEmblem(g, w / 2, h * 0.42, h * 0.26);
      g.fillStyle = '#fff'; g.textAlign = 'center';
      g.font = 'bold ' + Math.round(h * 0.055) + 'px "Arial Black", sans-serif';
      g.lineWidth = 6; g.strokeStyle = '#000';
      g.strokeText('AN EDUCATIONAL BROADCAST', w / 2, h * 0.82); g.fillText('AN EDUCATIONAL BROADCAST', w / 2, h * 0.82);
      g.globalAlpha = 1; g.textAlign = 'left';
      if (UI.cardT < 0.6) staticNoise(g, w, h, 1 - UI.cardT / 0.6);
    }
  };

  function staticNoise(g, w, h, amt) {
    const img = g.getImageData(0, 0, w, h), d = img.data;
    for (let i = 0; i < d.length; i += 16) {
      const v = Math.random() * 255;
      for (let k = 0; k < 16 && i + k < d.length; k += 4) {
        d[i + k] = d[i + k] * (1 - amt) + v * amt; d[i + k + 1] = d[i + k + 1] * (1 - amt) + v * amt; d[i + k + 2] = d[i + k + 2] * (1 - amt) + v * amt; d[i + k + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
  }

  function rollBar(g, w, h, t) {
    const y = ((t * 60) % (h + 80)) - 40;
    g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(0, y, w, 40);
  }

  UI.lethalityHTML = function (extra) {
    return '<div class="lethality"><div class="l1">THIS BROADCAST CARRIES A</div><div class="l2">LETHALITY RATING 5.5</div><div class="l3">— CAUTION RECOMMENDED —</div>' +
      '<div class="l4">' + (extra || 'RATED BY THE MANAGEMENT IN ACCORDANCE WITH STANDING GUEST POLICY. THIS RATING IS PROVIDED FOR YOUR COMFORT.') + '</div></div>';
  };

  // ------------------------------------------------------------- subliminal
  UI.flash = function (what, frames) {
    const c = UI.flashCanvas, g = c.getContext('2d'), w = c.width, h = c.height;
    staticNoise(g, w, h, 1);
    if (what === 'emblem') {
      INN.Tex.drawEmblem(g, w / 2, h / 2, h * 0.3);
    } else if (what === 'testcard') {
      INN.Tex.drawTestCard(g, w, h, 0, 'PLEASE STAND BY');
    } else {
      g.fillStyle = '#000'; g.fillRect(0, h * 0.38, w, h * 0.24);
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = 'bold ' + Math.round(h * 0.16) + 'px "Arial Black", sans-serif';
      g.fillText(what, w / 2, h / 2);
    }
    UI.flashEl.style.display = 'block';
    INN.Audio.staticBurst(0.08);
    setTimeout(() => { UI.flashEl.style.display = 'none'; }, (frames || 3) * 1000 / 30);
  };

  INN.UI = UI;
})(window.INN);
