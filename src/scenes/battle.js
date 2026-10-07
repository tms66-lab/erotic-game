import { W, H } from '../config.js';
import { wrap } from '../gfx/gfx.js';
import { drawMonster } from '../gfx/monster.js';
import { drawBlob } from '../gfx/sprites.js';
import { hash } from '../gfx/tiles.js';
import { SKILLS } from '../world/skills.js';
import { ITEMS, maxHp, maxMp, atk, def, gainXp } from '../world/rpg.js';
import { THEMES } from '../world/dungeon.js';
import { strataOf } from '../world/monsters.js';
import { OMENS } from '../world/omens.js';
import { sfx, playMusic } from '../audio/sound.js';
import { ListMenu } from './ui.js';

const MENU = ['ATTAQUE', 'DON', 'OBJET', 'FUIR'];
const rand = (a, b) => a + Math.random() * (b - a);

// Combat au tour par tour. Tout passe par une file d'étapes (`q`) :
// textes, effets, pauses, et deux mini-jeux de timing (frapper / parer).
export class Battle {
  constructor(game, world, enemy, { floor = 1, onEnd } = {}) {
    this.game = game;
    this.world = world;
    this.s = world.s;
    this.e = enemy;
    this.boss = !!enemy.boss;
    this.onEnd = onEnd;
    this.theme = THEMES[Math.max(0, strataOf(floor))];
    this.dons = this.s.run?.dons || [];
    this.mods = this.s.fate.mods || {};
    this.omen = OMENS[this.s.run?.omen] || {};
    this.q = [];
    this.mode = 'queue';
    this.log = '';
    this.cursor = 0;
    this.time = 0;
    this.shake = 0;
    this.eFlash = 0;
    this.pFlash = 0;
    this.lunge = 0;
    this.eDead = 0;
    this.floaters = [];
    this.parts = [];
    this.atkMul = 1;
    this.dodge = false;
    this.critTurns = 0;
    this.enraged = false;
    this.done = false;
    this.mousse = !!this.s.flags.mousse_joined;
    playMusic(this.boss ? 'boss' : 'battle');
    if (this.boss) { sfx('bell'); this.say(enemy.desc, 2.4); } else this.say(enemy.name + ' surgit ! ' + enemy.desc, 2);
    if (!this.s.flags.tutoBattle) {
      this.s.flags.tutoBattle = true;
      this.say('Astuce : en attaque, appuie sur A quand le curseur est au centre.', 2.4);
      this.say('Quand l\'ennemi frappe, appuie sur A dès que le « ! » apparaît pour parer.', 2.4);
    }
  }

  // ---------- file d'étapes ----------
  say(text, t = 1.5) { this.q.push({ say: text, t }); }
  then(fn) { this.q.push({ fn }); }
  wait(t) { this.q.push({ wait: t }); }
  maxHp() { return maxHp(this.s); }

  runQueue(dt) {
    const input = this.game.input;
    for (;;) {
      const st = this.q[0];
      if (!st) { if (!this.done) this.mode = 'menu'; return; }
      if (st.fn) {
        this.q.shift();
        // les étapes ajoutées par une fonction passent avant le reste de la file
        const rest = this.q;
        this.q = [];
        st.fn();
        this.q = this.q.concat(rest);
        if (this.mode !== 'queue') return;
        continue;
      }
      if (st.wait != null) {
        st.wait -= dt;
        if (st.wait > 0) return;
        this.q.shift();
        continue;
      }
      if (st.say != null) {
        if (!st.started) { st.started = true; this.log = st.say; st.min = 0.25; }
        st.t -= dt;
        st.min -= dt;
        if (st.t <= 0 || (st.min <= 0 && !this.aUsed && input.pressed('a'))) {
          if (input.pressed('a')) this.aUsed = true;
          this.q.shift();
          continue;
        }
        return;
      }
      if (st.mode) { this.q.shift(); this.enterMode(st.mode, st.data); return; }
    }
  }

