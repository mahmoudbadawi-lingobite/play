import * as XLSX from 'xlsx';
import type { AnswerMode } from '../types';

/**
 * One clue "object" in an escape room template file.
 * `xPercent`/`yPercent` are optional - a teacher can fill the template by
 * hand (leaving them blank) or an AI vision prompt can estimate them after
 * being shown the background image. Either way, the teacher can still drag
 * the pin once it's imported into the editor.
 */
export interface TemplateItem {
  id: number;
  objectLabel: string;
  locateHint: string;
  locateHintExtra: string;
  question: string;
  questionHintExtra: string;
  answerMode: AnswerMode;
  correctAnswer: string;
  choices: string[];
  xPercent: number | null;
  yPercent: number | null;
}

export interface ParsedTemplate {
  items: TemplateItem[];
}

const HEADERS = [
  'Object #', 'Object Label', 'Locate Hint', 'Extra Locate Hint (if stuck)',
  'Question', 'Extra Answer Hint (if wrong)', 'Answer Mode (type/choice)',
  'Correct Answer', 'Wrong Option 1', 'Wrong Option 2', 'Wrong Option 3',
  'X Percent (0-100, optional)', 'Y Percent (0-100, optional)',
];

function toFiniteOrNull(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isFinite(n)) return Math.min(100, Math.max(0, n));
  return null;
}

/** True for obvious unfilled placeholder text like "...", "…", or
 * "<your story here>" - i.e. someone pasted the PROMPT (which contains
 * an example/skeleton showing the AI what format to reply in) instead of
 * the AI's actual filled-in reply. */
function looksLikePlaceholder(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (v === '...' || v === '…' || v === '-') return true;
  if (v.startsWith('<') && v.endsWith('>')) return true;
  return false;
}

/** Turns one row of 13 cells (in HEADERS order) into a TemplateItem, or
 * null if the row is entirely blank. Shared by both the .xlsx importer
 * and the pasted-text importer so they behave identically. */
function cellsToItem(cells: unknown[], fallbackId: number): { item: TemplateItem | null; error: string | null } {
  const objectLabel = String(cells[1] ?? '').trim();
  const locateHint = String(cells[2] ?? '').trim();
  const question = String(cells[4] ?? '').trim();
  const correctAnswer = String(cells[7] ?? '').trim();

  const isBlankRow = !objectLabel && !locateHint && !question && !correctAnswer;
  if (isBlankRow) return { item: null, error: null };

  if ([objectLabel, locateHint, question, correctAnswer].some(looksLikePlaceholder)) {
    return {
      item: null,
      error: 'That row still has placeholder text (like "...") instead of real content - make sure you copied the AI\'s actual reply, not the prompt you sent it or an unfilled template.',
    };
  }

  if (!locateHint || !question || !correctAnswer) {
    return { item: null, error: `"${objectLabel || 'unnamed object'}": needs at least a Locate Hint, Question, and Correct Answer - skipped.` };
  }

  const rawMode = String(cells[6] ?? '').trim().toLowerCase();
  const answerMode: AnswerMode = rawMode === 'choice' ? 'choice' : 'type';
  const choices = [cells[8], cells[9], cells[10]]
    .map((c) => String(c ?? '').trim())
    .filter((c) => c.length > 0);

  return {
    item: {
      id: Number.isFinite(Number(cells[0])) ? Number(cells[0]) : fallbackId,
      objectLabel,
      locateHint,
      locateHintExtra: String(cells[3] ?? '').trim(),
      question,
      questionHintExtra: String(cells[5] ?? '').trim(),
      answerMode,
      correctAnswer,
      choices,
      xPercent: toFiniteOrNull(cells[11]),
      yPercent: toFiniteOrNull(cells[12]),
    },
    error: null,
  };
}

/**
 * Builds a downloadable .xlsx template. Teachers fill this out offline
 * (in Excel, Google Sheets, Numbers, etc.) - by hand, or by pasting in a
 * table an AI produced in chat - then upload it back on the create/edit
 * escape room page.
 */
