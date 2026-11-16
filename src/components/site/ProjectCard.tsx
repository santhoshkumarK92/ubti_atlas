import Link from 'next/link';
import { ArrowUpRight, PlayCircle, Radio } from 'lucide-react';
import type { Industry } from '@/lib/types';
import { MATURITY } from '@/lib/types';
import type { PublicProject } from '@/lib/repo';
import { Img } from '../ui/Img';
import { cn } from '@/lib/utils';

export function ProjectCard({ p, industry, href, reframe, className }: { p: PublicProject; industry?: Industry; href?: string; reframe?: string; className?: string }) {
  const cover = p.media.thumbnail?.url ?? p.architecture.image?.url ?? p.media.screenshots[0]?.url;
  const hasVideo = !!(p.media.video || p.media.videoEmbedUrl);
  return (
    <Link href={href ?? `/projects/${p.slug}`} className={cn('group card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgb(var(--ink)/.35)]', className)}>
      <div className="relative">
        {cover ? (
          <Img src={cover} alt={p.title} className="aspect-[16/9] border-b border-line" imgClassName="object-cover" />
        ) : (
          <MiniFlow steps={p.architecture.flow.map((f) => f.title)} label={p.title} />
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {p.isSample && <span className="chip bg-card/90 text-[10px] backdrop-blur">Sample</span>}
          {p.demoUrl && p.demoStatus?.ok !== false && <span className="chip bg-card/90 text-[10px] backdrop-blur"><Radio className="h-3 w-3 text-good" /> Live demo</span>}
          {!p.demoUrl && hasVideo && <span className="chip bg-card/90 text-[10px] backdrop-blur"><PlayCircle className="h-3 w-3" /> Video</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="eyebrow">{industry?.shortName}</span>
          <span className="text-[11px] text-muted">{MATURITY[p.maturity]}</span>
        </div>
        <h3 className="mt-2 font-display text-[22px] font-semibold leading-tight">{p.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm text-muted">{reframe || p.tagline}</p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
          {p.techStack.slice(0, 3).map((t) => (
            <span key={t} className="chip text-[11px]">{t}</span>
          ))}
          <ArrowUpRight className="ml-auto h-4 w-4 text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
        </div>
      </div>
    </Link>
  );
}

/** Generated cover when a project has no image yet: its flow as a tiny diagram. */
export function MiniFlow({ steps, label }: { steps: string[]; label: string }) {
  const s = steps.slice(0, 4);
  return (
    <div className="relative aspect-[16/9] overflow-hidden border-b border-line bg-gradient-to-br from-accent/10 via-violet/10 to-soft">
      <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgb(var(--line))_1px,transparent_1px),linear-gradient(90deg,rgb(var(--line))_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="relative flex h-full items-center gap-2 px-5">
        {s.length ? (
          s.map((t, i) => (
            <div key={i} className="flex min-w-0 flex-1 items-center gap-2">
              <div className={cn('min-w-0 flex-1 rounded-lg border bg-card px-2 py-2 text-center text-[10px] font-medium leading-tight shadow-sm', i === s.length - 1 ? 'border-accent/60' : 'border-line')}>
                <span className="line-clamp-2">{t}</span>
              </div>
              {i < s.length - 1 && <span className="h-px w-3 shrink-0 bg-ink/30" />}
            </div>
          ))
        ) : (
          <span className="mx-auto font-display text-2xl font-semibold text-ink/40">{label}</span>
        )}
      </div>
    </div>
  );
}
