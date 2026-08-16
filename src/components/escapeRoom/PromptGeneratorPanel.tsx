import { useState } from 'react';
import { ESCAPE_ROOM_THEMES } from '../../games/escapeRoomThemes';
import { downloadHotspotTemplate, parseStoryAndCluesReply, type TemplateItem } from '../../lib/hotspotTemplate';
import type { AnswerMode } from '../../types';

const TEXT_AI_SHORTCUTS: AiShortcut[] = [
  { label: 'ChatGPT', url: 'https://chat.openai.com' },
  { label: 'Gemini', url: 'https://gemini.google.com/app' },
  { label: 'Claude', url: 'https://claude.ai/new' },
];

const IMAGE_AI_SHORTCUTS: AiShortcut[] = [
  { label: 'Leonardo.ai', url: 'https://app.leonardo.ai' },
  { label: 'ChatGPT', url: 'https://chat.openai.com' },
  { label: 'Gemini', url: 'https://gemini.google.com/app' },
];

const THEMES = ESCAPE_ROOM_THEMES;

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

type QuestionCategory = 'Vocabulary' | 'Grammar' | 'Reading' | 'Spelling' | 'Word formation' | 'Pronunciation';

const QUESTION_CATEGORIES: QuestionCategory[] = ['Vocabulary', 'Grammar', 'Reading', 'Spelling', 'Word formation', 'Pronunciation'];

const QUESTION_TYPES_BY_CATEGORY: Record<QuestionCategory, { label: string; value: string }[]> = {
  Vocabulary: [
    { label: 'Meaning', value: 'What does this word mean? (multiple choice)' },
    { label: 'Synonym', value: 'Choose the word with the same meaning. (multiple choice)' },
    { label: 'Antonym', value: 'Choose the word with the opposite meaning. (multiple choice)' },
    { label: 'Fill in the blank', value: 'Complete the sentence with the correct word. (typed answer)' },
    { label: 'Definition match', value: 'Which definition matches this word? (multiple choice)' },
    { label: 'Use in a sentence', value: 'Which sentence uses this word correctly? (multiple choice)' },
    { label: 'Word category', value: 'Which category does this word belong to? (multiple choice)' },
    { label: 'Picture match', value: 'Which picture matches this word? (multiple choice)' },
  ],
  Grammar: [
    { label: 'Fill in the blank', value: 'Complete the sentence with the correct verb form. (typed answer)' },
    { label: 'Error correction', value: 'Find and correct the grammar mistake in this sentence. (typed answer)' },
    { label: 'Correct structure', value: 'Choose the grammatically correct sentence. (multiple choice)' },
    { label: 'Sentence reordering', value: 'Put the words in the correct order to form a sentence. (typed answer)' },
    { label: 'Verb tense', value: 'Choose the correct tense for this sentence. (multiple choice)' },
    { label: 'Sentence transformation', value: 'Rewrite the sentence as instructed (e.g. active to passive). (typed answer)' },
    { label: 'True/False', value: 'Is this sentence grammatically correct? True or False. (multiple choice)' },
  ],
  Reading: [
    { label: 'Comprehension', value: 'What does this object tell us about the passage? (multiple choice)' },
    { label: 'Main idea', value: 'What is the main idea here? (multiple choice)' },
    { label: 'True/False', value: 'Is this statement true or false based on the text? (multiple choice)' },
    { label: 'Detail question', value: 'According to the text, what happened here? (multiple choice)' },
    { label: 'Inference', value: 'What can you infer from this? (multiple choice)' },
    { label: 'Sequencing', value: 'What happened first/next in the passage? (multiple choice)' },
  ],
  Spelling: [
    { label: 'Correct spelling', value: 'Which spelling is correct? (multiple choice)' },
    { label: 'Missing letters', value: 'Fill in the missing letters. (typed answer)' },
    { label: 'Unscramble', value: 'Unscramble the letters to form the word. (typed answer)' },
    { label: 'Find the mistake', value: 'Which word is spelled incorrectly? (multiple choice)' },
    { label: 'Type the word', value: 'Type the word correctly after hearing/seeing a hint. (typed answer)' },
  ],
  'Word formation': [
    { label: 'Correct form', value: 'Choose the correct form of the word. (multiple choice)' },
    { label: 'Fill in the blank', value: 'Complete the sentence with the correct word form. (typed answer)' },
    { label: 'Part of speech', value: 'What part of speech is needed here? (multiple choice)' },
  ],
  Pronunciation: [
    { label: 'Stress', value: 'Which syllable is stressed? (multiple choice)' },
    { label: 'Odd one out', value: 'Which word has a different sound from the others? (multiple choice)' },
    { label: 'Rhyme', value: 'Which word rhymes with this one? (multiple choice)' },
  ],
};

