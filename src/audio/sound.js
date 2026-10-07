// Son chiptune généré en direct (WebAudio) : bruitages + petites boucles musicales.

let ctx = null;
let master = null;
let muted = false;
try { muted = localStorage.getItem('valombre_mute') === '1'; } catch { /* stockage indisponible */ }

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.6;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  if (pending) { const p = pending; pending = null; playMusic(p); }
}

export function isMuted() { return muted; }

export function setMuted(m) {
  muted = m;
  try { localStorage.setItem('valombre_mute', m ? '1' : '0'); } catch { /* stockage indisponible */ }
  if (master) master.gain.value = m ? 0 : 0.6;
}

function tone(freq, dur, { type = 'square', vol = 0.08, slide = 0, delay = 0 } = {}) {
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const gn = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t0 + dur);
  gn.gain.setValueAtTime(vol, t0);
  gn.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  o.connect(gn).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(dur, vol = 0.1, delay = 0) {
  if (!ctx) return;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  const gn = ctx.createGain();
  gn.gain.value = vol;
  src.buffer = buf;
  src.connect(gn).connect(master);
  src.start(ctx.currentTime + delay);
}

const SFX = {
  select: () => tone(880, 0.05, { vol: 0.04 }),
  confirm: () => { tone(660, 0.06, { vol: 0.05 }); tone(990, 0.08, { vol: 0.05, delay: 0.05 }); },
  cancel: () => tone(330, 0.08, { vol: 0.05, slide: 0.7 }),
  text: () => tone(1200 + Math.random() * 200, 0.02, { vol: 0.015, type: 'triangle' }),
  hit: () => { noise(0.08, 0.15); tone(220, 0.1, { slide: 0.5, vol: 0.08 }); },
  crit: () => { noise(0.15, 0.2); tone(880, 0.15, { slide: 0.3, vol: 0.1 }); tone(1320, 0.1, { delay: 0.05, vol: 0.06 }); },
  hurt: () => { noise(0.12, 0.18); tone(160, 0.2, { slide: 0.5, type: 'sawtooth', vol: 0.07 }); },
  parry: () => { tone(1568, 0.12, { vol: 0.07 }); tone(2093, 0.18, { vol: 0.05, delay: 0.04, type: 'triangle' }); },
  heal: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, { type: 'triangle', vol: 0.06, delay: i * 0.06 })),
  coin: () => { tone(988, 0.06, { vol: 0.05 }); tone(1319, 0.14, { vol: 0.05, delay: 0.06 }); },
  stairs: () => [440, 392, 349, 330, 294].forEach((f, i) => tone(f, 0.1, { type: 'triangle', vol: 0.06, delay: i * 0.07 })),
  encounter: () => { [262, 330, 392, 523, 659, 784].forEach((f, i) => tone(f, 0.06, { vol: 0.06, delay: i * 0.035 })); noise(0.3, 0.06, 0.2); },
  levelup: () => [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone(f, 0.14, { vol: 0.07, delay: i * 0.08 })),
  win: () => [784, 784, 784, 1046].forEach((f, i) => tone(f, i === 3 ? 0.5 : 0.12, { vol: 0.07, delay: i * 0.13 })),
  death: () => [392, 370, 349, 330, 262].forEach((f, i) => tone(f, 0.35, { type: 'triangle', vol: 0.08, delay: i * 0.25 })),
  bell: () => { [110, 220, 331, 441].forEach((f, i) => tone(f, 2.5, { type: 'sine', vol: 0.12 / (i + 1) })); },
  curse: () => { tone(200, 0.6, { type: 'sawtooth', slide: 0.4, vol: 0.06 }); tone(207, 0.6, { type: 'sawtooth', slide: 0.4, vol: 0.06 }); },
  step: () => tone(90, 0.03, { type: 'triangle', vol: 0.03 }),
};

export function sfx(name) {
  if (!ctx || muted) return;
  SFX[name]?.();
}

