import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { Industry, Platform } from '@/lib/types';
import { MATURITY } from '@/lib/types';
import type { PublicProject } from '@/lib/repo';
import { Markdown } from '../ui/Markdown';
import { ArchitectureFlow } from './ArchitectureFlow';
import { DemoBadge } from './DemoBadge';
import { Gallery, ZoomImage } from './Gallery';
import { VideoBlock } from './VideoBlock';

/** The body of a project page — shared by /projects/[slug] and client microsites. */
export function ProjectDetail({ p, platforms, linkPlatforms = true, trackId }: { p: PublicProject; industry?: Industry; platforms: Platform[]; linkPlatforms?: boolean; trackId?: string }) {
  const systems = platforms.filter((x) => p.platformIds.includes(x.id));
  const hasVideo = !!(p.media.video || p.media.videoEmbedUrl);
  return (
    <>
      {(hasVideo || p.demoUrl) && (
        <section className="row grid md:grid-cols-[2fr_1fr]">
          <div className="p-4 md:p-6">
            {hasVideo ? (
              <VideoBlock video={p.media.video} embedUrl={p.media.videoEmbedUrl} poster={p.media.thumbnail} title={p.title} />
            ) : (
              <a href={p.demoUrl} target="_blank" rel="noreferrer" data-track={trackId ? 'demo_click' : undefined} data-pid={trackId} className="group relative grid aspect-video place-items-center overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-accent/15 via-violet/10 to-soft">
                <span className="btn-dark">Open the live demo <ExternalLink className="h-4 w-4" /></span>
              </a>
            )}
          </div>
          <div className="flex flex-col justify-between gap-6 border-t border-line p-6 md:border-l md:border-t-0 md:p-8">
            <div className="space-y-3">
              <div className="eyebrow">See it working</div>
              <DemoBadge url={p.demoUrl} status={p.demoStatus} hasVideo={hasVideo} />
              <p className="text-sm text-muted">{hasVideo ? 'Recorded walkthrough of the working solution.' : 'Hosted demo environment with sample data.'}</p>
            </div>
            {p.demoUrl && (
              <a href={p.demoUrl} target="_blank" rel="noreferrer" data-track={trackId ? 'demo_click' : undefined} data-pid={trackId} className="btn-dark self-start">
                Open live demo <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </section>
      )}

      <section className="row grid gap-px bg-line md:grid-cols-3">
        {[
          ['The problem', p.problem],
          ['What we built', p.solution],
          ['The impact', p.impact],
        ].map(([h, body]) => (
          <div key={h} className="bg-paper p-6 md:p-8">
            <div className="eyebrow mb-3">{h}</div>
            <Markdown className="text-[15px]">{body || '—'}</Markdown>
          </div>
        ))}
      </section>

      {p.metrics.length > 0 && (
        <section className="row grid grid-cols-2 gap-px bg-line md:[grid-template-columns:var(--cols)]" style={{ '--cols': `repeat(${Math.min(p.metrics.length, 4)}, minmax(0, 1fr))` } as React.CSSProperties}>
          {p.metrics.slice(0, 4).map((m, i) => (
            <div key={i} className="bg-paper p-6 md:p-8">
              <div className="h-display text-4xl md:text-5xl">{m.value}</div>
              <div className="mt-2 text-sm text-muted">{m.label}</div>
            </div>
          ))}
        </section>
      )}

      {(p.architecture.image || p.architecture.flow.length > 0) && (
        <section className={`row grid ${p.architecture.flow.length || p.architecture.description ? 'md:grid-cols-[2fr_1fr]' : ''}`}>
          <div className="p-4 md:p-6">
            <div className="eyebrow mb-3 px-2 pt-2">Architecture</div>
            {p.architecture.image ? (
              <ZoomImage file={p.architecture.image} alt={`${p.title} architecture diagram`} />
            ) : (
              <div className="rounded-2xl border border-line bg-card p-6"><ArchitectureFlow steps={p.architecture.flow} /></div>
            )}
          </div>
          {(p.architecture.flow.length > 0 || !!p.architecture.description) && <div className="border-t border-line p-6 md:border-l md:border-t-0 md:p-8">
            <div className="eyebrow mb-3">How it works</div>
            {p.architecture.description && <p className="mb-5 text-sm leading-6 text-muted">{p.architecture.description}</p>}
            {p.architecture.image && <ArchitectureFlow steps={p.architecture.flow} compact />}
          </div>}
        </section>
      )}

      <section className="row grid gap-px bg-line md:grid-cols-3">
        <div className="bg-paper p-6 md:p-8">
          <div className="eyebrow mb-3">Key capabilities</div>
          <ul className="space-y-2 text-sm">
            {p.features.map((f) => <li key={f} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{f}</li>)}
            {!p.features.length && <li className="text-muted">—</li>}
          </ul>
        </div>
        <div className="bg-paper p-6 md:p-8">
          <div className="eyebrow mb-3">Tech stack</div>
          <div className="flex flex-wrap gap-1.5">{p.techStack.map((t) => <span key={t} className="chip">{t}</span>)}</div>
        </div>
        <div className="bg-paper p-6 md:p-8">
          <div className="eyebrow mb-3">Connects to your</div>
          <div className="flex flex-wrap gap-1.5">
            {systems.map((s) =>
              linkPlatforms ? <Link key={s.id} href={`/projects?platform=${s.id}`} className="chip hover:border-ink/40">{s.name}</Link> : <span key={s.id} className="chip">{s.name}</span>,
            )}
            {!systems.length && <span className="text-sm text-muted">Any data source</span>}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div><div className="text-xs text-muted">Maturity</div><div className="font-medium">{MATURITY[p.maturity]}</div></div>
            {p.weeksToDeploy ? <div><div className="text-xs text-muted">Typical deployment</div><div className="font-medium">{p.weeksToDeploy} weeks</div></div> : null}
            {typeof p.reuseScore === 'number' ? <div><div className="text-xs text-muted">Reuse for a new client</div><div className="font-medium">{p.reuseScore}%</div></div> : null}
            {p.region ? <div><div className="text-xs text-muted">Region</div><div className="font-medium">{p.region}</div></div> : null}
          </div>
        </div>
      </section>

      {p.media.screenshots.length > 0 && (
        <section className="row p-4 md:p-6">
          <div className="eyebrow mb-3 px-2">Screenshots</div>
          <Gallery files={p.media.screenshots} />
        </section>
      )}
    </>
  );
}