  enterMode(mode, data) {
    this.mode = mode;
    this.modeT = 0;
    this.modeData = data;
    if (mode === 'parry') this.parryAt = rand(0.45, 1.2);
  }

  // ---------- effets ----------
  floater(text, x, y, c, big = false) { this.floaters.push({ text, x, y, c, big, t: 0 }); }

  burst(x, y, c, n = 12) {
    for (let i = 0; i < n; i++) this.parts.push({ x, y, vx: rand(-60, 60), vy: rand(-90, -10), c, t: rand(0.4, 0.8) });
  }

  hitEnemy(mult, o = {}) {
    this.then(() => {
      const crit = !!o.crit || (this.critTurns > 0 && !o.fixed);
      let m = mult * this.atkMul * (crit ? 1.6 : 1);
      if (this.e.id === 'glas' && this.mods.bell) m *= this.mods.bell;
      if (this.mods.lowHp && this.s.hp < this.maxHp() * 0.3) m *= this.mods.lowHp;
      const dmg = o.fixed ?? Math.max(1, Math.round(atk(this.s) * m * rand(0.9, 1.1)));
      this.e.hp = Math.max(0, this.e.hp - dmg);
      this.eFlash = 0.22;
      this.shake = crit || o.big ? 7 : 3;
      this.floater(String(dmg), 90 + rand(-10, 10), 50, crit ? '#f2c35b' : o.color || '#ffffff', crit || o.big);
      this.burst(90, 75, o.color || '#ffffff', crit || o.big ? 22 : 10);
      sfx(crit || o.big ? 'crit' : 'hit');
      if (crit) this.say('CRITIQUE !', 0.7);
      if (this.mods.burn && !o.fixed && this.e.hp > 0 && Math.random() < this.mods.burn) {
        this.e.burn = Math.max(this.e.burn, 2);
        this.floater('FEU', 120, 70, '#ec9d49');
      }
    });
    this.wait(0.3);
  }

  healPlayer(n) {
    this.then(() => {
      const before = this.s.hp;
      this.s.hp = Math.min(this.maxHp(), this.s.hp + n);
      this.floater('+' + (this.s.hp - before), 40, 128, '#78c47d', true);
      sfx('heal');
    });
  }

  flee() {
    this.done = true;
    sfx('cancel');
    this.say('Tu prends la fuite. Avec panache.', 1.2);
    this.then(() => this.finish('flee'));
  }

  // ---------- tour du joueur ----------
  choose(i) {
    sfx('confirm');
    const s = this.s;
    this.mode = 'queue';
    if (i === 0) {
      this.q.push({ mode: 'aim' });
    } else if (i === 1) {
      if (!this.dons.length) { this.say('Tu n\'as aucun don. Ils se trouvent dans les Profondeurs.', 1.3); return; }
      if (this.dons.length === 1) { this.useSkill(this.dons[0]); return; }
      this.game.push(new ListMenu(this.game, {
        title: 'DONS', x: 8, y: 110, w: W - 16,
        items: this.dons.map((id) => ({ label: SKILLS[id].name.slice(0, 15) + ' ' + SKILLS[id].cost, action: () => this.useSkill(id) })),
      }));
    } else if (i === 2) {
      this.openBag();
    } else {
      if (this.boss) { this.say('Le Glas ne laisse partir personne.', 1.3); this.endPlayerTurn(true); return; }
      if (Math.random() < (this.mods.flee || 0.65)) this.flee();
      else { this.say('Tu glisses. Fuite ratée. Le monstre a tout vu.', 1.3); this.endPlayerTurn(true); }
    }
  }

  useSkill(id) {
    const sk = SKILLS[id];
    if (this.s.mp < sk.cost) { this.say('Pas assez d\'Éclats. Il en faut ' + sk.cost + '.', 1.2); return; }
    this.s.mp -= sk.cost;
    this.say(sk.name + ' !', 0.8);
    sk.use(this);
    this.endPlayerTurn();
  }

