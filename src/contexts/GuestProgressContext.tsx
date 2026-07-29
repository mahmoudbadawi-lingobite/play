import { createContext, useContext, useState, type ReactNode } from 'react';

interface GuestProgressValue {
  xp: number;
  addXP: (amount: number) => void;
}

const GuestProgressContext = createContext<GuestProgressValue | undefined>(undefined);

export function GuestProgressProvider({ children }: { children: ReactNode }) {
  const [xp, setXp] = useState(0);
  const addXP = (amount: number) => setXp((prev) => prev + amount);
  return (
    <GuestProgressContext.Provider value={{ xp, addXP }}>
      {children}
    </GuestProgressContext.Provider>
  );
}

export function useGuestProgress() {
  const ctx = useContext(GuestProgressContext);
  if (!ctx) throw new Error('useGuestProgress must be used within GuestProgressProvider');
  return ctx;
}
