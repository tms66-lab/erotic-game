import { W, H } from '../config.js';
import { wrap } from '../gfx/gfx.js';

const CHARS_PER_LINE = 20;
const LINES_PER_PAGE = 3;
const TYPE_SPEED = 45;

// Boîte de dialogue avec effet machine à écrire.
// lines : chaînes ou { who, text } ; `who: ''` = narration.
export class Dialogue {
  constructor(game, lines, { speaker = '', onDone } = {}) {
    this.game = game;
    this.onDone = onDone;
    this.pages = [];
    for (const l of lines) {
      const who = typeof l === 'string' ? speaker : l.who;
      const text = typeof l === 'string' ? l : l.text;
      const wrapped = wrap(text, CHARS_PER_LINE);
      for (let i = 0; i < wrapped.length; i += LINES_PER_PAGE) {
        this.pages.push({ who, lines: wrapped.slice(i, i + LINES_PER_PAGE) });
      }
    }
    this.page = 0;
    this.shown = 0;
    this.time = 0;
  }

  get total() {
    return this.pages[this.page].lines.join('').length;
  }

  update(dt) {
    const input = this.game.input;
    this.time += dt;
    this.shown += dt * TYPE_SPEED * (input.down('b') ? 3 : 1);
    if (input.pressed('a') || input.pressed('b')) {
      if (this.shown < this.total) {
        this.shown = this.total;
      } else if (this.page < this.pages.length - 1) {
        this.page++;
        this.shown = 0;
      } else {
        this.done = true;
        this.onDone?.();
      }
    }
  }

  draw(g) {
    const p = this.pages[this.page];
    const y = H - 60;
    g.panel(4, y, W - 8, 56);
    if (p.who) {
      const w = p.who.length * 8 + 12;
      g.panel(8, y - 13, w, 15);
      g.text(p.who, 14, y - 9, 'uiBorder');
    }
    let left = Math.floor(this.shown);
    p.lines.forEach((line, i) => {
      const part = line.slice(0, Math.max(0, left));
      left -= line.length;
      g.text(part, 11, y + 10 + i * 13, p.who ? 'uiText' : 'uiAccent');
    });
    if (this.shown >= this.total && Math.floor(this.time * 3) % 2 === 0) {
      g.rect(W - 18, y + 46, 6, 2, 'uiBorder');
      g.rect(W - 17, y + 48, 4, 1, 'uiBorder');
      g.rect(W - 16, y + 49, 2, 1, 'uiBorder');
    }
  }
}

// Menu à liste : haut/bas pour choisir, A pour valider, B pour fermer.
export class ListMenu {
  constructor(game, { title = '', items, x = 20, y = 40, w = W - 40, cancel = true, onCancel }) {
    this.game = game;
    this.title = title;
    this.items = items;
    this.x = x; this.y = y; this.w = w;
    this.cancel = cancel;
    this.onCancel = onCancel;
    this.index = 0;
  }

  update() {
    const input = this.game.input;
    if (input.pressed('up')) this.index = (this.index + this.items.length - 1) % this.items.length;
    if (input.pressed('down')) this.index = (this.index + 1) % this.items.length;
    if (input.pressed('a')) {
      const item = this.items[this.index];
      if (item.close !== false) this.done = true;
      item.action?.();
    } else if (this.cancel && (input.pressed('b') || input.pressed('start'))) {
      this.done = true;
      this.onCancel?.();
    }
  }

  draw(g) {
    const head = this.title ? 18 : 6;
    const h = head + this.items.length * 16 + 6;
    g.panel(this.x, this.y, this.w, h);
    if (this.title) g.text(this.title, this.x + this.w / 2, this.y + 8, 'uiBorder', { align: 'center' });
    this.items.forEach((it, i) => {
      const iy = this.y + head + i * 16 + 4;
      const sel = i === this.index;
      if (sel) {
        g.rect(this.x + 4, iy - 3, this.w - 8, 14, 'uiLight');
        g.rect(this.x + 8, iy, 2, 7, 'uiBorder');
        g.rect(this.x + 10, iy + 1, 1, 5, 'uiBorder');
        g.rect(this.x + 11, iy + 2, 1, 3, 'uiBorder');
      }
      g.text(it.label, this.x + 16, iy, sel ? 'uiText' : 'uiDim');
    });
  }
}
