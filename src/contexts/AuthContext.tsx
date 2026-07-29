import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged, signInWithPopup, signOut as fbSignOut, type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import type { UserProfile } from '../types';

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isGuest: boolean;
  signInWithGoogle: () => Promise<void>;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
  giveConsent: (parentEmail?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setIsGuest(false);
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          const newProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: 'student' as const,
            teacherStatus: 'none' as const,
            totalXP: 0,
            currentStreak: 0,
            badges: [],
            classIds: [],
            consentGiven: false,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
          };
          await setDoc(ref, newProfile);
          setProfile({ ...newProfile, createdAt: new Date(), lastLoginAt: new Date() } as UserProfile);
        } else {
          await updateDoc(ref, { lastLoginAt: serverTimestamp() });
          const data = snap.data();
          setProfile({
            ...data,
            classIds: data.classIds ?? [],
            consentGiven: data.consentGiven ?? false,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
            lastLoginAt: new Date(),
          } as UserProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    setLoading(false);
  };

  const signOut = async () => {
    setIsGuest(false);
    await fbSignOut(auth);
  };

  const giveConsent = async (parentEmail?: string) => {
    if (!firebaseUser) return;
    await updateDoc(doc(db, 'users', firebaseUser.uid), {
      consentGiven: true,
      ...(parentEmail ? { parentEmail } : {}),
    });
    setProfile((p) => (p ? { ...p, consentGiven: true, parentEmail: parentEmail ?? p.parentEmail } : p));
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, profile, loading, isGuest, signInWithGoogle, continueAsGuest, signOut, giveConsent }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
