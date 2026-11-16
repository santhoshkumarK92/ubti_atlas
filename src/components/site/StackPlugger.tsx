'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowUpRight, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LitePlatform { id: string; name: string; category: string }
export interface LiteIndustry { id: string; shortName: string }
export interface LiteProject { id: string; slug: string; title: string; tagline: string; industryId: string; extraIndustryIds: string[]; platformIds: string[]; maturity: string }

const OUTCOMES = ['AI agents that act', 'Q&A in plain English', 'Reports generated instantly', 'Action items & next steps'];
const DEFAULT = ['salesforce-sales-cloud', 'oracle-database', 'sharepoint'];

/** "Plug in your stack": pick systems + industry → live diagram + matching agents. */
export function StackPlugger({ platforms, industries, projects }: { platforms: LitePlatform[]; industries: LiteIndustry[]; projects: LiteProject[] }) {
  const [sel, setSel] = useState<string[]>(DEFAULT.filter((d) => platforms.some((p) => p.id === d)));
  const [industry, setIndustry] = useState('');
  const cats = useMemo(() => [...new Set(platforms.map((p) => p.category))], [platforms]);
  const [cat, setCat] = useState(cats[0] ?? '');

  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 8 ? s : [...s, id]));
  const chosen = sel.map((id) => platforms.find((p) => p.id === id)!).filter(Boolean);

  const matches = useMemo(() => {
    return projects
      .map((p) => {
        let s = 0;
        const overlap = p.platformIds.filter((x) => sel.includes(x)).length;
        s += overlap * 10;
        if (industry && p.industryId === industry) s += 25;
        else if (industry && p.extraIndustryIds.includes(industry)) s += 15;
        if (p.maturity === 'template') s += 3;
        return { p, s, overlap };
      })
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 3);
  }, [projects, sel, industry]);

  const shown = chosen.slice(0, 6);
  const H = 380;
  const ys = shown.map((_, i) => (shown.length === 1 ? H / 2 : 40 + (i * (H - 80)) / (shown.length - 1)));
  const oy = OUTCOMES.map((_, i) => 70 + i * ((H - 140) / 3));

  return (
    <div className="grid lg:grid-cols-[380px_1fr]">
      {/* picker */}
      <div className="border-b border-line p-6 lg:border-b-0 lg:border-r">
        <div className="eyebrow mb-3">1 · Your systems</div>
        <div className="scrollbar-none -mx-1 mb-3 flex gap-1 overflow-x-auto px-1 pb-1">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={cn('chip shrink-0 text-[11px]', c === cat && 'chip-on')}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex max-h-[220px] flex-wrap gap-1.5 overflow-y-auto pr-1">
          {platforms
            .filter((p) => p.category === cat)
            .map((p) => {
              const on = sel.includes(p.id);
              return (
                <button key={p.id} onClick={() => toggle(p.id)} className={cn('chip transition', on && 'border-accent bg-accent/10 text-ink')}>
                  {on ? <Check className="h-3 w-3 text-accent" /> : <Plus className="h-3 w-3 text-muted" />}
                  {p.name}
                </button>
              );
            })}
        </div>
        <div className="eyebrow mb-2 mt-6">2 · Your industry</div>
        <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="input">
          <option value="">Any industry</option>
          {industries.map((i) => (
            <option key={i.id} value={i.id}>{i.shortName}</option>
          ))}
        </select>
        {chosen.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {chosen.map((c) => (
              <button key={c.id} onClick={() => toggle(c.id)} className="chip chip-on text-[11px]">{c.name} ×</button>
            ))}
          </div>
        )}
      </div>

      {/* diagram + matches */}
      <div className="p-4 md:p-6">
        <svg viewBox={`0 0 900 ${H}`} className="w-full" role="img" aria-label="Your systems connected to the UBTI AI layer">
          <defs>
            <linearGradient id="hub" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="rgb(var(--accent))" />
              <stop offset="1" stopColor="rgb(var(--violet))" />
            </linearGradient>
          </defs>
          {shown.map((_, i) => (
            <path key={`l${i}`} d={`M232 ${ys[i]} C 300 ${ys[i]}, 300 ${H / 2}, 360 ${H / 2}`} fill="none" stroke="rgb(var(--accent))" strokeOpacity=".55" strokeWidth="1.5" strokeDasharray="5 7" className="animate-dash" />
          ))}
          {OUTCOMES.map((_, i) => (
            <path key={`r${i}`} d={`M540 ${H / 2} C 600 ${H / 2}, 600 ${oy[i]}, 668 ${oy[i]}`} fill="none" stroke="rgb(var(--violet))" strokeOpacity=".55" strokeWidth="1.5" strokeDasharray="5 7" className="animate-dash" />
          ))}
          {shown.length === 0 && (
            <text x="120" y={H / 2} textAnchor="middle" className="fill-muted text-[13px]">Pick a system →</text>
          )}
          {shown.map((p, i) => (
            <g key={p.id} transform={`translate(8 ${ys[i]! - 20})`}>
              <rect width="224" height="40" rx="12" className="fill-card stroke-line" />
              <circle cx="20" cy="20" r="4" fill="rgb(var(--good))" />
              <text x="34" y="25" className="fill-ink text-[13px] font-medium">{p.name.length > 26 ? p.name.slice(0, 25) + '…' : p.name}</text>
            </g>
          ))}
          {chosen.length > 6 && <text x="120" y={H - 4} textAnchor="middle" className="fill-muted text-[11px]">+{chosen.length - 6} more</text>}
          <g transform={`translate(360 ${H / 2 - 74})`}>
            <rect width="180" height="148" rx="22" fill="url(#hub)" />
            <text x="90" y="44" textAnchor="middle" className="fill-white font-display text-[20px] font-semibold">UBTI AI layer</text>
            {['Microsoft Fabric', 'AI Foundry agents', 'Copilot Studio'].map((t, i) => (
              <text key={t} x="90" y={74 + i * 22} textAnchor="middle" fill="white" fillOpacity=".85" className="text-[12px]">{t}</text>
            ))}
          </g>
          {OUTCOMES.map((o, i) => (
            <g key={o} transform={`translate(668 ${oy[i]! - 20})`}>
              <rect width="224" height="40" rx="12" className="fill-card stroke-line" />
              <text x="16" y="25" className="fill-ink text-[13px]">{o}</text>
            </g>
          ))}
        </svg>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {matches.length ? (
            matches.map(({ p, overlap }) => (
              <Link key={p.id} href={`/projects/${p.slug}`} className="group card p-4 transition hover:border-ink/30">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted">{overlap ? `Uses ${overlap} of your systems` : industries.find((i) => i.id === p.industryId)?.shortName}</span>
                  <ArrowUpRight className="h-4 w-4 text-muted group-hover:text-ink" />
                </div>
                <div className="mt-1 font-display text-lg font-semibold leading-tight">{p.title}</div>
                <p className="mt-1 line-clamp-2 text-[13px] text-muted">{p.tagline}</p>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted md:col-span-3">Pick your systems and industry to see agents we have already built for that stack.</p>
          )}
        </div>
      </div>
    </div>
  );
}
