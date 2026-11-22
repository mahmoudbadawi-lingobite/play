/**
 * Shared text-to-speech for the whole app. Picks the most natural English voice the device offers
 * (Edge "Natural" voices, Chrome Google voices, Apple Enhanced/Siri voices) instead of the browser default.
 */
export type SpeechLang = 'en' | 'ar';
const bestBy: Partial<Record<SpeechLang, SpeechSynthesisVoice | null>> = {};
let hooked = false;

export function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

/** Arabic script means Arabic voice, otherwise English. */
export function detectLang(text: string): SpeechLang {
  return /[\u0600-\u06FF]/.test(text) ? 'ar' : 'en';
}

function score(v: SpeechSynthesisVoice, lang: SpeechLang): number {
  const n = v.name.toLowerCase();
  if (!new RegExp(`^${lang}([-_]|$)`, 'i').test(v.lang)) return -1;
  let s = 0;
  if (n.includes('natural')) s += 100;
  if (n.includes('online')) s += 50;
  if (n.includes('premium') || n.includes('enhanced') || n.includes('siri')) s += 45;
  if (n.includes('google')) s += 40;
  if (/espeak|compact|novelty|bad news|bubbles|cellos|whisper|zarvox|trinoids|boing|bells|organ|jester|albert|junior|ralph|fred|kathy/.test(n)) s -= 200;
  if (lang === 'en') {
    if (/^en[-_]us$/i.test(v.lang)) s += 12; else if (/^en[-_]gb$/i.test(v.lang)) s += 10; else if (/^en[-_](au|ca|ie|in)$/i.test(v.lang)) s += 5;
  } else if (/^ar[-_]sa$/i.test(v.lang)) s += 12;
  if (v.localService === false) s += 3;
  return s;
}

function refresh() {
  try {
    const all = window.speechSynthesis.getVoices();
    for (const lang of ['en', 'ar'] as SpeechLang[]) {
      const list = all.filter((v) => score(v, lang) >= 0);
      if (list.length) bestBy[lang] = list.reduce((a, b) => (score(b, lang) > score(a, lang) ? b : a));
    }
  } catch { /* no speech support */ }
}

export function initVoice() {
  if (hooked || !speechAvailable()) return;
  hooked = true;
  refresh();
  window.speechSynthesis.addEventListener?.('voiceschanged', refresh);
}

export function voiceName(lang: SpeechLang = 'en'): string { initVoice(); refresh(); return bestBy[lang]?.name ?? ''; }

/** Reads text aloud. The language is detected from the text unless given. */
export function speakNatural(text: string, rate = 0.9, lang?: SpeechLang): boolean {
  try {
    if (!speechAvailable()) return false;
    initVoice();
    const l = lang ?? detectLang(text);
    if (!bestBy[l]) refresh();
    const voice = bestBy[l];
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = l === 'ar' ? 'ar-SA' : 'en-US';
    u.rate = l === 'ar' ? Math.min(rate, 0.85) : rate;
    window.speechSynthesis.speak(u);
    return true;
  } catch { return false; }
}

export function stopSpeaking() {
  try { if (speechAvailable()) window.speechSynthesis.cancel(); } catch { /* ignore */ }
}
