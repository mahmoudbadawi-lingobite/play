import { useEffect } from 'react';
import { useMq } from '../context';
import { Collection } from '../screens/Collection';
import { CharacterShop } from '../screens/CharacterShop';
import { Inventory, Shop } from '../screens/Shop';
import { Wardrobe } from '../screens/Wardrobe';
import { fmt } from '../ui';
import { sfx } from '../sound';

export type PanelTab = 'bag' | 'shop' | 'style' | 'monsters' | 'explorers';
const TABS: { id: PanelTab; icon: string; label: string }[] = [
  { id: 'bag', icon: '🎒', label: 'Bag' }, { id: 'shop', icon: '🛍️', label: 'Shop' }, { id: 'style', icon: '👕', label: 'Style' },
  { id: 'monsters', icon: '🐾', label: 'Monsters' }, { id: 'explorers', icon: '🧭', label: 'Explorers' },
];

/**
 * Bag, Shop, Style, Monsters and Explorers, shown on top of the running world instead of leaving the page. Because the
 * world stays mounted underneath (paused), full screen is kept and "Back to game" returns to the exact same spot.
 */
export function WorldPanel({ tab, onTab, onClose }: { tab: PanelTab; onTab: (t: PanelTab) => void; onClose: () => void }) {
  const mq = useMq();
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return (
    <div className="mq-wpanel mq-root" role="dialog" aria-label="Game menu">
      <div className="mq-wpanel-bar">
        <button className="mq-wpanel-back" onClick={() => { sfx.click(); onClose(); }}>← Back to game</button>
        <div className="mq-wpanel-tabs" role="tablist">
          {TABS.map((t) => <button key={t.id} role="tab" aria-selected={tab === t.id} className={`mq-wpanel-tab ${tab === t.id ? 'on' : ''}`} onClick={() => { sfx.click(); onTab(t.id); }}><span>{t.icon}</span> {t.label}</button>)}
        </div>
        <span className="mq-wpanel-coins">🪙 {fmt(mq.state.coins)} · 💎 {fmt(mq.state.gems)}</span>
      </div>
      <div className="mq-wpanel-body">
        <div className="mx-auto max-w-5xl">
          {tab === 'bag' && <Inventory />}
          {tab === 'shop' && <Shop onStyle={() => onTab('style')} />}
          {tab === 'style' && <Wardrobe />}
          {tab === 'monsters' && <Collection />}
          {tab === 'explorers' && <CharacterShop />}
        </div>
      </div>
    </div>
  );
}
