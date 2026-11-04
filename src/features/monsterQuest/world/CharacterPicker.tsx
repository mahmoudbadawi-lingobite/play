import { CHARACTERS, PLAYER_BASE, frameUrl } from './characters';

/** First-time choice of explorer (free). Later switching and buying happens in Profile > My explorers. */
export function CharacterPicker({ current, onPick, busy, error }: { current: string | null; onPick: (id: string) => void; busy?: boolean; error?: string | null }) {
  return (
    <div className="mq-picker" role="dialog" aria-label="Choose your explorer">
      <div className="mq-picker-card">
        <p className="mq-picker-title">Choose your explorer</p>
        <p className="mq-picker-sub">This one is free. You can buy the others with coins later in Profile.</p>
        <div className="mq-picker-grid">
          {CHARACTERS.map((c) => (
            <button key={c.id} className={`mq-pick ${c.id === current ? 'on' : ''}`} disabled={busy} onClick={() => onPick(c.id)} aria-pressed={c.id === current}>
              <img src={frameUrl(PLAYER_BASE, c.id, 'down', 0)} alt="" loading="lazy" />
              <b>{c.name}</b><small>{c.blurb}</small>
            </button>
          ))}
        </div>
        {error && <p className="mq-picker-err" role="alert">{error}</p>}
      </div>
    </div>
  );
}
