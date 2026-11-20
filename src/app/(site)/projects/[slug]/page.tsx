import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Download, PencilLine, Radio } from 'lucide-react';
import { can, getUser } from '@/lib/auth';
import { getIndustries, getPlatforms, getProjectBySlug, getVisibleProjects } from '@/lib/repo';
import { MATURITY } from '@/lib/types';
import { ProjectDetailV2 } from '@/components/site/ProjectDetailV2';
import { ProjectCard } from '@/components/site/ProjectCard';
import { IndustryCover } from '@/components/site/IndustryCover';
import { LeadForm } from '@/components/site/LeadForm';
import { Img } from '@/components/ui/Img';
import { Reveal } from '@/components/site/Reveal';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProjectBySlug(slug, true);
  return { title: p?.title ?? 'Project', description: p?.tagline };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getUser();
  const p = await getProjectBySlug(slug, !!user);
  if (!p) notFound();
  const [industries, platforms, all] = await Promise.all([getIndustries(), getPlatforms(), getVisibleProjects(!!user)]);
  const industry = industries.find((i) => i.id === p.industryId);
  const related = all.filter((x) => x.id !== p.id && (x.industryId === p.industryId || x.extraIndustryIds.includes(p.industryId))).slice(0, 3);
  const client = user ? p.clientName || p.clientDisplay : p.clientDisplay;
  const facts: [string, string][] = [
    ['Client', client || '—'],
    ['Maturity', MATURITY[p.maturity]],
    ...(p.weeksToDeploy ? [['Typical deployment', `${p.weeksToDeploy} weeks`] as [string, string]] : []),
    ...(typeof p.reuseScore === 'number' ? [['Reuse for a new client', `${p.reuseScore}%`] as [string, string]] : []),
    ...(p.region ? [['Region', p.region] as [string, string]] : []),
  ];

  return (
    <>
      {p.status !== 'published' && (
        <div className="relative z-10 bg-[#f6c835] px-6 py-2 text-center text-sm font-semibold text-[#0c0f14]">Preview — this project is <b>{p.status}</b> and only visible to signed-in staff.</div>
      )}

      {/* HERO — navy stage with glass panels, matching the home page */}
      <section data-zone="dark" className="relative isolate -mt-[72px] overflow-hidden border-b border-ink pt-[72px] text-[#fefffa]">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_15%_0%,#22479b_0%,#132f6e_45%,#0a1b45_100%)]" />
        <span aria-hidden className="orb orb-a -left-24 top-24 h-[340px] w-[340px] bg-[#f6c835]/55" />
        <span aria-hidden className="orb orb-b right-[6%] top-[22%] h-[400px] w-[400px] bg-[#3f7fe0]/70" />
        <span aria-hidden className="orb orb-c bottom-[-90px] left-[38%] h-[320px] w-[320px] bg-[#dc3f4a]/50" />
        <div className="relative mx-auto max-w-frame px-4 pb-14 pt-10 md:px-8 md:pb-20 md:pt-14">
          <Link
            href={industry ? `/industries/${industry.slug}` : '/projects'}
            aria-label={`Back to ${industry?.name ?? 'all agents'}`}
            className="glass-btn inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition"
          >
            <ArrowLeft className="h-4 w-4" /> {industry?.shortName ?? 'All agents'}
          </Link>

          <div className="mt-8 grid items-stretch gap-8 lg:grid-cols-[1.5fr_1fr]">
            <div className="flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-2">
                {industry && <span className="rounded-full border border-white/35 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em]">{industry.shortName}</span>}
                {p.isSample && <span className="rounded-full border border-white/35 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em]">Sample content</span>}
                {p.visibility !== 'public' && <span className="rounded-full border border-[#f6c835]/70 bg-[#f6c835]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#f6c835]">{p.visibility === 'internal' ? 'Internal only' : 'Client links only'}</span>}
                {p.demoUrl && p.demoStatus?.ok !== false && <span className="inline-flex items-center gap-1 rounded-full border border-white/35 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em]"><Radio className="h-3 w-3 text-[#4ade80]" /> Live demo</span>}
              </div>
              <h1 className="pop-emerge mt-5 text-[clamp(2.2rem,4.8vw,4.4rem)] font-extrabold leading-[0.98] tracking-[-0.05em]">{p.title}</h1>
              <p className="mt-5 max-w-2xl text-[17px] leading-8 text-white/80">{p.tagline}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a href="#request" className="inline-flex min-h-[50px] items-center gap-2 rounded-full bg-white px-7 text-[15px] font-bold text-[#0a1b45] shadow-[0_10px_30px_rgba(0,10,40,.35)] transition hover:bg-[#e6eefb]">Request this agent <ArrowUpRight className="h-4 w-4" /></a>
                {p.demoUrl && p.demoStatus?.ok !== false && (
                  <a href={p.demoUrl} target="_blank" rel="noreferrer" className="glass-btn inline-flex min-h-[50px] items-center gap-2 rounded-full px-6 text-[15px] font-bold transition">View live demo <ArrowUpRight className="h-4 w-4" /></a>
                )}
                {can(user?.role, 'internal.view') && <a href={`/api/export/pptx?project=${p.id}`} className="glass-btn inline-flex min-h-[50px] items-center gap-2 rounded-full px-5 text-[14px] font-semibold transition"><Download className="h-4 w-4" /> PPT</a>}
                {can(user?.role, 'projects.edit') && <Link href={`/admin/projects/${p.id}`} className="glass-btn inline-flex min-h-[50px] items-center gap-2 rounded-full px-5 text-[14px] font-semibold transition"><PencilLine className="h-4 w-4" /> Edit</Link>}
              </div>
            </div>

            <div className="glass rounded-3xl p-4 md:p-5">
              {p.media.thumbnail?.url ? (
                <Img src={p.media.thumbnail.url} alt={p.title} fallbackLabel={p.title} className="aspect-[16/10] rounded-2xl border border-white/25" imgClassName="object-cover" />
              ) : (
                <IndustryCover industry={industry} className="aspect-[16/10] rounded-2xl border border-white/25" />
              )}
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 px-1 pb-1 text-sm">
                {facts.map(([k, v]) => (
                  <div key={k} className={k === 'Client' ? 'col-span-2' : ''}>
                    <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">{k}</dt>
                    <dd className="mt-0.5 font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {p.metrics.length > 0 && (
            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
              {p.metrics.slice(0, 4).map((m, i) => (
                <div key={i} className="glass rounded-2xl px-5 py-5">
                  <div className="text-[clamp(1.8rem,3vw,2.8rem)] font-extrabold leading-none tracking-[-0.05em]">{m.value}</div>
                  <div className="mt-2 text-[13px] leading-5 text-white/70">{m.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="border-b border-ink bg-[#f4f7fc]">
        <ProjectDetailV2 p={p} platforms={platforms} />
      </div>

      {related.length > 0 && (
        <section className="border-b border-ink bg-white">
          <div className="mx-auto max-w-frame px-4 py-14 md:px-8 md:py-20">
            <h2 className="mb-8 text-[clamp(1.7rem,3vw,2.6rem)] font-extrabold leading-[0.98] tracking-[-0.05em]">More for <mark className="bg-transparent text-accent">{industry?.shortName ?? 'this industry'}.</mark></h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r, k) => (
                <Reveal key={r.id} delay={k * 90} className="h-full"><ProjectCard p={r} industry={industries.find((i) => i.id === r.industryId)} className="h-full" /></Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* REQUEST */}
      <section id="request" data-zone="dark" className="navy-zone relative isolate scroll-mt-4 overflow-hidden">
        <span aria-hidden className="orb orb-b right-[10%] top-[10%] h-[360px] w-[360px] bg-[#3f7fe0]/60" />
        <span aria-hidden className="orb orb-a -left-20 bottom-0 h-[300px] w-[300px] bg-[#f6c835]/40" />
        <div className="relative mx-auto grid max-w-frame gap-8 px-4 py-14 md:px-8 md:py-20 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <p className="mb-4 text-[12px] font-bold uppercase tracking-[0.18em] text-[#a9c8f5]">Get started</p>
            <h2 className="text-[clamp(1.9rem,3.4vw,3.2rem)] font-extrabold leading-[0.98] tracking-[-0.05em]">Want this for <mark className="bg-transparent text-[#a9c8f5]">your business?</mark></h2>
            <p className="mt-4 max-w-md text-[15px] leading-7 text-white/75">Tell us about your systems and we&apos;ll show you how this agent adapts to them.</p>
          </div>
          <div className="glass rounded-3xl p-6 md:p-8">
            <LeadForm source={`project:${p.slug}`} industries={industries} />
          </div>
        </div>
      </section>
    </>
  );
}
