'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, MousePointerClick } from 'lucide-react';
import type { Industry } from '@/lib/types';
import { Icon } from '../ui/Icon';
import { Img } from '../ui/Img';
import { IndustryCover } from './IndustryCover';
import { MapStage, Reveal } from './Reveal';
import { cn } from '@/lib/utils';

export interface ExplorerProject {
  slug: string; title: string; tagline: string; about: string; thumb?: string; tech: string[]; maturity: string;
}

const PER_ROW = 3;
const ACCENTS = ['#337cb7', '#f6c835', '#22479b', '#dc3f4a'];

/** "Built for every industry": a honeycomb of all industries; pick one and three of its agents appear on the right, flipping on hover. */
export function IndustryExplorer({ industries, projects }: { industries: Industry[]; projects: Record<string, ExplorerProject[]> }) {
  const first = industries.find((i) => (projects[i.id]?.length ?? 0) > 0) ?? industries[0];
  const [selId, setSelId] = useState(first?.id ?? '');
  const sel = industries.find((i) => i.id === selId) ?? first;
  const list = sel ? projects[sel.id] ?? [] : [];

  const rows: Industry[][] = [];
  for (let i = 0; i < industries.length; i += PER_ROW) rows.push(industries.slice(i, i + PER_ROW));

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-12">
      {/* HONEYCOMB */}
      <MapStage className="mx-auto">
        <div className="hexgrid" style={{ ['--hw' as string]: 'clamp(106px, 10.5vw, 160px)' }}>
          {rows.map((row, r) => (
            <div key={r} className={cn('hexrow', r % 2 === 1 && 'hexrow-odd')}>
              {row.map((ind, c) => {
                const idx = r * PER_ROW + c;
                const on = ind.id === sel?.id;
                const n = projects[ind.id]?.length ?? 0;
                return (
                  <button
                    key={ind.id}
                    type="button"
                    onClick={() => setSelId(ind.id)}
                    aria-pressed={on}
                    aria-label={`${ind.name}, ${n} ${n === 1 ? 'agent' : 'agents'}`}
                    style={{ ['--i' as string]: idx }}
                    className={cn('hex group', on && 'hex-on')}
                  >
                    <span className="hex-ring" />
                    <span className="hex-body">
                      <span className="absolute inset-0 block"><Img src={ind.imageUrl} alt="" className="h-full w-full !bg-[#0a1b45]" imgClassName="object-cover transition duration-700 group-hover:scale-110" /></span>
                      <span className="absolute inset-0 bg-gradient-to-t from-[#081a45]/85 via-[#081a45]/10 to-transparent transition group-hover:from-[#081a45]/60" />
                      <span className="relative flex h-full flex-col items-center justify-end gap-0.5 px-2 pb-[17%] text-center text-white [text-shadow:0_1px_6px_rgba(0,0,0,.6)]">
                        <Icon name={ind.icon} className="h-5 w-5 md:h-6 md:w-6" />
                        <span className="text-[11px] font-extrabold leading-[1.1] tracking-[-0.01em] md:text-[13px]">{ind.shortName}</span>
                        <span className="rounded-full bg-black/35 px-1.5 text-[9.5px] font-bold">{n}</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <p className="mt-6 flex items-center justify-center gap-2 text-[12px] font-semibold text-muted lg:justify-start">
          <MousePointerClick className="h-4 w-4 text-accent" /> Pick an industry to see its agents
        </p>
      </MapStage>

      {/* THREE AGENTS, FLIP ON HOVER */}
      <div className="min-w-0">
        {sel && (
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">Selected industry</div>
              <h3 key={sel.id} className="animate-fade-up mt-1 text-[clamp(1.4rem,2.2vw,2rem)] font-extrabold leading-tight tracking-[-0.04em]">{sel.name}</h3>
            </div>
            <Link href={`/industries/${sel.slug}`} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#22479b] underline-offset-4 hover:underline">
              All {sel.shortName} agents <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        )}
        {list.length > 0 ? (
          <div key={sel?.id} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((p, k) => <FlipCard key={p.slug} p={p} industry={sel!} k={k} />)}
          </div>
        ) : (
          <Reveal>
            <div className="grid min-h-[300px] place-items-center rounded-3xl border border-dashed border-[#22479b]/35 bg-white/70 p-8 text-center">
              <div>
                <p className="text-lg font-extrabold tracking-[-0.02em]">New {sel?.shortName} agents are on the way.</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted">Tell us the problem and we&apos;ll show you how an agent could be built for it.</p>
                <Link href="/contact" className="mt-5 inline-flex min-h-[44px] items-center rounded-full bg-[#0a1b45] px-6 text-[14px] font-bold text-white transition hover:bg-[#22479b]">Talk to us →</Link>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}

function FlipCard({ p, industry, k }: { p: ExplorerProject; industry: Industry; k: number }) {
  const accent = ACCENTS[k % ACCENTS.length]!;
  return (
    <Link
      href={`/projects/${p.slug}`}
      style={{ animationDelay: `${k * 110}ms` }}
      className="flip-card animate-fade-up block h-[360px] outline-none [perspective:1100px] focus-visible:ring-2 focus-visible:ring-[#22479b]"
    >
      <div className="flip-inner relative h-full w-full transition-transform duration-700 ease-[cubic-bezier(.4,.2,.2,1)] [transform-style:preserve-3d]">
        {/* front */}
        <div className="absolute inset-0 flex flex-col overflow-hidden rounded-3xl border border-[#d0dcf0] bg-white shadow-[0_12px_36px_rgba(19,47,110,.1)] [backface-visibility:hidden]">
          <span aria-hidden className="absolute inset-x-0 top-0 z-10 h-1.5" style={{ background: accent }} />
          {p.thumb ? (
            <Img src={p.thumb} alt={p.title} fallbackLabel={p.title} className="h-[52%] shrink-0" imgClassName="object-cover" />
          ) : (
            <IndustryCover industry={industry} className="h-[52%] shrink-0" />
          )}
          <div className="flex flex-1 flex-col p-5">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-accent">{industry.shortName}</div>
            <h4 className="mt-1.5 line-clamp-3 text-[1.1rem] font-extrabold leading-[1.1] tracking-[-0.03em] text-[#0a1b45]">{p.title}</h4>
            <div className="mt-auto flex items-center gap-1.5 text-[11.5px] font-semibold text-[#0a1b45]/55">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: accent }} /> Hover to flip
            </div>
          </div>
        </div>
        {/* back */}
        <div className="navy-zone absolute inset-0 flex flex-col overflow-hidden rounded-3xl border border-white/20 p-5 shadow-[0_18px_46px_rgba(10,27,69,.35)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <span aria-hidden className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-50 blur-2xl" style={{ background: accent }} />
          <div className="relative text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#a9c8f5]">About this agent</div>
          <h4 className="relative mt-1.5 line-clamp-2 text-[1.05rem] font-extrabold leading-[1.1] tracking-[-0.03em] text-white">{p.title}</h4>
          <p className="relative mt-3 line-clamp-4 text-[13px] leading-5 text-white/85">{p.about}</p>
          <div className="relative mt-3 flex flex-wrap gap-1.5">
            {p.tech.slice(0, 3).map((t) => <span key={t} className="rounded-full border border-white/30 bg-white/10 px-2 py-0.5 text-[10.5px] font-semibold text-white/90">{t}</span>)}
          </div>
          <div className="relative mt-auto flex items-center justify-between gap-2 pt-3">
            <span className="text-[11px] font-semibold text-white/60">{p.maturity}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-2 text-[12.5px] font-bold text-[#0a1b45]">View project <ArrowUpRight className="h-3.5 w-3.5" /></span>
          </div>
        </div>
      </div>
    </Link>
  );
}
