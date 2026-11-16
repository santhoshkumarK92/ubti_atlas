'use client';
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react';
import { cn, initials } from '@/lib/utils';

/** <img> with a graceful gradient fallback when the source is missing or fails. */
export function Img({ src, alt, className, fallbackLabel, imgClassName }: { src?: string; alt: string; className?: string; imgClassName?: string; fallbackLabel?: string }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // Catch images that failed before hydration (onError fired before React attached)
  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, [src]);
  if (!src || failed) {
    return (
      <div className={cn('relative grid place-items-center overflow-hidden bg-gradient-to-br from-accent/25 via-violet/20 to-soft', className)} aria-label={alt}>
        <span className="font-display text-3xl font-semibold text-ink/40">{initials(fallbackLabel || alt)}</span>
      </div>
    );
  }
  return (
    <div className={cn('relative overflow-hidden bg-soft', className)}>
      <img ref={ref} src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={cn('h-full w-full object-cover', imgClassName)} />
    </div>
  );
}
