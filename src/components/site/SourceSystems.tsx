/* eslint-disable @next/next/no-img-element */
import { ArrowRight, Bot, FileText, MessageSquare, Workflow } from 'lucide-react';

export interface SourcePlatform { id: string; name: string; logoUrl?: string }

const OUT = [
  { icon: Bot, t: 'Agents that act', d: 'Create tasks, update records' },
  { icon: MessageSquare, t: 'Ask in plain English', d: 'Answers grounded in your data' },
  { icon: FileText, t: 'Instant reports', d: 'Summaries & anomalies, on demand' },
  { icon: Workflow, t: 'Next steps', d: 'Routed to Teams, email, apps' },
];

/** Source systems → UBTI AI layer → outcomes. Flat, ruled grid. */
export function SourceSystems({ platforms }: { platforms: SourcePlatform[] }) {
  const src = platforms.slice(0, 7);
  return (
    <div className="grid border-l border-t border-ink lg:grid-cols-[1fr_minmax(220px,0.7fr)_1fr]">
      {/* sources */}
      <div className="border-b border-r border-ink">
        <div className="border-b border-ink bg-[#0c0f14] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#fefffa]">Where your data lives</div>
        <ul>
          {src.map((p, i) => (
            <li key={p.id} className={`flex items-center gap-3 px-5 py-3.5 ${i < src.length ? 'border-b border-line' : ''}`}>
              {p.logoUrl ? <img src={p.logoUrl} alt="" className="h-6 w-6 shrink-0 object-contain" /> : <span className="h-6 w-6 shrink-0 bg-soft" />}
              <span className="truncate text-[15px] font-semibold">{p.name}</span>
            </li>
          ))}
          <li className="px-5 py-3.5 text-[13px] text-muted">+ any SQL, API or files</li>
        </ul>
      </div>

      {/* core */}
      <div className="relative flex flex-col items-center justify-center gap-4 border-b border-r border-ink bg-[#123f3a] px-6 py-10 text-center text-[#fefffa]">
        <ArrowRight className="h-6 w-6 rotate-90 text-[#f6c835] lg:rotate-0" />
        <div>
          <div className="font-display text-5xl font-extrabold tracking-[-0.05em]">UBTI</div>
          <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#a9c8f5]">AI layer</div>
        </div>
        <p className="max-w-[18ch] text-[13px] leading-5 text-[#fefffa]/75">Ingest, unify, analyze, act — without moving your data.</p>
        <ArrowRight className="h-6 w-6 rotate-90 text-[#f6c835] lg:rotate-0" />
      </div>

      {/* outcomes */}
      <div className="border-b border-r border-ink">
        <div className="border-b border-ink bg-[#f6c835] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#0c0f14]">What your teams get</div>
        <ul>
          {OUT.map(({ icon: Icon, t, d }) => (
            <li key={t} className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-b-0">
              <Icon className="h-5 w-5 shrink-0 text-accent" />
              <div className="min-w-0"><div className="text-[15px] font-semibold">{t}</div><div className="text-[13px] text-muted">{d}</div></div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
