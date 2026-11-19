import Link from 'next/link';
import { ArrowRight, Bot, BrainCircuit, ChartNoAxesCombined, Database, ExternalLink, FileSearch, Mic, Sparkles, Workflow, type LucideIcon } from 'lucide-react';
import { getCertifications, getCompany } from '@/lib/repo';
import { Markdown } from '@/components/ui/Markdown';
import { CertBadge } from '@/components/ui/CertBadge';
import { Img } from '@/components/ui/Img';
import type { Certification } from '@/lib/types';

export const metadata = { title: 'About & certifications' };

const capIcon = (c: string): LucideIcon => {
  const t = c.toLowerCase();
  if (t.includes('voice')) return Mic;
  if (t.includes('rag') || t.includes('document')) return FileSearch;
  if (t.includes('fabric') || t.includes('data')) return Database;
  if (t.includes('automate') || t.includes('rpa')) return Workflow;
  if (t.includes('predict') || t.includes('analytic')) return ChartNoAxesCombined;
  if (t.includes('foundry')) return BrainCircuit;
  if (t.includes('copilot') || t.includes('agent')) return Bot;
  return Sparkles;
};

const TRACKS: Certification['track'][] = ['AI', 'Data & Fabric', 'Power Platform', 'Azure', 'Other'];

export default async function About() {
  const [company, certs] = await Promise.all([getCompany(), getCertifications()]);
  const shown = certs.filter((c) => c.show);
  const holders = shown.reduce((n, c) => n + (c.holders || 0), 0);
  const stats = [
    { value: String(holders || shown.length), label: holders ? 'Microsoft certifications held' : 'Certification tracks' },
    ...company.stats,
  ];

  return (
    <>
      <section className="mx-auto mb-6 mt-3 w-full max-w-frame px-3 md:px-6">
        <div className="relative overflow-hidden rounded-md border border-line bg-gradient-to-br from-[#f8f6f2] via-[#f3f0e8] to-[#ece5d6] dark:from-[#0c1514] dark:via-[#10201e] dark:to-[#142a27]">
          <div className="pointer-events-none absolute -right-20 top-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />

          <div className="relative grid gap-6 p-6 md:grid-cols-[2fr_1fr] md:items-end md:p-10">
            <div>
              <div className="eyebrow mb-4">About {company.name}</div>
              <h1 className="h-display text-5xl md:text-7xl">The AI team<br /><span className="text-muted/60">behind the Atlas</span></h1>
            </div>
            <Link href="/contact" className="btn-dark self-end justify-self-start md:justify-self-end">Talk to us <ArrowRight className="h-4 w-4" /></Link>
          </div>

          <div className="relative grid gap-6 px-6 pb-8 md:grid-cols-[1.2fr_1fr] md:px-10">
            <div className="rounded-md border border-line bg-card/60 p-6  md:p-8"><Markdown className="text-base">{company.about}</Markdown></div>
            <Img src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=70" alt="Modern office" className="min-h-[280px] rounded-md border border-line " />
          </div>

          <div className="relative grid grid-cols-2 gap-4 px-6 pb-8 md:px-10 md:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
            {stats.slice(0, 5).map((s) => (
              <div key={s.label} className="rounded-md border border-line bg-card/60 p-6 "><div className="h-display text-4xl">{s.value}</div><div className="mt-2 text-xs text-muted">{s.label}</div></div>
            ))}
          </div>

          {company.capabilities.length > 0 && (
            <div className="relative px-6 pb-10 md:px-10">
              <div className="eyebrow mb-3">What we do</div>
              <h2 className="h-display mb-5 text-3xl md:text-4xl">Everything it takes to put <span className="gradient-text">AI to work on your data</span></h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {company.capabilities.map((c) => {
                  const Icon = capIcon(c);
                  return (
                    <div key={c} className="group flex items-center gap-3 rounded-md border border-line bg-card p-3 transition hover:-translate-y-0.5 hover:bg-card ">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-gradient-to-br from-accent to-violet text-white shadow-sm"><Icon className="h-5 w-5" /></span>
                      <span className="text-sm font-semibold leading-tight">{c}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

      <div id="certifications" className="relative scroll-mt-4 border-t border-white/60 ">
        <div>
          <div className="p-6 md:p-10">
            <div className="eyebrow mb-3">Certified professionals</div>
            <h2 className="h-display text-4xl md:text-5xl">Microsoft certifications</h2>
          </div>
        </div>
        {TRACKS.filter((t) => shown.some((c) => c.track === t)).map((t) => {
          const list = shown.filter((c) => c.track === t);
          // Repeat short tracks so one half of the strip always fills a wide screen, then double it for a seamless loop.
          const half = Array.from({ length: Math.max(list.length, Math.ceil(8 / list.length) * list.length) }, (_, i) => list[i % list.length]!);
          return (
            <div key={t} className="last:pb-4">
              <div className="px-6 pt-6 md:px-10"><span className="eyebrow">{t}</span></div>
              <div className="relative overflow-hidden py-4 [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)] motion-reduce:overflow-x-auto">
                <div
                  className="flex w-max animate-marquee gap-4 hover:[animation-play-state:paused] motion-reduce:animate-none"
                  style={{ animationDuration: `${half.length * 6}s` }}
                >
                  {[...half, ...half].map((c, i) => {
                    const copy = i >= half.length; // the second half only exists to make the loop seamless
                    return (
                      <a
                        key={`${c.id}-${i}`}
                        href={c.learnUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-hidden={copy || undefined}
                        tabIndex={copy ? -1 : undefined}
                        className="group card flex w-[340px] shrink-0 items-center gap-4 p-4 transition hover:border-ink/30"
                      >
                        <CertBadge src={c.badgeUrl} code={c.code} level={c.level} className="h-20 w-20 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-display text-xl font-bold">{c.code}</span>
                            {c.status === 'retired' && <span className="chip px-1.5 py-0 text-[10px]">Retired</span>}
                          </div>
                          <div className="mt-0.5 line-clamp-2 text-[13px] leading-5">{c.name.replace('Microsoft Certified: ', '')}</div>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted">
                            <span>{c.level}</span>
                            {c.holders > 0 && <span>· {c.holders} certified</span>}
                            <ExternalLink className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                          </div>
                          {c.note && <div className="mt-1 line-clamp-1 text-[11px] text-muted">{c.note}</div>}
                        </div>
                      </a>
                    );
                  })}
                </div>
                <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-paper to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-paper to-transparent" />
              </div>
            </div>
          );
        })}
      </div>
        </div>
      </section>
    </>
  );
}
