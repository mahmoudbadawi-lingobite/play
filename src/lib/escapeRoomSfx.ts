/**
 * Short feedback sounds for the escape room "find the hotspot" game.
 * Files live in /public/sounds so they're served as static assets and can
 * be preloaded/played instantly without bundling them as JS modules.
 */

import { useEffect, useState } from 'react';

const SOUND_FILES = {
  cold: 'cold.mp3',
  warm: 'warm.mp3',
  hot: 'hot.mp3',
  detected: 'detected.mp3',
  correct: 'correct.mp3',
  mistake: 'mistake.mp3',
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

// --- On/off preference, persisted across sessions and shared by any
// component that renders a mute toggle (e.g. the play page and, if added
// later, the room intro screen). Plain localStorage + a tiny pub/sub
// instead of React context, so it works from non-component code too. ---

const STORAGE_KEY = 'lingobite:escapeRoomSfxEnabled';
const listeners = new Set<(enabled: boolean) => void>();

function readStoredPreference(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

let sfxEnabled = readStoredPreference();

export function isEscapeRoomSfxEnabled(): boolean {
  return sfxEnabled;
}

export function setEscapeRoomSfxEnabled(enabled: boolean) {
  sfxEnabled = enabled;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    // Ignore - worst case the preference just doesn't persist.
  }
  listeners.forEach((listener) => listener(enabled));
}

export function subscribeToEscapeRoomSfxEnabled(listener: (enabled: boolean) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** React hook for a mute toggle button - stays in sync if toggled from another component. */
export function useEscapeRoomSfxEnabled(): [boolean, (enabled: boolean) => void] {
  const [enabled, setEnabled] = useState(sfxEnabled);
  useEffect(() => subscribeToEscapeRoomSfxEnabled(setEnabled), []);
  return [enabled, setEscapeRoomSfxEnabled];
}

/**
 * Plays a feedback sound. Clones the element so rapid repeat clicks (e.g.
 * clicking "cold" twice fast) restart cleanly instead of cutting each
 * other off. Silently no-ops if audio isn't available, sound is muted, or
 * playback is blocked (e.g. before the user has interacted with the page).
 */
export function playEscapeRoomSfx(name: EscapeRoomSfxName) {
  if (!sfxEnabled) return;
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

