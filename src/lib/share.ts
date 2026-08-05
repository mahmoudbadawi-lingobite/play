/**
 * Shares a link via the native share sheet (mobile browsers, some desktop
 * browsers) when available, otherwise copies it to the clipboard. Returns
 * which method was used so the caller can show the right feedback.
 */
export async function shareLink(url: string, title: string): Promise<'shared' | 'copied' | 'failed'> {
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return 'shared';
    } catch {
      // user cancelled the share sheet, or it failed - fall through to copy
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}
