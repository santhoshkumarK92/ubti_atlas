import Link from 'next/link';
import { getUser } from '@/lib/auth';
import { getCertifications, getCompany, getIndustries, getVisibleProjects } from '@/lib/repo';
import { IndustryRotator } from '@/components/site/IndustryRotator';
import { FeaturedRow } from '@/components/site/FeaturedRow';
import { Agent3D } from '@/components/site/Agent3D';
import { WorldMap } from '@/components/site/WorldMap';
import { StepScene } from '@/components/site/StepScenes';
import { Reveal } from '@/components/site/Reveal';
import { CertBadge } from '@/components/ui/CertBadge';

const TINTS = ['#bdd5e5', '#b4d4ce', '#fae6a1', '#f4c9c4'];
const WORDS = ['One', 'Two', 'Three', 'Four'];

const STEPS = [
  { t: 'Ingest', d: 'Connect databases, ERP, CRM, SaaS and files where they live — mirroring, shortcuts or APIs. No big-bang migration.' },
  { t: 'Unify', d: 'A governed semantic layer in Microsoft Fabric so every agent speaks your business language.' },
  { t: 'Analyze', d: 'Azure AI Foundry and Copilot Studio agents answer questions, spot anomalies and generate reports instantly.' },
  { t: 'Act', d: 'Agents create tasks, update records and notify people in Teams, email and your line-of-business apps.' },
];

