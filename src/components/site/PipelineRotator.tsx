'use client';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const STEPS = [
  { t: 'Ingest', d: 'Connect databases, ERP, CRM, SaaS and files where they live — mirroring, shortcuts or APIs. No big-bang migration.' },
  { t: 'Unify', d: 'A governed semantic layer in Microsoft Fabric so every agent speaks your business language.' },
  { t: 'Analyze', d: 'Azure AI Foundry and Copilot Studio agents answer questions, spot anomalies and generate reports instantly.' },
  { t: 'Act', d: 'Agents create tasks, update records and notify people in Teams, email and your line-of-business apps.' },
];

export function PipelineRotator() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((x) => (x + 1) % STEPS.length), 4200);
    return () => clearInterval(t);
  }, [paused]);
  return (
    <div className="flex h-full flex-col" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {STEPS.map((s, k) => (
        <button
          key={s.t}
          onClick={() => setI(k)}
          className={cn('relative border-b border-line px-6 py-5 text-left transition last:border-b-0 md:py-6', k === i ? 'bg-card' : 'hover:bg-card/50')}
        >
          <div className="flex items-center gap-3">
            <span className="font-display text-xs text-muted">0{k + 1}</span>
            <span className={cn('font-display text-2xl font-semibold transition', k === i ? 'text-ink' : 'text-muted/70')}>AI to {s.t}</span>
          </div>
          <p className={cn('mt-2 max-w-sm text-[13px] leading-6 transition', k === i ? 'text-muted' : 'text-muted/50 line-clamp-1')}>{s.d}</p>
          {k === i && !paused && <span key={i} className="absolute bottom-0 left-0 h-[2px] w-full origin-left animate-[grow_4.2s_linear] bg-gradient-to-r from-accent to-violet" />}
        </button>
      ))}
      <style>{`@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}`}</style>
    </div>
  );
}
