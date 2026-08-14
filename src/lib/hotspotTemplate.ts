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
    const row = rows[i];
    const objectLabel = String(row[1] ?? '').trim();
    const locateHint = String(row[2] ?? '').trim();
    const question = String(row[4] ?? '').trim();
    const correctAnswer = String(row[7] ?? '').trim();

    const isBlankRow = !objectLabel && !locateHint && !question && !correctAnswer;
    if (isBlankRow) continue;

    if (!locateHint || !question || !correctAnswer) {
      errors.push(`Row ${i + 1} (${objectLabel || 'unnamed'}): needs at least a Locate Hint, Question, and Correct Answer - skipped.`);
      continue;
    }

    const rawMode = String(row[6] ?? '').trim().toLowerCase();
    const answerMode: AnswerMode = rawMode === 'choice' ? 'choice' : 'type';
    const choices = [row[8], row[9], row[10]]
      .map((c) => String(c ?? '').trim())
      .filter((c) => c.length > 0);

    items.push({
      id: Number.isFinite(Number(row[0])) ? Number(row[0]) : items.length + 1,
      objectLabel,
      locateHint,
      locateHintExtra: String(row[3] ?? '').trim(),
      question,
      questionHintExtra: String(row[5] ?? '').trim(),
      answerMode,
      correctAnswer,
      choices,
      xPercent: toFiniteOrNull(row[11]),
      yPercent: toFiniteOrNull(row[12]),
    });
  }

  if (items.length === 0 && errors.length === 0) {
    errors.push('No filled-in rows found. Fill in at least one object\'s Locate Hint, Question, and Correct Answer.');
  }

  return { template: { items }, errors };
}
