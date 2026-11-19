'use client';
import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Fades and slides its children up the first time they scroll into view. */
export function Reveal({
  as = 'div', delay = 0, className, children,
}: { as?: ElementType; delay?: number; className?: string; children: ReactNode }) {
  const Tag = as;
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => { if (e?.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : '0ms' }}
      className={cn('transition-[opacity,transform] duration-700 ease-out will-change-transform', shown ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0', className)}
    >
      {children}
    </Tag>
  );
}
