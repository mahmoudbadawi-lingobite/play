import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainerDataUrl } from '../art/Trainer';
import { Orb } from '../art/Orb';
import { useMq } from '../context';
import { sfx } from '../sound';
import * as api from '../api';
import { EncounterModal } from '../EncounterModal';
import type { Encounter } from '../types';
import { WorldEngine, type Dialog, type HudInfo } from './engine';
import { Joystick } from './Joystick';
import { currentQuest, loadProgress, saveProgress, type Progress } from './progress';
import { world as worldDef } from './worlds';
import './monsterAnimations.css';
import './world.css';

const reducedPref = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function WorldView({ worldId, onLeave }: { worldId: number; onLeave: () => void }) {
  const mq = useMq(), nav = useNavigate(), w = worldDef(worldId);
  const host = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), mini = useRef<HTMLCanvasElement>(null), full = useRef<HTMLCanvasElement>(null);
  const eng = useRef<WorldEngine | null>(null), progress = useRef<Progress>(loadProgress(mq.userId));
  const [hud, setHud] = useState<HudInfo | null>(null), [dialog, setDialog] = useState<Dialog | null>(null), [toast, setToast] = useState<string | null>(null);
  const [encounter, setEncounter] = useState<Encounter | null>(null), [showMap, setShowMap] = useState(false), [calm, setCalm] = useState(progress.current.calm || reducedPref());
  const [hint, setHint] = useState(!progress.current.seenTutorial), [loading, setLoading] = useState(true), [fs, setFs] = useState(false);
  const dialogLine = useRef(0), [, force] = useState(0);
  const encResolve = useRef<(() => void) | null>(null);
  const showToast = useCallback((m: string) => { setToast(m); window.setTimeout(() => setToast((t) => (t === m ? null : t)), 3200); }, []);
  const paused = !!encounter || !!dialog || showMap;

  // engine lifecycle
  useEffect(() => {
    if (!host.current || !canvas.current) return;
    const e = new WorldEngine({
      canvas: canvas.current, host: host.current, mini: mini.current, spriteBase: `${import.meta.env.BASE_URL}monster-quest/sprites/`, progress: progress.current, reduced: calm,
      frames: (f, s) => trainerDataUrl({ facing: f, step: s }, 96, mq.look),
      cb: {
        onHud: setHud, onDialog: (d) => { dialogLine.current = 0; setDialog(d); }, onShop: () => nav('/monster-quest/shop'), onExitWorld: onLeave, onToast: showToast,
        onProgress: (p) => saveProgress(mq.userId, p), onLoading: setLoading,
        // Same server call and same modal as before. Only the zone id is mapped (see LocationDef.serverZone).
        onEncounter: async (serverZone) => { const enc = await api.startEncounter(serverZone); setEncounter(enc); },
      },
    });
    eng.current = e; void e.load(worldDef(worldId).locations[0], 'south');
    return () => { e.destroy(); eng.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldId]);
  useEffect(() => { eng.current?.setPaused(paused); }, [paused]);
  useEffect(() => { eng.current?.setReduced(calm); progress.current.calm = calm; saveProgress(mq.userId, progress.current); }, [calm, mq.userId]);
  useEffect(() => { if (showMap) requestAnimationFrame(() => full.current && eng.current?.drawFullMap(full.current)); }, [showMap]);
  useEffect(() => { if (!hint) return; const t = window.setTimeout(() => { setHint(false); progress.current.seenTutorial = true; saveProgress(mq.userId, progress.current); }, 9000); return () => clearTimeout(t); }, [hint, mq.userId]);
  useEffect(() => { const f = () => setFs(!!document.fullscreenElement); document.addEventListener('fullscreenchange', f); return () => document.removeEventListener('fullscreenchange', f); }, []);

  const flags = useMemo(() => new Set(hud?.flags ?? []), [hud?.flags]);
  const quest = currentQuest(flags);
  const orbs = Object.values(mq.state.inventory).reduce((a, b) => a + b, 0);
  const closeDialog = () => { const d = dialog; if (d && dialogLine.current < d.lines.length - 1) { dialogLine.current++; force((n) => n + 1); } else setDialog(null); };
  const verb = hud?.prompt ? ({ shop: 'Shop', sign: 'Read', npc: 'Talk', chest: 'Open', stone: 'Use', mystery: 'Look', lore: 'Read', lookout: 'Look' } as Record<string, string>)[hud.prompt.kind] ?? 'Use' : 'Interact';
  const toggleFs = () => { const el = host.current?.parentElement; if (!document.fullscreenElement) void el?.requestFullscreen?.(); else void document.exitFullscreen?.(); };

  return (
    <div className={`mq-world ${fs ? 'mq-world-fs' : ''}`}>
      <div ref={host} className="mq-world-host">
        <canvas ref={canvas} className="mq-world-canvas" aria-label={`${hud?.loc?.name ?? w.name} game world`} />

        {/* top left: portrait, bars, location */}
        <div className="mq-hud-tl">
          <div className="mq-portrait" aria-hidden><img src={trainerDataUrl({ facing: 'down', step: 0 }, 96, mq.look)} alt="" /></div>
          <div className="mq-bars">
            <div className="mq-bar"><b>HP</b><span><i style={{ width: '100%', background: '#ef4444' }} /></span></div>
            <div className="mq-bar"><b>MP</b><span><i style={{ width: '100%', background: '#3b82f6' }} /></span></div>
          </div>
        </div>
        {/* top right: currencies, quest */}
        <div className="mq-hud-tr">
          <div className="mq-chips"><span className="mq-chip"><Orb size={18} /> {orbs}</span><span className="mq-chip">🪙 {mq.state.coins}</span></div>
          <div className="mq-quest" role="status"><span className="mq-quest-q">?</span><div><small>Quest</small><p>{quest}</p></div></div>
        </div>
        <div className="mq-hud-loc" aria-live="polite"><button className="mq-back" onClick={onLeave} aria-label="Back to world map">← Worlds</button><span>{hud?.loc?.name ?? w.name}</span>{hud?.zoneLabel && <em>🌿 {hud.zoneLabel}</em>}</div>
        <div className="mq-hud-tools">
          <button className={`mq-tool ${calm ? 'on' : ''}`} onClick={() => setCalm(!calm)} aria-pressed={calm} title="Calm mode: stops ambient motion and animations">🌙</button>
          <button className="mq-tool" onClick={toggleFs} aria-label="Toggle full screen">⛶</button>
        </div>

        {hint && <div className="mq-hint" onClick={() => setHint(false)}>Arrow keys / WASD or the joystick to walk · tap the ground to walk there · <b>E</b> to interact</div>}
        {toast && <div className="mq-toast" role="alert">{toast}</div>}
        {loading && <div className="mq-loading">Painting the world…</div>}

        {/* bottom: joystick + action buttons + minimap */}
        <Joystick onMove={(x, y) => eng.current?.setJoystick(x, y)} />
        <div className="mq-actions">
          <button className="mq-act mq-act-battle" disabled={!hud?.canBattle || paused} onClick={() => eng.current?.search()}><span>⚔️</span>Battle</button>
          <button className={`mq-act mq-act-int ${hud?.prompt ? 'ready' : ''}`} disabled={!hud?.prompt || paused} onClick={() => { sfx.click(); eng.current?.interact(); }}><span>👆</span>{verb}</button>
          <button className="mq-act mq-act-bag" onClick={() => nav('/monster-quest/inventory')}><span>🎒</span>Bag</button>
        </div>
        <button className="mq-minimap" onClick={() => setShowMap(true)} aria-label="Open map"><canvas ref={mini} width={132} height={132} /></button>
        {hud?.prompt && !paused && <div className="mq-prompt">{verb}: {hud.prompt.name} <kbd>E</kbd></div>}

        {dialog && (
          <div className="mq-dialog" onClick={closeDialog}>
            <div className="mq-dialog-name">{dialog.name}</div>
            <p>{dialog.lines[dialogLine.current]}</p>
            <button className="mq-dialog-next" autoFocus>{dialogLine.current < dialog.lines.length - 1 ? 'Next ▸' : 'Close'}</button>
          </div>
        )}
        {showMap && (
          <div className="mq-fullmap" onClick={() => setShowMap(false)} role="dialog" aria-label="Map">
            <div><canvas ref={full} width={640} height={480} /><p>{hud?.loc?.name} · tap to close</p></div>
          </div>
        )}
      </div>
      {encounter && <EncounterModal encounter={encounter} onClose={(goTo) => { setEncounter(null); encResolve.current?.(); if (goTo === 'monsters') nav('/monster-quest/monsters'); }} />}
    </div>
  );
}
