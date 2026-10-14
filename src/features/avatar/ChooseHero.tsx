import { STARTER, type Gender } from './catalog';
import { chooseGender } from './avatarStore';
import { AvatarImage } from './AvatarImage';

/** First-run screen: the student picks their hero (boy or girl). The store then shows items that suit that hero. */
export function ChooseHero({ onDone, title = 'Choose your hero' }: { onDone?: (g: Gender) => void; title?: string }) {
  const pick = (g: Gender) => {
    chooseGender(g);
    onDone?.(g);
  };
  return (
    <div className="rounded-3xl border-4 border-primary bg-gradient-to-b from-sky-200 via-violet-100 to-white p-5 text-center sm:p-8">
      <h2 className="font-display text-3xl font-bold text-primary">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">Pick the character you want to play as. You can switch later in My Avatar.</p>
      <div className="mt-5 grid grid-cols-2 gap-4">
        {(['boy', 'girl'] as Gender[]).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => pick(g)}
            className="group rounded-3xl border-4 border-white bg-white/80 p-3 shadow-lg transition hover:-translate-y-1 hover:border-secondary focus-visible:border-secondary"
          >
            <AvatarImage gender={g} look={STARTER[g]} view="body" size={200} className="mx-auto" />
            <span className="mt-2 block rounded-xl bg-secondary px-4 py-2 text-lg font-extrabold text-secondary-foreground">
              {g === 'boy' ? "I'm a boy" : "I'm a girl"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
