import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type AppTheme = 'default' | 'galaxy-quest';

const STORAGE_KEY = 'lingotrace-theme';

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'default',
  setTheme: () => {},
  toggleTheme: () => {},
});

function readStoredTheme(): AppTheme {
  if (typeof window === 'undefined') return 'default';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'galaxy-quest' ? 'galaxy-quest' : 'default';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(readStoredTheme);

  useEffect(() => {
    if (theme === 'galaxy-quest') {
      document.documentElement.setAttribute('data-theme', 'galaxy-quest');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (next: AppTheme) => setThemeState(next);
  const toggleTheme = () => setThemeState((prev) => (prev === 'galaxy-quest' ? 'default' : 'galaxy-quest'));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
