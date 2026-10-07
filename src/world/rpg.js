// Règles RPG : statistiques, objets, expérience.

export const ITEMS = {
  potion: { name: 'Potion', desc: 'Rend 30 PV.', price: 12 },
  meche: { name: 'Mèche', desc: 'Rend 3 Éclats.', price: 18 },
  plume: { name: 'Plume retour', desc: 'Remonte à la Halte.', price: 25 },
};

export const maxHp = (s) => 24 + (s.lvl - 1) * 7 + (s.bonusHp || 0);
export const maxMp = (s) => 3 + Math.floor((s.lvl - 1) / 2);
export const atk = (s) => 5 + (s.lvl - 1) * 2;
export const def = (s) => Math.max(0, 1 + Math.floor((s.lvl - 1) * 1.2) - (s.flags.cursed ? 1 : 0));
export const xpNext = (lvl) => Math.round(12 * Math.pow(lvl, 1.6));

export function initRpg(s) {
  s.lvl ??= 1;
  s.xp ??= 0;
  s.gold ??= 20;
  s.items ??= { potion: 2 };
  s.deepest ??= 0;
  s.deaths ??= 0;
  s.kills ??= 0;
  s.hp ??= maxHp(s);
  s.mp ??= maxMp(s);
}

export function fullHeal(s) {
  s.hp = maxHp(s);
  s.mp = maxMp(s);
}

const LEVEL_LINES = [
  'Tu te sens plus fort. Tes genoux, moins.',
  'Quelque part, un barde ajoute un couplet.',
  'Mousse applaudit. Avec quoi, on ne sait pas.',
  'Le Royaume prend note. Il est un peu inquiet.',
  'Tu as débloqué : « marcher avec plus d\'assurance ».',
];

// Ajoute de l'XP et renvoie les lignes de montée de niveau.
export function gainXp(s, n) {
  s.xp += n;
  const lines = [];
  while (s.xp >= xpNext(s.lvl)) {
    s.xp -= xpNext(s.lvl);
    s.lvl++;
    fullHeal(s);
    lines.push('NIVEAU ' + s.lvl + ' ! ' + LEVEL_LINES[(s.lvl + s.month) % LEVEL_LINES.length]);
  }
  return lines;
}
