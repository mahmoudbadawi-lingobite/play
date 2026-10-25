import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { getContentSet } from '../lib/services';
import { compatibleGames } from '../games/registry';
import type { ContentSet } from '../types';

export function GamePickerPage() {
  const { setId } = useParams<{ setId: string }>();
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref');
  const [set, setSet] = useState<ContentSet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!setId) return;
    getContentSet(setId).then(setSet).finally(() => setLoading(false));
  }, [setId]);

  if (loading) return <p className="p-8 text-center text-muted-foreground">Loading...</p>;
  if (!set) return <p className="p-8 text-center text-muted-foreground">Game not found.</p>;

  const games = compatibleGames(set.items, set.skill);

  return (
    <div className="kid-picker mx-auto max-w-4xl px-4 py-10">
      <div className="kid-page-head">
        <p className="kid-pill text-sm uppercase tracking-wide text-secondary">{set.skill}</p>
        <h1 className="kid-big-title font-display text-3xl font-bold text-primary">{set.title}</h1>
        <p className="kid-sub mt-1 text-muted-foreground">Pick how you want to play this one.</p>
      </div>

      <div className="kid-game-grid mt-6 grid gap-4 sm:grid-cols-2">
        {games.map((g) => (
          <Link
            key={g.key}
            // Carry the LingoTrace ref token through to the actual game route
            // (if present) so the finished score can still be attributed and
            // reported back — the picker itself never needs it otherwise.
            to={`/play/${set.id}/${g.key}${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`}
            data-game={g.key}
            className="kid-game-card card-surface flex items-center gap-4 p-5 hover:border-secondary"
          >
            <span className="kg-art" aria-hidden="true" />
            <span className="kg-emoji text-3xl">{g.icon}</span>
            <div className="kg-body">
              <p className="kg-title font-display font-semibold text-primary">{g.name}</p>
              <p className="kg-desc text-sm text-muted-foreground">{g.description}</p>
            </div>
            <span className="kg-go" aria-hidden="true" />
          </Link>
        ))}
      </div>

      {games.some((g) => g.key === 'treasure-hunt') && !ref && (
        <Link
          to={`/hunt?set=${encodeURIComponent(set.id)}`}
          data-game="friends"
          className="kid-game-card card-surface mt-4 flex items-center gap-4 border-2 border-secondary p-5 hover:bg-secondary/10"
        >
          <span className="kg-art" aria-hidden="true" />
          <span className="kg-emoji text-3xl">👥</span>
          <div className="kg-body">
            <p className="kg-title font-display font-semibold text-primary">Treasure Hunt with friends</p>
            <p className="kg-desc text-sm text-muted-foreground">Open a live room (2–10 players). Race each other or hunt as a team.</p>
          </div>
          <span className="kg-people" aria-hidden="true" />
          <span className="kg-go" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
