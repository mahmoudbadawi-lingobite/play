/** Tiny synthesized sound effects (no audio files needed). Mute preference is a UI setting, so localStorage is fine. */
const KEY = 'lingobite:mq:muted';
let ctx: AudioContext | null = null;
let muted = (() => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } })();

export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  try { localStorage.setItem(KEY, m ? '1' : '0'); } catch { /* storage blocked */ }
}

function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  try { const AC = window.AudioContext || (window as any).webkitAudioContext; ctx = new AC({ latencyHint: 'interactive' }); } catch { ctx = null; }
  return ctx;
}
/** Starts the audio engine on the first touch, click or key press, so the first real sound is not late. */
export function unlockAudio() {
  const c = getCtx(); if (!c) return;
  if (c.state !== 'running') void c.resume();
  try { const s = c.createBufferSource(); s.buffer = c.createBuffer(1, 1, 22050); s.connect(c.destination); s.start(0); } catch { /* ignore */ }
}
if (typeof window !== 'undefined') {
  const evs = ['pointerdown', 'touchstart', 'keydown', 'click'];
  const un = () => { unlockAudio(); evs.forEach((e) => window.removeEventListener(e, un, true)); };
  evs.forEach((e) => window.addEventListener(e, un, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => { if (!document.hidden && ctx && ctx.state !== 'running') void ctx.resume(); });
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.12, slideTo?: number) {
  if (muted) return;
  try {
    const c = getCtx(); if (!c) return;
    if (c.state !== 'running') void c.resume();
    const t0 = c.currentTime + start;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  } catch { /* audio unavailable */ }
}

export const sfx = {
  click: () => tone(520, 0, 0.06, 'triangle', 0.07),
  correct: () => { tone(660, 0, 0.12, 'triangle'); tone(880, 0.1, 0.18, 'triangle'); },
  wrong: () => tone(220, 0, 0.3, 'sawtooth', 0.08, 120),
  encounter: () => { tone(330, 0, 0.1, 'square', 0.06); tone(440, 0.1, 0.1, 'square', 0.06); tone(660, 0.2, 0.2, 'square', 0.06); },
  throw: () => tone(300, 0, 0.35, 'sine', 0.1, 900),
  wobble: () => tone(180, 0, 0.12, 'triangle', 0.1),
  capture: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.09, 0.22, 'triangle', 0.12)),
  escape: () => tone(400, 0, 0.4, 'sawtooth', 0.07, 100),
  levelUp: () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.25, 'square', 0.07)),
  coin: () => { tone(988, 0, 0.07, 'square', 0.06); tone(1319, 0.07, 0.15, 'square', 0.06); },
};

export function speak(text: string, rate = 0.9) {
  try {
    if (!('speechSynthesis' in window)) return false;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = rate;
    window.speechSynthesis.speak(u);
    return true;
  } catch { return false; }
}
