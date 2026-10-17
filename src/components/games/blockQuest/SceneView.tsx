import { lazy, Suspense, useState } from 'react';
import type { Figure } from '../../../features/avatar/Avatar2D';
import { webglAvailable } from '../../../features/avatar/webgl';
import type { RunnerState } from '../../../features/world3d/runner';
import type { Gate, Phase } from './engine';
import { S_FAR, S_NEAR, Scene } from './Scene';
import { getWorld } from './worlds';

const RunnerView = lazy(() => import('../../../features/world3d/RunnerView'));

export interface SceneViewProps {
  worldId: string;
  figure: Figure;
  phase: Phase;
  gate: Gate | null;
  gateKey: string;
  s: number;
  scroll: number;
  pass: number;
  lane: number;
  wrongIds: string[];
  glowLane: number | null;
  placed: number;
  bonkKey: number;
  label: string;
  onCoin: () => void;
  onPickLane?: (lane: number) => void;
}

/**
 * The play area. Uses the 3D world when the browser supports WebGL and falls back to the
 * flat 2D scene otherwise. Rules and timing live in BlockQuestGame; this only draws.
 */
export function SceneView(p: SceneViewProps) {
  const [failed, setFailed] = useState(false);
  const use3d = webglAvailable() && !failed;
  if (!use3d) {
    return (
      <Scene
        world={getWorld(p.worldId)}
        gate={p.gate}
        phase={p.phase}
        s={p.s}
        scroll={p.scroll}
        pass={p.pass}
        lane={p.lane}
        wrongIds={p.wrongIds}
        glowLane={p.glowLane}
        placed={p.placed}
        look={p.figure}
        bonkKey={p.bonkKey}
        label={p.label}
        onPickLane={p.onPickLane}
      />
    );
  }
  const state: RunnerState = {
    worldId: p.worldId,
    gender: p.figure.gender,
    look: p.figure.look,
    phase: p.phase,
    s: p.s,
    sFar: S_FAR,
    sNear: S_NEAR,
    pass: p.pass,
    lane: p.lane,
    gate: p.gate,
    gateKey: p.gateKey,
    wrongIds: p.wrongIds,
    glowLane: p.glowLane,
    placed: p.placed,
    bonkKey: p.bonkKey,
  };
  return (
    <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-sky-300 to-sky-100 font-extrabold text-primary">Loading…</div>}>
      <RunnerView state={state} onCoin={p.onCoin} onError={() => setFailed(true)} className="absolute inset-0" />
    </Suspense>
  );
}

export const is3D = () => webglAvailable();
