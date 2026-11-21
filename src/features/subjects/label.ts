import type { Subject } from './types';

/** The label a game card shows: the chosen domain (Listening, Grammar...) when the game was tagged, otherwise the old format name. */
export function setLabel(subjects: Subject[], set: { skill: string; subjectId?: string | null; domainId?: string | null; domainIds?: string[]; skillId?: string | null }): string {
  if (!set.subjectId) return set.skill;
  const s = subjects.find((x) => x.id === set.subjectId);
  if (!s) return set.skill;
  const domId = set.domainIds?.[0] ?? set.domainId ?? s.domains.find((d) => d.skills.some((k) => k.id === set.skillId))?.id;
  const dom = s.domains.find((d) => d.id === domId);
  return dom ? (set.domainIds && set.domainIds.length > 1 ? `${dom.name} +${set.domainIds.length - 1}` : dom.name) : set.skill;
}
