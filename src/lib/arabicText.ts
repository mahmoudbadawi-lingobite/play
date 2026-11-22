/** Helpers for games that work letter by letter, so Arabic words behave sensibly. */
export const isArabicText = (s: string) => /[؀-ۿ]/.test(s);
const MARKS = /[ً-ٰٟـ]/g; // tashkeel + superscript alef + tatweel

export const stripMarks = (s: string) => s.replace(MARKS, '');

/** Normalised form for comparing typed answers (ignores tashkeel, alef/yaa/taa-marbuta variants and case). */
export function sameAnswer(a: string, b: string): boolean {
  const n = (x: string) => letterFold(stripMarks(x).trim().toLowerCase());
  return n(a) === n(b);
}

/** Fold look-alike Arabic letters so a child is not marked wrong for أ/ا or ى/ي. */
export function letterFold(s: string): string {
  return s.replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي');
}

export const ARABIC_KEYBOARD = 'ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي ة ء'.split(' ');
export const LATIN_KEYBOARD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** The key a character belongs to on the on-screen keyboard, or null when it is not a letter (space, digit, punctuation). */
export function letterKey(ch: string): string | null {
  if (/[A-Za-z]/.test(ch)) return ch.toUpperCase();
  if (/[ء-ي]/.test(ch)) return letterFold(ch);
  return null;
}
