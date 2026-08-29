import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * Lets anyone flip the whole app between the classic navy/gold look and the
 * bright, rounded "kid mode" skin — ported from LingoTrace. Persists via
 * ThemeContext (localStorage), so the choice sticks across pages and
 * reloads.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isKid = theme === "kid";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isKid ? t("theme_switchToClassic") : t("theme_switchToKid")}
      aria-pressed={isKid}
      className={`rounded-lg border border-border px-2 py-1.5 text-xs font-semibold text-primary/70 hover:border-secondary hover:text-secondary sm:px-2.5 ${
        isKid ? "border-2 shadow-[0_3px_0_hsl(var(--secondary)/0.4)]" : ""
      } ${className}`}
    >
      {isKid ? `🎓 ${t("theme_classicMode")}` : `✨ ${t("theme_kidMode")}`}
    </button>
  );
}