  openBag() {
    const s = this.s;
    const owned = Object.keys(ITEMS).filter((k) => s.items[k] > 0);
    if (!owned.length) { this.say('Ton sac est vide. Il y a juste une miette.', 1.3); return; }
    this.game.push(new ListMenu(this.game, {
      title: 'SAC', x: 14, y: 120, w: W - 28,
      items: owned.map((k) => ({ label: ITEMS[k].name + ' x' + s.items[k], action: () => this.useItem(k) })),
    }));
  }

  useItem(k) {
    const s = this.s;
    if (k === 'plume' && this.boss) { this.say('La plume refuse de bouger. Même elle a peur.', 1.3); return; }
    s.items[k]--;
    if (k === 'potion') { this.say('Tu bois une Potion. Goût : fond de chaudron.', 1.1); this.healPlayer(30); } else if (k === 'meche') {
      this.then(() => { s.mp = Math.min(maxMp(s), s.mp + 3); this.floater('+3', 40, 128, '#c9a6ff', true); sfx('heal'); });
      this.say('La Mèche crépite. Tes Éclats reviennent.', 1.1);
    } else if (k === 'plume') {
      this.done = true;
      this.say('La Plume t\'emporte vers la surface. Sans prévenir.', 1.4);
      this.then(() => this.finish('escape'));
      return;
    }
    this.endPlayerTurn();
  }

  resolveAim(p) {
    const d = Math.abs(p - 0.5);
    this.mode = 'queue';
    if (d < 0.06 * (this.mods.perfect || 1)) { this.say('PARFAIT !', 0.6); this.hitEnemy(1.8, { crit: true }); } else if (d < 0.2) this.hitEnemy(1); else { this.say('Pas terrible.', 0.6); this.hitEnemy(0.55); }
    this.endPlayerTurn();
  }

  endPlayerTurn(skipMousse = false) {
    this.then(() => {
      if (this.done) return;
      if (this.e.hp <= 0) { this.win(); return; }
      if (this.critTurns > 0) this.critTurns--;
      if (this.mousse && !skipMousse) this.mousseTurn();
      this.then(() => {
        if (this.done) return;
        if (this.e.hp <= 0) { this.win(); return; }
        this.enemyTurn();
      });
    });
  }

  mousseTurn() {
    if (this.e.id === 'caillou') { this.say('Mousse refuse de frapper le caillou. C\'est son ami.', 1.3); return; }
    const r = Math.random();
    if (r < 0.45) { this.say('Mousse lance un caillou. Pas celui-là, un autre.', 1); this.hitEnemy(0, { fixed: Math.round((2 + Math.floor(this.s.lvl * 0.8 + Math.random() * 3)) * (this.omen.mousse || 1)), color: '#78c47d' }); } else if (r < 0.7) { this.say('Mousse te tend une fleur. Ça soigne, apparemment.', 1.1); this.healPlayer(Math.round((4 + this.s.lvl * 2) * (this.omen.mousse || 1))); } else this.say('Mousse fait une sieste. Il est très doué pour ça.', 1);
  }

  // ---------- tour de l'ennemi ----------
  enemyTurn() {
    const e = this.e;
    if (e.burn > 0) {
      e.burn--;
      this.say(e.name + ' brûle.', 0.7);
      this.hitEnemy(0, { fixed: Math.max(1, Math.ceil(e.maxHp * 0.07)), color: '#ec9d49' });
      this.then(() => { if (e.hp <= 0) { this.win(); } });
    }
    this.then(() => {
      if (this.done) return;
      if (e.frozen > 0) { e.frozen--; this.say(e.name + ' est gelé. Il réfléchit à sa vie.', 1.1); return; }
      if (e.kneel > 0) { e.kneel--; this.say(e.name + ' reste à genoux. C\'est gênant pour tout le monde.', 1.2); return; }
      if (this.boss && !this.enraged && e.hp < e.maxHp / 2) {
        this.enraged = true;
        this.then(() => { sfx('bell'); this.shake = 10; });
        this.say('Le Glas se fissure. Il sonne plus fort.', 1.6);
      }
      let move = e.moves[Math.floor(Math.random() * e.moves.length)];
      if (this.enraged && e.rage && Math.random() < 0.3) move = e.rage;
      if (!move.power) { this.say(move.text, 1.3); return; }
      this.say(move.text, 1.1);
      this.q.push({ mode: 'parry', data: move });
    });
  }

