export interface Skill { id: string; domainId: string; subjectId: string; name: string; description: string | null; sort: number; active: boolean }
export interface Domain { id: string; subjectId: string; name: string; sort: number; skills: Skill[] }
export interface Subject { id: string; name: string; icon: string | null; sort: number; active: boolean; domains: Domain[]; questionTypes: string[];
  /** 'en' | 'ar'. undefined until subjects_grade_language_patch.sql has been run. */ language?: 'en' | 'ar'; parentId?: string | null }
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
/** Rebuild picks from a stored row. The arrays (skill_ids / domain_ids) win; rows saved before they existed fall back to the single columns. */
export const rowToPicks = (r: { subjectId: string | null; domainId?: string | null; skillId?: string | null; domainIds?: string[] | null; skillIds?: string[] | null }): Picks => ({
  subjectId: r.subjectId,
  domainIds: r.domainIds?.length ? r.domainIds : r.domainId ? [r.domainId] : [],
  skillIds: r.skillIds?.length ? r.skillIds : r.skillId ? [r.skillId] : [],
});
/** The single columns hold the FIRST skill and its domain (older screens and reports read these). */
export const picksToTags = (p: Picks, subject?: Subject): SubjectTags => {
  const skillId = p.skillIds[0] ?? null;
  const skillDomain = skillId ? subject?.domains.find((d) => d.skills.some((k) => k.id === skillId))?.id ?? null : null;
  return { subjectId: p.subjectId, domainId: skillDomain ?? p.domainIds[0] ?? null, skillId };
};
/** Every picked skill, plus every domain picked or implied by a picked skill. */
export const picksToArrays = (p: Picks, subject?: Subject): { domainIds: string[]; skillIds: string[] } => {
  const implied = (subject?.domains ?? []).filter((d) => d.skills.some((k) => p.skillIds.includes(k.id))).map((d) => d.id);
  return { domainIds: Array.from(new Set([...p.domainIds, ...implied])), skillIds: p.skillIds };
};

/** Which of the four game formats (how the items are built) fits the chosen domain/skill. null = no opinion, keep the current format. */
export const suggestFormat = (p: Picks, subject?: Subject): 'vocabulary' | 'grammar' | 'reading' | 'spelling' | null => {
  if (!subject) return null;
  const skill = subject.domains.flatMap((d) => d.skills).find((k) => k.id === p.skillIds[0]);
  const dom = subject.domains.find((d) => d.id === (skill?.domainId ?? p.domainIds[0]));
  const text = `${skill?.name ?? ''} ${dom?.name ?? ''}`.toLowerCase();
  if (/spell|mechanic|punctuat|إملاء/.test(text)) return 'spelling';
  if (/vocab|lexi|word|collocation|idiom|مفردات|ترادف|تضاد/.test(text)) return 'vocabulary';
  if (/grammar|syntax|tense|clause|قواعد|نحو|صرف/.test(text)) return 'grammar';
  if (/read|comprehension|listen|قراءة|استماع/.test(text)) return 'reading';
  return null;
};
