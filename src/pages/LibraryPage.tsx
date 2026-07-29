import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPublicContentSets, reportContentSet } from '../lib/services';
import { compatibleGames } from '../games/registry';
import { useAuth } from '../contexts/AuthContext';
import type { ContentSet, SkillTemplate } from '../types';

const SKILLS: (SkillTemplate | 'all')[] = ['all', 'vocabulary', 'grammar', 'reading', 'spelling'];

export function LibraryPage() {
  const { profile } = useAuth();
  const [sets, setSets] = useState<ContentSet[]>([]);
  const [skill, setSkill] = useState<SkillTemplate | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [reportedIds, setReportedIds] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    listPublicContentSets(skill === 'all' ? undefined : skill)
      .then(setSets)
      .finally(() => setLoading(false));
  }, [skill]);

  const handleReport = async (id: string) => {
    if (!profile || reportedIds.includes(id)) return;
    await reportContentSet(id, 'Reported by user from library', profile.uid);
    setReportedIds((r) => [...r, id]);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-primary">Game Library</h1>
      <p className="mt-1 text-muted-foreground">Public games shared by teachers across LingoBite Play.</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {SKILLS.map((s) => (
          <button
            key={s}
            onClick={() => setSkill(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
              skill === s ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-primary/70'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-muted-foreground">Loading games...</p>
      ) : sets.length === 0 ? (
        <p className="mt-8 text-muted-foreground">No public games yet for this skill.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sets.map((set) => (
            <div key={set.id} className="card-surface flex flex-col p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold capitalize text-muted-foreground">
                  {set.skill}
                </span>
                <span className="text-xs text-muted-foreground">{set.playCount} plays</span>
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold text-primary">{set.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">by {set.teacherName} · {set.items.length} items</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {compatibleGames(set.items).map((g) => (
                  <span key={g.key} title={g.name} className="text-lg">{g.icon}</span>
                ))}
              </div>
              <Link
                to={`/play/${set.id}`}
                className="mt-4 inline-block rounded-lg bg-secondary px-4 py-2 text-center text-sm font-semibold text-secondary-foreground hover:opacity-90"
              >
                Choose a game →
              </Link>
              {profile && (
                <button
                  onClick={() => handleReport(set.id)}
                  disabled={reportedIds.includes(set.id)}
                  className="mt-2 text-left text-xs text-muted-foreground hover:text-destructive disabled:text-success"
                >
                  {reportedIds.includes(set.id) ? '✓ Reported - thanks' : '⚑ Report this content'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
