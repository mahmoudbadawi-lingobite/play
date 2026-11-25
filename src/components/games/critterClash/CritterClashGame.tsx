import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameProps } from '../GameShell';
import { tr } from '../../../i18n/tr';
import { COVER_FILES, PROP_FILES, UI_FILES, WORLD_FILES, assetUrl, loadImages, speciesFiles, type ImageStore, type Species } from './ccAssets';
import { CritterGame, type GameStatus } from './ccGame';
import { Terrain } from './ccTerrain';

const SPECIES: Species[] = ['hippo', 'llama', 'chicken', 'penguin', 'goat', 'bunny'];

/** Critter Clash, stage 1: a one-device preview of the map, the animals and the throwing. */
export function CritterClashGame(_props: GameProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const game = useRef<CritterGame | null>(null);
  const store = useRef<ImageStore>(new Map());
  const [round, setRound] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [st, setSt] = useState<GameStatus | null>(null);

  // load assets and build the map
  useEffect(() => {
    let dead = false;
    setReady(false); setProgress(0); setError('');
    (async () => {
      try {
        const files = [...WORLD_FILES, ...PROP_FILES, ...UI_FILES, ...COVER_FILES, ...speciesFiles(SPECIES)];
        await loadImages(files, store.current, (p) => !dead && setProgress(p * 0.5));
        const terrain = await Terrain.build(store.current, (p) => !dead && setProgress(0.5 + p * 0.5));
        if (dead) return;
        const g = new CritterGame(terrain, store.current);
        g.onStatus = setSt;
        game.current = g;
        setReady(true);
      } catch (e) {
        if (!dead) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { dead = true; game.current = null; };
  }, [round]);

  // canvas size, loop and input
  useEffect(() => {
    if (!ready) return;
    const g = game.current!; const cv = canvas.current!; const box = wrap.current!;
    const ctx = cv.getContext('2d')!;
    let dpr = 1;
    const fit = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      cv.width = Math.round(box.clientWidth * dpr); cv.height = Math.round(box.clientHeight * dpr);
      g.resize(cv.width, cv.height);
    };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(box);
    let raf = 0; let last = performance.now();
    const loop = (now: number) => { g.update((now - last) / 1000); last = now; g.draw(ctx); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);

    let drag: { x: number; y: number } | null = null;
    const down = (e: PointerEvent) => { if (!g.canAct) return; drag = { x: e.offsetX, y: e.offsetY }; cv.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => { if (drag) g.setAim((drag.x - e.offsetX) * dpr, (drag.y - e.offsetY) * dpr); };
    const up = () => { drag = null; };
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

    const keys = new Set<string>();
    const sync = () => { g.moveDir = keys.has('ArrowRight') || keys.has('d') ? 1 : keys.has('ArrowLeft') || keys.has('a') ? -1 : 0; };
    const kd = (e: KeyboardEvent) => {
      if (e.key === 'Enter') { g.fire(); e.preventDefault(); return; }
      if (e.key === 'z' || e.key === ' ') { g.hop(); e.preventDefault(); return; }
      if (e.key === 'w' || e.key === 'ArrowUp') { g.adjust(0.05, 0); e.preventDefault(); return; }
      if (e.key === 's' || e.key === 'ArrowDown') { g.adjust(-0.05, 0); e.preventDefault(); return; }
      if (e.key === 'e') { g.adjust(0, 0.04); return; }
      if (e.key === 'q') { g.adjust(0, -0.04); return; }
      keys.add(e.key); sync();
    };
    const ku = (e: KeyboardEvent) => { keys.delete(e.key); sync(); };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up);
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
    };
  }, [ready]);

  const hold = useCallback((dir: number) => ({
    onPointerDown: (e: React.PointerEvent) => { (e.target as Element).setPointerCapture?.(e.pointerId); if (game.current) game.current.moveDir = dir; },
    onPointerUp: () => { if (game.current) game.current.moveDir = 0; },
    onPointerCancel: () => { if (game.current) game.current.moveDir = 0; },
  }), []);

  if (error) return <div className="card-surface p-6 text-center">{tr('Could not load the game.')} <div className="text-xs opacity-60">{error}</div></div>;
  if (!ready) {
    return (
      <div className="card-surface mx-auto max-w-md p-8 text-center">
        <div className="text-4xl">🦛</div>
        <div className="mt-2 font-semibold">{tr('Building the meadow…')}</div>
        <div className="mx-auto mt-3 h-3 w-full overflow-hidden rounded-full bg-black/10"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} /></div>
      </div>
    );
  }

  const g = game.current!;
  const myTurn = st?.canAct ?? false;
  const teamName = st?.team === 0 ? tr('Blue team') : tr('Red team');
  const btn = (file: string, label: string, props: Record<string, unknown>) => (
    <button type="button" aria-label={label} disabled={!myTurn} {...props} className="select-none touch-none disabled:opacity-40">
      <img src={assetUrl(`ui/${file}`)} alt="" draggable={false} className="h-14 w-14 sm:h-16 sm:w-16" />
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-2 text-center text-sm">
        <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">{tr('Early preview: one device, no questions yet')}</span>
      </div>
      <div ref={wrap} className="relative w-full overflow-hidden rounded-2xl bg-sky-200" style={{ height: 'clamp(300px, 62vh, 620px)' }}>
        <canvas ref={canvas} className="absolute inset-0 h-full w-full touch-none" />
        {st && st.phase !== 'over' && <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">{tr("{team}'s turn", { team: teamName })} · {tr('Drag to aim, then press Fire')}</div>}
        {st?.phase === 'over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 text-white">
            <div className="text-3xl font-bold">{st.winner === null ? tr('Draw!') : tr('{team} wins!', { team: st.winner === 0 ? tr('Blue team') : tr('Red team') })}</div>
            <button type="button" className="btn-primary" onClick={() => setRound((r) => r + 1)}>{tr('Play again')}</button>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-center gap-3">
        {btn('ui_btn_left.webp', tr('Left'), hold(-1))}
        {btn('ui_btn_right.webp', tr('Right'), hold(1))}
        {btn('ui_btn_hop.webp', tr('Hop'), { onClick: () => g.hop() })}
        {btn('ui_btn_fire.webp', tr('Fire'), { onClick: () => g.fire() })}
        <button type="button" className="btn-secondary" onClick={() => { g.mapView = !g.mapView; }}>🗺️ {tr('Map')}</button>
      </div>
    </div>
  );
}
