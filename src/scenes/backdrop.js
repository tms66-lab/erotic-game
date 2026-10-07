import { W, H } from '../config.js';
import { hash } from '../gfx/tiles.js';

// Décor animé de l'écran titre : ciel du crépuscule, château lointain,
// les deux visages de Valombre (doré à gauche, lunaire à droite).
const SKY = ['#1d3036', '#254d4c', '#3e7f83', '#629199', '#87757c', '#b6948a', '#d79877', '#e4b36e'];

export function drawBackdrop(g, time) {
  const band = Math.ceil(170 / SKY.length);
  SKY.forEach((c, i) => {
    g.rect(0, i * band, W, band, '!' + c);
    // tramage entre deux bandes
    if (i > 0) for (let x = (i % 2); x < W; x += 2) g.px(x, i * band - 1, '!' + c);
  });

  for (let i = 0; i < 40; i++) {
    const x = Math.floor(hash(i, 1) * W);
    const y = Math.floor(hash(i, 2) * 80);
    if (Math.sin(time * 2 + i) > -0.3) g.px(x, y, hash(i, 3) > 0.8 ? '!#ffd25a' : '!#e8e4ff');
  }

  // lune
  g.disc(140, 34, 9, '!#f5e9d0');
  g.disc(144, 31, 8, '!#254d4c');

  // montagnes lointaines
  for (let x = 0; x < W; x++) {
    const h = 120 + Math.sin(x * 0.045) * 16 + Math.sin(x * 0.13 + 1) * 6;
    g.rect(x, h, 1, H - h, '!#465e74');
    if (h < 112) g.px(x, Math.round(h), '!#e8e4ff');
  }

  // château sur la colline
  const cx = 118;
  g.rect(cx, 118, 30, 30, '!#213e3e');
  g.rect(cx - 4, 106, 8, 42, '!#213e3e');
  g.rect(cx + 26, 102, 8, 46, '!#213e3e');
  g.rect(cx + 11, 96, 8, 52, '!#213e3e');
  g.rect(cx + 13, 90, 4, 6, '!#213e3e');
  for (const [wx, wy] of [[cx - 2, 112], [cx + 28, 108], [cx + 14, 102], [cx + 6, 128], [cx + 20, 124]]) {
    if (Math.sin(time * 1.5 + wx) > -0.8) g.rect(wx, wy, 2, 3, '!#ffcf5a');
  }

  // collines proches
  for (let x = 0; x < W; x++) {
    const h = 150 + Math.sin(x * 0.03 + 2) * 10 + Math.sin(x * 0.11) * 4;
    g.rect(x, h, 1, H - h, '!#1d3036');
  }
  // sapins en silhouette
  for (let i = 0; i < 14; i++) {
    const tx = Math.floor(hash(i, 7) * W);
    const th = 10 + Math.floor(hash(i, 8) * 12);
    const base = 158 + Math.floor(hash(i, 9) * 10);
    for (let r = 0; r < th; r++) {
      const w = Math.floor((r / th) * 5);
      g.rect(tx - w, base - th + r, w * 2 + 1, 1, '!#140f1e');
    }
  }
  g.rect(0, 175, W, H - 175, '!#140f1e');

  // lucioles
  for (let i = 0; i < 10; i++) {
    const fx = (hash(i, 11) * W + Math.sin(time * 0.7 + i) * 12 + W) % W;
    const fy = 165 + Math.sin(time * 1.3 + i * 2) * 10 + hash(i, 12) * 40;
    if (Math.sin(time * 3 + i) > 0) g.px(fx, fy, '!#ffd25a');
  }
}
