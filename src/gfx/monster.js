// Monstres de combat dessinés en code (≈ 60 px), à partir de leur `shape`.
// (cx, by) = centre horizontal et ligne du sol.

function ellipse(g, cx, cy, rx, ry, c) {
  g.ctx.fillStyle = g.col(c);
  for (let dy = -ry; dy <= ry; dy++) {
    const w = Math.round(rx * Math.sqrt(1 - (dy * dy) / (ry * ry + 0.01)));
    g.ctx.fillRect(Math.round(cx - w), Math.round(cy + dy), w * 2 + 1, 1);
  }
}

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return '!#' + ((1 << 24) | (f((n >> 16) & 255) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).slice(1);
}

function eyes(g, cx, cy, gap, r, t, look = 0) {
  const blink = Math.floor(t * 1.3) % 5 === 0 && (t * 1.3) % 1 < 0.15;
  for (const s of [-1, 1]) {
    const ex = cx + s * gap;
    if (blink) { g.rect(ex - r, cy, r * 2 + 1, 1, '!#1b1424'); continue; }
    g.disc(ex, cy, r, '!#f5e9d0');
    g.disc(ex + look, cy + 1, Math.max(1, r - 2), '!#1b1424');
    g.px(ex + look - 1, cy - 1, '!#ffffff');
  }
}

function teeth(g, cx, cy, w, c = '!#f5e9d0') {
  for (let x = -w; x <= w; x += 3) { g.rect(cx + x, cy, 2, 3, c); g.px(cx + x, cy + 3, c); }
}

