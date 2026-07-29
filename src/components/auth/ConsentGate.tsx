import { useState, type ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Wraps the app's protected content. If the signed-in user is a student who
 * hasn't confirmed parental awareness yet, shows a one-time consent
 * interstitial instead of the page. Teachers/Admins skip this (adult
 * accounts). Guests never reach this (no Firestore profile to gate).
 */
export function ConsentGate({ children }: { children: ReactNode }) {
  const { profile, giveConsent } = useAuth();
  const [parentEmail, setParentEmail] = useState('');
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!profile || profile.role !== 'student' || profile.consentGiven) {
    return <>{children}</>;
  }

  const handleSubmit = async () => {
    if (!checked) return;
    setSubmitting(true);
    await giveConsent(parentEmail.trim() || undefined);
    setSubmitting(false);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card-surface p-6">
        <h1 className="font-display text-xl font-bold text-primary">Before you start playing</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          LingoBite Play is for students learning English at school. If you're
          under 18, a parent or guardian should know you're using this app and
          that your teacher can see your name and scores in class results.
        </p>

        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-semibold text-primary">
            Parent/guardian email <span className="font-normal text-muted-foreground">(optional)</span>
          </span>
          <input
            type="email"
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
            placeholder="parent@example.com"
            className="w-full rounded-lg border border-border px-4 py-2.5 outline-none focus:border-secondary"
          />
        </label>

        <label className="mt-4 flex items-start gap-2 text-sm text-primary">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5" />
          <span>A parent/guardian (or my teacher, if I'm playing at school) knows I'm using LingoBite Play.</span>
        </label>

        <button
          onClick={handleSubmit}
          disabled={!checked || submitting}
          className="mt-5 w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-40"
        >
          {submitting ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
