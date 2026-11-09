import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { getInstallMode, isRunningAsApp, subscribeInstall, triggerInstall, type InstallMode } from "../../lib/pwaInstall";

/* Tiny inline icons (this app has no icon package). */
type IconProps = { size?: number; className?: string };
function Svg({ size = 16, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}
const ChevronDown = (p: IconProps) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>;
const ChevronUp = (p: IconProps) => <Svg {...p}><path d="m18 15-6-6-6 6" /></Svg>;
const Download = (p: IconProps) => <Svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" /></Svg>;
const Share2 = (p: IconProps) => <Svg {...p}><path d="M12 3v12" /><path d="m8 7 4-4 4 4" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></Svg>;
const MoreVertical = (p: IconProps) => <Svg {...p}><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></Svg>;
const ExternalLink = (p: IconProps) => <Svg {...p}><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></Svg>;
const PlusSquare = (p: IconProps) => <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M12 8v8" /><path d="M8 12h8" /></Svg>;
const Check = (p: IconProps) => <Svg {...p}><path d="M20 6 9 17l-5-5" /></Svg>;
const Smartphone = (p: IconProps) => <Svg {...p}><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></Svg>;

// Open/closed is remembered only for this visit. The dock starts folded on every page load.
let openThisVisit = false;

/** A small phone illustration: gold frame, an app grid, and the LingoTrace icon glowing as the one to add. */
function PhoneArt() {
  return (
    <svg viewBox="0 0 120 150" className="h-28 w-24 shrink-0 drop-shadow-lg sm:h-32 sm:w-28" aria-hidden="true">
      <defs>
        <linearGradient id="ia-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f5d98a" />
          <stop offset="1" stopColor="#c99a2e" />
        </linearGradient>
        <radialGradient id="ia-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffe7a1" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffe7a1" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="78" r="58" fill="url(#ia-glow)" className="animate-pulse" />
      <rect x="22" y="14" width="76" height="124" rx="16" fill="url(#ia-body)" />
      <rect x="27" y="19" width="66" height="114" rx="12" fill="#14213d" />
      <rect x="49" y="23" width="22" height="5" rx="2.5" fill="#0a1226" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => {
          if (r === 1 && c === 1) return null;
          const palette = ["#7c6cf0", "#f08c6c", "#5cc6a6", "#f0c75c", "#6cb4f0"];
          return <rect key={`${r}${c}`} x={34 + c * 19} y={42 + r * 24} width="15" height="15" rx="4.5" fill={palette[(r * 3 + c) % palette.length]} opacity="0.55" />;
        })
      )}
      <rect x="51" y="64" width="18" height="18" rx="5" fill="#fff" className="animate-pulse" />
      <image href={`${import.meta.env.BASE_URL}logo-192.png`} x="52.5" y="65.5" width="15" height="15" />
      <path d="M96 22 l2.2 5.4 5.4 2.2 -5.4 2.2 -2.2 5.4 -2.2 -5.4 -5.4 -2.2 5.4 -2.2z" fill="#ffe7a1" className="animate-pulse" />
      <path d="M14 104 l1.6 3.8 3.8 1.6 -3.8 1.6 -1.6 3.8 -1.6 -3.8 -3.8 -1.6 3.8 -1.6z" fill="#ffe7a1" className="animate-pulse" />
    </svg>
  );
}

function Step({ n, icon, children }: { n: number; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2 text-xs leading-snug text-primary-foreground sm:text-sm">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-bold text-secondary-foreground">{n}</span>
      <span className="flex-1">{children}</span>
      <span className="shrink-0 text-secondary">{icon}</span>
    </li>
  );
}

/**
 * The "Get the app" dock. Mounted once in App.tsx, so it is on EVERY page (home, logins, teacher, school, admin,
 * student and parent portals…). It starts as a slim pill at the bottom of the screen and opens into an illustrated
 * card with a real Install button (where the browser allows it) or step-by-step instructions (everywhere else).
 * It disappears for good once the app is installed.
 */
