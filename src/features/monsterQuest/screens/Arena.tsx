import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { levelInfo } from '../../avatar/level';
import * as api from '../api';
import { MonsterArt } from '../art/MonsterArt';
import { useMq } from '../context';
import { QuestionView, formatCorrectAnswer } from '../QuestionView';
import { sfx } from '../sound';
import { ArenaStage } from '../scene/ArenaStage';
import { STAND, isFlying } from '../scene/arenas';
import { banner, ui, zoneBanner } from '../uiAssets';
import { Bar, ConfirmDialog, GameButton, Panel, TypeBadge } from '../ui';
import type { BEvent, BMon, Battle, Species } from '../types';

import { tr } from '../../../i18n/tr';
const DIFFS = [
  { k: 'easy', label: 'Easy', sub: '1 opponent, a bit weaker', stars: 1 },
  { k: 'normal', label: 'Normal', sub: '2 opponents, same level', stars: 2 },
  { k: 'hard', label: 'Hard', sub: '3 opponents, stronger, big rewards', stars: 3 },
] as const;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Arena() {
  const mq = useMq();
  const level = levelInfo(mq.state.xp).level;
  const team = mq.monsters.filter((m) => m.team_slot).sort((a, b) => a.team_slot! - b.team_slot!);
  const [zone, setZone] = useState(mq.zones[0]?.id ?? 'forest');
  const [diff, setDiff] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [battle, setBattle] = useState<Battle | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.activeBattleId(mq.userId).then(setResumeId).catch(() => undefined); }, [mq.userId, battle]);

  const guard = async (fn: () => Promise<void>) => { setBusy(true); setErr(null); try { await fn(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); } };
  const start = () => guard(async () => { setBattle(await api.battleStart(zone, diff)); });
  const resume = () => guard(async () => { if (resumeId) setBattle(await api.battleState(resumeId)); });

  if (battle) return <BattleScene key={battle.id} initial={battle} onExit={() => { setBattle(null); void mq.refresh().catch(() => undefined); }} onRematch={start} />;

  return (
    <div className="mq-menu space-y-4">
      <div className="mq-menu-info">
        <img className="mq-menu-info-ico" src={ui('swords')} alt="" draggable={false} />
        <div>
          <p className="font-display text-lg font-extrabold leading-tight text-white">{tr('Battle Arena')}</p>
          <p className="text-sm font-semibold text-white/85">Turn-based battles against computer trainers. Use your battle team, mix attacks with <b>{tr('quiz-powered special moves')}</b>, and win coins, XP and monster experience. Online player-vs-player battles come in Phase 3.</p>
        </div>
      </div>
      {team.length === 0 ? (
        <Panel><p className="font-bold text-white">{tr('You need at least one monster on your battle team.')}</p><Link to="/monster-quest/monsters"><GameButton tone="gold" className="mt-2">{tr('Go to My Monsters')}</GameButton></Link></Panel>
      ) : (
        <MenuPanel icon="team" title={tr('Your team')}>
          <div className="mq-team">{team.map((m) => { const sp = mq.speciesById.get(m.species_id)!; return (
            <div key={m.id} className="mq-team-chip">
              <div className="mq-team-stage"><img className="mq-team-plat" src={ui('platform-normal')} alt="" draggable={false} /><span className="mq-team-mon"><MonsterArt spec={sp.art} spriteUrl={sp.sprite_url} size={84} anim="none" /></span></div>
              <span className="mq-team-name">{sp.name} Lv{m.level}</span>
            </div>); })}</div>
        </MenuPanel>
      )}
      <MenuPanel icon="pin" title={tr('Arena')}>
        <div className="mq-zone-grid">
          {mq.zones.map((z) => { const locked = level < z.unlock_level; return (
            <button key={z.id} type="button" disabled={locked} onClick={() => setZone(z.id)} aria-pressed={zone === z.id} className={`mq-card-banner ${zone === z.id ? 'is-sel' : ''} ${locked ? 'is-locked' : ''}`} style={{ backgroundImage: `url(${zoneBanner(z.id)})` }}>
              <span className="mq-card-title">{z.name}</span>
              <span className="mq-card-sub">{locked ? <><img src={ui('lock')} alt="" draggable={false} /> Level {z.unlock_level}</> : 'Opponents from this world'}</span>
            </button>); })}
        </div>
      </MenuPanel>
      <MenuPanel icon="trophy" title={tr('Difficulty')}>
        <div className="mq-diff-grid">
          {DIFFS.map((d) => (
            <button key={d.k} type="button" onClick={() => setDiff(d.k)} aria-pressed={diff === d.k} className={`mq-card-banner ${diff === d.k ? 'is-sel' : ''}`} style={{ backgroundImage: `url(${banner(d.k)})` }}>
              <span className="mq-card-title"><span className="mq-stars">{Array.from({ length: d.stars }, (_, i) => <img key={i} src={ui('star')} alt="" draggable={false} />)}</span>{d.label}</span>
              <span className="mq-card-sub">{d.sub}</span>
            </button>))}
        </div>
        {err && <p className="mt-3 rounded-xl bg-red-500/90 px-3 py-2 text-sm font-bold text-white" role="alert">{err}</p>}
        <div className="mq-menu-actions">
          <GameButton tone="gold" disabled={busy || team.length === 0} onClick={start}><img className="mq-btn-ico" src={ui('sword')} alt="" draggable={false} />{tr('Start battle')}</GameButton>
          {resumeId && <GameButton tone="blue" disabled={busy} onClick={resume}><img className="mq-btn-ico" src={ui('play')} alt="" draggable={false} />{tr('Resume unfinished battle')}</GameButton>}
        </div>
      </MenuPanel>
    </div>
  );
}

