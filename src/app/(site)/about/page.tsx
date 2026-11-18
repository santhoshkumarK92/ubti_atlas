import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { getCertifications, getCompany, getIndustries, getPlatforms, getVisibleProjects } from '@/lib/repo';
import { Markdown } from '@/components/ui/Markdown';
import { CertBadge } from '@/components/ui/CertBadge';
import { Img } from '@/components/ui/Img';
import type { Certification } from '@/lib/types';

export const metadata = { title: 'About & certifications' };

const TRACKS: Certification['track'][] = ['AI', 'Data & Fabric', 'Power Platform', 'Azure', 'Other'];

export default async function About() {
  const signedIn = !!(await getUser());
  const [company, certs, industries, platforms, projects] = await Promise.all([getCompany(), getCertifications(), getIndustries(), getPlatforms(), getVisibleProjects(signedIn)]);
  const shown = certs.filter((c) => c.show);
  const holders = shown.reduce((n, c) => n + (c.holders || 0), 0);
  const stats = [
    { value: String(projects.length), label: 'AI agents & use cases' },
    { value: String(industries.filter((i) => projects.some((p) => p.industryId === i.id || p.extraIndustryIds.includes(i.id))).length), label: 'Industries' },
    { value: String(platforms.length), label: 'Systems we connect to' },
    { value: String(holders || shown.length), label: holders ? 'Microsoft certifications held' : 'Certification tracks' },
    ...company.stats,
  ];

  return (
    <>
      <section className="frame row grid md:grid-cols-[2fr_1fr]">
        <div className="p-6 md:p-10">
          <div className="eyebrow mb-4">About {company.name}</div>
          <h1 className="h-display text-5xl md:text-7xl">The AI team<br /><span className="text-muted/60">behind the Atlas</span></h1>
        </div>
        <div className="flex flex-col justify-end gap-3 border-t border-line p-6 md:border-l md:border-t-0 md:p-10">
          <span className="chip self-start">{company.partnerLine}</span>
          <p className="text-sm text-muted">{company.tagline}</p>
          <Link href="/contact" className="btn-dark self-start">Talk to us <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <section className="frame row grid md:grid-cols-[1.2fr_1fr]">
        <div className="p-6 md:p-10"><Markdown className="text-base">{company.about}</Markdown></div>
        <Img src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=70" alt="Modern office" className="min-h-[280px] border-t border-line md:border-l md:border-t-0" />
      </section>

      <section className="frame row grid grid-cols-2 gap-px bg-line md:grid-cols-3 lg:grid-cols-6">
        {stats.slice(0, 6).map((s) => (
          <div key={s.label} className="bg-paper p-6"><div className="h-display text-4xl">{s.value}</div><div className="mt-2 text-xs text-muted">{s.label}</div></div>
        ))}
      </section>

      {company.capabilities.length > 0 && (
        <section className="frame row flex flex-wrap items-center gap-2 p-6 md:px-10">
          <span className="eyebrow mr-2">What we do</span>
          {company.capabilities.map((c) => <span key={c} className="chip">{c}</span>)}
        </section>
      )}

      <section id="certifications" className="frame row scroll-mt-4">
        <div className="grid border-b border-line md:grid-cols-[2fr_1fr]">
          <div className="p-6 md:p-10">
            <div className="eyebrow mb-3">Certified professionals</div>
            <h2 className="h-display text-4xl md:text-5xl">Microsoft certifications</h2>
          </div>
          <p className="flex items-end border-t border-line p-6 text-sm text-muted md:border-l md:border-t-0 md:p-10">
            Our engineers hold Microsoft role-based certifications across AI, Fabric, Power Platform and Azure. Badges are the official Microsoft Learn credential images.
          </p>
        </div>
        {TRACKS.filter((t) => shown.some((c) => c.track === t)).map((t) => {
          const list = shown.filter((c) => c.track === t);
          // Repeat short tracks so one half of the strip always fills a wide screen, then double it for a seamless loop.
          const half = Array.from({ length: Math.max(list.length, Math.ceil(8 / list.length) * list.length) }, (_, i) => list[i % list.length]!);
          return (
            <div key={t} className="border-b border-line last:border-0">
              <div className="px-6 pt-6 md:px-10"><span className="eyebrow">{t}</span></div>
              <div className="relative overflow-hidden py-4 motion-reduce:overflow-x-auto">
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
      </section>
    </>
  );
}
