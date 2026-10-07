// Les Profondeurs : étages générés au hasard sous le Puits de la Halte.
// Légende : d sol · w mur · ^ remonter · v descendre · K coffre (k ouvert)
//           O cristal · M champignon lumineux · F fontaine (f tarie) · G le Glas (g muet)
import { STRATA, strataOf } from './monsters.js';

export const THEMES = [
  { floor: '#4a3a30', floorDark: '#3a2c25', wall: '#5e4049', wallDark: '#392934', wallTop: '#241a1f', accent: '#78c47d', glow: '#9ac7d8', fog: [10, 8, 14] },
  { floor: '#2f3a3a', floorDark: '#243030', wall: '#3e5a50', wallDark: '#2a4038', wallTop: '#152420', accent: '#c9a6ff', glow: '#c9a6ff', fog: [8, 10, 18] },
  { floor: '#2a3448', floorDark: '#202838', wall: '#3a4d6b', wallDark: '#283650', wallTop: '#141c2c', accent: '#71c5c3', glow: '#6ebbd6', fog: [6, 10, 20] },
  { floor: '#3a2a2a', floorDark: '#2a1e1e', wall: '#5c3a2e', wallDark: '#402820', wallTop: '#1c1010', accent: '#f2c35b', glow: '#ec9d49', fog: [16, 6, 6] },
];

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BOSS_MAP = [
  'wwwwwwwwwwwww',
  'wwOdddddddOww',
  'wwddddGddddww',
  'wwdddddddddww',
  'wwOdddddddOww',
  'wwwwwdddwwwww',
  'wwwwwdddwwwww',
  'wwwwMdddMwwww',
  'wwwwwd^dwwwww',
  'wwwwwwwwwwwww',
];

function bfs(map, sx, sy) {
  const H = map.length;
  const W = map[0].length;
  const dist = Array.from({ length: H }, () => Array(W).fill(-1));
  const q = [[sx, sy]];
  dist[sy][sx] = 0;
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (map[ny]?.[nx] === 'd' && dist[ny][nx] < 0) { dist[ny][nx] = dist[y][x] + 1; q.push([nx, ny]); }
    }
  }
  return dist;
}

export function makeFloor(n, seed = Math.random() * 1e9) {
  const si = strataOf(n);
  const theme = THEMES[si];
  const base = {
    name: STRATA[si].name + ' — Étage ' + n,
    dark: true, deep: true, floor: n, theme,
    music: n === 10 ? 'boss' : 'deep',
    exits: {
      '^': { look: 'stairs', to: 'halte', x: 12, y: 5, dir: 'down', text: 'Tu remontes jusqu\'à la surface. C\'est long. Très long.' },
      v: { look: 'stairs', to: 'deep:' + (n + 1) },
    },
    npcs: [],
    items: [],
    encounter: n === 10 ? 0 : 0.11,
  };

  if (n === 10) {
    return { ...base, map: BOSS_MAP.map((r) => r.split('')), spawn: [6, 7, 'up'] };
  }

  const R = rng(seed);
  const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  const W = 26;
  const H = 26;
  const map = Array.from({ length: H }, () => Array(W).fill('w'));
  const rooms = [];
  for (let tries = 0; tries < 200 && rooms.length < 7; tries++) {
    const w = ri(4, 7);
    const h = ri(4, 6);
    const x = ri(1, W - w - 2);
    const y = ri(2, H - h - 2);
    if (rooms.some((r) => x < r.x + r.w + 1 && x + w + 1 > r.x && y < r.y + r.h + 1 && y + h + 1 > r.y)) continue;
    rooms.push({ x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1) });
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) map[yy][xx] = 'd';
  }
  // couloirs en L entre salles consécutives
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1];
    const b = rooms[i];
    const horizFirst = R() < 0.5;
    let x = a.cx;
    let y = a.cy;
    const carve = () => { if (map[y][x] === 'w') map[y][x] = 'd'; };
    if (horizFirst) { while (x !== b.cx) { x += Math.sign(b.cx - x); carve(); } while (y !== b.cy) { y += Math.sign(b.cy - y); carve(); } } else { while (y !== b.cy) { y += Math.sign(b.cy - y); carve(); } while (x !== b.cx) { x += Math.sign(b.cx - x); carve(); } }
  }

  const start = rooms[0];
  const dist = bfs(map, start.cx, start.cy);
  let end = rooms[1];
  for (const r of rooms) if (dist[r.cy][r.cx] > dist[end.cy][end.cx]) end = r;
  map[start.cy][start.cx] = '^';
  map[end.cy][end.cx] = 'v';

  // décor et coffres, à l'intérieur des salles (la bordure reste libre)
  const deco = si === 0 ? 'M' : si === 1 ? 'M' : 'O';
  for (const r of rooms) {
    const spots = [];
    for (let yy = r.y + 1; yy < r.y + r.h - 1; yy++) for (let xx = r.x + 1; xx < r.x + r.w - 1; xx++) if (map[yy][xx] === 'd' && !(xx === r.cx && (yy === r.cy || yy === r.cy + 1))) spots.push([xx, yy]);
    const take = () => spots.splice(Math.floor(R() * spots.length), 1)[0];
    if (spots.length && R() < 0.55 && r !== start) { const [x, y] = take(); map[y][x] = 'K'; }
    if (spots.length && R() < 0.6) { const [x, y] = take(); map[y][x] = deco; }
    if (spots.length && R() < 0.12 && r !== start && n > 1) { const [x, y] = take(); map[y][x] = 'F'; }
  }

  return { ...base, map, spawn: [start.cx, start.cy + 1, 'down'] };
}
