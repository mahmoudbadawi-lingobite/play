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
  question: string;
  answerMode: AnswerMode;
  correctAnswer: string;
  choices: string[];
  xPercent: number | null;
  yPercent: number | null;
}

export interface ParsedTemplate {
  items: TemplateItem[];
}

const VALID_ANSWER_MODES: AnswerMode[] = ['type', 'choice'];

function toFiniteOrNull(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isFinite(n)) {
    return Math.min(100, Math.max(0, n));
  }
  return null;
}

function coerceItem(raw: any, index: number): TemplateItem {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`Item #${index + 1} in the file is not a valid object.`);
  }
  const answerMode: AnswerMode = VALID_ANSWER_MODES.includes(raw.answerMode) ? raw.answerMode : 'type';
  const choices = Array.isArray(raw.choices)
    ? raw.choices.filter((c: unknown) => typeof c === 'string' && c.trim().length > 0).map((c: string) => c.trim())
    : [];

  return {
    id: Number.isFinite(Number(raw.id)) ? Number(raw.id) : index + 1,
    objectLabel: typeof raw.objectLabel === 'string' ? raw.objectLabel.trim() : '',
    locateHint: typeof raw.locateHint === 'string' ? raw.locateHint.trim() : '',
    question: typeof raw.question === 'string' ? raw.question.trim() : '',
    answerMode,
    correctAnswer: typeof raw.correctAnswer === 'string' ? raw.correctAnswer.trim() : '',
    choices,
    xPercent: toFiniteOrNull(raw.xPercent),
    yPercent: toFiniteOrNull(raw.yPercent),
  };
}

/**
 * Parses and validates a template JSON string uploaded by a teacher (either
 * hand-filled from the blank template, or pasted from an AI's reply).
 * Throws a user-friendly Error if the file isn't usable.
 */
export function parseHotspotTemplate(raw: string): ParsedTemplate {
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('That file is not valid JSON. Make sure you saved the AI\'s full reply (or the downloaded template) without extra text around it.');
  }

  const itemsRaw = Array.isArray(data) ? data : data?.items;
  if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
    throw new Error('No "items" array was found in that file.');
  }

  return { items: itemsRaw.map((item, i) => coerceItem(item, i)) };
}

/**
 * Builds a blank starter template from a plain list of object labels
 * (e.g. the vocabulary/grammar/reading/spelling lines a teacher already
 * typed into the prompt generator), so a teacher who isn't using AI can
 * still fill everything in one file instead of the on-image form.
 */
export function buildBlankTemplate(objectLabels: string[], answerMode: AnswerMode): ParsedTemplate {
  return {
    items: objectLabels.map((label, i) => ({
      id: i + 1,
      objectLabel: label,
      locateHint: '',
      question: '',
      answerMode,
      correctAnswer: '',
      choices: answerMode === 'choice' ? ['', '', ''] : [],
      xPercent: null,
      yPercent: null,
    })),
  };
}

export function templateToJSONString(template: ParsedTemplate): string {
  return JSON.stringify(template, null, 2);
}

export function downloadTemplateFile(template: ParsedTemplate, filename = 'escape-room-template.json') {
  const blob = new Blob([templateToJSONString(template)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
