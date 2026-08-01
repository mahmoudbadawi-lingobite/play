import { useEffect, useState } from 'react';
import { getActiveAnnouncement, type Announcement } from '../../lib/services';

export function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    getActiveAnnouncement().then(setAnnouncement);
  }, []);

  if (!announcement || dismissed) return null;

  return (
    <div className="relative w-full border-b border-border bg-secondary/10">
      <div className="mx-auto max-w-6xl px-4 py-3 pe-10 sm:py-4">
        {announcement.type === 'text' && (
          <p className="text-center text-sm font-medium text-primary sm:text-base">
            {announcement.textContent}
          </p>
        )}

        {announcement.type === 'image' && announcement.mediaUrl && (
          <img
            src={announcement.mediaUrl}
            alt=""
            className="mx-auto max-h-48 w-full rounded-lg object-contain sm:max-h-72"
          />
        )}
      </div>

      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss announcement"
        className="absolute end-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-primary/60 hover:bg-primary/10 hover:text-primary"
      >
        ✕
      </button>
    </div>
  );
}
