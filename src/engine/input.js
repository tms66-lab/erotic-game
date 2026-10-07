const DIRS = ['up', 'down', 'left', 'right'];

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'a', Space: 'a', KeyJ: 'a',
  KeyX: 'b', KeyK: 'b', ShiftLeft: 'b', ShiftRight: 'b',
  Enter: 'start', Escape: 'start',
};

// Gère clavier + manette tactile. `pressed()` ne vaut vrai qu'une fois par appui.
export class Input {
  constructor() {
    this.held = new Set();
    this.hit = new Set();
    this.dirStack = [];

    addEventListener('keydown', (e) => {
      const b = KEYMAP[e.code];
      if (!b) return;
      e.preventDefault();
      if (!e.repeat) this.press(b);
    });
    addEventListener('keyup', (e) => {
      const b = KEYMAP[e.code];
      if (b) this.release(b);
    });
    addEventListener('blur', () => {
      for (const b of [...this.held]) this.release(b);
    });
  }

  press(b) {
    if (this.held.has(b)) return;
    this.held.add(b);
    this.hit.add(b);
    if (DIRS.includes(b)) {
      this.dirStack = this.dirStack.filter((d) => d !== b);
      this.dirStack.push(b);
    }
  }

  release(b) {
    this.held.delete(b);
    this.dirStack = this.dirStack.filter((d) => d !== b);
  }

  // Dernière direction maintenue (priorité à la plus récente).
  dir() {
    return this.dirStack[this.dirStack.length - 1] || null;
  }

  down(b) {
    return this.held.has(b);
  }

  pressed(b) {
    return this.hit.has(b);
  }

  endFrame() {
    this.hit.clear();
  }

  bindTouch() {
    const buzz = () => navigator.vibrate?.(8);

    for (const el of document.querySelectorAll('[data-btn]')) {
      const b = el.dataset.btn;
      const off = () => { el.classList.remove('on'); this.release(b); };
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        el.setPointerCapture(e.pointerId);
        el.classList.add('on');
        this.press(b);
        buzz();
      });
      el.addEventListener('pointerup', off);
      el.addEventListener('pointercancel', off);
    }

    // Croix : la direction suit le pouce, on peut glisser sans relever le doigt.
    const pad = document.getElementById('dpad');
    if (!pad) return;
    const arms = Object.fromEntries(DIRS.map((d) => [d, pad.querySelector('.' + d)]));
    let current = null;
    const set = (d) => {
      if (d === current) return;
      if (current) { this.release(current); arms[current].classList.remove('on'); }
      current = d;
      if (d) { this.press(d); arms[d].classList.add('on'); buzz(); }
    };
    const track = (e) => {
      const r = pad.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      if (Math.hypot(dx, dy) < 10) return set(null);
      set(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    };
    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      pad.setPointerCapture(e.pointerId);
      track(e);
    });
    pad.addEventListener('pointermove', (e) => { if (pad.hasPointerCapture(e.pointerId)) track(e); });
    pad.addEventListener('pointerup', () => set(null));
    pad.addEventListener('pointercancel', () => set(null));
  }
}

export const DIR_VEC = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

export const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };
