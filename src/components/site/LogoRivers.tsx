import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Img } from '@/components/ui/Img';
import { Reveal } from './Reveal';
import { cn, initials } from '@/lib/utils';

export interface RiverPlatform { id: string; name: string; vendor: string; category: string; connectVia: string; logoUrl?: string; agents: number }

const TINTS = ['#a9c8f5', '#fae6a1', '#f4c9c4', '#d9d3ec'];

/** One fixed row per category on a dark stage: coloured label left, every system once on the right. */
export function LogoRivers({ platforms, categories }: { platforms: RiverPlatform[]; categories: string[] }) {
  return (
    <div className="bg-[#e6eefb] text-[#0c0f14]">
      {categories.map((c, k) => {
        const items = platforms.filter((p) => p.category === c);
        const tint = TINTS[k % TINTS.length]!;
        return (
          <section key={c} aria-label={c} className="border-b border-[#0c0f14]/30">
            <div className="mx-auto grid max-w-frame gap-6 px-4 py-8 md:px-8 md:py-10 lg:grid-cols-[260px_1fr] lg:gap-0 lg:py-0">
              <div className="border-b border-[#0c0f14] pb-6 lg:border-b-0 lg:border-r lg:py-10 lg:pr-8">
                <span className="inline-block px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#0c0f14]" style={{ background: tint }}>{String(k + 1).padStart(2, '0')}</span>
                <h2 className="mt-3 text-[clamp(1.3rem,1.8vw,1.7rem)] font-extrabold leading-tight tracking-[-0.03em]">{c}</h2>
                <p className="mt-1 text-[12px] font-semibold text-[#0c0f14]/60">{items.length} {items.length === 1 ? 'system' : 'systems'}</p>
              </div>
              <div className="flex flex-wrap gap-3 lg:py-10 lg:pl-10">
                {items.map((p, i) => (
                  <Reveal key={p.id} delay={i * 60}>
                    <Tile p={p} tint={tint} />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Tile({ p, tint }: { p: RiverPlatform; tint: string }) {
  const inner = (
    <>
      <span aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: tint }} />
      <div className="flex items-center justify-center">
        {p.logoUrl ? (
          <Img src={p.logoUrl} alt="" className="h-14 w-14 shrink-0 !bg-transparent" imgClassName="object-contain mix-blend-multiply" />
        ) : (
          <span className="grid h-12 w-12 place-items-center bg-[#0c0f14]/5 font-display text-lg font-bold">{initials(p.name)}</span>
        )}
      </div>
      <div className="mt-3 text-center">
        <div className="text-[14px] font-extrabold leading-tight tracking-[-0.02em]">{p.name}</div>
        <div className="mt-0.5 text-[11px] text-[#0c0f14]/60">{p.vendor}</div>
      </div>
      <div className="mt-3 flex min-h-[22px] items-center justify-center">
        {p.agents > 0 ? (
          <span className="inline-flex items-center gap-1 bg-[#0c0f14] px-2 py-0.5 text-[11px] font-bold text-[#fefffa]">{p.agents} {p.agents === 1 ? 'agent' : 'agents'} <ArrowUpRight className="h-3 w-3" /></span>
        ) : (
          <span className="text-[11px] font-semibold text-[#0c0f14]/50">Template-ready</span>
        )}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-[#0c0f14] px-3 py-2 text-center text-[11px] font-medium text-[#fefffa] opacity-0 transition group-hover/tile:translate-y-0 group-hover/tile:opacity-100">
        Connect via {p.connectVia}
      </div>
    </>
  );
  const cls = cn('group/tile relative flex h-[176px] w-[160px] shrink-0 flex-col justify-center overflow-hidden border border-[#0c0f14]/30 bg-[#ffffff] px-3 text-[#0c0f14] transition hover:border-[#0c0f14] hover:bg-[#fbf8f1] hover:shadow-[3px_3px_0_0_rgba(12,15,20,.85)] duration-300 hover:-translate-y-1.5 md:w-[172px]');
  return p.agents > 0 ? (
    <Link href={`/projects?platform=${p.id}`} className={cls} style={{ ['--t' as string]: tint }}>{inner}</Link>
  ) : (
    <div className={cls} style={{ ['--t' as string]: tint }}>{inner}</div>
  );
}
