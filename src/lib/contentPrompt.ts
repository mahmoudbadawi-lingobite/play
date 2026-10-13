import type { ContentItem, SkillTemplate } from '../types';

/**
 * AI-assisted content creation.
 *
 * Teachers pick a skill + title, copy a prompt into any AI chat (with their raw
 * material attached), and paste the reply back. `buildContentPrompt` writes the
 * prompt; `parseContentReply` turns whatever came back into ContentItem[].
 *
 * The prompt asks for ONE JSON code block (chat apps give those a reliable
 * "copy" button), but the parser is forgiving: it also understands a pasted
 * table (pipes or tabs) in case the AI ignores the format.
 */

export interface PromptOptions {
  skill: SkillTemplate;
  title: string;
  grade: number;
  count: number;
  subject: string;
  topic: string;
  /** Teacher will attach a file (worksheet, passage, word list...) to the AI chat. */
  hasAttachment: boolean;
  /** Words / notes typed straight into the app. */
  rawText: string;
}

export const SKILL_HELP: Record<SkillTemplate, string> = {
  vocabulary: 'Term = the word. Clue = a simple definition, or a sentence with a blank (___).',
  grammar: 'Term = the correct word/phrase. Clue = a sentence with a blank (___) to fill in.',
  reading: 'Term = a short correct answer. Clue = a question about the passage/topic.',
  spelling: 'Term = the correctly spelled word. Clue = a short hint or a sentence with a blank.',
};

const SKILL_RULES: Record<SkillTemplate, { term: string; clue: string; extra: string[] }> = {
  vocabulary: {
    term: 'the target word or short phrase students are learning.',
    clue: 'a child-friendly definition, OR a sentence with ___ where the word fits. Mix both styles.',
    extra: [
      'Good example: term "river" with clue "A large stream of water that flows to the sea" or "We crossed the ___ on a wooden bridge."',
    ],
  },
  grammar: {
    term: 'the exact word or phrase that correctly fills the blank.',
    clue: 'a complete sentence with ___ where the answer goes (add the base word in brackets if it helps, e.g. "Yesterday she ___ (go) to school.").',
    extra: [
      'Each sentence must have exactly ONE correct answer.',
      'Good example: term "went" with clue "Yesterday we ___ to the park."',
    ],
  },
  reading: {
    term: 'a short answer (1-4 words) that comes from the material.',
    clue: 'a question about the material.',
    extra: [
      'Every question must make sense on its own - students see one question at a time, so never say "in the text above" or "in paragraph 2".',
      'Good example: term "a red kite" with clue "What did Sam find on the roof?"',
    ],
  },
  spelling: {
    term: 'ONE correctly spelled word - letters only (no spaces, hyphens or apostrophes), ideally 3-10 letters.',
    clue: 'a short hint: the meaning of the word, or a sentence with ___ where it fits.',
    extra: ['Good example: term "necessary" with clue "Something you must have: it is ___ to wear a helmet."'],
  },
};

