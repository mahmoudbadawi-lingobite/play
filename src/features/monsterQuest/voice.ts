/**
 * Picks the most natural English voice the device offers, instead of the browser default.
 * Edge: "Microsoft … Online (Natural)" (the Read Aloud voices). Chrome: Google voices. Apple: Enhanced / Premium / Siri voices.
 * The voice is chosen once and cached (the list of voices arrives a moment after the page loads).
 */
let best: SpeechSynthesisVoice | null = null;
let hooked = false;

function score(v: SpeechSynthesisVoice): number {
  const n = v.name.toLowerCase();
  if (!/^en([-_]|$)/i.test(v.lang)) return -1;
  let s = 0;
  if (n.includes('natural')) s += 100;           // Edge neural voices
  if (n.includes('online')) s += 50;
  if (n.includes('premium') || n.includes('enhanced') || n.includes('siri')) s += 45; // Apple
  if (n.includes('google')) s += 40;             // Chrome
  if (/espeak|compact|novelty|bad news|bubbles|cellos|whisper|zarvox|trinoids|boing|bells|organ|jester|albert|junior|ralph|fred|kathy/.test(n)) s -= 200;
  if (/^en[-_]us$/i.test(v.lang)) s += 12; else if (/^en[-_]gb$/i.test(v.lang)) s += 10; else if (/^en[-_](au|ca|ie|in)$/i.test(v.lang)) s += 5;
  if (v.localService === false) s += 3;
  return s;
}

function refresh() {
  try {
    const list = window.speechSynthesis.getVoices().filter((v) => score(v) >= 0);
    if (!list.length) return;
    best = list.reduce((a, b) => (score(b) > score(a) ? b : a));
  } catch { /* no speech support */ }
}

export function initVoice() {
  if (hooked || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  hooked = true;
  refresh();
  window.speechSynthesis.addEventListener?.('voiceschanged', refresh);
}

/** The voice that will be used, for showing in the UI (empty until the browser has loaded its voices). */
export function voiceName(): string { initVoice(); refresh(); return best?.name ?? ''; }

export function speakNatural(text: string, rate = 0.9): boolean {
  try {
    if (!('speechSynthesis' in window)) return false;
    initVoice();
    if (!best) refresh();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (best) { u.voice = best; u.lang = best.lang; } else u.lang = 'en-US';
    u.rate = rate;
    window.speechSynthesis.speak(u);
    return true;
  } catch { return false; }
}