/** A glowing blue panel with a little title tab (icon + text) on its top edge. */
function MenuPanel({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <section className="mq-menu-panel">
      <h3 className="mq-menu-tab"><img src={ui(icon)} alt="" draggable={false} />{title}</h3>
      {children}
    </section>
  );
}

/**
 * One monster on the battlefield. Both fighters stand on the same ground line and face each other (the left one looks right,
 * the right one looks left). Flying monsters hover above that line, with their shadow left on the ground.
 */
function Fighter({ side, mon, sp, attacking, hit, pops }: { side: 'player' | 'opp'; mon: BMon; sp: Species; attacking: boolean; hit: boolean; pops: ReactNode }) {
  const flying = isFlying(sp.id, sp.sprite_url);
  const style = { '--ms': STAND.size, '--dx': STAND.dx, '--gy': STAND.ground, '--fly': STAND.fly, '--lunge': STAND.lunge } as CSSProperties;
  return (
    <div className={`mq-fighter mq-fighter-${side} ${flying ? 'is-flying' : ''} ${mon.fainted ? 'is-gone' : ''}`} style={style}>
      <span className="mq-fighter-shadow" />
      <div className="mq-fighter-lift">
        <div className={`mq-fighter-body ${attacking ? 'is-attacking' : ''} ${hit ? 'is-hit' : ''} ${mon.fainted ? 'is-fainted' : ''}`}>
          <MonsterArt spec={sp.art} spriteUrl={sp.sprite_url} size={200} anim="none" face={side === 'player' ? 'right' : 'left'} />
          <div className="mq-pops">{pops}</div>
        </div>
      </div>
    </div>
  );
}

interface Shown { player: BMon[]; opp: BMon[]; pa: number; oa: number }
const fromBattle = (b: Battle): Shown => ({ player: b.player, opp: b.opp, pa: b.p_active, oa: b.o_active });
type Fx = { attacker: 'player' | 'opp' | null; hit: 'player' | 'opp' | null };