  resolveParry(res) {
    const move = this.modeData;
    const s = this.s;
    this.mode = 'queue';
    this.lunge = 0.3;
    let dmg = Math.max(1, Math.round(this.e.atk * move.power * rand(0.85, 1.15)) - def(s));
    if (this.dodge || (this.mods.dodge && Math.random() < this.mods.dodge)) {
      this.dodge = false;
      dmg = 0;
      this.floater('ESQUIVE', 90, 120, '#cdc5c7', true);
      this.say('Tu n\'es plus là. Le coup traverse la brume.', 1);
    } else if (res === 'parry') {
      dmg = Math.ceil(dmg * 0.25);
      sfx('parry');
      this.floater('PARADE', 90, 120, '#f2c35b', true);
      this.burst(90, 130, '#f2c35b', 14);
    } else if (res === 'early') this.say('Trop tôt !', 0.6);
    if (dmg > 0) {
      s.hp = Math.max(0, s.hp - dmg);
      this.pFlash = 0.3;
      this.shake = res === 'parry' ? 2 : 6;
      this.floater('-' + dmg, 46, 128, '#ff6b6b', true);
      sfx('hurt');
    }
    this.wait(0.35);
    this.then(() => { if (s.hp <= 0) this.lose(); });
  }

  // ---------- fins ----------
  win() {
    if (this.done) return;
    this.done = true;
    const e = this.e;
    const s = this.s;
    this.eDead = 0.001;
    sfx('win');
    const gold = Math.round(rand(e.gold[0], e.gold[1] + 0.99) * (this.mods.gold || 1) * (this.omen.gold || 1));
    const xp = Math.round(e.xp * (this.omen.xp || 1));
    s.gold += gold;
    s.kills++;
    this.say(e.name + ' est vaincu !', 1.2);
    this.say('+' + xp + ' XP     +' + gold + ' or', 1.4);
    if (!e.boss && Math.random() < (this.omen.drop || 0.18)) {
      const k = Math.random() < 0.7 ? 'potion' : 'meche';
      s.items[k] = (s.items[k] || 0) + 1;
      this.say('Il laisse tomber : ' + ITEMS[k].name + '. Encore tiède.', 1.3);
    }
    for (const line of gainXp(s, xp)) {
      this.then(() => { sfx('levelup'); this.burst(40, 135, '#f2c35b', 30); });
      this.say(line, 2.2);
    }
    this.then(() => this.finish('win'));
  }

  lose() {
    if (this.done) return;
    this.done = true;
    sfx('death');
    this.say('Tu t\'effondres...', 1.6);
    this.then(() => this.finish('lose'));
  }

  finish(result) {
    this.mode = 'end';
    this.game.fadeTo(() => {
      this.game.setScene(this.world);
      this.onEnd?.(result);
    });
  }

  // ---------- boucle ----------
  tick(dt) { this.animate(dt); }

  animate(dt) {
    this.time += dt;
    this.shake = Math.max(0, this.shake - dt * 30);
    this.eFlash = Math.max(0, this.eFlash - dt);
    this.pFlash = Math.max(0, this.pFlash - dt);
    this.lunge = Math.max(0, this.lunge - dt);
    if (this.eDead) this.eDead = Math.min(1, this.eDead + dt * 1.5);
    for (const f of this.floaters) f.t += dt;
    this.floaters = this.floaters.filter((f) => f.t < 1);
    for (const p of this.parts) { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt; }
    this.parts = this.parts.filter((p) => p.t > 0);
  }

