import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { levelInfo } from '../../avatar/level';
import * as api from '../api';
import { EncounterModal } from '../EncounterModal';
import { useMq } from '../context';
import { MonsterArt } from '../art/MonsterArt';
import { Orb } from '../art/Orb';
import { ExploreCanvas, type DPad } from '../world/ExploreCanvas';
import { DPadControl } from '../world/DPadControl';
import { TALL, type Tile } from '../world/map';
import { GameButton, Panel } from '../ui';
import type { Encounter, Zone } from '../types';

const ENCOUNTER_CHANCE = 0.2;

export function Explore() {
  const mq = useMq();
  const nav = useNavigate();
  const level = levelInfo(mq.state.xp).level;
  const [zone, setZone] = useState<Zone | null>(null);
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [onGrass, setOnGrass] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showPad, setShowPad] = useState(false);
  const starting = useRef(false);
  const pad = useRef<Set<DPad>>(new Set());
  const zoneRef = useRef<Zone | null>(null); zoneRef.current = zone;
  const encRef = useRef<Encounter | null>(null); encRef.current = encounter;

  const begin = useCallback(async () => {
    const z = zoneRef.current;
    if (!z || starting.current || encRef.current) return;
    starting.current = true; setMsg(null);
    try { const e = await api.startEncounter(z.id); pad.current.clear(); setEncounter(e); }
    catch (err) { setMsg((err as Error).message); }
    finally { starting.current = false; }
  }, []);

  const onStep = useCallback((t: Tile) => {
    const grass = t === TALL; setOnGrass(grass);
    if (grass && Math.random() < ENCOUNTER_CHANCE) void begin();
  }, [begin]);

  const orbs = Object.values(mq.state.inventory).reduce((a, b) => a + b, 0);

  if (!zone) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-white/85">Choose where to explore. Higher zones have rarer monsters and harder questions.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {mq.zones.map((z) => {
            const locked = level < z.unlock_level;
            const here = mq.species.filter((s) => s.zones.includes(z.id));
            return (
              <Panel key={z.id} className={locked ? 'opacity-70' : ''}>
                <div className="flex items-start justify-between gap-2">
                  <div><p className="font-display text-lg font-extrabold text-white">{z.name}</p><p className="text-xs font-semibold text-white/75">{z.description}</p></div>
                  <span className="shrink-0 rounded-full bg-white/15 px-2 py-1 text-[11px] font-extrabold text-white">{'★'.repeat(z.difficulty)}{'☆'.repeat(5 - z.difficulty)}</span>
                </div>
                <div className="mt-2 flex -space-x-2">{here.slice(0, 6).map((s) => <MonsterArt key={s.id} spec={s.art} spriteUrl={s.sprite_url} size={44} anim="none" silhouette={locked} />)}</div>
                <p className="mt-1 text-xs font-bold text-white/70">Monster levels {z.min_level}–{z.max_level}</p>
                <GameButton className="mt-3 w-full" tone={locked ? 'ghost' : 'green'} disabled={locked} onClick={() => setZone(z)}>{locked ? `🔒 Unlocks at trainer level ${z.unlock_level}` : 'Enter'}</GameButton>
              </Panel>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GameButton tone="ghost" onClick={() => setZone(null)}>← Zones</GameButton>
          <GameButton tone={showPad ? 'gold' : 'ghost'} onClick={() => setShowPad(!showPad)} aria-pressed={showPad} className="hidden-touch">🎮 Controller</GameButton>
          <p className="font-display text-lg font-extrabold text-white">{zone.name}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 text-sm font-extrabold text-white"><Orb size={22} /> {orbs} orbs <span className="opacity-60">·</span> 🪙 {mq.state.coins}</div>
      </div>

      <div className="relative h-[58vh] min-h-[340px] overflow-hidden rounded-2xl border-4 border-[#1b4fb3] shadow-lg">
        <ExploreCanvas zoneId={zone.id} palette={zone.palette} paused={!!encounter} pad={pad} onStep={onStep} look={mq.look} />
        <div className="pointer-events-none absolute left-2 top-2 rounded-xl bg-black/35 px-2.5 py-1 text-[11px] font-bold text-white">Walk through the <span className="text-green-300">tall grass</span> to find monsters</div>
        <DPadControl pad={pad} forceShow={showPad} />
        <div className="absolute bottom-3 right-3">
          <GameButton tone={onGrass ? 'gold' : 'ghost'} disabled={!onGrass || !!encounter} onClick={() => void begin()}>🌿 Search the grass</GameButton>
        </div>
      </div>
      {msg && <p className="rounded-xl bg-red-500/90 px-3 py-2 text-center text-sm font-bold text-white" role="alert">{msg}</p>}
      <p className="text-center text-xs font-semibold text-white/70">Move with arrow keys / WASD, the on-screen controller (hold two arrows for diagonals), or tap any tile. {orbs === 0 && <span className="font-extrabold text-yellow-300">You're out of orbs: answer questions to earn coins, then visit the Shop.</span>}</p>
      {encounter && <EncounterModal encounter={encounter} onClose={(goTo) => { setEncounter(null); if (goTo === 'monsters') nav('/monster-quest/monsters'); }} />}
    </div>
  );
}
