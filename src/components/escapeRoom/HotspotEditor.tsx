import { useState, type MouseEvent } from 'react';
import type { AnswerMode } from '../../types';
import type { HotspotInput } from '../../lib/escapeRoomService';

interface Props {
  imageUrl: string;
  hotspots: HotspotInput[];
  onChange: (hotspots: HotspotInput[]) => void;
}

function emptyHotspot(xPercent: number, yPercent: number): HotspotInput {
  return { xPercent, yPercent, clueText: '', answerMode: 'type', correctAnswer: '', choices: [] };
}

export function HotspotEditor({ imageUrl, hotspots, onChange }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleImageClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const yPercent = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
    const next = [...hotspots, emptyHotspot(xPercent, yPercent)];
    onChange(next);
    setEditingIndex(next.length - 1);
  };

  const updateHotspot = (index: number, patch: Partial<HotspotInput>) => {
    const next = hotspots.map((h, i) => (i === index ? { ...h, ...patch } : h));
    onChange(next);
  };

  const deleteHotspot = (index: number) => {
    onChange(hotspots.filter((_, i) => i !== index));
    setEditingIndex(null);
  };

  const moveHotspot = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= hotspots.length) return;
    const next = [...hotspots];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
    setEditingIndex(target);
  };

  const editing = editingIndex !== null ? hotspots[editingIndex] : null;

  return (
    <div>
      <p className="mb-2 text-sm text-muted-foreground">
        Click anywhere on the image to drop a numbered clue marker. Students must solve them in order.
      </p>

      <div
        onClick={handleImageClick}
        className="relative w-full cursor-crosshair overflow-hidden rounded-xl border border-border"
      >
        <img src={imageUrl} alt="" className="block w-full select-none" draggable={false} />
        {hotspots.map((h, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); setEditingIndex(i); }}
            style={{ left: `${h.xPercent}%`, top: `${h.yPercent}%` }}
            className={`absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-xs font-bold shadow ${
              editingIndex === i ? 'border-primary bg-secondary text-primary' : 'border-white bg-primary text-primary-foreground'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {hotspots.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {hotspots.map((h, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm">
              <span className="font-bold text-primary">{i + 1}.</span>
              <span className="flex-1 truncate text-muted-foreground">{h.clueText || '(empty clue - click to fill in)'}</span>
              <button onClick={() => moveHotspot(i, -1)} disabled={i === 0} className="text-primary/60 hover:text-primary disabled:opacity-30">↑</button>
              <button onClick={() => moveHotspot(i, 1)} disabled={i === hotspots.length - 1} className="text-primary/60 hover:text-primary disabled:opacity-30">↓</button>
              <button onClick={() => setEditingIndex(i)} className="font-semibold text-primary hover:text-secondary">Edit</button>
              <button onClick={() => deleteHotspot(i)} className="font-semibold text-destructive hover:opacity-80">Delete</button>
            </div>
          ))}
        </div>
      )}

      {editing && editingIndex !== null && (
        <div className="mt-4 rounded-lg border border-secondary bg-secondary/5 p-4">
          <p className="mb-2 text-sm font-semibold text-primary">Clue #{editingIndex + 1}</p>

          <textarea
            value={editing.clueText}
            onChange={(e) => updateHotspot(editingIndex, { clueText: e.target.value })}
            placeholder="What clue should students see for this object?"
            rows={2}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-secondary"
          />

          <div className="mt-3 flex gap-2">
            {(['type', 'choice'] as AnswerMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => updateHotspot(editingIndex, { answerMode: mode })}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  editing.answerMode === mode ? 'bg-primary text-primary-foreground' : 'border border-border text-primary/70'
                }`}
              >
                {mode === 'type' ? 'Typed answer' : 'Multiple choice'}
              </button>
            ))}
          </div>

          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-semibold text-primary">Correct answer</span>
            <input
              value={editing.correctAnswer}
              onChange={(e) => updateHotspot(editingIndex, { correctAnswer: e.target.value })}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-secondary"
            />
          </label>

          {editing.answerMode === 'choice' && (
            <div className="mt-3">
              <span className="mb-1 block text-xs font-semibold text-primary">Wrong options (1-3, shown mixed with the correct answer)</span>
              {(editing.choices ?? []).map((choice, ci) => (
                <div key={ci} className="mt-1 flex gap-2">
                  <input
                    value={choice}
                    onChange={(e) => {
                      const nextChoices = [...(editing.choices ?? [])];
                      nextChoices[ci] = e.target.value;
                      updateHotspot(editingIndex, { choices: nextChoices });
                    }}
                    className="flex-1 rounded-lg border border-border px-3 py-1.5 text-sm outline-none focus:border-secondary"
                  />
                  <button
                    onClick={() => updateHotspot(editingIndex, { choices: (editing.choices ?? []).filter((_, x) => x !== ci) })}
                    className="text-xs font-semibold text-destructive"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {(editing.choices?.length ?? 0) < 3 && (
                <button
                  onClick={() => updateHotspot(editingIndex, { choices: [...(editing.choices ?? []), ''] })}
                  className="mt-2 text-xs font-semibold text-secondary"
                >
                  + Add wrong option
                </button>
              )}
            </div>
          )}

          <button onClick={() => setEditingIndex(null)} className="mt-4 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">
            Done
          </button>
        </div>
      )}
    </div>
  );
}
