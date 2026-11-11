import { useCallback, useEffect, useState, type RefObject } from 'react';

type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FsDocument = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> | void; webkitFullscreenEnabled?: boolean };

/** Browsers that can put a page element in full screen (everything except iPhone Safari, which only allows it for video). */
export const fullscreenSupported = (): boolean => {
  if (typeof document === 'undefined') return false;
  const d = document as FsDocument;
  return !!(d.fullscreenEnabled || d.webkitFullscreenEnabled);
};
export const fullscreenElement = (): Element | null => {
  const d = document as FsDocument;
  return d.fullscreenElement ?? d.webkitFullscreenElement ?? null;
};
export async function enterFullscreen(el: HTMLElement): Promise<void> {
  const e = el as FsElement;
  try {
    if (e.requestFullscreen) await e.requestFullscreen({ navigationUI: 'hide' });
    else await e.webkitRequestFullscreen?.();
  } catch { /* the browser refused (no user gesture, policy…): the game just stays windowed */ }
}
export async function leaveFullscreen(): Promise<void> {
  const d = document as FsDocument;
  try {
    if (document.exitFullscreen) await document.exitFullscreen();
    else await d.webkitExitFullscreen?.();
  } catch { /* already out */ }
}
/** Full screen for the whole Monster Quest shell, so the menu tabs stay on screen with the game. `root` is the shell element. */
export function useShellFullscreen(root: RefObject<HTMLElement | null>) {
  const [isFs, setIsFs] = useState(false);
  useEffect(() => {
    const sync = () => setIsFs(!!root.current && fullscreenElement() === root.current);
    sync();
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => { document.removeEventListener('fullscreenchange', sync); document.removeEventListener('webkitfullscreenchange', sync); };
  }, [root]);
  // leaving the game page while in full screen must not leave the browser stuck in full screen
  useEffect(() => () => { if (root.current && fullscreenElement() === root.current) void leaveFullscreen(); }, [root]);
  const enter = useCallback(() => { if (root.current) void enterFullscreen(root.current); }, [root]);
  const exit = useCallback(() => { void leaveFullscreen(); }, []);
  const toggle = useCallback(() => (fullscreenElement() ? exit() : enter()), [enter, exit]);
  return { supported: fullscreenSupported(), isFs, enter, exit, toggle };
}
