'use client';
import { useEffect, useRef, useState } from 'react';
import type { Industry } from '@/lib/types';
import { IndustryCard } from './IndustryCard';
import { cn } from '@/lib/utils';

const PER_SET = 3;
const EVERY_MS = 3000;
const FADE_MS = 350;

/** Shows industries three at a time; every 3 seconds the set blinks out and the next three fade in. */
export function IndustryRotator({ items }: { items: { industry: Industry; count: number }[] }) {
  const sets = Math.max(1, Math.ceil(items.length / PER_SET));
  const [set, setSet] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [paused, setPaused] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const goTo = (next: number) => {
    setHidden(true);
    timers.current.push(setTimeout(() => { setSet(next); setHidden(false); }, FADE_MS));
  };

  useEffect(() => {
    if (paused || sets < 2) return;
    const t = setInterval(() => goTo((set + 1) % sets), EVERY_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, set, sets]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Last set may be short — top it up from the start so the row always has three cards.
  const start = set * PER_SET;
  const visible = Array.from({ length: Math.min(PER_SET, items.length) }, (_, k) => items[(start + k) % items.length]!);

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className={cn('grid gap-4 transition-all ease-out sm:grid-cols-3', hidden ? 'scale-[0.98] opacity-0' : 'scale-100 opacity-100')} style={{ transitionDuration: `${FADE_MS}ms` }}>
        {visible.map(({ industry, count }) => <IndustryCard key={industry.id} i={industry} count={count} />)}
      </div>
      {sets > 1 && (
        <div className="mt-5 flex justify-center gap-2" role="tablist" aria-label="Industry sets">
          {Array.from({ length: sets }, (_, k) => (
            <button
              key={k}
              role="tab"
              aria-selected={k === set}
              aria-label={`Industries set ${k + 1}`}
              onClick={() => k !== set && goTo(k)}
              className={cn('h-2 rounded-full transition-all', k === set ? 'w-7 bg-gradient-to-r from-accent to-violet' : 'w-2 bg-ink/20 hover:bg-ink/40')}
            />
          ))}
        </div>
      )}
    </div>
  );
}
