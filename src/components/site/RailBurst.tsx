'use client';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Section background split at the vertical rail: the part right of the line is always there,
 * the strip to the left bursts outward from the line the first time the section is in view.
 */
export function RailBurst({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => { if (e?.isIntersecting) { setTimeout(() => setOn(true), 350); io.disconnect(); } },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <span className={cn('absolute inset-y-0 right-0 left-[var(--rail)]', className)} />
      <span
        className={cn('absolute inset-y-0 left-0 w-[var(--rail)] origin-right transition-transform duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)]', on ? 'scale-x-100' : 'scale-x-0', className)}
      />
    </div>
  );
}
