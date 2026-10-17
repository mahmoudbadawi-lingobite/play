import { useEffect, useRef, useState } from 'react';
import { createRunner, type RunnerCallbacks, type RunnerState } from './runner';

/** Live 3D run. Loaded lazily (it contains three.js). */
export default function RunnerView({ state, onCoin, onError, className }: { state: RunnerState; onCoin: () => void; onError?: () => void; className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<RunnerState>(state);
  const coinRef = useRef(onCoin);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    stateRef.current = state;
    coinRef.current = onCoin;
  });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const cb: RunnerCallbacks = { onCoin: () => coinRef.current(), onWorldReady: () => setReady(true) };
    try {
      const runner = createRunner(mount, stateRef, cb);
      return () => runner.dispose();
    } catch {
      onError?.();
    }
    // created once; every frame reads the latest state from the ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={className ?? 'relative h-full w-full'}>
      <div ref={mountRef} className="absolute inset-0" role="img" aria-label="3D world" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-sky-300 to-sky-100 text-lg font-extrabold text-primary">Building your world…</div>
      )}
    </div>
  );
}
