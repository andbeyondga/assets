// THE INN BETWEEN — procedural textures and 2D drawings.
// Everything is painted on canvases at boot so the game ships as plain files.
window.INN = window.INN || {};
(function (INN) {
  'use strict';

  const TAU = Math.PI * 2;

  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function toTexture(c, repeat) {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = repeat === false ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
    t.anisotropy = 4;
    return t;
  }

  function hex(h) {
    return [(h >> 16) & 255, (h >> 8) & 255, h & 255];
  }

  function lerpC(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  // Seeded noise so the inn looks the same every night.
  let seed = 1974;
  function rnd() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  // ---------------------------------------------------------------- carpet
  // A tileable 70s swirl: integer frequencies keep it seamless.
  function carpet(palette, size) {
    size = size || 256;
    const c = canvas(size, size), g = c.getContext('2d');
    const img = g.createImageData(size, size), d = img.data;
    const P = palette.map(hex);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size, v = y / size;
        let s = Math.sin(TAU * (2 * u) + 1.7 * Math.sin(TAU * (3 * v + u)));
        s += Math.cos(TAU * (2 * v) + 1.5 * Math.cos(TAU * (2 * u - v)));
        s += 0.6 * Math.sin(TAU * (u + v) * 3 + 2.0 * Math.sin(TAU * (u - 2 * v)));
        const n = (s + 2.6) / 5.2;
        const band = n * 7;
        const bi = Math.floor(band);
        const edge = band - bi;
        let col = P[((bi % P.length) + P.length) % P.length];
        if (edge < 0.08 || edge > 0.92) col = lerpC(col, [30, 14, 6], 0.55);
        const fiber = (rnd() - 0.5) * 26;
        const i = (y * size + x) * 4;
        d[i] = col[0] + fiber; d[i + 1] = col[1] + fiber * 0.8; d[i + 2] = col[2] + fiber * 0.6; d[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    return toTexture(c);
  }

  // ---------------------------------------------------------- wood paneling
  function wood(base) {
    const c = canvas(256, 512), g = c.getContext('2d');
    const plank = 32;
    const b = hex(base || 0x5a3418);
    for (let p = 0; p < 256 / plank; p++) {
      const k = 0.8 + rnd() * 0.35;
      g.fillStyle = `rgb(${b[0] * k | 0},${b[1] * k | 0},${b[2] * k | 0})`;
      g.fillRect(p * plank, 0, plank, 512);
      for (let l = 0; l < 14; l++) {
        const x0 = p * plank + rnd() * plank;
        g.strokeStyle = `rgba(20,8,2,${0.1 + rnd() * 0.25})`;
        g.lineWidth = 0.6 + rnd() * 1.4;
        g.beginPath();
        for (let y = 0; y <= 512; y += 16) {
          const x = x0 + Math.sin(y * 0.02 + l) * 2.5 + Math.sin(y * 0.07 + p) * 1.2;
          y === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
        }
        g.stroke();
      }
      g.fillStyle = 'rgba(10,4,0,0.85)';
      g.fillRect(p * plank, 0, 2, 512);
      g.fillStyle = 'rgba(255,200,140,0.06)';
      g.fillRect(p * plank + 2, 0, 1, 512);
    }
    return toTexture(c);
  }

  // ----------------------------------------------------- harvest wallpaper
  function wallpaper(bg, fg, accent) {
    const c = canvas(256, 256), g = c.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const cx = i * 64 + (j % 2 ? 32 : 0), cy = j * 64;
        for (const [ox, oy] of [[0, 0], [256, 0], [0, 256], [-256, 0]]) {
          g.strokeStyle = fg; g.lineWidth = 6;
          g.beginPath(); g.ellipse(cx + ox, cy + oy + 32, 20, 28, 0, 0, TAU); g.stroke();
          g.strokeStyle = accent; g.lineWidth = 3;
          g.beginPath(); g.ellipse(cx + ox, cy + oy + 32, 9, 14, 0, 0, TAU); g.stroke();
        }
      }
    }
    // age
    for (let i = 0; i < 1600; i++) {
      g.fillStyle = `rgba(60,40,10,${rnd() * 0.06})`;
      g.fillRect(rnd() * 256, rnd() * 256, 2, 2);
    }
    return toTexture(c);
  }

  // ------------------------------------------------------------- teal tile
  function tile(color, grout, n) {
    n = n || 8;
    const c = canvas(256, 256), g = c.getContext('2d');
    g.fillStyle = grout; g.fillRect(0, 0, 256, 256);
    const s = 256 / n, b = hex(color);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const k = 0.88 + rnd() * 0.2;
      g.fillStyle = `rgb(${b[0] * k | 0},${b[1] * k | 0},${b[2] * k | 0})`;
      g.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
      g.fillStyle = 'rgba(255,255,255,0.12)';
      g.fillRect(i * s + 3, j * s + 3, s - 8, 3);
    }
    return toTexture(c);
  }

  function ceiling() {
    const c = canvas(256, 256), g = c.getContext('2d');
    g.fillStyle = '#d8cfb4'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 3000; i++) {
      g.fillStyle = `rgba(90,80,60,${rnd() * 0.35})`;
      g.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 2, 1 + rnd() * 2);
    }
    g.fillStyle = '#8f8670';
    g.fillRect(0, 0, 256, 3); g.fillRect(0, 0, 3, 256);
    g.fillStyle = 'rgba(120,90,40,0.18)';
    g.beginPath(); g.ellipse(170, 90, 40, 26, 0.4, 0, TAU); g.fill();
    return toTexture(c);
  }

  function shag(base) {
    const c = canvas(128, 128), g = c.getContext('2d');
    const b = hex(base);
    g.fillStyle = `rgb(${b})`; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 4000; i++) {
      const k = 0.6 + rnd() * 0.7;
      g.fillStyle = `rgba(${b[0] * k | 0},${b[1] * k | 0},${b[2] * k | 0},0.8)`;
      g.fillRect(rnd() * 128, rnd() * 128, 1, 2 + rnd() * 3);
    }
    return toTexture(c);
  }

  function fabric(a, b) {
    const c = canvas(64, 64), g = c.getContext('2d');
    g.fillStyle = a; g.fillRect(0, 0, 64, 64);
    g.fillStyle = b;
    for (let i = 0; i < 64; i += 8) { g.fillRect(i, 0, 4, 64); }
    g.globalAlpha = 0.25;
    for (let i = 0; i < 64; i += 4) { g.fillRect(0, i, 64, 1); }
    return toTexture(c);
  }

  // ------------------------------------------------------------- emblem
  // A white bird carrying a golden key, inside a circle.
  function drawEmblem(g, cx, cy, r, opts) {
    opts = opts || {};
    g.save();
    g.translate(cx, cy);
    const s = r / 100;
    g.scale(s, s);
    // disc
    g.beginPath(); g.arc(0, 0, 100, 0, TAU);
    g.fillStyle = opts.bg || '#14363a'; g.fill();
    g.lineWidth = 6; g.strokeStyle = '#d9a63c'; g.stroke();
    g.beginPath(); g.arc(0, 0, 88, 0, TAU);
    g.lineWidth = 2; g.strokeStyle = 'rgba(217,166,60,0.8)'; g.stroke();
    // ring text
    if (opts.text !== false) {
      const txt = opts.ring || 'THE INN BETWEEN • AN EDUCATIONAL BROADCAST • ';
      g.fillStyle = '#e8c372';
      g.font = 'bold 11px Georgia, serif';
      const n = txt.length;
      for (let i = 0; i < n; i++) {
        g.save();
        g.rotate((i / n) * TAU - Math.PI / 2);
        g.translate(0, -76);
        g.fillText(txt[i], -3, 0);
        g.restore();
      }
    }
    // bird
    g.fillStyle = '#f6f1e4';
    g.beginPath(); // body
    g.ellipse(0, -14, 26, 13, -0.12, 0, TAU); g.fill();
    g.beginPath(); // head
    g.arc(26, -26, 10, 0, TAU); g.fill();
    g.beginPath(); // beak
    g.moveTo(34, -28); g.lineTo(46, -24); g.lineTo(34, -21); g.closePath();
    g.fillStyle = '#d9a63c'; g.fill();
    g.fillStyle = '#f6f1e4';
    g.beginPath(); // upper wing
    g.moveTo(-6, -22);
    g.bezierCurveTo(-20, -70, -50, -72, -64, -58);
    g.bezierCurveTo(-46, -54, -40, -44, -34, -36);
    g.bezierCurveTo(-48, -40, -60, -34, -66, -24);
    g.bezierCurveTo(-40, -22, -22, -18, -6, -12);
    g.closePath(); g.fill();
    g.beginPath(); // far wing
    g.moveTo(6, -24);
    g.bezierCurveTo(4, -56, -10, -66, -24, -64);
    g.bezierCurveTo(-12, -50, -8, -38, -2, -24);
    g.closePath(); g.globalAlpha = 0.85; g.fill(); g.globalAlpha = 1;
    g.beginPath(); // tail
    g.moveTo(-24, -12); g.lineTo(-52, 0); g.lineTo(-46, -8); g.lineTo(-56, -10); g.lineTo(-26, -20); g.closePath(); g.fill();
    g.fillStyle = '#14363a';
    g.beginPath(); g.arc(28, -28, 2, 0, TAU); g.fill();
    // key hanging from the beak
    g.strokeStyle = '#d9a63c'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(42, -23); g.lineTo(40, 2); g.stroke();
    g.lineWidth = 5;
    g.beginPath(); g.arc(40, 12, 10, 0, TAU); g.stroke();
    g.fillStyle = '#d9a63c';
    g.fillRect(37.5, 22, 5, 46);
    g.fillRect(42, 52, 10, 5); g.fillRect(42, 61, 7, 5);
    g.restore();
  }

  // ------------------------------------------------------------ test card
  function drawTestCard(g, w, h, t, line1, line2) {
    const bars = ['#c9c2b0', '#c9b85a', '#5fb3ad', '#5aa85a', '#b05aa8', '#b0524a', '#4a52a8'];
    const bw = w / bars.length;
    bars.forEach((c, i) => { g.fillStyle = c; g.fillRect(i * bw, 0, bw + 1, h * 0.68); });
    const low = ['#4a52a8', '#151515', '#b05aa8', '#151515', '#5fb3ad', '#151515', '#c9c2b0'];
    low.forEach((c, i) => { g.fillStyle = c; g.fillRect(i * bw, h * 0.68, bw + 1, h * 0.08); });
    g.fillStyle = '#121212'; g.fillRect(0, h * 0.76, w, h * 0.24);
    const r = Math.min(w, h) * 0.2;
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.beginPath(); g.arc(w / 2, h * 0.38, r * 1.15, 0, TAU); g.fill();
    drawEmblem(g, w / 2, h * 0.38, r);
    g.fillStyle = '#f4efe2';
    g.textAlign = 'center';
    g.font = `bold ${Math.round(h * 0.06)}px "VT323", "Courier New", monospace`;
    g.fillText(line1 || 'PLEASE STAND BY', w / 2, h * 0.86);
    if (line2) {
      g.font = `${Math.round(h * 0.035)}px "VT323", "Courier New", monospace`;
      g.fillStyle = '#c9c2b0';
      g.fillText(line2, w / 2, h * 0.93);
    }
    g.textAlign = 'left';
  }

  // ------------------------------------------------------------ clock face
  function drawClock(g, size, hours, minutes, opts) {
    opts = opts || {};
    const r = size / 2;
    g.clearRect(0, 0, size, size);
    g.save(); g.translate(r, r);
    g.beginPath(); g.arc(0, 0, r - 2, 0, TAU);
    g.fillStyle = opts.rim || '#3a2614'; g.fill();
    g.beginPath(); g.arc(0, 0, r * 0.86, 0, TAU);
    g.fillStyle = opts.face || '#efe6cc'; g.fill();
    g.fillStyle = '#2a1a0c';
    for (let i = 0; i < 12; i++) {
      g.save(); g.rotate(i / 12 * TAU);
      g.fillRect(-r * 0.025, -r * 0.8, r * 0.05, i % 3 ? r * 0.08 : r * 0.15);
      g.restore();
    }
    const hA = ((hours % 12) + minutes / 60) / 12 * TAU, mA = minutes / 60 * TAU;
    g.lineCap = 'round';
    g.strokeStyle = '#1a1008';
    g.lineWidth = r * 0.07;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(hA) * r * 0.45, -Math.cos(hA) * r * 0.45); g.stroke();
    g.lineWidth = r * 0.045;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(mA) * r * 0.7, -Math.cos(mA) * r * 0.7); g.stroke();
    g.fillStyle = '#b0402a';
    g.beginPath(); g.arc(0, 0, r * 0.05, 0, TAU); g.fill();
    g.restore();
  }

  // ------------------------------------------------------------ signs
  function sign(text, opts) {
    opts = opts || {};
    const w = opts.w || 512, h = opts.h || 128;
    const c = canvas(w, h), g = c.getContext('2d');
    g.fillStyle = opts.bg || '#2a1a0e'; g.fillRect(0, 0, w, h);
    if (opts.border !== false) {
      g.strokeStyle = opts.border || '#c79a3a'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
    }
    g.fillStyle = opts.fg || '#e8d3a0';
    g.font = opts.font || `bold ${Math.round(h * 0.42)}px "Futura", "Century Gothic", "Trebuchet MS", sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const lines = String(text).split('\n');
    const lh = h / (lines.length + 0.6);
    lines.forEach((l, i) => g.fillText(l, w / 2, lh * (i + 0.8)));
    if (opts.mirror) {
      const c2 = canvas(w, h), g2 = c2.getContext('2d');
      g2.translate(w, 0); g2.scale(-1, 1); g2.drawImage(c, 0, 0);
      return toTexture(c2, false);
    }
    return toTexture(c, false);
  }

  function neon(text, color, opts) {
    opts = opts || {};
    const w = opts.w || 1024, h = opts.h || 256;
    const c = canvas(w, h), g = c.getContext('2d');
    g.clearRect(0, 0, w, h);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = opts.font || `italic bold ${Math.round(h * 0.55)}px "Brush Script MT", "Snell Roundhand", "Segoe Script", cursive`;
    const draw = () => {
      if (opts.mirror) { g.save(); g.translate(w, 0); g.scale(-1, 1); }
      g.fillText(text, w / 2, h * 0.48);
      if (opts.underline) {
        g.fillRect(w * 0.2, h * 0.82, w * 0.6, h * 0.03);
      }
      if (opts.mirror) g.restore();
    };
    g.shadowColor = color; g.fillStyle = color;
    for (const b of [40, 24, 12]) { g.shadowBlur = b; draw(); }
    g.shadowBlur = 4; g.fillStyle = opts.core || '#fff4f8'; draw();
    if (opts.underline) {
      g.shadowColor = opts.underline; g.fillStyle = opts.underline; g.shadowBlur = 20;
      g.fillRect(w * 0.2, h * 0.84, w * 0.6, h * 0.03);
    }
    const t = toTexture(c, false);
    return t;
  }

  // brass plaque with engraved lines
  function plaque(title, lines, opts) {
    opts = opts || {};
    const w = 512, h = opts.h || 640;
    const c = canvas(w, h), g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, '#8a6424'); gr.addColorStop(0.45, '#d9b25a'); gr.addColorStop(0.55, '#c99a42'); gr.addColorStop(1, '#6e4c18');
    g.fillStyle = '#2a1608'; g.fillRect(0, 0, w, h);
    g.fillStyle = gr; g.fillRect(18, 18, w - 36, h - 36);
    g.strokeStyle = 'rgba(60,36,8,0.8)'; g.lineWidth = 3; g.strokeRect(34, 34, w - 68, h - 68);
    g.fillStyle = '#3a240a'; g.textAlign = 'center';
    g.font = 'bold 34px Georgia, serif';
    g.fillText(title, w / 2, 90);
    g.font = '18px Georgia, serif';
    g.fillText('THE MANAGEMENT THANKS YOU', w / 2, 120);
    g.textAlign = 'left';
    g.font = opts.font || 'bold 25px Georgia, serif';
    let y = 180;
    lines.forEach((l) => {
      const words = l.split(' ');
      let line = '';
      for (const wd of words) {
        const test = line ? line + ' ' + wd : wd;
        if (g.measureText(test).width > w - 120) { g.fillText(line, 60, y); y += 34; line = wd; }
        else line = test;
      }
      g.fillText(line, 60, y); y += 50;
    });
    return toTexture(c, false);
  }

  function residentsPlaque(names) {
    const w = 512, h = 512;
    const c = canvas(w, h), g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, '#7a5420'); gr.addColorStop(0.5, '#d8b058'); gr.addColorStop(1, '#6a4818');
    g.fillStyle = '#24140a'; g.fillRect(0, 0, w, h);
    g.fillStyle = gr; g.fillRect(16, 16, w - 32, h - 32);
    g.fillStyle = '#3a240a'; g.textAlign = 'center';
    g.font = 'bold 30px Georgia, serif';
    g.fillText('GUESTS IN RESIDENCE', w / 2, 76);
    g.font = 'italic 18px Georgia, serif';
    g.fillText('who have decided to stay with us', w / 2, 104);
    g.font = 'bold 26px Georgia, serif';
    const list = names.length ? names.slice(-9) : ['—'];
    list.forEach((n, i) => g.fillText(String(n).toUpperCase(), w / 2, 160 + i * 36));
    return toTexture(c, false);
  }

  function doorPlate(num) {
    const c = canvas(128, 64), g = c.getContext('2d');
    g.fillStyle = '#c9a24a'; g.fillRect(0, 0, 128, 64);
    g.strokeStyle = '#6a4c14'; g.lineWidth = 4; g.strokeRect(3, 3, 122, 58);
    g.fillStyle = '#2a1a06'; g.font = 'bold 40px Georgia, serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(num), 64, 34);
    return toTexture(c, false);
  }

  function dndCard() {
    const c = canvas(96, 192), g = c.getContext('2d');
    g.fillStyle = '#e9e1c8'; g.fillRect(0, 0, 96, 192);
    g.fillStyle = '#b0402a'; g.fillRect(0, 50, 96, 110);
    g.beginPath(); g.arc(48, 26, 14, 0, TAU); g.fillStyle = '#3a2a1a'; g.fill();
    g.beginPath(); g.arc(48, 26, 8, 0, TAU); g.fillStyle = '#e9e1c8'; g.fill();
    g.fillStyle = '#f6efe0'; g.textAlign = 'center';
    g.font = 'bold 20px Georgia, serif';
    ['DO', 'NOT', 'DISTURB'].forEach((w, i) => g.fillText(w, 48, 86 + i * 26));
    g.fillStyle = '#3a2a1a'; g.font = '11px Georgia, serif';
    g.fillText('THE INN BETWEEN', 48, 180);
    return toTexture(c, false);
  }

  function vendingFront(title, items, accent) {
    const c = canvas(256, 512), g = c.getContext('2d');
    g.fillStyle = '#2a2420'; g.fillRect(0, 0, 256, 512);
    g.fillStyle = accent; g.fillRect(10, 10, 236, 60);
    g.fillStyle = '#fff3dc'; g.font = 'bold 34px "Futura","Trebuchet MS",sans-serif';
    g.textAlign = 'center'; g.fillText(title, 128, 54);
    g.fillStyle = '#0d1414'; g.fillRect(14, 84, 168, 392);
    items.forEach((it, i) => {
      const y = 92 + i * 64;
      g.fillStyle = 'rgba(220,200,150,0.12)'; g.fillRect(18, y, 160, 56);
      g.fillStyle = it.color || '#c9a24a';
      for (let k = 0; k < 4; k++) g.fillRect(24 + k * 38, y + 12, 28, 34);
      g.fillStyle = '#e8dcc0'; g.font = 'bold 11px monospace'; g.textAlign = 'left';
      g.fillText(String.fromCharCode(65 + i) + (i + 1), 24, y + 54);
    });
    g.fillStyle = '#4a3a2a'; g.fillRect(190, 84, 52, 200);
    g.fillStyle = '#e8dcc0';
    for (let i = 0; i < 9; i++) g.fillRect(198 + (i % 3) * 14, 100 + Math.floor(i / 3) * 18, 10, 12);
    g.fillStyle = '#111'; g.fillRect(196, 220, 40, 10);
    g.fillStyle = '#c9a24a'; g.font = 'bold 9px monospace'; g.fillText('NO CHARGE', 194, 250);
    g.fillStyle = '#111'; g.fillRect(24, 486, 150, 18);
    return toTexture(c, false);
  }

  function noiseTexture() {
    const c = canvas(64, 64), g = c.getContext('2d');
    for (let i = 0; i < 64; i++) for (let j = 0; j < 64; j++) {
      const v = rnd() * 255 | 0;
      g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(i, j, 1, 1);
    }
    return toTexture(c);
  }

  function skyGradient() {
    const c = canvas(16, 256), g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#3a6e86'); gr.addColorStop(0.45, '#d98a9a'); gr.addColorStop(0.62, '#f4b07a'); gr.addColorStop(0.7, '#f7d48e'); gr.addColorStop(1, '#f2c28a');
    g.fillStyle = gr; g.fillRect(0, 0, 16, 256);
    return toTexture(c, false);
  }

  // ------------------------------------------------- the Garden Court
  function terrazzo() {
    const c = canvas(256, 256), g = c.getContext('2d');
    g.fillStyle = '#e4d6bc'; g.fillRect(0, 0, 256, 256);
    const chips = ['#b0603a', '#2f8a7e', '#3a2a1a', '#c99a4a', '#f4ece0', '#8a9a7a'];
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = chips[Math.floor(rnd() * chips.length)];
      g.globalAlpha = 0.55 + rnd() * 0.45;
      const s = 1 + rnd() * 4;
      g.beginPath(); g.ellipse(rnd() * 256, rnd() * 256, s, s * (0.5 + rnd() * 0.6), rnd() * 3, 0, TAU); g.fill();
    }
    g.globalAlpha = 1;
    g.fillStyle = 'rgba(160,140,110,0.6)'; g.fillRect(0, 0, 256, 2); g.fillRect(0, 0, 2, 256);
    return toTexture(c);
  }

  function grass() {
    const c = canvas(128, 128), g = c.getContext('2d');
    g.fillStyle = '#3e5a26'; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 2600; i++) {
      const k = 0.6 + rnd() * 0.9;
      g.fillStyle = `rgba(${70 * k | 0},${110 * k | 0},${40 * k | 0},0.9)`;
      g.fillRect(rnd() * 128, rnd() * 128, 1, 2 + rnd() * 4);
    }
    return toTexture(c);
  }

  // trailing vines on a transparent ground, for the balcony planters
  function vines() {
    const c = canvas(128, 512), g = c.getContext('2d');
    g.clearRect(0, 0, 128, 512);
    for (let s = 0; s < 7; s++) {
      let x = 10 + rnd() * 108;
      const len = 180 + rnd() * 330;
      for (let y = 0; y < len; y += 5) {
        x += (rnd() - 0.5) * 3;
        g.fillStyle = `rgba(${40 + rnd() * 30 | 0},${90 + rnd() * 60 | 0},${30 + rnd() * 20 | 0},1)`;
        g.beginPath(); g.ellipse(x + (rnd() - 0.5) * 10, y, 3 + rnd() * 4, 2 + rnd() * 3, rnd() * 3, 0, TAU); g.fill();
      }
    }
    const t = toTexture(c, false);
    return t;
  }

  function skylight() {
    const c = canvas(256, 256), g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 256, 256);
    gr.addColorStop(0, '#ffe4ec'); gr.addColorStop(0.5, '#fff4e0'); gr.addColorStop(1, '#d8f4ee');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#3a2a22';
    for (let i = 0; i <= 256; i += 64) { g.fillRect(i - 3, 0, 6, 256); g.fillRect(0, i - 3, 256, 6); }
    g.fillStyle = 'rgba(58,42,34,0.5)';
    for (let i = 32; i < 256; i += 64) { g.fillRect(i - 1, 0, 2, 256); g.fillRect(0, i - 1, 256, 2); }
    return toTexture(c);
  }

  // ------------------------------------------------- the grand hotel look
  // dark damask: emerald walls with a faint gold figure
  function damask(bg, fg, gold) {
    const c = canvas(256, 256), g = c.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, 256, 256);
    const motif = (cx, cy, s) => {
      g.save(); g.translate(cx, cy); g.scale(s, s);
      g.beginPath();
      g.moveTo(0, -44); g.bezierCurveTo(22, -30, 26, -6, 8, 6); g.bezierCurveTo(26, 14, 22, 36, 0, 48);
      g.bezierCurveTo(-22, 36, -26, 14, -8, 6); g.bezierCurveTo(-26, -6, -22, -30, 0, -44);
      g.fill();
      g.restore();
    };
    for (const [x, y] of [[64, 64], [192, 192], [192, -64], [-64, 192], [192, 64 + 256], [64, 64 + 256], [64 + 256, 64], [-64, -64]]) {
      g.fillStyle = fg; motif(x, y, 1.15);
      g.fillStyle = gold; g.globalAlpha = 0.18; motif(x, y, 0.55); g.globalAlpha = 1;
    }
    for (const [x, y] of [[192, 64], [64, 192]]) { g.fillStyle = fg; g.globalAlpha = 0.7; motif(x, y, 0.5); g.globalAlpha = 1; }
    for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.12})`; g.fillRect(rnd() * 256, rnd() * 256, 2, 2); }
    return toTexture(c);
  }

  // a big spiral medallion carpet: one spiral per tile, crimson, cream and moss
  function spiralCarpet(cols) {
    const size = 512, c = canvas(size, size), g = c.getContext('2d');
    const img = g.createImageData(size, size), d = img.data;
    const P = cols.map(hex);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const dx = (x - size / 2) / (size / 2), dy = (y - size / 2) / (size / 2);
      const r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      // corners share a quarter-spiral so tiles meet cleanly
      const ex = Math.min(x, size - x) / (size / 2), ey = Math.min(y, size - y) / (size / 2);
      const rc = Math.hypot(ex, ey);
      let v;
      if (r < 0.92) {
        v = Math.sin(a * 1 + r * 28 + Math.sin(a * 6) * 0.4);
        v += 0.35 * Math.sin(a * 14 + r * 40);
      } else {
        v = Math.sin(rc * 22 + Math.atan2(ey, ex) * 4) * 0.8;
      }
      const t = (v + 1.35) / 2.7;
      let col = P[Math.max(0, Math.min(P.length - 1, Math.floor(t * P.length)))];
      const edge = Math.abs(r - 0.94) < 0.02 ? 0.5 : 0;
      const fib = (rnd() - 0.5) * 28;
      const i = (y * size + x) * 4;
      d[i] = col[0] * (1 - edge) + fib; d[i + 1] = col[1] * (1 - edge) + fib * 0.8; d[i + 2] = col[2] * (1 - edge) + fib * 0.7; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return toTexture(c);
  }

  // coffered dark wood ceiling
  function coffer() {
    const c = canvas(256, 256), g = c.getContext('2d');
    g.fillStyle = '#1a120c'; g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#2a1c12'; g.fillRect(20, 20, 216, 216);
    g.fillStyle = '#140d08'; g.fillRect(36, 36, 184, 184);
    g.strokeStyle = 'rgba(201,162,74,0.25)'; g.lineWidth = 2; g.strokeRect(36, 36, 184, 184);
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(80,50,30,${rnd() * 0.15})`; g.fillRect(rnd() * 256, rnd() * 256, 3, 1); }
    return toTexture(c);
  }

  function checker(a, b) {
    const c = canvas(256, 256), g = c.getContext('2d');
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      g.fillStyle = (i + j) % 2 ? a : b; g.fillRect(i * 128, j * 128, 128, 128);
    }
    // marble veins
    for (let k = 0; k < 18; k++) {
      g.strokeStyle = `rgba(255,240,220,${0.04 + rnd() * 0.08})`; g.lineWidth = 0.6 + rnd();
      g.beginPath(); let x = rnd() * 256, y = rnd() * 256; g.moveTo(x, y);
      for (let s = 0; s < 6; s++) { x += (rnd() - 0.5) * 70; y += (rnd() - 0.3) * 50; g.lineTo(x, y); }
      g.stroke();
    }
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, 0, 256, 1); g.fillRect(0, 128, 256, 1); g.fillRect(0, 0, 1, 256); g.fillRect(128, 0, 1, 256);
    return toTexture(c);
  }

  function leather() {
    const c = canvas(128, 128), g = c.getContext('2d');
    g.fillStyle = '#4a1a12'; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const x = i * 32 + (j % 2 ? 16 : 0), y = j * 32;
      const gr = g.createRadialGradient(x + 16, y + 16, 2, x + 16, y + 16, 18);
      gr.addColorStop(0, 'rgba(120,50,36,0.9)'); gr.addColorStop(1, 'rgba(20,6,4,0.6)');
      g.fillStyle = gr; g.fillRect(x, y, 32, 32);
      g.fillStyle = '#1a0604'; g.beginPath(); g.arc(x, y, 2, 0, TAU); g.fill();
    }
    return toTexture(c);
  }

  // a soft round glow, for the strings of tiny bulbs
  function bulb() {
    const c = canvas(64, 64), g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,250,235,1)'); gr.addColorStop(0.2, 'rgba(255,220,160,0.9)');
    gr.addColorStop(0.5, 'rgba(255,170,90,0.25)'); gr.addColorStop(1, 'rgba(255,140,60,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return toTexture(c, false);
  }

  // a shaft of light falling through haze
  function shaft() {
    const c = canvas(64, 256), g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, 'rgba(200,255,230,0.55)'); gr.addColorStop(1, 'rgba(120,200,170,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    const side = g.createLinearGradient(0, 0, 64, 0);
    side.addColorStop(0, 'rgba(0,0,0,1)'); side.addColorStop(0.5, 'rgba(0,0,0,0)'); side.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = side; g.fillRect(0, 0, 64, 256);
    return toTexture(c, false);
  }

  // marquee face: green neon lettering, rows of red chaser bulbs underneath
  function marquee(text, phase) {
    const c = canvas(1024, 256), g = c.getContext('2d');
    g.fillStyle = '#0c120e'; g.fillRect(0, 0, 1024, 256);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = 'bold 120px "Futura","Century Gothic","Trebuchet MS",sans-serif';
    g.fillStyle = '#5dffa0'; g.shadowColor = '#3dff8a';
    for (const b of [36, 18, 8]) { g.shadowBlur = b; g.fillText(text, 512, 100); }
    g.shadowBlur = 0; g.fillStyle = '#eafff0'; g.fillText(text, 512, 100);
    for (let row = 0; row < 3; row++) for (let i = 0; i < 48; i++) {
      const on = (i + row + phase) % 3 !== 0;
      g.fillStyle = on ? '#ff3a2a' : '#3a0c08';
      g.shadowColor = '#ff2a1a'; g.shadowBlur = on ? 12 : 0;
      g.beginPath(); g.arc(14 + i * 21, 190 + row * 20, 6, 0, TAU); g.fill();
    }
    return toTexture(c, false);
  }

  INN.Tex = {
    damask, spiralCarpet, coffer, checker, leather, bulb, shaft, marquee,
    terrazzo, grass, vines, skylight,
    canvas, toTexture, carpet, wood, wallpaper, tile, ceiling, shag, fabric,
    drawEmblem, drawTestCard, drawClock, sign, neon, plaque, residentsPlaque,
    doorPlate, dndCard, vendingFront, noiseTexture, skyGradient,
  };
})(window.INN);
