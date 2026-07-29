import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { joinClassByCode } from '../lib/services';

export function JoinClassPage() {
  const { profile } = useAuth();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'notfound'>('idle');
  const [className, setClassName] = useState('');

  const handleJoin = async () => {
    if (!profile || !code.trim()) return;
    setStatus('loading');
    const result = await joinClassByCode(code, profile.uid);
    if (result) {
      setClassName(result.name);
      setStatus('success');
    } else {
      setStatus('notfound');
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card-surface p-6 text-center">
        <span className="text-3xl">🔑</span>
        <h1 className="mt-2 font-display text-2xl font-bold text-primary">Join your class</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ask your teacher for the class code.</p>

        {status === 'success' ? (
          <p className="mt-6 rounded-lg bg-success/10 p-4 font-semibold text-success">
            You've joined {className}! 🎉
          </p>
        ) : (
          <>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="e.g. K7P2QX"
              className="mt-5 w-full rounded-lg border border-border px-4 py-3 text-center text-xl font-bold tracking-widest outline-none focus:border-secondary"
            />
            {status === 'notfound' && (
              <p className="mt-2 text-sm text-destructive">No class found with that code - check with your teacher.</p>
            )}
            <button
              onClick={handleJoin}
              disabled={code.length < 6 || status === 'loading'}
              className="mt-4 w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-40"
            >
              {status === 'loading' ? 'Joining...' : 'Join class'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
