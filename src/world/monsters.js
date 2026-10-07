// Bestiaire des Profondeurs. Chaque description finit par une chute.
// `shape` choisit le dessin (gfx/monster.js), les couleurs le personnalisent.

export const STRATA = [
  { name: 'Les Racines', floors: [1, 3] },
  { name: 'Forêt-Champignon', floors: [4, 6] },
  { name: 'Cavernes de Cristal', floors: [7, 9] },
  { name: 'Le Noyau', floors: [10, 10] },
];

export const strataOf = (floor) => STRATA.findIndex((s) => floor >= s.floors[0] && floor <= s.floors[1]);

export const MONSTERS = {
  gluet: {
    name: 'Gluet', shape: 'blob', body: '#7cc46a', accent: '#3e7f53', hp: 14, atk: 4, xp: 5, gold: [2, 6],
    desc: 'Il colle. C\'est tout. Mais il colle très bien.',
    moves: [{ text: 'Gluet te colle dessus.', power: 1 }, { text: 'Gluet rebondit sur ta tête.', power: 1.2 }],
  },
  rongeur: {
    name: 'Rongeracine', shape: 'beast', body: '#8d6259', accent: '#e4b36e', hp: 18, atk: 5, xp: 7, gold: [3, 8], teeth: true,
    desc: 'Il mange les racines. Et les bottes. Surtout les bottes.',
    moves: [{ text: 'Rongeracine mord ta botte.', power: 1 }, { text: 'Rongeracine mord l\'autre botte.', power: 1.3 }],
  },
  lueur: {
    name: 'Lueur perdue', shape: 'wisp', body: '#9ac7d8', accent: '#f9eaa8', hp: 12, atk: 6, xp: 7, gold: [4, 9],
    desc: 'Elle cherche la sortie depuis 200 ans. Elle pense que c\'est toi.',
    moves: [{ text: 'La Lueur te traverse. C\'est froid.', power: 1.1 }, { text: 'La Lueur te demande son chemin. Tu culpabilises.', power: 0.8 }],
  },
  chapeautin: {
    name: 'Chapeautin', shape: 'shroom', body: '#e4d0b0', accent: '#c4523b', hp: 26, atk: 8, xp: 12, gold: [6, 14],
    desc: 'Il se croit le plus beau champignon. Il a raison, c\'est vexant.',
    moves: [{ text: 'Chapeautin te gifle avec son chapeau.', power: 1 }, { text: 'Chapeautin pose. Tu es ébloui.', power: 1.25 }],
  },
  sporemere: {
    name: 'Spore-Mère', shape: 'shroom', body: '#c9a6ff', accent: '#6b4fa8', hp: 34, atk: 9, xp: 16, gold: [8, 18],
    desc: 'Elle a beaucoup d\'enfants. Ils sont tous dans tes poumons.',
    moves: [{ text: 'Spore-Mère éternue. Sur toi.', power: 1.1 }, { text: 'Spore-Mère te présente ses enfants.', power: 1.3 }],
  },
  grosdoux: {
    name: 'Le Gros Doux', shape: 'fluff', body: '#f2c9d8', accent: '#d79877', hp: 40, atk: 11, xp: 20, gold: [10, 22],
    desc: 'Personne n\'a jamais survécu à un câlin. Personne n\'a jamais refusé non plus.',
    moves: [{ text: 'Le Gros Doux te fait un câlin. Tes côtes protestent.', power: 1.3 }, { text: 'Le Gros Doux s\'assoit. Sur toi.', power: 1.1 }],
  },
  prismoeil: {
    name: 'Prismoeil', shape: 'eye', body: '#bdcee7', accent: '#6ebbd6', hp: 42, atk: 13, xp: 26, gold: [14, 28],
    desc: 'Il voit toutes tes erreurs. Sous sept angles.',
    moves: [{ text: 'Prismoeil te fixe. Tu revois tes choix de vie.', power: 1.1 }, { text: 'Prismoeil tire un rayon arc-en-ciel.', power: 1.35 }],
  },
  golem: {
    name: 'Golem de quartz', shape: 'golem', body: '#8d8f99', accent: '#71c5c3', hp: 56, atk: 14, xp: 32, gold: [16, 34],
    desc: 'Construit pour garder une porte. Il a perdu la porte. Il garde toi.',
    moves: [{ text: 'Le Golem te pose une main dessus. Toute la main.', power: 1.25 }, { text: 'Le Golem cherche sa porte. Il te bouscule.', power: 1 }],
  },
  echo: {
    name: 'Écho', shape: 'wisp', body: '#6ebbd6', accent: '#e8e4ff', hp: 38, atk: 15, xp: 28, gold: [14, 30],
    desc: 'Il répète tout ce que tu dis. En plus méchant.',
    moves: [{ text: 'Écho répète ta dernière phrase. Ça fait mal.', power: 1.2 }, { text: 'Écho hurle ton prénom. Mal prononcé.', power: 1.1 }],
  },
  caillou: {
    name: 'Un caillou', shape: 'rock', body: '#8d8f99', accent: '#5c5960', hp: 3, atk: 0, xp: 40, gold: [0, 1], rare: true,
    desc: 'C\'est un caillou. Il ne fait rien. Mousse est tombé amoureux.',
    moves: [{ text: 'Le caillou ne fait rien. Avec beaucoup de conviction.', power: 0 }],
  },
  glas: {
    name: 'Le Glas', shape: 'bell', body: '#b58e57', accent: '#f2c35b', hp: 260, atk: 17, xp: 200, gold: [150, 150], boss: true,
    desc: 'La Cloche sous le lac. Elle sonne une fois par an. Ce soir, c\'est pour toi.',
    moves: [
      { text: 'Le Glas sonne. Tes dents vibrent.', power: 1.1 },
      { text: 'Le battant du Glas balaie la salle.', power: 1.4 },
      { text: 'Le Glas murmure le nom de tous ceux qu\'il a fait taire.', power: 0.9 },
    ],
    rage: { text: 'LE GLAS SONNE LE TREIZIÈME COUP.', power: 2 },
  },
};

const POOLS = [
  ['gluet', 'gluet', 'rongeur', 'lueur'],
  ['chapeautin', 'chapeautin', 'sporemere', 'grosdoux'],
  ['prismoeil', 'golem', 'echo', 'echo'],
];

// Monstre aléatoire pour un étage, avec stats augmentées selon la profondeur.
export function rollMonster(floor) {
  const pool = POOLS[Math.min(2, strataOf(floor))];
  const id = Math.random() < 0.04 ? 'caillou' : pool[Math.floor(Math.random() * pool.length)];
  return makeMonster(id, floor);
}

export function makeMonster(id, floor = 1) {
  const m = MONSTERS[id];
  const local = floor - STRATA[Math.max(0, strataOf(floor))].floors[0];
  const k = m.boss ? 1 : 1 + local * 0.18;
  const hp = Math.round(m.hp * k);
  return {
    ...m, id, hp, maxHp: hp,
    atk: Math.round(m.atk * k),
    xp: Math.round(m.xp * k),
    frozen: 0, kneel: 0, burn: 0,
  };
}
