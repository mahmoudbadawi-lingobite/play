import { useEffect, useMemo, useState } from 'react';
import { decideTeacherSubject, deleteDomain, deleteSkill, deleteSubject, listAllTeacherSubjects, saveDomain, saveSkills, saveSubject, setSubjectQuestionTypes } from './api';
import { buildRows, parseTaxonomy, slug } from './taxonomy';
import { useSubjects } from './useSubjects';
import type { Domain, Skill, Subject, TeacherSubject } from './types';

const inp = 'rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-secondary';
const btn = 'rounded-lg bg-secondary px-3 py-1.5 text-sm font-semibold text-secondary-foreground disabled:opacity-40';
const btn2 = 'rounded-md border border-border px-2 py-1 text-xs font-semibold text-muted-foreground transition hover:border-secondary hover:text-secondary';

export function AdminSubjectsPage() {
  const cat = useSubjects();
  const [tab, setTab] = useState<'requests' | 'subjects'>('requests');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setMsg(null);
    try { await fn(); await cat.reload(); setMsg({ ok: true, text: ok }); } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  };
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-primary">Subjects and skills</h1>
      <p className="mt-1 text-sm text-muted-foreground">Set up subjects, their skills and allowed question types, and approve which subjects each teacher may use.</p>
      <div className="mt-4 flex gap-2" role="tablist">
        {(['requests', 'subjects'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === t ? 'bg-secondary text-secondary-foreground' : 'border border-border text-muted-foreground'}`}>
            {t === 'requests' ? 'Teacher requests' : 'Subjects, skills and types'}
          </button>
        ))}
      </div>
      {msg && <p className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold ${msg.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} role="status">{msg.text}</p>}
      {cat.error && <p className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-800" role="alert">{cat.error}. Run supabase/subjects_skills_patch.sql in Supabase first.</p>}
      {tab === 'requests' ? <Requests subjects={cat.subjects} run={run} /> : <Editor subjects={cat.subjects} questionTypes={cat.questionTypes} run={run} />}
    </div>
  );
}

// ------------------------------------------------------------ requests
function Requests({ subjects, run }: { subjects: Subject[]; run: (fn: () => Promise<unknown>, ok: string) => Promise<void> }) {
  const [rows, setRows] = useState<TeacherSubject[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => { listAllTeacherSubjects().then((r) => { setRows(r); setErr(null); }).catch((e) => setErr(e.message)); }, [tick]);
  const name = (id: string) => subjects.find((s) => s.id === id)?.name ?? id;
  const decide = (r: TeacherSubject, status: 'approved' | 'rejected') => run(async () => { await decideTeacherSubject(r.teacherId, r.subjectId, status); setTick((x) => x + 1); }, `${name(r.subjectId)}: ${status} for ${r.teacherName ?? 'teacher'}`);
  const pending = rows.filter((r) => r.status === 'pending'), rest = rows.filter((r) => r.status !== 'pending');
  const Row = ({ r }: { r: TeacherSubject }) => (
    <div className="card-surface flex flex-wrap items-center gap-3 p-3">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-primary">{r.teacherName ?? r.teacherEmail ?? r.teacherId}</p>
        <p className="text-xs text-muted-foreground">{r.teacherEmail} · {name(r.subjectId)} · {r.status}</p>
      </div>
      {r.status !== 'approved' && <button className={btn} onClick={() => decide(r, 'approved')}>Approve</button>}
      {r.status !== 'rejected' && <button className={btn2} onClick={() => decide(r, 'rejected')}>{r.status === 'approved' ? 'Revoke' : 'Reject'}</button>}
    </div>
  );
  return (
    <div className="mt-6">
      {err && <p className="text-sm text-red-700">{err}</p>}
      <h2 className="font-display text-lg font-semibold text-primary">Waiting for approval ({pending.length})</h2>
      <div className="mt-2 grid gap-2">{pending.map((r) => <Row key={r.teacherId + r.subjectId} r={r} />)}{pending.length === 0 && <p className="text-sm text-muted-foreground">No requests right now.</p>}</div>
      <h2 className="mt-6 font-display text-lg font-semibold text-primary">Decided ({rest.length})</h2>
      <div className="mt-2 grid gap-2">{rest.map((r) => <Row key={r.teacherId + r.subjectId} r={r} />)}</div>
    </div>
  );
}

// -------------------------------------------------------------- editor
function Editor({ subjects, questionTypes, run }: { subjects: Subject[]; questionTypes: { id: string; label: string }[]; run: (fn: () => Promise<unknown>, ok: string) => Promise<void> }) {
  const [sel, setSel] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const subject = subjects.find((s) => s.id === sel) ?? null;
  useEffect(() => { if (!sel && subjects[0]) setSel(subjects[0].id); }, [subjects, sel]);
  const addSubject = () => {
    const id = slug(newName); if (!id) return;
    run(async () => { await saveSubject({ id, name: newName.trim(), icon: '📚', sort: subjects.length + 1, active: true }); setSel(id); setNewName(''); }, `Added ${newName.trim()}`);
  };
  return (
    <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
      <div>
        <div className="grid gap-1">
          {subjects.map((s) => (
            <button key={s.id} onClick={() => setSel(s.id)} className={`rounded-lg px-3 py-2 text-left text-sm font-semibold ${sel === s.id ? 'bg-secondary text-secondary-foreground' : 'border border-border'} ${s.active ? '' : 'opacity-50'}`}>
              {s.icon ?? '📚'} {s.name}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-1">
          <input className={`${inp} min-w-0 flex-1`} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New subject name" aria-label="New subject name" />
          <button className={btn} disabled={!slug(newName)} onClick={addSubject}>Add</button>
        </div>
      </div>
      {subject ? <SubjectEditor key={subject.id} subject={subject} questionTypes={questionTypes} run={run} onDeleted={() => setSel(null)} /> : <p className="text-sm text-muted-foreground">Choose or add a subject.</p>}
    </div>
  );
}

function SubjectEditor({ subject, questionTypes, run, onDeleted }: { subject: Subject; questionTypes: { id: string; label: string }[]; run: (fn: () => Promise<unknown>, ok: string) => Promise<void>; onDeleted: () => void }) {
  const [name, setName] = useState(subject.name), [icon, setIcon] = useState(subject.icon ?? ''), [active, setActive] = useState(subject.active);
  const [types, setTypes] = useState<string[]>(subject.questionTypes);
  const [paste, setPaste] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const parsed = useMemo(() => (paste.trim() ? parseTaxonomy(paste) : []), [paste]);
  const allSkillIds = useMemo(() => new Set(subject.domains.flatMap((d) => d.skills.map((s) => s.id))), [subject]);
  const domainIds = useMemo(() => new Set(subject.domains.map((d) => d.id)), [subject]);

  const importTax = () => run(async () => {
    const { domains, skills } = buildRows(subject.id, parsed, domainIds, allSkillIds, subject.domains.length + 1);
    for (const d of domains) await saveDomain(d);
    await saveSkills(skills);
    setPaste('');
  }, `Imported ${parsed.length} domains and ${parsed.reduce((n, d) => n + d.skills.length, 0)} skills`);

  return (
    <div className="grid gap-6">
      <div className="card-surface grid gap-3 p-4">
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-xs font-semibold text-muted-foreground">Name<input className={inp} value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="grid gap-1 text-xs font-semibold text-muted-foreground">Icon<input className={`${inp} w-20`} value={icon} onChange={(e) => setIcon(e.target.value)} /></label>
          <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active</label>
          <button className={btn} onClick={() => run(() => saveSubject({ id: subject.id, name: name.trim() || subject.name, icon: icon.trim() || null, sort: subject.sort, active }), 'Saved')}>Save</button>
          <button className={btn2} onClick={() => { if (confirm(`Delete ${subject.name} with all its skills? Questions keep their text but lose this tag.`)) run(async () => { await deleteSubject(subject.id); onDeleted(); }, 'Deleted'); }}>Delete subject</button>
        </div>
        <p className="text-xs text-muted-foreground">Id: {subject.id}</p>
      </div>

      <div className="card-surface p-4">
        <h3 className="font-display font-semibold text-primary">Question types allowed for {subject.name}</h3>
        <p className="text-xs text-muted-foreground">Teachers of this subject only see these types. If none is ticked, every type is allowed.</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {questionTypes.map((t) => (
            <label key={t.id} className="flex items-center gap-1 text-sm"><input type="checkbox" checked={types.includes(t.id)} onChange={(e) => setTypes(e.target.checked ? [...types, t.id] : types.filter((x) => x !== t.id))} /> {t.label}</label>
          ))}
        </div>
        <button className={`${btn} mt-3`} onClick={() => run(() => setSubjectQuestionTypes(subject.id, types), 'Question types saved')}>Save types</button>
      </div>

      <div className="card-surface p-4">
        <h3 className="font-display font-semibold text-primary">Domains and skills</h3>
        <div className="mt-3 grid gap-4">
          {subject.domains.map((d) => <DomainBlock key={d.id} domain={d} run={run} />)}
          {subject.domains.length === 0 && <p className="text-sm text-muted-foreground">No domains yet. Add one, or import a whole taxonomy below.</p>}
        </div>
        <div className="mt-4 flex gap-1">
          <input className={`${inp} flex-1`} value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="New domain (for example Algebra)" aria-label="New domain" />
          <button className={btn} disabled={!slug(newDomain)} onClick={() => run(async () => { await saveDomain({ id: `${subject.id}.${slug(newDomain)}`, subjectId: subject.id, name: newDomain.trim(), sort: subject.domains.length + 1 }); setNewDomain(''); }, 'Domain added')}>Add domain</button>
        </div>
      </div>

      <div className="card-surface p-4">
        <h3 className="font-display font-semibold text-primary">Import a taxonomy</h3>
        <p className="text-xs text-muted-foreground">Paste text in the same format as the English file: a <code>## 1. Domain Name Sub-Skills</code> heading, then lines like <code>* **Skill name:** what it covers</code>. Existing skills are kept; new ones are added.</p>
        <textarea className={`${inp} mt-2 h-40 w-full font-mono text-xs`} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={'## 1. Algebra Sub-Skills\n* **Linear equations:** Solve one-variable equations.'} aria-label="Taxonomy text" />
        {parsed.length > 0 && <p className="mt-1 text-xs text-muted-foreground">Found {parsed.length} domains and {parsed.reduce((n, d) => n + d.skills.length, 0)} skills.</p>}
        <button className={`${btn} mt-2`} disabled={parsed.length === 0} onClick={importTax}>Import</button>
      </div>
    </div>
  );
}

function DomainBlock({ domain, run }: { domain: Domain; run: (fn: () => Promise<unknown>, ok: string) => Promise<void> }) {
  const [name, setName] = useState(domain.name);
  const [sk, setSk] = useState(''), [desc, setDesc] = useState('');
  const addSkill = () => {
    const base = `${domain.id}.${slug(sk)}`; const ids = new Set(domain.skills.map((s) => s.id)); let id = base, n = 2; while (ids.has(id)) id = `${base}-${n++}`;
    const row: Skill = { id, domainId: domain.id, subjectId: domain.subjectId, name: sk.trim(), description: desc.trim() || null, sort: domain.skills.length + 1, active: true };
    run(async () => { await saveSkills([row]); setSk(''); setDesc(''); }, 'Skill added');
  };
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex gap-2">
        <input className={`${inp} flex-1 font-semibold`} value={name} onChange={(e) => setName(e.target.value)} aria-label="Domain name" />
        <button className={btn2} onClick={() => run(() => saveDomain({ id: domain.id, subjectId: domain.subjectId, name: name.trim() || domain.name, sort: domain.sort }), 'Saved')}>Save</button>
        <button className={btn2} onClick={() => { if (confirm(`Delete the domain ${domain.name} and its ${domain.skills.length} skills?`)) run(() => deleteDomain(domain.id), 'Domain deleted'); }}>Delete</button>
      </div>
      <ul className="mt-2 grid gap-1">
        {domain.skills.map((s) => <SkillRow key={s.id} skill={s} run={run} />)}
      </ul>
      <div className="mt-2 flex flex-wrap gap-1">
        <input className={`${inp} min-w-[140px] flex-1`} value={sk} onChange={(e) => setSk(e.target.value)} placeholder="New skill" aria-label="New skill name" />
        <input className={`${inp} min-w-[180px] flex-[2]`} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What it covers (optional)" aria-label="New skill description" />
        <button className={btn} disabled={!slug(sk)} onClick={addSkill}>Add skill</button>
      </div>
    </div>
  );
}

function SkillRow({ skill, run }: { skill: Skill; run: (fn: () => Promise<unknown>, ok: string) => Promise<void> }) {
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(skill.name), [desc, setDesc] = useState(skill.description ?? '');
  if (!edit) {
    return (
      <li className="flex items-start gap-2 text-sm">
        <span className="min-w-0 flex-1"><b className={skill.active ? '' : 'line-through opacity-60'}>{skill.name}</b>{skill.description ? <span className="text-muted-foreground"> — {skill.description}</span> : null}</span>
        <button className={btn2} onClick={() => setEdit(true)}>Edit</button>
        <button className={btn2} onClick={() => run(() => deleteSkill(skill.id), 'Skill deleted')}>Delete</button>
      </li>
    );
  }
  return (
    <li className="flex flex-wrap gap-1">
      <input className={`${inp} min-w-[140px] flex-1`} value={name} onChange={(e) => setName(e.target.value)} aria-label="Skill name" />
      <input className={`${inp} min-w-[180px] flex-[2]`} value={desc} onChange={(e) => setDesc(e.target.value)} aria-label="Skill description" />
      <button className={btn} onClick={() => run(async () => { await saveSkills([{ ...skill, name: name.trim() || skill.name, description: desc.trim() || null }]); setEdit(false); }, 'Saved')}>Save</button>
      <button className={btn2} onClick={() => setEdit(false)}>Cancel</button>
    </li>
  );
}
