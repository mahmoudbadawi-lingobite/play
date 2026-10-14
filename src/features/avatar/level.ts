import { useAuth } from '../../contexts/AuthContext';
import { useGuestProgress } from '../../contexts/GuestProgressContext';

/** Level n starts at 40 * (n-1)^2 XP: quick early levels, slower later. */
export function levelInfo(xp: number) {
  const safe = Math.max(0, Math.floor(xp));
  const level = Math.floor(Math.sqrt(safe / 40)) + 1;
  const start = 40 * (level - 1) ** 2;
  const next = 40 * level ** 2;
  return { level, into: safe - start, need: next - start, pct: Math.min(100, Math.round(((safe - start) / (next - start)) * 100)) };
}

/** XP of the signed-in student, or this session's XP for guests. */
export function useXp(): number {
  const { profile } = useAuth();
  const { xp } = useGuestProgress();
  return profile?.totalXP ?? xp ?? 0;
}
