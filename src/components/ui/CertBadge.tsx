'use client';
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/** Official Microsoft Learn badge, with a neutral text tile if the image can't load. */
export function CertBadge({ src, code, level, className }: { src: string; code: string; level: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // Catch images that failed before hydration (onError fired before React attached)
  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, [src]);
  if (failed || !src) {
    return (
      <div className={cn('grid aspect-square place-items-center rounded-md border border-line bg-gradient-to-br from-soft to-card text-center', className)}>
        <div>
          <div className="font-display text-xl font-bold">{code}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted">{level}</div>
        </div>
      </div>
    );
  }
  return <img ref={ref} src={src} alt={`${code} badge`} loading="lazy" onError={() => setFailed(true)} className={cn('aspect-square object-contain', className)} />;
}
