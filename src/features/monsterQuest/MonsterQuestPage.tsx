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
import './monsterQuest.css';

function Shell() {
  const mq = useMq();
  const nav = [
    { to: '', icon: '🏠', label: 'Home', end: true }, { to: 'explore', icon: '🗺️', label: 'Explore' }, { to: 'monsters', icon: '🐾', label: 'Monsters' }, { to: 'arena', icon: '⚔️', label: 'Arena' }, { to: 'quests', icon: '📜', label: 'Quests' }, { to: 'style', icon: '👕', label: 'Style' },
    { to: 'dex', icon: '📖', label: 'Dex' }, { to: 'inventory', icon: '🎒', label: 'Bag' }, { to: 'shop', icon: '🛍️', label: 'Shop' },
    { to: 'leaderboard', icon: '🏆', label: 'Ranks' }, { to: 'profile', icon: '👤', label: 'Profile' },
    ...(mq.isStaff ? [{ to: 'questions', icon: '📝', label: 'Questions' }] : []),
  ];
  return (
    <div className="mq-root">
      <div className="mx-auto max-w-6xl px-3 pb-24 pt-3 sm:px-5">
        <header className="mb-3 flex items-center justify-between gap-3">
          <NavLink to="/monster-quest"><MqLogo /></NavLink>
          <div className="flex gap-2 text-sm font-extrabold text-white"><span className="mq-pill">🪙 {fmt(mq.state.coins)}</span><span className="mq-pill">💎 {fmt(mq.state.gems)}</span><span className="mq-pill">Lv {mq.state.level}</span></div>
        </header>
        <div className="md:grid md:grid-cols-[150px_1fr] md:gap-4">
          <nav className="mq-nav" aria-label="Monster Quest">
            {nav.map((n) => <NavLink key={n.label} to={n.to ? `/monster-quest/${n.to}` : '/monster-quest'} end={n.end} className={({ isActive }) => `mq-nav-item ${isActive ? 'is-active' : ''}`}><span className="text-xl">{n.icon}</span><span>{n.label}</span></NavLink>)}
          </nav>
          <main className="min-w-0">
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
