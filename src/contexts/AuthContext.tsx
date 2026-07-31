import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';

interface AuthContextValue {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isGuest: boolean;
  signInWithGoogle: () => Promise<void>;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
  giveConsent: (parentEmail?: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function rowToProfile(row: any): UserProfile {
  return {
    uid: row.id,
    email: row.email,
    displayName: row.display_name,
    photoURL: row.photo_url,
    role: row.role,
    teacherStatus: row.teacher_status,
    totalXP: row.total_xp,
    currentStreak: row.current_streak,
    badges: row.badges ?? [],
    classIds: [], // populated separately where needed (class_students join table)
    consentGiven: row.consent_given,
    parentEmail: row.parent_email ?? undefined,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : new Date(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  async function loadProfile(userId: string) {
    // The handle_new_user() trigger creates the row on first sign-in, but
    // there can be a brief race right after OAuth redirect - retry a couple
    // of times before giving up.
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (data) {
        await supabase.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', userId);
        setProfile(rowToProfile(data));
        return;
      }
      if (error) console.error(error);
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        setIsGuest(false);
        loadProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        setIsGuest(false);
        loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + import.meta.env.BASE_URL },
    });
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    setLoading(false);
  };

  const signOut = async () => {
    setIsGuest(false);
    await supabase.auth.signOut();
  };

  const giveConsent = async (parentEmail?: string) => {
    if (!session) return;
    await supabase
      .from('profiles')
      .update({ consent_given: true, ...(parentEmail ? { parent_email: parentEmail } : {}) })
      .eq('id', session.user.id);
    setProfile((p) => (p ? { ...p, consentGiven: true, parentEmail: parentEmail ?? p.parentEmail } : p));
  };

  const refreshProfile = async () => {
    if (session) await loadProfile(session.user.id);
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, isGuest, signInWithGoogle, continueAsGuest, signOut, giveConsent, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
