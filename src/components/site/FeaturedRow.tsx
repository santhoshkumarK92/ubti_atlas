import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Industry } from '@/lib/types';
import type { PublicProject } from '@/lib/repo';

const GLOWS = ['#3f7fe0', '#337cb7', '#22479b', '#132f6e']; // dark blue shades (lighter set: '#bcd6f8', '#a3c4f2', '#c9defa', '#8fb6ee')

/** Home-page featured agent: a clean white card on the pale-blue stage, with a coloured glow that wakes on hover. */
export function FeaturedRow({ p, industry, index }: { p: PublicProject; industry?: Industry; index: number }) {
  const glow = GLOWS[index % GLOWS.length]!;
  return (
    <Link
      href={`/projects/${p.slug}`}
      style={{ ['--glow' as string]: glow }}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#d0dcf0] bg-white p-6 text-[#0a1b45] shadow-[0_10px_34px_rgba(19,47,110,.07)] transition duration-300 hover:-translate-y-1.5 hover:border-[#22479b]/50 hover:shadow-[0_24px_54px_rgba(19,47,110,.18)] md:p-7"
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-[var(--glow)]" />
      <span aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[var(--glow)] opacity-25 blur-2xl transition-opacity duration-500 group-hover:opacity-70" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-display text-4xl font-extrabold leading-none tracking-[-0.05em] text-[#22479b]/25 transition-colors group-hover:text-[#22479b]">{String(index + 1).padStart(2, '0')}</span>
          {industry && (
            <span className="rounded-full border border-[#22479b]/25 bg-[#e6eefb] px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#132f6e]">{industry.shortName}</span>
          )}
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#0a1b45]/30 transition duration-300 group-hover:border-[#f6c835] group-hover:bg-[#f6c835] group-hover:text-[#0a1b45]">
          <ArrowUpRight className="h-5 w-5 transition group-hover:rotate-12" />
        </span>
      </div>
      <h3 className="relative mt-6 text-[clamp(1.35rem,2vw,1.9rem)] font-extrabold leading-[1.05] tracking-[-0.04em]">{p.title}</h3>
      <p className="relative mt-3 line-clamp-2 max-w-[56ch] text-[14.5px] leading-6 text-[#0a1b45]/70">{p.tagline}</p>
      <div className="relative mt-auto flex flex-wrap gap-1.5 pt-5">
        {p.techStack.slice(0, 3).map((t) => (
          <span key={t} className="rounded-full border border-[#d0dcf0] bg-[#f4f7fc] px-2.5 py-0.5 text-[11px] font-semibold text-[#132f6e]">{t}</span>
        ))}
      </div>
    </Link>
  );
}
