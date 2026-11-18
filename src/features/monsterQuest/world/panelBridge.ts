import { useSyncExternalStore } from 'react';

/**
 * Lets the Monster Quest side menu (the one icon column on the left, in full screen and in the normal page) drive the in-game panel
 * that opens on top of the paused world, instead of the panel carrying a second copy of the menu.
 * While the panel is open, `tab` is the page it shows and `go(id)` switches it ('explore' closes it and returns to the world).
 */
export interface PanelBridgeState { tab: string; go: (id: string) => void }

let state: PanelBridgeState | null = null;
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export const panelBridge = {
  set(s: PanelBridgeState | null) { state = s; listeners.forEach((l) => l()); },
};
/** null when no panel is open over the world. */
export const usePanelBridge = () => useSyncExternalStore(subscribe, () => state, () => null);
