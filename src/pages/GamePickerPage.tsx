import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getContentSet } from '../lib/services';
import { compatibleGames } from '../games/registry';
import type { ContentSet } from '../types';

export function GamePickerPage() {
  const { setId } = useParams<{ setId: string }>();
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
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-sm uppercase tracking-wide text-secondary">{set.skill}</p>
      <h1 className="font-display text-3xl font-bold text-primary">{set.title}</h1>
      <p className="mt-1 text-muted-foreground">Pick how you want to play this one.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {games.map((g) => (
          <Link
            key={g.key}
            to={`/play/${set.id}/${g.key}`}
            className="card-surface flex items-center gap-4 p-5 hover:border-secondary"
          >
            <span className="text-3xl">{g.icon}</span>
            <div>
              <p className="font-display font-semibold text-primary">{g.name}</p>
              <p className="text-sm text-muted-foreground">{g.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
