import { W, H } from './config.js';
import { Input } from './engine/input.js';
import { Game } from './engine/game.js';
import { TitleScene } from './scenes/title.js';

const canvas = document.getElementById('game');
const screen = document.getElementById('screen');
canvas.width = W;
canvas.height = H;

// Agrandit le canvas d'un facteur entier (en pixels physiques) pour des pixels nets.
function fit() {
  const box = screen.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const scale = Math.max(1, Math.floor(Math.min((box.width * dpr) / W, (box.height * dpr) / H)));
  canvas.style.width = (W * scale) / dpr + 'px';
  canvas.style.height = (H * scale) / dpr + 'px';
}
addEventListener('resize', fit);
fit();

const input = new Input();
input.bindTouch();
const game = new Game(canvas, input);

// La police pixel doit être chargée avant le premier texte.
const font = document.fonts?.load('8px "Press Start 2P"') ?? Promise.resolve();
Promise.race([font, new Promise((r) => setTimeout(r, 2500))])
  .catch(() => {})
  .then(() => {
    game.setScene(new TitleScene(game));
    requestAnimationFrame(frame);
  });

const STEP = 1 / 60;
let acc = 0;
let last = performance.now();
function frame(now) {
  acc += Math.min(0.25, (now - last) / 1000);
  last = now;
  let n = 0;
  while (acc >= STEP && n++ < 5) {
    game.update(STEP);
    acc -= STEP;
  }
  game.draw();
  requestAnimationFrame(frame);
}

// Debug / tests automatisés.
window.__game = game;
