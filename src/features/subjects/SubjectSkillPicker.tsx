import { Link } from 'react-router-dom';
import type { Picks, Subject } from './types';

const lab = 'mb-1.5 block text-xs font-semibold text-muted-foreground';
const chip = (on: boolean) => `rounded-full border-2 px-3 py-1.5 text-sm font-semibold transition disabled:opacity-50 ${on ? 'border-secondary bg-secondary text-white' : 'border-border bg-card text-primary hover:border-secondary'}`;

/**
 * Tap-to-choose: subject, then domains (All, or one or more), then the skills of those domains.
 * `multi` lets several skills be chosen (AI game builder); otherwise one domain and one skill (a single question).
 * `subjects` is the list the user may use (see useSubjects().allowed).
 */
export function SubjectSkillPicker({ subjects, value, onChange, disabled, canRequest, multi }: {
  subjects: Subject[]; value: Picks; onChange: (v: Picks) => void; disabled?: boolean; canRequest?: boolean; multi?: boolean;
}) {
  if (subjects.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
        You have no subject yet. {canRequest ? <>Ask for one in <Link to="/teacher/subjects" className="font-semibold text-secondary underline">My subjects</Link>; an admin approves it.</> : 'Ask an admin to approve a subject for you.'}
      </p>
    );
  }
  const subject = subjects.find((s) => s.id === value.subjectId);
  const domains = subject?.domains.filter((d) => d.skills.some((k) => k.active) || true) ?? [];
  const shownDomains = value.domainIds.length ? domains.filter((d) => value.domainIds.includes(d.id)) : domains;
  const visible = new Set(shownDomains.flatMap((d) => d.skills.filter((k) => k.active).map((k) => k.id)));

  const pickSubject = (id: string) => onChange({ subjectId: id, domainIds: [], skillIds: [] });
  const pickDomain = (id: string | null) => {
    let ids: string[];
    if (id === null) ids = [];
    else if (value.domainIds.includes(id)) ids = value.domainIds.filter((x) => x !== id);
    else ids = multi ? [...value.domainIds, id] : [id];
    const keep = new Set((ids.length ? domains.filter((d) => ids.includes(d.id)) : domains).flatMap((d) => d.skills.map((k) => k.id)));
    onChange({ ...value, domainIds: ids, skillIds: value.skillIds.filter((k) => keep.has(k)) });
  };
  const pickSkill = (id: string) => {
    const has = value.skillIds.includes(id);
    onChange({ ...value, skillIds: has ? value.skillIds.filter((x) => x !== id) : multi ? [...value.skillIds, id] : [id] });
  };

  return (
    <div className="space-y-4">
      <div>
        <span className={lab}>Subject</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Subject">
          {subjects.map((s) => (
            <button key={s.id} type="button" disabled={disabled} aria-pressed={s.id === value.subjectId} className={chip(s.id === value.subjectId)} onClick={() => pickSubject(s.id)}>
              {s.icon ? `${s.icon} ` : ''}{s.name}
            </button>
          ))}
        </div>
      </div>

      {subject && (
        <div>
          <span className={lab}>Domain {multi ? '(all, or tap one or more)' : '(optional)'}</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Domain">
            <button type="button" disabled={disabled} aria-pressed={value.domainIds.length === 0} className={chip(value.domainIds.length === 0)} onClick={() => pickDomain(null)}>All domains</button>
            {domains.map((d) => (
              <button key={d.id} type="button" disabled={disabled} aria-pressed={value.domainIds.includes(d.id)} className={chip(value.domainIds.includes(d.id))} onClick={() => pickDomain(d.id)}>{d.name}</button>
            ))}
          </div>
        </div>
      )}

      {subject && visible.size > 0 && (
        <div>
          <span className={lab}>Skill {multi ? '(tap one or more, or none for the whole domain)' : '(optional)'}</span>
          <div className="space-y-3">
            {shownDomains.map((d) => {
              const ks = d.skills.filter((k) => k.active);
              if (!ks.length) return null;
              return (
                <div key={d.id}>
                  {shownDomains.length > 1 && <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{d.name}</p>}
                  <div className="flex flex-wrap gap-2" role="group" aria-label={`${d.name} skills`}>
                    {ks.map((k) => (
                      <button key={k.id} type="button" disabled={disabled} title={k.description ?? undefined} aria-pressed={value.skillIds.includes(k.id)} className={chip(value.skillIds.includes(k.id))} onClick={() => pickSkill(k.id)}>{k.name}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {multi && value.skillIds.length > 1 && <p className="mt-2 text-xs text-muted-foreground">All {value.skillIds.length} skills guide the AI prompt. The game is saved with a single skill tag only when exactly one is chosen.</p>}
        </div>
      )}
    </div>
  );
}