export function InstallDock() {
  const { t } = useTranslation();
  const [, force] = useState(0);
  const [open, setOpen] = useState(openThisVisit);
  const [busy, setBusy] = useState(false);
  const [declined, setDeclined] = useState(false);

  useEffect(() => subscribeInstall(() => force((n) => n + 1)), []);

  if (isRunningAsApp()) return null;

  const mode: InstallMode = getInstallMode();
  const setOpenSticky = (v: boolean) => {
    openThisVisit = v;
    setOpen(v);
  };

  async function install() {
    setBusy(true);
    try {
      const outcome = await triggerInstall();
      if (outcome === "dismissed") setDeclined(true);
    } finally {
      setBusy(false);
    }
  }

  const steps: { icon: React.ReactNode; text: string }[] =
    mode === "ios"
      ? [
          { icon: <Share2 size={16} />, text: t('pwa_iosS1', "Tap the Share button at the bottom of Safari") },
          { icon: <PlusSquare size={16} />, text: t('pwa_iosS2', "Scroll down and choose “Add to Home Screen”") },
          { icon: <Check size={16} />, text: t('pwa_iosS3', "Tap “Add” — the LingoBite Play icon appears on your home screen") },
        ]
      : mode === "iosOther"
      ? [
          { icon: <ExternalLink size={16} />, text: t('pwa_iosOtherS1', "Open this page in Safari (copy the link and paste it there)") },
          { icon: <Share2 size={16} />, text: t('pwa_iosS1', "Tap the Share button at the bottom of Safari") },
          { icon: <PlusSquare size={16} />, text: t('pwa_iosS2', "Scroll down and choose “Add to Home Screen”") },
        ]
      : mode === "inApp"
      ? [
          { icon: <MoreVertical size={16} />, text: t('pwa_inAppS1', "Tap the ⋮ (or Share) icon at the top of this screen") },
          { icon: <ExternalLink size={16} />, text: t('pwa_inAppS2', "Choose “Open in browser” (Chrome or Safari)") },
          { icon: <Download size={16} />, text: t('pwa_inAppS3', "Then follow the install steps shown here") },
        ]
      : [
          { icon: <MoreVertical size={16} />, text: t('pwa_manualS1', "Open your browser menu (⋮ or ⋯)") },
          { icon: <Download size={16} />, text: t('pwa_manualS2', "Choose “Install app” or “Add to Home screen”") },
          { icon: <Check size={16} />, text: t('pwa_manualS3', "Confirm — LingoBite Play opens like a normal app") },
        ];

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-2 px-3 pb-3 print:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      {open && (
        <section
          aria-label={t('pwa_title', "Get the LingoBite Play app")}
          className="pointer-events-auto relative max-h-[75vh] w-full max-w-md overflow-y-auto rounded-3xl border border-secondary/60 bg-gradient-to-br from-primary via-primary to-primary/85 p-4 text-primary-foreground shadow-2xl sm:p-5"
        >
          <div className="pointer-events-none absolute -end-10 -top-10 h-40 w-40 rounded-full bg-secondary/20 blur-2xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-12 -start-8 h-36 w-36 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />

          <div className="relative flex items-center gap-3 sm:gap-4">
            <PhoneArt />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-secondary">{t('pwa_eyebrow', "Always one tap away")}</p>
              <h2 className="font-serif text-lg font-semibold leading-tight text-white sm:text-xl">{t('pwa_title', "Get the LingoBite Play app")}</h2>
              <p className="mt-1 text-xs leading-relaxed text-primary-foreground/75 sm:text-sm">
                {t('pwa_subtitle', "Play LingoBite games straight from your home screen — fast, full-screen and no browser bar.")}
              </p>
              {mode === "native" && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={install}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-bold text-secondary-foreground shadow-md transition hover:brightness-110 disabled:opacity-60"
                  >
                    <Download size={16} />
                    {t('pwa_installBtn', "Install app")}
                  </button>
                  {declined && <span className="text-xs text-primary-foreground/75">{t('pwa_declined', "No problem — you can install it any time from here.")}</span>}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setOpenSticky(false)}
              aria-label={t('pwa_fold', "Fold")}
              className="self-start rounded-lg p-1.5 text-primary-foreground/75 transition hover:bg-white/10 hover:text-white"
            >
              <ChevronDown size={18} />
            </button>
          </div>

          {mode !== "native" && (
            <div className="relative mt-4">
              <p className="mb-2 text-xs font-semibold text-secondary">{t('pwa_howTo', "How to install — it takes 10 seconds")}</p>
              <ol className="space-y-1.5">
                {steps.map((s, i) => (
                  <Step key={i} n={i + 1} icon={s.icon}>
                    {s.text}
                  </Step>
                ))}
              </ol>
            </div>
          )}
        </section>
      )}

      {!open && (
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-secondary/60 bg-primary/95 p-1 text-primary-foreground shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => setOpenSticky(true)}
            aria-expanded={false}
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition hover:bg-white/10"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary/30 text-secondary">
              <Smartphone size={14} />
            </span>
            {t('pwa_pill', "Get the app")}
            <ChevronUp size={14} className="text-secondary" />
          </button>
          {mode === "native" && (
            <button
              type="button"
              onClick={install}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground transition hover:brightness-110 disabled:opacity-60"
            >
              <Download size={13} />
              {t('pwa_installBtn', "Install app")}
            </button>
          )}
        </div>
      )}
    </div>,
    document.body
  );
}
