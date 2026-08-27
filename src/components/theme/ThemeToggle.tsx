import { useTheme } from '../../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isGalaxy = theme === 'galaxy-quest';

  return (
    <button
      onClick={toggleTheme}
      aria-pressed={isGalaxy}
      aria-label={isGalaxy ? 'Switch to classic theme' : 'Switch to Galaxy Quest theme'}
      title={isGalaxy ? 'Classic theme' : 'Galaxy Quest theme'}
      className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-semibold text-primary/70 transition hover:border-secondary hover:text-secondary"
    >
      <span aria-hidden="true">{isGalaxy ? '🌌' : '✨'}</span>
      <span className="hidden sm:inline">{isGalaxy ? 'Galaxy Quest' : 'Classic'}</span>
    </button>
  );
}
