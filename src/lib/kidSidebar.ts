/**
 * Kid Mode sidebar collapse/expand.
 *
 * Adds a small toggle button (outside the React tree, so no component
 * changes) and keeps `<html data-sidebar="expanded|collapsed">` in sync. The
 * CSS for both states lives in the "KID MODE SKIN" block of src/index.css.
 *
 * Default: expanded on tablet/desktop, collapsed (icon rail) on phones. A
 * manual choice is remembered separately for phone vs. larger screens.
 * On phones the expanded sidebar overlays the page, so it closes again when
 * a nav link is tapped or the page behind it is tapped.
 */
type SidebarState = 'expanded' | 'collapsed';

const KEY = 'lingobite-play-sidebar';
const CHEVRON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';

export function initKidSidebar() {
  if (typeof window === 'undefined' || document.querySelector('.kid-sb-toggle')) return;
  const phone = window.matchMedia('(max-width: 767px)');
  const storageKey = () => `${KEY}:${phone.matches ? 'phone' : 'wide'}`;

  const read = (): SidebarState => {
    try {
      const v = window.localStorage.getItem(storageKey());
      if (v === 'expanded' || v === 'collapsed') return v;
    } catch { /* storage unavailable */ }
    return phone.matches ? 'collapsed' : 'expanded';
  };

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'kid-sb-toggle';
  btn.innerHTML = CHEVRON;

  const apply = (state: SidebarState) => {
    document.documentElement.setAttribute('data-sidebar', state);
    btn.setAttribute('aria-expanded', String(state === 'expanded'));
    btn.setAttribute('aria-label', state === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar');
  };

  const set = (state: SidebarState, remember: boolean) => {
    apply(state);
    if (!remember) return;
    try { window.localStorage.setItem(storageKey(), state); } catch { /* ignore */ }
  };

  btn.addEventListener('click', () => {
    const next: SidebarState =
      document.documentElement.getAttribute('data-sidebar') === 'expanded' ? 'collapsed' : 'expanded';
    set(next, true);
  });

  // Phones: tapping a nav link or anything outside the sidebar closes the overlay.
  document.addEventListener('click', (e) => {
    if (!phone.matches || document.documentElement.getAttribute('data-sidebar') !== 'expanded') return;
    const target = e.target as Element | null;
    if (!target || target === btn || btn.contains(target)) return;
    if (target.closest('header nav a') || !target.closest('header')) set('collapsed', false);
  });

  phone.addEventListener('change', () => apply(read()));

  document.body.appendChild(btn);
  apply(read());
}
