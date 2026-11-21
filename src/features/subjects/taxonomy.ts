import type { Skill } from './types';

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export interface ParsedDomain { name: string; skills: { name: string; description: string }[] }

/**
 * Reads a taxonomy written like the English one:
 *   ## 1. Reading Comprehension Sub-Skills        (domain heading; number and "Sub-Skills" are dropped)
 *   * **Skill name:** what it covers             (one skill)
 * Headings with no skills (for example a cross-cutting tags section) are ignored.
 */
export function parseTaxonomy(text: string): ParsedDomain[] {
  const out: ParsedDomain[] = [];
  let cur: ParsedDomain | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const h = line.match(/^##\s+(?:\d+\.\s*)?(.+?)\s*$/);
    if (h && !line.startsWith('###')) {
      cur = { name: h[1].replace(/\s*sub-?skills\s*$/i, '').replace(/\s*\(.*?\)\s*$/, '').trim(), skills: [] };
      out.push(cur);
      continue;
    }
    const s = line.match(/^[*-]\s+\*\*(.+?):?\*\*:?\s*(.*)$/);
    if (s && cur) cur.skills.push({ name: s[1].replace(/:$/, '').trim(), description: s[2].trim() });
  }
  return out.filter((d) => d.skills.length > 0 && d.name);
}

/** Turn parsed domains into rows with stable ids, avoiding ids that already exist. */
export function buildRows(subjectId: string, parsed: ParsedDomain[], existingDomainIds: Set<string>, existingSkillIds: Set<string>, startSort = 1) {
  const domains: { id: string; subjectId: string; name: string; sort: number }[] = [];
  const skills: Skill[] = [];
  parsed.forEach((d, i) => {
    const dId = `${subjectId}.${slug(d.name) || `domain-${i + 1}`}`;
    if (!existingDomainIds.has(dId)) domains.push({ id: dId, subjectId, name: d.name, sort: startSort + i });
    d.skills.forEach((s, j) => {
      const base = `${dId}.${slug(s.name) || `skill-${j + 1}`}`;
      let id = base, n = 2;
      while (existingSkillIds.has(id) || skills.some((x) => x.id === id)) id = `${base}-${n++}`;
      skills.push({ id, domainId: dId, subjectId, name: s.name, description: s.description || null, sort: j + 1, active: true });
    });
  });
  return { domains, skills };
}
