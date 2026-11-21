import { Link } from 'react-router-dom';
import type { Subject, SubjectTags } from './types';

const sel = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-secondary disabled:opacity-50';
const lab = 'mb-1 block text-xs font-semibold text-muted-foreground';

/**
 * Subject > domain > skill. `subjects` is the list the user may use (see useSubjects().allowed).
 * Subject is required; domain and skill narrow it down and are optional.
 */
export function SubjectSkillPicker({ subjects, value, onChange, disabled, canRequest }: {
  subjects: Subject[]; value: SubjectTags; onChange: (v: SubjectTags) => void; disabled?: boolean; canRequest?: boolean;
}) {
  if (subjects.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
        You have no subject yet. {canRequest ? <>Ask for one in <Link to="/teacher/subjects" className="font-semibold text-secondary underline">My subjects</Link>; an admin approves it.</> : 'Ask an admin to approve a subject for you.'}
      </p>
    );
  }
  const subject = subjects.find((s) => s.id === value.subjectId);
  const domain = subject?.domains.find((d) => d.id === value.domainId);
  const skills = (domain ? domain.skills : subject?.domains.flatMap((d) => d.skills) ?? []).filter((k) => k.active);
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div>
        <label className={lab}>Subject</label>
        <select className={sel} disabled={disabled} value={value.subjectId ?? ''}
          onChange={(e) => onChange({ subjectId: e.target.value || null, domainId: null, skillId: null })}>
          <option value="">Choose a subject…</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.icon ? `${s.icon} ` : ''}{s.name}</option>)}
        </select>
      </div>
      <div>
        <label className={lab}>Domain (optional)</label>
        <select className={sel} disabled={disabled || !subject} value={value.domainId ?? ''}
          onChange={(e) => onChange({ ...value, domainId: e.target.value || null, skillId: null })}>
          <option value="">All domains</option>
          {subject?.domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div>
        <label className={lab}>Skill (optional)</label>
        <select className={sel} disabled={disabled || !subject} value={value.skillId ?? ''}
          onChange={(e) => { const k = skills.find((x) => x.id === e.target.value); onChange({ ...value, skillId: k?.id ?? null, domainId: k?.domainId ?? value.domainId }); }}>
          <option value="">No specific skill</option>
          {skills.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
        </select>
      </div>
    </div>
  );
}
