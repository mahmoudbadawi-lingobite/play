import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { listMyClasses } from '../../../lib/services';
import type { SchoolClass } from '../../../types';
import * as api from '../api';
import type { ClassProgress, DayCount, ProgressStudent, StudentProgress, TopicStat } from '../types';
import { Bar, GameButton, Modal, Panel } from '../ui';

type Period = 7 | 30 | null;
type SortKey = 'attention' | 'name' | 'accLow' | 'mostActive' | 'leastActive';

// ---------------------------------------------------------------- helpers
const DAY = 86400000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
/** Whole calendar days since the given time (null = never). */
const daysSince = (iso: string | null) => (iso ? Math.round((startOfDay(new Date()) - startOfDay(new Date(iso))) / DAY) : null);
const pct = (correct: number, answers: number) => (answers > 0 ? Math.round((100 * correct) / answers) : null);
const tone = (p: number | null) => (p === null ? '#94a3b8' : p >= 80 ? '#22c55e' : p >= 60 ? '#facc15' : '#ef4444');
function ago(iso: string | null): string {
  const d = daysSince(iso);
  if (d === null) return 'Never';
  if (d <= 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 14) return `${d} days ago`;
  if (d < 60) return `${Math.floor(d / 7)} weeks ago`;
  return `${Math.floor(d / 30)} months ago`;
}
/** Reasons a teacher may want to look at a student. Empty = on track. */
function flagsOf(s: ProgressStudent): string[] {
  const f: string[] = [];
  const d = daysSince(s.last_active);
  if (!s.last_active) f.push(s.started ? 'No answers yet' : 'Has not started');
  else if (d !== null && d >= 7) f.push('Inactive 7+ days');
  const p = pct(s.correct, s.answers);
  if (p !== null && s.answers >= 10 && p < 50) f.push('Low accuracy');
  return f;
}
const friendly = (msg: string) =>
  /mq_class_progress|mq_student_progress|schema cache|does not exist/i.test(msg)
    ? 'Progress is not switched on yet: run supabase/monster_quest_teacher_stage2.sql in the Supabase SQL editor, then reload.'
    : msg;

// ------------------------------------------------------------- small views
function Spark({ data, light }: { data: DayCount[]; light?: boolean }) {
  const max = Math.max(1, ...data.map((d) => d.answers));
  return (
    <div className="flex h-20 items-end gap-1" role="img" aria-label={`Answers per day over the last ${data.length} days`}>
      {data.map((d) => {
        const dt = new Date(`${d.day}T00:00:00`);
        const on = d.answers > 0;
        return (
          <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-0.5" title={`${dt.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}: ${d.answers} answers`}>
            <div className={`w-full rounded-t ${on ? (light ? 'bg-[#1b4fb3]' : 'bg-yellow-300') : light ? 'bg-[#dbe7ff]' : 'bg-white/15'}`} style={{ height: on ? `${Math.max(10, (100 * d.answers) / max) * 0.75}%` : '5%' }} />
            <span className={`text-[9px] font-bold ${light ? 'text-[#3d5a94]' : 'text-white/60'}`}>{dt.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
          </div>
        );
      })}
    </div>
  );
}

function TopicList({ topics, empty = 'No answers in this period yet.' }: { topics: TopicStat[]; empty?: string }) {
  if (!topics.length) return <p className="text-sm font-semibold opacity-70">{empty}</p>;
  return (
    <ul className="space-y-2">
      {topics.map((t) => (
        <li key={t.topic}>
          <div className="flex items-baseline justify-between gap-2 text-sm font-bold">
            <span className="truncate">{t.topic}</span>
            <span style={{ color: tone(t.accuracy) }} className="shrink-0 [text-shadow:0_1px_1px_rgba(0,0,0,.35)]">{t.accuracy}% <span className="text-xs font-semibold opacity-80">({t.correct}/{t.answers})</span></span>
          </div>
          <Bar pct={t.accuracy} color={tone(t.accuracy)} label={`${t.topic} accuracy`} height={8} />
        </li>
      ))}
    </ul>
  );
}

function Tile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl bg-black/25 px-3 py-2">
      <p className="text-[11px] font-extrabold uppercase text-white/70">{label}</p>
      <p className="font-display text-2xl font-extrabold text-white">{value}</p>
      {sub && <p className="text-[11px] font-semibold text-white/60">{sub}</p>}
    </div>
  );
}