function buildElementsBlock(vocab: string, grammar: string, reading: string, spelling: string): string {
  const sections: string[] = [];
  const toBullets = (text: string) =>
    text.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => `- ${l}`).join('\n');

  if (vocab.trim()) sections.push(`Vocabulary\n${toBullets(vocab)}`);
  if (grammar.trim()) sections.push(`Grammar\n${toBullets(grammar)}`);
  if (reading.trim()) sections.push(`Reading\n${toBullets(reading)}`);
  if (spelling.trim()) sections.push(`Spelling\n${toBullets(spelling)}`);
  return sections.join('\n\n');
}

// Flat, ordered list of every element line across all four categories -
// this is the list of "objects" the AI must hide in the scene and the
// order used to number them (1, 2, 3...) in the template/JSON output.
function collectElementLines(vocab: string, grammar: string, reading: string, spelling: string): string[] {
  const lines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean);
  return [...lines(vocab), ...lines(grammar), ...lines(reading), ...lines(spelling)];
}

function answerModeFromQuestionType(value: string): AnswerMode {
  return value.toLowerCase().includes('typed answer') ? 'type' : 'choice';
}

const ANSWER_FORMATS: { label: string; value: AnswerMode }[] = [
  { label: 'Multiple choice', value: 'choice' },
  { label: 'Fill in the blank', value: 'type' },
];

/** Question types for a category, narrowed to the chosen answer format.
 * Falls back to the full list if that category has no options in the
 * chosen format (e.g. Reading currently has no typed-answer types), so
 * the picker never ends up empty. */
function getQuestionTypesForFormat(category: QuestionCategory, format: AnswerMode) {
  const all = QUESTION_TYPES_BY_CATEGORY[category];
  const filtered = all.filter((q) => answerModeFromQuestionType(q.value) === format);
  return { types: filtered.length > 0 ? filtered : all, usedFallback: filtered.length === 0 };
}

interface AiShortcut {
  label: string;
  url: string;
}

