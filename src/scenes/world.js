import { W, H, TILE, DAY_LENGTH } from '../config.js';
import { DIR_VEC, OPPOSITE } from '../engine/input.js';
import { writeSave } from '../engine/save.js';
import { drawTile, SOLID, LIGHTS } from '../gfx/tiles.js';
import { wrap } from '../gfx/gfx.js';
import { drawHuman, drawBlob, drawPage, drawSunMoon } from '../gfx/sprites.js';
import { ZONES, PLAYER_LOOK } from '../world/zones.js';
import { FATES } from '../world/fates.js';
import { PAGES } from '../world/journal.js';
import { Dialogue, ListMenu } from './ui.js';
import { TitleScene } from './title.js';

const WALK_SPEED = 4.5; // tuiles / seconde
const RUN_SPEED = 8;
const PAGE_COUNT = Object.keys(PAGES).length;

const MOUSSE_LINES = [
  'Mrrp.',
  'Mousse te tend un caillou. C\'est un cadeau. Refuser serait une insulte grave.',
  'Mousse a fait une sieste debout pendant que tu marchais. Impressionnant.',
  'Mousse fixe une lanterne avec beaucoup trop d\'intensité.',
  'Mrrp ? (Traduction approximative : « on mange quand ? »)',
];

// 0 = plein jour, 1 = pleine nuit, avec aube et crépuscule progressifs.
function nightFactor(clock) {
  const p = (clock % DAY_LENGTH) / DAY_LENGTH;
  if (p < 0.4) return 0;
  if (p < 0.5) return (p - 0.4) / 0.1;
  if (p < 0.9) return 1;
  return 1 - (p - 0.9) / 0.1;
}

const lerp = (a, b, t) => a + (b - a) * t;

function mover(x, y, dir) {
  return { x, y, fx: x, fy: y, tx: x, ty: y, t: 0, moving: false, dir, step: 0 };
}

export class World {
  constructor(game, save) {
    this.game = game;
    this.s = {
      flags: {},
      pages: [],
      clock: DAY_LENGTH * 0.1,
      ...save,
    };
    this.s.fate = FATES[this.s.month];
    this.time = 0;
    this.enter(save.zone, save.x, save.y, save.dir);
  }

  get zone() {
    return ZONES[this.zoneId];
  }

  // ---------- état sauvegardé ----------
  persist() {
    const { flags, pages, clock, month } = this.s;
    const p = this.player;
    return writeSave({ zone: this.zoneId, x: p.x, y: p.y, dir: p.dir, flags, pages, clock, month });
  }

  intro() {
    this.say([
      { who: '', text: 'Halte-Lanterne. Dernier village avant que les cartes ne s\'arrêtent.' },
      { who: '', text: 'Tu es ' + this.s.fate.title + '. Dans ta poche : ' + this.s.fate.gift + '.' },
      { who: '', text: 'Quelque part dans le Royaume, une histoire attend que tu la commences.' },
    ]);
  }

  enter(zoneId, x, y, dir) {
    this.zoneId = zoneId;
    this.queued = null;
    this.player = mover(x, y, dir);
    this.comp = mover(x, y, dir);
    this.npcs = this.zone.npcs.map((n) => ({
      ...n, ...mover(n.x, n.y, n.dir), home: [n.x, n.y], timer: 1 + Math.random() * 3,
    }));
    this.banner = 2.5;
  }

  // ---------- carte ----------
  tileAt(x, y) {
    const row = this.zone.map[y];
    if (!row || x < 0 || x >= row.length) return '#';
    const ch = row[x];
    return this.zone.openWhen?.[ch]?.(this.s) ? ':' : ch;
  }

  npcVisible(n) {
    if (n.when === 'night' && !this.s.night) return false;
    if (n.when === 'day' && this.s.night) return false;
    return !n.hideWhen?.(this.s);
  }

