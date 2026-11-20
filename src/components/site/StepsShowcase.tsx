'use client';
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const TINTS = ['#a9c8f5', '#fae6a1', '#f4c9c4', '#d9d3ec'];

/** The GIF (public/images/step-ingest.gif) shows each step for 1.8 s, then a wrap-up, then loops (16.2 s). */
const GIF = '/images/step-ingest.gif';
const STEP_MS = 1800; // one frame per step: Ingest, Unify, Analyze, Act
const LOOP_MS = 16200; // total length of the GIF

/** Left: the workflow GIF, always playing. Right: the four steps, lit up in sync with the GIF. */
export function StepsShowcase({ steps }: { steps: { t: string; d: string }[] }) {
  const [cycle, setCycle] = useState(0); // remounting the <img> restarts the GIF at frame 1
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);

  // Start the clock only once the GIF has actually loaded, so the steps line up with it.
  useEffect(() => {
    if (!started) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    steps.forEach((_, k) => timers.push(setTimeout(() => setI(k), k * STEP_MS)));
    timers.push(setTimeout(() => { setStarted(false); setI(0); setCycle((c) => c + 1); }, LOOP_MS));
    return () => timers.forEach(clearTimeout);
  }, [started, steps]);

  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
      {/* the GIF */}
      <div className="relative aspect-[3/2] w-full overflow-hidden border border-ink bg-[#0e3b3b] lg:aspect-auto lg:min-h-[420px]">
        <img
          loading="lazy"
          decoding="async"
          key={cycle}
          src={GIF}
          alt="UBTI AI agent working through Ingest, Unify, Analyze and Act"
          ref={(el) => { if (el && el.complete && el.naturalWidth) setStarted(true); }}
          onLoad={() => setStarted(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {/* steps — follow the GIF */}
      <ol className="flex flex-col border-t border-ink">
        {steps.map((s, k) => {
          const on = k === i;
          return (
            <li key={s.t} className="flex-1 border-b border-ink">
              <div
                aria-current={on ? 'step' : undefined}
                className={cn('relative flex h-full flex-col justify-center overflow-hidden px-5 py-4 transition-colors duration-300 md:px-6', on ? 'text-[#0c0f14]' : 'text-ink')}
                style={on ? { background: TINTS[k] } : undefined}
              >
                <div className="flex items-baseline gap-4">
                  <span className={cn('font-display text-xs font-bold', on ? 'text-[#0c0f14]' : 'text-accent')}>0{k + 1}</span>
                  <h3 className="text-[clamp(1.2rem,1.7vw,1.7rem)] font-extrabold leading-none tracking-[-0.04em]">{s.t}.</h3>
                </div>
                <div className={cn('grid transition-all duration-500', on ? 'mt-2 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
                  <p className="overflow-hidden pl-[2rem] text-[13px] leading-5 text-[#0c0f14]/80">{s.d}</p>
                </div>
                {on && started && (
                  <span
                    key={`${cycle}-${k}`}
                    className="absolute bottom-0 left-0 h-[3px] w-0 bg-[#0c0f14]"
                    style={{ animation: `stepbar ${k === steps.length - 1 ? LOOP_MS - k * STEP_MS : STEP_MS}ms linear forwards` }}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <style>{`@keyframes stepbar{from{width:0}to{width:100%}}`}</style>
    </div>
  );
}