// --------------------------------------------------------- student detail
function StudentDetail({ classId, student, days, onClose }: { classId: string; student: ProgressStudent; days: Period; onClose: () => void }) {
  const [d, setD] = useState<StudentProgress | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    api.studentProgress(classId, student.id, days).then((r) => { if (live) setD(r); }).catch((e: Error) => { if (live) setErr(friendly(e.message)); });
    return () => { live = false; };
  }, [classId, student.id, days]);
  const acc = pct(student.correct, student.answers);
  const flags = flagsOf(student);
  return (
    <Modal onClose={onClose} wide>
      <div className="text-[#10285a]">
        <p className="font-display text-xl font-extrabold">{student.name}</p>
        <p className="text-sm font-semibold text-[#3d5a94]">
          Level {student.level} · {student.xp.toLocaleString()} XP · {student.monsters} monster{student.monsters === 1 ? '' : 's'} ({student.species} kind{student.species === 1 ? '' : 's'}) · last active {ago(student.last_active).toLowerCase()}
        </p>
        {flags.length > 0 && <p className="mt-1 flex flex-wrap gap-1">{flags.map((f) => <span key={f} className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold uppercase">{f}</span>)}</p>}
        <p className="mt-2 text-sm font-bold">Accuracy {acc === null ? '–' : `${acc}%`} <span className="font-semibold text-[#3d5a94]">({student.correct} of {student.answers} answers {days ? `in the last ${days} days` : 'all time'})</span></p>

        {err && <p className="mt-3 rounded-xl bg-red-100 px-3 py-2 text-sm font-bold text-red-700" role="alert">{err}</p>}
        {!d && !err && <p className="mt-3 text-sm font-semibold">Loading…</p>}
        {d && (
          <div className="mt-3 space-y-4">
            <section>
              <h3 className="mb-1 text-xs font-extrabold uppercase text-[#3d5a94]">Accuracy by topic (weakest first)</h3>
              <TopicList topics={d.topics} />
            </section>
            <section>
              <h3 className="mb-1 text-xs font-extrabold uppercase text-[#3d5a94]">Answers per day, last 14 days</h3>
              <Spark data={d.activity} light />
            </section>
            <section>
              <h3 className="mb-1 text-xs font-extrabold uppercase text-[#3d5a94]">Monsters</h3>
              {d.monsters.length === 0
                ? <p className="text-sm font-semibold opacity-70">No monsters caught yet.</p>
                : <p className="flex flex-wrap gap-1">{d.monsters.map((m, i) => <span key={i} className="rounded-full bg-[#dbe7ff] px-2 py-0.5 text-xs font-bold">{m.name} Lv{m.level}{m.in_team ? ' ★' : ''}</span>)}</p>}
            </section>
            <section>
              <h3 className="mb-1 text-xs font-extrabold uppercase text-[#3d5a94]">Latest answers</h3>
              {d.recent.length === 0
                ? <p className="text-sm font-semibold opacity-70">No answers yet.</p>
                : (
                  <ul className="max-h-56 space-y-1 overflow-y-auto pr-1">
                    {d.recent.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 rounded-lg bg-[#eef4ff] px-2 py-1 text-sm">
                        <span className={`mt-0.5 font-extrabold ${r.correct ? 'text-green-600' : 'text-red-600'}`} aria-label={r.correct ? 'Correct' : 'Wrong'}>{r.correct ? '✓' : '✗'}</span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 font-semibold">{r.prompt}</span>
                          <span className="text-xs font-semibold text-[#3d5a94]">{r.topic ?? 'No topic'} · {new Date(r.at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}{r.response_ms ? ` · ${(r.response_ms / 1000).toFixed(1)}s` : ''}</span>
                        </span>
                      </li>
                    ))}
                  </ul>)}
            </section>
          </div>
        )}
        <div className="mt-4"><GameButton tone="ghost" className="!text-[#10285a]" onClick={onClose}>Close</GameButton></div>
      </div>
    </Modal>
  );
}

// --------------------------------------------------------------- the page
export function TeacherProgress() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<SchoolClass[] | null>(null);
  const [classId, setClassId] = useState('');
  const [period, setPeriod] = useState<Period>(30);
  const [data, setData] = useState<ClassProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('attention');
  const [detail, setDetail] = useState<ProgressStudent | null>(null);
  const reqId = useRef(0);

  useEffect(() => {
    if (!profile?.uid) return;
    void listMyClasses(profile.uid).then((c) => { setClasses(c); setClassId((cur) => cur || c[0]?.id || ''); });
  }, [profile?.uid]);

  const load = useCallback(async () => {
    if (!classId) return;
    const mine = ++reqId.current; // ignore answers that arrive after a newer request
    setLoading(true); setErr(null);
    try { const r = await api.classProgress(classId, period); if (mine === reqId.current) setData(r); }
    catch (e) { if (mine === reqId.current) { setData(null); setErr(friendly((e as Error).message)); } }
    finally { if (mine === reqId.current) setLoading(false); }
  }, [classId, period]);
  useEffect(() => { void load(); }, [load]);

  const students = data?.students;
  const totals = useMemo(() => {
    const st = students ?? [];
    const answers = st.reduce((a, s) => a + s.answers, 0), correct = st.reduce((a, s) => a + s.correct, 0);
    return { n: st.length, active7: st.filter((s) => (daysSince(s.last_active) ?? 99) < 7).length, answers, acc: pct(correct, answers) };
  }, [students]);
  const sorted = useMemo(() => {
    const st = [...(students ?? [])];
    const byName = (a: ProgressStudent, b: ProgressStudent) => a.name.localeCompare(b.name);
    const acc = (s: ProgressStudent) => pct(s.correct, s.answers) ?? 101;   // students without answers go last
    const last = (s: ProgressStudent) => (s.last_active ? new Date(s.last_active).getTime() : 0);
    if (sort === 'name') return st.sort(byName);
    if (sort === 'accLow') return st.sort((a, b) => acc(a) - acc(b) || byName(a, b));
    if (sort === 'mostActive') return st.sort((a, b) => last(b) - last(a) || byName(a, b));
    if (sort === 'leastActive') return st.sort((a, b) => last(a) - last(b) || byName(a, b));
    return st.sort((a, b) => flagsOf(b).length - flagsOf(a).length || acc(a) - acc(b) || byName(a, b));
  }, [students, sort]);

  const downloadCsv = () => {
    if (!data) return;
    // a leading = + - @ would be run as a formula by Excel, so it is neutralised
    const esc = (v: string | number | null) => { let s = String(v ?? ''); if (/^[=+\-@]/.test(s)) s = `'${s}`; return `"${s.replace(/"/g, '""')}"`; };
    const head = ['Student', 'Level', 'XP', 'Monsters', 'Kinds of monster', 'Answers', 'Correct', 'Accuracy %', 'Last active', 'Notes'];
    const rows = sorted.map((s) => [s.name, s.level, s.xp, s.monsters, s.species, s.answers, s.correct, pct(s.correct, s.answers), s.last_active ? new Date(s.last_active).toLocaleDateString() : 'Never', flagsOf(s).join('; ')]);
    const csv = `\ufeff${[head, ...rows].map((r) => r.map(esc).join(',')).join('\r\n')}`;   // BOM so Excel shows Arabic names correctly
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `monster-quest-${data.class.name.replace(/[^\p{L}\p{N}-]+/gu, '_')}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  };

  if (!profile) return null;
  const inp = 'rounded-xl border-2 border-[#1b4fb3] bg-white px-2.5 py-1.5 text-sm font-semibold text-[#10285a]';
  const chip = (on: boolean) => `rounded-full border-2 px-3 py-1 text-xs font-extrabold ${on ? 'border-yellow-300 bg-yellow-300 text-[#10285a]' : 'border-white/40 bg-white/10 text-white'}`;
  const cls = classes?.find((c) => c.id === classId);
  const activityTotal = data?.activity.reduce((a, d) => a + d.answers, 0) ?? 0;

  return (
    // Solid dark-blue surface so the white text stays readable on the light menu background; in full screen the page is already dark, so it is switched off there.
    <div className="space-y-3 rounded-3xl border-2 border-[#6aa8ff]/50 bg-gradient-to-b from-[#1b4fb3] to-[#0d2b73] p-3 text-white shadow-lg [.is-fs_&]:border-transparent [.is-fs_&]:bg-none [.is-fs_&]:p-0 [.is-fs_&]:shadow-none">
      <Panel>
        <div className="flex flex-wrap items-center gap-2">
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className={inp} aria-label="Class" disabled={!classes?.length}>
            {(classes ?? []).map((c) => <option key={c.id} value={c.id}>{c.name} ({c.studentIds.length})</option>)}
          </select>
          <div role="group" aria-label="Period" className="flex gap-1">
            {([[7, 'Last 7 days'], [30, 'Last 30 days'], [null, 'All time']] as [Period, string][]).map(([p, label]) => (
              <button key={label} type="button" className={chip(period === p)} aria-pressed={period === p} onClick={() => setPeriod(p)}>{label}</button>
            ))}
          </div>
          <GameButton tone="ghost" onClick={() => void load()} disabled={!classId || loading}>↻ Refresh</GameButton>
          <GameButton tone="blue" onClick={downloadCsv} disabled={!sorted.length}>⬇ Download CSV</GameButton>
        </div>
        <p className="mt-2 text-xs font-semibold text-white/75">Answers come from capture challenges, training and special attacks. Accuracy follows the period you pick; level, XP and monsters are totals.</p>
      </Panel>

      {classes && classes.length === 0 && <Panel><p className="font-bold">You have no classes yet.</p><p className="text-sm font-semibold text-white/80">Create a class under My Classes and ask your students to join with its code. They will show up here once they play.</p></Panel>}
      {err && <p className="rounded-xl bg-yellow-500/90 px-3 py-2 text-sm font-bold text-[#10285a]" role="alert">{err}</p>}
      {loading && !data && !err && <Panel><p className="font-bold">Loading…</p></Panel>}

      {data && (
        <div className={`space-y-3 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Tile label="Students" value={totals.n} />
            <Tile label="Active this week" value={`${totals.active7} / ${totals.n}`} sub="played in the last 7 days" />
            <Tile label="Class accuracy" value={totals.acc === null ? '–' : `${totals.acc}%`} sub={period ? `last ${period} days` : 'all time'} />
            <Tile label="Answers" value={totals.answers.toLocaleString()} sub={period ? `last ${period} days` : 'all time'} />
          </div>

          {data.students.length === 0 ? (
            <Panel><p className="font-bold">No students have joined this class yet.</p>{cls?.joinCode && <p className="text-sm font-semibold text-white/80">Share the join code <span className="rounded bg-black/30 px-1.5 py-0.5 font-mono font-extrabold tracking-widest">{cls.joinCode}</span> with your students.</p>}</Panel>
          ) : (
            <Panel>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-extrabold">Students</h2>
                <label className="flex items-center gap-1.5 text-xs font-extrabold uppercase text-white/80">Sort
                  <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={inp} aria-label="Sort students">
                    <option value="attention">Needs attention first</option><option value="name">Name</option><option value="accLow">Accuracy, lowest first</option>
                    <option value="mostActive">Most recently active</option><option value="leastActive">Least recently active</option>
                  </select>
                </label>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-black/25 text-xs uppercase"><tr>
                    <th scope="col" className="p-2">Student</th><th scope="col" className="p-2 text-center">Lvl</th><th scope="col" className="p-2 text-center">Monsters</th>
                    <th scope="col" className="p-2 text-center">Answers</th><th scope="col" className="p-2">Accuracy</th><th scope="col" className="p-2">Last active</th><th scope="col" className="p-2">Status</th>
                  </tr></thead>
                  <tbody>
                    {sorted.map((s) => {
                      const p = pct(s.correct, s.answers), fl = flagsOf(s);
                      return (
                        <tr key={s.id} className="border-t border-white/10">
                          <td className="p-2"><button type="button" className="text-left font-extrabold underline decoration-white/30 underline-offset-2 hover:decoration-yellow-300" onClick={() => setDetail(s)}>{s.name}</button></td>
                          <td className="p-2 text-center">{s.level}</td>
                          <td className="p-2 text-center">{s.monsters}<span className="text-xs text-white/60"> ({s.species})</span></td>
                          <td className="p-2 text-center">{s.answers}</td>
                          <td className="p-2"><div className="flex items-center gap-2"><div className="w-16"><Bar pct={p ?? 0} color={tone(p)} label={`${s.name} accuracy`} height={8} /></div><span className="w-10 font-bold" style={{ color: tone(p) }}>{p === null ? '–' : `${p}%`}</span></div></td>
                          <td className="p-2 text-xs font-semibold">{ago(s.last_active)}</td>
                          <td className="p-2">{fl.length === 0 ? <span className="text-xs font-bold text-green-300">On track</span> : <span className="flex flex-wrap gap-1">{fl.map((f) => <span key={f} className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${f === 'Low accuracy' ? 'bg-red-500 text-white' : 'bg-amber-400 text-[#10285a]'}`}>{f}</span>)}</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs font-semibold text-white/60">Tap a name for that student's topics, monsters and latest answers.</p>
            </Panel>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <Panel>
              <h2 className="mb-2 font-display text-lg font-extrabold">Topics to revisit</h2>
              <TopicList topics={data.topics} />
            </Panel>
            <Panel>
              <h2 className="mb-2 font-display text-lg font-extrabold">Hardest questions</h2>
              {data.hard.length === 0
                ? <p className="text-sm font-semibold opacity-70">A question appears here once at least 3 answers have been given.</p>
                : (
                  <ol className="space-y-2">
                    {data.hard.map((h) => (
                      <li key={h.id} className="rounded-xl bg-black/20 px-2.5 py-1.5">
                        <p className="line-clamp-2 text-sm font-bold">{h.prompt}</p>
                        <p className="text-xs font-semibold text-white/70">{h.topic ?? 'No topic'} · {h.answers} answers · <span style={{ color: tone(h.accuracy) }} className="font-extrabold">{h.accuracy}% correct</span></p>
                      </li>
                    ))}
                  </ol>)}
            </Panel>
          </div>

          <Panel>
            <h2 className="mb-2 font-display text-lg font-extrabold">Class activity, last 14 days <span className="text-sm font-semibold text-white/70">({activityTotal} answers)</span></h2>
            <Spark data={data.activity} />
          </Panel>
        </div>
      )}

      {detail && <StudentDetail classId={classId} student={detail} days={period} onClose={() => setDetail(null)} />}
    </div>
  );
}
