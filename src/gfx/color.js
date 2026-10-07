// Passage jour -> nuit : chaque couleur est désaturée puis tirée vers un bleu
// de lune. Les couleurs « lumineuses » (lanternes, fenêtres) y échappent.
export const NIGHT_STEPS = 8;
const NIGHT = [22, 26, 66];
const cache = new Map();

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]) {
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

export function nightify(hex, step) {
  if (step <= 0) return hex;
  const key = hex + step;
  let out = cache.get(key);
  if (out) return out;
  const t = step / NIGHT_STEPS;
  const rgb = hexToRgb(hex);
  const lum = rgb[0] * 0.3 + rgb[1] * 0.59 + rgb[2] * 0.11;
  const a = 0.62 * t;
  out = rgbToHex(rgb.map((c, i) => {
    const desat = c + (lum - c) * 0.4 * t;
    return Math.max(0, Math.min(255, Math.round(desat * (1 - a) + NIGHT[i] * a)));
  }));
  cache.set(key, out);
  return out;
}
