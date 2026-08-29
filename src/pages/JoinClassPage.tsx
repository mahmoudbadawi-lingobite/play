import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { joinClassByCode } from '../lib/services';
import { ConsentGate } from '../components/auth/ConsentGate';

const PENDING_JOIN_CODE_KEY = 'pendingJoinCode';

export function JoinClassPage() {
  const { profile, loading, isGuest, signInWithGoogle } = useAuth();
  const [searchParams] = useSearchParams();
  const codeFromLink = (searchParams.get('code') ?? '').toUpperCase();

  const [code, setCode] = useState(codeFromLink);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'notfound'>('idle');
  const [className, setClassName] = useState('');
  const autoJoinedRef = useRef(false);

  const handleJoin = async (codeToUse: string) => {
    if (!profile || !codeToUse.trim()) return;
    setStatus('loading');
    const result = await joinClassByCode(codeToUse, profile.uid);
    if (result) {
      setClassName(result.name);
      setStatus('success');
    } else {
      setStatus('notfound');
    }
  };

  // If we arrived here already signed in via a shared join link (?code=...),
  // join automatically instead of making the student retype the code.
  useEffect(() => {
    if (autoJoinedRef.current) return;
    if (profile?.role === 'student' && codeFromLink.length === 6) {
      autoJoinedRef.current = true;
      handleJoin(codeFromLink);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, codeFromLink]);

  const handleSignInThenJoin = () => {
    if (codeFromLink) {
      localStorage.setItem(PENDING_JOIN_CODE_KEY, codeFromLink);
    }
    signInWithGoogle();
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  // Not signed in (and not playing as a guest): offer to sign in, then
  // resume the join automatically once they're back.
  if (!profile && !isGuest) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="card-surface p-6 text-center">
          <span className="text-3xl">🔑</span>
          <h1 className="mt-2 font-display text-2xl font-bold text-primary">Join your class</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {codeFromLink
              ? `Sign in to join with class code ${codeFromLink}.`
              : 'Sign in with your student account to join a class.'}
          </p>
          <button
            onClick={handleSignInThenJoin}
            className="mt-5 w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground"
          >
            Sign in to continue
          </button>
        </div>
      </div>
    );
  }

  // Guests don't have a persistent profile a class roster can reference.
  if (isGuest && !profile) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="card-surface p-6 text-center">
          <span className="text-3xl">🔑</span>
          <h1 className="mt-2 font-display text-2xl font-bold text-primary">Join your class</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Guest play can't be linked to a class. Sign in with your student account to join.
          </p>
          <button
            onClick={handleSignInThenJoin}
            className="mt-5 w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground"
          >
            Sign in to continue
          </button>
        </div>
      </div>
    );
  }

  if (profile && profile.role !== 'student') {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="card-surface p-6 text-center">
          <span className="text-3xl">🔑</span>
          <h1 className="mt-2 font-display text-2xl font-bold text-primary">Join a class</h1>
          <p className="mt-1 text-sm text-muted-foreground">Only student accounts can join a class.</p>
        </div>
      </div>
    );
  }

  return (
    <ConsentGate>
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="card-surface p-6 text-center">
          <span className="text-3xl">🔑</span>
          <h1 className="mt-2 font-display text-2xl font-bold text-primary">Join your class</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ask your teacher for the class code or join link.</p>

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
                onClick={() => handleJoin(code)}
                disabled={code.length < 6 || status === 'loading'}
                className="mt-4 w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-40"
              >
                {status === 'loading' ? 'Joining...' : 'Join class'}
              </button>
            </>
          )}
        </div>
      </div>
    </ConsentGate>
  );
}
