/**
 * Treasure Hunt sound: ambient music per world (with volume + mute) and short effects.
 * Files live in public/treasure/sounds/: jungle.mp3, desert.mp3, saudi.mp3, crystal.mp3, ding.mp3, open.mp3, victory.mp3
 */

import type { WorldId } from './huntAssets';

const VOL_KEY = 'lingobite:hunt:volume';
const MUTE_KEY = 'lingobite:hunt:muted';

const url = (name: string) => {
  let base = '/';
  try {
    base = import.meta.env.BASE_URL;
  } catch {
    // not running under vite
  }
  return `${base}treasure/sounds/${name}.mp3`;
};

const read = (k: string) => {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string) => {
  try {
    window.localStorage.setItem(k, v);
  } catch {
    // storage blocked
  }
};

let volume = (() => {
  const v = parseFloat(read(VOL_KEY) ?? '');
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.5;
})();
let muted = read(MUTE_KEY) === '1';

type Track = 'jungle' | 'desert' | 'saudi' | 'crystal';
/** which music file a world plays (the re-coloured worlds share the loops of the others) */
const TRACK: Record<WorldId, Track> = { jungle: 'jungle', desert: 'desert', saudi: 'saudi', crystal: 'crystal', autumn: 'jungle', night: 'crystal', frost: 'crystal' };

const music: Partial<Record<Track, HTMLAudioElement>> = {};
const sfx: Record<string, HTMLAudioElement> = {};
let currentWorld: Track | null = null;

function musicEl(id: WorldId) {
  const w = TRACK[id];
  let a = music[w];
  if (!a && typeof Audio !== 'undefined') {
    a = new Audio(url(w));
    a.loop = true;
    a.preload = 'auto';
    music[w] = a;
  }
  return a;
}

function sfxEl(name: string) {
  let a = sfx[name];
  if (!a && typeof Audio !== 'undefined') {
    a = new Audio(url(name));
    a.preload = 'auto';
    sfx[name] = a;
  }
  return a;
}

function applyMusicVolume() {
  for (const a of Object.values(music)) if (a) a.volume = muted ? 0 : volume;
}

/** Plays the ambient loop of a world (the other world's loop is stopped). */
export function playMusic(worldId: WorldId) {
  const world = TRACK[worldId];
  if (currentWorld && currentWorld !== world) {
    const old = music[currentWorld];
    if (old) {
      old.pause();
      old.currentTime = 0;
    }
  }
  currentWorld = world;
  const a = musicEl(worldId);
  if (!a) return;
  a.volume = muted ? 0 : volume;
  void a.play().catch(() => {
    // the browser blocked autoplay; the next click will start it (see the game's start button)
  });
}

export function stopMusic() {
  for (const a of Object.values(music)) {
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
  }
  currentWorld = null;
}

/** Plays a one-shot effect. Effects follow the mute switch; the volume slider scales them too. */
export function playSfx(name: 'ding' | 'open' | 'victory') {
  if (muted) return;
  const a = sfxEl(name);
  if (!a) return;
  a.volume = Math.min(1, Math.max(0.3, volume));
  a.currentTime = 0;
  void a.play().catch(() => {});
}

export function stopSfx() {
  for (const a of Object.values(sfx)) {
    a.pause();
    a.currentTime = 0;
  }
}

export function getVolume() {
  return volume;
}
export function isMuted() {
  return muted;
}
export function setVolume(v: number) {
  volume = Math.min(1, Math.max(0, v));
  write(VOL_KEY, String(volume));
  if (volume > 0 && muted) setMuted(false);
  applyMusicVolume();
}
export function setMuted(m: boolean) {
  muted = m;
  write(MUTE_KEY, m ? '1' : '0');
  applyMusicVolume();
}

/** Preloads the effects and the music of the worlds of this hunt (call when the player presses Start, a user gesture). */
export function preloadSounds(worlds: WorldId[] = []) {
  worlds.forEach(musicEl);
  (['ding', 'open', 'victory'] as const).forEach(sfxEl);
}