  update(dt) {
    this.animate(dt);
    this.aUsed = false;
    const input = this.game.input;
    if (this.mode === 'menu') {
      const c = this.cursor;
      if (input.pressed('left') || input.pressed('right')) { this.cursor = c ^ 1; sfx('select'); }
      if (input.pressed('up') || input.pressed('down')) { this.cursor = c ^ 2; sfx('select'); }
      if (input.pressed('a')) this.choose(this.cursor);
    } else if (this.mode === 'aim') {
      this.modeT += dt;
      const p = this.aimPos();
      if (input.pressed('a')) this.resolveAim(p);
      else if (this.modeT > 3.2) this.resolveAim(0);
    } else if (this.mode === 'parry') {
      this.modeT += dt;
      const t = this.modeT - this.parryAt;
      if (input.pressed('a')) this.resolveParry(t < 0 ? 'early' : t < 0.3 ? 'parry' : 'late');
      else if (t >= 0.3) this.resolveParry('late');
    } else if (this.mode === 'queue') {
      this.runQueue(dt);
    }
  }

  aimPos() {
    const v = (this.modeT * 1.25) % 2;
    return v < 1 ? v : 2 - v;
  }

  // ---------- rendu ----------
  hint() {
    if (this.mode !== 'menu') return this.log;
    return [
      'Attaque. Vise le centre pour un coup parfait.',
      this.dons.length ? 'Dons : ' + this.dons.map((id) => SKILLS[id].name).join(', ') + '.' : 'Aucun don pour l\'instant.',
      'Ton sac. Il sent un peu le fromage.',
      this.boss ? 'Fuir ? Il n\'y a nulle part où aller.' : 'Une retraite stratégique. Ou pas.',
    ][this.cursor];
  }

