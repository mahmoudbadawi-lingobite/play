import { useState } from 'react';
import { tr } from '../../../i18n/tr';

/** "Exit game" with a confirmation. One-device matches ask which team leaves; online players leave with their own team. */
export function ExitButton({ pickTeam, onExit, className = '' }: { pickTeam?: boolean; onExit: (team?: 0 | 1) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const go = (t?: 0 | 1) => { setOpen(false); onExit(t); };
  return (
    <>
      <button type="button" className={`rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow ${className}`} onClick={() => setOpen(true)}>🚪 {tr('Exit game')}</button>
      {open && (
        <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 text-center text-slate-900 shadow-xl">
            <p className="text-lg font-bold">{tr('Exit the game?')}</p>
            <p className="mt-1 text-sm text-slate-600">{pickTeam ? tr('Choose the team that leaves. Its animals vanish and the other team wins.') : tr("Your team's animals will vanish and the other team wins.")}</p>
            <div className="mt-3 flex flex-col gap-2">
              {pickTeam ? (
                <>
                  <button type="button" className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white" onClick={() => go(0)}>{tr('Blue team leaves')}</button>
                  <button type="button" className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white" onClick={() => go(1)}>{tr('Red team leaves')}</button>
                </>
              ) : <button type="button" className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white" onClick={() => go()}>{tr('Exit game')}</button>}
              <button type="button" className="rounded-xl bg-slate-100 px-4 py-2 font-semibold" onClick={() => setOpen(false)}>{tr('Keep playing')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