function CopyBox({ label, text, shortcuts }: { label: string; text: string; shortcuts?: AiShortcut[] }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleShortcut = (url: string) => {
    navigator.clipboard.writeText(text);
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  return (
    <div className="mt-4">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-primary">{label}</p>
        <button onClick={handleCopy} className="rounded-lg bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground hover:opacity-90">
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <textarea readOnly value={text} rows={8} className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 font-mono text-xs text-primary" />
      {shortcuts && shortcuts.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="self-center text-xs text-muted-foreground">Open in:</span>
          {shortcuts.map((s) => (
            <button
              key={s.label}
              onClick={() => handleShortcut(s.url)}
              title={`Copies this prompt and opens ${s.label} - paste it there once the tab opens`}
              className="rounded-full border border-border px-3 py-1 text-xs font-medium text-primary hover:border-secondary"
            >
              {s.label} ↗
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PromptGeneratorPanel({ onImportStory, onImportClues }: {
  onImportStory?: (story: string) => void;
  onImportClues?: (items: TemplateItem[]) => void;
}) {
  const [theme, setTheme] = useState(THEMES[0]);
  const [customTheme, setCustomTheme] = useState('');
  const [useCustomTheme, setUseCustomTheme] = useState(false);
  const [grade, setGrade] = useState(5);
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCategory, setQuestionCategory] = useState<QuestionCategory>('Vocabulary');
  const [answerFormat, setAnswerFormat] = useState<AnswerMode>('choice');
  const [questionType, setQuestionType] = useState(getQuestionTypesForFormat('Vocabulary', 'choice').types[0]);
  const [lessonTopic, setLessonTopic] = useState('');
  const [vocab, setVocab] = useState('');
  const [grammar, setGrammar] = useState('');
  const [reading, setReading] = useState('');
  const [spelling, setSpelling] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [pasteStatus, setPasteStatus] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const effectiveTheme = useCustomTheme ? customTheme : theme;
  const level = `Grade ${grade} students`;
  const questionTypesForCurrentSelection = getQuestionTypesForFormat(questionCategory, answerFormat);
  const elementsBlock = buildElementsBlock(vocab, grammar, reading, spelling);

  const imagePrompt = `You are an award-winning educational game designer and cinematic digital artist.

Your task is to create a highly detailed Escape Room background for students learning English.

The image should be visually stunning, realistic (or semi-realistic if appropriate), high-resolution (4K), brightly lit, colorful, and full of interesting details that encourage exploration.

IMPORTANT RULES

• Create ONE single scene only.
• The scene must naturally contain all required learning elements.
• Every learning element must be clearly visible but blended naturally into the environment.
• Do NOT label, highlight, circle, number, or point to any element.
• Do NOT include any written questions, answers, letters, numbers, or explanatory text inside the image.
• Every object should look like it genuinely belongs in the scene.
• Make the scene feel like a mystery that students want to investigate.
• The atmosphere should be adventurous, magical, exciting, and suitable for students.
• Leave enough open space so students can click different objects easily.
• Avoid clutter and overlapping important objects.

SCENE

Theme:
${effectiveTheme || '[choose a theme above]'}

LEARNING ELEMENTS

Naturally hide these objects inside the scene, spread across DIFFERENT areas of the image (foreground, background, left, right, center) - keep them clearly separated from one another rather than clustered together in one corner, so each one is easy to tell apart from the others:

${elementsBlock || '[add vocabulary/grammar/reading/spelling items below]'}

Difficulty:
${difficulty}

IMAGE STYLE

Ultra detailed
4K
Cinematic lighting
Educational
Adventure game
High realism
Sharp focus
Rich colors
Professional digital illustration
Wide angle
Highly immersive
No text
No labels
No watermarks`;

  const elementLines = collectElementLines(vocab, grammar, reading, spelling);
  const answerMode = answerModeFromQuestionType(questionType.value);
  const isChoice = answerMode === 'choice';

  const storyAndCluesPrompt = `You are an educational escape-room designer, writing both the story intro and the clues for the room in one reply. Attach the background image you generated in Step 1 to this chat before you send this message - it lets you place each clue accurately.

PART 1 - STORY INTRODUCTION

Write a short, exciting introduction for this English Escape Room game.

• 80-120 words, in simple English suitable for: ${level}
• Explain WHY the player entered the room, and mention the setting naturally.
• Explain that hidden clues are scattered around the scene and must all be solved to unlock the exit.
• Do NOT reveal where the clues are.
• Create suspense and curiosity, and end with an exciting sentence encouraging students to begin.
• Setting: ${effectiveTheme || '[choose a theme above]'}
• Lesson topic: ${lessonTopic || '[add a short lesson topic below]'}
• Tone: adventure, mystery, exciting, educational.

PART 2 - CLUES

For every learning element listed at the end, invent an object hidden somewhere in the attached image that represents it, then produce FOUR separate pieces of text for it:

1. LOCATE HINT - a short, purely VISUAL/POSITIONAL description a player reads BEFORE clicking anything. It must describe what the object looks like and/or roughly where it sits in the scene (e.g. "a curled pink-and-white spiral shell resting on the sand at the bottom of the stone steps"), specific enough that a player can pick out that one object among everything else in the picture. It must NEVER contain, spell out, translate, define, or hint at the answer to the question - it only helps the player find the spot.
2. EXTRA LOCATE HINT - a second location clue, only shown to a player who keeps clicking the wrong spot. Nudge them gently - a small additional visual detail or a slightly narrower area (e.g. "look closer to the ground" or "near the taller of the two towers") - WITHOUT pointing directly at the object or making it obvious at a glance. It should still take a moment of looking, not give away the exact pixel. Still no answer leakage.
3. QUESTION - the actual test question the player answers AFTER they click the object, testing the learning element itself. Do not repeat the visual description here.
4. EXTRA ANSWER HINT - only shown to a player who answers the question wrong a couple of times. A subtle, indirect nudge (e.g. a category, a related idea, a rhyme, or a vague partial clue) that narrows things down WITHOUT directly stating or spelling out the answer, its first letter, or anything a player could copy verbatim as the answer.

Requirements

• One object + one clue set per learning element, in the same order as the list below.
• Keep every field short (1 sentence each, or a few words for the extra answer hint).
• IMPORTANT - spacing: choose objects that are spread out across DIFFERENT areas of the image (not clustered together or overlapping). Two objects sitting close to each other confuses players about which clue belongs to which object - keep every object a clearly distinct, well-separated spot in the scene.
• Question type: ${questionType.value}
${isChoice ? `• Provide exactly 3 wrong options plus the correct answer. The correct answer must NOT be distinguishable from the wrong options - keep all four similar in length, style, and tone. Do NOT make the correct answer noticeably longer, more detailed, or use qualifying/technical wording that gives it away. All four should sound equally plausible.` : `• Leave the wrong-option columns empty - this is a typed-answer question, not multiple choice.`}
• Also estimate where each object sits in the attached image as an X and Y percent (0-100, where 0,0 is the top-left corner and 100,100 is the bottom-right corner). Look carefully at the actual picture - do not guess blindly. Double check that no two objects' X/Y positions are close together (keep them at least ~15 percent apart) - pick a different object if two candidates end up too close. If you cannot see the image or aren't confident, leave X/Y blank and the teacher will place it by hand.

LEARNING ELEMENTS (one item per line below, in order)

${elementLines.length > 0 ? elementLines.map((l) => `- ${l}`).join('\n') : '[add vocabulary/grammar/reading/spelling items below]'}

OUTPUT FORMAT - respond with EXACTLY this structure and nothing else (no commentary before, between, or after):

STORY:
<your Part 1 story text here>

CLUES:
| Object # | Object Label | Locate Hint | Extra Locate Hint (if stuck) | Question | Extra Answer Hint (if wrong) | Answer Mode (type/choice) | Correct Answer | Wrong Option 1 | Wrong Option 2 | Wrong Option 3 | X Percent (0-100, optional) | Y Percent (0-100, optional) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | ... | ... | ... | ... | ... | ${answerMode} | ... | ${isChoice ? '...' : ''} | ${isChoice ? '...' : ''} | ${isChoice ? '...' : ''} | ... | ... |

(one clue row per learning element - use "${answerMode}" in every Answer Mode cell)`;

  const handleDownloadBlankTemplate = () => {
    downloadHotspotTemplate(elementLines.length > 0 ? elementLines : ['object 1'], answerMode);
  };

  const handleImportPastedReply = () => {
    if (!pasteText.trim()) return;
    const { story, clues, errors } = parseStoryAndCluesReply(pasteText);

    if (clues.template.items.length === 0) {
      setPasteStatus({ kind: 'error', message: errors[0] ?? clues.errors[0] ?? "Couldn't find any usable clues in that text." });
      return;
    }

    if (story) onImportStory?.(story);
    onImportClues?.(clues.template.items);

    const allErrors = [...errors, ...clues.errors];
    setPasteStatus({
      kind: allErrors.length > 0 ? 'error' : 'success',
      message: allErrors.length > 0
        ? `Imported ${clues.template.items.length} clue(s)${story ? ' and the story' : ''}, but: ${allErrors.join(' ')}`
        : `Imported the story and ${clues.template.items.length} clue(s) - check the story field and the image below.`,
    });
    setPasteText('');
  };

  return (
    <div className="card-surface p-4 sm:p-6">
      <p className="font-display text-lg font-semibold text-primary">AI Prompt Generator</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Fill this in, then copy each prompt into any AI tool to generate your background image, story,
        and clues. For Step 2, attach the image you generated in Step 1 before sending the prompt - the
        AI will reply with the story and a clue table in one go. Paste that whole reply back in below
        and the app fills in the story and clues for you automatically.
      </p>

      <div className="mt-4">
        <p className="mb-1.5 text-sm font-semibold text-primary">Theme</p>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <button
              key={t}
              onClick={() => { setTheme(t); setUseCustomTheme(false); }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                !useCustomTheme && theme === t ? 'bg-primary text-primary-foreground' : 'border border-border text-primary/70'
              }`}
            >
              {t}
            </button>
          ))}
          <button
            onClick={() => setUseCustomTheme(true)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${useCustomTheme ? 'bg-primary text-primary-foreground' : 'border border-border text-primary/70'}`}
          >
            Custom...
          </button>
        </div>
        {useCustomTheme && (
          <input
            value={customTheme}
            onChange={(e) => setCustomTheme(e.target.value)}
            placeholder="Describe your own theme"
            className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-secondary"
          />
        )}
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-sm font-semibold text-primary">Grade</p>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
            <button
              key={g}
              onClick={() => setGrade(g)}
              className={`h-8 w-8 rounded-lg text-sm font-semibold ${
                grade === g ? 'bg-primary text-primary-foreground' : 'border border-border text-primary/70'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-sm font-semibold text-primary">Difficulty</p>
        <div className="flex gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                difficulty === d ? 'bg-primary text-primary-foreground' : 'border border-border text-primary/70'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-sm font-semibold text-primary">Answer format</p>
        <div className="flex gap-2">
          {ANSWER_FORMATS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setAnswerFormat(f.value);
                setQuestionType(getQuestionTypesForFormat(questionCategory, f.value).types[0]);
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                answerFormat === f.value ? 'bg-primary text-primary-foreground' : 'border border-border text-primary/70'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-sm font-semibold text-primary">Question category</p>
        <div className="flex flex-wrap gap-2">
          {QUESTION_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setQuestionCategory(cat); setQuestionType(getQuestionTypesForFormat(cat, answerFormat).types[0]); }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                questionCategory === cat ? 'bg-primary text-primary-foreground' : 'border border-border text-primary/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <p className="mb-1.5 mt-3 text-sm font-semibold text-primary">Question type</p>
        {questionTypesForCurrentSelection.usedFallback && (
          <p className="mb-1.5 text-xs text-muted-foreground">
            {questionCategory} doesn't have {answerFormat === 'type' ? 'fill-in-the-blank' : 'multiple choice'} options yet - showing all types for this category instead.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {questionTypesForCurrentSelection.types.map((q) => (
            <button
              key={q.label}
              onClick={() => setQuestionType(q)}
              title={q.value}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                questionType.label === q.label ? 'bg-primary text-primary-foreground' : 'border border-border text-primary/70'
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-4 block">
        <span className="mb-1 block text-sm font-semibold text-primary">Lesson topic (short label)</span>
        <input
          value={lessonTopic}
          onChange={(e) => setLessonTopic(e.target.value)}
          placeholder='e.g. "Past simple tense"'
          className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-secondary"
        />
      </label>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-primary">Vocabulary words (one per line)</span>
          <textarea value={vocab} onChange={(e) => setVocab(e.target.value)} rows={3} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-secondary" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-primary">Grammar items (one per line)</span>
          <textarea value={grammar} onChange={(e) => setGrammar(e.target.value)} rows={3} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-secondary" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-primary">Reading clues (one per line)</span>
          <textarea value={reading} onChange={(e) => setReading(e.target.value)} rows={3} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-secondary" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-primary">Spelling words (one per line)</span>
          <textarea value={spelling} onChange={(e) => setSpelling(e.target.value)} rows={3} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-secondary" />
        </label>
      </div>

      <CopyBox label="1. Background image prompt" text={imagePrompt} shortcuts={IMAGE_AI_SHORTCUTS} />
      <CopyBox label="2. Story + clues prompt (attach your Step 1 image first)" text={storyAndCluesPrompt} shortcuts={TEXT_AI_SHORTCUTS} />

      <div className="mt-4 rounded-lg border border-secondary bg-secondary/5 p-3">
        <p className="mb-1.5 text-sm font-semibold text-primary">Paste the AI's reply here</p>
        <p className="mb-2 text-xs text-muted-foreground">
          Copy the AI's ENTIRE reply to Prompt 2 (story + table, unedited) and paste it below. This fills
          in the story and drops clue pins onto your image automatically - no file needed.
        </p>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={'STORY:\n...\n\nCLUES:\n| Object # | ... |'}
          rows={5}
          className="w-full rounded-lg border border-border px-3 py-2 font-mono text-xs outline-none focus:border-secondary"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleImportPastedReply}
            disabled={!pasteText.trim()}
            className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground hover:opacity-90 disabled:opacity-40"
          >
            Import story & clues
          </button>
          {pasteStatus && (
            <span className={`text-xs font-medium ${pasteStatus.kind === 'success' ? 'text-secondary' : 'text-destructive'}`}>
              {pasteStatus.message}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3">
        <p className="text-xs text-muted-foreground">
          Prefer working in a spreadsheet instead? Download a blank Excel template below, fill it in by
          hand (or paste the AI's clue table into it), and use "Import clues from file" on the next page.
        </p>
        <button
          type="button"
          onClick={handleDownloadBlankTemplate}
          className="mt-2 rounded-lg border border-secondary px-3 py-1.5 text-xs font-semibold text-secondary hover:bg-secondary/10"
        >
          Download blank template (.xlsx)
        </button>
      </div>
    </div>
  );
}
