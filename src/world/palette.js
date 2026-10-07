// Palette « Valombre » : le versant Clair. Recalée sur des captures d'@inner.lore
// (ciel azur, nuages pêche, toits d'ardoise bleue, bois sombre, lueurs ambre).
// Le versant Sombre est calculé à partir d'elle (voir gfx/color.js),
// sauf pour les couleurs listées dans `glow`, qui restent vives la nuit.
export const PALETTE = {
  colors: {
    ink: '#1b1424',
    shadow: '#2b2140',

    grass: '#6aa35a',
    grassDark: '#2c6c4d',
    grassLight: '#8fc77a',
    path: '#deccaa',
    pathDark: '#b89f86',
    water: '#4c86b0',
    waterDark: '#285965',
    waterLight: '#9ac7d8',

    stone: '#8d8f99',
    stoneDark: '#5c5960',
    stoneLight: '#cdc5c7',
    roof: '#4c6487',
    roofDark: '#283b57',
    roofLight: '#719ec8',
    wood: '#784b45',
    woodDark: '#4a2f2c',
    woodLight: '#a56a52',
    floor: '#8d6259',
    floorDark: '#5e4049',

    leaf: '#3e7f53',
    leafDark: '#254d3c',
    leafLight: '#78c47d',
    trunk: '#5e4049',

    flowerA: '#e4b36e',
    flowerB: '#d79877',
    flowerC: '#c9a6ff',

    // Lumières : ne s'assombrissent pas la nuit.
    lantern: '#ec9d49',
    lanternCore: '#f9eaa8',
    window: '#e4b36e',

    ui: '#1f1730',
    uiLight: '#33264a',
    uiBorder: '#f2c35b',
    uiText: '#f5e9d0',
    uiDim: '#9d8fb5',
    uiAccent: '#c9a6ff',
  },
  glow: ['lantern', 'lanternCore', 'window', 'ui', 'uiLight', 'uiBorder', 'uiText', 'uiDim', 'uiAccent', 'ink'],
};
