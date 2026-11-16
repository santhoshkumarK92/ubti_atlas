import type { FlowStep } from '@/lib/types';
import { cn } from '@/lib/utils';

/** Renders the AI-described flow as a numbered pipeline (also the fallback when there's no diagram image). */
export function ArchitectureFlow({ steps, compact }: { steps: FlowStep[]; compact?: boolean }) {
  if (!steps.length) return null;
  return (
    <ol className={cn('relative grid gap-3', compact ? '' : 'sm:grid-cols-2 lg:grid-cols-1')}>
      {steps.map((s, i) => (
        <li key={i} className="relative flex gap-3">
          <div className="flex flex-col items-center">
            <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full border font-display text-sm font-bold', i === steps.length - 1 ? 'border-accent bg-accent text-white' : 'border-line bg-card')}>
              {i + 1}
            </span>
            {i < steps.length - 1 && <span className="mt-1 w-px flex-1 bg-gradient-to-b from-line to-transparent" />}
          </div>
          <div className="pb-3">
            <div className="text-sm font-medium">{s.title}</div>
            {s.detail && <div className="mt-0.5 text-[13px] text-muted">{s.detail}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