export function buildContentPrompt(o: PromptOptions): string {
  const rules = SKILL_RULES[o.skill];
  const subject = o.subject.trim() || 'English';
  const raw = o.rawText.trim();
  const age = o.grade + 5;

  let material: string;
  if (o.hasAttachment && raw) {
    material = `My teaching material (worksheet, textbook page, passage, word list, notes...) is attached to this chat. Read it first and base the items on it. Also use these words / notes:\n${raw}`;
  } else if (o.hasAttachment) {
    material = `My teaching material (worksheet, textbook page, passage, word list, notes...) is attached to this chat. Read it first and base every item on it. Do not add facts that the material does not support. If it contains more than ${o.count} possible items, choose the most important ones.`;
  } else if (raw) {
    material = `Base the items on this material. If it has more than ${o.count} entries choose the most important ones; if it has fewer, add closely related items of the same level.\n${raw}`;
  } else {
    material = `No material was provided - create age-appropriate content about the topic above.`;
  }

  return [
    `You are an experienced ${subject} teacher creating content for an educational game.`,
    '',
    'GAME',
    `Title: ${o.title.trim() || '[type a game title on the page first]'}`,
    `Skill: ${o.skill}`,
    `Students: Grade ${o.grade} (about ${age} years old)`,
    `Subject / language: ${subject}`,
    ...(o.topic.trim() ? [`Topic: ${o.topic.trim()}`] : []),
    `Number of items: exactly ${o.count}`,
    '',
    'SOURCE MATERIAL',
    material,
    '',
    'WHAT EACH ITEM CONTAINS',
    `• "term" - ${rules.term}`,
    `• "clue" - ${rules.clue}`,
    ...rules.extra.map((e) => `  ${e}`),
    '',
    'RULES',
    `• Create exactly ${o.count} items and make every "term" different from the others.`,
    '• Keep terms short (usually 1-3 words, never more than 30 characters), written exactly as a student should type or spell them. No numbering, bullets or trailing punctuation.',
    '• Never put the answer (the term) inside its own clue.',
    `• Use simple, clear language that suits Grade ${o.grade}. Keep each clue under about 120 characters.`,
    "• The game builds the wrong answer choices from the OTHER items' terms, so all terms in the set must be the same kind of thing (for example all animals, all past-tense verbs, or all place names) so the choices look believable.",
    '• Plain text only: no images, links, emojis or markdown inside the fields.',
    '• If a value contains a double quote, escape it as \\" so the JSON stays valid.',
    '',
    'OUTPUT FORMAT',
    'Reply with ONE code block containing valid JSON and absolutely nothing else - no greeting and no explanation before or after it. Use exactly this shape:',
    '',
    '```json',
    '{',
    '  "items": [',
    '    { "term": "<the answer>", "clue": "<the question or hint>" },',
    '    { "term": "<the answer>", "clue": "<the question or hint>" }',
    '  ]',
    '}',
    '```',
    '',
    `Add one object to "items" for each of the ${o.count} items.`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export interface ContentParseResult {
  items: ContentItem[];
  errors: string[];
  warnings: string[];
}

const MAX_ITEMS = 60;
const MAX_TERM = 80;
const MAX_CLUE = 400;

const TERM_KEYS = ['term', 'word', 'answer', 'target', 'correctanswer'];
const CLUE_KEYS = ['clue', 'definition', 'question', 'hint', 'prompt', 'sentence', 'meaning'];
const IMAGE_KEYS = ['imageurl', 'image'];

const normKey = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');

function looksLikePlaceholder(v: string): boolean {
  const s = v.trim();
  return s === '...' || s === '…' || (s.startsWith('<') && s.endsWith('>'));
}

function tidy(v: unknown, stripUnderscores: boolean): string {
  let s = String(v ?? '').replace(/[*`]+/g, '');
  if (stripUnderscores) s = s.replace(/^_+|_+$/g, '');
  return s.replace(/\s+/g, ' ').trim();
}

/** Repairs the most common ways chat apps break JSON (curly quotes, trailing commas). */
function repairJson(s: string): string {
  return s
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/,\s*([}\]])/g, '$1');
}

function tryParseJson(text: string): unknown {
  const candidates: string[] = [];
  const fence = /```[a-zA-Z]*\s*([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = fence.exec(text))) candidates.push(m[1]);
  candidates.push(text);
  const o1 = text.indexOf('{');
  const o2 = text.lastIndexOf('}');
  if (o1 >= 0 && o2 > o1) candidates.push(text.slice(o1, o2 + 1));
  const a1 = text.indexOf('[');
  const a2 = text.lastIndexOf(']');
  if (a1 >= 0 && a2 > a1) candidates.push(text.slice(a1, a2 + 1));

  for (const c of candidates) {
    for (const variant of [c.trim(), repairJson(c.trim())]) {
      try {
        const parsed: unknown = JSON.parse(variant);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch {
        // try the next candidate
      }
    }
  }
  return undefined;
}

function findArray(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[];
    }
  }
  return null;
}

type RawRow = { term: string; clue: string; imageUrl: string };

function rowFromJson(entry: unknown): RawRow | null {
  if (Array.isArray(entry) && entry.length >= 2) {
    return { term: String(entry[0] ?? ''), clue: String(entry[1] ?? ''), imageUrl: '' };
  }
  if (entry && typeof entry === 'object') {
    const map: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(entry as Record<string, unknown>)) map[normKey(k)] = v;
    const pick = (keys: string[]) => {
      for (const k of keys) if (map[k] !== undefined && map[k] !== null) return String(map[k]);
      return '';
    };
    return { term: pick(TERM_KEYS), clue: pick(CLUE_KEYS), imageUrl: pick(IMAGE_KEYS) };
  }
  return null;
}

function rowsFromTable(text: string): RawRow[] {
  const rows: RawRow[] = [];
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    let cells: string[] | null = null;
    if (line.startsWith('|') && line.endsWith('|')) {
      if (/^[\s|:-]+$/.test(line)) continue; // |---|---| separator
      cells = line.slice(1, -1).split('|').map((c) => c.trim());
    } else if (line.includes('\t')) {
      cells = line.split('\t').map((c) => c.trim());
    }
    if (!cells || cells.length < 2) continue;
    const keys = cells.map(normKey);
    if (keys.some((k) => TERM_KEYS.includes(k)) && keys.some((k) => CLUE_KEYS.includes(k))) continue; // header row
    if (cells.length >= 3 && /^\d+$/.test(cells[0])) cells = cells.slice(1);
    rows.push({ term: cells[0], clue: cells[1], imageUrl: cells[2] ?? '' });
  }
  return rows;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function parseContentReply(text: string, skill?: SkillTemplate): ContentParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const trimmed = text.trim();
  if (!trimmed) return { items: [], errors: [], warnings: [] };

  if (/OUTPUT FORMAT/.test(trimmed) && /SOURCE MATERIAL/.test(trimmed)) {
    return {
      items: [],
      errors: ["That looks like the prompt itself. Send the prompt to the AI, then paste the AI's reply here."],
      warnings,
    };
  }

  let rows: RawRow[] = [];
  const json = tryParseJson(trimmed);
  const arr = json ? findArray(json) : null;
  if (arr) {
    for (const entry of arr) {
      const row = rowFromJson(entry);
      if (row) rows.push(row);
    }
  }
  if (rows.length === 0) rows = rowsFromTable(trimmed);

  if (rows.length === 0) {
    return {
      items: [],
      errors: ["Couldn't find any items. Copy the AI's whole reply (the JSON code block) and paste it here."],
      warnings,
    };
  }

  const items: ContentItem[] = [];
  const seen = new Set<string>();
  const stamp = Date.now();
  let placeholders = 0;
  let incomplete = 0;
  let tooLong = 0;
  const duplicates: string[] = [];
  const leaks: string[] = [];
  let notSingleWord = 0;

  rows.forEach((row, i) => {
    const term = tidy(row.term, true);
    const clue = tidy(row.clue, false);
    if (!term && !clue) return;
    if (looksLikePlaceholder(term) || looksLikePlaceholder(clue)) {
      placeholders++;
      return;
    }
    if (!term || !clue) {
      incomplete++;
      return;
    }
    if (term.length > MAX_TERM || clue.length > MAX_CLUE) {
      tooLong++;
      return;
    }
    const key = term.toLowerCase();
    if (seen.has(key)) {
      duplicates.push(term);
      return;
    }
    seen.add(key);

    if (term.length >= 3) {
      const leak = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(term)}(?![\\p{L}\\p{N}])`, 'iu');
      if (leak.test(clue)) leaks.push(term);
    }
    if (skill === 'spelling' && !/^\p{L}+$/u.test(term)) notSingleWord++;

    const imageUrl = row.imageUrl.trim();
    items.push({
      id: `item-${i}-${stamp}`,
      term,
      clue,
      ...(/^https?:\/\//i.test(imageUrl) ? { imageUrl } : {}),
    });
  });

  if (placeholders > 0) {
    errors.push(
      'Some rows still contain placeholder text like <the answer> or "...". Make sure you pasted the AI\'s real reply, not the prompt.',
    );
  }
  if (incomplete > 0) warnings.push(`${incomplete} row(s) were skipped because the term or the clue was empty.`);
  if (tooLong > 0) warnings.push(`${tooLong} row(s) were skipped because they were too long for a term or clue.`);
  if (duplicates.length > 0) warnings.push(`Skipped duplicate term(s): ${duplicates.slice(0, 5).join(', ')}${duplicates.length > 5 ? '…' : ''}.`);
  if (leaks.length > 0) {
    warnings.push(`The clue contains its own answer for: ${leaks.slice(0, 5).join(', ')}${leaks.length > 5 ? '…' : ''}. Ask the AI to fix these, or keep them if that's intended.`);
  }
  if (notSingleWord > 0) warnings.push(`${notSingleWord} spelling term(s) are not single words (letters only), so they won't work as letter-bridge gates.`);

  if (items.length > MAX_ITEMS) {
    warnings.push(`Only the first ${MAX_ITEMS} items are used.`);
    items.length = MAX_ITEMS;
  }
  if (items.length > 0 && items.length < 5) {
    warnings.push('Some games need at least 5 items - 8 or more works best.');
  }
  if (items.length === 0 && errors.length === 0) {
    errors.push('No usable items were found in that text.');
  }

  return { items: errors.length > 0 ? [] : items, errors, warnings };
}
