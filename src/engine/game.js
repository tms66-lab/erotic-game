import { W, H } from '../config.js';
import { Gfx } from '../gfx/gfx.js';
import { PALETTE } from '../world/palette.js';

const FADE_TIME = 0.25;

// Une scène active + une pile de surcouches (dialogues, menus) qui captent
// les entrées tant qu'elles sont ouvertes.
export class Game {
  constructor(canvas, input) {
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.ctx.imageSmoothingEnabled = false;
    this.g = new Gfx(this.ctx, PALETTE);
    this.input = input;
    this.scene = null;
    this.overlays = [];
    this.fade = null;
  }

  setScene(scene) {
    this.scene = scene;
    this.overlays = [];
  }

  push(overlay) {
    this.overlays.push(overlay);
  }

  // Fondu au noir, `swap()` au milieu, puis retour.
  fadeTo(swap) {
    if (this.fade) return;
    this.fade = { t: 0, swap, swapped: false };
  }

  update(dt) {
    if (this.fade) {
      const f = this.fade;
      f.t += dt;
      if (!f.swapped && f.t >= FADE_TIME) { f.swapped = true; f.swap(); }
      if (f.t >= FADE_TIME * 2) this.fade = null;
    } else if (this.overlays.length) {
      this.overlays[this.overlays.length - 1].update(dt);
      this.overlays = this.overlays.filter((o) => !o.done);
    } else {
      this.scene?.update(dt);
    }
    // Les scènes avancent leur horloge même sous un dialogue (eau, lucioles…).
    if (this.overlays.length && this.scene?.tick) this.scene.tick(dt);
    this.input.endFrame();
  }

  draw() {
    const g = this.g;
    this.scene?.draw(g);
    for (const o of this.overlays) o.draw(g);
    if (this.fade) {
      const k = this.fade.t / FADE_TIME;
      const a = k <= 1 ? k : 2 - k;
      this.ctx.fillStyle = `rgba(20,15,30,${Math.max(0, Math.min(1, a))})`;
      this.ctx.fillRect(0, 0, W, H);
    }
  }
}