// ---------- musique ----------
const _ = null;
const SONGS = {
  village: {
    bpm: 100, wave: 'triangle', leadVol: 0.05, bassVol: 0.025,
    lead: [72, 76, 79, 76, 74, 76, 72, _, 69, 72, 74, 72, 67, _, _, _, 72, 76, 79, 81, 79, 76, 74, _, 72, 74, 76, 74, 72, _, _, _],
    bass: [48, _, 55, _, 53, _, 55, _, 45, _, 52, _, 43, _, 50, _, 48, _, 55, _, 53, _, 57, _, 53, _, 55, _, 48, _, _, _],
  },
  night: {
    bpm: 76, wave: 'triangle', leadVol: 0.045, bassVol: 0.04,
    lead: [69, _, 72, _, 76, _, 74, _, 72, _, 69, _, 67, _, _, _, 65, _, 69, _, 72, _, 71, _, 69, _, _, _, _, _, _, _],
    bass: [45, _, _, _, 52, _, _, _, 41, _, _, _, 43, _, _, _, 41, _, _, _, 48, _, _, _, 45, _, _, _, 40, _, _, _],
  },
  deep: {
    bpm: 68, wave: 'triangle', leadVol: 0.04, bassVol: 0.02,
    lead: [69, _, 72, _, 71, _, 67, _, 69, _, _, _, 64, _, _, _, 69, _, 72, _, 76, _, 74, _, 71, _, _, _, _, _, _, _],
    bass: [45, _, _, _, 45, _, _, _, 41, _, _, _, 40, _, _, _, 45, _, _, _, 43, _, _, _, 40, _, _, _, 40, _, _, _],
  },
  battle: {
    bpm: 150, wave: 'square', leadVol: 0.035, bassVol: 0.03,
    lead: [76, 79, 83, 79, 76, 79, 83, 86, 84, 83, 79, 76, 78, 79, 81, 83, 76, 79, 83, 79, 76, 79, 83, 88, 86, 84, 83, 81, 79, 78, 76, _],
    bass: [40, 40, 52, 40, 40, 40, 52, 40, 36, 36, 48, 36, 38, 38, 50, 38, 40, 40, 52, 40, 40, 40, 52, 40, 36, 36, 48, 36, 35, 35, 47, 35],
  },
  boss: {
    bpm: 132, wave: 'sawtooth', leadVol: 0.03, bassVol: 0.035,
    lead: [74, _, 73, _, 74, _, 69, _, 70, _, 69, _, 65, _, 62, _, 74, _, 77, _, 76, _, 74, _, 73, _, _, _, 69, _, _, _],
    bass: [38, 38, 50, 38, 38, 38, 50, 38, 34, 34, 46, 34, 33, 33, 45, 33, 38, 38, 50, 38, 38, 38, 50, 38, 37, 37, 49, 37, 33, 33, 45, 33],
  },
};

let current = null;
let pending = null;
let timer = null;
let stepIdx = 0;
let nextTime = 0;

export function playMusic(name) {
  if (!ctx) { pending = name; return; }
  if (current === name) return;
  stopMusic();
  const song = SONGS[name];
  if (!song) return;
  current = name;
  stepIdx = 0;
  nextTime = ctx.currentTime + 0.05;
  const stepDur = 60 / song.bpm / 2;
  timer = setInterval(() => {
    while (nextTime < ctx.currentTime + 0.2) {
      const i = stepIdx % song.lead.length;
      const delay = Math.max(0, nextTime - ctx.currentTime);
      if (!muted) {
        if (song.lead[i] != null) tone(midi(song.lead[i]), stepDur * 0.9, { type: song.wave, vol: song.leadVol, delay });
        if (song.bass[i % song.bass.length] != null) tone(midi(song.bass[i % song.bass.length]), stepDur * 0.8, { type: 'square', vol: song.bassVol, delay });
      }
      nextTime += stepDur;
      stepIdx++;
    }
  }, 50);
}

export function stopMusic() {
  if (timer) clearInterval(timer);
  timer = null;
  current = null;
}
