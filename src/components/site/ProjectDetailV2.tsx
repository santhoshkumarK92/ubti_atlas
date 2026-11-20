import Link from 'next/link';
import { Check } from 'lucide-react';
import type { Platform } from '@/lib/types';
import type { PublicProject } from '@/lib/repo';
import { Markdown } from '../ui/Markdown';
import { ArchitectureFlow } from './ArchitectureFlow';
import { Gallery, ZoomImage } from './Gallery';

const BARS = ['#337cb7', '#22479b', '#f6c835'];

function Card({ children, className = '', bar }: { children: React.ReactNode; className?: string; bar?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-[#d0dcf0] bg-white p-6 shadow-[0_10px_34px_rgba(19,47,110,.07)] md:p-8 ${className}`}>
      {bar && <span aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: bar }} />}
      {children}
    </div>
  );
}

function Title({ n, children }: { n?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      {n && <span className="font-display text-sm font-extrabold tracking-[-0.02em] text-[#22479b]">{n}</span>}
      <h2 className="text-[1.35rem] font-extrabold leading-tight tracking-[-0.035em] text-[#0a1b45] md:text-[1.6rem]">{children}</h2>
    </div>
  );
}

/** Body of the project page, restyled for the blue-white theme: story cards, architecture, capabilities, gallery. */
export function ProjectDetailV2({ p, platforms }: { p: PublicProject; platforms: Platform[] }) {
  const systems = platforms.filter((x) => p.platformIds.includes(x.id));
  const story: [string, string, string][] = [
    ['01', 'The problem', p.problem],
    ['02', 'What we built', p.solution],
    ['03', 'The impact', p.impact],
  ];
  return (
    <div className="mx-auto max-w-frame space-y-5 px-4 py-12 md:px-8 md:py-16">
      <div className="grid gap-5 md:grid-cols-3">
        {story.map(([n, h, body], i) => (
          <Card key={h} bar={BARS[i]}>
            <Title n={n}>{h}</Title>
            <Markdown className="text-[15px] leading-7 text-[#0a1b45]/85">{body || '—'}</Markdown>
          </Card>
        ))}
      </div>

      {(p.architecture.image || p.architecture.flow.length > 0) && (
        <Card className={p.architecture.flow.length || p.architecture.description ? 'grid gap-8 md:grid-cols-[2fr_1fr]' : ''}>
          <div>
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#22479b]">Architecture</div>
            {p.architecture.image ? (
              <ZoomImage file={p.architecture.image} alt={`${p.title} architecture diagram`} />
            ) : (
              <div className="rounded-xl border border-[#d0dcf0] bg-[#f4f7fc] p-6"><ArchitectureFlow steps={p.architecture.flow} /></div>
            )}
          </div>
          {(p.architecture.flow.length > 0 || !!p.architecture.description) && (
            <div className="md:border-l md:border-[#d0dcf0] md:pl-8">
              <Title>How it works</Title>
              {p.architecture.description && <p className="mb-5 text-sm leading-6 text-[#0a1b45]/70">{p.architecture.description}</p>}
              {p.architecture.image && <ArchitectureFlow steps={p.architecture.flow} compact />}
            </div>
          )}
        </Card>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        <Card bar={BARS[0]}>
          <Title>Key capabilities</Title>
          <ul className="space-y-3 text-[15px] leading-6 text-[#0a1b45]/90">
            {p.features.map((f) => (
              <li key={f} className="flex gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#22479b] text-white"><Check className="h-3 w-3" strokeWidth={3} /></span>
                {f}
              </li>
            ))}
            {!p.features.length && <li className="text-[#0a1b45]/50">—</li>}
          </ul>
        </Card>
        <Card bar={BARS[1]}>
          <Title>Tech stack</Title>
          <div className="flex flex-wrap gap-2">
            {p.techStack.map((t) => <span key={t} className="rounded-full border border-[#22479b]/25 bg-[#e6eefb] px-3 py-1.5 text-[13px] font-semibold text-[#132f6e]">{t}</span>)}
            {!p.techStack.length && <span className="text-[#0a1b45]/50">—</span>}
          </div>
        </Card>
        <Card bar={BARS[2]}>
          <Title>Connects to your</Title>
          <div className="flex flex-wrap gap-2">
            {systems.map((s) => (
              <Link key={s.id} href={`/projects?platform=${s.id}`} className="rounded-full border border-[#d0dcf0] bg-[#f4f7fc] px-3 py-1.5 text-[13px] font-semibold text-[#0a1b45] transition hover:border-[#22479b] hover:bg-[#e6eefb]">{s.name}</Link>
            ))}
            {!systems.length && <span className="text-sm text-[#0a1b45]/60">Any data source</span>}
          </div>
        </Card>
      </div>

      {p.media.screenshots.length > 0 && (
        <Card>
          <Title>Screenshots</Title>
          <Gallery files={p.media.screenshots} />
        </Card>
      )}
    </div>
  );
}
