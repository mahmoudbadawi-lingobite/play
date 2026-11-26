/** Critter Clash sound effects: tiny synthesized sounds (no audio files). The mute choice is a UI setting, so localStorage is fine. */
const KEY = 'lingobite:cc:muted';
let ctx: AudioContext | null = null;
let muted = (() => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } })();
let noiseBuf: AudioBuffer | null = null;

export const sfxMuted = () => muted;
export function setSfxMuted(m: boolean) { muted = m; try { localStorage.setItem(KEY, m ? '1' : '0'); } catch { /* storage blocked */ } syncAmbient(); }

function getCtx(): AudioContext | null {
  if (!ctx) { try { const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; ctx = new AC({ latencyHint: 'interactive' }); } catch { ctx = null; } }
  if (ctx && ctx.state !== 'running') void ctx.resume();
  return ctx;
}
/** Call from a tap or click so the browser lets sounds play. */
export function unlockSfx() { getCtx(); syncAmbient(); }

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

// ------------------------------------------------------------------ ambient loop: wind, water and a few birds (no instruments)
let ambWanted = false;
let amb: { stop: () => void } | null = null;
let birdTimer = 0;

function loopNoise(c: AudioContext, seconds: number): AudioBufferSourceNode {
  const b = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate); const d = b.getChannelData(0);
  let last = 0; for (let i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; } // brown-ish noise
  const s = c.createBufferSource(); s.buffer = b; s.loop = true; return s;
}
function lfo(c: AudioContext, hz: number, depth: number, target: AudioParam): OscillatorNode {
  const o = c.createOscillator(); const g = c.createGain(); o.frequency.value = hz; g.gain.value = depth; o.connect(g).connect(target); o.start(); return o;
}
function chirp() {
  const c = ctx; if (!c || muted || !amb) return;
  const base = 2200 + Math.random() * 1600; const n = 2 + Math.floor(Math.random() * 3); const t0 = c.currentTime + 0.05;
  for (let i = 0; i < n; i++) {
    const o = c.createOscillator(); const g = c.createGain(); const t = t0 + i * 0.11;
    o.type = 'sine'; o.frequency.setValueAtTime(base, t); o.frequency.exponentialRampToValueAtTime(base * (1.25 + Math.random() * 0.3), t + 0.07);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.018, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.12);
  }
}
function buildAmbient() {
  const c = getCtx(); if (!c || amb) return;
  const master = c.createGain(); master.gain.value = 0; master.gain.linearRampToValueAtTime(1, c.currentTime + 2); master.connect(c.destination);
  const nodes: AudioScheduledSourceNode[] = [];
  // wind: low rustle that slowly swells
  const w = loopNoise(c, 6); const wf = c.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 420; wf.Q.value = 0.7;
  const wg = c.createGain(); wg.gain.value = 0.05; nodes.push(w, lfo(c, 0.07, 0.035, wg.gain), lfo(c, 0.05, 180, wf.frequency));
  w.connect(wf).connect(wg).connect(master);
  // water: soft lapping
  const r = loopNoise(c, 5); const rf = c.createBiquadFilter(); rf.type = 'lowpass'; rf.frequency.value = 900;
  const rg = c.createGain(); rg.gain.value = 0.045; nodes.push(r, lfo(c, 0.23, 0.025, rg.gain), lfo(c, 0.31, 250, rf.frequency));
  r.connect(rf).connect(rg).connect(master);
  w.start(); r.start();
  birdTimer = window.setInterval(() => { if (Math.random() < 0.7) chirp(); }, 3200);
  amb = { stop: () => { try { master.gain.cancelScheduledValues(c.currentTime); master.gain.setTargetAtTime(0, c.currentTime, 0.15); } catch { /* ignore */ } window.clearInterval(birdTimer); setTimeout(() => { nodes.forEach((n) => { try { n.stop(); } catch { /* ignore */ } }); master.disconnect(); }, 800); } };
}
function syncAmbient() {
  if (ambWanted && !muted) { try { buildAmbient(); } catch { /* ignore */ } }
  else if (amb) { amb.stop(); amb = null; }
}
export function startAmbient() { ambWanted = true; syncAmbient(); }
export function stopAmbient() { ambWanted = false; syncAmbient(); }
