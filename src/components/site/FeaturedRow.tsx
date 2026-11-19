import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Industry } from '@/lib/types';
import type { PublicProject } from '@/lib/repo';

const TINTS = ['#bdd5e5', '#b4d4ce', '#fae6a1', '#f4c9c4'];

/** Home-page agent row: big number, bold title, tagline, tags — fills with colour on hover. */
export function FeaturedRow({ p, industry, index }: { p: PublicProject; industry?: Industry; index: number }) {
  const tint = TINTS[index % TINTS.length]!;
  return (
    <Link
      href={`/projects/${p.slug}`}
      style={{ ['--tint' as string]: tint }}
      className="group grid items-center gap-x-8 gap-y-3 border-b border-ink px-4 py-7 transition-colors duration-300 hover:bg-[var(--tint)] hover:text-[#0c0f14] md:grid-cols-[72px_minmax(0,1.2fr)_minmax(0,1.5fr)_auto] md:px-6 md:py-8"
    >
      <span className="font-display text-3xl font-extrabold tracking-[-0.05em] text-muted transition-colors group-hover:text-[#0c0f14] md:text-4xl">{String(index + 1).padStart(2, '0')}</span>
      <div className="min-w-0">
        {industry && <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-accent transition-colors group-hover:text-[#0c0f14]/70">{industry.shortName}</div>}
        <h3 className="text-[clamp(1.4rem,2.3vw,2.2rem)] font-extrabold leading-[1.02] tracking-[-0.045em]">{p.title}</h3>
      </div>
      <div className="min-w-0">
        <p className="line-clamp-2 max-w-[56ch] text-[15px] leading-6 text-muted transition-colors group-hover:text-[#0c0f14]/80">{p.tagline}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {p.techStack.slice(0, 3).map((t) => (
            <span key={t} className="border border-line px-2 py-0.5 text-[11px] font-medium text-ink/80 transition-colors group-hover:border-[#0c0f14]/40 group-hover:text-[#0c0f14]">{t}</span>
          ))}
        </div>
      </div>
      <span className="hidden h-12 w-12 shrink-0 place-items-center border-2 border-current transition group-hover:bg-[#0c0f14] group-hover:text-[#fefffa] md:grid">
        <ArrowUpRight className="h-5 w-5 transition group-hover:rotate-45" />
      </span>
    </Link>
  );
}
