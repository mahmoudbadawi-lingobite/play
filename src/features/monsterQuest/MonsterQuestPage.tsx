import { useEffect, useRef, useState } from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MqProvider, useMq } from './context';
import { MqLogo } from './art/Logo';
import { Arena } from './screens/Arena';
import { Quests } from './screens/Quests';
import { Wardrobe } from './screens/Wardrobe';
import { Dashboard } from './screens/Dashboard';
import { Explore } from './screens/Explore';
import { Collection } from './screens/Collection';
import { Inventory, Shop } from './screens/Shop';
import { Encyclopedia } from './screens/Encyclopedia';
import { Leaderboard } from './screens/Leaderboard';
import { Profile } from './screens/Profile';
import { QuestionBank } from './screens/QuestionBank';
import { fmt } from './ui';
import { useShellFullscreen } from './fullscreen';
import { sfx } from './sound';
import './monsterQuest.css';

const NEVER_ASK_KEY = 'mq-fullscreen-never-ask';
let askedThisVisit = false;

/** Pop-up shown when the player starts the game: full screen gives a bigger playground, and every tab stays on screen in it. */
function FullscreenPrompt({ onEnter, onClose }: { onEnter: () => void; onClose: (never: boolean) => void }) {
  const [never, setNever] = useState(false);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(never); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [never, onClose]);
  return (
    <div className="mq-modal-bg" role="dialog" aria-modal="true" aria-labelledby="mq-fs-title" onClick={() => onClose(never)}>
      <div className="mq-modal text-center" onClick={(e) => e.stopPropagation()} style={{ color: '#10285a' }}>
        <p className="text-5xl" aria-hidden>⛶</p>
        <h2 id="mq-fs-title" className="mt-1 font-display text-2xl font-extrabold">Play in full screen!</h2>
        <p className="mt-2 text-sm font-bold opacity-80">For a better experience, play Monster Quest in full screen. A bigger playground, and all the tabs (Arena, Monsters, Shop…) stay one tap away.</p>
        <button type="button" className="mq-btn mq-btn-gold mt-4 w-full text-lg" autoFocus onClick={() => { sfx.click(); onEnter(); }}>⛶ Enter full screen</button>
        <button type="button" className="mq-btn mq-btn-blue mt-2 w-full" onClick={() => onClose(never)}>Not now</button>
        <label className="mt-3 flex items-center justify-center gap-2 text-xs font-bold opacity-70"><input type="checkbox" checked={never} onChange={(e) => setNever(e.target.checked)} /> Don't ask me again</label>
      </div>
    </div>
  );
}

