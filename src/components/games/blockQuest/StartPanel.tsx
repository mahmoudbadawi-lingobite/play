import { Link } from 'react-router-dom';
import { useAvatarState } from '../../../features/avatar/avatarStore';
import { AvatarImage } from '../../../features/avatar/AvatarImage';
import { ChooseHero } from '../../../features/avatar/ChooseHero';
import { WorldCards } from './WorldCards';

export function StartPanel({
  worldId,
  onWorld,
  raceMode,
  raceLocked,
  onRace,
  onStart,
}: {
  worldId: string;
  onWorld: (id: string) => void;
  raceMode: boolean;
  raceLocked: boolean;
  onRace: (on: boolean) => void;
  onStart: () => void;
}) {
  const av = useAvatarState();
  if (!av.gender) {
    return (
      <div className="mt-3">
        <ChooseHero title="Choose your hero to start" />
      </div>
    );
  }
  return (
    <div className="mt-3 rounded-2xl border-2 border-border bg-card p-4">
      <div className="flex items-center gap-4">
        <AvatarImage gender={av.gender} look={av.looks[av.gender]} view="body" size={88} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-bold text-primary">Pick your world</p>
          <p className="text-sm text-muted-foreground">Run to each gate, then choose the right portal.</p>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          <Link to="/store" className="rounded-xl border-2 border-border px-3 py-1.5 text-center text-sm font-bold text-primary hover:border-secondary">
            🛍️ Style Store · 🪙 {av.coins}
          </Link>
          <Link to="/avatar" className="rounded-xl border-2 border-border px-3 py-1.5 text-center text-sm font-bold text-primary hover:border-secondary">
            My Avatar
          </Link>
        </div>
      </div>

      <WorldCards worldId={worldId} onWorld={onWorld} />

      <label className="mt-3 flex items-center gap-2 text-sm text-primary">
        <input type="checkbox" checked={raceMode} disabled={raceLocked} onChange={(e) => onRace(e.target.checked)} className="h-4 w-4" />
        <span>
          <span className="font-bold">Race mode</span> – 15 seconds a gate, bonus coins for fast answers
          {raceLocked && <span className="text-muted-foreground"> (your teacher turned this on)</span>}
        </span>
      </label>

      <button type="button" onClick={onStart} className="bq-btn mt-4 w-full rounded-xl bg-secondary px-6 py-4 text-xl font-extrabold text-secondary-foreground">
        Start run
      </button>
    </div>
  );
}
