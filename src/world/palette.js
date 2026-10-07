// Palette « Valombre » : le versant Clair (or chaud, verts tendres).
// Le versant Sombre est calculé à partir d'elle (voir gfx/color.js),
// sauf pour les couleurs listées dans `glow`, qui restent vives la nuit.
export const PALETTE = {
  colors: {
    ink: '#1b1424',
    shadow: '#2b2140',

    grass: '#6aa84f',
    grassDark: '#4c8a3e',
    grassLight: '#9ccc65',
    path: '#d8b67a',
    pathDark: '#b58e57',
    water: '#3d7fc4',
    waterDark: '#2c5f9e',
    waterLight: '#9fd8ff',

    stone: '#a39488',
    stoneDark: '#6f625b',
    stoneLight: '#c9bcb0',
    roof: '#b54a3c',
    roofDark: '#7e2f2a',
    roofLight: '#d9705a',
    wood: '#9a6b40',
    woodDark: '#6b4528',
    woodLight: '#c08a54',
    floor: '#b3814f',
    floorDark: '#8c5d36',

    leaf: '#3f8a46',
    leafDark: '#2a5f37',
    leafLight: '#68b35a',
    trunk: '#6b4528',

    flowerA: '#ffd25a',
    flowerB: '#ff8fa8',
    flowerC: '#c9a6ff',

    // Lumières : ne s'assombrissent pas la nuit.
    lantern: '#ffcf5a',
    lanternCore: '#fff4c2',
    window: '#ffc35a',

    ui: '#1f1730',
    uiLight: '#33264a',
    uiBorder: '#f2c35b',
    uiText: '#f5e9d0',
    uiDim: '#9d8fb5',
    uiAccent: '#c9a6ff',
  },
  glow: ['lantern', 'lanternCore', 'window', 'ui', 'uiLight', 'uiBorder', 'uiText', 'uiDim', 'uiAccent', 'ink'],
};
