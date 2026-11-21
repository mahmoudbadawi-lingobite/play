import type { Picks, Subject } from '../subjects/types';

/**
 * The AI prompt for Monster Quest questions. The teacher picks subject / domain / skills and the kinds of question,
 * pastes (or attaches) the material, copies this prompt into any AI chat and pastes the reply back.
 * The reply is a JSON list in the same shape the Question Bank import already reads.
 */
export interface QuestionPromptOptions {
  subject: string;
  domains: string[];
  skills: { name: string; hint?: string | null }[];
  types: string[];
  count: number;
  difficulty: number;
  grade: number | null;
  topic: string;
  material: string;
  hasAttachment: boolean;
}

const TYPE_RULES: Record<string, string> = {
  mcq: 'mcq: prompt = the question; options = 3-4 choices joined by | ; answer = EXACTLY one of the options. Only one option may be correct; the others must be plausible but clearly wrong.',
  true_false: 'true_false: prompt = a statement; options = ""; answer = True or False.',
  fill_blank: 'fill_blank: prompt = one sentence with ___ for the missing word(s), optionally the base word in brackets; options = ""; answer = the missing word(s) (alternative correct answers separated by |).',
  type_answer: 'type_answer: prompt = a short question with ONE short typed answer; options = ""; answer = the answer (accepted alternatives separated by |).',
  spelling: 'spelling: prompt = "Listen and spell the word."; tts_text = the word (it is read aloud); options = ""; answer = the correctly spelled word.',
  sentence_order: 'sentence_order: prompt = "Put the words in order."; options = ""; answer = the correct sentence (the app shuffles the words).',
  word_match: 'word_match: prompt = "Match each word with its meaning."; options = ""; answer = 3-5 pairs written a=b|c=d (every right-hand side different).',
  reading: 'reading: ONE short passage per question. passage = 3-5 sentences cut from the material (the exact wording); prompt = ONE question that can be answered from that passage only; options = 3-4 choices joined by | ; answer = EXACTLY one of the options.',
  listening: [
    'listening (audio + choices) - THIS IS A LISTENING TRACK ACTIVITY:',
    '  * Cut the material into consecutive CHUNKS of 2-3 sentences (about 25-45 words), in story order, covering the whole material.',
    '  * Each chunk becomes exactly ONE question: tts_text = the chunk, word for word (the app reads it aloud - no stage directions, no "Question:", no numbering); prompt = ONE question about that chunk only, answerable by listening; options = 3-4 choices joined by | ; answer = EXACTLY one of the options.',
    '  * Do NOT copy the chunk into the prompt and leave passage empty - the student must listen, not read.',
    '  * Keep names and dialogue as written. Mix question kinds across chunks: main idea, a detail, who said it, why, what happens next.',
  ].join('\n'),
};

