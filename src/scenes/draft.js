import { W } from '../config.js';
import { wrap } from '../gfx/gfx.js';
import { SKILLS } from '../world/skills.js';
import { sfx } from '../audio/sound.js';

// « Choisis-en un. » Trois dons tirés au hasard, on en garde un pour la descente.
export class DonDraft {
  constructor(game, { owned, pick, total, onPick }) {
    this.game = game;
    this.onPick = onPick;
    this.pick = pick;
    this.total = total;
    this.t = 0;
    this.index = 0;
    const pool = SKILLS.map((_, i) => i).filter((i) => !owned.includes(i));
    this.options = [];
    while (this.options.length < 3 && pool.length) this.options.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }

  update(dt) {
    this.t += dt;
    const input = this.game.input;
    if (input.pressed('up')) { this.index = (this.index + this.options.length - 1) % this.options.length; sfx('select'); }
    if (input.pressed('down')) { this.index = (this.index + 1) % this.options.length; sfx('select'); }
    if (this.t > 0.4 && input.pressed('a')) {
      sfx('confirm');
      this.done = true;
      this.onPick(this.options[this.index]);
    }
  }

  draw(g) {
    g.ctx.fillStyle = 'rgba(10,6,16,0.95)';
    g.ctx.fillRect(0, 0, W, 240);
    g.text('CHOISIS UN DON', W / 2, 8, 'uiBorder', { align: 'center' });
    g.text('(' + this.pick + '/' + this.total + ')', W / 2, 19, 'uiDim', { align: 'center' });
    this.options.forEach((id, i) => {
      const sk = SKILLS[id];
      const y = 32 + i * 68;
      const sel = i === this.index;
      const bob = sel ? Math.round(Math.sin(this.t * 5)) : 0;
      g.panel(sel ? 6 : 12, y + bob, sel ? W - 12 : W - 24, 62);
      if (sel) g.rect(8, y + bob + 4, 2, 54, 'uiBorder');
      g.text(sk.name, 16, y + 7 + bob, sel ? 'uiBorder' : 'uiText');
      g.text(sk.cost + ' Éclat' + (sk.cost > 1 ? 's' : ''), 16, y + 18 + bob, 'uiAccent');
      wrap(sk.desc, 19).slice(0, 3).forEach((l, k) => g.text(l, 16, y + 30 + k * 10 + bob, sel ? 'uiText' : 'uiDim'));
    });
  }
}
