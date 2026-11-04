import { CHARACTERS, frameUrl } from './characters';

/** Choose which supplied explorer to play as. The artwork is the uploaded sprite sheets, unchanged. */
export function CharacterPicker({ base, current, onPick, onClose }: { base: string; current: string; onPick: (id: string) => void; onClose?: () => void }) {
  return (
    <div className="mq-picker" role="dialog" aria-label="Choose your explorer">
      <div className="mq-picker-card">
        <p className="mq-picker-title">Choose your explorer</p>
        <div className="mq-picker-grid">
          {CHARACTERS.map((c) => (
            <button key={c.id} className={`mq-pick ${c.id === current ? 'on' : ''}`} onClick={() => onPick(c.id)} aria-pressed={c.id === current}>
              <img src={frameUrl(base, c.id, 'down', 0)} alt="" loading="lazy" />
              <b>{c.name}</b><small>{c.blurb}</small>
            </button>
          ))}
        </div>
        {onClose && <button className="mq-picker-close" onClick={onClose}>Close</button>}
      </div>
    </div>
  );
}