export function buildQuestionPrompt(o: QuestionPromptOptions): string {
  const types = o.types.length ? o.types : ['mcq'];
  const listening = types.includes('listening');
  const out: string[] = [];
  out.push(`You are writing quiz questions for the game Monster Quest. Subject: ${o.subject}.`);
  if (o.domains.length) out.push(`Area: ${o.domains.join(', ')}`);
  if (o.skills.length) {
    out.push(`Skills to test: ${o.skills.map((k) => (k.hint ? `${k.name} (${k.hint})` : k.name)).join('; ')}`);
    out.push(o.skills.length > 1 ? 'Spread the questions across these skills. Every question must test one of them, not just the general topic.' : 'Every question must test this specific skill, not just the general topic.');
  }
  out.push(`Question types allowed: ${types.join(', ')}.`);
  out.push(`Difficulty: ${o.difficulty} on a 1-5 scale${o.grade ? `; learners are around grade ${o.grade}` : ''}. Language level must suit the learners.`);
  if (o.topic.trim()) out.push(`Topic: ${o.topic.trim()}`);
  out.push(listening
    ? `How many: one question per chunk of the material, up to ${o.count} questions in total (stop earlier if the material ends).`
    : `How many: ${o.count} questions.`);
  out.push('', 'SOURCE MATERIAL');
  if (o.hasAttachment) out.push('(The material is attached to this chat as a file or image. Read it first, including text inside images. Use ONLY that material. Ignore exercise answers or handwriting already on the page.)');
  if (o.material.trim()) out.push(o.material.trim());
  if (!o.hasAttachment && !o.material.trim()) out.push('(No material given: write original content that suits the subject, skills and level.)');
  out.push('', 'HOW EACH TYPE MUST LOOK');
  types.forEach((t) => out.push(TYPE_RULES[t] ?? `${t}: prompt = the question; answer = the correct answer.`));
  out.push('', 'OUTPUT FORMAT',
    'Reply with ONE JSON code block and nothing else: a list of objects with exactly these keys:',
    '{ "type": "...", "prompt": "...", "options": "a|b|c|d", "answer": "...", "explanation": "one short sentence on why the answer is right", "topic": "short topic label", "difficulty": 1, "tts_text": "", "passage": "" }',
    'Rules: options is ONE string with choices separated by | (empty string when the type has none); difficulty is a number 1-5; use empty strings for keys that do not apply; no markdown inside values; no duplicate questions; check that every answer is really correct before replying.');
  return out.join('\n');
}

/** Pull the list of question rows out of whatever the AI sent back (code block, bare JSON, or {"questions":[...]}). */
export function parseQuestionReply(text: string): { rows: Record<string, any>[]; error?: string } {
  const t = text.trim();
  if (!t) return { rows: [] };
  if (/SOURCE MATERIAL/.test(t) && /OUTPUT FORMAT/.test(t)) return { rows: [], error: "That looks like the prompt itself. Send the prompt to the AI, then paste the AI's reply here." };
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let body = (fenced ? fenced[1] : t).trim();
  const a = body.indexOf('['), b = body.lastIndexOf(']'), c = body.indexOf('{');
  if (a >= 0 && b > a && (c < 0 || a < c)) body = body.slice(a, b + 1);
  try {
    const j = JSON.parse(body);
    const list: any[] = Array.isArray(j) ? j : Array.isArray(j?.questions) ? j.questions : [];
    if (!list.length) return { rows: [], error: 'No questions found in that reply.' };
    return { rows: list.filter((x) => x && typeof x === 'object').map((x) => ({ ...x, options: Array.isArray(x.options) ? x.options.join('|') : x.options ?? '' })) };
  } catch {
    return { rows: [], error: 'Could not read that reply as JSON. Ask the AI to "reply with the JSON code block only", then paste it again.' };
  }
}

/** Sensible starting question types for the chosen domain / skills. */
export function defaultTypes(p: Picks, subject?: Subject): string[] {
  if (!subject) return ['mcq'];
  const skill = subject.domains.flatMap((d) => d.skills).find((k) => k.id === p.skillIds[0]);
  const dom = subject.domains.find((d) => d.id === (skill?.domainId ?? p.domainIds[0]));
  const text = `${dom?.name ?? ''} ${skill?.name ?? ''}`.toLowerCase();
  if (/listen/.test(text)) return ['listening'];
  if (/speak|pronunc/.test(text)) return ['listening', 'mcq'];
  if (/read|comprehension/.test(text)) return ['reading'];
  if (/spell|mechanic|punctuat/.test(text)) return ['spelling', 'sentence_order', 'mcq'];
  if (/writ|composition|paragraph/.test(text)) return ['sentence_order', 'mcq'];
  if (/vocab|lexi|word|collocation|idiom/.test(text)) return ['mcq', 'fill_blank', 'word_match'];
  if (/grammar|syntax|tense|clause/.test(text)) return ['fill_blank', 'mcq', 'sentence_order'];
  return ['mcq'];
}