  draw(g) {
    g.setNight(0);
    const ctx = g.ctx;
    const T = this.theme;
    ctx.save();
    if (this.shake > 0) ctx.translate(Math.round(rand(-this.shake, this.shake) / 2), Math.round(rand(-this.shake, this.shake) / 2));

    // fond
    const bands = this.boss ? ['#120808', '#1c0c0c', '#2a1010', '#3a1414'] : [T.wallTop, T.wallDark, T.wall, T.floorDark];
    bands.forEach((c, i) => g.rect(-4, i * 30, W + 8, 30, '!' + c));
    for (let i = 0; i < 24; i++) {
      const x = (hash(i, 3) * W + this.time * (6 + hash(i, 4) * 10)) % W;
      const y = (hash(i, 5) * 110 - this.time * (4 + hash(i, 6) * 8) + 220) % 110;
      g.px(x, y, '!' + (this.boss && i % 3 === 0 ? '#ec9d49' : T.glow));
    }
    if (this.boss) {
      const p = 0.5 + 0.5 * Math.sin(this.time * 2);
      ctx.fillStyle = `rgba(242,195,91,${0.05 + p * 0.08})`;
      ctx.beginPath(); ctx.arc(90, 60, 60, 0, Math.PI * 2); ctx.fill();
    }
    g.rect(-4, 112, W + 8, 14, '!' + T.floor);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(90, 113, 46, 6, 0, 0, Math.PI * 2); ctx.fill();

    // ennemi
    if (this.eDead < 1) {
      const lungeY = this.lunge > 0 ? Math.sin((this.lunge / 0.3) * Math.PI) * 8 : 0;
      ctx.globalAlpha = 1 - this.eDead;
      drawMonster(g, 90, 112 + lungeY + this.eDead * 20, this.e, this.time, this.eFlash > 0 && Math.floor(this.eFlash * 30) % 2 === 0);
      ctx.globalAlpha = 1;
      if (this.e.frozen) { ctx.fillStyle = 'rgba(159,216,255,0.35)'; ctx.fillRect(58, 50, 64, 62); }
      if (this.e.burn) for (let i = 0; i < 4; i++) g.disc(72 + i * 12, 106 - ((this.time * 30 + i * 9) % 26), 2, '!#ec9d49');
      if (this.e.kneel) g.text('zzz', 112, 52, '!#f5e9d0');
    }
    if (this.mousse) drawBlob(g, 12, 98, 'right', 0, this.time);

    for (const p of this.parts) g.rect(p.x, p.y, 2, 2, '!' + p.c);
    ctx.restore();

    // barre de l'ennemi
    g.panel(4, 4, W - 8, 24);
    g.text(this.e.name, 10, 9, 'uiText');
    const hpw = W - 22;
    g.rect(10, 19, hpw, 4, '!#1b1424');
    g.rect(10, 19, Math.round(hpw * this.e.hp / this.e.maxHp), 4, this.boss ? '!#f2c35b' : '!#d9534f');

    // joueur
    const s = this.s;
    g.panel(4, 124, W - 8, 26);
    if (this.pFlash > 0) { ctx.fillStyle = 'rgba(255,80,80,0.35)'; ctx.fillRect(4, 124, W - 8, 26); }
    g.text('Nv' + s.lvl, 10, 129, 'uiBorder');
    g.text(s.hp + '/' + maxHp(s), 48, 129, s.hp < maxHp(s) / 4 ? '!#ff6b6b' : 'uiText');
    g.rect(48, 140, 80, 4, '!#1b1424');
    g.rect(48, 140, Math.round(80 * s.hp / maxHp(s)), 4, '!#78c47d');
    for (let i = 0; i < maxMp(s); i++) g.rect(136 + (i % 5) * 7, 131 + Math.floor(i / 5) * 7, 5, 5, i < s.mp ? '!#c9a6ff' : '!#33264a');

    // texte
    g.panel(4, 152, W - 8, 42);
    wrap(this.hint(), 20).slice(0, 3).forEach((l, i) => g.text(l, 10, 158 + i * 11, this.mode === 'menu' ? 'uiDim' : 'uiText'));

    // commandes
    g.panel(4, 196, W - 8, 40);
    if (this.mode === 'menu') {
      MENU.forEach((m, i) => {
        const x = 18 + (i % 2) * 84;
        const y = 204 + Math.floor(i / 2) * 16;
        if (i === this.cursor) {
          g.rect(x - 10, y, 2, 7, 'uiBorder'); g.rect(x - 8, y + 1, 1, 5, 'uiBorder'); g.rect(x - 7, y + 2, 1, 3, 'uiBorder');
        }
        g.text(i === 1 ? 'DON' : m, x, y, i === this.cursor ? 'uiText' : 'uiDim');
      });
    } else if (this.mode === 'aim') {
      const bx = 14;
      const bw = W - 28;
      g.rect(bx, 206, bw, 10, '!#33264a');
      g.rect(bx + bw * 0.3, 206, bw * 0.4, 10, '!#4c6487');
      g.rect(bx + bw * 0.44, 206, bw * 0.12, 10, '!#f2c35b');
      const cx = bx + this.aimPos() * bw;
      g.rect(cx - 1, 202, 3, 18, '!#ffffff');
      g.text('A : FRAPPE !', W / 2, 223, 'uiText', { align: 'center' });
    } else if (this.mode === 'parry') {
      const ready = this.modeT >= this.parryAt;
      if (ready) {
        g.text('!', W / 2, 202, '!#f2c35b', { size: 16, align: 'center' });
        g.text('PARE !', W / 2, 222, '!#f2c35b', { align: 'center' });
      } else g.text('Prépare-toi...', W / 2, 212, 'uiDim', { align: 'center' });
    } else if (this.q[0]?.say != null && Math.floor(this.time * 3) % 2 === 0) {
      g.rect(W - 18, 226, 6, 2, 'uiBorder');
    }

    for (const f of this.floaters) {
      const y = f.y - f.t * 26;
      g.text(f.text, f.x, y, '!' + f.c, { size: f.big ? 16 : 8, align: 'center', shadow: '!#1b1424' });
    }
  }
}
