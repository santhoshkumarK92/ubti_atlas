import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Blocks, PlugZap, Rocket } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { getCertifications, getCompany, getIndustries, getPlatforms, getPosts, getVisibleProjects } from '@/lib/repo';
import { Silk } from '@/components/site/Silk';
import { PipelineRotator } from '@/components/site/PipelineRotator';
import { IndustryCard } from '@/components/site/IndustryCard';
import { ProjectCard } from '@/components/site/ProjectCard';
import { StackPlugger } from '@/components/site/StackPlugger';
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
  const certHolders = certs.filter((c) => c.show).reduce((n, c) => n + (c.holders || 0), 0);
  const shownCerts = certs.filter((c) => c.show);
  const usedPlatforms = platforms.filter((p) => projects.some((x) => x.platformIds.includes(p.id)));
  const [headA, headB] = splitTagline(company.tagline);

  return (
    <>
      {/* HERO */}
      <section className="frame row grid md:grid-cols-[1.75fr_1fr_1fr]">
        <span className="plus left-0 top-full hidden md:block" />
        <div className="p-6 md:p-10 md:pr-6">
          <div className="eyebrow mb-5 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> {company.partnerLine}</div>
          <h1 className="h-display text-[44px] sm:text-6xl lg:text-[76px]">
            {headA}
            {headB && <><br /><span className="text-muted/60">{headB}</span></>}
          </h1>
        </div>
        <div className="flex items-end border-line p-6 md:border-l md:p-8">
          <p className="text-sm leading-6 text-muted">{company.subTagline}</p>
        </div>
        <div className="flex flex-col items-start justify-end gap-3 border-line p-6 md:border-l md:p-8">
          <Link href="/industries" className="btn-dark">Explore the Atlas <ArrowRight className="h-4 w-4" /></Link>
          <a href="#stack" className="btn-ghost">Plug in your stack</a>
        </div>
      </section>

      <section className="frame row grid md:grid-cols-[2.75fr_1fr]">
        <div className="relative min-h-[340px] overflow-hidden md:min-h-[460px]">
          <Silk labels={(usedPlatforms.length ? usedPlatforms : platforms).slice(0, 8).map((p) => p.name)} />
          <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-4">
            <div className="rounded-2xl border border-white/60 bg-white/70 px-5 py-4 backdrop-blur-md dark:border-white/10 dark:bg-black/30">
              <div className="font-display text-sm font-semibold text-[#1d2340] dark:text-white">Any data source + AI Foundry agents</div>
              <div className="text-xs text-[#4a5170] dark:text-white/70">Ingest · Unify · Analyze · Act</div>
            </div>
          </div>
        </div>
        <div className="border-t border-line md:border-l md:border-t-0">
          <PipelineRotator />
        </div>
      </section>

      {/* STATS */}
      <section className="frame row grid grid-cols-2 gap-px bg-line md:grid-cols-4">
        {[
          [projects.length, 'AI agents & use cases'],
          [industries.filter((i) => countFor(i.id) > 0).length, 'Industries served'],
          [usedPlatforms.length || platforms.length, usedPlatforms.length ? 'Enterprise systems connected' : 'Systems we connect to'],
          [certHolders || shownCerts.length, certHolders ? 'Microsoft certifications held' : 'Microsoft certification tracks'],
        ].map(([n, l], i) => (
          <div key={i} className="bg-paper p-6 md:p-8">
            <div className="h-display text-5xl md:text-6xl">{n}</div>
            <div className="mt-2 text-sm text-muted">{l}</div>
          </div>
        ))}
      </section>

      {/* INDUSTRIES */}
      <section className="frame row grid md:grid-cols-[1fr_2fr]">
        <div className="p-6 md:p-10">
          <h2 className="h-display text-4xl md:text-5xl">
            <span className="text-muted/60">Built for</span><br />every industry
          </h2>
          <p className="mt-4 max-w-sm text-sm text-muted">Pre-built, industry-specific AI agents designed around real business needs. Pick a domain to see what we have already delivered.</p>
          <div className="mt-8 flex gap-2">
            <Link href="/industries" className="btn-dark">All industries</Link>
            <Link href="/projects" className="btn-ghost">All agents</Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-line p-4 md:border-l md:border-t-0 md:p-6 lg:grid-cols-3">
          {industries.slice(0, 9).map((i) => <IndustryCard key={i.id} i={i} count={countFor(i.id)} />)}
        </div>
      </section>

      {/* PLUG IN YOUR STACK */}
      <section id="stack" className="frame row scroll-mt-4">
        <div className="grid border-b border-line md:grid-cols-[1fr_1fr]">
          <div className="p-6 md:p-10">
            <div className="eyebrow mb-3">Plug in your stack</div>
            <h2 className="h-display text-4xl md:text-5xl">Your data could be anywhere.<br /><span className="gradient-text">We bring the AI to it.</span></h2>
          </div>
          <div className="flex items-end border-t border-line p-6 md:border-l md:border-t-0 md:p-10">
            <p className="text-sm leading-6 text-muted">Click the systems you run — Fabric, Dynamics 365, Salesforce, Oracle, ServiceNow, SAP or a SQL database — and see how an AI layer sits on top, plus the agents we have already built for that stack. <Link href="/platforms" className="link text-ink">See all {platforms.length} systems →</Link></p>
          </div>
        </div>
        <StackPlugger
          platforms={platforms.map(({ id, name, category }) => ({ id, name, category }))}
          industries={industries.map(({ id, shortName }) => ({ id, shortName }))}
          projects={projects.map(({ id, slug, title, tagline, industryId, extraIndustryIds, platformIds, maturity }) => ({ id, slug, title, tagline, industryId, extraIndustryIds, platformIds, maturity }))}
        />
      </section>

      {/* FEATURED */}
      <section className="frame row">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line p-6 md:p-10">
          <h2 className="h-display text-4xl md:text-5xl">Featured agents</h2>
          <Link href="/projects" className="btn-ghost">Browse all {projects.length} <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2 md:p-6 lg:grid-cols-3">
          {featured.map((p) => <ProjectCard key={p.id} p={p} industry={industries.find((i) => i.id === p.industryId)} />)}
        </div>
      </section>

      {/* TEMPLATE APPROACH */}
      <section className="frame row grid md:grid-cols-[1fr_2fr]">
        <div className="p-6 md:p-10">
          <h2 className="h-display text-4xl md:text-5xl">Don&apos;t build from scratch.</h2>
          <p className="mt-4 max-w-sm text-sm text-muted">{company.pitchLine} Accelerate AI adoption with proven templates, customisable workflows and intelligent automation — tailored to your business.</p>
        </div>
        <div className="grid border-t border-line md:grid-cols-3 md:border-l md:border-t-0">
          {[
            [Blocks, 'Pick a template', 'Start from an agent we have already shipped for your industry — architecture, prompts, evaluations and all.'],
            [PlugZap, 'Connect your data', 'We wire it to your ERP, CRM, databases and documents where they live. Permissions stay intact.'],
            [Rocket, 'Go live in weeks', 'Customise the workflow, run it with your team and scale it. Weeks, not quarters.'],
          ].map(([I, t, d], k) => {
            const Ico = I as typeof Blocks;
            return (
              <div key={k} className={`p-6 md:p-8 ${k ? 'border-t border-line md:border-l md:border-t-0' : ''}`}>
                <span className="font-display text-xs text-muted">0{k + 1}</span>
                <Ico className="mt-4 h-6 w-6" strokeWidth={1.5} />
                <h3 className="mt-6 font-display text-2xl font-semibold">{t as string}</h3>
                <p className="mt-2 text-sm text-muted">{d as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CERTIFICATIONS */}
      {shownCerts.length > 0 && (
        <section className="frame row overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line p-6 md:p-10">
            <div>
              <div className="eyebrow mb-3">Certified professionals</div>
              <h2 className="h-display text-4xl md:text-5xl">Microsoft-certified across AI, Data & Power Platform</h2>
            </div>
            <Link href="/about#certifications" className="btn-ghost">See certifications <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="relative py-8">
            <div className="flex w-max animate-marquee gap-6 hover:[animation-play-state:paused]">
              {[...shownCerts, ...shownCerts].map((c, i) => (
                <div key={i} className="flex w-56 shrink-0 items-center gap-3 rounded-2xl border border-line bg-card p-3">
                  <CertBadge src={c.badgeUrl} code={c.code} level={c.level} className="h-14 w-14 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-display text-lg font-bold leading-none">{c.code}</div>
                    <div className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted">{c.name.replace('Microsoft Certified: ', '')}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-paper to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-paper to-transparent" />
          </div>
        </section>
      )}

      {/* LATEST */}
      {posts.length > 0 && (
        <section className="frame row">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line p-6 md:p-10">
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
        </section>
      )}

      {/* CTA */}
      <section className="frame row">
        <div className="relative overflow-hidden bg-ink p-8 text-paper md:p-14">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent/40 blur-3xl" />
          <div className="absolute -bottom-32 right-40 h-80 w-80 rounded-full bg-violet/40 blur-3xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <h2 className="h-display text-4xl md:text-6xl">Skip the months of development.<br /><span className="opacity-60">Start with a template.</span></h2>
            <div className="flex gap-2">
              <Link href="/contact" className="btn bg-paper text-ink hover:bg-paper/90">Request a demo <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/projects" className="btn border border-paper/30 text-paper hover:border-paper">Browse agents</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function splitTagline(t: string): [string, string] {
  const i = t.indexOf('. ');
  return i > 0 ? [t.slice(0, i + 1), t.slice(i + 2)] : [t, ''];
}