export default async function Home() {
  const signedIn = !!(await getUser());
  const [company, industries, projects, certs] = await Promise.all([
    getCompany(), getIndustries(), getVisibleProjects(signedIn), getCertifications(),
  ]);
  const countFor = (id: string) => projects.filter((p) => p.industryId === id || p.extraIndustryIds.includes(id)).length;
  const featured = (projects.filter((p) => p.featured).length ? projects.filter((p) => p.featured) : projects).slice(0, 8);
  const shownCerts = certs.filter((c) => c.show);
  const [headA, headB] = splitTagline(company.tagline);

  return (
    <div className="relative">
      <span aria-hidden className="rail-glow" />
      {/* HERO — one full-width teal background; copy on the left, 3D agent on the right */}
      <section className="relative isolate overflow-hidden border-b border-ink bg-[#026f6f]">
        <i aria-hidden className="rail-seg" style={{ ["--c" as string]: "#f6c835" }} />
        <div className="rail-pad grid items-center gap-8 lg:grid-cols-[1.7fr_1fr]">
          <div className="py-20 lg:py-28">
            <div className="max-w-[640px]">
              <h1 className="animate-fade-up text-[clamp(2.6rem,5.4vw,6.4rem)] font-extrabold leading-[0.92] tracking-[-0.058em] text-[#fefffa]" style={{ textWrap: 'balance' }}>
                {headA}
                {headB && <><br /><mark className="bg-transparent text-[#b4d4ce]">{headB}</mark></>}
              </h1>
              <p style={{ animationDelay: '150ms' }} className="mt-8 max-w-[28ch] animate-fade-up font-serif text-[clamp(1.25rem,1.8vw,1.65rem)] leading-[1.32] text-[#fefffa]">UBTI AI Atlas is the AI work platform for your industry.</p>
              <p style={{ animationDelay: '300ms' }} className="mt-4 max-w-[46ch] animate-fade-up text-[17px] leading-[1.6] text-[#fefffa]/90">{company.subTagline}</p>
              <div style={{ animationDelay: '450ms' }} className="mt-9 flex animate-fade-up flex-wrap items-center gap-4">
                <Link href="/contact" className="inline-flex min-h-[52px] items-center border-2 border-[#f6c835] bg-[#f6c835] px-7 text-[15px] font-bold text-[#0c0f14] transition hover:border-[#fefffa] hover:bg-[#fefffa]">Request a demo</Link>
                <Link href="/industries" className="inline-flex min-h-[52px] items-center border-2 border-[#0c0f14] bg-[#fefffa] px-7 text-[15px] font-bold text-[#0c0f14] transition hover:bg-[#f6c835]">Explore Atlas</Link>
              </div>
            </div>
          </div>
          <div className="relative mx-auto h-[420px] w-full max-w-md lg:h-[620px] lg:max-w-none">
            <Agent3D className="absolute inset-0" />
          </div>
        </div>
        {/* corner shapes */}
        <i aria-hidden className="absolute bottom-0 left-[var(--rail)] z-10 hidden h-14 w-14 bg-[#337cb7] md:block" />
        <i aria-hidden className="absolute bottom-0 left-[calc(var(--rail)+3.5rem)] z-10 hidden h-14 w-28 rounded-t-full bg-[#dc3f4a] mix-blend-multiply md:block" />
        <i aria-hidden className="absolute right-0 top-0 z-10 h-[clamp(90px,11vw,190px)] w-[clamp(90px,11vw,190px)] rounded-bl-full bg-[#f6c835]" />
      </section>

      <WorldMap />

      {/* CERT MARQUEE */}
      {shownCerts.length > 0 && (
        <section className="relative overflow-hidden border-b border-ink bg-[#f8f6f2] dark:bg-card">
        <i aria-hidden className="rail-seg" style={{ ["--c" as string]: "#dc3f4a" }} />
          <div className="ml-[var(--rail)] overflow-hidden"><div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
            {[...shownCerts, ...shownCerts].map((c, i) => (
              <div key={i} className="flex h-[104px] w-[260px] shrink-0 items-center gap-3 border-r border-line px-5">
                <CertBadge src={c.badgeUrl} code={c.code} level={c.level} className="h-12 w-12 shrink-0" />
                <div className="min-w-0">
                  <div className="font-display text-lg font-bold leading-none">{c.code}</div>
                  <div className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted">{c.name.replace('Microsoft Certified: ', '')}</div>
                </div>
              </div>
            ))}
          </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="relative border-b border-ink">
        <i aria-hidden className="rail-seg" style={{ ["--c" as string]: "#1b8a80" }} />
        <div className="rail-pad py-16 md:py-24">
          <Reveal as="p" className="mb-4 text-[12px] font-bold uppercase tracking-[0.18em] text-accent">How Atlas works</Reveal>
          <Reveal as="h2" delay={80} className="mb-12 max-w-4xl text-[clamp(2.4rem,5vw,5rem)] font-extrabold leading-[0.95] tracking-[-0.05em]">AI to <mark className="bg-transparent text-accent">Ingest, Unify, Analyze</mark> and Act.</Reveal>
          <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.t} delay={i * 110} className="flex flex-col border border-line bg-[#f8f6f2] dark:bg-card">
                <div className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#0c0f14]" style={{ background: TINTS[i] }}>Step {WORDS[i]}</div>
                <div className="px-5 pb-6 pt-5">
                  <h3 className="text-[clamp(1.9rem,2.6vw,2.6rem)] font-extrabold leading-none tracking-[-0.05em]">{s.t}.</h3>
                  <p className="mt-4 max-w-[34ch] text-[14px] leading-6 text-muted">{s.d}</p>
                </div>
                <div className="mt-auto"><StepScene step={i as 0 | 1 | 2 | 3} /></div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="relative border-b border-ink bg-[#f8f6f2] dark:bg-card">
        <i aria-hidden className="rail-seg" style={{ ["--c" as string]: "#f6c835" }} />
        <div className="rail-pad py-16 md:py-24">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <Reveal as="p" className="mb-4 text-[12px] font-bold uppercase tracking-[0.18em] text-accent">Industries</Reveal>
              <Reveal as="h2" delay={80} className="text-[clamp(2.4rem,5vw,5rem)] font-extrabold leading-[0.95] tracking-[-0.05em]">Built for <mark className="bg-transparent text-accent">every industry.</mark></Reveal>
            </div>
            <p className="max-w-md text-[15px] leading-6 text-muted">Pre-built, industry-specific AI agents designed around real business needs. Pick a domain to see what we have already delivered.</p>
          </div>
          <Reveal delay={120}><IndustryRotator items={industries.map((i) => ({ industry: i, count: countFor(i.id) }))} /></Reveal>
        </div>
      </section>


      {/* FEATURED */}
      <section className="relative border-b border-ink bg-[#f8f6f2] dark:bg-card">
        <i aria-hidden className="rail-seg" style={{ ["--c" as string]: "#337cb7" }} />
        <div className="rail-pad py-16 md:py-24">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <Reveal as="p" className="mb-4 text-[12px] font-bold uppercase tracking-[0.18em] text-accent">AI agents</Reveal>
              <Reveal as="h2" delay={80} className="text-[clamp(2.4rem,5vw,5rem)] font-extrabold leading-[0.95] tracking-[-0.05em]">Featured agents</Reveal>
            </div>
            <Link href="/projects" className="btn-ghost">Browse all {projects.length} →</Link>
          </div>
          <div className="border-t border-ink">
            {featured.map((p, k) => (
              <Reveal key={p.id} delay={(k % 3) * 80}>
                <FeaturedRow p={p} index={k} industry={industries.find((i) => i.id === p.industryId)} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function splitTagline(t: string): [string, string] {
  const i = t.indexOf('. ');
  return i > 0 ? [t.slice(0, i + 1), t.slice(i + 2)] : [t, ''];
}
