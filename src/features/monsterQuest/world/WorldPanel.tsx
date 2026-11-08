import { useEffect } from 'react';
import { useMq } from '../context';
import { Arena } from '../screens/Arena';
import { Collection } from '../screens/Collection';
import { Dashboard } from '../screens/Dashboard';
import { Encyclopedia } from '../screens/Encyclopedia';
import { Leaderboard } from '../screens/Leaderboard';
import { Profile } from '../screens/Profile';
import { QuestionBank } from '../screens/QuestionBank';
import { Quests } from '../screens/Quests';
import { Inventory, Shop } from '../screens/Shop';
import { Wardrobe } from '../screens/Wardrobe';
import { fmt } from '../ui';
import { sfx } from '../sound';

/** Same pages and order as the side menu of Monster Quest (the ids are the route names). */
export type PanelTab = 'home' | 'monsters' | 'arena' | 'quests' | 'style' | 'dex' | 'inventory' | 'shop' | 'leaderboard' | 'profile' | 'questions';
const ITEMS: { id: PanelTab | 'explore'; icon: string; label: string }[] = [
  { id: 'home', icon: '🏠', label: 'Home' }, { id: 'explore', icon: '🗺️', label: 'Explore' }, { id: 'monsters', icon: '🐾', label: 'Monsters' }, { id: 'arena', icon: '⚔️', label: 'Arena' },
  { id: 'quests', icon: '📜', label: 'Quests' }, { id: 'style', icon: '👕', label: 'Style' }, { id: 'dex', icon: '📖', label: 'Dex' }, { id: 'inventory', icon: '🎒', label: 'Bag' },
  { id: 'shop', icon: '🛍️', label: 'Shop' }, { id: 'leaderboard', icon: '🏆', label: 'Ranks' }, { id: 'profile', icon: '👤', label: 'Profile' }, { id: 'questions', icon: '📝', label: 'Questions' },
];
const TAB_IDS = new Set<string>(ITEMS.map((i) => i.id).filter((i) => i !== 'explore'));

/**
 * The whole Monster Quest menu shown on top of the paused world, so full screen is never left. "Explore" (or Esc) goes back to the exact
 * same spot. Links inside the pages (for example a button that points to Style) switch tabs here instead of leaving the game.
 */
export function WorldPanel({ tab, onTab, onClose }: { tab: PanelTab; onTab: (t: PanelTab) => void; onClose: () => void }) {
  const mq = useMq();
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  const go = (id: string) => { sfx.click(); if (id === 'explore') onClose(); else if (TAB_IDS.has(id)) onTab(id as PanelTab); };
  const items = ITEMS.filter((i) => i.id !== 'questions' || mq.isStaff);
  // a Link in a page would navigate away from the game: turn it into a tab change
  const onLink = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null; if (!a) return;
    const m = a.getAttribute('href')?.match(/monster-quest\/?([a-z]*)\/?$/); if (!m) return;
    e.preventDefault(); e.stopPropagation(); go(m[1] === '' ? 'home' : m[1]);
  };
  return (
    <div className="mq-wpanel mq-root" role="dialog" aria-label="Game menu">
      <nav className="mq-wnav" aria-label="Monster Quest menu">
        {items.map((n) => <button key={n.id} type="button" onClick={() => go(n.id)} className={`mq-nav-item ${tab === n.id ? 'is-active' : ''}`} aria-current={tab === n.id ? 'page' : undefined}><span className="text-xl">{n.icon}</span><span>{n.label}</span></button>)}
      </nav>
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
          {tab === 'questions' && mq.isStaff && <QuestionBank />}
        </div>
      </div>
    </div>
  );
}
