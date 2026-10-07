import { W, H } from '../config.js';
import { wrap } from '../gfx/gfx.js';

const KINDS = {
  VIT: { label: 'VIT', color: '#3fae5a' },
  MEURT: { label: 'MEURT', color: '#d9534f' },
  MAUDIT: { label: 'MAUDIT', color: '#9b59d0' },
};

// Carte de verdict plein écran : VIT / MEURT / MAUDIT.
export class Verdict {
  constructor(game, { kind, title, text, onDone }) {
    this.game = game;
    this.k = KINDS[kind];
    this.title = title;
    this.text = text;
    this.onDone = onDone;
    this.t = 0;
  }

  update(dt) {
    this.t += dt;
    if (this.t > 0.8 && (this.game.input.pressed('a') || this.game.input.pressed('b'))) {
      this.done = true;
      this.onDone?.();
    }
  }

  draw(g) {
    const ctx = g.ctx;
    ctx.fillStyle = `rgba(10,6,16,${Math.min(0.85, this.t * 2)})`;
    ctx.fillRect(0, 0, W, H);
    const k = Math.min(1, this.t * 3);
    const y = Math.round(40 + (1 - k) * 40);
    ctx.globalAlpha = k;
    const titleL = wrap(this.title, 18);
    const textL = wrap(this.text, 19);
    const h = 52 + titleL.length * 12 + textL.length * 11;
    g.panel(10, y, W - 20, h);
    const lw = this.k.label.length * 16 + 16;
    g.rect(W / 2 - lw / 2, y + 10, lw, 24, '!' + this.k.color);
    g.rect(W / 2 - lw / 2, y + 30, lw, 4, '!#1b1424');
    g.text(this.k.label, W / 2, y + 14, '!#ffffff', { size: 16, align: 'center' });
    titleL.forEach((l, i) => g.text(l, W / 2, y + 44 + i * 12, 'uiBorder', { align: 'center' }));
    textL.forEach((l, i) => g.text(l, 18, y + 50 + titleL.length * 12 + i * 11, 'uiText'));
    ctx.globalAlpha = 1;
    if (this.t > 0.8 && Math.floor(this.t * 2) % 2 === 0) g.text('A', W / 2, y + h + 6, 'uiDim', { align: 'center' });
  }
}
