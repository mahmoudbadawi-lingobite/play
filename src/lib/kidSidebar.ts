/**
 * Kid Mode sidebar collapse/expand.
 *
 * Adds a small toggle button (outside the React tree, so no component
 * changes) and keeps `<html data-sidebar="expanded|collapsed">` in sync. The
 * CSS for both states lives in src/kid-skin.css.
 *
 * Phones (portrait, <= 767px): the sidebar ALWAYS starts collapsed (icon rail)
 * on every visit. Tapping the round button opens it as an overlay; it closes
 * again when a nav link or the page behind it is tapped. Nothing is remembered
 * for phones.
 * Tablets / desktop: expanded by default; a manual choice is remembered.
 *
 * index.html sets the same initial state before first paint (no flash).
 */
type SidebarState = 'expanded' | 'collapsed';

const KEY = 'lingobite-play-sidebar:wide';
const CHEVRON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';

export function initKidSidebar() {
  if (typeof window === 'undefined' || document.querySelector('.kid-sb-toggle')) return;
  const phone = window.matchMedia('(max-width: 767px)');

  const initial = (): SidebarState => {
    if (phone.matches) return 'collapsed';
    try {
      if (window.localStorage.getItem(KEY) === 'collapsed') return 'collapsed';
    } catch { /* storage unavailable */ }
    return 'expanded';
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
    if (!remember || phone.matches) return;
    try { window.localStorage.setItem(KEY, state); } catch { /* ignore */ }
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

  // Rotating / resizing across the phone breakpoint resets to that size's default.
  phone.addEventListener('change', () => apply(initial()));

  document.body.appendChild(btn);
  apply(initial());
}