export function BattleScene({ initial, onExit, onRematch }: { initial: Battle; onExit: () => void; onRematch: () => void }) {
  const mq = useMq();
  const [battle, setBattle] = useState<Battle>(initial);
  const [shown, setShown] = useState<Shown>(fromBattle(initial));
  const [fx, setFx] = useState<Fx>({ attacker: null, hit: null });
  const [log, setLog] = useState(`${initial.opp_name} wants to battle!`);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [menu, setMenu] = useState<'main' | 'switch' | 'item'>('main');
  const [pops, setPops] = useState<{ id: number; side: 'player' | 'opp'; text: string; tone: string }[]>([]);
  const [quizNote, setQuizNote] = useState<BEvent | null>(null);
  const [final, setFinal] = useState(false);
  const pid = useRef(0);
  const xpBefore = useRef(mq.state.xp).current;

  const pm = shown.player[shown.pa], om = shown.opp[shown.oa];
  const psp = pm && mq.speciesById.get(pm.species_id), osp = om && mq.speciesById.get(om.species_id);
  const potions = useMemo(() => mq.items.filter((i) => i.kind === 'potion' && (mq.state.inventory[i.key] ?? 0) > 0), [mq.items, mq.state.inventory]);

  const pop = (side: 'player' | 'opp', text: string, tone: string) => {
    const id = ++pid.current; setPops((p) => [...p, { id, side, text, tone }]);
    window.setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 1300);
  };
  const setHp = (side: 'player' | 'opp', idx: number, hp: number, fainted?: boolean) =>
    setShown((s) => { const arr = (side === 'player' ? s.player : s.opp).map((m, i) => (i === idx ? { ...m, hp, fainted: fainted ?? m.fainted } : m)); return side === 'player' ? { ...s, player: arr } : { ...s, opp: arr }; });

  const play = async (events: BEvent[]) => {
    for (const e of events) {
      setLog(e.text);
      if (e.kind === 'quiz') { setQuizNote(e); if (e.correct) sfx.correct(); else sfx.wrong(); await wait(1400); setQuizNote(null); continue; }
      if (e.kind === 'attack' || e.kind === 'special') {
        setFx({ attacker: e.side, hit: null }); sfx.throw(); await wait(380);
        setFx({ attacker: null, hit: e.target ?? null }); sfx.wobble();
        if (e.target != null && e.idx != null && e.hp_after != null) setHp(e.target, e.idx, e.hp_after);
        pop(e.target ?? 'opp', `-${e.dmg}${e.crit ? '!' : ''}`, e.eff === 'super' ? '#fb923c' : e.eff === 'weak' ? '#93c5fd' : '#fff');
        if (e.crit) setLog(`${e.text} A critical hit!`); else if (e.eff === 'super') setLog(`${e.text} It's super effective!`); else if (e.eff === 'weak') setLog(`${e.text} It's not very effective…`);
        await wait(750); setFx({ attacker: null, hit: null });
      } else if (e.kind === 'faint') {
        if (e.target && e.idx != null) setHp(e.target, e.idx, 0, true);
        sfx.escape(); await wait(900);
      } else if (e.kind === 'info' || e.kind === 'switch') {
        if (e.target && e.idx != null) setShown((s) => (e.target === 'player' ? { ...s, pa: e.idx! } : { ...s, oa: e.idx! }));
        sfx.encounter(); await wait(800);
      } else if (e.kind === 'item') {
        if (e.target && e.idx != null && e.hp_after != null) setHp(e.target, e.idx, e.hp_after);
        pop('player', `+${e.heal}`, '#86efac'); sfx.coin(); await wait(800);
      } else await wait(700);
    }
  };

  const act = async (action: string, arg?: string, answer?: unknown) => {
    setBusy(true); setErr(null); setMenu('main');
    try {
      const nb = await api.battleAct(battle.id, action, arg, answer);
      if (action === 'special' || action === 'cancel') { setBattle(nb); return; }
      if (action === 'item' && arg) mq.setState({ ...mq.state, inventory: { ...mq.state.inventory, [arg]: Math.max(0, (mq.state.inventory[arg] ?? 0) - 1) } });
      setBattle((b) => ({ ...b, pending: null }));
      await play(nb.events);
      setBattle(nb); setShown(fromBattle(nb));
      if (nb.status !== 'active') {
        if (nb.result) mq.setState({ ...mq.state, xp: mq.state.xp + nb.result.xp, coins: mq.state.coins + nb.result.coins, battles_won: mq.state.battles_won + (nb.result.won ? 1 : 0) });
        if (nb.result?.won) sfx.capture(); else sfx.escape();
        setFinal(true);
      } else setLog('What will you do?');
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  const [askGiveUp, setAskGiveUp] = useState(false);
  const forfeit = async () => { setAskGiveUp(false); setBusy(true); try { await api.battleForfeit(battle.id); onExit(); } catch (e) { setErr((e as Error).message); setBusy(false); } };

  const hpBar = (m: BMon) => <Bar pct={(m.hp / m.max) * 100} color={m.hp / m.max > 0.5 ? '#22c55e' : m.hp / m.max > 0.2 ? '#facc15' : '#ef4444'} label={`${m.name} HP`} height={10} />;
  const dots = (arr: BMon[]) => <span className="flex gap-1">{arr.map((m, i) => <span key={i} className={`h-2.5 w-2.5 rounded-full ${m.fainted ? 'bg-red-500' : 'bg-green-400'}`} />)}</span>;
  const popsFor = (side: 'player' | 'opp') => pops.filter((p) => p.side === side).map((p) => <span key={p.id} className="mq-float" style={{ color: p.tone }}>{p.text}</span>);
  const pending = battle.status === 'active' ? battle.pending : null;
  const lvlAfter = levelInfo(mq.state.xp).level;

  return (
    <div className="mq-arena mq-battle" role="region" aria-label={tr('Battle')}>
      <div className="mq-view">
      <ArenaStage zone={battle.zone_id}>
        {om && osp && <Fighter side="opp" mon={om} sp={osp} attacking={fx.attacker === 'opp'} hit={fx.hit === 'opp'} pops={popsFor('opp')} />}
        {pm && psp && <Fighter side="player" mon={pm} sp={psp} attacking={fx.attacker === 'player'} hit={fx.hit === 'player'} pops={popsFor('player')} />}
      </ArenaStage>

        <div className="mq-hud-head">
          <div className="mq-hud-row">
            <span className="mq-hud-pill">⚔️ vs {battle.opp_name} · {battle.difficulty}</span>
            {battle.status === 'active' && <button type="button" onClick={() => setAskGiveUp(true)} disabled={busy} className="mq-hud-pill mq-hud-give">🏳️ Give up</button>}
          </div>
          {om && osp && (
            <div className="mq-bplate mq-bplate-opp">
              <div className="flex items-center justify-between gap-2"><span className="mq-bplate-name">{om.name}</span><span className="mq-bplate-lv">Lv {om.level}</span></div>
              <div className="my-1">{hpBar(om)}</div>
              <div className="flex items-center justify-between"><TypeBadge type={om.type} small />{dots(shown.opp)}</div>
            </div>
          )}
        </div>
        {pm && psp && (
          <div className="mq-bplate mq-bplate-player">
            <div className="flex items-center justify-between gap-2"><span className="mq-bplate-name">{pm.name}</span><span className="mq-bplate-lv">Lv {pm.level}</span></div>
            <div className="my-1">{hpBar(pm)}</div>
            <div className="flex items-center justify-between"><span className="text-[11px] font-extrabold text-white">{Math.max(0, pm.hp)}/{pm.max} HP</span>{dots(shown.player)}</div>
          </div>
        )}
      </div>

        <div className="mq-dock">
        <div className="mq-log" aria-live="polite">{log}</div>
        {err && <p className="rounded-xl bg-red-500/90 px-3 py-2 text-sm font-bold text-white" role="alert">{err}</p>}

        {quizNote && (<div className={`mq-card ${quizNote.correct ? 'mq-card-good' : 'mq-card-bad'}`}><p className="font-extrabold">{quizNote.text}</p>{!quizNote.correct && <p className="text-sm font-semibold">Answer: {formatCorrectAnswer('mcq', quizNote.answer)}</p>}{quizNote.explanation && <p className="text-sm">{quizNote.explanation}</p>}</div>)}

        {battle.status === 'active' && !quizNote && (pending ? (
          <div className="mq-dock-panel rounded-2xl bg-[#0b2566]/90 p-3">
            <p className="mb-2 text-center text-sm font-extrabold text-yellow-300">⭐ Answer correctly to supercharge your attack!</p>
            <QuestionView key={pending.id} q={pending} busy={busy} onSubmit={(a) => void act('answer', undefined, a)} />
            <GameButton tone="ghost" className="mt-2 w-full" disabled={busy} onClick={() => void act('cancel')}>{tr('Cancel (choose another move)')}</GameButton>
          </div>
        ) : menu === 'main' ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <GameButton tone="red" className="mq-bbtn" disabled={busy} onClick={() => void act('attack')}>{tr('⚔️ Attack')}</GameButton>
            <GameButton tone="gold" className="mq-bbtn" disabled={busy} onClick={() => void act('special')}>⭐ Special (quiz)</GameButton>
            <GameButton tone="blue" className="mq-bbtn" disabled={busy} onClick={() => void act('defend')}>🛡️ Defend</GameButton>
            <GameButton tone="green" className="mq-bbtn" disabled={busy || shown.player.filter((m) => !m.fainted).length < 2} onClick={() => setMenu('switch')}>🔄 Switch</GameButton>
            <GameButton tone="ghost" className="mq-bbtn" disabled={busy || potions.length === 0} onClick={() => setMenu('item')}>🎒 Item{potions.length === 0 ? ' (none)' : ''}</GameButton>
          </div>
        ) : menu === 'switch' ? (
          <div className="mq-dock-panel rounded-2xl bg-[#0b2566]/90 p-2"><div className="grid gap-2 sm:grid-cols-2">
            {shown.player.map((m, i) => { const sp = mq.speciesById.get(m.species_id)!; return (
              <button key={i} type="button" disabled={m.fainted || i === shown.pa || busy} onClick={() => void act('switch', String(i))} className="flex items-center gap-2 rounded-xl bg-white/10 p-2 text-left text-white disabled:opacity-40">
                <MonsterArt spec={sp.art} spriteUrl={sp.sprite_url} size={44} anim="none" /><span className="flex-1"><span className="block text-sm font-extrabold">{m.name} Lv{m.level}</span><span className="block text-[11px] font-bold opacity-80">{m.fainted ? 'Fainted' : i === shown.pa ? 'In battle' : `${m.hp}/${m.max} HP`}</span></span></button>); })}
          </div><GameButton tone="ghost" className="mt-2 w-full" onClick={() => setMenu('main')}>{tr('Back')}</GameButton></div>
        ) : (
          <div className="mq-dock-panel rounded-2xl bg-[#0b2566]/90 p-2"><div className="grid gap-2 sm:grid-cols-2">
            {potions.map((i) => <button key={i.key} type="button" disabled={busy} onClick={() => void act('item', i.key)} className="rounded-xl bg-white/10 p-2 text-left text-white"><span className="block text-sm font-extrabold">{i.name} x{mq.state.inventory[i.key]}</span><span className="text-[11px] font-bold opacity-80">Heals {i.effect} HP</span></button>)}
          </div><GameButton tone="ghost" className="mt-2 w-full" onClick={() => setMenu('main')}>{tr('Back')}</GameButton></div>
        ))}
        </div>

      {askGiveUp && <ConfirmDialog title={tr('Give up this battle?')} message="You will not earn any rewards." confirmLabel="Give up" cancelLabel="Keep fighting" tone="red" onConfirm={forfeit} onCancel={() => setAskGiveUp(false)} />}
      {final && battle.result && (
        <div className="mq-caught">
          <div className="relative z-10 w-full max-w-md px-4 text-center">
            <p className={`font-display text-4xl font-extrabold drop-shadow ${battle.result.won ? 'text-yellow-300' : 'text-sky-200'}`}>{battle.result.won ? 'Victory! 🏆' : 'Defeated…'}</p>
            <p className="mt-1 font-bold text-white/90">{battle.result.won ? `You beat ${battle.opp_name}!` : `${battle.opp_name} won this time. Train up and try again!`}</p>
            <div className="mq-card mt-3 grid grid-cols-3 text-[#10285a]">
              <div><p className="text-xs font-bold opacity-70">{tr('Coins')}</p><p className="text-lg font-extrabold">+{battle.result.coins} 🪙</p></div>
              <div><p className="text-xs font-bold opacity-70">{tr('Trainer XP')}</p><p className="text-lg font-extrabold">+{battle.result.xp}</p></div>
              <div><p className="text-xs font-bold opacity-70">{tr('Monster XP')}</p><p className="text-lg font-extrabold">+{battle.result.monster_xp}</p></div>
            </div>
            {battle.result.levels.filter((l) => l.levels_gained > 0).map((l) => <p key={l.id} className="mt-2 font-extrabold text-amber-300">⭐ {l.name} reached level {l.level}!</p>)}
            {lvlAfter > levelInfo(xpBefore).level && <p className="mt-2 text-lg font-extrabold text-amber-300">🎉 Trainer level up! You are level {lvlAfter}</p>}
            {battle.result.xp === 0 && battle.result.won && <p className="mt-1 text-xs font-semibold text-white/70">{tr('Daily battle XP limit reached. Coins and monster XP still count.')}</p>}
            <div className="mt-3 grid grid-cols-2 gap-2"><GameButton tone="green" onClick={onRematch}>{tr('Battle again')}</GameButton><GameButton tone="blue" onClick={onExit}>{tr('Back to Arena')}</GameButton></div>
          </div>
        </div>)}
    </div>
  );
}
