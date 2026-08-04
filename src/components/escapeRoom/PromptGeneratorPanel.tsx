import { useState } from 'react';

const THEMES = [
  'Ancient Egyptian temple', 'Pirate island', 'Secret laboratory', 'Haunted castle',
  'Jungle expedition', 'Space station', 'Medieval village', 'Underwater city',
  'Wizard school', 'Detective office',
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const QUESTION_TYPES = [
  { label: 'Meaning', value: 'What does this word mean?' },
  { label: 'Grammar', value: 'Choose the correct verb.' },
  { label: 'Reading', value: 'What does this object tell us?' },
  { label: 'Spelling', value: 'Which spelling is correct?' },
  { label: 'Word formation', value: 'Choose the correct form.' },
  { label: 'Pronunciation', value: 'Which syllable is stressed?' },
];

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

function CopyBox({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-sm font-semibold text-primary">{label}</p>
        <button onClick={handleCopy} className="rounded-lg bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground hover:opacity-90">
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <textarea readOnly value={text} rows={8} className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 font-mono text-xs text-primary" />
    </div>
  );
}

export function PromptGeneratorPanel() {
  const [theme, setTheme] = useState(THEMES[0]);
  const [customTheme, setCustomTheme] = useState('');
  const [useCustomTheme, setUseCustomTheme] = useState(false);
  const [grade, setGrade] = useState(5);
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionType, setQuestionType] = useState(QUESTION_TYPES[0]);
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

  const questionsPrompt = `You are creating interactive questions for an educational Escape Room game.

For every learning element listed below, generate ONE question that will appear only after a student clicks the object.

Requirements

• One question per object.
• Questions must assess understanding of the lesson.
• Keep each question short.
• Student level:
${level}

• Question type:
${questionType.value}

Output format

Object:
Question:
Correct answer:
Three distractors:
Short explanation:

LEARNING ELEMENTS

${elementsBlock || '[add vocabulary/grammar/reading/spelling items below]'}`;

  return (
    <div className="card-surface p-4 sm:p-6">
      <p className="font-display text-lg font-semibold text-primary">AI Prompt Generator</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Fill this in, then copy each prompt into any AI tool to generate your background image, story,
        and clue questions. Come back and upload the image, paste the story, and fill in the clues below
        once you have them.
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
        <p className="mb-1.5 text-sm font-semibold text-primary">Question type</p>
        <div className="flex flex-wrap gap-2">
          {QUESTION_TYPES.map((q) => (
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

      <CopyBox label="1. Background image prompt" text={imagePrompt} />
      <CopyBox label="2. Story introduction prompt" text={storyPrompt} />
      <CopyBox label="3. Clue questions prompt" text={questionsPrompt} />
    </div>
  );
}
