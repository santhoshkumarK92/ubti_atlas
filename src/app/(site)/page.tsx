import Link from 'next/link';
import { Database, Layers, LineChart, Zap } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { getCertifications, getCompany, getIndustries, getVisibleProjects } from '@/lib/repo';
import { IndustryRotator } from '@/components/site/IndustryRotator';
import { FeaturedRow } from '@/components/site/FeaturedRow';
import { Agent3DLazy } from '@/components/site/Agent3DLazy';
import { AgentBubble, Typewriter } from '@/components/site/HeroFx';
import { WorldMap } from '@/components/site/WorldMap';
import { StepsShowcase } from '@/components/site/StepsShowcase';
import { RailBurst } from '@/components/site/RailBurst';
import { Reveal } from '@/components/site/Reveal';
import { CertBadge } from '@/components/ui/CertBadge';

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
      <section data-zone="dark" className="relative isolate -mt-[72px] overflow-hidden border-b border-ink pt-[72px]">
        <RailBurst className="bg-[radial-gradient(120%_90%_at_15%_0%,#22479b_0%,#132f6e_45%,#0a1b45_100%)]" />
        {/* colour orbs behind the glass */}
        <span aria-hidden className="orb orb-a -left-24 top-10 h-[360px] w-[360px] bg-[#f6c835]/70" />
        <span aria-hidden className="orb orb-b right-[8%] top-[30%] h-[420px] w-[420px] bg-[#3f7fe0]/70" />
        <span aria-hidden className="orb orb-c bottom-[-80px] left-[34%] h-[340px] w-[340px] bg-[#dc3f4a]/60" />
        <i aria-hidden className="rail-seg" />
        <div className="rail-pad relative grid items-center gap-8 lg:grid-cols-[1.7fr_1fr]">
          <div className="py-14 lg:-translate-y-10 lg:py-20">
            <div className="glass max-w-[660px] rounded-[28px] p-7 md:p-10">
              <h1 className="text-drop text-[clamp(2.6rem,5.4vw,6.4rem)] font-extrabold leading-[0.92] tracking-[-0.058em] text-[#fefffa]" style={{ textWrap: 'balance' }}>
                <span className="pop-emerge" style={{ animationDelay: '80ms' }}>{headA}</span>
                {headB && <><br /><mark className="pop-emerge bg-transparent text-[#a9c8f5]" style={{ animationDelay: '280ms' }}>{headB}</mark></>}
              </h1>
              <Typewriter delay={900} text="UBTI AI Atlas is the AI work platform for your industry." className="mt-8 max-w-[28ch] font-serif text-[clamp(1.25rem,1.8vw,1.65rem)] leading-[1.32] text-[#fefffa]" />
              <div style={{ animationDelay: '300ms' }} className="mt-8 flex animate-fade-up flex-wrap items-center gap-4">
                <Link href="/contact" className="glass-btn inline-flex min-h-[52px] items-center rounded-full px-7 text-[15px] font-bold transition">Request a demo</Link>
                <Link href="/industries" className="glass-btn inline-flex min-h-[52px] items-center rounded-full px-7 text-[15px] font-bold transition">Explore Atlas</Link>
              </div>
            </div>
          </div>
          <div data-hero-stage data-holo="off" className="relative mx-auto h-[420px] w-full max-w-md lg:h-[620px] lg:max-w-none">
            <span aria-hidden className="halo" />
            {[
              { t: 'Ingest', I: Database, c: 'right-2 top-[14%] lg:right-0', d: 2.3 },
              { t: 'Unify', I: Layers, c: 'right-0 top-[42%] lg:-right-2', d: 2.5 },
              { t: 'Analyze', I: LineChart, c: 'left-2 bottom-[24%] lg:left-0', d: 2.7 },
              { t: 'Act', I: Zap, c: 'right-6 bottom-[10%] lg:right-4', d: 2.9 },
            ].map(({ t, I, c, d }, k) => (
              <span key={t} aria-hidden className={`chip-glass absolute z-10 ${c}`} style={{ animationDelay: `${d}s` }}>
                <div className="glass flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[14px] font-bold text-[#fefffa]" style={{ ['--f' as string]: `${k * 0.7}s` }}>
                  <I className="h-4 w-4 text-[#f6c835]" /> {t}
                </div>
              </span>
            ))}
            <span aria-hidden className="land-shadow" />
            <span aria-hidden className="shock" />
            <span aria-hidden className="shock s2" />
            <Agent3DLazy className="agent-drop absolute inset-0" />
            <AgentBubble lines={["Hi, I'm Atlas.", 'I ingest your data, wherever it lives.', 'Ask me anything. I act on it.']} />
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
        <section className="relative isolate overflow-hidden border-b border-ink">
        <RailBurst className="bg-white dark:bg-card" />
        <i aria-hidden className="rail-seg" />
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
      <section className="navy-zone relative isolate border-b border-ink">
        <i aria-hidden className="rail-seg" />
        <div className="rail-pad py-16 md:py-24">
          <Reveal as="p" className="mb-4 text-[12px] font-bold uppercase tracking-[0.18em] text-accent">How Atlas works</Reveal>
          <Reveal as="h2" delay={80} className="mb-12 max-w-4xl text-[clamp(1.9rem,3.4vw,3.2rem)] font-extrabold leading-[0.95] tracking-[-0.05em]">AI to <mark className="bg-transparent text-accent">Ingest, Unify, Analyze</mark> and Act.</Reveal>
          <Reveal delay={100}><StepsShowcase steps={STEPS.map(({ t, d }) => ({ t, d }))} /></Reveal>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="relative isolate border-b border-ink">
        <RailBurst className="bg-white dark:bg-card" />
        <i aria-hidden className="rail-seg" />
        <div className="rail-pad py-16 md:py-24">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <Reveal as="p" className="mb-4 text-[12px] font-bold uppercase tracking-[0.18em] text-accent">Industries</Reveal>
              <Reveal as="h2" delay={80} className="text-[clamp(1.9rem,3.4vw,3.2rem)] font-extrabold leading-[0.95] tracking-[-0.05em]">Built for <mark className="bg-transparent text-accent">every industry.</mark></Reveal>
            </div>
            <p className="max-w-md text-[15px] leading-6 text-muted">Pre-built, industry-specific AI agents designed around real business needs. Pick a domain to see what we have already delivered.</p>
          </div>
          <Reveal delay={120}><IndustryRotator items={industries.map((i) => ({ industry: i, count: countFor(i.id) }))} /></Reveal>
        </div>
      </section>


      {/* FEATURED */}
      <section className="relative isolate border-b border-ink">
        <RailBurst className="bg-[#e6eefb] dark:bg-card" />
        <div className="rail-pad relative py-16 md:py-24">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <Reveal as="p" className="mb-4 text-[12px] font-bold uppercase tracking-[0.18em] text-accent">AI agents</Reveal>
              <Reveal as="h2" delay={80} className="text-[clamp(1.9rem,3.4vw,3.2rem)] font-extrabold leading-[0.95] tracking-[-0.05em]">Featured <mark className="bg-transparent text-accent">agents.</mark></Reveal>
            </div>
            <Link href="/projects" className="inline-flex min-h-[48px] items-center rounded-full border border-[#0a1b45] bg-[#0a1b45] px-6 text-[14px] font-bold text-white transition hover:bg-transparent hover:text-[#0a1b45]">Browse all {projects.length} →</Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {featured.map((p, k) => (
              <Reveal key={p.id} delay={(k % 2) * 90} className="h-full">
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