export function downloadHotspotTemplate(objectLabels: string[], answerMode: AnswerMode): void {
  const wb = XLSX.utils.book_new();

  const exampleChoices = answerMode === 'choice' ? ['wrong option A', 'wrong option B', 'wrong option C'] : ['', '', ''];
  const instructionRows: any[][] = [
    ['LingoBite Play - Escape Room clue template'],
    ['One row per hidden object, in the order students should find them.'],
    ['Leave X/Y Percent blank if you don\'t know it yet - you can drag the pin into place after uploading.'],
    ['Do not delete or reorder the header row below.'],
    [],
    HEADERS,
    [1, 'example: pink spiral seashell', 'a curled pink-and-white shell resting on the sand', 'look closer to the ground, near the stairs', 'Which spelling is correct?', 'think of a word that means "needed" or "required"', answerMode, 'necessary', ...exampleChoices, '', ''],
  ];

  const objects = objectLabels.length > 0 ? objectLabels : ['object 1'];
  for (let i = 0; i < objects.length; i++) {
    instructionRows.push([i + 1, objects[i], '', '', '', '', answerMode, '', '', '', '', '', '']);
  }

  const ws = XLSX.utils.aoa_to_sheet(instructionRows);
  ws['!cols'] = [
    { wch: 8 }, { wch: 26 }, { wch: 40 }, { wch: 34 }, { wch: 34 }, { wch: 30 },
    { wch: 16 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Clues');

  XLSX.writeFile(wb, 'escape-room-clue-template.xlsx');
}

export interface ParseResult {
  template: ParsedTemplate;
  errors: string[];
}

/**
 * Parses an uploaded, filled-in .xlsx template back into TemplateItem[].
 * Skips the instruction rows automatically by locating the header row.
 */
export async function parseHotspotTemplateFile(file: File): Promise<ParseResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const headerRowIndex = rows.findIndex(
    (r) => typeof r[0] === 'string' && r[0].trim().toLowerCase() === 'object #'
  );

  if (headerRowIndex === -1) {
    return {
      template: { items: [] },
      errors: ["Could not find the header row - please use the downloaded template and don't rearrange its columns."],
    };
  }

  const errors: string[] = [];
  const items: TemplateItem[] = [];

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const { item, error } = cellsToItem(rows[i], items.length + 1);
    if (error) errors.push(`Row ${i + 1} ${error}`);
    if (item) items.push(item);
  }

  if (items.length === 0 && errors.length === 0) {
    errors.push('No filled-in rows found. Fill in at least one object\'s Locate Hint, Question, and Correct Answer.');
  }

  return { template: { items }, errors };
}

/**
 * Parses a pasted markdown/pipe-delimited table (the format the AI prompt
 * asks for) directly, no file needed. Tolerant of a leading title/prose
 * before the table and a "|---|---|" separator row.
 */
export function parseCluesTableText(text: string): ParseResult {
  const tableLines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|') && l.endsWith('|'));

  if (tableLines.length === 0) {
    return {
      template: { items: [] },
      errors: ['No table found in the pasted text - make sure you copied the AI\'s entire reply, including the clue table.'],
    };
  }

  const rows = tableLines.map((l) => l.slice(1, -1).split('|').map((c) => c.trim()));
  const headerRowIndex = rows.findIndex((r) => /object\s*#/i.test(r[0] ?? ''));

  if (headerRowIndex === -1) {
    return {
      template: { items: [] },
      errors: ['Found a table, but not the expected header row - please paste the AI\'s reply unedited.'],
    };
  }

  const isSeparatorRow = (r: string[]) => r.every((c) => /^:?-{2,}:?$/.test(c) || c === '');

  const errors: string[] = [];
  const items: TemplateItem[] = [];

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (isSeparatorRow(row)) continue;
    const { item, error } = cellsToItem(row, items.length + 1);
    if (error) errors.push(error);
    if (item) items.push(item);
  }

  if (items.length === 0 && errors.length === 0) {
    errors.push('No usable rows found in that table.');
  }

  return { template: { items }, errors };
}

export interface CombinedReplyResult {
  story: string;
  clues: ParseResult;
  errors: string[];
}

/**
 * Splits and parses a single AI reply that contains both the story intro
 * (after a "STORY:" marker) and the clue table (after a "CLUES:" marker) -
 * the format the merged Step 2 prompt asks for. Falls back gracefully if
 * a marker is missing so a partial paste still recovers what it can.
 */
/** Normalizes a line for marker matching - strips markdown bold/heading
 * characters and surrounding whitespace so "**STORY:**" or "## Story:"
 * still match, without accidentally matching the word "story" appearing
 * mid-sentence elsewhere in the AI's reply. */
function normalizeMarkerLine(line: string): string {
  return line.trim().replace(/^[#*_\s]+|[#*_\s]+$/g, '').toUpperCase();
}

export function parseStoryAndCluesReply(raw: string): CombinedReplyResult {
  const errors: string[] = [];
  const lines = raw.split('\n');

  const storyLineIdx = lines.findIndex((l) => normalizeMarkerLine(l) === 'STORY:' || normalizeMarkerLine(l) === 'STORY');
  const cluesLineIdx = lines.findIndex((l) => normalizeMarkerLine(l) === 'CLUES:' || normalizeMarkerLine(l) === 'CLUES');

  let story = '';
  if (storyLineIdx !== -1) {
    const end = cluesLineIdx !== -1 && cluesLineIdx > storyLineIdx ? cluesLineIdx : lines.length;
    story = lines.slice(storyLineIdx + 1, end).join('\n').trim();
  }
  if (!story) {
    errors.push('Could not find a "STORY:" section - paste the AI\'s reply exactly as it sent it, unedited.');
  } else if (looksLikePlaceholder(story)) {
    errors.push('The "STORY:" section still has placeholder text instead of a real story - make sure you copied the AI\'s actual reply, not the prompt you sent it or an unfilled template.');
    story = '';
  }

  const cluesText = cluesLineIdx !== -1 ? lines.slice(cluesLineIdx + 1).join('\n').trim() : raw;
  const clues = parseCluesTableText(cluesText);
  return { story, clues, errors };
}
