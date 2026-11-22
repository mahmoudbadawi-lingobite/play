import i18n from 'i18next';
import { AR } from './ar';

/** Translate an English UI string. Falls back to the English text. `{name}` placeholders are filled from vars. */
export function tr(en: string, vars?: Record<string, string | number>): string {
  const isAr = (i18n.language ?? 'en').startsWith('ar');
  let s = isAr ? AR[en] ?? en : en;
  if (vars) for (const k of Object.keys(vars)) s = s.split(`{${k}}`).join(String(vars[k]));
  return s;
}
