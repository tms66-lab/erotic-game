import { W, H } from '../config.js';
import { wrap } from '../gfx/gfx.js';
import { drawStar } from '../gfx/sprites.js';
import { hash } from '../gfx/tiles.js';
import { FATES } from '../world/fates.js';
import { Dialogue, ListMenu } from './ui.js';
import { World } from './world.js';
import { SKILLS } from '../world/skills.js';
import { sfx } from '../audio/sound.js';

// « Trouve ton mois. Accepte ton destin. Pas de reroll. »
export class FateScene {
  constructor(game) {
    this.game = game;
    this.index = new Date().getMonth();
    this.time = 0;
  }

  tick(dt) {
    this.time += dt;
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.pressed('left') || input.pressed('up')) { this.index = (this.index + 11) % 12; sfx('select'); }
    if (input.pressed('right') || input.pressed('down')) { this.index = (this.index + 1) % 12; sfx('select'); }
    if (input.pressed('a')) this.confirm();
  }

  confirm() {
    this.game.push(new ListMenu(this.game, {
      title: 'Accepter ?',
      x: 30, y: 150, w: W - 60,
      items: [
        { label: 'Oui', action: () => this.start() },
        { label: 'Non', action: () => {} },
      ],
    }));
  }

  start() {
    const month = this.index;
    const fate = FATES[month];
    this.game.push(new Dialogue(this.game, [
      { who: '', text: 'Pas de reroll. Pas de changement de mois.' },
      { who: '', text: 'Le Royaume se souviendra de toi, ' + fate.title + '.' },
    ], {
      onDone: () => this.game.fadeTo(() => {
        const world = new World(this.game, { month, zone: 'halte', x: 9, y: 12, dir: 'up' });
        this.game.setScene(world);
        world.intro();
      }),
    }));
  }

  draw(g) {
    g.setNight(0);
    g.rect(0, 0, W, H, '!#1a1433');
    for (let i = 0; i < 50; i++) {
      const x = Math.floor(hash(i, 21) * W);
      const y = Math.floor(hash(i, 22) * H);
      if (Math.sin(this.time * 2 + i) > 0) g.px(x, y, '!#5a4f7a');
    }

    g.text('TON MOIS DE', W / 2, 14, 'uiDim', { align: 'center' });
    g.text('NAISSANCE DÉCIDE', W / 2, 26, 'uiDim', { align: 'center' });
    g.text('DE TON DESTIN', W / 2, 38, 'uiDim', { align: 'center' });

    const f = FATES[this.index];
    const nudge = Math.floor(this.time * 3) % 2;
    g.text('<', 10 - nudge, 62, 'uiBorder');
    g.text('>', W - 18 + nudge, 62, 'uiBorder');
    g.text(f.month, W / 2, 62, 'uiText', { align: 'center' });

    g.panel(8, 78, W - 16, 148);
    let y = 86;
    for (const line of wrap(f.title, 19)) {
      g.text(line, W / 2, y, 'uiBorder', { align: 'center' });
      y += 11;
    }
    y += 4;
    for (let i = 0; i < 5; i++) drawStar(g, W / 2 - 34 + i * 14, y, i < f.luck);
    y += 14;
    g.text('Don :', 16, y, 'uiDim');
    y += 11;
    g.text(f.gift, 16, y, 'uiAccent');
    y += 11;
    g.text('Combat :', 16, y, 'uiDim');
    y += 11;
    g.text(SKILLS[this.index].name, 16, y, 'uiBorder');
    y += 14;
    for (const line of wrap(f.text, 19)) {
      g.text(line, 16, y, 'uiText');
      y += 10;
    }

    if (!this.game.overlays.length && Math.floor(this.time * 2) % 2 === 0) {
      g.text('A : ACCEPTER', W / 2, 230, 'uiText', { align: 'center' });
    }
  }
}
