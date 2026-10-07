// Présages : un modificateur tiré à chaque descente dans le puits.
// `good` va de -1 (mauvais) à 1 (bon) ; la chance du signe penche le tirage.
// Multiplicateurs reconnus : enc, hp, atk, gold, xp, light, chest, fountain, drop, mousse.

export const OMENS = {
  calme: {
    name: 'Nuit calme', good: 1,
    text: 'Les Profondeurs dorment. Moins de monstres. Ne fais pas de bruit.',
    enc: 0.55,
  },
  festin: {
    name: 'Festin des Racines', good: 1,
    text: 'Chaque monstre vaincu laisse tomber quelque chose. Parfois même un objet utile.',
    drop: 1,
  },
  echo: {
    name: 'Mille sources', good: 0.5,
    text: 'Les fontaines jaillissent partout. Bénies ou maudites, ça, c\'est ton problème.',
    fountain: 4,
  },
  mousse: {
    name: 'Mousse en forme', good: 0.5, needsMousse: true,
    text: 'Mousse a bien dormi. Il frappe et soigne deux fois plus. Il est insupportable.',
    mousse: 2,
  },
  brume: {
    name: 'Brume épaisse', good: 0,
    text: 'On n\'y voit rien. Ta lumière est réduite. Mais les coffres pullulent.',
    light: 0.65, chest: 1.8,
  },
  or: {
    name: 'Pluie d\'or', good: 0,
    text: 'L\'or brille partout : x1.5. Les monstres l\'ont remarqué aussi : +20 % ATQ.',
    gold: 1.5, atk: 1.2,
  },
  glas: {
    name: 'Le Glas t\'attend', good: -0.5,
    text: 'La Cloche sait que tu viens. Rencontres +50 %. XP +50 %.',
    enc: 1.5, xp: 1.5,
  },
  lune: {
    name: 'Lune rouge', good: -1,
    text: 'Les monstres ont +35 % de PV et d\'ATQ. Ils rapportent le double d\'or et d\'XP.',
    hp: 1.35, atk: 1.35, gold: 2, xp: 2,
  },
};

// Tire un présage. Chance 5 : les bons sortent bien plus souvent ; chance 1 : l'inverse.
export function rollOmen(luck, hasMousse) {
  const bias = (luck - 3) / 2;
  const pool = Object.entries(OMENS).filter(([, o]) => hasMousse || !o.needsMousse);
  const weights = pool.map(([, o]) => Math.max(0.15, 1 + bias * o.good));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i][0];
  }
  return pool[0][0];
}