const SHAPES = {
  blob(g, cx, by, m, t, C) {
    const sq = Math.sin(t * 4) * 2;
    ellipse(g, cx, by - 14, 24 + sq, 15 - sq / 2, C.dark);
    ellipse(g, cx, by - 15, 22 + sq, 13 - sq / 2, C.body);
    ellipse(g, cx - 8, by - 22, 6, 3, C.light);
    eyes(g, cx, by - 17, 8, 4, t);
    g.rect(cx - 4, by - 9, 8, 1, '!#1b1424');
  },
  beast(g, cx, by, m, t, C) {
    const br = Math.round(Math.sin(t * 2) * 1.5);
    for (const lx of [-18, -8, 6, 16]) g.rect(cx + lx, by - 12, 6, 12, C.dark);
    ellipse(g, cx, by - 22 + br, 26, 14, C.body);
    ellipse(g, cx, by - 34 + br, 15, 12, C.body);
    for (const s of [-1, 1]) { g.rect(cx + s * 12 - 2, by - 48 + br, 5, 7, C.accent); g.rect(cx + s * 12 - 1, by - 51 + br, 3, 3, C.accent); }
    ellipse(g, cx, by - 27 + br, 9, 5, C.light);
    eyes(g, cx, by - 37 + br, 6, 3, t);
    g.rect(cx - 6, by - 27 + br, 13, 4, '!#1b1424');
    if (m.teeth) teeth(g, cx - 5, by - 27 + br, 5);
  },
  wisp(g, cx, by, m, t, C) {
    const fy = by - 30 + Math.sin(t * 3) * 4;
    for (let i = 0; i < 4; i++) {
      const wob = Math.sin(t * 8 + i) * 3;
      g.disc(cx + wob, fy - 10 - i * 7, 11 - i * 3, i % 2 ? C.body : C.light);
    }
    g.disc(cx, fy, 15, C.body);
    g.disc(cx, fy + 2, 11, C.light);
    eyes(g, cx, fy, 6, 3, t);
    g.rect(cx - 2, fy + 7, 5, 2, '!#1b1424');
    ellipse(g, cx, by - 2, 12, 3, '!rgba(0,0,0,0.25)');
  },
  shroom(g, cx, by, m, t, C) {
    const sway = Math.round(Math.sin(t * 2) * 2);
    g.rect(cx - 9, by - 26, 18, 26, C.body);
    g.rect(cx - 9, by - 26, 4, 26, C.light);
    g.rect(cx - 12, by - 4, 6, 4, C.body);
    g.rect(cx + 6, by - 4, 6, 4, C.body);
    ellipse(g, cx + sway, by - 30, 28, 14, C.dark);
    ellipse(g, cx + sway, by - 32, 26, 12, C.accent);
    g.rect(cx - 28 + sway, by - 30, 57, 4, C.dark);
    for (const [sx, sy, r] of [[-12, -38, 4], [6, -40, 3], [16, -33, 3], [-2, -33, 2]]) g.disc(cx + sx + sway, by + sy, r, '!#f5e9d0');
    eyes(g, cx, by - 18, 4, 2, t);
    g.rect(cx - 3, by - 11, 6, 1, '!#1b1424');
  },
  fluff(g, cx, by, m, t, C) {
    const br = Math.sin(t * 1.5) * 2;
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      g.disc(cx + Math.cos(a) * 24, by - 28 + Math.sin(a) * (22 + br), 8, i % 2 ? C.body : C.light);
    }
    ellipse(g, cx, by - 28, 24, 22 + br, C.body);
    g.rect(cx - 18, by - 6, 8, 6, C.dark);
    g.rect(cx + 10, by - 6, 8, 6, C.dark);
    g.disc(cx - 7, by - 32, 2, '!#1b1424');
    g.disc(cx + 7, by - 32, 2, '!#1b1424');
    ellipse(g, cx - 13, by - 26, 4, 2, C.accent);
    ellipse(g, cx + 13, by - 26, 4, 2, C.accent);
    g.rect(cx - 3, by - 26, 7, 2, '!#1b1424');
  },
  eye(g, cx, by, m, t, C) {
    const fy = by - 34 + Math.sin(t * 2) * 3;
    for (let i = 0; i < 6; i++) {
      const x0 = cx - 15 + i * 6;
      for (let k = 0; k < 18; k++) g.rect(x0 + Math.round(Math.sin(t * 4 + i + k * 0.4) * 2), fy + 14 + k, 3, 1, k % 4 ? C.dark : C.accent);
    }
    g.disc(cx, fy, 21, C.dark);
    g.disc(cx, fy, 19, '!#f5e9d0');
    const lx = Math.round(Math.sin(t * 0.9) * 6);
    g.disc(cx + lx, fy, 10, C.accent);
    g.disc(cx + lx, fy, 5, '!#1b1424');
    g.rect(cx + lx - 4, fy - 5, 3, 2, '!#ffffff');
    // reflets prismatiques
    for (const [c, a] of [['!#ec9d49', 0], ['!#78c47d', 2], ['!#c9a6ff', 4]]) g.px(cx + Math.cos(t + a) * 17, fy + Math.sin(t + a) * 17, c);
  },
  golem(g, cx, by, m, t, C) {
    const br = Math.round(Math.sin(t * 1.2));
    g.rect(cx - 18, by - 16, 12, 16, C.dark);
    g.rect(cx + 6, by - 16, 12, 16, C.dark);
    g.rect(cx - 22, by - 44 + br, 44, 30, C.body);
    g.rect(cx - 22, by - 44 + br, 44, 4, C.light);
    g.rect(cx - 32, by - 40 + br, 10, 26, C.dark);
    g.rect(cx + 22, by - 40 + br, 10, 26, C.dark);
    g.rect(cx - 12, by - 58 + br, 24, 16, C.body);
    g.rect(cx - 12, by - 58 + br, 24, 3, C.light);
    const glow = Math.sin(t * 3) > 0 ? C.accent : '!#f5e9d0';
    g.rect(cx - 7, by - 52 + br, 4, 3, glow);
    g.rect(cx + 3, by - 52 + br, 4, 3, glow);
    for (const [x, y] of [[-14, -34], [10, -28], [-4, -22]]) { g.rect(cx + x, by + y + br, 4, 6, C.accent); g.px(cx + x + 1, by + y + br - 1, C.accent); }
  },
  rock(g, cx, by, m, t, C) {
    ellipse(g, cx, by - 7, 12, 8, C.dark);
    ellipse(g, cx, by - 8, 11, 7, C.body);
    g.rect(cx - 5, by - 12, 4, 2, '!#cdc5c7');
  },
  bell(g, cx, by, m, t, C) {
    const swing = Math.sin(t * 1.4) * 3;
    const top = by - 70;
    // chaîne
    for (let y = 0; y < top; y += 4) g.rect(cx - 1 + Math.round(swing * (y / top)), y, 3, 3, '!#5c5960');
    // cloche
    for (let r = 0; r < 58; r++) {
      const w = Math.round(10 + Math.pow(r / 58, 1.6) * 30 + (r > 50 ? (r - 50) * 1.5 : 0));
      const x = cx + Math.round(swing) - w;
      g.rect(x, top + r, w * 2, 1, r % 9 === 0 ? C.light : C.body);
      g.rect(x, top + r, 3, 1, C.dark);
      g.rect(x + w * 2 - 3, top + r, 3, 1, C.dark);
    }
    g.rect(cx + swing - 42, top + 56, 84, 4, C.accent);
    // fissures
    g.rect(cx + swing + 10, top + 14, 1, 10, '!#1b1424');
    g.rect(cx + swing + 11, top + 23, 1, 8, '!#1b1424');
    // œil unique
    const ey = top + 30;
    g.disc(cx + swing, ey, 9, '!#1b1424');
    g.disc(cx + swing, ey, 7, '!#f5e9d0');
    g.disc(cx + swing + Math.sin(t) * 3, ey, 4, '!#c4523b');
    g.disc(cx + swing + Math.sin(t) * 3, ey, 2, '!#1b1424');
    // battant
    const clap = Math.sin(t * 2.2) * 8;
    g.rect(cx + swing + clap - 1, top + 58, 3, 8, '!#5c5960');
    g.disc(cx + swing + clap, top + 68, 5, C.dark);
  },
};

export function drawMonster(g, cx, by, m, t, flash = false) {
  const C = flash
    ? { body: '!#ffffff', dark: '!#ffffff', light: '!#ffffff', accent: '!#ffffff' }
    : { body: '!' + m.body, dark: shade(m.body, 0.62), light: shade(m.body, 1.25), accent: '!' + m.accent };
  if (!m.boss) {
    g.ctx.fillStyle = 'rgba(0,0,0,0.3)';
    g.ctx.fillRect(cx - 22, by - 1, 44, 3);
  }
  (SHAPES[m.shape] || SHAPES.blob)(g, cx, by, m, t, C);
}
