import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPublicContentSets, reportContentSet, deleteContentSet } from '../lib/services';
import { SkillArt } from '../components/library/SkillArt';
import { CheckIcon, EditIcon, FlagIcon, LinkIcon, TrashIcon } from '../components/library/CardIcons';
import { useAuth } from '../contexts/AuthContext';
import type { ContentSet, SkillTemplate } from '../types';

const SKILLS: (SkillTemplate | 'all')[] = ['all', 'vocabulary', 'grammar', 'reading', 'spelling'];

export function LibraryPage() {
  const { profile } = useAuth();
  const [sets, setSets] = useState<ContentSet[]>([]);
  const [skill, setSkill] = useState<SkillTemplate | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [reportedIds, setReportedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    listPublicContentSets(skill === 'all' ? undefined : skill)
      .then(setSets)
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [skill]);

  const handleReport = async (id: string) => {
    if (!profile || reportedIds.includes(id)) return;
    await reportContentSet(id, 'Reported by user from library', profile.uid);
    setReportedIds((r) => [...r, id]);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    await deleteContentSet(id);
    refresh();
  };

  // Lets a teacher grab this game's link to paste into LingoTrace's
  // "Exams & Games" assignment field — works for ANY public set here,
  // not just ones this teacher authored, same link format as the
  // "Copy link" button on My Games.
  const handleShare = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}${import.meta.env.BASE_URL}play/${id}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="kid-lib mx-auto max-w-6xl px-4 py-10">
      <div className="kid-sticky-head kid-page-head">
      <p className="kid-pill kid-only">Library</p>
      <h1 className="kid-big-title font-display text-3xl font-bold text-primary">Game Library</h1>
      <p className="kid-sub mt-1 text-muted-foreground">Public games shared by teachers across LingoBite Play.</p>
      <Link to="/hunt" className="mt-3 inline-flex items-center gap-2 rounded-xl border-2 border-secondary px-4 py-2 text-sm font-bold text-primary hover:bg-secondary/10">
        🗺️ Treasure Hunt rooms: host or join a live game
      </Link>

      <Link to="/monster-quest" className="mt-3 ml-2 inline-flex items-center gap-2 rounded-xl border-2 border-secondary px-4 py-2 text-sm font-bold text-primary hover:bg-secondary/10">
        🐲 Monster Quest: explore, answer questions, capture monsters
      </Link>

      <div className="kid-chips mt-5 flex flex-wrap gap-2">
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
      </div>

      {loading ? (
        <p className="mt-8 text-muted-foreground">Loading games...</p>
      ) : sets.length === 0 ? (
        <p className="mt-8 text-muted-foreground">No public games yet for this skill.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sets.map((set) => (
            <div key={set.id} data-skill={set.skill} className="kid-set-card card-surface flex flex-col p-4">
              <div className="kid-sc-top flex items-center justify-between gap-2">
                <span className="kid-sc-pill rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold capitalize text-muted-foreground">
                  {set.skill}
                </span>
                <span className="kid-sc-plays text-xs text-muted-foreground">{set.playCount} plays</span>
              </div>
              <div className="kid-sc-body">
                <SkillArt skill={set.skill} className="kid-sc-art kid-only" />
                <div className="kid-sc-main">
                  <div className="kid-sc-text">
                    <h3 className="kid-sc-title mt-2 font-display text-base font-semibold leading-tight text-primary">{set.title}</h3>
                    <p className="kid-sc-by text-xs text-muted-foreground">by {set.teacherName} · {set.items.length} items</p>
                  </div>
                  <div className="kid-sc-actions mt-3 grid grid-cols-[1.5fr_1fr] gap-2">
                    <Link
                      to={`/play/${set.id}`}
                      className="whitespace-nowrap rounded-lg bg-secondary px-3 py-1.5 text-center text-sm font-semibold text-secondary-foreground hover:opacity-90"
                    >
                      Choose a game →
                    </Link>
                    <button
                      onClick={() => handleShare(set.id)}
                      title="Copy link"
                      aria-label="Copy link"
                      className="kid-sc-copy whitespace-nowrap rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-primary hover:border-secondary"
                    >
                      {copiedId === set.id ? <CheckIcon className="kid-sc-ico" /> : <LinkIcon className="kid-sc-ico" />}
                      <span className="kid-sc-copy-text">{copiedId === set.id ? '✓ Copied' : 'Copy link'}</span>
                    </button>
                  </div>
                </div>
              </div>
              {profile && (
                <div className="kid-sc-foot mt-2 flex items-center gap-3 text-xs">
                  <button
                    onClick={() => handleReport(set.id)}
                    disabled={reportedIds.includes(set.id)}
                    title={reportedIds.includes(set.id) ? 'Reported - thanks' : 'Report this content'}
                    aria-label="Report this content"
                    className="kid-sc-act text-left text-muted-foreground hover:text-destructive disabled:text-success"
                  >
                    {reportedIds.includes(set.id) ? <CheckIcon className="kid-sc-ico" /> : <FlagIcon className="kid-sc-ico" />}
                    <span className="kid-sc-lbl">{reportedIds.includes(set.id) ? '✓ Reported' : 'Report'}</span>
                  </button>
                  {(profile.uid === set.teacherId || profile.role === 'admin') && (
                    <>
                      <Link to={`/teacher/edit/${set.id}`} title="Edit" aria-label="Edit" className="kid-sc-act font-semibold text-primary hover:text-secondary">
                        <EditIcon className="kid-sc-ico" />
                        <span className="kid-sc-lbl">Edit</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(set.id, set.title)}
                        title="Delete"
                        aria-label="Delete"
                        className="kid-sc-act kid-sc-del font-semibold text-destructive hover:opacity-80"
                      >
                        <TrashIcon className="kid-sc-ico" />
                        <span className="kid-sc-lbl">Delete</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
