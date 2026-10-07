// Le don de chaque mois devient une capacité de combat.
// `use(b)` reçoit le combat en cours (voir scenes/battle.js) et empile ses étapes.

export const SKILLS = [
  {
    name: 'Souffle gelé', cost: 2, desc: 'Dégâts x1.5 et gèle l\'ennemi un tour.',
    use: (b) => { b.hitEnemy(1.5, { color: '#9fd8ff' }); b.then(() => { b.e.frozen = 1; b.say(b.e.name + ' est gelé. Il a l\'air vexé.'); }); },
  },
  {
    name: 'Brume', cost: 1, desc: 'Esquive le prochain coup. Dégâts x1.2.',
    use: (b) => { b.dodge = true; b.say('Tu disparais dans la brume.'); b.hitEnemy(1.2, { color: '#cdc5c7' }); },
  },
  {
    name: 'Ordre royal', cost: 1, desc: 'Une chance sur deux : l\'ennemi s\'agenouille 2 tours.',
    use: (b) => {
      b.say('« À genoux, au nom de la couronne ! »');
      b.then(() => {
        if (!b.boss && Math.random() < 0.5) { b.e.kneel = 2; b.say(b.e.name + ' s\'agenouille. Par politesse, sans doute.'); } else b.say(b.e.name + ' éclate de rire. La couronne est vexée.');
      });
    },
  },
  {
    name: 'Double vent', cost: 2, desc: 'Frappe deux fois.',
    use: (b) => { b.hitEnemy(0.9, { color: '#bdcee7' }); b.hitEnemy(0.9, { color: '#bdcee7' }); },
  },
  {
    name: 'Graine soin', cost: 2, desc: 'Rend la moitié de tes PV.',
    use: (b) => { b.healPlayer(Math.ceil(b.maxHp() / 2)); b.say('La graine murmure. Tes plaies se referment. Elle parle de la météo.'); },
  },
  {
    name: 'Éclat d\'étoile', cost: 3, desc: 'Dégâts x2.5.',
    use: (b) => { b.say('Tu lâches l\'étoile. Elle n\'était pas d\'accord.'); b.hitEnemy(2.5, { color: '#f9eaa8', big: true }); },
  },
  {
    name: 'Boussole', cost: 1, desc: 'Fuite garantie, et tu voles de l\'or.',
    use: (b) => {
      if (b.boss) { b.say('La boussole tourne en rond. Même elle a peur.'); return; }
      b.then(() => { const g = 5 + Math.floor(Math.random() * 15); b.s.gold += g; b.say('La boussole indique la sortie. Tu ramasses ' + g + ' or au passage.'); b.flee(); });
    },
  },
  {
    name: 'Marteau tiède', cost: 1, desc: 'ATQ +50 % jusqu\'à la fin du combat.',
    use: (b) => { b.atkMul += 0.5; b.say('Tu frappes ton arme avec ton marteau. Elle chauffe. Toi aussi.'); },
  },
  {
    name: 'Lire la carte', cost: 1, desc: 'Coups critiques garantis 2 tours.',
    use: (b) => { b.critTurns = 2; b.say('La carte révèle le point faible de ' + b.e.name + '. Il est gêné.'); },
  },
  {
    name: 'Mèche vive', cost: 2, desc: 'Dégâts et brûlure 3 tours.',
    use: (b) => { b.hitEnemy(1, { color: '#ec9d49' }); b.then(() => { b.e.burn = 3; b.say(b.e.name + ' prend feu. Les lanternes approuvent.'); }); },
  },
  {
    name: 'Clé sans serrure', cost: 2, desc: '1 chance sur 3 : élimination. Contre la Cloche...',
    use: (b) => {
      b.say('Tu tournes la clé dans le vide...');
      b.then(() => {
        if (b.e.id === 'glas') { b.say('Elle trouve enfin sa serrure. Le Glas tremble !'); b.hitEnemy(0, { fixed: Math.ceil(b.e.maxHp * 0.35), color: '#f2c35b', big: true }); } else if (!b.boss && Math.random() < 0.34) { b.say('Clic. ' + b.e.name + ' est verrouillé hors de l\'existence.'); b.hitEnemy(0, { fixed: b.e.hp, color: '#c9a6ff', big: true }); } else b.say('Rien ne s\'ouvre. Ni porte, ni ennemi, ni espoir.');
      });
    },
  },
  {
    name: 'Lame de neige', cost: 2, desc: 'Plus tu es blessé, plus elle frappe fort.',
    use: (b) => { const miss = 1 - b.s.hp / b.maxHp(); b.say('La lame boit ta douleur.'); b.hitEnemy(1 + miss * 2.5, { color: '#e8f4ff', big: miss > 0.5 }); },
  },
];
