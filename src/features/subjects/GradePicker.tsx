import { tr } from '../../i18n/tr';
const chip = (on: boolean) => `h-8 min-w-8 rounded-lg px-2 text-sm font-semibold transition disabled:opacity-50 ${on ? 'bg-secondary text-white' : 'border border-border bg-card text-primary hover:border-secondary'}`;

/** Grade 1-12 (or "Any"). One tap to choose, tap again to clear. */
export function GradePicker({ value, onChange, disabled, label = 'Grade' }: { value: number | null; onChange: (g: number | null) => void; disabled?: boolean; label?: string }) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{tr(label)}</span>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={tr(label)}>
        <button type="button" disabled={disabled} aria-pressed={value === null} className={chip(value === null)} onClick={() => onChange(null)}>{tr('Any')}</button>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
          <button key={g} type="button" disabled={disabled} aria-pressed={value === g} className={chip(value === g)} onClick={() => onChange(value === g ? null : g)}>{g}</button>
        ))}
      </div>
    </div>
  );
}
