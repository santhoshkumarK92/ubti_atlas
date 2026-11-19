'use client';
import type { StoredFile } from '@/lib/types';
import { toEmbedUrl } from '@/lib/utils';

export function VideoBlock({ video, embedUrl, poster, title, onPlay }: { video?: StoredFile; embedUrl?: string; poster?: StoredFile; title: string; onPlay?: () => void }) {
  const embed = toEmbedUrl(embedUrl);
  if (video) {
    return (
      <video controls preload="metadata" poster={poster?.url} onPlay={onPlay} className="aspect-video w-full rounded-md border border-line bg-black">
        <source src={video.url} type={video.contentType || 'video/mp4'} />
      </video>
    );
  }
  if (embed) {
    return (
      <iframe src={embed} title={`${title} demo video`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen className="aspect-video w-full rounded-md border border-line bg-black" />
    );
  }
  return null;
}