  occupied(x, y, self) {
    const p = this.player;
    if (self !== p && ((p.x === x && p.y === y) || (p.moving && p.tx === x && p.ty === y))) return true;
    return this.npcs.some((n) => n !== self && this.npcVisible(n)
      && ((n.x === x && n.y === y) || (n.moving && n.tx === x && n.ty === y)));
  }

  blocked(x, y, self) {
    return SOLID.has(this.tileAt(x, y)) || this.occupied(x, y, self);
  }

  // ---------- boucle ----------
  tick(dt) {
    this.time += dt;
  }

  update(dt) {
    this.time += dt;
    this.s.clock += dt;
    this.s.night = nightFactor(this.s.clock) > 0.5;
    this.banner = Math.max(0, this.banner - dt);

    for (const n of this.npcs) this.updateNpc(n, dt);
    this.updatePlayer(dt);
  }

  step(m, speed, dt) {
    m.t += dt * speed;
    if (m.t >= 1) {
      m.moving = false;
      m.t = 0;
      m.x = m.tx;
      m.y = m.ty;
      return true;
    }
    return false;
  }

  startMove(m, tx, ty) {
    m.fx = m.x; m.fy = m.y;
    m.tx = tx; m.ty = ty;
    m.t = 0;
    m.moving = true;
    m.step++;
  }

  updatePlayer(dt) {
    const p = this.player;
    const input = this.game.input;
    const speed = input.down('b') ? RUN_SPEED : WALK_SPEED;

    if (p.moving) {
      // Un appui pendant un pas est gardé pour l'arrivée.
      if (input.pressed('a')) this.queued = 'a';
      if (input.pressed('start')) this.queued = 'start';
      const done = this.step(p, speed, dt);
      const c = this.comp;
      if (c.moving) {
        c.t = p.t;
        if (done) { c.moving = false; c.x = c.tx; c.y = c.ty; }
      }
      if (!done || this.arrive()) return;
    }

    const queued = this.queued;
    this.queued = null;
    if (input.pressed('start') || queued === 'start') return this.openMenu();
    if (input.pressed('a') || queued === 'a') return this.interact();

    const d = input.dir();
    if (!d) return;
    p.dir = d;
    const [dx, dy] = DIR_VEC[d];
    if (this.blocked(p.x + dx, p.y + dy, p)) return;

    const c = this.comp;
    if (this.s.flags.mousse_joined && (c.x !== p.x || c.y !== p.y)) {
      c.dir = c.x < p.x ? 'right' : c.x > p.x ? 'left' : c.y < p.y ? 'down' : 'up';
      this.startMove(c, p.x, p.y);
    }
    this.startMove(p, p.x + dx, p.y + dy);
  }

  updateNpc(n, dt) {
    const forced = n.pos?.(this.s);
    if (forced && !n.moving) { n.x = forced[0]; n.y = forced[1]; }
    if (n.moving) { this.step(n, 2.5, dt); return; }
    if (!n.wander || !this.npcVisible(n)) return;
    n.timer -= dt;
    if (n.timer > 0) return;
    n.timer = 1.5 + Math.random() * 3;
    const dirs = Object.keys(DIR_VEC);
    const d = dirs[Math.floor(Math.random() * dirs.length)];
    n.dir = d;
    const [dx, dy] = DIR_VEC[d];
    const tx = n.x + dx;
    const ty = n.y + dy;
    const far = Math.abs(tx - n.home[0]) + Math.abs(ty - n.home[1]) > 2;
    if (!far && !this.blocked(tx, ty, n) && !this.zone.exits?.[this.tileAt(tx, ty)]) this.startMove(n, tx, ty);
  }

