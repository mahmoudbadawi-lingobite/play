/** Critter Clash sound effects: tiny synthesized sounds (no audio files). The mute choice is a UI setting, so localStorage is fine. */
const KEY = 'lingobite:cc:muted';
let ctx: AudioContext | null = null;
let muted = (() => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } })();
let noiseBuf: AudioBuffer | null = null;

export const sfxMuted = () => muted;
export function setSfxMuted(m: boolean) { muted = m; try { localStorage.setItem(KEY, m ? '1' : '0'); } catch { /* storage blocked */ } }

function getCtx(): AudioContext | null {
  if (!ctx) { try { const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; ctx = new AC({ latencyHint: 'interactive' }); } catch { ctx = null; } }
  if (ctx && ctx.state !== 'running') void ctx.resume();
  return ctx;
}
/** Call from a tap or click so the browser lets sounds play. */
export function unlockSfx() { getCtx(); }

function tone(freq: number, start: number, dur: number, type: OscillatorType, vol: number, slideTo?: number) {
  const c = getCtx(); if (!c) return;
  const t0 = c.currentTime + start; const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.05);
}
function noise(start: number, dur: number, vol: number, f0: number, f1: number, kind: BiquadFilterType = 'lowpass') {
  const c = getCtx(); if (!c) return;
  if (!noiseBuf) { noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const t0 = c.currentTime + start; const s = c.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const f = c.createBiquadFilter(); f.type = kind; f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f).connect(g).connect(c.destination); s.start(t0); s.stop(t0 + dur + 0.05);
}

export type Sfx = 'step' | 'jump' | 'land' | 'shoot' | 'pop' | 'splash' | 'poof' | 'defeat' | 'win' | 'right' | 'wrong';

export function sfx(k: Sfx) {
  if (muted) return;
  try {
    switch (k) {
      case 'step': tone(190 + Math.random() * 40, 0, 0.06, 'triangle', 0.07, 120); break;
      case 'jump': tone(280, 0, 0.18, 'sine', 0.13, 760); tone(420, 0.02, 0.14, 'triangle', 0.05, 900); break;
      case 'land': tone(130, 0, 0.1, 'sine', 0.12, 70); break;
      case 'shoot': noise(0, 0.28, 0.12, 500, 2600, 'bandpass'); tone(320, 0, 0.22, 'sine', 0.08, 900); break;
      case 'pop': noise(0, 0.22, 0.28, 3000, 300); tone(180, 0, 0.18, 'sine', 0.2, 55); break;
      case 'splash': noise(0, 0.5, 0.2, 2200, 400); tone(520, 0, 0.12, 'sine', 0.06, 200); tone(380, 0.12, 0.1, 'sine', 0.05, 160); break;
      case 'poof': noise(0, 0.3, 0.12, 1800, 500); tone(700, 0, 0.25, 'sine', 0.07, 1200); break;
      case 'defeat': tone(440, 0, 0.18, 'triangle', 0.12, 380); tone(370, 0.2, 0.18, 'triangle', 0.12, 320); tone(300, 0.4, 0.4, 'triangle', 0.12, 150); break;
      case 'win': [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.14, 0.22, 'triangle', 0.14)); tone(1047, 0.6, 0.6, 'triangle', 0.14); tone(784, 0.6, 0.6, 'sine', 0.08); tone(659, 0.6, 0.6, 'sine', 0.08); break;
      case 'right': tone(660, 0, 0.12, 'sine', 0.14); tone(990, 0.1, 0.2, 'sine', 0.14); break;
      case 'wrong': tone(200, 0, 0.25, 'sawtooth', 0.08, 130); break;
    }
  } catch { /* audio not available */ }
}
