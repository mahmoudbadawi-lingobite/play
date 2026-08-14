import { useRef, useState, type ChangeEvent, type MouseEvent as ReactMouseEvent } from 'react';
import type { AnswerMode } from '../../types';
import type { HotspotInput } from '../../lib/escapeRoomService';
import { parseHotspotTemplateFile, type TemplateItem } from '../../lib/hotspotTemplate';

interface Props {
  imageUrl: string;
  hotspots: HotspotInput[];
  onChange: (hotspots: HotspotInput[]) => void;
}

function emptyHotspot(xPercent: number, yPercent: number): HotspotInput {
  return { xPercent, yPercent, locateHint: '', locateHintExtra: '', clueText: '', answerMode: 'type', correctAnswer: '', choices: [], questionHintExtra: '' };
}

function itemToHotspot(item: TemplateItem, xPercent: number, yPercent: number): HotspotInput {
  return {
    xPercent,
    yPercent,
    locateHint: item.locateHint,
    locateHintExtra: item.locateHintExtra,
    clueText: item.question,
    answerMode: item.answerMode,
    correctAnswer: item.correctAnswer,
    choices: item.choices,
    questionHintExtra: item.questionHintExtra,
  };
}

export function HotspotEditor({ imageUrl, hotspots, onChange }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pendingItems, setPendingItems] = useState<TemplateItem[]>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const clampPercent = (n: number) => Math.min(100, Math.max(0, n));

  const percentFromEvent = (clientX: number, clientY: number) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const xPercent = Math.round(clampPercent(((clientX - rect.left) / rect.width) * 100) * 10) / 10;
    const yPercent = Math.round(clampPercent(((clientY - rect.top) / rect.height) * 100) * 10) / 10;
    return { xPercent, yPercent };
  };

  const handleImageClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const { xPercent, yPercent } = percentFromEvent(e.clientX, e.clientY);

    if (pendingItems.length > 0) {
      const [next, ...rest] = pendingItems;
      setPendingItems(rest);
      const nextHotspots = [...hotspots, itemToHotspot(next, xPercent, yPercent)];
      onChange(nextHotspots);
      setEditingIndex(nextHotspots.length - 1);
      return;
    }

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

  // --- Drag to reposition an existing pin ---
  const startDrag = (index: number) => (e: ReactMouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingIndex(index);

    const handleMove = (moveEvent: globalThis.MouseEvent) => {
      const { xPercent, yPercent } = percentFromEvent(moveEvent.clientX, moveEvent.clientY);
      updateHotspot(index, { xPercent, yPercent });
    };
    const handleUp = () => {
      setDraggingIndex(null);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  // --- Import a filled-in .xlsx template ---
  const handleFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    e.target.value = '';
    try {
      const { template, errors } = await parseHotspotTemplateFile(file);
      if (template.items.length === 0) {
        setImportError(errors[0] ?? 'No usable rows found in that file.');
        return;
      }
      const placedNow: HotspotInput[] = [];
      const stillPending: TemplateItem[] = [];
      for (const item of template.items) {
        if (item.xPercent !== null && item.yPercent !== null) {
          placedNow.push(itemToHotspot(item, item.xPercent, item.yPercent));
        } else {
          stillPending.push(item);
        }
      }
      onChange([...hotspots, ...placedNow]);
      setPendingItems((prev) => [...prev, ...stillPending]);
      if (errors.length > 0) setImportError(`Imported ${template.items.length} clue(s), but: ${errors.join(' ')}`);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Could not read that file.');
    }
  };

  const editing = editingIndex !== null ? hotspots[editingIndex] : null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border border-secondary px-3 py-1.5 text-xs font-semibold text-secondary hover:bg-secondary/10"
        >
          Import clues from file (.xlsx)
        </button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileSelected} className="hidden" />
        {importError && <span className="text-xs font-medium text-destructive">{importError}</span>}
      </div>

      {pendingItems.length > 0 && (
        <div className="mb-3 rounded-lg border border-secondary bg-secondary/5 p-3 text-sm">
          <p className="mb-1 font-semibold text-primary">
            {pendingItems.length} imported {pendingItems.length === 1 ? 'clue needs' : 'clues need'} a spot on the image
          </p>
          <p className="text-xs text-muted-foreground">
            Click the matching object in the picture for: <span className="font-semibold text-primary">{pendingItems[0].objectLabel || pendingItems[0].question}</span>
          </p>
        </div>
      )}

      <p className="mb-2 text-sm text-muted-foreground">
        {pendingItems.length > 0
          ? 'Click on the image to drop the next imported clue where its object is.'
          : 'Click anywhere on the image to drop a numbered clue marker, or drag existing pins to fine-tune them. Students must solve them in order.'}
      </p>

      <div
        ref={containerRef}
        onClick={handleImageClick}
        className="relative w-full cursor-crosshair overflow-hidden rounded-xl border border-border"
      >
        <img src={imageUrl} alt="" className="block w-full select-none" draggable={false} />
        {hotspots.map((h, i) => (
          <button
            key={i}
            onMouseDown={startDrag(i)}
            onClick={(e) => { e.stopPropagation(); if (draggingIndex === null) setEditingIndex(i); }}
            style={{ left: `${h.xPercent}%`, top: `${h.yPercent}%`, cursor: draggingIndex === i ? 'grabbing' : 'grab' }}
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

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-primary">Locate hint (shown before they click - helps them find the spot)</span>
            <textarea
              value={editing.locateHint}
              onChange={(e) => updateHotspot(editingIndex, { locateHint: e.target.value })}
              placeholder="e.g. Look for the pink spiral seashell resting in the sand near the bottom of the steps."
              rows={2}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-secondary"
            />
          </label>

          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-semibold text-primary">Extra locate hint <span className="font-normal text-muted-foreground">(optional - shown automatically if they keep missing the spot - keep it a gentle nudge, not a giveaway)</span></span>
            <textarea
              value={editing.locateHintExtra ?? ''}
              onChange={(e) => updateHotspot(editingIndex, { locateHintExtra: e.target.value })}
              placeholder="e.g. Look closer to the ground, near the taller structure. (a small nudge, not a giveaway)"
              rows={2}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-secondary"
            />
          </label>

          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-semibold text-primary">Question (shown after they click - what they must answer)</span>
            <textarea
              value={editing.clueText}
              onChange={(e) => updateHotspot(editingIndex, { clueText: e.target.value })}
              placeholder="What question should students answer for this object?"
              rows={2}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-secondary"
            />
          </label>

          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-semibold text-primary">Extra answer hint <span className="font-normal text-muted-foreground">(optional - shown automatically if they answer wrong a couple of times - a subtle nudge, not the answer itself)</span></span>
            <textarea
              value={editing.questionHintExtra ?? ''}
              onChange={(e) => updateHotspot(editingIndex, { questionHintExtra: e.target.value })}
              placeholder="e.g. Think of a related category or a rhyme - not the answer itself."
              rows={2}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-secondary"
            />
          </label>

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
              <span className="mb-1 block text-xs text-muted-foreground">Tip: keep these a similar length/style to the correct answer so it doesn't stand out.</span>
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