  // Appelé quand le joueur termine un pas. Renvoie true si l'action prend la main.
  arrive() {
    const p = this.player;
    const item = this.zone.items?.find((it) => it.x === p.x && it.y === p.y && !this.s.pages.includes(it.id));
    if (item) {
      this.s.pages.push(item.id);
      const page = PAGES[item.id];
      this.say([
        { who: '', text: 'Une page du Carnet du Voyageur ! (' + this.s.pages.length + '/' + PAGE_COUNT + ')' },
        { who: page.title, text: page.text },
      ], () => this.persist());
      return true;
    }

    const exit = this.zone.exits?.[this.tileAt(p.x, p.y)];
    if (!exit) return false;
    if (exit.to) {
      this.game.fadeTo(() => {
        this.enter(exit.to, exit.x, exit.y, exit.dir);
        this.persist();
      });
    } else {
      p.x = p.fx; p.y = p.fy;
      p.dir = OPPOSITE[p.dir];
      this.say(exit.text);
    }
    return true;
  }

  interact() {
    const p = this.player;
    const [dx, dy] = DIR_VEC[p.dir];
    let fx = p.x + dx;
    let fy = p.y + dy;
    // On peut parler par-dessus un comptoir.
    if (this.tileAt(fx, fy) === 'C') { fx += dx; fy += dy; }

    const npc = this.npcs.find((n) => this.npcVisible(n) && !n.moving && n.x === fx && n.y === fy);
    if (npc) {
      npc.dir = OPPOSITE[p.dir];
      npc.timer = 4;
      const res = npc.talk(this.s);
      const lines = Array.isArray(res) ? res : res.lines;
      this.say(lines, () => { res.after?.(this.s); this.persist(); }, npc.name);
      return;
    }

    const c = this.comp;
    if (this.s.flags.mousse_joined && c.x === fx && c.y === fy && (c.x !== p.x || c.y !== p.y)) {
      c.dir = OPPOSITE[p.dir];
      this.say([MOUSSE_LINES[Math.floor(Math.random() * MOUSSE_LINES.length)]], null, 'Mousse');
      return;
    }

    const sign = this.zone.signs?.[fx + ',' + fy];
    if (sign) return this.say(sign);
    if (this.tileAt(fx, fy) === '~' && this.zone.waterText) this.say(this.zone.waterText);
  }

  say(lines, onDone, speaker = '') {
    this.game.push(new Dialogue(this.game, lines, { speaker, onDone }));
  }

  openMenu() {
    const game = this.game;
    game.push(new ListMenu(game, {
      title: 'MENU',
      items: [
        { label: 'Reprendre' },
        { label: 'Carnet ' + this.s.pages.length + '/' + PAGE_COUNT, action: () => this.openJournal() },
        {
          label: 'Destin',
          action: () => {
            const f = this.s.fate;
            this.say([
              { who: f.month, text: f.title + '. Chance : ' + f.luck + '/5.' },
              { who: 'Don', text: f.gift + '. ' + f.text },
            ]);
          },
        },
        { label: 'Sauvegarder', action: () => this.say([{ who: '', text: this.persist() ? 'Partie sauvegardée.' : 'Impossible de sauvegarder ici.' }]) },
        { label: 'Écran titre', action: () => { this.persist(); game.fadeTo(() => game.setScene(new TitleScene(game))); } },
      ],
    }));
  }

  openJournal() {
    const found = this.s.pages.map((id) => ({ id, ...PAGES[id] }));
    if (!found.length) {
      this.say([{ who: '', text: 'Le carnet est vide. Les pages sont quelque part dans le Royaume.' }]);
      return;
    }
    this.game.push(new ListMenu(this.game, {
      title: 'CARNET',
      items: found.map((pg) => ({ label: pg.title, action: () => this.say([{ who: pg.title, text: pg.text }]) })),
    }));
  }

  // ---------- rendu ----------
  pos(m) {
    if (!m.moving) return [m.x * TILE, m.y * TILE];
    return [lerp(m.fx, m.tx, m.t) * TILE, lerp(m.fy, m.ty, m.t) * TILE];
  }

