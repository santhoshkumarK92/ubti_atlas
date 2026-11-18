import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { getCertifications, getCompany, getIndustries, getPlatforms, getPosts, getVisibleProjects } from '@/lib/repo';
import { PipelineRotator } from '@/components/site/PipelineRotator';
import { IndustryCard } from '@/components/site/IndustryCard';
import { ProjectCard } from '@/components/site/ProjectCard';
import { SourceSystems } from '@/components/site/SourceSystems';
import { Agent3D } from '@/components/site/Agent3D';
import { CertBadge } from '@/components/ui/CertBadge';
import { Img } from '@/components/ui/Img';
import { formatDate } from '@/lib/utils';

export default async function Home() {
  const signedIn = !!(await getUser());
  const [company, industries, platforms, projects, certs, posts] = await Promise.all([
    getCompany(), getIndustries(), getPlatforms(), getVisibleProjects(signedIn), getCertifications(), getPosts(),
  ]);
  const countFor = (id: string) => projects.filter((p) => p.industryId === id || p.extraIndustryIds.includes(id)).length;
  const featured = (projects.filter((p) => p.featured).length ? projects.filter((p) => p.featured) : projects).slice(0, 6);
  const shownCerts = certs.filter((c) => c.show);
  const [headA, headB] = splitTagline(company.tagline);

  return (
    <>
      {/* HERO */}
      <section className="relative mx-auto mb-6 mt-3 w-full max-w-frame px-3 md:px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-line bg-gradient-to-br from-[#e6f4ff] via-[#eef0ff] to-[#f3ecff] dark:from-[#0d1a33] dark:via-[#12163a] dark:to-[#1a1240]">
          <div className="pointer-events-none absolute -right-20 top-0 h-[28rem] w-[28rem] rounded-full bg-accent/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 bottom-10 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl dark:bg-cyan-500/15" />

          <div className="relative grid items-center gap-6 p-6 md:p-10 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
            <div className="flex flex-col gap-7">
              <div>
                <div className="eyebrow mb-5 flex items-center gap-2"><MsLogo /> {company.partnerLine}</div>
                <h1 className="h-display text-[44px] sm:text-6xl lg:text-[68px]">
                  <span className="text-accent">{headA}</span>
                  {headB && <><br />{headB}</>}
                </h1>
                <p className="mt-5 max-w-md text-sm leading-6 text-muted">{company.subTagline}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/contact" className="btn-dark">Request a demo <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/industries" className="btn-ghost">Explore Atlas</Link>
              </div>
              <div className="max-w-lg overflow-hidden rounded-2xl border border-white/60 bg-card/60 backdrop-blur dark:border-line">
                <PipelineRotator />
              </div>
            </div>

            <div className="relative mx-auto aspect-[4/5] w-full max-w-md lg:max-w-none">
              <Agent3D className="absolute inset-0" />
            </div>
          </div>

          {/* CERTIFICATIONS */}
          {shownCerts.length > 0 && (
            <div className="relative border-t border-white/60 bg-card/40 py-5 backdrop-blur dark:border-line">
              <div className="eyebrow mb-3 px-6 md:px-10">Microsoft-certified across AI, Data &amp; Power Platform · <Link href="/about#certifications" className="link">see all</Link></div>
              <div className="relative overflow-hidden">
                <div className="flex w-max animate-marquee gap-4 hover:[animation-play-state:paused]">
                  {[...shownCerts, ...shownCerts].map((c, i) => (
                    <div key={i} className="flex w-56 shrink-0 items-center gap-3 rounded-2xl border border-line bg-card p-3">
                      <CertBadge src={c.badgeUrl} code={c.code} level={c.level} className="h-12 w-12 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-display text-lg font-bold leading-none">{c.code}</div>
                        <div className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted">{c.name.replace('Microsoft Certified: ', '')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="mx-auto mb-6 w-full max-w-frame px-3 md:px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-line bg-gradient-to-br from-[#e6f4ff] via-[#eef0ff] to-[#f3ecff] dark:from-[#0d1a33] dark:via-[#12163a] dark:to-[#1a1240]">
          <div className="pointer-events-none absolute -right-20 top-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative grid md:grid-cols-[1fr_2fr]">
            <div className="p-6 md:p-10">
              <h2 className="h-display text-4xl md:text-5xl">
                <span className="text-muted/60">Built for</span><br />every industry
              </h2>
              <p className="mt-4 max-w-sm text-sm text-muted">Pre-built, industry-specific AI agents designed around real business needs. Pick a domain to see what we have already delivered.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 md:p-6 lg:grid-cols-3">
              {industries.slice(0, 9).map((i) => <IndustryCard key={i.id} i={i} count={countFor(i.id)} />)}
            </div>
          </div>
        </div>
      </section>

      {/* SOURCE SYSTEMS */}
      <section className="mx-auto mb-6 w-full max-w-frame px-3 md:px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-line bg-gradient-to-br from-[#e6f4ff] via-[#eef0ff] to-[#f3ecff] dark:from-[#0d1a33] dark:via-[#12163a] dark:to-[#1a1240]">
          <div className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-violet/20 blur-3xl" />
          <div className="relative px-6 pt-8 md:px-10 md:pt-10">
            <div className="eyebrow mb-3">Source systems</div>
            <h2 className="h-display text-4xl md:text-5xl">Your data could be anywhere.<br /><span className="gradient-text">We bring the AI to it.</span></h2>
          </div>
          <SourceSystems platforms={platforms.map(({ id, name, logoUrl }) => ({ id, name, logoUrl }))} />
        </div>
      </section>

      <section className="mx-auto mb-6 w-full max-w-frame px-3 md:px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-line bg-gradient-to-br from-[#e6f4ff] via-[#eef0ff] to-[#f3ecff] dark:from-[#0d1a33] dark:via-[#12163a] dark:to-[#1a1240]">
          <div className="pointer-events-none absolute -right-20 top-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative">
      {/* FEATURED */}
      <div>
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink/10 p-6 md:p-10">
          <h2 className="h-display text-4xl md:text-5xl">Featured agents</h2>
          <Link href="/projects" className="btn-ghost">Browse all {projects.length} <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 md:p-6 lg:grid-cols-4">
          {featured.map((p) => <ProjectCard compact key={p.id} p={p} industry={industries.find((i) => i.id === p.industryId)} />)}
        </div>
      </div>

      {/* LATEST */}
      {posts.length > 0 && (
        <div>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink/10 p-6 md:p-10">
            <h2 className="h-display text-4xl md:text-5xl">From the AI team</h2>
            <div className="flex gap-2"><Link href="/case-studies" className="btn-ghost">Case studies</Link><Link href="/blog" className="btn-ghost">Blog</Link></div>
          </div>
          <div className="grid md:grid-cols-3">
            {posts.slice(0, 3).map((p, i) => (
              <Link key={p.id} href={`/${p.type === 'blog' ? 'blog' : 'case-studies'}/${p.slug}`} className={`group p-6 md:p-8 ${i ? 'border-t border-line md:border-l md:border-t-0' : ''}`}>
                {(p.cover?.url || p.coverUrl) && <Img src={p.cover?.url || p.coverUrl} alt={p.title} className="mb-5 aspect-[16/9] rounded-xl" />}
                <div className="eyebrow">{p.type === 'blog' ? 'Blog' : 'Case study'} · {formatDate(p.publishedAt)}</div>
                <h3 className="mt-3 font-display text-2xl font-semibold leading-tight group-hover:underline">{p.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted">{p.excerpt}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm">Read <ArrowUpRight className="h-4 w-4" /></span>
              </Link>
            ))}
          </div>
        </div>
      )}
          </div>
        </div>
      </section>
    </>
  );
}

function MsLogo() {
  return (
    <svg viewBox="0 0 23 23" className="h-4 w-4 shrink-0" aria-hidden>
      <path fill="#f25022" d="M1 1h10v10H1z" /><path fill="#7fba00" d="M12 1h10v10H12z" />
      <path fill="#00a4ef" d="M1 12h10v10H1z" /><path fill="#ffb900" d="M12 12h10v10H12z" />
    </svg>
  );
}

function splitTagline(t: string): [string, string] {
  const i = t.indexOf('. ');
  return i > 0 ? [t.slice(0, i + 1), t.slice(i + 2)] : [t, ''];
}
