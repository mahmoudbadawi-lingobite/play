import type { ReactNode } from 'react';
import type { ContentSet } from '../../types';
import type { Domain, Subject } from '../../features/subjects/types';
import { tr } from '../../i18n/tr';

export interface Level { subject: string | null; domain: string | null; grade: number | null }

const SUBJECT_ART = new Set(['science', 'arabic', 'islamic-studies', 'social-studies', 'history', 'computer-science', 'art', 'math', 'other']);
const base = import.meta.env.BASE_URL;

const subjectOf = (s: ContentSet) => s.subjectId ?? 'english';
const domainsOf = (s: ContentSet): string[] => (s.domainIds?.length ? s.domainIds : s.domainId ? [s.domainId] : []);

/** The subject itself plus its sub-subjects (Science -> Physics, Chemistry, Biology). */
const family = (subjects: Subject[], id: string) => [id, ...subjects.filter((x) => x.parentId === id).map((x) => x.id)];

export function filterSets(sets: ContentSet[], subjects: Subject[], lv: Level): ContentSet[] {
  if (!lv.subject) return [];
  let out = lv.subject === 'all' ? sets : sets.filter((s) => family(subjects, lv.subject!).includes(subjectOf(s)));
  if (lv.domain && lv.domain !== 'all') out = out.filter((s) => domainsOf(s).includes(lv.domain!));
  if (lv.grade) out = out.filter((s) => s.grade == null || s.grade === lv.grade);
  return out;
}
export const shownCount = (sets: ContentSet[], subjects: Subject[], lv: Level) => filterSets(sets, subjects, lv).length;

function subjectArt(subjects: Subject[], id: string): string {
  const s = subjects.find((x) => x.id === id);
  const root = (s?.parentId ?? id).replace(/-ar$/, ''); // the Arabic edition of a subject shares its picture
  if (SUBJECT_ART.has(root)) return `${base}kid/subject-${root}.webp`;
  if (root === 'english') return `${base}kid/skill-vocabulary.webp`;
  return `${base}kid/subject-other.webp`;
}

function domainArt(d: Domain, subjectImg: string): string {
  const t = `${d.id} ${d.name}`.toLowerCase();
  const pick = (k: string) => `${base}kid/skill-${k}.webp`;
  if (/listen|استماع/.test(t)) return pick('listening');
  if (/read|قراءة/.test(t)) return pick('reading');
  if (/grammar|قواعد|نحو/.test(t)) return pick('grammar');
  if (/spell|إملاء/.test(t)) return pick('spelling');
  if (/vocab|مفردات/.test(t)) return pick('vocabulary');
  if (/speak|محادثة|تحدث/.test(t)) return pick('speaking');
  if (/writ|كتابة/.test(t)) return pick('writing');
  return subjectImg;
}

