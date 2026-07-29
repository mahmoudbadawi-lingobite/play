import * as XLSX from 'xlsx';
import type { ContentItem, SkillTemplate } from '../types';

const SKILL_INSTRUCTIONS: Record<SkillTemplate, string> = {
  vocabulary: 'Term = the word. Clue = its definition or a sentence with a blank (___) where the word goes.',
  grammar: 'Term = the correct answer. Clue = the sentence with a blank (___) to fill in.',
  reading: 'Term = the correct answer. Clue = the question about the passage/topic.',
  spelling: 'Term = the correctly spelled word. Clue = a short hint or the word read aloud description.',
};

const HEADERS = ['Term', 'Clue', 'Image URL (optional)'];

/**
 * Builds a downloadable .xlsx template for a given skill. Teachers fill this
 * out offline (in Excel, Google Sheets, Numbers, etc.) and upload it back.
 */
export function generateTemplate(skill: SkillTemplate): void {
  const wb = XLSX.utils.book_new();

  const instructionRows = [
    [`LingoBite Play - ${skill[0].toUpperCase()}${skill.slice(1)} template`],
    [SKILL_INSTRUCTIONS[skill]],
    ['Do not delete or reorder the header row below.'],
    [],
    HEADERS,
    ['example word', 'example clue text', ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet(instructionRows);
  ws['!cols'] = [{ wch: 24 }, { wch: 50 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Content');

  XLSX.writeFile(wb, `lingobite-play-${skill}-template.xlsx`);
}

export interface ParseResult {
  items: ContentItem[];
  errors: string[];
}

/**
 * Parses an uploaded filled-in template back into ContentItem[].
 * Skips the instruction rows automatically by locating the header row.
 */
export async function parseTemplateFile(file: File): Promise<ParseResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const errors: string[] = [];
  const headerRowIndex = rows.findIndex(
    (r) => typeof r[0] === 'string' && r[0].trim().toLowerCase() === 'term'
  );

  if (headerRowIndex === -1) {
    return { items: [], errors: ["Could not find the 'Term' header row - please use the downloaded template."] };
  }

  const items: ContentItem[] = [];
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    const term = String(row[0] ?? '').trim();
    const clue = String(row[1] ?? '').trim();
    const imageUrl = String(row[2] ?? '').trim();

    if (!term && !clue) continue; // blank row, skip silently
    if (!term || !clue) {
      errors.push(`Row ${i + 1}: both Term and Clue are required - skipped.`);
      continue;
    }
    items.push({
      id: `item-${i}-${Date.now()}`,
      term,
      clue,
      ...(imageUrl ? { imageUrl } : {}),
    });
  }

  if (items.length === 0) {
    errors.push('No valid rows found. Fill in at least one Term + Clue pair.');
  }

  return { items, errors };
}
