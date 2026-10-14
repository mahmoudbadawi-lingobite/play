import { useEffect, useRef, useState } from 'react';
import type { Gender, Look } from './catalog';
import { createStage, type StageApi, type View } from './stage';

export interface AvatarStageProps {
  gender: Gender;
  look: Look;
  className?: string;
  interactive?: boolean;
  autoRotate?: boolean;
  platform?: boolean;
  sparkles?: boolean;
  view?: View;
  pose?: 'idle' | 'run';
  onApi?: (api: StageApi | null) => void;
  onError?: () => void;
}

/** Live 3D character (three.js). Load it through AvatarStageView so the 3D chunk stays lazy. */
export default function AvatarStage({ gender, look, className, interactive = true, autoRotate = true, platform = true, sparkles = true, view = 'full', pose = 'idle', onApi, onError }: AvatarStageProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<StageApi | null>(null);
  const latest = useRef({ gender, look, view, pose });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    latest.current = { gender, look, view, pose };
  });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let api: StageApi;
    try {
      api = createStage(mount, { platform, interactive, autoRotate, sparkles, view: latest.current.view, pose: latest.current.pose });
    } catch {
      setFailed(true);
      onError?.();
      return;
    }
    apiRef.current = api;
    api.setLook(latest.current.gender, latest.current.look);
    onApi?.(api);
    return () => {
      onApi?.(null);
      api.dispose();
      apiRef.current = null;
    };
    // The stage is created once; look / view / pose are pushed in by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, interactive, autoRotate, sparkles]);

  useEffect(() => {
    apiRef.current?.setLook(gender, look);
  }, [gender, look]);
  useEffect(() => {
    apiRef.current?.setView(view);
  }, [view]);
  useEffect(() => {
    apiRef.current?.setPose(pose);
  }, [pose]);

  if (failed) return null;
  return <div ref={mountRef} className={className} role="img" aria-label="Your 3D character" />;
}
