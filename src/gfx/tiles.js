import { TILE } from '../config.js';

// Bruit déterministe : même tuile, mêmes détails, à chaque image.
export function hash(x, y, s = 0) {
  let n = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

// Tuiles infranchissables.
export const SOLID = new Set(['#', 'R', 'W', 'T', '~', 'L', 'C', 'B', 'S', 'X']);

// Tuiles qui émettent de la lumière la nuit.
export const LIGHTS = { L: { dx: 8, dy: 4, r: 26 }, W: { dx: 8, dy: 8, r: 18 } };

function grass(g, x, y, tx, ty) {
  g.rect(x, y, TILE, TILE, 'grass');
  for (let i = 0; i < 5; i++) {
    const r = hash(tx, ty, i);
    const px = x + Math.floor(r * 15);
    const py = y + Math.floor(hash(ty, tx, i + 9) * 14);
    g.rect(px, py, 1, 2, r > 0.5 ? 'grassDark' : 'grassLight');
  }
}

function floor(g, x, y, tx, ty) {
  g.rect(x, y, TILE, TILE, 'floor');
  for (let row = 0; row < 4; row++) {
    g.rect(x, y + row * 4 + 3, TILE, 1, 'floorDark');
    const seam = Math.floor(hash(tx, ty * 4 + row) * 12) + 2;
    g.rect(x + seam, y + row * 4, 1, 3, 'floorDark');
  }
}

function stoneWall(g, x, y, tx, ty, indoor) {
  if (indoor) {
    g.rect(x, y, TILE, TILE, 'woodDark');
    for (let i = 0; i < 4; i++) g.rect(x + i * 4 + 1, y, 1, 10, 'wood');
    g.rect(x, y + 10, TILE, 2, 'woodLight');
    g.rect(x, y + 12, TILE, 4, 'stoneDark');
    return;
  }
  g.rect(x, y, TILE, TILE, 'stone');
  for (let row = 0; row < 4; row++) {
    const off = (row + ty) % 2 ? 0 : 4;
    g.rect(x, y + row * 4 + 3, TILE, 1, 'stoneDark');
    g.rect(x + off, y + row * 4, 1, 3, 'stoneDark');
    g.rect(x + off + 8, y + row * 4, 1, 3, 'stoneDark');
    if (hash(tx, ty, row) > 0.6) g.rect(x + off + 2, y + row * 4, 3, 1, 'stoneLight');
  }
}

function water(g, x, y, tx, ty, t, at) {
  g.rect(x, y, TILE, TILE, 'water');
  for (let i = 0; i < 3; i++) {
    const phase = (t * 6 + hash(tx, ty, i) * 16) % 16;
    const wy = y + 3 + i * 5;
    g.rect(x + Math.floor(phase), wy, 4, 1, 'waterLight');
    g.rect(x + Math.floor((phase + 9) % 16), wy + 2, 2, 1, 'waterDark');
  }
  if (at(tx, ty - 1) !== '~') g.rect(x, y, TILE, 2, 'waterLight');
}

function tree(g, x, y, tx, ty) {
  grass(g, x, y, tx, ty);
  g.rect(x + 3, y + 13, 10, 2, 'leafDark');
  g.rect(x + 6, y + 10, 4, 5, 'trunk');
  g.disc(x + 8, y + 7, 6, 'leafDark');
  g.disc(x + 8, y + 6, 5, 'leaf');
  g.rect(x + 5, y + 3, 3, 2, 'leafLight');
  if (hash(tx, ty, 3) > 0.7) g.rect(x + 10, y + 7, 2, 2, 'flowerB');
}

function roof(g, x, y, tx, ty, at) {
  g.rect(x, y, TILE, TILE, 'roof');
  for (let row = 0; row < 4; row++) {
    g.rect(x, y + row * 4 + 3, TILE, 1, 'roofDark');
    const off = (row + tx) % 2 ? 2 : 6;
    g.rect(x + off, y + row * 4, 1, 3, 'roofDark');
    g.rect(x + off + 8, y + row * 4, 1, 3, 'roofDark');
  }
  if (at(tx, ty - 1) !== 'R') g.rect(x, y, TILE, 2, 'roofLight');
  if (at(tx, ty + 1) !== 'R') g.rect(x, y + 14, TILE, 2, 'roofDark');
}

function lantern(g, x, y, tx, ty) {
  grass(g, x, y, tx, ty);
  g.rect(x + 7, y + 6, 2, 9, 'woodDark');
  g.rect(x + 5, y + 14, 6, 2, 'woodDark');
  g.rect(x + 4, y, 8, 2, 'ink');
  g.rect(x + 5, y + 2, 6, 5, 'lantern');
  g.rect(x + 7, y + 3, 2, 3, 'lanternCore');
  g.rect(x + 4, y + 7, 8, 1, 'ink');
}

function windowWall(g, x, y, tx, ty, indoor) {
  stoneWall(g, x, y, tx, ty, indoor);
  g.rect(x + 3, y + 3, 10, 9, 'woodDark');
  g.rect(x + 4, y + 4, 8, 7, indoor ? 'waterLight' : 'window');
  g.rect(x + 7, y + 4, 1, 7, 'woodDark');
  g.rect(x + 4, y + 7, 8, 1, 'woodDark');
}

function flowers(g, x, y, tx, ty) {
  grass(g, x, y, tx, ty);
  const cols = ['flowerA', 'flowerB', 'flowerC'];
  for (let i = 0; i < 4; i++) {
    const fx = x + 2 + Math.floor(hash(tx, ty, i) * 11);
    const fy = y + 2 + Math.floor(hash(ty, tx, i) * 11);
    g.rect(fx, fy + 2, 1, 2, 'grassDark');
    g.rect(fx - 1, fy, 3, 2, cols[(i + tx) % 3]);
  }
}

function path(g, x, y, tx, ty) {
  g.rect(x, y, TILE, TILE, 'path');
  for (let i = 0; i < 4; i++) {
    g.rect(x + Math.floor(hash(tx, ty, i) * 15), y + Math.floor(hash(ty, tx, i) * 15), 1, 1, 'pathDark');
  }
}

function sign(g, x, y, tx, ty) {
  grass(g, x, y, tx, ty);
  g.rect(x + 7, y + 9, 2, 6, 'woodDark');
  g.rect(x + 2, y + 2, 12, 8, 'woodDark');
  g.rect(x + 3, y + 3, 10, 6, 'woodLight');
  g.rect(x + 5, y + 5, 6, 1, 'woodDark');
  g.rect(x + 5, y + 7, 4, 1, 'woodDark');
}

function barricade(g, x, y, tx, ty) {
  path(g, x, y, tx, ty);
  g.rect(x + 1, y + 5, 2, 10, 'woodDark');
  g.rect(x + 13, y + 5, 2, 10, 'woodDark');
  g.rect(x, y + 6, TILE, 3, 'roof');
  g.rect(x + 3, y + 6, 3, 3, 'stoneLight');
  g.rect(x + 10, y + 6, 3, 3, 'stoneLight');
  g.rect(x, y + 11, TILE, 2, 'wood');
}

function counter(g, x, y, tx, ty) {
  floor(g, x, y, tx, ty);
  g.rect(x, y + 2, TILE, 14, 'woodDark');
  g.rect(x, y + 2, TILE, 3, 'woodLight');
  g.rect(x + 3, y + 7, 10, 1, 'wood');
  if (hash(tx, ty) > 0.5) { g.rect(x + 5, y - 1, 4, 4, 'stoneLight'); g.rect(x + 6, y, 2, 2, 'flowerA'); }
}

function table(g, x, y, tx, ty) {
  floor(g, x, y, tx, ty);
  g.rect(x + 3, y + 12, 10, 2, 'floorDark');
  g.rect(x + 7, y + 8, 2, 5, 'woodDark');
  g.disc(x + 8, y + 6, 5, 'wood');
  g.rect(x + 5, y + 3, 4, 1, 'woodLight');
  g.rect(x + 9, y + 4, 2, 3, 'lantern');
}

function door(g, x, y) {
  g.rect(x, y, TILE, TILE, 'stoneDark');
  g.rect(x + 2, y + 1, 12, 15, 'woodDark');
  g.rect(x + 3, y + 2, 10, 14, 'wood');
  g.rect(x + 7, y + 2, 1, 14, 'woodDark');
  g.rect(x + 10, y + 9, 2, 2, 'lantern');
}

function mat(g, x, y, tx, ty) {
  floor(g, x, y, tx, ty);
  g.rect(x + 2, y + 4, 12, 9, 'roofDark');
  g.rect(x + 3, y + 5, 10, 7, 'roof');
}

// Dessine la tuile `ch` à l'écran (x, y). `at(tx, ty)` lit la carte pour les bords.
export function drawTile(g, ch, tx, ty, x, y, time, zone, at) {
  switch (ch) {
    case '.': return grass(g, x, y, tx, ty);
    case ':': return path(g, x, y, tx, ty);
    case '*': return flowers(g, x, y, tx, ty);
    case '~': return water(g, x, y, tx, ty, time, at);
    case '#': return stoneWall(g, x, y, tx, ty, zone.indoor);
    case 'W': return windowWall(g, x, y, tx, ty, zone.indoor);
    case 'R': return roof(g, x, y, tx, ty, at);
    case 'T': return tree(g, x, y, tx, ty);
    case 'L': return lantern(g, x, y, tx, ty);
    case '=': return floor(g, x, y, tx, ty);
    case 'C': return counter(g, x, y, tx, ty);
    case 'B': return table(g, x, y, tx, ty);
    case 'S': return sign(g, x, y, tx, ty);
    case 'X': return barricade(g, x, y, tx, ty);
    default: {
      const exit = zone.exits?.[ch];
      if (exit?.look === 'door') return door(g, x, y);
      if (exit?.look === 'mat') return mat(g, x, y, tx, ty);
      return path(g, x, y, tx, ty);
    }
  }
}
