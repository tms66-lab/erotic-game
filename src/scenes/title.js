import { W } from '../config.js';
import { loadSave, clearSave } from '../engine/save.js';
import { drawBackdrop } from './backdrop.js';
import { FateScene } from './fate.js';
import { World } from './world.js';
import { ListMenu } from './ui.js';
import { playMusic, sfx } from '../audio/sound.js';

export class TitleScene {
  constructor(game) {
    this.game = game;
    this.time = 0;
    this.save = loadSave();
    this.menu = null;
    playMusic('night');
  }

  openMenu() {
    const items = [];
    if (this.save) {
      items.push({ label: 'Continuer', action: () => this.game.fadeTo(() => this.game.setScene(new World(this.game, this.save))) });
    }
    items.push({
      label: 'Nouvelle partie',
      action: () => this.game.fadeTo(() => { clearSave(); this.game.setScene(new FateScene(this.game)); }),
    });
    this.game.push(new ListMenu(this.game, { items, x: 30, y: 180, w: W - 60 }));
  }

  tick(dt) {
    this.time += dt;
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.pressed('a') || input.pressed('start')) { sfx('confirm'); this.openMenu(); }
  }

  draw(g) {
    g.setNight(0);
    drawBackdrop(g, this.time);
    const y = 46 + Math.round(Math.sin(this.time * 1.5) * 2);
    g.text('VALOMBRE', W / 2 + 2, y + 2, '!#140f1e', { size: 16, align: 'center' });
    g.text('VALOMBRE', W / 2, y, 'uiBorder', { size: 16, align: 'center' });
    g.text('Chaque route a', W / 2, y + 26, 'uiText', { align: 'center', shadow: '!#140f1e' });
    g.text('deux visages.', W / 2, y + 38, 'uiText', { align: 'center', shadow: '!#140f1e' });
    if (!this.game.overlays.length && Math.floor(this.time * 2) % 2 === 0) {
      g.text('APPUIE SUR A', W / 2, 200, 'uiText', { align: 'center', shadow: '!#140f1e' });
    }
  }
}
