/* eslint-disable @next/next/no-img-element */
import { Bot, FileText, MessageSquare, Workflow } from 'lucide-react';

export interface SourcePlatform { id: string; name: string; logoUrl?: string }

const OUT = [
  { icon: Bot, t: 'Agents that act', d: 'Create tasks, update records' },
  { icon: MessageSquare, t: 'Ask in plain English', d: 'Answers grounded in your data' },
  { icon: FileText, t: 'Instant reports', d: 'Summaries & anomalies, on demand' },
  { icon: Workflow, t: 'Next steps', d: 'Routed to Teams, email, apps' },
];

/** Source systems → UBTI AI layer → outcomes, with animated data flow. */
export function SourceSystems({ platforms }: { platforms: SourcePlatform[] }) {
  const src = platforms.slice(0, 7);
  return (
    <div className="relative grid items-center gap-6 p-6 md:p-10 lg:grid-cols-[1fr_auto_auto_auto_1fr] lg:gap-0">
      {/* sources */}
      <div className="grid grid-cols-2 gap-3">
        {src.map((p, i) => (
          <div key={p.id} className="flex items-center gap-2.5 rounded-2xl border border-white/70 bg-card/80 px-3 py-2.5 shadow-sm backdrop-blur dark:border-line" style={{ animation: `fadeUp .5s ease ${i * 80}ms both` }}>
            {p.logoUrl ? <img src={p.logoUrl} alt="" className="h-6 w-6 shrink-0 object-contain" /> : <span className="h-6 w-6 shrink-0 rounded-md bg-soft" />}
            <span className="truncate text-[13px] font-medium">{p.name}</span>
          </div>
        ))}
        <div className="grid place-items-center rounded-2xl border border-dashed border-ink/20 px-3 py-2.5 text-[12px] text-muted">+ any SQL / API / files</div>
      </div>

      {/* flow in */}
      <Flow />

      {/* core */}
      <div className="relative mx-auto grid h-52 w-52 place-items-center">
        <span className="absolute inset-0 animate-[spin_14s_linear_infinite] rounded-full border border-dashed border-accent/50" />
        <span className="absolute inset-4 animate-[spin_20s_linear_infinite_reverse] rounded-full border border-dashed border-violet/50" />
        <span className="absolute inset-8 rounded-full bg-gradient-to-br from-accent/30 to-violet/30 blur-xl" />
        <div className="relative grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-accent to-violet text-center text-white shadow-[0_0_50px_-5px_rgb(var(--accent)/.7)]">
          <div>
            <div className="font-display text-xl font-bold leading-none">UBTI</div>
            <div className="mt-1 text-[10px] uppercase tracking-widest opacity-90">AI layer</div>
          </div>
        </div>
      </div>

      {/* flow out */}
      <Flow />

      {/* outcomes */}
      <div className="grid gap-3">
        {OUT.map(({ icon: Icon, t, d }) => (
          <div key={t} className="flex items-center gap-3 rounded-2xl border border-white/70 bg-card/80 px-4 py-3 shadow-sm backdrop-blur dark:border-line">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent/15 to-violet/15 text-accent"><Icon className="h-4 w-4" /></span>
            <div className="min-w-0"><div className="text-sm font-semibold">{t}</div><div className="text-[12px] text-muted">{d}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Flow() {
  return (
    <div className="relative mx-auto hidden h-px w-16 overflow-hidden lg:block xl:w-24">
      <span className="absolute inset-0 animate-[flow_1.6s_linear_infinite] bg-[linear-gradient(90deg,transparent,rgb(var(--accent)),rgb(var(--violet)),transparent)] bg-[length:200%_100%]" />
      <style>{`@keyframes flow{from{background-position:200% 0}to{background-position:-200% 0}}`}</style>
    </div>
  );
}
