import Link from 'next/link';
import { Bot, Layers, LayoutTemplate, Plug, ShieldCheck, Zap } from 'lucide-react';
import { Reveal } from './Reveal';
import { CountUp, RoiCalc } from './RoiCalc';

const CAPS = [
  { I: Plug, t: 'Connect where data lives', d: 'Databases, ERP, CRM, SaaS and files: by mirroring, shortcuts or APIs. No big-bang migration.', c: '#337cb7' },
  { I: Layers, t: 'One governed data layer', d: 'A semantic layer in Microsoft Fabric, so every agent speaks your business language.', c: '#22479b' },
  { I: Bot, t: 'Agents that answer & analyse', d: 'Azure AI Foundry and Copilot Studio agents answer questions, spot anomalies and write reports.', c: '#3f7fe0' },
  { I: Zap, t: 'They take action too', d: 'Create tasks, update records and notify people in Teams, email and your line-of-business apps.', c: '#f6c835' },
  { I: ShieldCheck, t: 'Secure by design', d: 'Role-based access, with the AI brought to your data where it already lives.', c: '#132f6e' },
  { I: LayoutTemplate, t: 'Pre-built for your industry', d: 'Start from a ready-to-deploy agent instead of building from scratch, and adapt it to your systems.', c: '#dc3f4a' },
];

export interface RoiFacts { agents: number; industries: number; weeks?: number; reuse?: number }
export interface RoiResult { value: string; label: string; project: string }

/** Return on investment + capabilities: live numbers from the catalogue, an estimator, and what the platform does. */
export function RoiSection({ facts, results }: { facts: RoiFacts; results: RoiResult[] }) {
  const stats: { v: string; l: string }[] = [
    { v: String(facts.agents), l: 'AI agents ready to deploy' },
    { v: String(facts.industries), l: 'industries covered' },
    ...(facts.weeks ? [{ v: String(facts.weeks), l: 'weeks, typical deployment' }] : []),
    ...(facts.reuse ? [{ v: `${facts.reuse}%`, l: 'average reuse for a new client' }] : []),
  ];
  return (
    <section className="relative isolate overflow-hidden border-b border-ink bg-white">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_100%_0%,#e6eefb,transparent_70%),radial-gradient(60%_50%_at_0%_100%,#e6eefb,transparent_70%)]" />
      <div className="rail-pad py-16 md:py-24">
        <Reveal as="p" className="mb-4 text-[12px] font-bold uppercase tracking-[0.18em] text-accent">Return on investment</Reveal>
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <Reveal as="h2" pop delay={80} className="max-w-3xl text-[clamp(1.9rem,3.4vw,3.2rem)] font-extrabold leading-[0.95] tracking-[-0.05em]">
            Built to deliver <mark className="bg-transparent text-accent">measurable returns.</mark>
          </Reveal>
          <p className="max-w-md text-[15px] leading-6 text-muted">Start from a proven agent, connect it to the systems you already run, and see the hours come back.</p>
        </div>

        {/* live numbers from the catalogue */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.l} delay={i * 80} className="h-full">
              <div className="h-full rounded-2xl border border-[#d0dcf0] bg-white p-5 shadow-[0_10px_34px_rgba(19,47,110,.06)]">
                <CountUp value={s.v} className="block text-[clamp(2rem,3.4vw,3rem)] font-extrabold leading-none tracking-[-0.05em] text-[#22479b]" />
                <div className="mt-2 text-[13px] leading-5 text-muted">{s.l}</div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* measured results from real projects, then the capabilities */}
          <div className="grid content-start gap-6">
            {results.length > 0 && (
              <Reveal>
                <div className="rounded-3xl border border-[#d0dcf0] bg-[#f4f7fc] p-6 md:p-8">
                  <div className="mb-5 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">Results from our agents</div>
                  <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
                    {results.map((r, i) => (
                      <div key={i} className="border-l-4 pl-4" style={{ borderColor: ['#337cb7', '#f6c835', '#22479b', '#dc3f4a'][i % 4] }}>
                        <CountUp value={r.value} className="block text-[clamp(1.9rem,3vw,2.7rem)] font-extrabold leading-none tracking-[-0.05em] text-[#0a1b45]" />
                        <div className="mt-2 text-[14px] font-semibold leading-5">{r.label}</div>
                        <div className="mt-0.5 text-[12px] text-muted">{r.project}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {CAPS.slice(0, 4).map(({ I, t, d, c }, i) => <Cap key={t} I={I} t={t} d={d} c={c} i={i} />)}
            </div>
          </div>

          {/* estimator on a navy stage */}
          <Reveal delay={120} className="h-full">
            <div className="navy-zone relative isolate flex h-full flex-col justify-center overflow-hidden rounded-[2rem] p-3 md:p-5">
              <span aria-hidden className="orb orb-b -right-10 top-0 h-[300px] w-[300px] bg-[#3f7fe0]/60" />
              <span aria-hidden className="orb orb-c -left-10 bottom-0 h-[260px] w-[260px] bg-[#dc3f4a]/40" />
              <div className="relative"><RoiCalc /></div>
              <div className="relative mt-4 px-2 pb-1 text-center">
                <Link href="/contact" className="glass-btn inline-flex min-h-[46px] items-center rounded-full px-6 text-[14px] font-bold transition">Get this sized for your team →</Link>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {CAPS.slice(4).map(({ I, t, d, c }, i) => <Cap key={t} I={I} t={t} d={d} c={c} i={i + 4} />)}
        </div>
      </div>
    </section>
  );
}

function Cap({ I, t, d, c, i }: { I: React.ComponentType<{ className?: string }>; t: string; d: string; c: string; i: number }) {
  return (
    <Reveal delay={(i % 4) * 80} className="h-full">
      <div className="group relative h-full overflow-hidden rounded-2xl border border-[#d0dcf0] bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-[#22479b]/40 hover:shadow-[0_18px_40px_rgba(19,47,110,.14)]">
        <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: c }} />
        <span className="grid h-11 w-11 place-items-center rounded-xl text-white transition duration-300 group-hover:scale-110 group-hover:rotate-3" style={{ background: c, color: c === '#f6c835' ? '#0a1b45' : '#fff' }}>
          <I className="h-5 w-5" />
        </span>
        <h3 className="mt-4 text-[1.05rem] font-extrabold leading-tight tracking-[-0.02em]">{t}</h3>
        <p className="mt-1.5 text-[13.5px] leading-6 text-muted">{d}</p>
      </div>
    </Reveal>
  );
}
