import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AppTheme = "classic" | "kid";

// v2: kid mode is now the default for everyone. Only an explicit "classic"
// choice is stored, so people who never touched the mode button (including
// everyone who was auto-saved as "classic" under the old key) get kid mode.
const STORAGE_KEY = "lingobite-play-theme-v2";

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStoredTheme(): AppTheme {
  if (typeof window === "undefined") return "kid";
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "classic" ? "classic" : "kid";
  } catch {
    return "kid";
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(readStoredTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function setTheme(next: AppTheme) {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
  }

  function toggleTheme() {
    setTheme(theme === "kid" ? "classic" : "kid");
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
