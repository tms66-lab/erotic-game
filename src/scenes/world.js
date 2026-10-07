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
import { Battle } from './battle.js';
import { Verdict } from './verdict.js';
import { makeFloor, THEMES } from '../world/dungeon.js';
import { rollMonster, makeMonster } from '../world/monsters.js';
import { ITEMS, initRpg, fullHeal, maxHp, maxMp, atk, def, xpNext } from '../world/rpg.js';
import { SKILLS } from '../world/skills.js';
import { sfx, playMusic, isMuted, setMuted } from '../audio/sound.js';

const WALK_SPEED = 4.5; // tuiles / seconde
const RUN_SPEED = 8;
const PAGE_COUNT = Object.keys(PAGES).length;

const DEATH_LINES = [
  'Le Royaume se souviendra de toi. Enfin, Mousse s\'en souviendra.',
  'Ton épitaphe : « Il pensait que c\'était un petit monstre. »',
  'Quelque part, une marchande de minuit note ton nom dans un carnet.',
  'Tu es mort. Mais tu as très bien couru.',
  'Les Profondeurs ajoutent ton casque à leur collection.',
];

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
    initRpg(this.s);
    this.time = 0;
    this.steps = 0;
    this.enter(save.zone, save.x, save.y, save.dir);
  }

  get zone() {
    return this.zoneObj;
  }

  loadZone(id) {
    if (id.startsWith('deep:')) return makeFloor(Number(id.slice(5)));
    return ZONES[id];
  }

  zoneMusic() {
    const z = this.zone;
    if (z.music) return z.music;
    if (z.indoor) return 'village';
    return this.s.night ? 'night' : 'village';
  }

  // ---------- état sauvegardé ----------
  persist() {
    const { fate, night, ...data } = this.s;
    const p = this.player;
    const deep = this.zone.deep;
    return writeSave({ ...data, zone: this.zoneId, x: deep ? null : p.x, y: deep ? null : p.y, dir: p.dir });
  }

  intro() {
    this.say([
      { who: '', text: 'Halte-Lanterne. Dernier village avant que les cartes ne s\'arrêtent.' },
      { who: '', text: 'Tu es ' + this.s.fate.title + '. Dans ta poche : ' + this.s.fate.gift + '.' },
      { who: '', text: 'On dit que sous le lac, une cloche sonne. On dit aussi qu\'il ne faut pas aller voir.' },
      { who: '', text: 'Tu vas aller voir.' },
    ]);
  }

  enter(zoneId, x, y, dir) {
    this.zoneId = zoneId;
    this.zoneObj = this.loadZone(zoneId);
    if (x == null) [x, y, dir] = this.zoneObj.spawn;
    if (this.zoneObj.deep) {
      this.s.deepest = Math.max(this.s.deepest, this.zoneObj.floor);
      if (this.zoneObj.floor === 10 && this.s.flags.bell) this.zoneObj.map[2][6] = 'g';
    }
    this.queued = null;
    this.steps = 0;
    playMusic(this.zoneMusic());
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
    const wasNight = this.s.night;
    this.s.night = nightFactor(this.s.clock) > 0.5;
    if (wasNight !== this.s.night && !this.zone.indoor && !this.zone.deep) playMusic(this.zoneMusic());
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
    if (!exit) return this.maybeEncounter();
    if (exit.to) {
      const go = () => {
        if (exit.look === 'stairs') sfx('stairs');
        this.game.fadeTo(() => {
          this.enter(exit.to, exit.x, exit.y, exit.dir);
          this.persist();
          this.onEnterZone();
        });
      };
      if (exit.text) this.say([{ who: '', text: exit.text }], go); else go();
    } else {
      p.x = p.fx; p.y = p.fy;
      p.dir = OPPOSITE[p.dir];
      this.say(exit.text);
    }
    return true;
  }

  maybeEncounter() {
    const z = this.zone;
    if (!z.encounter) return false;
    this.steps++;
    if (this.steps < 5 || Math.random() > z.encounter) return false;
    this.steps = 0;
    this.startBattle(rollMonster(z.floor));
    return true;
  }

  startBattle(enemy) {
    sfx('encounter');
    this.flash = 0.5;
    const floor = this.zone.floor || 1;
    this.game.fadeTo(() => {
      this.game.setScene(new Battle(this.game, this, enemy, { floor, onEnd: (r) => this.afterBattle(r, enemy) }));
    });
  }

  afterBattle(result, enemy) {
    playMusic(this.zoneMusic());
    if (result === 'lose') return this.onDeath();
    if (result === 'escape') {
      this.enter('halte', 12, 5, 'down');
      this.persist();
      return;
    }
    if (result === 'win' && enemy.boss) return this.bellDefeated();
    this.persist();
  }

  onEnterZone() {
    const z = this.zone;
    if (z.floor === 10) {
      if (this.s.flags.bell) this.say([{ who: '', text: 'La grande salle est silencieuse. Le Glas ne sonnera plus.' }]);
      else {
        sfx('bell');
        this.say([
          { who: '', text: 'Une cloche immense pend au-dessus du vide.' },
          { who: '', text: 'Elle a un œil. Il est ouvert. Il te regarde depuis mille ans.' },
        ]);
      }
    } else if (z.floor === 1 && !this.s.flags.deepTuto) {
      this.s.flags.deepTuto = true;
      this.say([
        { who: '', text: 'Les Profondeurs. Il fait noir, ça sent la racine et la mauvaise idée.' },
        { who: '', text: 'Trouve l\'escalier qui descend. Les coffres, c\'est bonus. L\'escalier qui monte te ramène à la surface.' },
      ]);
    }
  }

  onDeath() {
    const s = this.s;
    s.deaths++;
    const lost = Math.floor(s.gold / 2);
    s.gold -= lost;
    this.game.push(new Verdict(this.game, {
      kind: 'MEURT',
      title: s.fate.title + ', ' + (this.zone.floor ? 'étage ' + this.zone.floor : 'quelque part'),
      text: DEATH_LINES[s.deaths % DEATH_LINES.length],
      onDone: () => {
        fullHeal(s);
        this.enter('auberge', 5, 7, 'up');
        this.say([
          { who: '', text: 'Tu te réveilles à l\'auberge. Quelqu\'un t\'a remonté. Probablement Mousse.' },
          { who: 'Maëlle', text: 'J\'ai mis le lit sur ta note. Et les ' + lost + ' pièces d\'or qui manquent, c\'est le prix du brancard.' },
        ], () => this.persist());
      },
    }));
  }

  bellDefeated() {
    const s = this.s;
    s.flags.bell = true;
    this.zone.map[2][6] = 'g';
    this.persist();
    this.game.push(new Verdict(this.game, {
      kind: 'VIT',
      title: 'Le Glas s\'est tu',
      text: 'Pour la première fois en mille ans, le lac est silencieux. Ce soir, quelqu\'un dort bien à la Halte. Toi.',
      onDone: () => this.say([
        { who: '', text: 'Sous la cloche brisée, tu trouves une plaque gravée : « Pour celui qui viendra. Merci. — Le premier sonneur. »' },
        { who: '', text: 'Le Royaume se souviendra de toi, ' + s.fate.title + '. Pour de vrai, cette fois.' },
        { who: '', text: 'FIN... de ce chapitre. La route du Nord t\'attend toujours.' },
      ], () => this.persist()),
    }));
  }

  openChest(x, y) {
    const s = this.s;
    this.zone.map[y][x] = 'k';
    const gold = Math.round((5 + Math.floor(Math.random() * 10 * this.zone.floor)) * (s.flags.cursed ? 1.5 : 1));
    s.gold += gold;
    const lines = [{ who: '', text: 'Le coffre contient ' + gold + ' pièces d\'or. Et une odeur de vieux.' }];
    const r = Math.random();
    if (r < 0.35) { s.items.potion = (s.items.potion || 0) + 1; lines.push({ who: '', text: 'Et une Potion !' }); } else if (r < 0.5) { s.items.meche = (s.items.meche || 0) + 1; lines.push({ who: '', text: 'Et une Mèche !' }); } else if (r < 0.58) { s.items.plume = (s.items.plume || 0) + 1; lines.push({ who: '', text: 'Et une Plume retour !' }); } else if (r < 0.62) { lines.push({ who: '', text: 'Il y a aussi un mot : « Ce coffre n\'est pas un mimique. Promis. »' }); }
    sfx('coin');
    this.say(lines);
  }

  drinkFountain(x, y) {
    this.game.push(new ListMenu(this.game, {
      title: 'Boire ?', x: 30, y: 120, w: W - 60,
      items: [
        {
          label: 'Oui',
          action: () => {
            const s = this.s;
            this.zone.map[y][x] = 'f';
            if (Math.random() < 0.55) {
              s.bonusHp = (s.bonusHp || 0) + 6;
              fullHeal(s);
              sfx('heal');
              this.game.push(new Verdict(this.game, { kind: 'VIT', title: 'Fontaine bénie', text: 'L\'eau a un goût d\'étoile. +6 PV max, et tu es soigné.' }));
            } else if (s.flags.cursed) {
              this.say([{ who: '', text: 'La fontaine voit que tu es déjà maudit. Elle est gênée et s\'assèche.' }]);
            } else {
              s.flags.cursed = true;
              sfx('curse');
              this.game.push(new Verdict(this.game, { kind: 'MAUDIT', title: 'Malédiction de l\'Écho', text: 'Désormais, chaque monstre t\'appelle par ton prénom. -1 DEF. Mais l\'or brille plus pour toi : +50 % d\'or dans les coffres.' }));
            }
          },
        },
        { label: 'Non' },
      ],
    }));
  }

  descendMenu() {
    const s = this.s;
    const items = [{ label: 'Étage 1', action: () => this.goDeep(1) }];
    for (const f of [4, 7]) if (s.deepest >= f) items.push({ label: 'Étage ' + f, action: () => this.goDeep(f) });
    if (s.deepest >= 10) items.push({ label: 'Le Noyau', action: () => this.goDeep(10) });
    items.push({ label: 'Pas maintenant' });
    this.say([{ who: '', text: s.deepest ? 'Le vieux puits. Une corde, des échelons, et l\'écho de la Cloche.' : 'Un vieux puits. Tout au fond, quelque chose sonne. Une échelle descend dans le noir.' }], () => {
      this.game.push(new ListMenu(this.game, { title: 'Descendre ?', x: 26, y: 70, w: W - 52, items }));
    });
  }

  goDeep(n) {
    sfx('stairs');
    this.game.fadeTo(() => {
      this.enter('deep:' + n);
      this.persist();
      this.onEnterZone();
    });
  }

  openShop() {
    const s = this.s;
    const make = () => Object.entries(ITEMS).map(([k, it]) => ({
      label: it.name + ' ' + it.price + 'or',
      close: false,
      action: () => {
        if (s.gold < it.price) { sfx('cancel'); return; }
        s.gold -= it.price;
        s.items[k] = (s.items[k] || 0) + 1;
        sfx('coin');
        menu.title = 'Or : ' + s.gold;
      },
    }));
    const menu = new ListMenu(this.game, { title: 'Or : ' + s.gold, x: 8, y: 50, w: W - 16, items: [...make(), { label: 'Partir' }] });
    this.game.push(menu);
  }

  offerInn() {
    const s = this.s;
    this.game.push(new ListMenu(this.game, {
      title: 'Chambre 10or ?', x: 26, y: 90, w: W - 52,
      items: [
        {
          label: 'Dormir',
          action: () => {
            if (s.gold < 10) { this.say(['Pas assez d\'or ? Tu peux dormir dans l\'écurie. Non, je plaisante. Va-t\'en.'], null, 'Maëlle'); return; }
            s.gold -= 10;
            this.game.fadeTo(() => {
              fullHeal(s);
              s.clock = Math.ceil(s.clock / DAY_LENGTH) * DAY_LENGTH + DAY_LENGTH * 0.05;
              sfx('heal');
              this.say([{ who: '', text: 'Tu dors comme une bûche. PV et Éclats restaurés. C\'est le matin.' }], () => this.persist());
            });
          },
        },
        { label: 'Non merci' },
      ],
    }));
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
      this.say(lines, () => { res.after?.(this.s, this); this.persist(); }, npc.name);
      return;
    }

    const c = this.comp;
    if (this.s.flags.mousse_joined && c.x === fx && c.y === fy && (c.x !== p.x || c.y !== p.y)) {
      c.dir = OPPOSITE[p.dir];
      this.say([MOUSSE_LINES[Math.floor(Math.random() * MOUSSE_LINES.length)]], null, 'Mousse');
      return;
    }

    const t = this.tileAt(fx, fy);
    if (t === 'K') return this.openChest(fx, fy);
    if (t === 'F') return this.drinkFountain(fx, fy);
    if (t === 'P') return this.descendMenu();
    if (t === 'G') {
      return this.say([
        { who: 'Le Glas', text: 'DOOONG.' },
        { who: '', text: 'Le son te traverse les os. L\'œil se plisse. Il a l\'air de sourire.' },
      ], () => this.startBattle(makeMonster('glas', 10)));
    }
    if (t === 'g') return this.say([{ who: '', text: 'Le Glas est fendu en deux. Il ne sonnera plus. Tu tapes dessus quand même. « tok ».' }]);
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
        { label: 'Sac', action: () => this.openBag() },
        { label: 'Statut', action: () => this.showStatus() },
        { label: 'Carnet ' + this.s.pages.length + '/' + PAGE_COUNT, action: () => this.openJournal() },
        {
          label: 'Destin',
          action: () => {
            const f = this.s.fate;
            const sk = SKILLS[this.s.month];
            this.say([
              { who: f.month, text: f.title + '. Chance : ' + f.luck + '/5.' },
              { who: 'Don', text: f.gift + '. ' + f.text },
              { who: sk.name, text: 'En combat (' + sk.cost + ' Éclats) : ' + sk.desc },
            ]);
          },
        },
        { label: 'Son : ' + (isMuted() ? 'non' : 'oui'), action: () => setMuted(!isMuted()) },
        { label: 'Sauvegarder', action: () => this.say([{ who: '', text: this.persist() ? 'Partie sauvegardée.' : 'Impossible de sauvegarder ici.' }]) },
        { label: 'Écran titre', action: () => { this.persist(); game.fadeTo(() => game.setScene(new TitleScene(game))); } },
      ],
    }));
  }

  openBag() {
    const s = this.s;
    const owned = Object.keys(ITEMS).filter((k) => s.items[k] > 0);
    if (!owned.length) { this.say([{ who: '', text: 'Ton sac est vide. Il y a une miette. Tu la gardes, par principe.' }]); return; }
    this.game.push(new ListMenu(this.game, {
      title: 'SAC',
      items: owned.map((k) => ({
        label: ITEMS[k].name + ' x' + s.items[k],
        action: () => {
          if (k === 'plume' && !this.zone.deep) { this.say([{ who: '', text: 'Tu es déjà à la surface. La plume te regarde bizarrement.' }]); return; }
          s.items[k]--;
          if (k === 'potion') { s.hp = Math.min(maxHp(s), s.hp + 30); sfx('heal'); this.say([{ who: '', text: 'Tu bois une Potion. PV : ' + s.hp + '/' + maxHp(s) + '.' }]); } else if (k === 'meche') { s.mp = Math.min(maxMp(s), s.mp + 3); sfx('heal'); this.say([{ who: '', text: 'Éclats : ' + s.mp + '/' + maxMp(s) + '.' }]); } else {
            this.game.fadeTo(() => { this.enter('halte', 12, 5, 'down'); this.persist(); });
          }
        },
      })),
    }));
  }

  showStatus() {
    const s = this.s;
    this.say([
      { who: 'Statut', text: 'Niveau ' + s.lvl + ' (' + s.xp + '/' + xpNext(s.lvl) + ' XP). PV ' + s.hp + '/' + maxHp(s) + '. Éclats ' + s.mp + '/' + maxMp(s) + '.' },
      { who: 'Statut', text: 'ATQ ' + atk(s) + '. DEF ' + def(s) + '. Or ' + s.gold + '. Étage max ' + s.deepest + '.' },
      { who: 'Statut', text: 'Monstres vaincus : ' + s.kills + '. Morts : ' + s.deaths + '.' + (s.flags.cursed ? ' Maudit : oui, et ça se voit.' : '') },
    ]);
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

    if (this.zone.dark) this.drawDark(g, lights, px - cx + 8, py - cy + 8);
    else if (night > 0.05 && !this.zone.indoor) {
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

  drawDark(g, lights, plx, ply) {
    const T = this.zone.theme;
    if (!this.fog) { this.fog = document.createElement('canvas'); this.fog.width = W; this.fog.height = H; }
    const f = this.fog.getContext('2d');
    f.globalCompositeOperation = 'source-over';
    f.clearRect(0, 0, W, H);
    f.fillStyle = `rgba(${T.fog.join(',')},0.84)`;
    f.fillRect(0, 0, W, H);
    f.globalCompositeOperation = 'destination-out';
    const m = this.s.month;
    const pr = 54 + (m === 0 || m === 9 ? 18 : 0) + Math.sin(this.time * 6) * 1.5;
    const all = [...lights, [plx, ply, pr]];
    for (const [lx, ly, r] of all) {
      for (const k of [1, 0.8, 0.62, 0.45]) {
        f.fillStyle = 'rgba(0,0,0,0.32)';
        const rr = Math.round(r * k);
        for (let dy = -rr; dy <= rr; dy += 1) {
          const w = Math.floor(Math.sqrt(rr * rr - dy * dy));
          f.fillRect(Math.round(lx - w), Math.round(ly + dy), w * 2 + 1, 1);
        }
      }
    }
    g.ctx.drawImage(this.fog, 0, 0);
    g.ctx.globalCompositeOperation = 'lighter';
    for (const [lx, ly, r] of lights) g.disc(lx, ly, Math.round(r * 0.4), '!' + T.glow + '22');
    g.ctx.globalCompositeOperation = 'source-over';
  }

  drawHud(g, night) {
    const s = this.s;
    if (this.flash > 0) {
      this.flash -= 1 / 60;
      g.ctx.fillStyle = `rgba(255,255,255,${Math.max(0, this.flash)})`;
      g.ctx.fillRect(0, 0, W, H);
    }
    g.panel(W - 22, 4, 18, 18);
    if (this.zone.deep) g.text(String(this.zone.floor), W - 13, 9, 'uiBorder', { align: 'center' });
    else drawSunMoon(g, W - 17, 9, night);
    if (this.banner <= 0) {
      g.panel(4, 4, 76, 18);
      g.rect(9, 10, 3, 3, '!#d9534f'); g.rect(13, 10, 3, 3, '!#d9534f'); g.rect(10, 13, 5, 2, '!#d9534f'); g.px(12, 15, '!#d9534f');
      g.rect(19, 11, 34, 4, '!#1b1424');
      g.rect(19, 11, Math.round(34 * s.hp / maxHp(s)), 4, s.hp < maxHp(s) / 4 ? '!#ff6b6b' : '!#78c47d');
      g.text(String(s.lvl), 64, 9, 'uiBorder');
      g.panel(82, 4, 70, 18);
      g.disc(91, 13, 3, '!#f2c35b');
      g.text(String(s.gold), 98, 9, 'uiText');
    }
    if (this.banner > 0) {
      const lines = wrap(this.zone.name, 17);
      const h = lines.length * 11 + 9;
      g.panel(4, 4, W - 30, h);
      lines.forEach((l, i) => g.text(l, 4 + (W - 30) / 2, 9 + i * 11, 'uiText', { align: 'center' }));
    }
  }
}
