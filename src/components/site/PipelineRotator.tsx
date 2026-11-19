'use client';
import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { t: 'Ingest', d: 'Connect databases, ERP, CRM, SaaS and files where they live — mirroring, shortcuts or APIs. No big-bang migration.' },
  { t: 'Unify', d: 'A governed semantic layer in Microsoft Fabric so every agent speaks your business language.' },
  { t: 'Analyze', d: 'Azure AI Foundry and Copilot Studio agents answer questions, spot anomalies and generate reports instantly.' },
  { t: 'Act', d: 'Agents create tasks, update records and notify people in Teams, email and your line-of-business apps.' },
];

/** One line — "AI to Ingest › Unify › Analyze › Act" — with the active step explained underneath. */
export function PipelineRotator() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((x) => (x + 1) % STEPS.length), 4200);
    return () => clearInterval(t);
  }, [paused]);
  return (
    <div className="relative p-5 md:p-6" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
        <span className="font-display text-2xl font-semibold text-muted md:text-3xl">AI to</span>
        {STEPS.map((s, k) => (
          <span key={s.t} className="flex items-center gap-1.5">
            <button
              onClick={() => setI(k)}
              aria-pressed={k === i}
              className={cn(
                'rounded-sm px-3 py-1 font-display text-xl font-semibold transition md:text-2xl',
                k === i ? 'bg-gradient-to-r from-accent to-violet text-white' : 'text-ink hover:bg-ink/5',
              )}
            >
              {s.t}
            </button>
            {k < STEPS.length - 1 && <ChevronRight className="h-4 w-4 shrink-0 text-muted/70" />}
          </span>
        ))}
      </div>
      <p key={i} className="mt-3 min-h-[4.5rem] max-w-md animate-fade-up text-[13px] leading-6 text-muted">
        <span className="mr-1.5 font-display text-xs text-accent">0{i + 1}</span>
        {STEPS[i]!.d}
      </p>
      <div className="mt-2 flex gap-1.5" aria-hidden>
        {STEPS.map((s, k) => (
          <span key={s.t} className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-ink/10">
            {k < i && <span className="absolute inset-0 bg-gradient-to-r from-accent to-violet" />}
            {k === i && <span key={i} className={cn('absolute inset-0 origin-left bg-gradient-to-r from-accent to-violet', !paused && 'animate-[grow_4.2s_linear]')} />}
          </span>
        ))}
      </div>
      <style>{`@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}`}</style>
    </div>
  );
}
