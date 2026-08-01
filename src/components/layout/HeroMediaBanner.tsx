import { useEffect, useState } from 'react';
import { getActiveHeroMedia, type HeroMedia } from '../../lib/services';

export function HeroMediaBanner() {
  const [media, setMedia] = useState<HeroMedia | null>(null);

  useEffect(() => {
    getActiveHeroMedia().then(setMedia);
  }, []);

  if (!media) return null;

  return (
    <div className="w-full px-3 py-4 sm:px-6 sm:py-6 md:px-10">
      <div className="mx-auto aspect-video w-full max-w-4xl overflow-hidden rounded-2xl border border-border shadow-lg">
        {media.type === 'image' ? (
          <img src={media.mediaUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <video
            src={media.mediaUrl}
            autoPlay
            muted
            loop
            playsInline
            controls
            className="h-full w-full object-cover"
          />
        )}
      </div>
    </div>
  );
}
