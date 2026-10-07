// Zones jouables. Légende des cartes :
//  .  herbe        :  chemin       *  fleurs      ~  eau
//  T  arbre        L  lanterne     R  toit        #  mur
//  W  mur + fenêtre  =  plancher   C  comptoir    B  table
//  S  panneau      X  barricade    0-9  sortie (voir `exits`)
//
// Un PNJ peut n'apparaître que le jour ou la nuit (`when`), et `talk(s)`
// reçoit l'état de la partie pour adapter ses répliques.

const LOOKS = {
  odile: { skin: '#e0ac7e', hair: '#3b2a20', top: '#4a5f8f', bottom: '#2f3550', accent: '#c9a24b', style: 'helm' },
  tobin: { skin: '#c98b62', hair: '#d8d4cc', top: '#5d7a4a', bottom: '#4a3a2a', accent: '#8a6a3a', style: 'short' },
  nyx: { skin: '#b9a4d6', hair: '#2a1f3d', top: '#3a2a5c', bottom: '#241a38', accent: '#6b4fa8', style: 'hat' },
  pip: { skin: '#f0c49a', hair: '#c46a2a', top: '#d9705a', bottom: '#4a5f8f', accent: '#ffd25a', style: 'short' },
  maelle: { skin: '#8d5a3c', hair: '#1f1712', top: '#a33b3b', bottom: '#3b2a20', accent: '#f2e0c0', style: 'long' },
  fifre: { skin: '#f2c9a0', hair: '#e8c86a', top: '#3f8a6e', bottom: '#5a3f2a', accent: '#ffd25a', style: 'hood' },
  gris: { skin: '#d9b08c', hair: '#6f625b', top: '#5a5560', bottom: '#3a3640', accent: '#8a8590', style: 'hood' },
};

export const PLAYER_LOOK = { skin: '#f0c49a', hair: '#4a2f22', top: '#c9a24b', bottom: '#3b4a6b', accent: '#7e2f2a', style: 'short' };

