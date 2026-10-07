// « Ton mois de naissance décide de ton destin. »
// Le mois est ton identité : un titre, une chance (1 à 5 étoiles, qui pèse sur
// les Présages) et un Signe, bonus passif permanent (`sign`, `mods`).
// Les dons de combat, eux, se tirent à chaque descente (voir world/skills.js).
export const FATES = [
  {
    month: 'JANVIER', title: 'Veilleur du Givre', gift: 'Lanterne froide', luck: 4,
    text: 'Ta lanterne ne s\'éteint jamais. Elle ne chauffe pas non plus. Personne n\'est parfait.',
    sign: 'Ta lumière porte beaucoup plus loin dans les Profondeurs.', mods: { light: 24 },
  },
  {
    month: 'FÉVRIER', title: 'Enfant des Brumes', gift: 'Cape de brouillard', luck: 3,
    text: 'Tu disparais quand tu veux. Surtout quand on te demande de faire la vaisselle.',
    sign: '15 % de chances d\'esquiver complètement un coup.', mods: { dodge: 0.15 },
  },
  {
    month: 'MARS', title: 'Héritier sans royaume', gift: 'Couronne fêlée', luck: 2,
    text: 'Tu as une couronne. Personne ne te croit. Même la couronne a des doutes.',
    sign: 'Les marchands te font -25 %. Par pitié, surtout.', mods: { shop: 0.75 },
  },
  {
    month: 'AVRIL', title: 'Apprenti du Vent', gift: 'Plume de route', luck: 4,
    text: 'Le vent te pousse toujours dans le dos. Sauf en montée. Le vent a de l\'humour.',
    sign: 'Fuite quasi garantie. Une Plume retour offerte à chaque descente.', mods: { flee: 0.95, plume: true },
  },
  {
    month: 'MAI', title: 'Gardien des Racines', gift: 'Graine qui murmure', luck: 5,
    text: 'La graine te parle la nuit. Elle a des opinions très arrêtées sur la météo.',
    sign: 'Tu regagnes des PV en marchant dans les Profondeurs.', mods: { regen: true },
  },
  {
    month: 'JUIN', title: 'Chasseur d\'étoiles', gift: 'Éclat d\'étoile', luck: 5,
    text: 'Tu as attrapé une étoile filante. Elle t\'en veut encore un peu.',
    sign: 'La zone du coup parfait est deux fois plus large.', mods: { perfect: 2 },
  },
  {
    month: 'JUILLET', title: 'Corsaire de rivière', gift: 'Boussole menteuse', luck: 1,
    text: 'Ta boussole indique toujours l\'aventure. Jamais la maison. Bon courage.',
    sign: '+50 % d\'or, partout, tout le temps.', mods: { gold: 1.5 },
  },
  {
    month: 'AOÛT', title: 'Forgeron de légendes', gift: 'Marteau tiède', luck: 3,
    text: 'Tout ce que tu forges devient légendaire. Surtout les cuillères.',
    sign: '+3 ATQ. Même tes cuillères sont légendaires.', mods: { atk: 3 },
  },
  {
    month: 'SEPTEMBRE', title: 'Lecteur de cartes', gift: 'Carte inachevée', luck: 4,
    text: 'Ta carte se dessine quand tu marches. Le bord du monde est juste un brouillon.',
    sign: 'Une flèche t\'indique toujours l\'escalier qui descend.', mods: { compass: true },
  },
  {
    month: 'OCTOBRE', title: 'Ami des Lanternes', gift: 'Mèche vivante', luck: 3,
    text: 'Les lanternes se tournent vers toi quand tu passes. C\'est flatteur. Un peu inquiétant.',
    sign: 'Tes attaques ont 25 % de chances d\'enflammer.', mods: { burn: 0.25, light: 10 },
  },
  {
    month: 'NOVEMBRE', title: 'Témoin de la Cloche', gift: 'Clé sans serrure', luck: 2,
    text: 'Tu as entendu la Cloche sous le lac. Depuis, une clé est apparue dans ta poche.',
    sign: 'Dégâts x2 contre le Glas. Il te connaît déjà.', mods: { bell: 2 },
  },
  {
    month: 'DÉCEMBRE', title: 'Dernier Chevalier d\'hiver', gift: 'Lame de neige', luck: 1,
    text: 'Ta lame ne fond jamais. Ton courage, lui, dépend beaucoup de la température.',
    sign: 'Sous 30 % de PV, tes coups font +60 %.', mods: { lowHp: 1.6 },
  },
];
