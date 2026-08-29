/**
 * Short feedback sounds for the escape room "find the hotspot" game.
 * Files live in /public/sounds so they're served as static assets and can
 * be preloaded/played instantly without bundling them as JS modules.
 */

const SOUND_FILES = {
  cold: 'cold.mp3',
  warm: 'warm.mp3',
  hot: 'hot.mp3',
  detected: 'detected.mp3',
  correct: 'correct.mp3',
} as const;

export type EscapeRoomSfxName = keyof typeof SOUND_FILES;

const cache = new Map<EscapeRoomSfxName, HTMLAudioElement>();

function getAudio(name: EscapeRoomSfxName): HTMLAudioElement | null {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
  let audio = cache.get(name);
  if (!audio) {
    const base = import.meta.env.BASE_URL;
    audio = new Audio(`${base}sounds/${SOUND_FILES[name]}`);
    audio.preload = 'auto';
    cache.set(name, audio);
  }
  return audio;
}

/** Preloads all escape room sound effects - call once when a room starts. */
export function preloadEscapeRoomSfx() {
  (Object.keys(SOUND_FILES) as EscapeRoomSfxName[]).forEach(getAudio);
}

/**
 * Plays a feedback sound. Clones the element so rapid repeat clicks (e.g.
 * clicking "cold" twice fast) restart cleanly instead of cutting each
 * other off. Silently no-ops if audio isn't available or playback is
 * blocked (e.g. before the user has interacted with the page).
 */
export function playEscapeRoomSfx(name: EscapeRoomSfxName) {
  const audio = getAudio(name);
  if (!audio) return;
  try {
    const instance = audio.cloneNode(true) as HTMLAudioElement;
    instance.volume = 0.6;
    void instance.play().catch(() => {
      // Autoplay/permissions can block this before user interaction - safe to ignore.
    });
  } catch {
    // Ignore - sound is a nice-to-have, never block gameplay on it.
  }
}
