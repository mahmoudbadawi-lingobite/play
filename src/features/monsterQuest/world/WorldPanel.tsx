import { useEffect, useRef } from 'react';
import { useMq } from '../context';
import { Arena } from '../screens/Arena';
import { Collection } from '../screens/Collection';
import { Dashboard } from '../screens/Dashboard';
import { Encyclopedia } from '../screens/Encyclopedia';
import { Leaderboard } from '../screens/Leaderboard';
import { Profile } from '../screens/Profile';
import { QuestionBank } from '../screens/QuestionBank';
import { TeacherProgress } from '../screens/TeacherProgress';
import { Quests } from '../screens/Quests';
import { Inventory, Shop } from '../screens/Shop';
import { Wardrobe } from '../screens/Wardrobe';
import { fmt } from '../ui';
import { sfx } from '../sound';
import { panelBridge } from './panelBridge';

/** Pages of the Monster Quest side menu (the ids are the route names). */
export type PanelTab = 'home' | 'monsters' | 'arena' | 'quests' | 'style' | 'dex' | 'inventory' | 'shop' | 'leaderboard' | 'profile' | 'progress' | 'questions';
const TAB_IDS = new Set<string>(['home', 'monsters', 'arena', 'quests', 'style', 'dex', 'inventory', 'shop', 'leaderboard', 'profile', 'progress', 'questions']);

/**
 * Any Monster Quest page shown on top of the paused world (for example the shop, or the bag), so full screen is never left. It has no menu
 * of its own: the main icon column on the left drives it (see panelBridge), "Explore", "Back to game" or Esc return to the exact same spot,
 * and links inside the pages (for example a button that points to Style) switch pages here instead of leaving the game.
 */
export function WorldPanel({ tab, onTab, onClose }: { tab: PanelTab; onTab: (t: PanelTab) => void; onClose: () => void }) {
  const mq = useMq();
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  const go = (id: string) => { sfx.click(); if (id === 'explore') onClose(); else if (TAB_IDS.has(id)) onTab(id as PanelTab); };
  // the left-hand menu of the page switches this panel while it is open
  const goRef = useRef(go);
  useEffect(() => { goRef.current = go; });
  useEffect(() => { panelBridge.set({ tab, go: (id) => goRef.current(id) }); return () => panelBridge.set(null); }, [tab]);
  // a Link in a page would navigate away from the game: turn it into a tab change
  const onLink = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null; if (!a) return;
    const m = a.getAttribute('href')?.match(/monster-quest\/?([a-z]*)\/?$/); if (!m) return;
    e.preventDefault(); e.stopPropagation(); go(m[1] === '' ? 'home' : m[1]);
  };
  return (
    <div className="mq-wpanel mq-root" role="dialog" aria-label="Game menu">
      <div className="mq-wpanel-top">
        <button className="mq-wpanel-back" onClick={() => go('explore')}>← Back to game</button>
        <span className="mq-wpanel-coins">🪙 {fmt(mq.state.coins)} · 💎 {fmt(mq.state.gems)} · Lv {mq.state.level}</span>
      </div>
      <div className="mq-wpanel-body" onClickCapture={onLink}>
        <div className="mx-auto max-w-5xl">
          {tab === 'home' && <Dashboard />}
          {tab === 'monsters' && <Collection />}
          {tab === 'arena' && <Arena />}
          {tab === 'quests' && <Quests />}
          {tab === 'style' && <Wardrobe />}
          {tab === 'dex' && <Encyclopedia />}
          {tab === 'inventory' && <Inventory />}
          {tab === 'shop' && <Shop onStyle={() => onTab('style')} />}
          {tab === 'leaderboard' && <Leaderboard />}
          {tab === 'profile' && <Profile />}
          {tab === 'progress' && mq.isStaff && <TeacherProgress />}
          {tab === 'questions' && mq.isStaff && <QuestionBank />}
        </div>
      </div>
    </div>
  );
}
