import { useState } from 'react';
import { ESCAPE_ROOM_THEMES } from '../../games/escapeRoomThemes';
import { buildBlankTemplate, downloadTemplateFile } from '../../lib/hotspotTemplate';
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

export function PromptGeneratorPanel() {
  const [theme, setTheme] = useState(THEMES[0]);
  const [customTheme, setCustomTheme] = useState('');
  const [useCustomTheme, setUseCustomTheme] = useState(false);
  const [grade, setGrade] = useState(5);
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCategory, setQuestionCategory] = useState<QuestionCategory>('Vocabulary');
  const [questionType, setQuestionType] = useState(QUESTION_TYPES_BY_CATEGORY['Vocabulary'][0]);
  const [lessonTopic, setLessonTopic] = useState('');
  const [vocab, setVocab] = useState('');
  const [grammar, setGrammar] = useState('');
  const [reading, setReading] = useState('');
  const [spelling, setSpelling] = useState('');

  const effectiveTheme = useCustomTheme ? customTheme : theme;
  const level = `Grade ${grade} students`;
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

Naturally hide these objects inside the scene:

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

  const storyPrompt = `You are an educational storyteller.

Write a short, exciting introduction for an English Escape Room game.

Requirements

• 80–120 words.
• Written in simple English suitable for:
${level}

• The story should explain WHY the player entered the room.
• Mention the setting naturally.
• Explain that hidden clues are scattered around the scene.
• The player must solve every clue to unlock the final exit.
• Do NOT reveal where the clues are.
• Create suspense and curiosity.
• End with an exciting sentence encouraging students to begin.

Setting:
${effectiveTheme || '[choose a theme above]'}

Lesson topic:
${lessonTopic || '[add a short lesson topic below]'}

Tone:
Adventure, mystery, exciting, educational.`;

  const elementLines = collectElementLines(vocab, grammar, reading, spelling);
  const answerMode = answerModeFromQuestionType(questionType.value);
  const isChoice = answerMode === 'choice';

  const questionsPrompt = `You are creating interactive clues for an educational Escape Room game. Attach the background image you generated in Step 1 to this chat before you send this message - it lets you place each object accurately.

For every learning element listed at the end, you must invent an object hidden somewhere in the attached image that represents it, then produce TWO separate pieces of text for it:

1. "locateHint" - a short, purely VISUAL/POSITIONAL description a player reads BEFORE clicking anything. It must describe what the object looks like and/or roughly where it sits in the scene (e.g. "a curled pink-and-white spiral shell resting on the sand at the bottom of the stone steps"), specific enough that a player can pick out that one object among everything else in the picture. It must NEVER contain, spell out, translate, define, or hint at the answer to the question - it only helps the player find the spot.
2. "question" - the actual test question the player answers AFTER they click the object, testing the learning element itself. Do not repeat the visual description here.

Requirements

• One object + one clue pair per learning element, in the same order as the list below.
• Keep both locateHint and question short (1 sentence each).
• Student level:
${level}

• Question type:
${questionType.value}
${isChoice ? `• Provide exactly 3 distractors ("choices") plus the correct answer. The correct answer must NOT be distinguishable from the distractors - keep all four options similar in length, style, and tone. Do NOT make the correct answer noticeably longer, more detailed, or use qualifying/technical wording that gives it away. All four should sound equally plausible.` : `• Leave "choices" as an empty array - this is a typed-answer question, not multiple choice.`}
• Also estimate where each object sits in the attached image as xPercent/yPercent (0-100, where 0,0 is the top-left corner and 100,100 is the bottom-right corner). Look carefully at the actual picture - do not guess blindly. If you cannot see the image or aren't confident, set both to null and the teacher will place it by hand.

OUTPUT FORMAT - respond with ONLY valid JSON, no extra commentary, no markdown code fences, matching this exact shape:

{
  "items": [
    {
      "id": 1,
      "objectLabel": "short label for the hidden object",
      "locateHint": "...",
      "question": "...",
      "answerMode": "${answerMode}",
      "correctAnswer": "...",
      "choices": ${isChoice ? '["...", "...", "..."]' : '[]'},
      "xPercent": 0,
      "yPercent": 0
    }
  ]
}

LEARNING ELEMENTS (one item per line below, in order)

${elementLines.length > 0 ? elementLines.map((l) => `- ${l}`).join('\n') : '[add vocabulary/grammar/reading/spelling items below]'}`;

  const handleDownloadBlankTemplate = () => {
    const template = buildBlankTemplate(
      elementLines.length > 0 ? elementLines : ['object 1'],
      answerMode,
    );
    downloadTemplateFile(template, 'escape-room-template.json');
  };

  return (
    <div className="card-surface p-4 sm:p-6">
      <p className="font-display text-lg font-semibold text-primary">AI Prompt Generator</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Fill this in, then copy each prompt into any AI tool to generate your background image, story,
        and clues. For Step 3, attach the image you generated in Step 1 before sending the prompt -
        the AI will reply with a JSON file you can save and upload directly on the next page, so you
        only click each pin into its exact spot instead of typing everything by hand.
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
        <p className="mb-1.5 text-sm font-semibold text-primary">Question category</p>
        <div className="flex flex-wrap gap-2">
          {QUESTION_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setQuestionCategory(cat); setQuestionType(QUESTION_TYPES_BY_CATEGORY[cat][0]); }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                questionCategory === cat ? 'bg-primary text-primary-foreground' : 'border border-border text-primary/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <p className="mb-1.5 mt-3 text-sm font-semibold text-primary">Question type</p>
        <div className="flex flex-wrap gap-2">
          {QUESTION_TYPES_BY_CATEGORY[questionCategory].map((q) => (
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
      <CopyBox label="2. Story introduction prompt" text={storyPrompt} shortcuts={TEXT_AI_SHORTCUTS} />
      <CopyBox label="3. Clues & positions prompt (attach your Step 1 image first)" text={questionsPrompt} shortcuts={TEXT_AI_SHORTCUTS} />

      <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3">
        <p className="text-xs text-muted-foreground">
          Save the AI's JSON reply as a <span className="font-mono">.json</span> file and upload it in the
          "Import clues from file" button on the next page. Prefer to skip AI entirely? Download a blank
          file below and fill it in by hand instead.
        </p>
        <button
          type="button"
          onClick={handleDownloadBlankTemplate}
          className="mt-2 rounded-lg border border-secondary px-3 py-1.5 text-xs font-semibold text-secondary hover:bg-secondary/10"
        >
          Download blank template (.json)
        </button>
      </div>
    </div>
  );
}
