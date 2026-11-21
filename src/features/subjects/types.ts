export interface Skill { id: string; domainId: string; subjectId: string; name: string; description: string | null; sort: number; active: boolean }
export interface Domain { id: string; subjectId: string; name: string; sort: number; skills: Skill[] }
export interface Subject { id: string; name: string; icon: string | null; sort: number; active: boolean; domains: Domain[]; questionTypes: string[] }
export interface QuestionTypeDef { id: string; label: string; sort: number }
export interface Catalog { subjects: Subject[]; questionTypes: QuestionTypeDef[] }

export type TeacherSubjectStatus = 'pending' | 'approved' | 'rejected';
export interface TeacherSubject { teacherId: string; subjectId: string; status: TeacherSubjectStatus; requestedAt: string; teacherName?: string; teacherEmail?: string }

/** What a question or content set is tagged with. */
export interface SubjectTags { subjectId: string | null; domainId: string | null; skillId: string | null }
export const NO_TAGS: SubjectTags = { subjectId: null, domainId: null, skillId: null };

export const COGNITIVE_LEVELS: { id: 'recall' | 'application' | 'analysis' | 'synthesis'; label: string; hint: string }[] = [
  { id: 'recall', label: 'Recall / Recognition', hint: 'Identify or retrieve stored facts or rules' },
  { id: 'application', label: 'Application / Execution', hint: 'Apply a rule or strategy to a standard case' },
  { id: 'analysis', label: 'Analysis / Disambiguation', hint: 'Break down structure or contrast options' },
  { id: 'synthesis', label: 'Synthesis / Evaluation', hint: 'Combine evidence, judge, infer' },
];
export type CognitiveLevel = (typeof COGNITIVE_LEVELS)[number]['id'];

/** What the tap-to-choose picker edits: one subject, any number of domains and skills (none = all). */
export interface Picks { subjectId: string | null; domainIds: string[]; skillIds: string[] }
export const NO_PICKS: Picks = { subjectId: null, domainIds: [], skillIds: [] };
export const tagsToPicks = (t: SubjectTags): Picks => ({ subjectId: t.subjectId, domainIds: t.domainId ? [t.domainId] : [], skillIds: t.skillId ? [t.skillId] : [] });
/** The database stores one domain and one skill. Several picked: the domain/skill is kept only when exactly one is chosen. */
export const picksToTags = (p: Picks, subject?: Subject): SubjectTags => {
  const skillId = p.skillIds.length === 1 ? p.skillIds[0] : null;
  const skillDomain = skillId ? subject?.domains.find((d) => d.skills.some((k) => k.id === skillId))?.id ?? null : null;
  return { subjectId: p.subjectId, domainId: p.domainIds.length === 1 ? p.domainIds[0] : skillDomain, skillId };
};
