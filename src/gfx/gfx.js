import { nightify, NIGHT_STEPS } from './color.js';

export const FONT = '"Press Start 2P", monospace';

// Petite surcouche du contexte 2D : couleurs de palette, teinte de nuit, texte pixel.
export class Gfx {
  constructor(ctx, palette) {
    this.ctx = ctx;
    this.pal = palette;
    this.glow = new Set(palette.glow);
    this.step = 0;
  }

  // night : 0 (plein jour) -> 1 (pleine nuit)
  setNight(night) {
    this.step = Math.round(Math.max(0, Math.min(1, night)) * NIGHT_STEPS);
  }

  // Accepte une clé de palette ou un hex. Préfixe « ! » = jamais assombri.
  col(c) {
    if (c[0] === '!') return c.slice(1);
    const hex = this.pal.colors[c] || c;
    return this.glow.has(c) ? hex : nightify(hex, this.step);
  }

  rect(x, y, w, h, c) {
    this.ctx.fillStyle = this.col(c);
    this.ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  px(x, y, c) {
    this.rect(x, y, 1, 1, c);
  }

  // Disque plein en pixels (pas d'anticrénelage).
  disc(cx, cy, r, c) {
    this.ctx.fillStyle = this.col(c);
    for (let dy = -r; dy <= r; dy++) {
      const w = Math.floor(Math.sqrt(r * r - dy * dy + r * 0.8));
      this.ctx.fillRect(Math.round(cx - w), Math.round(cy + dy), w * 2 + 1, 1);
    }
  }

  text(str, x, y, c = 'uiText', { size = 8, align = 'left', shadow = null } = {}) {
    const ctx = this.ctx;
    ctx.font = `${size}px ${FONT}`;
    ctx.textBaseline = 'top';
    let dx = x;
    if (align !== 'left') {
      const w = str.length * size;
      dx = align === 'center' ? x - w / 2 : x - w;
    }
    dx = Math.round(dx);
    if (shadow) {
      ctx.fillStyle = this.col(shadow);
      ctx.fillText(str, dx + 1, y + 1);
    }
    ctx.fillStyle = this.col(c);
    ctx.fillText(str, dx, y);
  }

  // Cadre façon boîte de dialogue rétro.
  panel(x, y, w, h) {
    this.rect(x, y, w, h, 'ink');
    this.rect(x + 1, y + 1, w - 2, h - 2, 'uiBorder');
    this.rect(x + 2, y + 2, w - 4, h - 4, 'ui');
    this.rect(x + 3, y + 3, w - 6, 1, 'uiLight');
  }
}

// Coupe un texte en lignes de `max` caractères (police à chasse fixe).
export function wrap(text, max) {
  const out = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      if (!line) line = word;
      else if (line.length + 1 + word.length <= max) line += ' ' + word;
      else { out.push(line); line = word; }
      while (line.length > max) { out.push(line.slice(0, max)); line = line.slice(max); }
    }
    out.push(line);
  }
  return out;
}