function Shell() {
  const mq = useMq();
  const root = useRef<HTMLDivElement>(null);
  const fs = useShellFullscreen(root);
  const [ask, setAsk] = useState(false);
  // Offer full screen once per visit, a moment after the game opens (not on iPhone Safari, which cannot do it, and not when installed as an app).
  useEffect(() => {
    if (askedThisVisit || !fs.supported) return;
    let never = false; try { never = localStorage.getItem(NEVER_ASK_KEY) === '1'; } catch { /* storage blocked */ }
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || window.matchMedia?.('(display-mode: fullscreen)').matches;
    if (never || standalone) { askedThisVisit = true; return; }
    const t = window.setTimeout(() => { if (!askedThisVisit) { askedThisVisit = true; setAsk(true); } }, 700);
    return () => window.clearTimeout(t);
  }, [fs.supported]);
  const closeAsk = (never: boolean) => { if (never) { try { localStorage.setItem(NEVER_ASK_KEY, '1'); } catch { /* storage blocked */ } } setAsk(false); };
  const nav = [
    { to: '', icon: '🏠', label: 'Home', end: true }, { to: 'explore', icon: '🗺️', label: 'Explore' }, { to: 'monsters', icon: '🐾', label: 'Monsters' }, { to: 'arena', icon: '⚔️', label: 'Arena' }, { to: 'quests', icon: '📜', label: 'Quests' }, { to: 'style', icon: '👕', label: 'Style' },
    { to: 'dex', icon: '📖', label: 'Dex' }, { to: 'inventory', icon: '🎒', label: 'Bag' }, { to: 'shop', icon: '🛍️', label: 'Shop' },
    { to: 'leaderboard', icon: '🏆', label: 'Ranks' }, { to: 'profile', icon: '👤', label: 'Profile' },
    ...(mq.isStaff ? [{ to: 'questions', icon: '📝', label: 'Questions' }] : []),
  ];
  return (
    <div ref={root} className={`mq-root ${fs.isFs ? 'is-fs' : ''}`}>
      <div className="mq-shell mx-auto max-w-6xl px-3 pb-24 pt-3 sm:px-5">
        <header className="mq-shell-head mb-3 flex items-center justify-between gap-3">
          <NavLink to="/monster-quest"><MqLogo /></NavLink>
          <div className="flex items-center gap-2 text-sm font-extrabold text-white">
            <span className="mq-pill">🪙 {fmt(mq.state.coins)}</span><span className="mq-pill">💎 {fmt(mq.state.gems)}</span><span className="mq-pill">Lv {mq.state.level}</span>
            {fs.supported && <button type="button" className="mq-pill mq-fs-btn" onClick={() => { sfx.click(); fs.toggle(); }} aria-pressed={fs.isFs} title={fs.isFs ? 'Exit full screen' : 'Play in full screen'}>{fs.isFs ? '✕ Exit' : '⛶ Full screen'}</button>}
          </div>
        </header>
        <div className="mq-shell-grid md:grid md:grid-cols-[150px_1fr] md:gap-4">
          <nav className="mq-nav" aria-label="Monster Quest">
            {fs.isFs && <button type="button" className="mq-nav-item mq-nav-exit" onClick={() => { sfx.click(); fs.exit(); }} title="Exit full screen"><span className="text-xl">✕</span><span>Exit</span></button>}
            {nav.map((n) => <NavLink key={n.label} to={n.to ? `/monster-quest/${n.to}` : '/monster-quest'} end={n.end} className={({ isActive }) => `mq-nav-item ${isActive ? 'is-active' : ''}`}><span className="text-xl">{n.icon}</span><span>{n.label}</span></NavLink>)}
          </nav>
          <main className="mq-shell-main min-w-0">
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="explore" element={<Explore />} />
              <Route path="monsters" element={<Collection />} />
              <Route path="arena" element={<Arena />} />
              <Route path="quests" element={<Quests />} />
              <Route path="style" element={<Wardrobe />} />
              <Route path="dex" element={<Encyclopedia />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="shop" element={<Shop />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="questions" element={mq.isStaff ? <QuestionBank /> : <Navigate to="/monster-quest" replace />} />
              <Route path="*" element={<Navigate to="/monster-quest" replace />} />
            </Routes>
          </main>
        </div>
      </div>
      {ask && !fs.isFs && <FullscreenPrompt onEnter={() => { fs.enter(); setAsk(false); }} onClose={closeAsk} />}
    </div>
  );
}

export function MonsterQuestPage() {
  const { profile, loading, signInWithGoogle } = useAuth();
  if (loading) return <p className="p-10 text-center text-muted-foreground">Loading…</p>;
  if (!profile) {
    return (
      <div className="mq-root"><div className="mx-auto max-w-md px-4 py-16 text-center">
        <MqLogo className="mb-4" />
        <p className="font-bold text-white">Monster Quest saves your monsters, coins and progress to your account, so you need to sign in to play.</p>
        <button onClick={signInWithGoogle} className="mq-btn mq-btn-gold mt-5">Sign in to play</button>
      </div></div>
    );
  }
  return <MqProvider><Shell /></MqProvider>;
}
export default MonsterQuestPage;
