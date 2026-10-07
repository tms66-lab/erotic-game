// Personnages générés en code à partir d'un « look » (couleurs + coiffe),
// pour pouvoir créer des PNJ variés sans fichiers image.
const SHADOW = '!rgba(0,0,0,0.28)';

export function drawHuman(g, x, y, look, dir, step) {
  const { skin, hair, top, bottom, accent = top, style = 'short' } = look;
  const walking = step > 0;
  const phase = step % 2;
  const bob = walking && phase ? 1 : 0;
  const side = dir === 'left' || dir === 'right';
  y += bob;

  g.rect(x + 3, y + 14 - bob, 10, 2, SHADOW);

  // jambes
  if (side) {
    const a = walking ? (phase ? -1 : 1) : 0;
    g.rect(x + 6 + a, y + 11, 2, 3, bottom);
    g.rect(x + 8 - a, y + 11, 2, 3, bottom);
    g.rect(x + 6 + a, y + 14, 2, 1, 'ink');
    g.rect(x + 8 - a, y + 14, 2, 1, 'ink');
  } else {
    const l = walking && phase ? 2 : 3;
    const r = walking && !phase ? 2 : 3;
    g.rect(x + 5, y + 11, 2, l, bottom);
    g.rect(x + 9, y + 11, 2, r, bottom);
    g.rect(x + 5, y + 11 + l, 2, 1, 'ink');
    g.rect(x + 9, y + 11 + r, 2, 1, 'ink');
  }

  // corps
  g.rect(x + 3, y + 7, 10, 5, 'ink');
  g.rect(x + 4, y + 7, 8, 4, top);
  g.rect(x + 4, y + 10, 8, 1, accent);
  if (side) {
    const sw = walking ? (phase ? 1 : -1) : 0;
    g.rect(x + 7 + sw, y + 8, 2, 3, accent);
    g.rect(x + 7 + sw, y + 11, 2, 1, skin);
  } else {
    g.rect(x + 3, y + 8, 1, 3, top);
    g.rect(x + 12, y + 8, 1, 3, top);
    g.rect(x + 3, y + 11, 1, 1, skin);
    g.rect(x + 12, y + 11, 1, 1, skin);
  }

  // tête
  g.rect(x + 3, y, 10, 8, 'ink');
  g.rect(x + 4, y + 1, 8, 6, skin);

  // coiffe
  const capColor = style === 'hood' || style === 'hat' ? accent : style === 'helm' ? 'stoneLight' : hair;
  g.rect(x + 4, y, 8, 2, capColor);
  if (style === 'long' || style === 'hood') {
    g.rect(x + 3, y + 1, 1, style === 'long' ? 8 : 6, capColor);
    g.rect(x + 12, y + 1, 1, style === 'long' ? 8 : 6, capColor);
  } else {
    g.rect(x + 4, y + 2, 1, 2, capColor);
    g.rect(x + 11, y + 2, 1, 2, capColor);
  }
  if (style === 'hat') {
    g.rect(x + 2, y + 1, 12, 2, accent);
    g.rect(x + 5, y - 3, 6, 4, accent);
    g.rect(x + 7, y - 5, 2, 2, accent);
    g.rect(x + 5, y, 6, 1, 'lantern');
  }
  if (style === 'helm') g.rect(x + 4, y + 2, 8, 1, 'stoneDark');

  // visage selon l'orientation
  if (dir === 'down') {
    g.rect(x + 6, y + 4, 1, 2, 'ink');
    g.rect(x + 9, y + 4, 1, 2, 'ink');
  } else if (dir === 'up') {
    g.rect(x + 4, y + 1, 8, 6, capColor);
  } else if (dir === 'left') {
    g.rect(x + 5, y + 4, 1, 2, 'ink');
    g.rect(x + 9, y + 1, 3, 5, capColor);
  } else {
    g.rect(x + 10, y + 4, 1, 2, 'ink');
    g.rect(x + 4, y + 1, 3, 5, capColor);
  }
}

// Mousse : petit golem de mousse, rond et têtu.
export function drawBlob(g, x, y, dir, step, time, asleep = false) {
  const bob = step > 0 && step % 2 ? 2 : Math.round(Math.sin(time * 3) * 0.6);
  g.rect(x + 3, y + 14, 10, 2, SHADOW);
  g.disc(x + 8, y + 9 - bob, 6, 'ink');
  g.disc(x + 8, y + 9 - bob, 5, 'leaf');
  g.rect(x + 4, y + 11 - bob, 8, 2, 'leafDark');
  g.rect(x + 5, y + 5 - bob, 3, 2, 'leafLight');
  // fleur sur la tête
  g.rect(x + 8, y + 2 - bob, 1, 2, 'grassDark');
  g.rect(x + 7, y + 1 - bob, 3, 1, 'flowerB');
  if (asleep) {
    g.rect(x + 5, y + 9 - bob, 2, 1, 'ink');
    g.rect(x + 9, y + 9 - bob, 2, 1, 'ink');
    const zy = Math.floor((time * 6) % 6);
    g.text('z', x + 12, y - 4 - zy, 'uiText', { size: 8 });
    return;
  }
  if (dir === 'up') return;
  const ox = dir === 'left' ? -2 : dir === 'right' ? 2 : 0;
  g.rect(x + 5 + ox, y + 8 - bob, 2, 2, 'uiText');
  g.rect(x + 9 + ox, y + 8 - bob, 2, 2, 'uiText');
  g.px(x + 6 + ox, y + 9 - bob, 'ink');
  g.px(x + 10 + ox, y + 9 - bob, 'ink');
}

// Page du Carnet du Voyageur, posée au sol.
export function drawPage(g, x, y, time) {
  const bob = Math.round(Math.sin(time * 4) * 1.5);
  g.rect(x + 4, y + 13, 8, 2, SHADOW);
  g.rect(x + 4, y + 3 + bob, 8, 9, 'ink');
  g.rect(x + 5, y + 4 + bob, 6, 7, '!#f5e9d0');
  g.rect(x + 6, y + 6 + bob, 4, 1, '!#9d8fb5');
  g.rect(x + 6, y + 8 + bob, 3, 1, '!#9d8fb5');
  if (Math.floor(time * 3) % 3 === 0) g.px(x + 12, y + 2 + bob, '!#fff4c2');
}

export function drawStar(g, x, y, filled) {
  const c = filled ? 'uiBorder' : 'uiLight';
  g.rect(x + 3, y, 1, 7, c);
  g.rect(x, y + 3, 7, 1, c);
  g.rect(x + 2, y + 1, 3, 5, c);
  g.rect(x + 1, y + 2, 5, 3, c);
}

export function drawSunMoon(g, x, y, night) {
  if (night > 0.5) {
    g.disc(x + 4, y + 4, 4, '!#e8e4ff');
    g.disc(x + 6, y + 3, 3, '!#1f1730');
  } else {
    g.disc(x + 4, y + 4, 3, '!#ffd25a');
    g.rect(x + 4, y - 1, 1, 1, '!#ffd25a');
    g.rect(x + 4, y + 9, 1, 1, '!#ffd25a');
    g.rect(x - 1, y + 4, 1, 1, '!#ffd25a');
    g.rect(x + 9, y + 4, 1, 1, '!#ffd25a');
  }
}