  camera() {
    const [px, py] = this.pos(this.player);
    const mw = this.zone.map[0].length * TILE;
    const mh = this.zone.map.length * TILE;
    const axis = (p, size, view) => (size <= view ? (size - view) / 2 : Math.max(0, Math.min(size - view, p + TILE / 2 - view / 2)));
    return [Math.round(axis(px, mw, W)), Math.round(axis(py, mh, H))];
  }

  draw(g) {
    const night = nightFactor(this.s.clock);
    g.setNight(this.zone.indoor ? night * 0.25 : night);
    const [cx, cy] = this.camera();
    g.rect(0, 0, W, H, 'ink');

    const at = (x, y) => this.tileAt(x, y);
    const x0 = Math.floor(cx / TILE);
    const y0 = Math.floor(cy / TILE);
    const lights = [];
    for (let ty = Math.max(0, y0); ty <= y0 + Math.ceil(H / TILE) && ty < this.zone.map.length; ty++) {
      for (let tx = Math.max(0, x0); tx <= x0 + Math.ceil(W / TILE); tx++) {
        const ch = at(tx, ty);
        if (tx >= this.zone.map[ty].length) continue;
        const sx = tx * TILE - cx;
        const sy = ty * TILE - cy;
        drawTile(g, ch, tx, ty, sx, sy, this.time, this.zone, at);
        if (LIGHTS[ch]) lights.push([sx + LIGHTS[ch].dx, sy + LIGHTS[ch].dy, LIGHTS[ch].r]);
      }
    }

    for (const it of this.zone.items || []) {
      if (!this.s.pages.includes(it.id)) drawPage(g, it.x * TILE - cx, it.y * TILE - cy, this.time);
    }

    // Entités triées par profondeur.
    const ents = [];
    for (const n of this.npcs) {
      if (!this.npcVisible(n)) continue;
      const [x, y] = this.pos(n);
      ents.push({
        y,
        draw: () => (n.kind === 'blob'
          ? drawBlob(g, x - cx, y - cy, n.dir, 0, this.time, !this.s.flags.mousse_joined)
          : drawHuman(g, x - cx, y - cy, n.look, n.dir, n.moving ? n.step * 2 + (n.t > 0.5 ? 1 : 0) : 0)),
      });
      if (n.id === 'nyx') lights.push([x - cx + 8, y - cy - 2, 22]);
    }
    if (this.s.flags.mousse_joined) {
      const c = this.comp;
      const [x, y] = this.pos(c);
      ents.push({ y: y - 0.1, draw: () => drawBlob(g, x - cx, y - cy, c.dir, c.moving ? c.step * 2 + (c.t > 0.5 ? 1 : 0) : 0, this.time) });
    }
    const p = this.player;
    const [px, py] = this.pos(p);
    ents.push({ y: py, draw: () => drawHuman(g, px - cx, py - cy, PLAYER_LOOK, p.dir, p.moving ? p.step * 2 + (p.t > 0.5 ? 1 : 0) : 0) });
    ents.sort((a, b) => a.y - b.y).forEach((e) => e.draw());

    if (night > 0.05 && !this.zone.indoor) {
      lights.push([px - cx + 8, py - cy + 8, 20]);
      const ctx = g.ctx;
      ctx.globalCompositeOperation = 'lighter';
      for (const [lx, ly, r] of lights) {
        for (const k of [1, 0.7, 0.45]) g.disc(lx, ly, Math.round(r * k), `!rgba(255,180,90,${(0.06 * night).toFixed(3)})`);
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    this.drawHud(g, night);
  }

  drawHud(g, night) {
    g.panel(W - 22, 4, 18, 18);
    drawSunMoon(g, W - 17, 9, night);
    if (this.banner > 0) {
      const lines = wrap(this.zone.name, 17);
      const h = lines.length * 11 + 9;
      g.panel(4, 4, W - 30, h);
      lines.forEach((l, i) => g.text(l, 4 + (W - 30) / 2, 9 + i * 11, 'uiText', { align: 'center' }));
    }
  }
}