export const ZONES = {
  halte: {
    name: 'Halte-Lanterne',
    map: [
      'TTTTTTTTT99TTTTTTTTT',
      'T....*..T:XT...*...T',
      'T.......L::L.......T',
      'T..RRRRR.::........T',
      'T..RRRRR.::...~~~~.T',
      'T..#W1W#.::..~~~~~~T',
      'T....:...::..~~~~~~T',
      'T..L.::::::...~~~~.T',
      'T.*.....S::......*.T',
      'T....T...::.L......T',
      'T........::........T',
      'T..*.....::....T...T',
      'TT.......::.......TT',
      'T....*...::...*....T',
      'T........::........T',
      'TT.......::......*TT',
      'T.....T..XX........T',
      'TTTTTTTTTTTTTTTTTTTT',
    ],
    exits: {
      1: { look: 'door', to: 'auberge', x: 5, y: 8, dir: 'up' },
      9: {
        look: 'path', to: null,
        text: [
          'La route du Nord grimpe vers les Cimes, là où les cartes deviennent des brouillons.',
          'FIN DE LA DÉMO. Le reste du Royaume se dessine encore...',
        ],
      },
    },
    // Barricades ouvertes une fois la route du Nord libérée.
    openWhen: { X: (s) => s.flags.north_open },
    signs: {
      '8,8': [
        'HALTE-LANTERNE',
        'Route du Nord : fermée. Route du Sud : fermée aussi, en fait. Bienvenue !',
      ],
    },
    waterText: [
      'L\'eau est froide et très calme.',
      'Tout au fond, tu crois voir briller quelque chose. Une cloche ?',
    ],
    items: [
      { id: 'p1', x: 2, y: 16 },
      { id: 'p2', x: 18, y: 4 },
    ],
    npcs: [
      {
        id: 'odile', name: 'Odile', look: LOOKS.odile, x: 9, y: 1, dir: 'down',
        pos: (s) => (s.flags.north_open ? [7, 2] : null),
        talk: (s) => {
          if (s.flags.north_open) return ['La route est à toi, ' + s.fate.title + '. Ne me fais pas regretter ça.'];
          if (s.pages.length >= 3) {
            return {
              lines: [
                'Trois pages du Carnet ? Le même que celui du vieux voyageur...',
                'Bon. Si le Carnet t\'a choisi, qui suis-je pour discuter ?',
                { who: '', text: 'Odile retire la barricade. La route du Nord est ouverte !' },
              ],
              after: (st) => { st.flags.north_open = true; },
            };
          }
          return [
            'Halte. La route du Nord est fermée.',
            'Ordre du Conseil. Enfin, ordre de moi. Le Conseil, c\'est moi le mardi.',
            'Reviens avec une bonne raison. Le voyageur gris de l\'auberge en a peut-être une.',
          ];
        },
      },
      {
        id: 'tobin', name: 'Vieux Tobin', look: LOOKS.tobin, x: 12, y: 6, dir: 'right',
        talk: (s) => (s.night
          ? [
            'Chut... écoute.',
            'Rien ? Tant mieux. Le soir où tu l\'entendras, la Cloche sous le lac aura quelque chose à te dire.',
          ]
          : [
            'Quarante ans que je pêche ici. Jamais attrapé un poisson.',
            'Mais j\'ai remonté trois clés, une couronne et une lettre adressée à moi. Datée de l\'an prochain.',
          ]),
      },
      {
        id: 'mousse', name: 'Mousse', look: null, kind: 'blob', x: 16, y: 8, dir: 'down',
        hideWhen: (s) => s.flags.mousse_joined,
        talk: () => ({
          lines: [
            { who: '', text: 'Un petit tas de mousse ronfle au milieu des fleurs.' },
            { who: '', text: 'Il ouvre un oeil. Puis l\'autre. Puis il te fixe très, très longtemps.' },
            'Mrrp.',
            { who: '', text: 'Mousse a décidé que tu faisais partie de son groupe. Tu n\'as pas eu ton mot à dire.' },
          ],
          after: (st) => { st.flags.mousse_joined = true; },
        }),
      },
      {
        id: 'nyx', name: 'Nyx', look: LOOKS.nyx, x: 13, y: 9, dir: 'down', when: 'night',
        talk: (s) => [
          'Bienvenue au marché de minuit, ' + s.fate.title + '.',
          'Je vends des souvenirs que tu n\'as pas encore vécus. Le prix ? Un souvenir que tu as déjà.',
          'Reviens quand tu en auras assez à échanger. Ou trop à oublier.',
        ],
      },
      {
        id: 'pip', name: 'Pip', look: LOOKS.pip, x: 4, y: 10, dir: 'right', when: 'day', wander: true,
        talk: (s) => [
          'T\'es ' + s.fate.title + ' ? Trop bien ! Moi je suis né en ' + s.fate.month.toLowerCase() + ' aussi. Enfin je crois.',
          'La nuit, une dame avec un grand chapeau vend des trucs bizarres près de la lanterne. Maman veut pas que je la voie.',
        ],
      },
    ],
  },

  auberge: {
    name: 'Auberge de la Dernière Mèche',
    indoor: true,
    map: [
      '############',
      '#WW##WW##WW#',
      '#==========#',
      '#=CCCC=====#',
      '#==========#',
      '#=B====B===#',
      '#==========#',
      '#=B====B===#',
      '#==========#',
      '#####1######',
    ],
    exits: {
      1: { look: 'mat', to: 'halte', x: 5, y: 6, dir: 'down' },
    },
    items: [{ id: 'p3', x: 10, y: 8 }],
    npcs: [
      {
        id: 'maelle', name: 'Maëlle', look: LOOKS.maelle, x: 3, y: 2, dir: 'down',
        talk: (s) => [
          'Bienvenue à la Dernière Mèche ! Quelque part dans le Royaume, il y a toujours une lumière allumée pour toi.',
          s.flags.mousse_joined
            ? 'Ton ami en mousse peut rester. Mais s\'il prend racine dans le tapis, tu paies le tapis.'
            : 'Si tu croises un petit tas de mousse qui ronfle dehors, ne le réveille pas. Il adopte les gens.',
        ],
      },
      {
        id: 'fifre', name: 'Fifre', look: LOOKS.fifre, x: 9, y: 4, dir: 'left', wander: true,
        talk: () => [
          'Ce soir, je ne sauve pas le royaume. Je fais sa première partie.',
          'Il me manque juste un nom de groupe. Et des musiciens. Et un public. Mais l\'énergie est là.',
        ],
      },
      {
        id: 'gris', name: 'Voyageur gris', look: LOOKS.gris, x: 3, y: 6, dir: 'right',
        talk: (s) => {
          const n = s.pages.length;
          if (n >= 3) return ['Tu as les trois pages. Montre-les à la garde. Le Nord t\'attend.'];
          return [
            '...',
            'Mon carnet s\'est envolé quand je suis arrivé ici. Les pages se sont éparpillées.',
            'Trouve-les et la garde te laissera passer. Elle me doit bien ça. (' + n + '/3)',
          ];
        },
      },
    ],
  },
};