function Card({ img, title, count, onClick, tone }: { img: string; title: string; count: number; onClick: () => void; tone?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col items-center rounded-2xl border-2 border-border bg-card p-4 text-center shadow-sm transition hover:-translate-y-1 hover:border-secondary hover:shadow-md ${tone ?? ''}`}
    >
      <img src={img} alt="" loading="lazy" draggable={false} className="h-28 w-auto max-w-full object-contain transition group-hover:scale-105" />
      <span dir="auto" className="mt-2 font-display text-lg font-bold leading-tight text-primary">{title}</span>
      <span className="mt-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">{tr('{n} games', { n: count })}</span>
    </button>
  );
}

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

export function LibraryCards({ sets, subjects, level, go, loading, children, onlyIds, canToggle, showOthers, onToggleOthers }: {
  sets: ContentSet[]; subjects: Subject[]; level: Level; go: (n: Partial<Level>) => void; loading: boolean; children: ReactNode;
  onlyIds?: string[] | null; canToggle?: boolean; showOthers?: boolean; onToggleOthers?: () => void;
}) {
  const top = subjects.filter((s) => s.active && !s.parentId && (!onlyIds || onlyIds.includes(s.id) || subjects.some((k) => k.parentId === s.id && onlyIds.includes(k.id)))).sort((a, b) => a.sort - b.sort);
  const subject = level.subject && level.subject !== 'all' ? subjects.find((s) => s.id === level.subject) ?? null : null;
  const gradeFiltered = (list: ContentSet[]) => (level.grade ? list.filter((s) => s.grade == null || s.grade === level.grade) : list);
  const countFor = (ids: string[], domainId?: string) =>
    gradeFiltered(sets.filter((s) => ids.includes(subjectOf(s)) && (!domainId || domainsOf(s).includes(domainId)))).length;

  const showGrid = !!level.subject && (level.subject === 'all' || !!level.domain);
  const crumbs: ReactNode = level.subject ? (
    <nav className="mt-4 flex flex-wrap items-center gap-1 text-sm font-semibold text-primary">
      <button type="button" onClick={() => go({ subject: null, domain: null })} className="underline-offset-2 hover:underline">{tr('All subjects')}</button>
      {level.subject === 'all' ? <><span>›</span><span>{tr('All games')}</span></> : subject && (
        <>
          {subject.parentId && (<><span>›</span><button type="button" onClick={() => go({ subject: subject.parentId!, domain: null })} dir="auto" className="underline-offset-2 hover:underline">{subjects.find((x) => x.id === subject.parentId)?.name}</button></>)}
          <span>›</span>
          <button type="button" onClick={() => go({ domain: null })} dir="auto" className="underline-offset-2 hover:underline">{subject.name}</button>
          {level.domain && <><span>›</span><span dir="auto">{level.domain === 'all' ? tr('All games') : subject.domains.find((d) => d.id === level.domain)?.name}</span></>}
        </>
      )}
    </nav>
  ) : null;

  const gradeChips = level.subject ? (
    <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label={tr('Grade')}>
      <span className="me-1 text-xs font-bold text-muted-foreground">{tr('Grade')}</span>
      {[null, ...GRADES].map((g) => (
        <button
          key={g ?? 'any'}
          type="button"
          onClick={() => go({ grade: g })}
          className={`rounded-full px-3 py-1 text-sm font-semibold ${level.grade === g ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-primary/70 hover:border-secondary'}`}
        >
          {g ?? tr('Any')}
        </button>
      ))}
    </div>
  ) : null;

  let cards: ReactNode = null;
  if (!level.subject) {
    cards = (
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {top.map((s) => (
          <Card key={s.id} img={subjectArt(subjects, s.id)} title={s.name} count={countFor(family(subjects, s.id))} onClick={() => go({ subject: s.id, domain: null })} />
        ))}
        <Card img={`${base}kid/subject-other.webp`} title={tr('All games')} count={sets.length} onClick={() => go({ subject: 'all', domain: null })} />
      </div>
    );
  } else if (subject && !level.domain) {
    const kids = subjects.filter((x) => x.parentId === subject.id && x.active);
    const img = subjectArt(subjects, subject.id);
    const ids = family(subjects, subject.id);
    cards = (
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {kids.map((k) => (
          <Card key={k.id} img={subjectArt(subjects, k.id)} title={k.name} count={countFor([k.id])} onClick={() => go({ subject: k.id, domain: null })} tone="bg-secondary/5" />
        ))}
        {[...subject.domains].sort((a, b) => a.sort - b.sort).map((d) => (
          <Card key={d.id} img={domainArt(d, img)} title={d.name} count={countFor(ids, d.id)} onClick={() => go({ domain: d.id })} />
        ))}
        <Card img={img} title={tr('All {name}', { name: subject.name })} count={countFor(ids)} onClick={() => go({ domain: 'all' })} />
      </div>
    );
  }

  const toggle = canToggle ? (
    <button type="button" onClick={onToggleOthers} className="mt-3 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-primary hover:border-secondary">
      {showOthers ? tr('Show only my subjects') : tr('Show other subjects too')}
    </button>
  ) : null;

  return (
    <>
      {toggle}
      {crumbs}
      {gradeChips}
      {loading ? null : cards}
      {showGrid && children}
    </>
  );
}
