import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * Lets anyone flip the whole app between the classic navy/gold look and the
 * bright, rounded "kid mode" skin. Kid mode is the default. Only an explicit
 * choice is stored (ThemeContext), so it sticks across pages and reloads.
 *
 * The emoji is for the classic header; in the kid sidebar the skin hides it
 * and draws the controller icon from the mockup instead (.kid-btn-ic).
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
      className={`kid-mode-btn inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs font-semibold text-primary/70 hover:border-secondary hover:text-secondary sm:px-2.5 ${className}`}
    >
      <span className="kid-btn-ic" aria-hidden="true" />
      <span className="classic-emoji">{isKid ? "🎓" : "✨"} </span>
      <span className="kid-label">{isKid ? t("theme_classicMode") : t("theme_kidMode")}</span>
    </button>
  );
}
