import type { ReactNode } from 'react';

// Single capturing group so String.split() alternates cleanly: even indices
// are plain text, odd indices are the matched URLs.
const URL_PATTERN = /((?:https?:\/\/|www\.)[^\s<]+)/gi;

/**
 * Splits plain text on URLs (http(s):// or www.) and returns an array of
 * strings and <a> elements, so announcement text can contain a real,
 * clickable link without needing a full rich-text editor.
 */
export function linkify(text: string): ReactNode[] {
  return text.split(URL_PATTERN).map((part, i) => {
    if (i % 2 === 1) {
      const href = part.startsWith('www.') ? `https://${part}` : part;
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-secondary underline-offset-2 hover:text-secondary"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}
